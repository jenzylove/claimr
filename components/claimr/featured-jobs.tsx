"use client";

import { useRouter } from "next/navigation";
import { Diamond } from "lucide-react";
import { CLAIMR_ESCROW_ADDRESS as CLAIMR_ADDRESS } from "@/lib/contracts";
import { useJobs } from "@/lib/useJobs";
import { filterAndSortOpenJobs, hasActiveFilters } from "@/lib/jobFilters";
import { useAuth } from "@/lib/auth";
import { useCircleWrite } from "@/lib/useCircleWrite";
import { isPlatformJob } from "@/lib/admin-jobs";
import { JobCard } from "@/components/claimr/job-card";
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

  // Filter open jobs by search + category, then prioritize Platform jobs + highest amount for Featured.
  const filteredJobs = filterAndSortOpenJobs(jobs, {
    search: searchQuery,
    category: activeFilter,
  });
  const featuredJobs = [...filteredJobs]
    .sort((a, b) => {
      const aIsPlatform = isPlatformJob(a.project) ? 1 : 0;
      const bIsPlatform = isPlatformJob(b.project) ? 1 : 0;
      if (aIsPlatform !== bIsPlatform) return bIsPlatform - aIsPlatform;
      return Number(b.amount) - Number(a.amount);
    })
    .slice(0, 2);
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
        {featuredJobs.map((job) => (
          <div
            key={job.id}
            className="group relative overflow-hidden rounded-xl p-[1px] backdrop-blur-sm transition-all"
            style={{ background: "linear-gradient(135deg, #FF2D7A, #2D6EFF)" }}
          >
            <div className="relative h-full rounded-xl bg-[#0a0a0a] p-5">
              <div className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-100/20 to-white/20 px-2 py-1 text-xs font-medium text-amber-100">
                <Diamond className="h-3 w-3 fill-amber-100/50" />
                Featured
              </div>

              <JobCard
                job={job}
                variant="featured"
                accentColor="#FF2D7A"
                onClaim={() => handleClaim(job.id)}
                isClaiming={isJobLoading(job.id)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}