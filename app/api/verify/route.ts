import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import Anthropic from "@anthropic-ai/sdk";
import { CLAIMR_ABI } from "@/lib/contracts";
import { arcTestnet } from "@/lib/chains";

const CLAIMR_ADDRESS = "0x1a0f14f7485664F10bF32A0C94163Ec50a674900";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function fetchTweet(tweetUrl: string) {
  console.log(`[VERIFY] Fetching tweet via oEmbed: ${tweetUrl}`);
  const cleanUrl = tweetUrl.split("?")[0];
  const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(cleanUrl)}&omit_script=true`;

  const response = await fetch(oembedUrl);
  if (!response.ok) {
    console.log(`[VERIFY] oEmbed error: ${response.status}`);
    return null;
  }

  const data = await response.json();
  const html = data.html || "";
  const textMatch = html.match(/<p[^>]*>(.*?)<\/p>/);
  const rawText = textMatch ? textMatch[1] : "";
  const text = rawText.replace(/<[^>]+>/g, " ").replace(/&[^;]+;/g, " ").trim();

  return {
    text,
    author: data.author_name || "",
  };
}

async function verifyWithClaude(tweetText: string, criteria: string, author: string) {
  console.log(`[VERIFY] Asking Claude to verify...`);

  const prompt = `You are an AI verification agent for a Web3 escrow platform. A creator submitted a tweet as proof of completing a paid job. Your task is to decide if the tweet genuinely fulfills the job criteria.

IMPORTANT CONSTRAINT: You can only see the tweet TEXT content. You CANNOT see engagement metrics (impressions, views, likes, retweets, replies). If the criteria mentions impression counts, view counts, like counts, or any engagement numbers, IGNORE those parts and verify only based on content match (topic, mentions, hashtags, message, tone). Do not reject a tweet for lacking impression data — that data is simply not available to you and is not the creator's fault.

JOB CRITERIA:
${criteria}

SUBMITTED TWEET (by @${author}):
"${tweetText}"

Evaluate the tweet against the content-based parts of the criteria. Be reasonable but rigorous — accept tweets that genuinely fulfill the spirit of the criteria, reject tweets that are off-topic, spam, or unrelated to the criteria's subject matter.

Respond ONLY in this exact JSON format with no other text:
{
  "verified": true or false,
  "reasoning": "one sentence explaining your decision based on content match only"
}`;

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 200,
    messages: [{ role: "user", content: prompt }],
  });

  const responseText = message.content[0].type === "text" ? message.content[0].text : "";
  console.log(`[VERIFY] Claude response: ${responseText}`);

  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return { verified: false, reasoning: "AI returned invalid response" };
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return { verified: false, reasoning: "Could not parse AI response" };
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log(`[VERIFY] === New verification request ===`);
    const body = await req.json();
    console.log(`[VERIFY] Request body:`, body);

    const { jobId } = body;

    if (jobId === undefined || jobId === null) {
      return NextResponse.json(
        { verified: false, reason: "Missing jobId" },
        { status: 400 }
      );
    }

    if (!process.env.VERIFIER_PRIVATE_KEY) {
      return NextResponse.json(
        { verified: false, reason: "Verifier wallet not configured" },
        { status: 500 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { verified: false, reason: "AI verifier not configured" },
        { status: 500 }
      );
    }

    // Read job details from contract
    console.log(`[VERIFY] Reading job ${jobId} from contract...`);
    const publicClient = createPublicClient({
      chain: arcTestnet,
      transport: http(),
    });

    const job = (await publicClient.readContract({
      address: CLAIMR_ADDRESS,
      abi: CLAIMR_ABI,
      functionName: "getJob",
      args: [BigInt(jobId)],
    })) as any;

    console.log(`[VERIFY] Job on-chain:`, {
      id: job.id?.toString(),
      title: job.title,
      criteria: job.criteria,
      submissionData: job.submissionData,
      status: job.status,
    });

    const criteria = job.criteria || "";
    const submissionData = job.submissionData || "";

    if (!submissionData) {
      return NextResponse.json(
        { verified: false, reason: "No submission data found on-chain for this job" },
        { status: 400 }
      );
    }

    const urls = submissionData
      .split(/[\n\s]+/)
      .filter((u: string) => u.includes("twitter.com") || u.includes("x.com"));
    console.log(`[VERIFY] Found ${urls.length} URLs:`, urls);

    if (urls.length === 0) {
      return NextResponse.json({
        verified: false,
        reason: "No valid tweet URLs found in submission",
      });
    }

    let allPassed = true;
    const results = [];

    for (const url of urls) {
      const tweet = await fetchTweet(url);
      if (!tweet || !tweet.text) {
        allPassed = false;
        results.push({
          url,
          passed: false,
          reason: "Tweet not found or inaccessible",
        });
        continue;
      }

      const aiVerdict = await verifyWithClaude(tweet.text, criteria, tweet.author);
      results.push({
        url,
        passed: aiVerdict.verified,
        text: tweet.text,
        author: tweet.author,
        reason: aiVerdict.reasoning,
      });

      if (!aiVerdict.verified) allPassed = false;
    }

    console.log(`[VERIFY] All passed: ${allPassed}`);
    console.log(`[VERIFY] Calling contract...`);

    const rawKey = process.env.VERIFIER_PRIVATE_KEY!;
    const formattedKey = (rawKey.startsWith("0x")
      ? rawKey
      : `0x${rawKey}`) as `0x${string}`;

    const account = privateKeyToAccount(formattedKey);

    const walletClient = createWalletClient({
      account,
      chain: arcTestnet,
      transport: http(),
    });

    if (allPassed) {
      const txHash = await walletClient.writeContract({
        address: CLAIMR_ADDRESS,
        abi: CLAIMR_ABI,
        functionName: "verifyWork",
        args: [BigInt(jobId)],
      });
      console.log(`[VERIFY] verifyWork tx: ${txHash}`);
      return NextResponse.json({ verified: true, results, txHash });
    } else {
      const reason = results.find((r) => !r.passed)?.reason || "Criteria not met";
      const txHash = await walletClient.writeContract({
        address: CLAIMR_ADDRESS,
        abi: CLAIMR_ABI,
        functionName: "rejectWork",
        args: [BigInt(jobId), reason],
      });
      console.log(`[VERIFY] rejectWork tx: ${txHash}`);
      return NextResponse.json({ verified: false, reason, results, txHash });
    }
  } catch (err: any) {
    console.error(`[VERIFY] FATAL ERROR:`, err);
    return NextResponse.json(
      {
        verified: false,
        reason: err.message || "Unknown server error",
        error: err.message,
      },
      { status: 500 }
    );
  }
}