"use client";

import { useJobs } from "@/lib/useJobs";
import { Vault, Briefcase, CheckCircle2, Wallet } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { USDC_ADDRESS, USDC_ABI } from "@/lib/contracts";
import { AnimatedNumber } from "@/components/primitives/animated-number";

export function ProjectStats() {
  const { user } = useAuth();
  const address = user?.walletAddress;
  const { jobs, isLoading } = useJobs();

  const myJobs = jobs.filter(
    (j) => j.project.toLowerCase() === address?.toLowerCase()
  );

  const escrowed = myJobs
    .filter((j) => j.status === 0 || j.status === 1 || j.status === 2)
    .reduce((sum, j) => sum + j.amount, 0);

  const activeCount = myJobs.filter(
    (j) => j.status === 0 || j.status === 1 || j.status === 2
  ).length;

  const completedCount = myJobs.filter((j) => j.status === 3).length;

  // Personal USDC balance. Refetches via wagmi cache.
  const { data: usdcRaw } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: "balanceOf",
    args: [(address ?? "0x0000000000000000000000000000000000000000") as `0x${string}`],
    query: { enabled: !!address, refetchInterval: 8000 },
  });
  const usdcBalance = usdcRaw
    ? Number(formatUnits(usdcRaw as bigint, 6))
    : 0;

  const cards = [
    {
      label: "Your USDC",
      value: usdcBalance,
      unit: "USDC",
      icon: Wallet,
      color: "#10B981",
      decimals: true,
    },
    {
      label: "In escrow",
      value: escrowed,
      unit: "USDC",
      icon: Vault,
      color: "#2D6EFF",
    },
    {
      label: "Active jobs",
      value: activeCount,
      unit: "",
      icon: Briefcase,
      color: "#FF2D7A",
      integer: true,
    },
    {
      label: "Completed",
      value: completedCount,
      unit: "",
      icon: CheckCircle2,
      color: "#A1A1AA",
      integer: true,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(
        ({ label, value, unit, icon: Icon, color, integer, decimals }) => (
          <div
            key={label}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm"
          >
            <div className="flex items-center gap-2">
              <span style={{ color }}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                {label}
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              {isLoading && !decimals ? (
                <span className="h-7 w-20 rounded bg-white/5 animate-pulse" />
              ) : (
                <span className="text-2xl font-bold text-foreground tabular-nums">
                  <AnimatedNumber
                    value={value}
                    format={
                      integer
                        ? undefined
                        : decimals
                        ? (n) => n.toFixed(2)
                        : (n) => Math.round(n).toLocaleString()
                    }
                  />
                </span>
              )}
              {unit && (
                <span className="text-xs text-muted-foreground font-medium">
                  {unit}
                </span>
              )}
            </div>
          </div>
        )
      )}
    </div>
  );
}
