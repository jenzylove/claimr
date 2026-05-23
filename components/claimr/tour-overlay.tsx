"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { ArrowRight, ArrowLeft, X } from "lucide-react";
import { useTour } from "@/lib/tour-state";

export interface TourStep {
  // CSS selector or [data-tour-id="..."] target. First match wins.
  target: string;
  title: string;
  body: string;
  // Where the tooltip sits relative to the target. Defaults to "auto"
  // which picks the side with the most room.
  placement?: "top" | "bottom" | "left" | "right" | "auto";
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const TOOLTIP_W = 320;
const TOOLTIP_GAP = 16;
const PADDING = 8;

// Conservative estimate of tooltip card height plus a generous bottom
// margin. Used to clamp tooltip top so the card never sits flush with
// the bottom of the viewport (where the Windows taskbar or mobile
// browser chrome could obscure the Finish/Close buttons).
const TOOLTIP_H_ESTIMATE = 240;
const BOTTOM_SAFE_MARGIN = 64;

// How aggressively we hunt for a target element that isn't measured yet.
// 80ms * 40 = 3.2 seconds of patience, then we give up and render the
// tooltip centered without a spotlight.
const POLL_INTERVAL_MS = 80;
const POLL_MAX_ATTEMPTS = 40;

function pickPlacement(
  rect: Rect,
  vw: number,
  vh: number
): "top" | "bottom" | "left" | "right" {
  const spaceBottom = vh - (rect.top + rect.height);
  const spaceTop = rect.top;
  const spaceRight = vw - (rect.left + rect.width);
  const spaceLeft = rect.left;
  const max = Math.max(spaceBottom, spaceTop, spaceRight, spaceLeft);
  if (max === spaceBottom && spaceBottom >= 180) return "bottom";
  if (max === spaceTop && spaceTop >= 180) return "top";
  if (max === spaceRight && spaceRight >= TOOLTIP_W + TOOLTIP_GAP)
    return "right";
  if (max === spaceLeft && spaceLeft >= TOOLTIP_W + TOOLTIP_GAP) return "left";
  return "bottom";
}

function tooltipPosition(
  rect: Rect,
  placement: "top" | "bottom" | "left" | "right",
  vw: number,
  vh: number
): { top: number; left: number } {
  if (placement === "bottom") {
    return {
      top: Math.min(vh - 220, rect.top + rect.height + TOOLTIP_GAP),
      left: Math.max(
        12,
        Math.min(
          vw - TOOLTIP_W - 12,
          rect.left + rect.width / 2 - TOOLTIP_W / 2
        )
      ),
    };
  }
  if (placement === "top") {
    return {
      top: Math.max(12, rect.top - TOOLTIP_GAP - 200),
      left: Math.max(
        12,
        Math.min(
          vw - TOOLTIP_W - 12,
          rect.left + rect.width / 2 - TOOLTIP_W / 2
        )
      ),
    };
  }
  if (placement === "right") {
    // Vertically center on target, then clamp top so the whole card
    // stays above the bottom safe zone (away from the taskbar).
    const centeredTop = rect.top + rect.height / 2 - TOOLTIP_H_ESTIMATE / 2;
    const maxTop = vh - TOOLTIP_H_ESTIMATE - BOTTOM_SAFE_MARGIN;
    return {
      top: Math.max(12, Math.min(maxTop, centeredTop)),
      left: Math.min(vw - TOOLTIP_W - 12, rect.left + rect.width + TOOLTIP_GAP),
    };
  }
  // left
  const centeredTop = rect.top + rect.height / 2 - TOOLTIP_H_ESTIMATE / 2;
  const maxTop = vh - TOOLTIP_H_ESTIMATE - BOTTOM_SAFE_MARGIN;
  return {
    top: Math.max(12, Math.min(maxTop, centeredTop)),
    left: Math.max(12, rect.left - TOOLTIP_W - TOOLTIP_GAP),
  };
}

// Centered fallback when no target is measurable. Clamped to viewport so
// the Close/Finish buttons are always tappable, including on mobile and
// on Windows where the taskbar can encroach on the browser's bottom edge.
function centeredTooltipPos(vw: number, vh: number) {
  const left = Math.max(12, Math.min(vw - TOOLTIP_W - 12, vw / 2 - TOOLTIP_W / 2));
  const top = Math.max(
    12,
    Math.min(vh - TOOLTIP_H_ESTIMATE - BOTTOM_SAFE_MARGIN, vh / 2 - 100)
  );
  return { top, left };
}

export function TourOverlay({ steps }: { steps: TourStep[] }) {
  const { step, totalSteps, setTotalSteps, nextStep, prevStep, finish } =
    useTour();

  // Hand the actual step count up to the provider so it knows when to
  // finish on the last "Next" click.
  useEffect(() => {
    setTotalSteps(steps.length);
  }, [steps.length, setTotalSteps]);

  const [rect, setRect] = useState<Rect | null>(null);

  // Read real window dims on first render so the fallback tooltip
  // (when there's no target) renders within the visible viewport
  // instead of offscreen at the SSR default of 1024x768.
  const [viewport, setViewport] = useState<{ w: number; h: number }>(() => {
    if (typeof window !== "undefined") {
      return { w: window.innerWidth, h: window.innerHeight };
    }
    return { w: 1024, h: 768 };
  });

  // Find target and measure. Polls until the element is both present
  // AND has a real bounding box, then keeps watching for resize and
  // scroll. Without polling, race conditions with route changes or
  // async-rendered content leave the spotlight broken.
  useLayoutEffect(() => {
    if (step < 0 || step >= steps.length) {
      setRect(null);
      return;
    }
    const current = steps[step];

    const measure = (): boolean => {
      setViewport({ w: window.innerWidth, h: window.innerHeight });
      const el = document.querySelector(current.target) as HTMLElement | null;
      if (!el) return false;

      const r = el.getBoundingClientRect();
      // Element exists but isn't laid out (zero size, eg display:none).
      // Keep polling so a target that comes online later still gets found.
      if (r.width < 1 || r.height < 1) return false;

      const offscreen =
        r.top < 0 ||
        r.bottom > window.innerHeight ||
        r.left < 0 ||
        r.right > window.innerWidth;

      if (offscreen) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        requestAnimationFrame(() => {
          const r2 = el.getBoundingClientRect();
          setRect({
            top: r2.top - PADDING,
            left: r2.left - PADDING,
            width: r2.width + PADDING * 2,
            height: r2.height + PADDING * 2,
          });
        });
        return true;
      }

      setRect({
        top: r.top - PADDING,
        left: r.left - PADDING,
        width: r.width + PADDING * 2,
        height: r.height + PADDING * 2,
      });
      return true;
    };

    // Try once immediately. If it lands, just wire up the watchers.
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    const found = measure();
    if (!found) {
      // Reset stale rect so the previous step's spotlight doesn't linger
      // while we poll for the new one.
      setRect(null);
      let attempts = 0;
      pollTimer = setInterval(() => {
        attempts += 1;
        if (measure() || attempts >= POLL_MAX_ATTEMPTS) {
          if (pollTimer) clearInterval(pollTimer);
          pollTimer = null;
        }
      }, POLL_INTERVAL_MS);
    }

    const onResize = () => measure();
    const onScroll = () => measure();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, true);

    return () => {
      if (pollTimer) clearInterval(pollTimer);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [step, steps]);

  // Lock body scroll while tour is active so the spotlight stays put.
  useEffect(() => {
    if (step < 0) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [step]);

  if (step < 0 || step >= steps.length) return null;
  const current = steps[step];
  const isFirst = step === 0;
  const isLast = step === steps.length - 1;

  const placement =
    current.placement && current.placement !== "auto"
      ? current.placement
      : rect
      ? pickPlacement(rect, viewport.w, viewport.h)
      : "bottom";

  const tooltipPos = rect
    ? tooltipPosition(rect, placement, viewport.w, viewport.h)
    : centeredTooltipPos(viewport.w, viewport.h);

  return (
    <div className="fixed inset-0 z-[55] pointer-events-none">
      {/* SVG cutout. Whole-screen dim rect + transparent inner rect via
          mask, so the target stays fully crisp. */}
      <svg className="absolute inset-0 w-full h-full pointer-events-auto">
        <defs>
          <mask id="tour-cutout">
            <rect width="100%" height="100%" fill="white" />
            {rect && (
              <rect
                x={rect.left}
                y={rect.top}
                width={rect.width}
                height={rect.height}
                rx="8"
                ry="8"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.72)"
          mask="url(#tour-cutout)"
        />
        {rect && (
          <rect
            x={rect.left}
            y={rect.top}
            width={rect.width}
            height={rect.height}
            rx="8"
            ry="8"
            fill="none"
            stroke="#FF2D7A"
            strokeWidth="2"
            className="animate-pulse"
            style={{ pointerEvents: "none" }}
          />
        )}
      </svg>

      <div
        className="absolute pointer-events-auto"
        style={{
          top: tooltipPos.top,
          left: tooltipPos.left,
          width: TOOLTIP_W,
          maxWidth: "calc(100vw - 24px)",
        }}
      >
        <div className="rounded-xl border border-white/15 bg-[#0f0f12]/95 backdrop-blur-xl shadow-2xl">
          <div className="px-5 py-4 border-b border-white/10 flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Step {step + 1} of {totalSteps}
              </p>
              <h3 className="mt-1 text-base font-semibold text-foreground">
                {current.title}
              </h3>
            </div>
            <button
              type="button"
              onClick={finish}
              aria-label="Skip tour"
              className="shrink-0 rounded-lg p-1 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="px-5 py-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {current.body}
            </p>
          </div>
          <div className="px-5 py-3 border-t border-white/10 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={prevStep}
              disabled={isFirst}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>
            <button
              type="button"
              onClick={nextStep}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#FF2D7A] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#FF2D7A]/90 transition-colors"
            >
              {isLast ? "Finish" : "Next"}
              {!isLast && <ArrowRight className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
