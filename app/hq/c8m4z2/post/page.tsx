"use client";

import { PageHeader } from "@/components/claimr/page-header";
import { PostJobStepper } from "@/components/claimr/post-job-stepper";
import { Sparkles } from "lucide-react";

export default function AdminPostJobPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Claimr management"
        title="Post a platform job"
        subtitle="Jobs you post from this page show with a Platform badge across the marketplace, since they go on chain from an admin wallet."
      />

      <div className="rounded-2xl border border-[#FF2D7A]/20 bg-gradient-to-r from-[#FF2D7A]/5 to-[#2D6EFF]/5 p-4 flex items-start gap-3">
        <div className="h-9 w-9 shrink-0 rounded-full bg-[#FF2D7A]/10 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-[#FF2D7A]" />
        </div>
        <div className="text-sm">
          <p className="font-medium text-foreground">
            How platform jobs work
          </p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            This page uses the same flow as any project. The job posts on
            chain from your admin wallet, and the marketplace recognizes
            admin wallet addresses (set via NEXT_PUBLIC_ADMIN_WALLETS) and
            adds a Platform tag to the listing automatically. Slot count
            and visibility work the same as normal posts.
          </p>
        </div>
      </div>

      <PostJobStepper />
    </div>
  );
}
