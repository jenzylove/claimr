"use client";

import { useRouter } from "next/navigation";
import { CLAIMR_ESCROW_ADDRESS as CLAIMR_ADDRESS } from "@/lib/contracts";
import { useJobs } from "@/lib/useJobs";
import { filterAndSortOpenJobs } from "@/lib/jobFilters";
import { useAuth } from "@/lib/auth";
import { useCircleWrite } from "@/lib/useCircleWrite";
import { JobCard } from "@/components/claimr/job-card";
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

  // Filter open jobs by search + category.
  const filteredJobs = filterAndSortOpenJobs(jobs, {
    search: searchQuery,
    category: activeFilter,
  });

  // Group identical jobs (same project + title + criteria + amount) as multi-slot.
  // Each group shows once with a "N slots open" badge.
  const grouped = filteredJobs.reduce((acc, job) => {
    const key = `${job.project}-${job.title}-${job.criteria}-${job.amount}`;
    if (!acc[key]) {
      acc[key] = { ...job, slotJobIds: [job.id] };
    } else {
      acc[key].slotJobIds.push(job.id);
    }
    return acc;
  }, {} as Record<string, any>);

  const groupedJobs = Object.values(grouped);
  // Skip the top 2 (Featured shows those).
  const latestJobs = groupedJobs.slice(2);

  useEffect(() => {
    if (isSuccess) {
      setClaimingId(null);
      router.push("/dashboard/my-jobs");
    }
  }, [isSuccess, router]);

  useEffect(() => {
    if (isError) setClaimingId(null);
  }, [isError]);

  const handleClaim = (firstSlotId: number) => {
    if (!authenticated) {
      router.push("/onboarding?role=creator");
      return;
    }
    setClaimingId(firstSlotId);
    execute({
      contractAddress: CLAIMR_ADDRESS,
      abiFunctionSignature: "claimJob(uint256)",
      abiParameters: [firstSlotId.toString()],
    }).catch(() => {
      // Hook surfaces error.
    });
  };

  const isJobLoading = (jobId: number) =>
    claimingId === jobId && (isPending || isConfirming);

  if (isLoading) return null;
  if (latestJobs.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Latest Jobs</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {latestJobs.map((job: any, index: number) => {
          const color = COLORS[index % COLORS.length];
          const slotCount = job.slotJobIds.length;
          const firstSlotId = job.slotJobIds[0];

          return (
            <div
              key={`${job.project}-${job.title}-${job.amount}`}
              className="group rounded-xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm transition-all hover:border-white/20"
            >
              <JobCard
                job={job}
                variant="latest"
                accentColor={color}
                slotCount={slotCount}
                onClaim={() => handleClaim(firstSlotId)}
                isClaiming={isJobLoading(firstSlotId)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}