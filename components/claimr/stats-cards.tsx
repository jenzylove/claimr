"use client";

import { useJobs } from "@/lib/useJobs";
import { DollarSign, Briefcase, TrendingUp } from "lucide-react";
import { useAuth } from "@/lib/auth";

export function StatsCards() {
  const { user } = useAuth();
  const address = user?.walletAddress;
  const { jobs, isLoading } = useJobs();

  const myJobs = jobs.filter(
    (j) => j.creator.toLowerCase() === address?.toLowerCase()
  );

  const totalEarned = myJobs
    .filter((j) => j.status === 3)
    .reduce((sum, j) => sum + j.amount * 0.95, 0);

  const activeJobs = myJobs.filter(
    (j) => j.status === 1 || j.status === 2
  ).length;

  const completed = myJobs.filter((j) => j.status === 3).length;
  const failed = myJobs.filter((j) => j.status === 5).length;
  const successRate = completed + failed > 0
    ? Math.round((completed / (completed + failed)) * 100)
    : 0;

  const stats = [
    {
      label: "Total Earned",
      value: isLoading ? "..." : totalEarned.toFixed(2),
      unit: "USDC",
      icon: DollarSign,
      color: "#FF2D7A",
      bgColor: "rgba(255, 45, 122, 0.1)",
    },
    {
      label: "Active Jobs",
      value: isLoading ? "..." : activeJobs.toString(),
      unit: "",
      icon: Briefcase,
      color: "#2D6EFF",
      bgColor: "rgba(45, 110, 255, 0.1)",
    },
    {
      label: "Success Rate",
      value: isLoading ? "..." : successRate.toString(),
      unit: "%",
      icon: TrendingUp,
      color: "#22C55E",
      bgColor: "rgba(34, 197, 94, 0.1)",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="glass-card rounded-xl p-5 transition-all hover:border-white/20"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="mt-2 text-3xl font-bold text-foreground">
                {stat.value}
                <span className="ml-1 text-lg font-medium text-muted-foreground">
                  {stat.unit}
                </span>
              </p>
            </div>
            <div className="rounded-lg p-2.5" style={{ backgroundColor: stat.bgColor }}>
              <stat.icon className="h-5 w-5" style={{ color: stat.color }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}