"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useJobs } from "@/lib/useJobs";
import { ADMIN_BASE_PATH } from "@/lib/admin-config";
import { PageHeader, SectionHeader } from "@/components/claimr/page-header";
import { StatePill } from "@/components/primitives/state-pill";
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  Loader2,
} from "lucide-react";

interface ReasoningEntry {
  jobId: number;
  verified: boolean;
  reasoning: string;
  txHash?: string;
  timestamp: number;
}

export default function AdminVerifierPage() {
  const { jobs, isLoading } = useJobs();
  const [reasoning, setReasoning] = useState<ReasoningEntry[]>([]);
  const [reasoningLoading, setReasoningLoading] = useState(true);

  // Poll for verifier activity every 8 seconds. AI verifier decisions
  // land in the in-memory log on Vercel; this gives a near-live feel.
  useEffect(() => {
    let cancelled = false;
    const fetchLog = async () => {
      try {
        const res = await fetch("/api/admin/activity", { cache: "no-store" });
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          setReasoning(data.entries ?? []);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setReasoningLoading(false);
      }
    };
    fetchLog();
    const i = setInterval(fetchLog, 8000);
    return () => {
      cancelled = true;
      clearInterval(i);
    };
  }, []);

  const queue = useMemo(
    () =>
      jobs
        .filter((j) => j.status === 2) // Submitted, waiting on verifier
        .sort((a, b) => b.id - a.id),
    [jobs]
  );

  const approved = reasoning.filter((r) => r.verified).length;
  const rejected = reasoning.filter((r) => !r.verified).length;

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Claimr management"
        title="AI verifier"
        subtitle="Submissions waiting for review and recent decisions."
      />

      {/* Stats */}
      <section>
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat
            icon={<Clock className="h-5 w-5" />}
            color="#F59E0B"
            label="In queue"
            value={queue.length}
          />
          <Stat
            icon={<CheckCircle2 className="h-5 w-5" />}
            color="#10B981"
            label="Approved (session)"
            value={approved}
          />
          <Stat
            icon={<XCircle className="h-5 w-5" />}
            color="#EF4444"
            label="Rejected (session)"
            value={rejected}
          />
        </div>
      </section>

      {/* Queue */}
      <section>
        <SectionHeader
          title="Pending review"
          subtitle="Jobs in Submitted state. AI verifier or admin can decide."
        />
        {isLoading ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
            Loading...
          </div>
        ) : queue.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-muted-foreground">
            Nothing waiting. Verifier queue is empty.
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm overflow-hidden">
            {queue.map((job) => (
              <Link
                key={job.id}
                href={`${ADMIN_BASE_PATH}/jobs/${job.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors border-b border-white/5 last:border-0"
              >
                <span className="text-xs font-mono text-muted-foreground w-10">
                  #{job.id}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {job.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {job.criteria}
                  </p>
                </div>
                <span className="text-sm font-mono text-foreground shrink-0 tabular-nums">
                  {job.amount} USDC
                </span>
                <StatePill state={job.status} size="sm" />
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Recent decisions */}
      <section>
        <SectionHeader
          title="Recent verifier decisions"
          subtitle="In-memory log, resets on Lambda cold start"
        />
        {reasoningLoading ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-muted-foreground">
            Loading...
          </div>
        ) : reasoning.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-muted-foreground">
            No verifier decisions yet this session.
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm overflow-hidden">
            {reasoning.slice(0, 12).map((entry) => (
              <Link
                key={`${entry.jobId}-${entry.timestamp}`}
                href={`${ADMIN_BASE_PATH}/jobs/${entry.jobId}`}
                className="flex items-start gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors border-b border-white/5 last:border-0"
              >
                <span className="mt-0.5 shrink-0">
                  {entry.verified ? (
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-400" />
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-foreground font-medium">
                      Job #{entry.jobId}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {entry.verified ? "approved" : "rejected"}
                    </span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {entry.reasoning}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground mt-0.5" />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({
  icon,
  color,
  label,
  value,
}: {
  icon: React.ReactNode;
  color: string;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <span style={{ color }}>{icon}</span>
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <p className="mt-3 text-3xl font-bold text-foreground tabular-nums">
        {value}
      </p>
    </div>
  );
}
