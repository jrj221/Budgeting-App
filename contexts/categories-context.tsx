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
  addCategory: (name: string) => Category | null;
  deleteCategory: (id: string) => void;
  getCategory: (id: string | null) => Category | null;
};

const CategoriesContext = createContext<CategoriesContextValue | null>(null);

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);

  const addCategory = useCallback((name: string): Category | null => {
    let created: Category | null = null;
    setCategories((existing) => {
      if (!isCategoryNameValid(name, existing)) return existing;
      const color = pickNextCategoryColor(existing.map((c) => c.color));
      created = createCategory(name, color);
      return [...existing, created];
    });
    return created;
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setCategories((existing) => existing.filter((c) => c.id !== id));
  }, []);

  const getCategory = useCallback(
    (id: string | null) => (id ? categories.find((c) => c.id === id) ?? null : null),
    [categories],
  );

  const value = useMemo(
    () => ({ categories, addCategory, deleteCategory, getCategory }),
    [categories, addCategory, deleteCategory, getCategory],
  );

  return <CategoriesContext.Provider value={value}>{children}</CategoriesContext.Provider>;
}

export function useCategories() {
  const ctx = useContext(CategoriesContext);
  if (!ctx) throw new Error('useCategories must be used inside CategoriesProvider');
  return ctx;
}
