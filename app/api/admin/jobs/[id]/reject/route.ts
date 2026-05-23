import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { CLAIMR_ABI, CLAIMR_ESCROW_ADDRESS } from "@/lib/contracts";
import { arcTestnet } from "@/lib/chains";
import { requireAdmin } from "@/lib/admin-auth-server";
import { storeReasoning } from "@/lib/verification-log";

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
  const reason =
    typeof body?.reason === "string" ? body.reason.trim() : "";
  if (!reason || reason.length < 3) {
    return NextResponse.json(
      { error: "A reason of at least 3 characters is required" },
      { status: 400 }
    );
  }
  if (reason.length > 280) {
    return NextResponse.json(
      { error: "Reason must be 280 characters or fewer" },
      { status: 400 }
    );
  }

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
          )}, not Submitted. Manual reject only works on submissions awaiting review.`,
        },
        { status: 400 }
      );
    }

    const txHash = await walletClient.writeContract({
      address: CLAIMR_ESCROW_ADDRESS,
      abi: CLAIMR_ABI,
      functionName: "rejectWork",
      args: [BigInt(jobId), reason],
    });

    storeReasoning(
      jobId,
      false,
      `Manual reject by ${check.email}: ${reason}`,
      txHash
    );

    return NextResponse.json({
      ok: true,
      txHash,
      jobId,
    });
  } catch (err: any) {
    console.error("[ADMIN/reject] failed", err);
    return NextResponse.json(
      {
        error: `On-chain reject failed: ${
          err?.shortMessage ?? err?.message ?? "unknown"
        }`,
      },
      { status: 500 }
    );
  }
}
