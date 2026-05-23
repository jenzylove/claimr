"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { useJobs } from "@/lib/useJobs";
import { useAuth } from "@/lib/auth";
import { StatePill } from "@/components/primitives/state-pill";
import { EmptyState } from "@/components/claimr/empty-state";
import { JobCardSkeleton } from "@/components/claimr/skeleton";
import { motionDurations, motionEase } from "@/lib/motion";
import {
  Search,
  ChevronRight,
  Briefcase,
  Clock,
  Calendar,
} from "lucide-react";

// Single source of truth for filter labels mapped to status indexes.
const FILTERS: { key: string; label: string; matches: (s: number) => boolean }[] = [
  { key: "all", label: "All", matches: () => true },
  { key: "open", label: "Open", matches: (s) => s === 0 },
  { key: "claimed", label: "Claimed", matches: (s) => s === 1 },
  { key: "review", label: "Under review", matches: (s) => s === 2 },
  { key: "paid", label: "Paid", matches: (s) => s === 3 },
];

function getDaysLeft(deadline: number) {
  return Math.max(0, Math.ceil((deadline * 1000 - Date.now()) / (1000 * 60 * 60 * 24)));
}

export function ProjectJobsTable() {
  const { user } = useAuth();
  const address = user?.walletAddress;
  const { jobs, isLoading } = useJobs();

  const [filter, setFilter] = useState<string>("all");
  const [query, setQuery] = useState("");

  const myJobs = useMemo(
    () =>
      address
        ? jobs.filter((j) => j.project.toLowerCase() === address.toLowerCase())
        : [],
    [jobs, address]
  );

  const filtered = useMemo(() => {
    const f = FILTERS.find((x) => x.key === filter) || FILTERS[0];
    let out = myJobs.filter((j) => f.matches(j.status));

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      out = out.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.criteria.toLowerCase().includes(q) ||
          String(j.id) === q
      );
    }

    return [...out].sort((a, b) => b.id - a.id);
  }, [myJobs, filter, query]);

  if (!address) {
    return (
      <EmptyState
        icon={Briefcase}
        title="Connect your wallet"
        description="Sign in with your wallet to see the jobs you've posted."
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Search + filter row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, criteria, or job id"
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

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          <JobCardSkeleton />
          <JobCardSkeleton />
          <JobCardSkeleton />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title={
            myJobs.length === 0
              ? "No jobs posted yet"
              : `No ${
                  FILTERS.find((f) => f.key === filter)?.label.toLowerCase() ?? ""
                } jobs`
          }
          description={
            myJobs.length === 0
              ? "Post your first job and lock USDC in escrow to start finding creators."
              : "Try a different filter, or post a new job."
          }
          action={
            myJobs.length === 0
              ? { label: "Post a job", href: "/project/post" }
              : undefined
          }
        />
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm overflow-hidden">
          {/* Table header (desktop only) */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 text-xs uppercase tracking-wider text-muted-foreground border-b border-white/5">
            <span className="col-span-1">ID</span>
            <span className="col-span-5">Job</span>
            <span className="col-span-2">Claimant</span>
            <span className="col-span-1 text-right">USDC</span>
            <span className="col-span-2">Status</span>
            <span className="col-span-1" />
          </div>

          <AnimatePresence initial={false}>
            {filtered.map((job) => {
              const isUnclaimed =
                job.creator === "0x0000000000000000000000000000000000000000";
              const daysLeft = getDaysLeft(job.deadline);
              return (
                <motion.div
                  key={job.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: motionDurations.base, ease: motionEase.out }}
                >
                  <Link
                    href={`/project/jobs/${job.id}`}
                    className="block hover:bg-white/[0.02] transition-colors border-b border-white/5 last:border-0"
                  >
                    {/* Desktop row */}
                    <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-4 items-center">
                      <span className="col-span-1 text-xs text-muted-foreground font-mono">
                        #{job.id}
                      </span>
                      <div className="col-span-5 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {job.title}
                        </p>
                        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="truncate">{job.criteria}</span>
                        </div>
                      </div>
                      <span className="col-span-2 text-xs text-muted-foreground">
                        {isUnclaimed ? (
                          <span className="text-muted-foreground/70">Unclaimed</span>
                        ) : (
                          <span className="font-mono">
                            {job.creator.slice(0, 6)}...{job.creator.slice(-4)}
                          </span>
                        )}
                      </span>
                      <span className="col-span-1 text-sm text-foreground text-right">
                        {job.amount}
                      </span>
                      <span className="col-span-2">
                        <StatePill state={job.status} size="sm" />
                      </span>
                      <span className="col-span-1 text-muted-foreground text-right">
                        <ChevronRight className="h-4 w-4 inline" />
                      </span>
                    </div>

                    {/* Mobile card */}
                    <div className="md:hidden p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-mono">#{job.id}</span>
                            <StatePill state={job.status} size="sm" />
                          </div>
                          <p className="mt-1.5 font-medium text-foreground truncate">
                            {job.title}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                            {job.criteria}
                          </p>
                        </div>
                        <span className="text-sm text-foreground shrink-0">
                          {job.amount} <span className="text-xs text-muted-foreground">USDC</span>
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                        {!isUnclaimed && (
                          <span className="font-mono">
                            {job.creator.slice(0, 6)}...{job.creator.slice(-4)}
                          </span>
                        )}
                        {daysLeft > 0 && (job.status === 0 || job.status === 1) && (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {daysLeft}d left
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
