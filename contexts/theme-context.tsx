import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { ColorScheme, COLOR_SCHEMES, DEFAULT_COLOR_SCHEME_ID } from '@/constants/colors';
import { STORAGE_KEYS } from '@/storage/keys';

type AppThemeContextValue = {
  scheme: ColorScheme;
  schemes: ColorScheme[];
  hydrated: boolean;
  setSchemeId: (id: string) => void;
};

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [schemeId, setSchemeId] = useState<string>(DEFAULT_COLOR_SCHEME_ID);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from storage on mount
  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEYS.SCHEME_ID)
      .then((raw) => {
        if (cancelled) return;
        if (raw && COLOR_SCHEMES.some((s) => s.id === raw)) {
          setSchemeId(raw);
        }
        setHydrated(true);
      })
      .catch(() => {
        if (!cancelled) setHydrated(true);
      });
    return () => { cancelled = true; };
  }, []);

  // Persist on every state change (only after hydration)
  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEYS.SCHEME_ID, schemeId).catch(() => {});
  }, [schemeId, hydrated]);

  const scheme = useMemo(
    () => COLOR_SCHEMES.find((s) => s.id === schemeId) ?? COLOR_SCHEMES[0],
    [schemeId],
  );

  const setSchemeIdSafe = useCallback((id: string) => {
    if (COLOR_SCHEMES.some((s) => s.id === id)) setSchemeId(id);
  }, []);

  const value = useMemo(
    () => ({ scheme, schemes: COLOR_SCHEMES, hydrated, setSchemeId: setSchemeIdSafe }),
    [scheme, hydrated, setSchemeIdSafe],
  );

  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
}

export function useAppTheme() {
  const ctx = useContext(AppThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used inside AppThemeProvider');
  return ctx;
}
