"use client";

import { Skeleton } from "@/components/ui/skeleton";

// Card skeleton matching the job row layout in /project/jobs.
export function JobCardSkeleton() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-48 bg-white/10" />
            <Skeleton className="h-5 w-20 rounded-full bg-white/10" />
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Skeleton className="h-4 w-24 bg-white/10" />
            <Skeleton className="h-4 w-20 bg-white/10" />
            <Skeleton className="h-4 w-24 bg-white/10" />
          </div>
        </div>
        <Skeleton className="h-9 w-40 rounded-lg bg-white/10" />
      </div>
    </div>
  );
}

// Row skeleton matching the transactions list layout.
export function TransactionRowSkeleton() {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-full bg-white/10" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-40 bg-white/10" />
          <Skeleton className="h-3 w-20 bg-white/10" />
        </div>
      </div>
      <Skeleton className="h-4 w-24 bg-white/10" />
    </div>
  );
}

// Glass-card row skeleton matching MyJobsList items.
export function MyJobRowSkeleton() {
  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-xl bg-white/10" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-32 bg-white/10" />
            <Skeleton className="h-5 w-56 bg-white/10" />
            <Skeleton className="h-4 w-44 bg-white/10" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-20 bg-white/10" />
          <Skeleton className="h-9 w-28 rounded-lg bg-white/10" />
        </div>
      </div>
    </div>
  );
}

// Re-export the shadcn base so callers can `import { Skeleton } from "@/components/claimr/skeleton"`.
export { Skeleton };
