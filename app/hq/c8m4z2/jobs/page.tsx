"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { useJobs } from "@/lib/useJobs";
import { ADMIN_BASE_PATH } from "@/lib/admin-config";
import { PageHeader } from "@/components/claimr/page-header";
import { StatePill } from "@/components/primitives/state-pill";
import { Search, ChevronRight, Briefcase } from "lucide-react";

const FILTERS = [
  { key: "all", label: "All", matches: () => true },
  { key: "open", label: "Open", matches: (s: number) => s === 0 },
  { key: "claimed", label: "Claimed", matches: (s: number) => s === 1 },
  { key: "review", label: "Under review", matches: (s: number) => s === 2 },
  { key: "paid", label: "Paid", matches: (s: number) => s === 3 },
  { key: "failed", label: "Failed", matches: (s: number) => s === 5 },
];

const ZERO = "0x0000000000000000000000000000000000000000";

export default function AdminJobsPage() {
  const { jobs, isLoading } = useJobs();
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const f = FILTERS.find((x) => x.key === filter) || FILTERS[0];
    let out = jobs.filter((j) => f.matches(j.status));
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      out = out.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.criteria.toLowerCase().includes(q) ||
          j.project.toLowerCase().includes(q) ||
          j.creator.toLowerCase().includes(q) ||
          String(j.id) === q
      );
    }
    return [...out].sort((a, b) => b.id - a.id);
  }, [jobs, filter, query]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Claimr management"
        title="All jobs"
        subtitle="Every job on the platform. Click any row for detail and Phase B actions."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, criteria, address, or job id"
            className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#2D6EFF]/50 focus:ring-2 focus:ring-[#2D6EFF]/20 transition-all"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                filter === f.key
                  ? "bg-[#2D6EFF] text-white"
                  : "bg-white/5 text-muted-foreground hover:bg-white/10"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-muted-foreground">
          Loading from chain...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-12 text-center">
          <Briefcase className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-foreground font-medium">No jobs match</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Try a different filter or search term.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 text-xs uppercase tracking-wider text-muted-foreground border-b border-white/5">
            <span className="col-span-1">ID</span>
            <span className="col-span-4">Job</span>
            <span className="col-span-2">Project</span>
            <span className="col-span-2">Claimant</span>
            <span className="col-span-1 text-right">USDC</span>
            <span className="col-span-1">Status</span>
            <span className="col-span-1" />
          </div>

          {filtered.map((job) => {
            const unclaimed = job.creator === ZERO;
            return (
              <Link
                key={job.id}
                href={`${ADMIN_BASE_PATH}/jobs/${job.id}`}
                className="block hover:bg-white/[0.02] transition-colors border-b border-white/5 last:border-0"
              >
                <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-4 items-center">
                  <span className="col-span-1 text-xs text-muted-foreground font-mono">
                    #{job.id}
                  </span>
                  <p className="col-span-4 font-medium text-foreground truncate">
                    {job.title}
                  </p>
                  <span className="col-span-2 text-xs text-muted-foreground font-mono">
                    {job.project.slice(0, 6)}...{job.project.slice(-4)}
                  </span>
                  <span className="col-span-2 text-xs text-muted-foreground font-mono">
                    {unclaimed
                      ? "Unclaimed"
                      : `${job.creator.slice(0, 6)}...${job.creator.slice(-4)}`}
                  </span>
                  <span className="col-span-1 text-sm text-foreground text-right tabular-nums">
                    {job.amount}
                  </span>
                  <span className="col-span-1">
                    <StatePill state={job.status} size="sm" />
                  </span>
                  <span className="col-span-1 text-muted-foreground text-right">
                    <ChevronRight className="h-4 w-4 inline" />
                  </span>
                </div>

                <div className="md:hidden p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground">
                          #{job.id}
                        </span>
                        <StatePill state={job.status} size="sm" />
                      </div>
                      <p className="mt-1.5 text-sm font-medium text-foreground truncate">
                        {job.title}
                      </p>
                    </div>
                    <span className="text-sm font-mono shrink-0 tabular-nums">
                      {job.amount}{" "}
                      <span className="text-xs text-muted-foreground">USDC</span>
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground font-mono">
                    <span>P: {job.project.slice(0, 8)}...</span>
                    {!unclaimed && <span>C: {job.creator.slice(0, 8)}...</span>}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
