"use client";

import { Lock, TrendingUp, CheckCircle2, ExternalLink, Loader2 } from "lucide-react";
import { useJobs } from "@/lib/useJobs";
import { CLAIMR_ESCROW_ADDRESS } from "@/lib/contracts";
import { WalletAddressCard } from "@/components/claimr/wallet-address-card";
import { motion, AnimatePresence } from "motion/react";
import { AnimatedNumber } from "@/components/primitives/animated-number";
import { StatePill } from "@/components/primitives/state-pill";
import { EscrowPayoutFlight } from "@/components/claimr/escrow-payout-flight";
import { motionDurations, motionEase } from "@/lib/motion";

export default function EscrowPage() {
  const { jobs, isLoading } = useJobs();

  // Calculate live totals from chain data
  const totalLocked = jobs
    .filter(j => j.status === 0 || j.status === 1) // Open or Claimed
    .reduce((sum, j) => sum + j.amount, 0);

  const pendingRelease = jobs
    .filter(j => j.status === 2) // Submitted
    .reduce((sum, j) => sum + j.amount, 0);

  const totalReleased = jobs
    .filter(j => j.status === 3) // Completed
    .reduce((sum, j) => sum + j.amount, 0);

  // flow-fix: layout cleanup
  return (
    <div className="max-w-6xl mx-auto">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Escrow</h1>
              <p className="mt-2 text-muted-foreground">
                Live data from the Claimr escrow contract on Arc testnet
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-green-400/30 bg-green-400/5 px-3 py-1.5 text-xs text-green-400">
              <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              Live on-chain
            </div>
          </div>

          {/* Wallet address + funding moment */}
          <div className="mb-8">
            <WalletAddressCard />
          </div>

          {/* Stats */}
          <div className="mb-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6">
              <div className="flex items-center gap-2 text-sm text-blue-400">
                <Lock className="h-4 w-4" />
                Currently Locked
              </div>
              <p className="mt-2 text-3xl font-bold text-foreground">
                <AnimatedNumber value={totalLocked} /> <span className="text-base font-normal text-muted-foreground">USDC</span>
              </p>
            </div>

            <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-6">
              <div className="flex items-center gap-2 text-sm text-yellow-400">
                <TrendingUp className="h-4 w-4" />
                Pending Release
              </div>
              <p className="mt-2 text-3xl font-bold text-foreground">
                <AnimatedNumber value={pendingRelease} /> <span className="text-base font-normal text-muted-foreground">USDC</span>
              </p>
            </div>

            <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-6">
              <div className="flex items-center gap-2 text-sm text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                Total Released
              </div>
              <p className="mt-2 text-3xl font-bold text-foreground">
                <AnimatedNumber value={totalReleased} /> <span className="text-base font-normal text-muted-foreground">USDC</span>
              </p>
            </div>
          </div>

          {/* Contract info */}
          <div className="mb-6 rounded-xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Escrow Smart Contract on Arc Testnet</p>
                <p className="font-mono text-sm text-foreground">
                  {CLAIMR_ESCROW_ADDRESS.slice(0, 6)}...{CLAIMR_ESCROW_ADDRESS.slice(-4)}
                </p>
              </div>
              <a
                href={`https://testnet.arcscan.app/address/${CLAIMR_ESCROW_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-[#2D6EFF] hover:text-[#2D6EFF]/80 transition-colors"
              >
                View on Arcscan
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {/* Escrow list */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm overflow-hidden">
            <div className="border-b border-white/10 p-4">
              <h2 className="font-semibold text-foreground">Escrow Activity</h2>
            </div>

            {isLoading ? (
              <div className="p-12 text-center">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">Loading from blockchain...</p>
              </div>
            ) : jobs.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-muted-foreground">No jobs posted yet.</p>
                <p className="mt-1 text-xs text-muted-foreground">Post your first job to see live escrow activity.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                <AnimatePresence initial={false}>
                {jobs.map((job) => {
                  const creatorDisplay = job.creator === "0x0000000000000000000000000000000000000000"
                    ? "Unclaimed"
                    : `${job.creator.slice(0, 6)}...${job.creator.slice(-4)}`;

                  return (
                    <motion.div
                      key={job.id}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: motionDurations.base, ease: motionEase.out }}
                      className="relative flex flex-wrap items-center justify-between gap-4 p-5"
                    >
                      <EscrowPayoutFlight jobId={job.id} status={job.status} amount={job.amount} />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground">{job.title}</h3>
                        <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                          <span>Creator: {creatorDisplay}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-semibold text-foreground">
                          {job.amount} <span className="text-sm text-muted-foreground">USDC</span>
                        </span>
                        <StatePill state={job.status} />
                      </div>
                    </motion.div>
                  );
                })}
                </AnimatePresence>
              </div>
            )}
          </div>
    </div>
  );
}
