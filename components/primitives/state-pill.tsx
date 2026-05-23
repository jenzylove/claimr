"use client";

// Animated job state pill. The centerpiece of Batch 1's job cards.
//
// Smoothly transitions color, label, and dot pulse when state changes.
// Job states from the contract: 0=Open, 1=Claimed, 2=Submitted, 3=Verified,
// 4=Rejected, 5=Cancelled.
//
// Usage:
//   <StatePill state="submitted" />          // by name
//   <StatePill state={job.status} />         // by contract index

import { motion, AnimatePresence } from "motion/react";
import { motionDurations, motionEase } from "@/lib/motion";

export type JobState =
  | "open"
  | "claimed"
  | "submitted"
  | "verified"
  | "rejected"
  | "cancelled";

interface StateConfig {
  label: string;
  color: string; // text + dot
  bg: string; // pill background
  pulse: boolean; // animate dot opacity when active
}

const stateConfig: Record<JobState, StateConfig> = {
  open: {
    label: "Open",
    color: "#10B981",
    bg: "rgba(16, 185, 129, 0.12)",
    pulse: false,
  },
  claimed: {
    label: "Claimed",
    color: "#2D6EFF",
    bg: "rgba(45, 110, 255, 0.14)",
    pulse: false,
  },
  submitted: {
    label: "Under review",
    color: "#F59E0B",
    bg: "rgba(245, 158, 11, 0.14)",
    pulse: true, // breathing dot — AI is thinking
  },
  verified: {
    label: "Paid",
    color: "#10B981",
    bg: "rgba(16, 185, 129, 0.18)",
    pulse: false,
  },
  rejected: {
    label: "Rejected",
    color: "#FF2D7A",
    bg: "rgba(255, 45, 122, 0.14)",
    pulse: false,
  },
  cancelled: {
    label: "Cancelled",
    color: "#71717A",
    bg: "rgba(113, 113, 122, 0.14)",
    pulse: false,
  },
};

const indexMap: Record<number, JobState> = {
  0: "open",
  1: "claimed",
  2: "submitted",
  3: "verified",
  4: "rejected",
  5: "cancelled",
};

function resolveState(state: JobState | number): JobState {
  if (typeof state === "number") return indexMap[state] ?? "open";
  return state;
}

interface Props {
  state: JobState | number;
  className?: string;
  size?: "sm" | "md";
}

export function StatePill({ state, className = "", size = "md" }: Props) {
  const key = resolveState(state);
  const cfg = stateConfig[key];

  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs";
  const dotSize = size === "sm" ? "h-1 w-1" : "h-1.5 w-1.5";

  return (
    <motion.div
      layout
      className={`inline-flex items-center gap-2 rounded-full font-medium ${sizeClasses} ${className}`}
      animate={{ backgroundColor: cfg.bg, color: cfg.color }}
      transition={{ duration: motionDurations.base, ease: motionEase.out }}
    >
      <motion.span
        className={`rounded-full ${dotSize}`}
        animate={
          cfg.pulse
            ? { backgroundColor: cfg.color, opacity: [0.4, 1, 0.4] }
            : { backgroundColor: cfg.color, opacity: 1 }
        }
        transition={
          cfg.pulse
            ? { duration: 1.6, repeat: Infinity, ease: motionEase.inOut }
            : { duration: motionDurations.base }
        }
      />
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={key}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: motionDurations.base, ease: motionEase.out }}
        >
          {cfg.label}
        </motion.span>
      </AnimatePresence>
    </motion.div>
  );
}
