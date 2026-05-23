"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
import { useJobs } from "@/lib/useJobs";
import { useAuth } from "@/lib/auth";
import { TrendingUp } from "lucide-react";
import { AnimatedNumber } from "@/components/primitives/animated-number";
import { motionEase } from "@/lib/motion";

// Real-data earnings chart. Groups my completed jobs as creator by month
// over the last 6 months. 95% of the job amount is what actually lands
// (5% platform fee assumed elsewhere).

function lastSixMonthBuckets() {
  const buckets: { key: string; label: string; month: number; year: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleDateString(undefined, { month: "short" }),
      month: d.getMonth(),
      year: d.getFullYear(),
    });
  }
  return buckets;
}

export function EarningsChart() {
  const { user } = useAuth();
  const address = user?.walletAddress;
  const { jobs } = useJobs();

  const data = useMemo(() => {
    const buckets = lastSixMonthBuckets();
    const totals = new Map<string, number>();
    buckets.forEach((b) => totals.set(b.key, 0));

    jobs.forEach((j) => {
      if (j.status !== 3) return;
      if (!address) return;
      if (j.creator.toLowerCase() !== address.toLowerCase()) return;
      const d = new Date(j.deadline * 1000);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (totals.has(key)) {
        totals.set(key, (totals.get(key) ?? 0) + j.amount * 0.95);
      }
    });

    return buckets.map((b) => ({ ...b, amount: totals.get(b.key) ?? 0 }));
  }, [jobs, address]);

  const maxAmount = Math.max(...data.map((d) => d.amount), 1);
  const totalSixMonths = data.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            Monthly earnings
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Last 6 months, after platform fee
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            6 month total
          </p>
          <p className="mt-0.5 text-xl font-bold text-foreground">
            <AnimatedNumber value={totalSixMonths} format={(n) => n.toFixed(2)} /> USDC
          </p>
        </div>
      </div>

      {totalSixMonths === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center py-8 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="mt-3 text-sm text-foreground font-medium">
            No earnings in the last 6 months
          </p>
          <p className="mt-1 text-xs text-muted-foreground max-w-xs">
            Once jobs you've claimed get verified and pay out, they'll show up here.
          </p>
        </div>
      ) : (
        <div className="mt-6">
          <div
            className="flex items-end justify-between gap-2 sm:gap-4"
            style={{ height: "180px" }}
          >
            {data.map((d, i) => {
              const heightPercent = (d.amount / maxAmount) * 100;
              return (
                <div
                  key={d.key}
                  className="group relative flex flex-1 flex-col items-center"
                >
                  <div className="relative w-full" style={{ height: "150px" }}>
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 rounded-t-md bg-gradient-to-t from-[#FF2D7A] to-[#2D6EFF]"
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPercent}%` }}
                      transition={{
                        duration: 0.8,
                        delay: i * 0.05,
                        ease: motionEase.out,
                      }}
                    />
                    {/* hover tooltip */}
                    <div className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="rounded-lg border border-white/10 bg-background/95 px-2 py-1 text-xs text-foreground shadow-lg whitespace-nowrap font-mono">
                        {d.amount.toFixed(2)} USDC
                      </div>
                    </div>
                  </div>
                  <span className="mt-2 text-xs text-muted-foreground">
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
