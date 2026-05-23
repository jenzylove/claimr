import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader, SectionHeader } from "@/components/claimr/page-header";
import { HeroEscrowNumber } from "@/components/claimr/hero-escrow-number";
import { WalletAddressCard } from "@/components/claimr/wallet-address-card";
import { ProjectStats } from "@/components/claimr/project-stats";
import { VerifierCard } from "@/components/claimr/verifier-card";
import { RecentActivity } from "@/components/claimr/recent-activity";
import { ProjectJobCards } from "@/components/claimr/project-job-cards";

export default function ProjectOverviewPage() {
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Project"
        title="Overview"
        subtitle="Track escrow, jobs, and creator activity."
        action={
          <Link
            href="/project/post"
            className="inline-flex items-center gap-2 rounded-xl bg-[#2D6EFF] px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-[#2D6EFF]/90 shadow-lg shadow-[#2D6EFF]/20"
          >
            <Plus className="h-4 w-4" />
            Post a job
          </Link>
        }
      />

      {/* Hero: total locked in escrow, breathing */}
      <HeroEscrowNumber />

      {/* Wallet + funding */}
      <section>
        <SectionHeader title="Your wallet" />
        <WalletAddressCard />
      </section>

      {/* Stats row */}
      <section>
        <SectionHeader title="At a glance" />
        <ProjectStats />
      </section>

      {/* Verifier insight - renders only when there's a relevant decision */}
      <VerifierCard />

      {/* Recent activity */}
      <section>
        <SectionHeader
          title="Recent activity"
          action={
            <Link
              href="/project/jobs"
              className="text-sm text-[#2D6EFF] hover:underline"
            >
              View all jobs
            </Link>
          }
        />
        <RecentActivity />
      </section>

      {/* Active jobs preview */}
      <section>
        <SectionHeader
          title="Your active jobs"
          subtitle="Open, claimed, or under review"
          action={
            <Link
              href="/project/jobs"
              className="text-sm text-[#2D6EFF] hover:underline"
            >
              See all
            </Link>
          }
        />
        <ProjectJobCards />
      </section>
    </div>
  );
}
