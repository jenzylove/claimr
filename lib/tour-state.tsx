"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const SEEN_KEY = "claimr_tour_seen_v1";

export interface TourContextValue {
  // -1 means tour is closed. 0..N means showing step N. -2 = welcome modal.
  step: number;
  hasSeenTour: boolean;
  totalSteps: number;
  startTour: () => void;
  skipTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  setTotalSteps: (n: number) => void;
  finish: () => void;
}

const TourContext = createContext<TourContextValue | null>(null);

export function useTour(): TourContextValue {
  return (
    useContext(TourContext) ?? {
      step: -1,
      hasSeenTour: true,
      totalSteps: 0,
      startTour: () => {},
      skipTour: () => {},
      nextStep: () => {},
      prevStep: () => {},
      setTotalSteps: () => {},
      finish: () => {},
    }
  );
}

export function TourProvider({ children }: { children: React.ReactNode }) {
  // -3 = uninitialized (during SSR / first render)
  // -2 = welcome modal showing
  // -1 = tour closed
  //  0..N = showing step N
  const [step, setStep] = useState<number>(-3);
  const [totalSteps, setTotalStepsState] = useState(0);

  // On mount, check localStorage. First-time users get the welcome modal.
  useEffect(() => {
    if (typeof window === "undefined") {
      setStep(-1);
      return;
    }
    try {
      const seen = window.localStorage.getItem(SEEN_KEY);
      setStep(seen === "1" ? -1 : -2);
    } catch {
      setStep(-1);
    }
  }, []);

  const markSeen = useCallback(() => {
    try {
      window.localStorage.setItem(SEEN_KEY, "1");
    } catch {
      // Storage blocked, fine - just don't persist.
    }
  }, []);

  const startTour = useCallback(() => {
    setStep(0);
  }, []);

  const skipTour = useCallback(() => {
    setStep(-1);
    markSeen();
  }, [markSeen]);

  const finish = useCallback(() => {
    setStep(-1);
    markSeen();
  }, [markSeen]);

  const nextStep = useCallback(() => {
    setStep((s) => {
      if (s < 0) return s;
      const next = s + 1;
      if (next >= totalSteps) {
        markSeen();
        return -1;
      }
      return next;
    });
  }, [totalSteps, markSeen]);

  const prevStep = useCallback(() => {
    setStep((s) => (s > 0 ? s - 1 : s));
  }, []);

  const setTotalSteps = useCallback((n: number) => {
    setTotalStepsState(n);
  }, []);

  const value = useMemo<TourContextValue>(
    () => ({
      step,
      hasSeenTour: step === -1,
      totalSteps,
      startTour,
      skipTour,
      nextStep,
      prevStep,
      setTotalSteps,
      finish,
    }),
    [
      step,
      totalSteps,
      startTour,
      skipTour,
      nextStep,
      prevStep,
      setTotalSteps,
      finish,
    ]
  );

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}
