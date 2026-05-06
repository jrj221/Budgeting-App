import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

import { ColorScheme, COLOR_SCHEMES, DEFAULT_COLOR_SCHEME_ID } from '@/constants/colors';

type AppThemeContextValue = {
  scheme: ColorScheme;
  schemes: ColorScheme[];
  setSchemeId: (id: string) => void;
};

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [schemeId, setSchemeId] = useState<string>(DEFAULT_COLOR_SCHEME_ID);

  const scheme = useMemo(
    () => COLOR_SCHEMES.find((s) => s.id === schemeId) ?? COLOR_SCHEMES[0],
    [schemeId],
  );

  const setSchemeIdSafe = useCallback((id: string) => {
    if (COLOR_SCHEMES.some((s) => s.id === id)) setSchemeId(id);
  }, []);

  const value = useMemo(
    () => ({ scheme, schemes: COLOR_SCHEMES, setSchemeId: setSchemeIdSafe }),
    [scheme, setSchemeIdSafe],
  );

  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
}

export function useAppTheme() {
  const ctx = useContext(AppThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used inside AppThemeProvider');
  return ctx;
}
