// Centralized motion design tokens for Claimr.
// Use these everywhere; never inline duration/easing values in components.
// If a future component needs a different feel, add a named token here first.

export const motionDurations = {
  snap: 0.12,       // Micro-interactions, hover lift, button press
  base: 0.24,       // Standard transitions, fades, slides
  slow: 0.48,       // Layout shifts, modal opens
  expressive: 0.8,  // Hero moments (USDC fly-to-creator, count-up landings)
} as const;

// Cubic bezier easings. Named so usage reads intent, not numbers.
export const motionEase = {
  // Snappy in, smooth out. Default for almost everything.
  out: [0.22, 1, 0.36, 1] as [number, number, number, number],
  // Soft in, soft out. Ambient motion (background, breathing numbers).
  inOut: [0.42, 0, 0.58, 1] as [number, number, number, number],
  // Slight overshoot. Landing moments (state changes, USDC arrival).
  spring: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
  // Hard. Instant feedback (active button press).
  linear: [0, 0, 1, 1] as [number, number, number, number],
};

// Common variant presets so the same motion isn't re-typed everywhere.
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const slideUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.98 },
};

// Stagger helper for lists / grids.
export const staggerContainer = (delay = 0.04, startDelay = 0) => ({
  animate: {
    transition: {
      staggerChildren: delay,
      delayChildren: startDelay,
    },
  },
});
