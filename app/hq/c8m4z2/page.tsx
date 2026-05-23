"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useJobs } from "@/lib/useJobs";
import { ADMIN_BASE_PATH } from "@/lib/admin-config";
import { PageHeader, SectionHeader } from "@/components/claimr/page-header";
import { AnimatedNumber } from "@/components/primitives/animated-number";
import { StatePill } from "@/components/primitives/state-pill";
import { Vault, Briefcase, Users, ShieldCheck, ChevronRight } from "lucide-react";

const ZERO = "0x0000000000000000000000000000000000000000";

export default function AdminOverviewPage() {
  const { jobs, isLoading } = useJobs();

  const kpis = useMemo(() => {
    const total = jobs.length;
    const active = jobs.filter((j) => j.status === 0 || j.status === 1).length;
    const underReview = jobs.filter((j) => j.status === 2).length;
    const completed = jobs.filter((j) => j.status === 3).length;
    const failed = jobs.filter((j) => j.status === 5).length;

    const escrowed = jobs
      .filter((j) => j.status === 0 || j.status === 1 || j.status === 2)
      .reduce((sum, j) => sum + j.amount, 0);

    const paidOut = jobs
      .filter((j) => j.status === 3)
      .reduce((sum, j) => sum + j.amount * 0.95, 0);

    const projects = new Set(jobs.map((j) => j.project.toLowerCase())).size;
    const creators = new Set(
      jobs.filter((j) => j.creator !== ZERO).map((j) => j.creator.toLowerCase())
    ).size;

    return {
      total,
      active,
      underReview,
      completed,
      failed,
      escrowed,
      paidOut,
      projects,
      creators,
    };
  }, [jobs]);

  const recentJobs = useMemo(
    () => [...jobs].sort((a, b) => b.id - a.id).slice(0, 6),
    [jobs]
  );

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Claimr management"
        title="Operations overview"
        subtitle="Live state of the platform from chain."
      />

      {/* Top KPIs */}
      <section>
        <SectionHeader title="Money in motion" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi
            icon={<Vault className="h-5 w-5" />}
            color="#2D6EFF"
            label="In escrow now"
            value={kpis.escrowed}
            unit="USDC"
            loading={isLoading}
          />
          <Kpi
            icon={<Vault className="h-5 w-5" />}
            color="#10B981"
            label="Paid out (lifetime)"
            value={kpis.paidOut}
            unit="USDC"
            loading={isLoading}
            decimals
          />
          <Kpi
            icon={<Briefcase className="h-5 w-5" />}
            color="#FF2D7A"
            label="Under verifier review"
            value={kpis.underReview}
            unit=""
            loading={isLoading}
            integer
          />
          <Kpi
            icon={<ShieldCheck className="h-5 w-5" />}
            color="#F59E0B"
            label="Failed verifications"
            value={kpis.failed}
            unit=""
            loading={isLoading}
            integer
          />
        </div>
      </section>

      {/* Job-state breakdown */}
      <section>
        <SectionHeader title="Job state breakdown" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Kpi
            icon={<Briefcase className="h-5 w-5" />}
            color="#A1A1AA"
            label="All jobs ever posted"
            value={kpis.total}
            unit=""
            loading={isLoading}
            integer
          />
          <Kpi
            icon={<Briefcase className="h-5 w-5" />}
            color="#2D6EFF"
            label="Active (open or claimed)"
            value={kpis.active}
            unit=""
            loading={isLoading}
            integer
          />
          <Kpi
            icon={<Briefcase className="h-5 w-5" />}
            color="#10B981"
            label="Completed"
            value={kpis.completed}
            unit=""
            loading={isLoading}
            integer
          />
        </div>
      </section>

      {/* Users */}
      <section>
        <SectionHeader title="Users on chain" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Kpi
            icon={<Users className="h-5 w-5" />}
            color="#FF2D7A"
            label="Project owner wallets"
            value={kpis.projects}
            unit=""
            loading={isLoading}
            integer
          />
          <Kpi
            icon={<Users className="h-5 w-5" />}
            color="#2D6EFF"
            label="Creator wallets (claimed at least one)"
            value={kpis.creators}
            unit=""
            loading={isLoading}
            integer
          />
        </div>
      </section>

      {/* Recent jobs */}
      <section>
        <SectionHeader
          title="Recent jobs"
          action={
            <Link
              href={`${ADMIN_BASE_PATH}/jobs`}
              className="text-sm text-[#2D6EFF] hover:underline"
            >
              See all
            </Link>
          }
        />
        {isLoading ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-muted-foreground">
            Loading from chain...
          </div>
        ) : recentJobs.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-muted-foreground">
            No jobs posted yet.
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm overflow-hidden">
            {recentJobs.map((job) => (
              <Link
                key={job.id}
                href={`${ADMIN_BASE_PATH}/jobs/${job.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors border-b border-white/5 last:border-0"
              >
                <span className="text-xs font-mono text-muted-foreground w-10">
                  #{job.id}
                </span>
                <p className="flex-1 min-w-0 text-sm text-foreground truncate">
                  {job.title}
                </p>
                <StatePill state={job.status} size="sm" />
                <span className="text-sm font-mono text-foreground tabular-nums">
                  {job.amount} USDC
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Kpi({
  icon,
  color,
  label,
  value,
  unit,
  loading,
  integer,
  decimals,
}: {
  icon: React.ReactNode;
  color: string;
  label: string;
  value: number;
  unit: string;
  loading: boolean;
  integer?: boolean;
  decimals?: boolean;
}) {
  const formatter = integer
    ? undefined
    : decimals
    ? (n: number) => n.toFixed(2)
    : (n: number) => Math.round(n).toLocaleString();
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <span style={{ color }}>{icon}</span>
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        {loading ? (
          <span className="h-7 w-20 rounded bg-white/5 animate-pulse" />
        ) : (
          <span className="text-3xl font-bold text-foreground tabular-nums">
            <AnimatedNumber value={value} format={formatter} />
          </span>
        )}
        {unit && (
          <span className="text-sm text-muted-foreground font-medium">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}
