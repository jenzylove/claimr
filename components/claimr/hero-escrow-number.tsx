"use client";

import { useJobs } from "@/lib/useJobs";
import { useAuth } from "@/lib/auth";
import { Lock } from "lucide-react";
import { motion } from "motion/react";
import { AnimatedNumber } from "@/components/primitives/animated-number";
import { motionEase } from "@/lib/motion";

// Big gradient-filled hero showing total USDC currently locked in escrow
// across this project's active jobs (Open, Claimed, or Submitted).
// Matches ProjectStats' definition of "escrowed" — funds still held by
// the contract, not yet released to creator or refunded.

export function HeroEscrowNumber() {
  const { user } = useAuth();
  const { jobs, isLoading } = useJobs();

  const address = user?.walletAddress;
  const myJobs = address
    ? jobs.filter((j) => j.project.toLowerCase() === address.toLowerCase())
    : [];

  // Status 0=Open, 1=Claimed, 2=Submitted. All three still have USDC
  // held by the escrow contract. Status 3=Verified means released,
  // 5=Cancelled means refunded.
  const activeJobs = myJobs.filter(
    (j) => j.status === 0 || j.status === 1 || j.status === 2
  );
  const totalLocked = activeJobs.reduce((sum, j) => sum + j.amount, 0);

  return (
    <motion.div
      className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#FF2D7A]/[0.06] to-[#2D6EFF]/[0.06] p-8 backdrop-blur-sm"
      animate={{ scale: [1, 1.006, 1] }}
      transition={{ duration: 3.6, repeat: Infinity, ease: motionEase.inOut }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Lock className="h-4 w-4 text-muted-foreground" />
        <p className="text-xs text-muted-foreground uppercase tracking-wider">
          Total locked in escrow
        </p>
      </div>

      {isLoading ? (
        <div className="h-20 w-64 rounded-lg bg-white/5 animate-pulse" />
      ) : (
        <p className="text-6xl md:text-7xl font-bold tracking-tight leading-none bg-gradient-to-br from-[#FF2D7A] to-[#2D6EFF] bg-clip-text text-transparent">
          <AnimatedNumber value={totalLocked} />
          <span className="text-2xl md:text-3xl ml-3 text-muted-foreground font-medium">
            USDC
          </span>
        </p>
      )}

      <p className="mt-4 text-sm text-muted-foreground">
        {isLoading ? (
          "Reading from Arc Testnet..."
        ) : activeJobs.length === 0 ? (
          "No active jobs yet — post your first to lock USDC in escrow"
        ) : (
          <>
            Across{" "}
            <span className="font-medium text-foreground">{activeJobs.length}</span>{" "}
            active {activeJobs.length === 1 ? "job" : "jobs"} ·{" "}
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              Live on-chain
            </span>
          </>
        )}
      </p>
    </motion.div>
  );
}
