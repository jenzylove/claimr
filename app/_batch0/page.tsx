"use client";

// Batch 0 preview. Temporary verification page so 25TH can eyeball each
// primitive before we hook them into the dashboard in Batch 1. Delete this
// folder (app/_batch0) in Batch 5 cleanup.

import { useState } from "react";
import { AnimatedNumber } from "@/components/primitives/animated-number";
import { StatePill, type JobState } from "@/components/primitives/state-pill";
import { LivingBackground } from "@/components/primitives/living-background";

const STATES: JobState[] = [
  "open",
  "claimed",
  "submitted",
  "verified",
  "rejected",
  "cancelled",
];

export default function Batch0Preview() {
  const [value, setValue] = useState(0);
  const [stateIdx, setStateIdx] = useState(0);

  return (
    <>
      <LivingBackground />
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center gap-20 p-8">
        <header className="text-center space-y-2">
          <p className="text-white/40 text-xs uppercase tracking-widest">Batch 0</p>
          <h1 className="text-4xl font-bold text-white">Foundation primitives</h1>
          <p className="text-white/50 text-sm max-w-md">
            Every later batch reuses these. Verify they feel right, then we move to Batch 1.
          </p>
        </header>

        <section className="space-y-6 text-center">
          <p className="text-white/40 text-xs uppercase tracking-widest">Animated number</p>
          <div className="text-7xl font-bold text-white tabular-nums">
            <AnimatedNumber
              value={value}
              format={(n) => `$${Math.round(n).toLocaleString()}`}
            />
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            <PreviewButton onClick={() => setValue(0)}>Reset</PreviewButton>
            <PreviewButton onClick={() => setValue(Math.floor(Math.random() * 100_000))}>
              Random
            </PreviewButton>
            <PreviewButton onClick={() => setValue((v) => v + 12_345)}>+12,345</PreviewButton>
            <PreviewButton onClick={() => setValue(2_847_503)}>Big jump</PreviewButton>
          </div>
        </section>

        <section className="space-y-6 text-center">
          <p className="text-white/40 text-xs uppercase tracking-widest">State pill</p>
          <div className="flex flex-wrap gap-3 justify-center max-w-xl">
            {STATES.map((s) => (
              <StatePill key={s} state={s} />
            ))}
          </div>
          <div className="space-y-3 pt-4">
            <div className="text-lg">
              <StatePill state={STATES[stateIdx]} />
            </div>
            <PreviewButton onClick={() => setStateIdx((i) => (i + 1) % STATES.length)}>
              Cycle state
            </PreviewButton>
            <p className="text-white/30 text-xs">
              Submitted state has a pulsing dot — AI thinking signal.
            </p>
          </div>
        </section>

        <p className="text-white/40 text-xs max-w-md text-center">
          Living background renders behind everything. Move your mouse — the noise field shifts.
          Tab away and back — it pauses when hidden.
        </p>
      </div>
    </>
  );
}

function PreviewButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-lg bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-colors backdrop-blur-sm"
    >
      {children}
    </button>
  );
}
