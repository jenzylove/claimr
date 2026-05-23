"use client";

import { Sparkles } from "lucide-react";
import { useTour } from "@/lib/tour-state";

interface Props {
  className?: string;
}

export function TourTrigger({ className }: Props) {
  const { startTour } = useTour();

  return (
    <button
      type="button"
      onClick={startTour}
      data-tour-id="tour-trigger"
      className={`inline-flex shrink-0 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-sm font-medium text-foreground hover:bg-white/10 hover:border-white/20 transition-colors ${
        className ?? ""
      }`}
    >
      <Sparkles className="h-4 w-4 text-[#FF2D7A]" />
      Take a tour
    </button>
  );
}
