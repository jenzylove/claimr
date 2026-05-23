"use client";

import { WelcomeModal } from "@/components/claimr/welcome-modal";
import { TourOverlay, type TourStep } from "@/components/claimr/tour-overlay";

const DISCOVER_STEPS: TourStep[] = [
  {
    target: '[data-tour-id="discover-header"]',
    title: "Welcome to Discover",
    body: "This is the heart of Claimr. Every open job, every category, every payout opportunity surfaces here. Let's walk through what you can do.",
    placement: "bottom",
  },
  {
    target: '[data-tour-id="discover-search"]',
    title: "Search and filter",
    body: "Type a keyword or pick a category to narrow the list. Jobs are indexed live from the chain, so what you see is always the current state, never a cached snapshot.",
    placement: "bottom",
  },
  {
    target: '[data-tour-id="discover-featured"]',
    title: "Featured jobs",
    body: "Higher-pay and platform-promoted jobs surface here first. The pink Featured pill and the Platform badge tell you what's special about each one.",
    placement: "top",
  },
  {
    target: '[data-tour-id="discover-latest"]',
    title: "Latest jobs",
    body: "Every newly posted job lands here, sorted by time. Click any Claim Job button to stake your claim. Once you do, the job is yours and only you can submit work for it.",
    placement: "top",
  },
  {
    target: '[data-tour-id="dashboard-sidebar"]',
    title: "Your navigation",
    body: "Discover is where you find work. My Jobs tracks what you've claimed. Wallet shows your USDC. Earnings sums up completed payouts. Settings tunes your profile.",
    placement: "right",
  },
  {
    target: '[data-tour-id="sidebar-cta"]',
    title: "Sign in to take action",
    body: "You can browse Claimr as a guest, but claiming jobs and getting paid both need a signed-in wallet. The button right below this tooltip is the fastest way to set up an account.",
    placement: "top",
  },
  {
    target: '[data-tour-id="tour-replay"]',
    title: "Quick replay shortcut",
    body: "The question-mark icon in the top nav restarts this tour from anywhere on the site. Handy when you forget what something does or come back after a break.",
    placement: "bottom",
  },
  {
    target: '[data-tour-id="tour-trigger"]',
    title: "And you're set",
    body: "This Take a tour button on the Discover page does the same thing as the navbar icon. Easier to spot when you need it. That's the whole platform. Go claim something.",
    placement: "bottom",
  },
];

export function DiscoverTour() {
  return (
    <>
      <WelcomeModal />
      <TourOverlay steps={DISCOVER_STEPS} />
    </>
  );
}
