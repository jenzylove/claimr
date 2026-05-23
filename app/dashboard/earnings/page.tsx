import { PageHeader, SectionHeader } from "@/components/claimr/page-header";
import { EarningsStats } from "@/components/claimr/earnings-stats";
import { EarningsChart } from "@/components/claimr/earnings-chart";
import { PaymentHistory } from "@/components/claimr/payment-history";
import { GuestBanner } from "@/components/claimr/guest-banner";

export default function EarningsPage() {
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Creator"
        title="Earnings"
        subtitle="Your payment history across every job you've claimed."
      />

      <GuestBanner
        message="Sign in to see earnings from jobs you've completed."
        returnPath="/dashboard/earnings"
      />

      <section>
        <SectionHeader title="At a glance" />
        <EarningsStats />
      </section>

      <section>
        <SectionHeader title="Monthly earnings" />
        <EarningsChart />
      </section>

      <section>
        <SectionHeader title="Payment history" />
        <PaymentHistory />
      </section>
    </div>
  );
}
