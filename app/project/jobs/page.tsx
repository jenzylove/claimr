import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/claimr/page-header";
import { ProjectJobsTable } from "@/components/claimr/project-jobs-table";

export default function ProjectJobsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Project"
        title="Your jobs"
        subtitle="Every job you've posted, across every status."
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
      <ProjectJobsTable />
    </div>
  );
}
