"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ADMIN_BASE_PATH } from "@/lib/admin-config";
import { PageHeader } from "@/components/claimr/page-header";
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ExternalLink,
  Loader2,
} from "lucide-react";

interface ReasoningEntry {
  jobId: number;
  verified: boolean;
  reasoning: string;
  txHash?: string;
  timestamp: number;
}

export default function AdminActivityPage() {
  const [entries, setEntries] = useState<ReasoningEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchLog = async () => {
      try {
        const res = await fetch("/api/admin/activity", { cache: "no-store" });
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          setEntries(data.entries ?? []);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchLog();
    const i = setInterval(fetchLog, 8000);
    return () => {
      cancelled = true;
      clearInterval(i);
    };
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Claimr management"
        title="Verifier activity"
        subtitle="Every AI verifier decision this Lambda has seen. Polls every 8 seconds."
      />

      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-12 text-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground inline" />
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-12 text-center">
          <Sparkles className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-foreground font-medium">
            No decisions yet this session
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            When the verifier runs on a submission, it'll show up here.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm overflow-hidden">
          {entries.map((entry) => (
            <Link
              key={`${entry.jobId}-${entry.timestamp}`}
              href={`${ADMIN_BASE_PATH}/jobs/${entry.jobId}`}
              className="flex items-start gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors border-b border-white/5 last:border-0"
            >
              <span className="mt-0.5 shrink-0">
                {entry.verified ? (
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-400" />
                )}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-foreground font-medium">
                    Job #{entry.jobId}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      entry.verified
                        ? "bg-green-500/10 text-green-400"
                        : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {entry.verified ? "Approved" : "Rejected"}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  {entry.reasoning}
                </p>
                {entry.txHash && (
                  <a
                    href={`https://testnet.arcscan.app/tx/${entry.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-xs text-[#2D6EFF] hover:underline font-mono mt-2"
                  >
                    {entry.txHash.slice(0, 10)}...{entry.txHash.slice(-8)}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground mt-1" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
