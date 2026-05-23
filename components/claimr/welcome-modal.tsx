"use client";

import { Sparkles, X } from "lucide-react";
import { useTour } from "@/lib/tour-state";

export function WelcomeModal() {
  const { step, startTour, skipTour } = useTour();

  // -2 = welcome modal showing. All other states render nothing.
  if (step !== -2) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={skipTour}
      />

      {/* Modal card */}
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0f0f12]/95 p-6 backdrop-blur-xl shadow-2xl">
        <button
          type="button"
          onClick={skipTour}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3">
          <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-[#FF2D7A]/20 to-[#2D6EFF]/20 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-[#FF2D7A]" />
          </div>
          <div>
            <h2
              id="welcome-title"
              className="text-xl font-bold text-foreground"
            >
              Welcome to Claimr
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              The marketplace where creators and crypto projects settle deals
              with AI verification and instant USDC payments.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm font-medium text-foreground">
            New here? Take a quick tour
          </p>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            Six short stops to learn how to find jobs, claim work, and get
            paid. Takes under a minute.
          </p>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={skipTour}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-white/10 transition-colors"
          >
            Skip for now
          </button>
          <button
            type="button"
            onClick={startTour}
            className="flex-1 rounded-xl bg-gradient-to-r from-[#FF2D7A] to-[#2D6EFF] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          >
            Take the tour
          </button>
        </div>
      </div>
    </div>
  );
}
