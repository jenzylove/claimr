"use client";

import { useJobs } from "@/lib/useJobs";
import { useRouter } from "next/navigation";
import { Clock, Users } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { motion, AnimatePresence } from "motion/react";
import { StatePill } from "@/components/primitives/state-pill";
import { motionDurations, motionEase } from "@/lib/motion";

function getProgress(status: number) {
  if (status === 0) return 0;
  if (status === 1) return 40;
  if (status === 2) return 100;
  if (status === 3) return 100;
  return 0;
}

function getDaysLeft(deadline: number) {
  return Math.max(0, Math.ceil((deadline * 1000 - Date.now()) / (1000 * 60 * 60 * 24)));
}

export function ProjectJobCards() {
  const { user } = useAuth();
  const address = user?.walletAddress;
  const { jobs, isLoading } = useJobs();
  const router = useRouter();

  const myJobs = jobs
    .filter((j) => j.project.toLowerCase() === address?.toLowerCase())
    .filter((j) => j.status !== 3 && j.status !== 4 && j.status !== 5)
    .slice(0, 3);

  if (isLoading) {
    return (
      <div className="glass-card rounded-xl p-8 text-center">
        <p className="text-muted-foreground">Loading jobs from chain...</p>
      </div>
    );
  }

  if (myJobs.length === 0) {
    return (
      <div className="glass-card rounded-xl p-8 text-center">
        <p className="text-muted-foreground">No active jobs yet. Post your first job to get started.</p>
      </div>
    );
  }

  return (
    <motion.div layout className="space-y-4">
      <AnimatePresence initial={false}>
      {myJobs.map((job) => {
        const progress = getProgress(job.status);
        const daysLeft = getDaysLeft(job.deadline);

        return (
          <motion.div
            key={job.id}
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: motionDurations.base, ease: motionEase.out }}
            className="glass-card rounded-xl p-5 hover:border-white/20"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="text-lg font-semibold text-foreground">{job.title}</h3>
                  <StatePill state={job.status} />
                </div>

                <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="font-semibold text-[#22C55E]">{job.amount} USDC</span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {job.creator === "0x0000000000000000000000000000000000000000"
                      ? "Unclaimed"
                      : "1 creator"}
                  </span>
                  {daysLeft > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {daysLeft} days left
                    </span>
                  )}
                  {daysLeft === 0 && <span className="text-red-400">Expired</span>}
                </div>

                {progress > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                      <span>Criteria Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${progress}%`,
                          backgroundColor: progress === 100 ? "#22C55E" : "#2D6EFF",
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => router.push(`/project/jobs/${job.id}`)}
                className="shrink-0 rounded-lg border border-[#2D6EFF] px-4 py-2 text-sm font-medium text-[#2D6EFF] transition-all hover:bg-[#2D6EFF]/10"
              >
                View Submissions
              </button>
            </div>
          </motion.div>
        );
      })}
      </AnimatePresence>
    </motion.div>
  );
}