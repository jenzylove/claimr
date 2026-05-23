"use client";

import { useRouter } from "next/navigation";
import { Clock } from "lucide-react";
import { CLAIMR_ESCROW_ADDRESS as CLAIMR_ADDRESS } from "@/lib/contracts";
import { useJobs } from "@/lib/useJobs";
import { filterAndSortOpenJobs } from "@/lib/jobFilters";
import { useAuth } from "@/lib/auth";
import { useCircleWrite } from "@/lib/useCircleWrite";
import { isPlatformJob } from "@/lib/admin-jobs";
import { useState, useEffect } from "react";

const COLORS = ["#FF2D7A", "#2D6EFF", "#10B981", "#8B5CF6", "#F59E0B", "#06B6D4"];

interface LatestJobsProps {
  searchQuery?: string;
  activeFilter?: string;
}

export function LatestJobs({ searchQuery = "", activeFilter = "All" }: LatestJobsProps = {}) {
  const { authenticated } = useAuth();
  const router = useRouter();
  const [claimingId, setClaimingId] = useState<number | null>(null);
  const { jobs, isLoading } = useJobs();

  const { execute, isPending, isConfirming, isSuccess, isError } = useCircleWrite();

  // Filter open jobs by search + category, sort newest first, skip the top 2 (those are Featured).
  const filteredJobs = filterAndSortOpenJobs(jobs, {
    search: searchQuery,
    category: activeFilter,
  });
  const latestJobs = filteredJobs.slice(2);

  useEffect(() => {
    if (isSuccess) {
      setClaimingId(null);
      router.push("/dashboard/my-jobs");
    }
  }, [isSuccess, router]);

  useEffect(() => {
    if (isError) setClaimingId(null);
  }, [isError]);

  const handleClaim = (jobId: number) => {
    if (!authenticated) {
      router.push("/onboarding?role=creator");
      return;
    }
    setClaimingId(jobId);
    execute({
      contractAddress: CLAIMR_ADDRESS,
      abiFunctionSignature: "claimJob(uint256)",
      abiParameters: [jobId.toString()],
    }).catch(() => {
      // Hook surfaces error; nothing more to do here.
    });
  };

  const isJobLoading = (jobId: number) =>
    claimingId === jobId && (isPending || isConfirming);

  if (isLoading) return null;

  // Hide entirely if there's nothing beyond the Featured slice. Avoids the
  // confusing "No more open jobs" empty card sitting under a Featured section
  // that's already showing the only jobs that exist.
  if (latestJobs.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Latest Jobs</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {latestJobs.map((job, index) => {
          const color = COLORS[index % COLORS.length];
          const daysLeft = Math.max(
            0,
            Math.ceil((job.deadline * 1000 - Date.now()) / (1000 * 60 * 60 * 24))
          );

          return (
            <div
              key={job.id}
              className="group rounded-xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm transition-all hover:border-white/20"
            >
              <div className="flex items-start gap-4">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-base font-bold"
                  style={{ backgroundColor: `${color}20`, color }}
                >
                  {job.project.slice(2, 4).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground font-mono">
                      {job.project.slice(0, 6)}...{job.project.slice(-4)}
                    </p>
                    <span className="text-base font-bold text-green-400">
                      {job.amount} USDC
                    </span>
                  </div>
                  <h3 className="mt-1 font-medium text-foreground flex items-center gap-2 flex-wrap">
                    {job.title}
                    {isPlatformJob(job.project) && (
                      <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider rounded-full bg-gradient-to-r from-[#FF2D7A]/15 to-[#2D6EFF]/15 text-[#FF2D7A] border border-[#FF2D7A]/30 font-semibold">
                        Platform
                      </span>
                    )}
                  </h3>

                  <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{job.criteria}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {daysLeft}d left
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-end">
                    <button
                      onClick={() => handleClaim(job.id)}
                      disabled={isJobLoading(job.id)}
                      className="rounded-lg bg-[#FF2D7A] px-3 py-1.5 text-sm font-medium text-white transition-all hover:bg-[#FF2D7A]/90 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isJobLoading(job.id) ? "Claiming..." : "Claim Job"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}