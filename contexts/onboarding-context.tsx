import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'budget:has-seen-welcome';

type OnboardingContextValue = {
  ready: boolean;
  hasSeenWelcome: boolean;
  markWelcomeSeen: () => Promise<void>;
  resetWelcome: () => Promise<void>;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (cancelled) return;
        setHasSeenWelcome(v === '1');
        setReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const markWelcomeSeen = useCallback(async () => {
    setHasSeenWelcome(true);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // best-effort: even without persistence the flag stays for this session
    }
  }, []);

  const resetWelcome = useCallback(async () => {
    setHasSeenWelcome(false);
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {
      // best-effort
    }
  }, []);

  const value = useMemo(
    () => ({ ready, hasSeenWelcome, markWelcomeSeen, resetWelcome }),
    [ready, hasSeenWelcome, markWelcomeSeen, resetWelcome],
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used inside OnboardingProvider');
  return ctx;
}
