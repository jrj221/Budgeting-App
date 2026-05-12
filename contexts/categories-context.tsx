import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  Category,
  createCategory,
  DEFAULT_CATEGORIES,
  isCategoryNameValid,
} from '@/components/add-transaction-card.presenter';
import { pickNextCategoryColor } from '@/constants/colors';
import { STORAGE_KEYS } from '@/storage/keys';

type CategoriesContextValue = {
  categories: Category[];
  hydrated: boolean;
  addCategory: (name: string, color?: string, isGoal?: boolean) => Category | null;
  deleteCategory: (id: string) => void;
  renameCategory: (id: string, name: string) => void;
  setCategoryColor: (id: string, color: string) => void;
  setCategoryBudget: (
    id: string,
    weeklyCents: number | null,
    monthlyOverrideCents: number | null,
  ) => void;
  replaceAll: (cats: Category[]) => void;
  getCategory: (id: string | null) => Category | null;
};

const CategoriesContext = createContext<CategoriesContextValue | null>(null);

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from storage on mount
  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEYS.CATEGORIES)
      .then((raw) => {
        if (cancelled) return;
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as Category[];
            // Forward-compat: fill in any missing fields
            const safe = parsed.map((c) => ({
              id: c.id ?? '',
              name: c.name ?? '',
              color: c.color ?? '#888888',
              weeklyBudgetCents: c.weeklyBudgetCents ?? null,
              monthlyOverrideCents: c.monthlyOverrideCents ?? null,
              isGoal: c.isGoal ?? false,
            }));
            setCategories(safe);
          } catch {
            // corrupt — keep defaults
          }
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
    AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories)).catch(() => {});
  }, [categories, hydrated]);

  const addCategory = useCallback(
    (name: string, color?: string, isGoal = false): Category | null => {
      // Validate synchronously against the current snapshot of categories.
      if (!isCategoryNameValid(name, categories)) return null;
      const finalColor = color ?? pickNextCategoryColor(categories.map((c) => c.color));
      const created = createCategory(name, finalColor, isGoal);
      setCategories((existing) => {
        // Re-validate inside updater to guard against concurrent adds.
        if (!isCategoryNameValid(name, existing)) return existing;
        return [...existing, created];
      });
      return created;
    },
    [categories],
  );

  const deleteCategory = useCallback((id: string) => {
    setCategories((existing) => existing.filter((c) => c.id !== id));
  }, []);

  const renameCategory = useCallback((id: string, name: string) => {
    const trimmed = name.trim();
    if (trimmed.length === 0) return;
    setCategories((existing) =>
      existing.map((c) => (c.id === id ? { ...c, name: trimmed } : c)),
    );
  }, []);

  const setCategoryColor = useCallback((id: string, color: string) => {
    setCategories((existing) =>
      existing.map((c) => (c.id === id ? { ...c, color } : c)),
    );
  }, []);

  const setCategoryBudget = useCallback(
    (id: string, weeklyCents: number | null, monthlyOverrideCents: number | null) => {
      setCategories((existing) =>
        existing.map((c) =>
          c.id === id
            ? {
                ...c,
                weeklyBudgetCents: weeklyCents,
                monthlyOverrideCents,
              }
            : c,
        ),
      );
    },
    [],
  );

  const replaceAll = useCallback((cats: Category[]) => setCategories(cats), []);

  const getCategory = useCallback(
    (id: string | null) => (id ? categories.find((c) => c.id === id) ?? null : null),
    [categories],
  );

  const value = useMemo(
    () => ({
      categories,
      hydrated,
      addCategory,
      deleteCategory,
      renameCategory,
      setCategoryColor,
      setCategoryBudget,
      replaceAll,
      getCategory,
    }),
    [
      categories,
      hydrated,
      addCategory,
      deleteCategory,
      renameCategory,
      setCategoryColor,
      setCategoryBudget,
      replaceAll,
      getCategory,
    ],
  );

  return <CategoriesContext.Provider value={value}>{children}</CategoriesContext.Provider>;
}

export function useCategories() {
  const ctx = useContext(CategoriesContext);
  if (!ctx) throw new Error('useCategories must be used inside CategoriesProvider');
  return ctx;
}
