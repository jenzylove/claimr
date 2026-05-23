"use client";

// Featured callout on the project dashboard surfacing the AI verifier's
// current activity. Two display modes:
//
//   1. "AI is reviewing" — when one or more jobs are in status 2 (Submitted).
//      Yellow palette, pulse dot, gradient top edge.
//
//   2. "AI approved/rejected X" — when there's a recently decided job
//      (status 3 or 4) AND we have reasoning logged for it via
//      /api/verify/log. Green for approved, pink for rejected.
//
// Renders null when there's nothing to show, so the dashboard stays clean
// on a fresh account with no verifier activity.

import { useState, useEffect } from "react";
import { useJobs } from "@/lib/useJobs";
import { useAuth } from "@/lib/auth";
import { Bot, CheckCircle2, XCircle, Sparkles } from "lucide-react";

interface VerificationLog {
  jobId: number;
  verified: boolean;
  reasoning: string;
  txHash?: string;
  timestamp: number;
}

export function VerifierCard() {
  const { user } = useAuth();
  const { jobs, isLoading } = useJobs();
  const address = user?.walletAddress;

  const myJobs = address
    ? jobs.filter((j) => j.project.toLowerCase() === address.toLowerCase())
    : [];

  // Currently under AI review (Submitted state).
  const underReview = myJobs.filter((j) => j.status === 2);

  // Most recently decided. Status 3 = Verified, 4 = Rejected.
  const decided = myJobs
    .filter((j) => j.status === 3 || j.status === 4)
    .sort((a, b) => b.id - a.id);
  const latestDecided = decided[0];

  const [latestLog, setLatestLog] = useState<VerificationLog | null>(null);

  useEffect(() => {
    if (!latestDecided) {
      setLatestLog(null);
      return;
    }

    let cancelled = false;

    fetch(`/api/verify/log/${latestDecided.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled) setLatestLog(data);
      })
      .catch(() => {
        // Silent fail — the card just won't render the reasoning section.
        // 404 from a cold-started Lambda is the most common case.
      });

    return () => {
      cancelled = true;
    };
  }, [latestDecided?.id]);

  if (isLoading) return null;

  // Priority 1: AI is actively reviewing something.
  if (underReview.length > 0) {
    const job = underReview[0];
    const more = underReview.length - 1;

    return (
      <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/[0.04] p-6 backdrop-blur-sm relative overflow-hidden">
        {/* Gradient top edge */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-400/70 to-transparent" />

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Bot className="h-5 w-5 text-yellow-400" />
              </div>
              <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-yellow-400 animate-pulse ring-2 ring-yellow-400/30" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                AI verifier is reviewing
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                "{job.title}"
                {more > 0 && (
                  <span className="text-muted-foreground/70"> and {more} more</span>
                )}
              </p>
            </div>
          </div>
          <span className="font-mono text-xs text-muted-foreground shrink-0">
            job #{job.id}
          </span>
        </div>
      </div>
    );
  }

  // Priority 2: AI has decided on a job and we have reasoning to show.
  if (latestDecided && latestLog) {
    const verified = latestLog.verified;
    const Icon = verified ? CheckCircle2 : XCircle;
    const colorClass = verified ? "text-green-400" : "text-[#FF2D7A]";
    const bgClass = verified
      ? "bg-green-500/[0.04] border-green-500/20"
      : "bg-[#FF2D7A]/[0.04] border-[#FF2D7A]/20";
    const iconBgClass = verified ? "bg-green-500/10" : "bg-[#FF2D7A]/10";
    const verdict = verified ? "approved" : "rejected";

    return (
      <div className={`rounded-2xl border p-6 backdrop-blur-sm ${bgClass}`}>
        <div className="flex items-start gap-3 mb-3">
          <div
            className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${iconBgClass}`}
          >
            <Icon className={`h-5 w-5 ${colorClass}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3 mb-1.5 flex-wrap">
              <p className="text-sm font-semibold text-foreground">
                AI verifier {verdict} "{latestDecided.title}"
              </p>
              <span className="font-mono text-xs text-muted-foreground">
                job #{latestDecided.id}
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {latestLog.reasoning}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 pt-3 border-t border-white/5 text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3" />
          <span>Verified by Claude · Reasoning logged</span>
          {latestLog.txHash && (
            <a
              href={`https://testnet.arcscan.app/tx/${latestLog.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-[#2D6EFF] hover:text-[#2D6EFF]/80 transition-colors"
            >
              View tx →
            </a>
          )}
        </div>
      </div>
    );
  }

  // Nothing to show.
  return null;
}
