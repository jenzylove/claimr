"use client"

import { useJobs } from "@/lib/useJobs"
import { CheckCircle, Clock } from "lucide-react"
import { useAuth } from "@/lib/auth";

export function PaymentHistory() {
  const { user } = useAuth();
  const address = user?.walletAddress;
  const { jobs, isLoading } = useJobs()

  // Completed jobs where this wallet is the creator
  const completedJobs = jobs.filter(
    (j) =>
      j.creator.toLowerCase() === address?.toLowerCase() &&
      j.status === 3
  )

  // Pending jobs (submitted, awaiting verification)
  const pendingJobs = jobs.filter(
    (j) =>
      j.creator.toLowerCase() === address?.toLowerCase() &&
      j.status === 2
  )

  const allPayments = [
    ...completedJobs.map((j) => ({ ...j, isPaid: true })),
    ...pendingJobs.map((j) => ({ ...j, isPaid: false })),
  ]

  if (isLoading) {
    return (
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-foreground">Payment History</h3>
        <p className="mt-4 text-center text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-foreground">Payment History</h3>

      {allPayments.length === 0 ? (
        <div className="mt-6 text-center py-8">
          <p className="text-muted-foreground">No payments yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Complete a job to see your earnings here.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {allPayments.map((job) => {
            const earned = (job.amount * 0.95).toFixed(2)
            const date = new Date(job.deadline * 1000).toLocaleDateString(
              "en-US", { month: "short", day: "numeric" }
            )

            return (
              <div
                key={job.id}
                className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-white/[0.02] p-4 transition-all hover:border-white/[0.08]"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF2D7A]/20 to-[#2D6EFF]/20 text-sm font-bold text-white">
                    {job.project.slice(2, 4).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-foreground font-mono text-sm">
                      {job.project.slice(0, 6)}...{job.project.slice(-4)}
                    </p>
                    <p className="text-sm text-muted-foreground">{job.title}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <span className="text-lg font-bold text-green-400">
                    +{earned} USDC
                  </span>
                  <span className="text-sm text-muted-foreground">{date}</span>
                  {job.isPaid ? (
                    <div className="flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400">
                      <CheckCircle className="h-3 w-3" />
                      Paid
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-medium text-yellow-400">
                      <Clock className="h-3 w-3" />
                      Pending
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}