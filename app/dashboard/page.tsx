"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { PageHeader, SectionHeader } from "@/components/claimr/page-header";
import { StatsCards } from "@/components/claimr/stats-cards";
import { FeaturedJobs } from "@/components/claimr/featured-jobs";
import { LatestJobs } from "@/components/claimr/latest-jobs";

export default function DashboardHomePage() {
  const { user } = useAuth();

  const displayName =
    (user?.email && user.email.split("@")[0]) ||
    (user?.walletAddress
      ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`
      : "Creator");

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Creator"
        title={`Welcome back, ${displayName}`}
        subtitle="Browse open work, track your claims, and watch payouts land."
      />

      <section>
        <SectionHeader title="At a glance" />
        <StatsCards />
      </section>

      <section>
        <SectionHeader
          title="Featured for you"
          subtitle="Highest-paying open jobs first"
          action={
            <Link
              href="/dashboard/discover"
              className="text-sm text-[#FF2D7A] hover:underline"
            >
              See all
            </Link>
          }
        />
        <FeaturedJobs />
      </section>

      <section>
        <SectionHeader
          title="Latest jobs"
          subtitle="Newest first"
          action={
            <Link
              href="/dashboard/discover"
              className="text-sm text-[#FF2D7A] hover:underline"
            >
              See all
            </Link>
          }
        />
        <LatestJobs />
      </section>
    </div>
  );
}
