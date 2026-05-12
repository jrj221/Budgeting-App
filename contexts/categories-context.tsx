import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

import {
  Category,
  createCategory,
  DEFAULT_CATEGORIES,
  isCategoryNameValid,
} from '@/components/add-transaction-card.presenter';
import { pickNextCategoryColor } from '@/constants/colors';

type CategoriesContextValue = {
  categories: Category[];
  addCategory: (name: string, color?: string) => Category | null;
  deleteCategory: (id: string) => void;
  renameCategory: (id: string, name: string) => void;
  setCategoryColor: (id: string, color: string) => void;
  setCategoryBudget: (
    id: string,
    weeklyCents: number | null,
    monthlyOverrideCents: number | null,
  ) => void;
  getCategory: (id: string | null) => Category | null;
};

const CategoriesContext = createContext<CategoriesContextValue | null>(null);

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);

  const addCategory = useCallback((name: string, color?: string): Category | null => {
    let created: Category | null = null;
    setCategories((existing) => {
      if (!isCategoryNameValid(name, existing)) return existing;
      const finalColor = color ?? pickNextCategoryColor(existing.map((c) => c.color));
      created = createCategory(name, finalColor);
      return [...existing, created];
    });
    return created;
  }, []);

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

  const getCategory = useCallback(
    (id: string | null) => (id ? categories.find((c) => c.id === id) ?? null : null),
    [categories],
  );

  const value = useMemo(
    () => ({
      categories,
      addCategory,
      deleteCategory,
      renameCategory,
      setCategoryColor,
      setCategoryBudget,
      getCategory,
    }),
    [
      categories,
      addCategory,
      deleteCategory,
      renameCategory,
      setCategoryColor,
      setCategoryBudget,
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
