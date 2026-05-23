"use client";

import { useRouter } from "next/navigation";
import { Clock, Diamond } from "lucide-react";
import { CLAIMR_ESCROW_ADDRESS as CLAIMR_ADDRESS } from "@/lib/contracts";
import { useJobs } from "@/lib/useJobs";
import { filterAndSortOpenJobs, hasActiveFilters } from "@/lib/jobFilters";
import { useAuth } from "@/lib/auth";
import { useCircleWrite } from "@/lib/useCircleWrite";
import { isPlatformJob } from "@/lib/admin-jobs";
import { useState, useEffect } from "react";

interface FeaturedJobsProps {
  searchQuery?: string;
  activeFilter?: string;
}

export function FeaturedJobs({ searchQuery = "", activeFilter = "All" }: FeaturedJobsProps = {}) {
  const { authenticated } = useAuth();
  const router = useRouter();
  const [claimingId, setClaimingId] = useState<number | null>(null);
  const { jobs, isLoading } = useJobs();

  const { execute, isPending, isConfirming, isSuccess, isError } = useCircleWrite();

  // Filter open jobs by search + category, sort newest first, take top 2.
  const filteredJobs = filterAndSortOpenJobs(jobs, {
    search: searchQuery,
    category: activeFilter,
  });
  const featuredJobs = filteredJobs.slice(0, 2);
  const isFiltering = hasActiveFilters({ search: searchQuery, category: activeFilter });

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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Featured</h2>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-8 text-center">
          <p className="text-muted-foreground">Loading jobs from chain...</p>
        </div>
      </div>
    );
  }

  if (featuredJobs.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Featured</h2>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-8 text-center">
          <p className="text-muted-foreground">
            {isFiltering
              ? "No jobs match your search."
              : "No open jobs yet. Check back soon."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Featured</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {featuredJobs.map((job) => {
          const daysLeft = Math.max(
            0,
            Math.ceil((job.deadline * 1000 - Date.now()) / (1000 * 60 * 60 * 24))
          );

          return (
            <div
              key={job.id}
              className="group relative overflow-hidden rounded-xl p-[1px] backdrop-blur-sm transition-all"
              style={{ background: "linear-gradient(135deg, #FF2D7A, #2D6EFF)" }}
            >
              <div className="relative h-full rounded-xl bg-[#0a0a0a] p-5">
                <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-100/20 to-white/20 px-2 py-1 text-xs font-medium text-amber-100">
                  <Diamond className="h-3 w-3 fill-amber-100/50" />
                  Featured
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF2D7A]/20 to-[#2D6EFF]/20 text-lg font-bold text-white">
                    {job.project.slice(2, 4).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground font-mono">
                      {job.project.slice(0, 6)}...{job.project.slice(-4)}
                    </p>
                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground">
                        {job.title}
                      </h3>
                      {isPlatformJob(job.project) && (
                        <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider rounded-full bg-gradient-to-r from-[#FF2D7A]/15 to-[#2D6EFF]/15 text-[#FF2D7A] border border-[#FF2D7A]/30 font-semibold">
                          Platform
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span>{job.criteria}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {daysLeft} days left
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-lg font-bold text-green-400">
                        {job.amount} USDC
                      </span>
                      <button
                        onClick={() => handleClaim(job.id)}
                        disabled={isJobLoading(job.id)}
                        className="rounded-lg bg-[#FF2D7A] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#FF2D7A]/90 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isJobLoading(job.id) ? "Claiming..." : "Claim Job"}
                      </button>
                    </div>
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