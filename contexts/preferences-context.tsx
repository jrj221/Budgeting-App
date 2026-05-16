import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { STORAGE_KEYS } from '@/storage/keys';

type Preferences = {
  requireNamedTransactions: boolean;
};

type PreferencesContextValue = {
  preferences: Preferences;
  hydrated: boolean;
  setRequireNamedTransactions: (value: boolean) => void;
};

const DEFAULT_PREFERENCES: Preferences = {
  requireNamedTransactions: true,
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEYS.PREFERENCES)
      .then((raw) => {
        if (cancelled) return;
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as Partial<Preferences>;
            setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
          } catch {
            // fallback to defaults
          }
        }
        setHydrated(true);
      })
      .catch(() => {
        if (!cancelled) setHydrated(true);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(preferences)).catch(() => {});
  }, [preferences, hydrated]);

  const setRequireNamedTransactions = useCallback((value: boolean) => {
    setPreferences((p) => ({ ...p, requireNamedTransactions: value }));
  }, []);

  const value = useMemo(
    () => ({ preferences, hydrated, setRequireNamedTransactions }),
    [preferences, hydrated, setRequireNamedTransactions],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences must be used inside PreferencesProvider');
  return ctx;
}
