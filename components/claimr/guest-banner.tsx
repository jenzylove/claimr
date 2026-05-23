"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { LogIn, Eye } from "lucide-react";

interface GuestBannerProps {
  message?: string;
  returnPath?: string;
}

/**
 * Shows a "you are browsing as a guest" banner on auth-required pages.
 * Returns null for signed-in users. Drop in at the top of any page
 * where guests can navigate but features need a real session.
 */
export function GuestBanner({
  message = "Sign in to use this section",
  returnPath,
}: GuestBannerProps) {
  const { ready, authenticated } = useAuth();
  if (!ready || authenticated) return null;

  const href = returnPath
    ? `/onboarding?mode=signin&return=${encodeURIComponent(returnPath)}`
    : "/onboarding?mode=signin";

  return (
    <div className="rounded-2xl border border-[#FF2D7A]/20 bg-gradient-to-r from-[#FF2D7A]/5 to-[#2D6EFF]/5 p-4 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="h-9 w-9 shrink-0 rounded-full bg-[#FF2D7A]/10 flex items-center justify-center">
            <Eye className="h-4 w-4 text-[#FF2D7A]" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">
              You're browsing as a guest
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{message}</p>
          </div>
        </div>
        <Link
          href={href}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-[#FF2D7A] px-4 py-2 text-sm font-medium text-white hover:bg-[#FF2D7A]/90 transition-colors w-full sm:w-auto justify-center"
        >
          <LogIn className="h-3.5 w-3.5" />
          Sign in
        </Link>
      </div>
    </div>
  );
}
