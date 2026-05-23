import { PageHeader } from "@/components/claimr/page-header";
import { DiscoverFeed } from "@/components/claimr/discover-feed";
import { DiscoverTour } from "@/components/claimr/discover-tour";
import { TourTrigger } from "@/components/claimr/tour-trigger";

export default function DiscoverPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div data-tour-id="discover-header" className="flex-1 min-w-0">
          <PageHeader
            eyebrow="Creator"
            title="Discover jobs"
            subtitle="Find the right opportunity and start earning USDC."
          />
        </div>
        <TourTrigger />
      </div>
      <DiscoverFeed />

      {/* First-time welcome + step-by-step tour. Self-managed via
          tour-state localStorage flag. Replay icon lives in the navbar,
          and the TourTrigger button above gives a visible entry point. */}
      <DiscoverTour />
    </div>
  );
}
