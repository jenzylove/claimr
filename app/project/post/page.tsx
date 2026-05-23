import { PageHeader } from "@/components/claimr/page-header";
import { PostJobStepper } from "@/components/claimr/post-job-stepper";

export default function PostJobPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <PageHeader
        eyebrow="Project"
        title="Post a job"
        subtitle="Lock USDC in escrow, AI verifies submissions, payment releases automatically."
      />
      <PostJobStepper />
    </div>
  );
}
