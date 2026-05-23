"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useJobs } from "@/lib/useJobs";
import { ADMIN_BASE_PATH } from "@/lib/admin-config";
import { CLAIMR_ESCROW_ADDRESS } from "@/lib/contracts";
import { PageHeader } from "@/components/claimr/page-header";
import { StatePill } from "@/components/primitives/state-pill";
import {
  ChevronLeft,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Calendar,
  Lock,
  Sparkles,
} from "lucide-react";

const ZERO = "0x0000000000000000000000000000000000000000";

type ActionState =
  | { kind: "idle" }
  | { kind: "running"; action: "approve" | "reject" }
  | { kind: "success"; action: "approve" | "reject"; txHash?: string }
  | { kind: "error"; message: string };

interface ReasoningEntry {
  jobId: number;
  verified: boolean;
  reasoning: string;
  txHash?: string;
  timestamp: number;
}

export default function AdminJobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = Number(params?.id);
  const { jobs, isLoading } = useJobs();

  const job = useMemo(() => jobs.find((j) => j.id === jobId), [jobs, jobId]);

  const [reasoning, setReasoning] = useState<ReasoningEntry | null>(null);
  const [reasoningLoading, setReasoningLoading] = useState(true);

  const [rejectReason, setRejectReason] = useState("");
  const [action, setAction] = useState<ActionState>({ kind: "idle" });

  // Load any stored verification reasoning for this job.
  useEffect(() => {
    if (!jobId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/verify/log/${jobId}`, {
          cache: "no-store",
        });
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          setReasoning(data ?? null);
        }
      } catch {
        // ignore, reasoning is best-effort
      } finally {
        if (!cancelled) setReasoningLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [jobId, action.kind]);

  const runApprove = async () => {
    if (!job) return;
    setAction({ kind: "running", action: "approve" });
    try {
      const res = await fetch(`/api/admin/jobs/${job.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reasoning: "Manual approval by admin",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error ?? `HTTP ${res.status}`);
      }
      setAction({ kind: "success", action: "approve", txHash: data?.txHash });
    } catch (err: any) {
      setAction({
        kind: "error",
        message: err?.message ?? "Approve failed",
      });
    }
  };

  const runReject = async () => {
    if (!job) return;
    if (!rejectReason.trim() || rejectReason.trim().length < 3) {
      setAction({
        kind: "error",
        message: "Reason is required and must be at least 3 characters.",
      });
      return;
    }
    setAction({ kind: "running", action: "reject" });
    try {
      const res = await fetch(`/api/admin/jobs/${job.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error ?? `HTTP ${res.status}`);
      }
      setAction({ kind: "success", action: "reject", txHash: data?.txHash });
    } catch (err: any) {
      setAction({
        kind: "error",
        message: err?.message ?? "Reject failed",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="text-center text-sm text-muted-foreground py-12">
        Loading job from chain...
      </div>
    );
  }

  if (!job) {
    return (
      <div className="space-y-6">
        <Link
          href={`${ADMIN_BASE_PATH}/jobs`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to jobs
        </Link>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-foreground font-medium">
            Job #{jobId} not found
          </p>
        </div>
      </div>
    );
  }

  const unclaimed = job.creator === ZERO;
  const canActOn = job.status === 2; // Submitted (under review) is when admin can override

  return (
    <div className="space-y-8">
      <Link
        href={`${ADMIN_BASE_PATH}/jobs`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to jobs
      </Link>

      <PageHeader
        eyebrow={`Job #${job.id}`}
        title={job.title}
        subtitle={job.criteria}
      />

      {/* Status + details card */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <StatePill state={job.status} size="md" />
          <a
            href={`https://testnet.arcscan.app/address/${CLAIMR_ESCROW_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-[#2D6EFF] hover:underline"
          >
            Escrow contract
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 text-sm">
          <Detail label="Amount" value={`${job.amount} USDC`} accent="green" />
          <Detail
            label="Project"
            value={`${job.project.slice(0, 10)}...${job.project.slice(-6)}`}
            mono
          />
          <Detail
            label="Claimant"
            value={
              unclaimed
                ? "Unclaimed"
                : `${job.creator.slice(0, 10)}...${job.creator.slice(-6)}`
            }
            mono
          />
          <Detail
            label="Deadline"
            value={new Date(job.deadline * 1000).toLocaleDateString()}
          />
        </div>
      </div>

      {/* AI reasoning, if any */}
      {!reasoningLoading && reasoning && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm space-y-3">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#FF2D7A]" />
            AI verifier decision
          </h3>
          <div className="flex items-center gap-2">
            {reasoning.verified ? (
              <CheckCircle2 className="h-4 w-4 text-green-400" />
            ) : (
              <XCircle className="h-4 w-4 text-red-400" />
            )}
            <span className="text-sm text-foreground">
              {reasoning.verified ? "Approved" : "Rejected"}
            </span>
            <span className="text-xs text-muted-foreground">
              {new Date(reasoning.timestamp).toLocaleString()}
            </span>
          </div>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {reasoning.reasoning}
          </p>
          {reasoning.txHash && (
            <a
              href={`https://testnet.arcscan.app/tx/${reasoning.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-[#2D6EFF] hover:underline font-mono"
            >
              {reasoning.txHash.slice(0, 10)}...{reasoning.txHash.slice(-8)}
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      )}

      {/* Phase B actions */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Lock className="h-4 w-4 text-[#2D6EFF]" />
            Manual override
          </h3>
          <span className="text-xs text-muted-foreground">
            Uses VERIFIER_PRIVATE_KEY
          </span>
        </div>

        {!canActOn ? (
          <p className="text-sm text-muted-foreground">
            Manual approve / reject is only available while the job is under
            verifier review (status 2). This one is currently{" "}
            <StatePill state={job.status} size="sm" />.
          </p>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Use this to override the AI verifier. Approve releases the
              escrowed USDC to the creator. Reject marks the submission as
              failed and the project owner can decide what to do next.
            </p>

            {/* Approve */}
            <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-sm font-medium text-green-300 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    Approve and release escrow
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Calls verifyWork({job.id}). Releases {(job.amount * 0.95).toFixed(2)}{" "}
                    USDC to creator.
                  </p>
                </div>
                <button
                  onClick={runApprove}
                  disabled={action.kind === "running"}
                  className="rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-500/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {action.kind === "running" && action.action === "approve" ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Approving...
                    </span>
                  ) : (
                    "Approve"
                  )}
                </button>
              </div>
            </div>

            {/* Reject */}
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 space-y-3">
              <div>
                <p className="text-sm font-medium text-red-300 flex items-center gap-1.5">
                  <XCircle className="h-4 w-4" />
                  Reject submission
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Calls rejectWork({job.id}). Reason is stored on chain and in
                  the audit log.
                </p>
              </div>
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason for rejection"
                maxLength={140}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20"
              />
              <button
                onClick={runReject}
                disabled={action.kind === "running" || !rejectReason.trim()}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-500/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                {action.kind === "running" && action.action === "reject" ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Rejecting...
                  </span>
                ) : (
                  "Reject"
                )}
              </button>
            </div>
          </div>
        )}

        {/* Action result */}
        {action.kind === "success" && (
          <div className="mt-4 rounded-lg border border-green-500/30 bg-green-500/10 p-3">
            <p className="text-sm text-green-300 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              {action.action === "approve"
                ? "Approved successfully"
                : "Rejected successfully"}
              {action.txHash && (
                <a
                  href={`https://testnet.arcscan.app/tx/${action.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto text-xs font-mono hover:underline inline-flex items-center gap-1"
                >
                  {action.txHash.slice(0, 8)}...{action.txHash.slice(-6)}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </p>
            <button
              onClick={() => router.refresh()}
              className="mt-2 text-xs text-green-300 underline"
            >
              Refresh page to see new state
            </button>
          </div>
        )}
        {action.kind === "error" && (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
            <p className="text-sm text-red-300">{action.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
  mono,
  accent,
}: {
  label: string;
  value: string;
  mono?: boolean;
  accent?: "green";
}) {
  return (
    <div className="flex justify-between gap-3 border-b border-white/5 pb-2 last:border-0 last:pb-0">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span
        className={`text-sm ${mono ? "font-mono" : ""} ${
          accent === "green" ? "text-green-400 font-semibold" : "text-foreground"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
