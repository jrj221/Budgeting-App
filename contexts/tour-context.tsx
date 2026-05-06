import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

export type TourStep =
  | { kind: 'info'; title: string; body: string; tabIndex: number }
  | { kind: 'tap-tab'; title: string; body: string; tabIndex: number; expectedPath: string }
  | { kind: 'budget-setup'; title: string; body: string };

export const TOUR_STEPS: TourStep[] = [
  {
    kind: 'info',
    title: "You're on Home",
    body: 'This is where you add a transaction — tap the amount, name it, set a category and a date.',
    tabIndex: 0,
  },
  {
    kind: 'budget-setup',
    title: 'Set a weekly budget',
    body: 'Pick how much you want to spend per category. Monthly defaults to weekly × 4 — toggle to manual to set it yourself.',
  },
  {
    kind: 'tap-tab',
    title: 'Tap Overview',
    body: 'Charts of where your money is going and a projection going forward.',
    tabIndex: 1,
    expectedPath: '/overview',
  },
  {
    kind: 'tap-tab',
    title: 'Tap History',
    body: 'Every past and upcoming transaction. Tap any row to edit or delete it.',
    tabIndex: 2,
    expectedPath: '/history',
  },
  {
    kind: 'tap-tab',
    title: 'Tap Settings',
    body: 'Color schemes, sample data, and reset.',
    tabIndex: 3,
    expectedPath: '/settings',
  },
  {
    kind: 'tap-tab',
    title: 'Back to Home',
    body: 'Tap Home to add your first transaction.',
    tabIndex: 0,
    expectedPath: '/',
  },
];

type TourContextValue = {
  stepIndex: number | null;
  totalSteps: number;
  startTour: () => void;
  advance: () => void;
  skip: () => void;
};

const TourContext = createContext<TourContextValue | null>(null);

export function TourProvider({ children }: { children: ReactNode }) {
  const [stepIndex, setStepIndex] = useState<number | null>(null);

  const startTour = useCallback(() => setStepIndex(0), []);
  const skip = useCallback(() => setStepIndex(null), []);

  const advance = useCallback(() => {
    setStepIndex((idx) => {
      if (idx === null) return null;
      const next = idx + 1;
      return next >= TOUR_STEPS.length ? null : next;
    });
  }, []);

  const value = useMemo(
    () => ({
      stepIndex,
      totalSteps: TOUR_STEPS.length,
      startTour,
      advance,
      skip,
    }),
    [stepIndex, startTour, advance, skip],
  );

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error('useTour must be used inside TourProvider');
  return ctx;
}
