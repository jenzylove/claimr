import { PageHeader } from "@/components/claimr/page-header";
import { MyJobsList } from "@/components/claimr/my-jobs-list";
import { GuestBanner } from "@/components/claimr/guest-banner";

export default function MyJobsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Creator"
        title="My jobs"
        subtitle="Track active claims, submissions awaiting review, and completed work."
      />
      <GuestBanner
        message="Sign in to track jobs you've claimed and submit work for verification."
        returnPath="/dashboard/my-jobs"
      />
      <MyJobsList />
    </div>
  );
}
