"use client";

// The Batch 1 moment piece. When a job transitions from Submitted (2) to
// Verified/Paid (3), USDC visually flies from the escrow lock on the right
// to the creator on the left. Green ripple lands at the destination.
//
// Implementation notes:
//
// - Trigger is purely event-driven on a real chain status change. We track
//   the previous status with a ref and fire only on 2 -> 3.
// - First render initializes the ref to the current status, so already-paid
//   jobs on initial load do NOT replay the animation. Good for refresh.
// - For dev/demo replay without a real chain event, dispatch the custom
//   event `claimr:replay-payout` with `{ detail: { jobId: <id> } }` from
//   devtools. Hidden affordance, no production UI clutter.
// - The animation overlays the row via absolute positioning, pointer-events
//   none so it never blocks clicks.

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { motionDurations, motionEase } from "@/lib/motion";

interface Props {
  jobId: number;
  status: number;       // contract enum: 0..5
  amount: number;       // USDC display amount
}

export function EscrowPayoutFlight({ jobId, status, amount }: Props) {
  const [playing, setPlaying] = useState(false);
  const prevStatus = useRef<number>(status);

  // React to real status transitions 2 -> 3
  useEffect(() => {
    if (prevStatus.current === 2 && status === 3) {
      setPlaying(true);
      const t = setTimeout(() => setPlaying(false), 1800);
      prevStatus.current = status;
      return () => clearTimeout(t);
    }
    prevStatus.current = status;
  }, [status]);

  // Dev/demo replay hook
  useEffect(() => {
    const onReplay = (e: Event) => {
      const ev = e as CustomEvent<{ jobId: number }>;
      if (ev?.detail?.jobId === jobId) {
        setPlaying(true);
        setTimeout(() => setPlaying(false), 1800);
      }
    };
    window.addEventListener("claimr:replay-payout", onReplay as EventListener);
    return () =>
      window.removeEventListener(
        "claimr:replay-payout",
        onReplay as EventListener
      );
  }, [jobId]);

  return (
    <AnimatePresence>
      {playing && (
        <motion.div
          key="flight"
          className="pointer-events-none absolute inset-0 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: motionDurations.snap }}
        >
          {/* Green wash on the row, fades in then out */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.6, 0] }}
            transition={{ duration: 1.6, ease: motionEase.inOut }}
          />

          {/* The USDC coin: starts at the right (lock side), flies left to
              the creator side, arcs slightly upward at mid-flight.

              We position from the right edge using `right` and translate
              negatively as we animate. Using percentages so it scales with
              the row width across breakpoints. */}
          <motion.div
            className="absolute top-1/2 right-10"
            initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
            animate={{
              x: ["0%", "-50%", "-100%"],
              y: ["-50%", "-110%", "-50%"],
              scale: [0, 1.1, 1, 0.75],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: 1.4,
              times: [0, 0.25, 0.7, 1],
              ease: motionEase.out,
            }}
          >
            <div className="flex h-9 items-center gap-1.5 rounded-full bg-emerald-500/95 px-3 text-xs font-bold text-emerald-950 shadow-[0_0_20px_rgba(16,185,129,0.6)]">
              <CoinGlyph />
              {`+${amount} USDC`}
            </div>
          </motion.div>

          {/* Ripple ring expanding at the destination (creator side) */}
          <motion.div
            className="absolute top-1/2 left-6 -translate-y-1/2 h-12 w-12 rounded-full border-2 border-emerald-400"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.4, 2.2], opacity: [0, 0.6, 0] }}
            transition={{
              duration: 0.9,
              delay: 1.0,
              ease: motionEase.out,
            }}
          />

          {/* Soft pulse dot at the destination */}
          <motion.div
            className="absolute top-1/2 left-6 -translate-y-1/2 h-2 w-2 rounded-full bg-emerald-400"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.4, 1], opacity: [0, 1, 0.9] }}
            transition={{
              duration: 0.6,
              delay: 1.1,
              ease: motionEase.spring,
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CoinGlyph() {
  return (
    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-950/30 text-[10px] font-black">
      $
    </span>
  );
}
