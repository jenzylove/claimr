import { DashboardSidebar } from "@/components/claimr/dashboard-sidebar";
import { LivingBackground } from "@/components/primitives/living-background";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <LivingBackground />

      <DashboardSidebar />

      {/* Main Content — no left padding on mobile, sidebar width on desktop */}
      <main className="md:pl-64">
        <div className="relative min-h-screen p-4 pt-20 md:p-8 md:pt-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </div>
      </main>
    </div>
  );
}