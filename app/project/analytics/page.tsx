"use client";

import { useJobs } from "@/lib/useJobs";
import { TrendingUp, Users, Target, DollarSign } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function AnalyticsPage() {
  const { user } = useAuth();
  const address = user?.walletAddress;
  const { jobs, isLoading } = useJobs();

  const myJobs = jobs.filter(
    (j) => j.project.toLowerCase() === address?.toLowerCase()
  );

  const totalSpend = myJobs.reduce((sum, j) => sum + j.amount, 0);
  const jobsPosted = myJobs.length;
  const completedJobs = myJobs.filter((j) => j.status === 3);
  const successRate = jobsPosted > 0
    ? Math.round((completedJobs.length / jobsPosted) * 100)
    : 0;

  // Unique creators (exclude zero address)
  const uniqueCreators = new Set(
    myJobs
      .map((j) => j.creator)
      .filter((c) => c !== "0x0000000000000000000000000000000000000000")
  ).size;

  // Top creators from completed jobs
  const creatorMap: Record<string, { jobs: number; earned: number }> = {};
  completedJobs.forEach((j) => {
    if (j.creator === "0x0000000000000000000000000000000000000000") return;
    if (!creatorMap[j.creator]) creatorMap[j.creator] = { jobs: 0, earned: 0 };
    creatorMap[j.creator].jobs += 1;
    creatorMap[j.creator].earned += j.amount * 0.95;
  });
  const topCreators = Object.entries(creatorMap)
    .sort((a, b) => b[1].earned - a[1].earned)
    .slice(0, 4);

  // Monthly spend grouped by job deadline month (approximation)
  const monthlyMap: Record<string, number> = {};
  myJobs.forEach((j) => {
    const d = new Date(j.deadline * 1000);
    const key = d.toLocaleDateString("en-US", { month: "short" });
    monthlyMap[key] = (monthlyMap[key] ?? 0) + j.amount;
  });
  const monthlySpend = Object.entries(monthlyMap).map(([month, amount]) => ({ month, amount }));
  const maxSpend = Math.max(...monthlySpend.map((m) => m.amount), 1);

  const COLORS = ["#FF2D7A", "#2D6EFF", "#10B981", "#F59E0B"];

  // flow-fix: layout cleanup
  return (
    <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
            <p className="mt-2 text-muted-foreground">Track your campaign performance and creator ROI</p>
          </div>

          {isLoading ? (
            <p className="text-muted-foreground">Loading analytics from chain...</p>
          ) : (
            <>
              {/* Stats grid */}
              <div className="mb-8 grid gap-4 md:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-sm text-[#FF2D7A]">
                    <DollarSign className="h-4 w-4" />
                    Total Spend
                  </div>
                  <p className="mt-2 text-2xl font-bold text-foreground">
                    {totalSpend.toFixed(2)}{" "}
                    <span className="text-sm font-normal text-muted-foreground">USDC</span>
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-sm text-[#2D6EFF]">
                    <Target className="h-4 w-4" />
                    Jobs Posted
                  </div>
                  <p className="mt-2 text-2xl font-bold text-foreground">{jobsPosted}</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-sm text-green-400">
                    <TrendingUp className="h-4 w-4" />
                    Success Rate
                  </div>
                  <p className="mt-2 text-2xl font-bold text-foreground">
                    {successRate}
                    <span className="text-sm font-normal text-muted-foreground">%</span>
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-sm text-yellow-400">
                    <Users className="h-4 w-4" />
                    Unique Creators
                  </div>
                  <p className="mt-2 text-2xl font-bold text-foreground">{uniqueCreators}</p>
                </div>
              </div>

              {/* Spend chart */}
              <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
                <h2 className="mb-6 font-semibold text-foreground">Monthly Spend</h2>
                {monthlySpend.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No spend data yet.</p>
                ) : (
                  <div className="flex items-end justify-between gap-3 h-48">
                    {monthlySpend.map((m) => (
                      <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full relative flex items-end justify-center" style={{ height: "85%" }}>
                          <div
                            className="w-full rounded-t-lg bg-gradient-to-t from-[#FF2D7A] to-[#2D6EFF] transition-all hover:opacity-80"
                            style={{ height: `${(m.amount / maxSpend) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{m.month}</span>
                        <span className="text-xs font-medium text-foreground">{m.amount}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top creators */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
                <h2 className="mb-4 font-semibold text-foreground">Top Creators</h2>
                {topCreators.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    No completed jobs yet. Creators will appear here after finishing work.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {topCreators.map(([addr, data], i) => (
                      <div key={addr} className="flex items-center gap-4">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold"
                          style={{ backgroundColor: `${COLORS[i]}30`, color: COLORS[i] }}
                        >
                          {addr.slice(2, 4).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground font-mono">
                            {addr.slice(0, 6)}...{addr.slice(-4)}
                          </p>
                          <p className="text-xs text-muted-foreground">{data.jobs} jobs completed</p>
                        </div>
                        <span className="font-semibold text-green-400">
                          {data.earned.toFixed(2)} USDC
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
    </div>
  );
}