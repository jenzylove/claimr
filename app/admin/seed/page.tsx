"use client";

// Demo data seeder. Posts 4 predefined jobs to the Claimr escrow contract
// using the logged-in user's Circle wallet. Useful for populating the
// project dashboard with real on-chain data for hackathon demo purposes.
//
// One max-approval call up front (so we don't have to re-approve per job),
// then four sequential postJob calls. Total of 5 PIN entries.

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useCircleWrite } from "@/lib/useCircleWrite";
import { parseUnits } from "viem";
import { USDC_ADDRESS, CLAIMR_ESCROW_ADDRESS } from "@/lib/contracts";
import { Loader2, CheckCircle2, AlertCircle, Zap } from "lucide-react";
import Link from "next/link";

const MAX_UINT256 =
  "115792089237316195423570985008687907853269984665640564039457584007913129639935";
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const SEED_JOBS = [
  {
    title: "Tweet about Claimr's settlement model",
    criteria:
      "Must mention USDC native gas, on-chain escrow, and tag @claimr_xyz. 100+ engagements.",
    amount: 1,
    days: 7,
  },
  {
    title: "Thread on Arc's sub-second finality",
    criteria:
      "5+ tweets, with at least one developer use case and reference to Circle wallets.",
    amount: 2,
    days: 7,
  },
  {
    title: "Short demo video for X",
    criteria:
      "90 seconds max. Show the full claim flow from email signup through payout.",
    amount: 3,
    days: 7,
  },
  {
    title: "Substack feature on autonomous settlement",
    criteria:
      "Long-form, 500+ words. Must cover the AI verifier and on-chain enforcement.",
    amount: 2,
    days: 14,
  },
];

const TOTAL_USDC = SEED_JOBS.reduce((sum, j) => sum + j.amount, 0);
const TOTAL_PINS = 1 + SEED_JOBS.length;

type Step = "idle" | "approving" | "posting" | "done" | "error";

export default function SeedPage() {
  const { authenticated, user } = useAuth();
  const { execute } = useCircleWrite();
  const [step, setStep] = useState<Step>("idle");
  const [currentJob, setCurrentJob] = useState(0);
  const [error, setError] = useState<string | null>(null);

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-sm max-w-md text-center">
          <p className="text-lg font-semibold text-foreground mb-2">Sign in first</p>
          <p className="text-sm text-muted-foreground">
            You need to be authenticated with a Circle wallet to seed demo data.
          </p>
        </div>
      </div>
    );
  }

  const handleSeed = async () => {
    setError(null);

    try {
      // Step 1: Approve max USDC to escrow. Avoids re-approving per job.
      setStep("approving");
      await execute({
        contractAddress: USDC_ADDRESS,
        abiFunctionSignature: "approve(address,uint256)",
        abiParameters: [CLAIMR_ESCROW_ADDRESS, MAX_UINT256],
      });

      // Step 2: Post each job sequentially.
      setStep("posting");
      for (let i = 0; i < SEED_JOBS.length; i++) {
        setCurrentJob(i);
        const job = SEED_JOBS[i];
        const amountWei = parseUnits(job.amount.toString(), 6);
        await execute({
          contractAddress: CLAIMR_ESCROW_ADDRESS,
          abiFunctionSignature:
            "postJob(string,string,uint256,uint256,bool,address)",
          abiParameters: [
            job.title,
            job.criteria,
            amountWei.toString(),
            job.days.toString(),
            false,
            ZERO_ADDRESS,
          ],
        });
      }

      setStep("done");
    } catch (err: any) {
      console.error("[seed] failed:", err);
      setError(err?.message || "Seeding failed unexpectedly");
      setStep("error");
    }
  };

  const reset = () => {
    setStep("idle");
    setError(null);
    setCurrentJob(0);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-2xl w-full">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-sm">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-[#FF2D7A] to-[#2D6EFF] flex items-center justify-center">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">
                Demo data seeder
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Posts {SEED_JOBS.length} test jobs to the Claimr escrow contract using
              your Circle wallet ({user?.walletAddress?.slice(0, 6)}...
              {user?.walletAddress?.slice(-4)}). Useful for populating the project
              dashboard with real on-chain data.
            </p>
          </div>

          {/* What you'll post */}
          <div className="mb-6 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
              What you'll post
            </p>
            <div className="space-y-2.5">
              {SEED_JOBS.map((job, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="text-foreground truncate flex-1">
                    {job.title}
                  </span>
                  <span className="font-mono text-muted-foreground shrink-0">
                    {job.amount} USDC
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">Total escrow</span>
              <span className="font-mono font-medium text-foreground">
                {TOTAL_USDC} USDC
              </span>
            </div>
          </div>

          {/* Requirements */}
          <div className="mb-6 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
            <div className="flex gap-3">
              <AlertCircle className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground space-y-1.5 leading-relaxed">
                <p>
                  You'll enter your PIN{" "}
                  <strong className="text-foreground">{TOTAL_PINS} times</strong>{" "}
                  — once to approve USDC, then once per job.
                </p>
                <p>
                  Your wallet needs at least{" "}
                  <strong className="text-foreground">{TOTAL_USDC} USDC</strong>{" "}
                  plus gas. Each PIN takes about 5 seconds to confirm on Arc.
                </p>
              </div>
            </div>
          </div>

          {/* Action / progress */}
          {step === "idle" && (
            <button
              onClick={handleSeed}
              className="w-full rounded-xl bg-gradient-to-r from-[#FF2D7A] to-[#2D6EFF] px-6 py-3.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            >
              Seed {SEED_JOBS.length} demo jobs
            </button>
          )}

          {step === "approving" && (
            <div className="rounded-xl bg-white/5 border border-white/10 p-6 text-center">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#2D6EFF] mb-3" />
              <p className="text-sm font-medium text-foreground">
                Approving USDC spend...
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Enter PIN to authorize escrow access (1 of {TOTAL_PINS})
              </p>
            </div>
          )}

          {step === "posting" && (
            <div className="rounded-xl bg-white/5 border border-white/10 p-6">
              <div className="flex items-center gap-3 mb-3">
                <Loader2 className="h-5 w-5 animate-spin text-[#2D6EFF] shrink-0" />
                <p className="text-sm font-medium text-foreground">
                  Posting job {currentJob + 1} of {SEED_JOBS.length}
                </p>
              </div>
              <p className="text-sm text-foreground/80 mb-1 pl-8">
                "{SEED_JOBS[currentJob].title}"
              </p>
              <p className="text-xs text-muted-foreground pl-8">
                Enter PIN to confirm ({currentJob + 2} of {TOTAL_PINS})
              </p>
            </div>
          )}

          {step === "done" && (
            <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-6 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-green-400 mb-3" />
              <p className="text-base font-semibold text-foreground mb-1">
                All {SEED_JOBS.length} jobs posted
              </p>
              <p className="text-xs text-muted-foreground mb-5">
                Your dashboard is now populated. Every job is real on-chain data.
              </p>
              <Link
                href="/project"
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#FF2D7A] to-[#2D6EFF] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
              >
                Open project dashboard →
              </Link>
            </div>
          )}

          {step === "error" && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-5">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground mb-1">
                    Seeding failed
                  </p>
                  <p className="text-xs text-muted-foreground mb-3 break-words">
                    {error}
                  </p>
                  <button
                    onClick={reset}
                    className="text-sm text-[#2D6EFF] hover:text-[#2D6EFF]/80 font-medium"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
