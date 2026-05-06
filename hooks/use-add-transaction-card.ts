import { useCallback, useMemo, useState } from 'react';

import {
  buildTransactionSeries,
  DraftTransaction,
  isDraftSubmittable,
  makeInitialDraft,
  makeInitialRepeatConfig,
  RepeatConfig,
  RepeatEndMode,
  RepeatPeriod,
  sanitizeAmountDigits,
  Transaction,
  TransactionMode,
} from '@/components/add-transaction-card.presenter';
import { useCategories } from '@/contexts/categories-context';

export type UseAddTransactionCardOptions = {
  onSubmit?: (transactions: Transaction[]) => void;
};

export function useAddTransactionCard(options: UseAddTransactionCardOptions = {}) {
  const { onSubmit } = options;
  const {
    categories,
    addCategory: addCategoryToStore,
    deleteCategory: deleteCategoryFromStore,
  } = useCategories();

  const [draft, setDraft] = useState<DraftTransaction>(makeInitialDraft);
  const [repeat, setRepeat] = useState<RepeatConfig>(() => makeInitialRepeatConfig());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);
  const [isRepeatSheetOpen, setIsRepeatSheetOpen] = useState(false);
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
    const created = addCategoryToStore(newCategoryName);
    if (created) setNewCategoryName('');
  }, [addCategoryToStore, newCategoryName]);

  const deleteCategory = useCallback(
    (id: string) => {
      deleteCategoryFromStore(id);
      setDraft((d) => (d.categoryId === id ? { ...d, categoryId: null } : d));
    },
    [deleteCategoryFromStore],
  );

  const openRepeatSheet = useCallback(() => setIsRepeatSheetOpen(true), []);
  const closeRepeatSheet = useCallback(() => setIsRepeatSheetOpen(false), []);

  const setRepeatEnabled = useCallback((enabled: boolean) => {
    setRepeat((r) => ({ ...r, enabled }));
  }, []);

  const setRepeatEvery = useCallback((every: number) => {
    setRepeat((r) => ({ ...r, every: Math.max(1, Math.floor(every || 1)) }));
  }, []);

  const setRepeatPeriod = useCallback((period: RepeatPeriod) => {
    setRepeat((r) => ({ ...r, period }));
  }, []);

  const setRepeatEndMode = useCallback((endMode: RepeatEndMode) => {
    setRepeat((r) => ({ ...r, endMode }));
  }, []);

  const setRepeatEndDate = useCallback((endDate: Date) => {
    setRepeat((r) => ({ ...r, endDate }));
  }, []);

  const setRepeatCount = useCallback((count: number) => {
    setRepeat((r) => ({ ...r, count: Math.max(1, Math.floor(count || 1)) }));
  }, []);

  const canSubmit = useMemo(() => isDraftSubmittable(draft), [draft]);

  const submit = useCallback(() => {
    if (!isDraftSubmittable(draft)) return;
    const series = buildTransactionSeries(draft, repeat);
    onSubmit?.(series);
    setDraft({ ...makeInitialDraft(), mode: draft.mode });
    setRepeat(makeInitialRepeatConfig());
    setIsDatePickerOpen(false);
  }, [draft, repeat, onSubmit]);

  return {
    draft,
    repeat,
    categories,
    selectedCategory,
    isDatePickerOpen,
    isCategorySheetOpen,
    isRepeatSheetOpen,
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
    openRepeatSheet,
    closeRepeatSheet,
    setRepeatEnabled,
    setRepeatEvery,
    setRepeatPeriod,
    setRepeatEndMode,
    setRepeatEndDate,
    setRepeatCount,
    submit,
  };
}
