"use client"

import { useJobs } from "@/lib/useJobs"
import { DollarSign, TrendingUp, Clock } from "lucide-react"
import { useAuth } from "@/lib/auth";

export function EarningsStats() {
  const { user } = useAuth();
  const address = user?.walletAddress;
  const { jobs, isLoading } = useJobs()

  const myJobs = jobs.filter(
    (j) => j.creator.toLowerCase() === address?.toLowerCase()
  )

  // 95% of amount after platform fee
  const totalEarned = myJobs
    .filter((j) => j.status === 3)
    .reduce((sum, j) => sum + j.amount * 0.95, 0)

  // Completed this month
  const now = new Date()
  const thisMonthEarned = myJobs
    .filter((j) => {
      if (j.status !== 3) return false
      const d = new Date(j.deadline * 1000)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    .reduce((sum, j) => sum + j.amount * 0.95, 0)

  // Pending = submitted but not yet verified
  const pendingPayout = myJobs
    .filter((j) => j.status === 2)
    .reduce((sum, j) => sum + j.amount * 0.95, 0)

  const stats = [
    {
      label: "Total Earned",
      value: isLoading ? "..." : totalEarned.toFixed(2),
      suffix: "USDC",
      icon: DollarSign,
      color: "#FF2D7A",
      large: true,
    },
    {
      label: "This Month",
      value: isLoading ? "..." : thisMonthEarned.toFixed(2),
      suffix: "USDC",
      icon: TrendingUp,
      color: "#2D6EFF",
      large: false,
    },
    {
      label: "Pending Payout",
      value: isLoading ? "..." : pendingPayout.toFixed(2),
      suffix: "USDC",
      icon: Clock,
      color: "#F59E0B",
      large: false,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="group relative overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-sm transition-all hover:border-white/[0.12]"
          style={{ boxShadow: `0 0 40px ${stat.color}15` }}
        >
          <div
            className="absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-10 blur-2xl"
            style={{ backgroundColor: stat.color }}
          />
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${stat.color}20` }}
            >
              <stat.icon className="h-4 w-4" style={{ color: stat.color }} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span
              className={`font-bold ${stat.large ? "text-3xl" : "text-2xl"}`}
              style={{ color: stat.color }}
            >
              {stat.value}
            </span>
            <span className="text-sm text-muted-foreground">{stat.suffix}</span>
          </div>
        </div>
      ))}
    </div>
  )
}