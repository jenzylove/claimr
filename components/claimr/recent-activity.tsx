"use client";

import { useJobs } from "@/lib/useJobs";
import { useAuth } from "@/lib/auth";

// Feed of the most recent jobs posted by the logged-in project, showing
// each job's current state as its latest "activity". Without on-chain
// event timestamps we approximate "recent" by job ID descending.
//
// Honest empty state when no jobs yet.

const STATUS_DISPLAY: Record<
  number,
  { verb: string; color: string; bg: string }
> = {
  0: { verb: "Posted", color: "text-blue-400", bg: "bg-blue-400/10" },
  1: { verb: "Claimed", color: "text-blue-400", bg: "bg-blue-400/10" },
  2: { verb: "Submitted", color: "text-yellow-400", bg: "bg-yellow-400/10" },
  3: { verb: "Verified & paid", color: "text-green-400", bg: "bg-green-400/10" },
  4: { verb: "Rejected", color: "text-[#FF2D7A]", bg: "bg-[#FF2D7A]/10" },
  5: { verb: "Cancelled", color: "text-gray-400", bg: "bg-gray-400/10" },
};

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export function RecentActivity() {
  const { user } = useAuth();
  const { jobs, isLoading } = useJobs();

  const address = user?.walletAddress;
  const myJobs = address
    ? jobs.filter((j) => j.project.toLowerCase() === address.toLowerCase())
    : [];

  // Newest first by ID; cap at 6.
  const recent = [...myJobs].sort((a, b) => b.id - a.id).slice(0, 6);

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-foreground">Recent activity</h2>
        {!isLoading && myJobs.length > 6 && (
          <span className="text-xs text-muted-foreground">
            Showing 6 of {myJobs.length}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-lg bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : recent.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm text-muted-foreground">
            No activity yet.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            When jobs are posted, claimed, or completed, they'll show up here.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-white/5">
          {recent.map((job) => {
            const status = STATUS_DISPLAY[job.status];
            const creatorDisplay =
              job.creator === ZERO_ADDRESS
                ? null
                : `${job.creator.slice(0, 6)}...${job.creator.slice(-4)}`;

            return (
              <div
                key={job.id}
                className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${status.color} ${status.bg}`}
                    >
                      {status.verb}
                    </span>
                    {creatorDisplay && (
                      <span className="text-xs text-muted-foreground font-mono">
                        by {creatorDisplay}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-foreground truncate">{job.title}</p>
                </div>
                <span className="text-sm font-mono text-foreground shrink-0">
                  {job.amount}{" "}
                  <span className="text-xs text-muted-foreground">USDC</span>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
