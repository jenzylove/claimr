"use client";

// Smooth count-up / count-down number. Use anywhere a displayed number
// changes and you want the eye to follow it. Escrow totals, balances,
// job amounts, transaction counts.
//
// Usage:
//   <AnimatedNumber value={escrowTotal} format={(n) => `$${n.toLocaleString()}`} />

import { useEffect, useRef, useState } from "react";
import { animate, useInView } from "motion/react";
import { motionDurations, motionEase } from "@/lib/motion";

interface Props {
  value: number;
  duration?: number; // seconds; defaults to motionDurations.expressive
  format?: (n: number) => string;
  className?: string;
  /**
   * When true (default), only animates when the element is visible.
   * Set false for off-screen elements that should still update.
   */
  inViewOnly?: boolean;
}

export function AnimatedNumber({
  value,
  duration = motionDurations.expressive,
  format = (n) => Math.round(n).toLocaleString(),
  className,
  inViewOnly = true,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: false });
  const previousValue = useRef(0);
  const [displayed, setDisplayed] = useState(0); // Initial SSR-safe render

  useEffect(() => {
    if (inViewOnly && !inView) return;
    const from = previousValue.current;
    const to = value;
    if (from === to) return;

    const controls = animate(from, to, {
      duration,
      ease: motionEase.out,
      onUpdate: (latest) => {
        if (ref.current) ref.current.textContent = format(latest);
      },
      onComplete: () => setDisplayed(to),
    });
    previousValue.current = to;
    return () => controls.stop();
  }, [value, duration, format, inView, inViewOnly]);

  return (
    <span ref={ref} className={className}>
      {format(displayed)}
    </span>
  );
}
