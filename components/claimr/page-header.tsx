"use client";

import type { ReactNode } from "react";

// Shared header pattern. Used at the top of every dashboard and project
// page so titles, subtitles, and primary actions sit in the same place
// across the app.
//
//   <PageHeader
//     eyebrow="Project"
//     title="Overview"
//     subtitle="Manage your jobs and track creator performance"
//     action={<Link href="/project/post">Post a job</Link>}
//   />

interface Props {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function PageHeader({ eyebrow, title, subtitle, action }: Props) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0 w-full sm:w-auto [&>a]:w-full sm:[&>a]:w-auto [&>button]:w-full sm:[&>button]:w-auto [&>a]:justify-center sm:[&>a]:justify-start [&>button]:justify-center sm:[&>button]:justify-start">{action}</div>}
    </header>
  );
}

// Section header used inside pages. Title on the left, optional action on the right.
//
//   <SectionHeader title="Active jobs" action={<Link href="/project/jobs">See all</Link>} />

export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3 flex-wrap">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {subtitle && (
          <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
