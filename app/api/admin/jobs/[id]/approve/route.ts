import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { CLAIMR_ABI, CLAIMR_ESCROW_ADDRESS } from "@/lib/contracts";
import { arcTestnet } from "@/lib/chains";
import { requireAdmin } from "@/lib/admin-auth-server";
import { storeReasoning } from "@/lib/verification-log";

// Manual admin override: approve a submission. Calls verifyWork(jobId)
// on chain using the same VERIFIER_PRIVATE_KEY the AI verifier uses.
// Gated by ADMIN_EMAILS env var on the server.

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const check = await requireAdmin();
  if (!check.ok) {
    return NextResponse.json(
      { error: check.reason ?? "Not authorized" },
      { status: 403 }
    );
  }

  const { id } = await params;
  const jobId = Number(id);
  if (!Number.isFinite(jobId) || jobId < 0) {
    return NextResponse.json({ error: "Invalid job id" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const reasoning =
    typeof body?.reasoning === "string" && body.reasoning.trim()
      ? body.reasoning.trim()
      : `Manual approval by ${check.email}`;

  if (!process.env.VERIFIER_PRIVATE_KEY) {
    return NextResponse.json(
      { error: "VERIFIER_PRIVATE_KEY is not configured in Vercel env vars" },
      { status: 500 }
    );
  }

  try {
    const rawKey = process.env.VERIFIER_PRIVATE_KEY;
    const formattedKey = (rawKey.startsWith("0x")
      ? rawKey
      : `0x${rawKey}`) as `0x${string}`;
    const account = privateKeyToAccount(formattedKey);

    const walletClient = createWalletClient({
      account,
      chain: arcTestnet,
      transport: http(),
    });

    const publicClient = createPublicClient({
      chain: arcTestnet,
      transport: http(),
    });

    // Sanity-check the job is in Submitted (status 2) state.
    const job: any = await publicClient.readContract({
      address: CLAIMR_ESCROW_ADDRESS,
      abi: CLAIMR_ABI,
      functionName: "getJob",
      args: [BigInt(jobId)],
    });
    if (Number(job.status) !== 2) {
      return NextResponse.json(
        {
          error: `Job is in status ${Number(
            job.status
          )}, not Submitted. Manual approve only works on submissions awaiting review.`,
        },
        { status: 400 }
      );
    }

    const txHash = await walletClient.writeContract({
      address: CLAIMR_ESCROW_ADDRESS,
      abi: CLAIMR_ABI,
      functionName: "verifyWork",
      args: [BigInt(jobId)],
    });

    storeReasoning(jobId, true, reasoning, txHash);

    return NextResponse.json({
      ok: true,
      txHash,
      jobId,
    });
  } catch (err: any) {
    console.error("[ADMIN/approve] failed", err);
    return NextResponse.json(
      {
        error: `On-chain approve failed: ${
          err?.shortMessage ?? err?.message ?? "unknown"
        }`,
      },
      { status: 500 }
    );
  }
}
