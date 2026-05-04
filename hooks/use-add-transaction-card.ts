import { useCallback, useMemo, useState } from 'react';

import {
  buildTransaction,
  Category,
  createCategory,
  DEFAULT_CATEGORIES,
  DraftTransaction,
  isCategoryNameValid,
  isDraftSubmittable,
  makeInitialDraft,
  sanitizeAmountDigits,
  Transaction,
  TransactionMode,
} from '@/components/add-transaction-card.presenter';

export type UseAddTransactionCardOptions = {
  onSubmit?: (transaction: Transaction) => void;
};

export function useAddTransactionCard(options: UseAddTransactionCardOptions = {}) {
  const { onSubmit } = options;

  const [draft, setDraft] = useState<DraftTransaction>(makeInitialDraft);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);
  const [isEditingCategories, setIsEditingCategories] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const setMode = useCallback((mode: TransactionMode) => {
    setDraft((d) => ({ ...d, mode }));
  }, []);

  const setAmountFromInput = useCallback((input: string) => {
    setDraft((d) => ({ ...d, amountDigits: sanitizeAmountDigits(input) }));
  }, []);

  const setTitle = useCallback((title: string) => {
    setDraft((d) => ({ ...d, title }));
  }, []);

  const setDate = useCallback((date: Date) => {
    setDraft((d) => ({ ...d, date }));
  }, []);

  const toggleDatePicker = useCallback(() => {
    setIsDatePickerOpen((v) => !v);
  }, []);

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === draft.categoryId) ?? null,
    [categories, draft.categoryId],
  );

  const openCategorySheet = useCallback(() => {
    setIsCategorySheetOpen(true);
  }, []);

  const closeCategorySheet = useCallback(() => {
    setIsCategorySheetOpen(false);
    setIsEditingCategories(false);
    setNewCategoryName('');
  }, []);

  const selectCategory = useCallback((id: string | null) => {
    setDraft((d) => ({ ...d, categoryId: id }));
  }, []);

  const toggleEditCategories = useCallback(() => {
    setIsEditingCategories((v) => !v);
  }, []);

  const addCategory = useCallback(() => {
    let added = false;
    setCategories((existing) => {
      if (!isCategoryNameValid(newCategoryName, existing)) return existing;
      added = true;
      return [...existing, createCategory(newCategoryName)];
    });
    if (added) setNewCategoryName('');
  }, [newCategoryName]);

  const deleteCategory = useCallback((id: string) => {
    setCategories((existing) => existing.filter((c) => c.id !== id));
    setDraft((d) => (d.categoryId === id ? { ...d, categoryId: null } : d));
  }, []);

  const canSubmit = useMemo(() => isDraftSubmittable(draft), [draft]);

  const submit = useCallback(() => {
    if (!isDraftSubmittable(draft)) return;
    const tx = buildTransaction(draft);
    onSubmit?.(tx);
    setDraft({ ...makeInitialDraft(), mode: draft.mode });
    setIsDatePickerOpen(false);
  }, [draft, onSubmit]);

  return {
    draft,
    categories,
    selectedCategory,
    isDatePickerOpen,
    isCategorySheetOpen,
    isEditingCategories,
    newCategoryName,
    canSubmit,
    setMode,
    setAmountFromInput,
    setTitle,
    setDate,
    toggleDatePicker,
    openCategorySheet,
    closeCategorySheet,
    selectCategory,
    toggleEditCategories,
    addCategory,
    deleteCategory,
    setNewCategoryName,
    submit,
  };
}
