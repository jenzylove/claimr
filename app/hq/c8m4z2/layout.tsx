"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useIsAdmin } from "@/lib/admin-auth";
import { AdminSidebar } from "@/components/claimr/admin-sidebar";
import { Loader2, ShieldAlert } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { ready, authenticated, isAdmin } = useIsAdmin();
  const router = useRouter();

  // Bounce unauthorized visitors. Wallet gate is UI-only; the API routes
  // also enforce server-side via the ADMIN_EMAILS env check.
  useEffect(() => {
    if (!ready) return;
    if (!authenticated) {
      router.replace("/onboarding?mode=signin");
      return;
    }
    if (!isAdmin) {
      router.replace("/dashboard/discover");
    }
  }, [ready, authenticated, isAdmin, router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!authenticated || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="max-w-sm text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-4 text-sm text-foreground font-medium">
            Redirecting...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -right-32 h-96 w-96 rounded-full bg-[#2D6EFF]/5 blur-3xl" />
        <div className="absolute bottom-1/4 -left-32 h-96 w-96 rounded-full bg-[#FF2D7A]/5 blur-3xl" />
      </div>

      <AdminSidebar />

      <main className="md:pl-64">
        <div className="relative min-h-screen p-4 sm:p-6 md:p-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </div>
      </main>
    </div>
  );
}
