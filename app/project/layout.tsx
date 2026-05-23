import { ProjectSidebar } from "@/components/claimr/project-sidebar";
import { LivingBackground } from "@/components/primitives/living-background";

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Living gradient field - WebGL shader, brand-colored, pauses when tab hidden */}
      <LivingBackground />

      <ProjectSidebar />

      {/* Main Content */}
      <main className="pl-64">
        <div className="relative min-h-screen p-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </div>
      </main>
    </div>
  );
}
