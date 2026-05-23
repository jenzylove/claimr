"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useJobs } from "@/lib/useJobs";
import { CLAIMR_ESCROW_ADDRESS as CLAIMR_ADDRESS } from "@/lib/contracts";
import { useAuth } from "@/lib/auth";
import { useCircleWrite } from "@/lib/useCircleWrite";
import { DashboardSidebar } from "@/components/claimr/dashboard-sidebar";
import { Clock, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";

function getDaysLeft(deadline: number) {
  return Math.max(0, Math.ceil((deadline * 1000 - Date.now()) / (1000 * 60 * 60 * 24)));
}

export default function SubmitWorkPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const address = user?.walletAddress ?? null;
  const { jobs, isLoading } = useJobs();
  const [submission, setSubmission] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ verified: boolean; reason?: string } | null>(null);

  const job = jobs.find((j) => j.id === Number(id));

  const { execute, isPending, isConfirming, isSuccess, isError } = useCircleWrite();

  const triggerVerification = async () => {
    if (!job) return;
    setVerifying(true);
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: job.id }),
      });
      const data = await res.json();
      setVerifyResult(data);
      setTimeout(() => {
        if (data.verified) {
          router.push("/dashboard/my-jobs?verified=true");
        } else {
          router.push(`/dashboard/my-jobs?rejected=${encodeURIComponent(data.reason || "Criteria not met")}`);
        }
      }, 2000);
    } catch (err) {
      console.error("Verifier error:", err);
      router.push("/dashboard/my-jobs");
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    if (isSuccess) {
      triggerVerification();
    }
  }, [isSuccess]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar />
        <main className="ml-64 flex-1 p-8 flex items-center justify-center">
          <p className="text-muted-foreground">Loading job...</p>
        </main>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar />
        <main className="ml-64 flex-1 p-8 flex items-center justify-center">
          <p className="text-muted-foreground">Job not found.</p>
        </main>
      </div>
    );
  }

  const isCreator = job.creator.toLowerCase() === address?.toLowerCase();
  const canSubmit = isCreator && job.status === 1;
  const alreadySubmitted = job.status === 2;
  const daysLeft = getDaysLeft(job.deadline);
  const isSubmitting = isPending || isConfirming || verifying;

  const handleSubmit = () => {
    if (!submission.trim() || !canSubmit) return;
    execute({
      contractAddress: CLAIMR_ADDRESS,
      abiFunctionSignature: "submitWork(uint256,string)",
      abiParameters: [job.id.toString(), submission.trim()],
    }).catch(() => {
      // Error surfaced via isError below.
    });
  };

  const getButtonLabel = () => {
    if (isPending) return "Approve in your wallet...";
    if (isConfirming) return "Submitting on-chain...";
    if (verifying) return "AI Agent Verifying...";
    return "Submit Work for Verification";
  };

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />

      <main className="ml-64 flex-1 p-8">
        <div className="max-w-2xl mx-auto">

          <button
            onClick={() => router.push("/dashboard/my-jobs")}
            className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to My Jobs
          </button>

          {/* Job details */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground font-mono">
                  {job.project.slice(0, 6)}...{job.project.slice(-4)}
                </p>
                <h1 className="text-xl font-bold text-foreground mt-1">{job.title}</h1>
              </div>
              <span className="text-xl font-bold text-green-400">{job.amount} USDC</span>
            </div>

            <div className="rounded-lg bg-white/5 p-4 mb-4">
              <p className="text-sm font-medium text-foreground mb-1">Criteria</p>
              <p className="text-sm text-muted-foreground">{job.criteria}</p>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {daysLeft} days left
            </div>
          </div>

          {/* Verification result */}
          {verifyResult && (
            <div className={`mb-4 rounded-xl border p-4 text-sm ${
              verifyResult.verified
                ? "border-green-500/30 bg-green-500/10 text-green-400"
                : "border-red-500/30 bg-red-500/10 text-red-400"
            }`}>
              {verifyResult.verified
                ? "✅ Verified! Payment is being released to your wallet."
                : `❌ Not verified: ${verifyResult.reason}`}
            </div>
          )}

          {/* Submission form */}
          {alreadySubmitted ? (
            <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-6 text-center">
              <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-3" />
              <h2 className="font-semibold text-foreground mb-1">Work Submitted</h2>
              <p className="text-sm text-muted-foreground">
                Your submission is under review. You'll be paid automatically once verified.
              </p>
              {job.submissionData && (
                <p className="mt-3 text-xs text-muted-foreground font-mono break-all">
                  {job.submissionData}
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="font-semibold text-foreground mb-2">Submit Your Work</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Paste your tweet URL(s) below. Claimr's verification agent will check
                impressions, mentions, and criteria — then release payment automatically
                if criteria are met.
              </p>

              <textarea
                value={submission}
                onChange={(e) => setSubmission(e.target.value)}
                placeholder="https://twitter.com/yourhandle/status/123456789..."
                rows={4}
                className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-[#FF2D7A]/50 resize-none mb-4"
              />

              {isError && (
                <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">
                  Transaction failed. Please try again.
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !submission.trim() || !canSubmit}
                className="w-full rounded-lg bg-[#FF2D7A] py-3 text-sm font-semibold text-white transition-all hover:bg-[#FF2D7A]/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {getButtonLabel()}
              </button>

              {!canSubmit && !alreadySubmitted && (
                <p className="mt-3 text-center text-xs text-red-400">
                  You are not the creator of this job.
                </p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}