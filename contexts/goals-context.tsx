import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { Transaction } from '@/components/add-transaction-card.presenter';
import { useCategories } from '@/contexts/categories-context';
import { useTransactions } from '@/contexts/transactions-context';
import { STORAGE_KEYS } from '@/storage/keys';
import { computeGoalDerived, Goal, GoalDraft } from '@/utils/goal-calc';

function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

type GoalsContextValue = {
  goals: Goal[];
  hydrated: boolean;
  addGoal: (draft: GoalDraft) => Goal | null;
  updateGoal: (id: string, draft: GoalDraft) => Goal | null;
  deleteGoal: (id: string) => void;
  contributeToGoal: (id: string, cents: number) => void;
  withdrawFromGoal: (id: string, cents: number) => void;
  replaceAll: (gs: Goal[]) => void;
  clearAll: () => void;
  getGoalByCategory: (categoryId: string | null) => Goal | null;
};

const GoalsContext = createContext<GoalsContextValue | null>(null);

export function GoalsProvider({ children }: { children: ReactNode }) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const { addCategory, deleteCategory, renameCategory, setCategoryColor } = useCategories();
  const { addTransactions, transactions } = useTransactions();

  // Hydrate from storage on mount
  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEYS.GOALS)
      .then((raw) => {
        if (cancelled) return;
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as Goal[];
            // Forward-compat: fill in any missing fields
            const safe = parsed.map((g) => ({
              id: g.id ?? '',
              name: g.name ?? '',
              targetCents: g.targetCents ?? 0,
              weeklyContributionCents: g.weeklyContributionCents ?? 0,
              weeksTarget: g.weeksTarget ?? 0,
              categoryId: g.categoryId ?? '',
              createdAt: g.createdAt ?? new Date().toISOString(),
              creationMode: g.creationMode ?? 'fromWeekly',
            }));
            setGoals(safe);
          } catch {
            // corrupt — start fresh
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
    AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals)).catch(() => {});
  }, [goals, hydrated]);

  const addGoal = useCallback(
    (draft: GoalDraft): Goal | null => {
      const cat = addCategory(draft.name, draft.color, true);
      if (!cat) return null;
      const derived = computeGoalDerived(draft);
      const goal: Goal = {
        id: generateId('goal'),
        name: draft.name.trim(),
        targetCents: Math.max(0, Math.round(draft.targetCents)),
        weeklyContributionCents: derived.weeklyCents,
        weeksTarget: derived.weeks,
        categoryId: cat.id,
        createdAt: new Date().toISOString(),
        creationMode: draft.mode,
      };
      setGoals((g) => [...g, goal]);
      return goal;
    },
    [addCategory],
  );

  const updateGoal = useCallback(
    (id: string, draft: GoalDraft): Goal | null => {
      const existing = goals.find((g) => g.id === id);
      if (!existing) return null;
      const derived = computeGoalDerived(draft);
      const updated: Goal = {
        ...existing,
        name: draft.name.trim(),
        targetCents: Math.max(0, Math.round(draft.targetCents)),
        weeklyContributionCents: derived.weeklyCents,
        weeksTarget: derived.weeks,
        creationMode: draft.mode,
      };
      setGoals((g) => g.map((x) => (x.id === id ? updated : x)));
      renameCategory(existing.categoryId, draft.name);
      setCategoryColor(existing.categoryId, draft.color);
      return updated;
    },
    [goals, renameCategory, setCategoryColor],
  );

  const deleteGoal = useCallback(
    (id: string) => {
      const goal = goals.find((g) => g.id === id);
      if (!goal) return;
      let net = 0;
      for (const tx of transactions) {
        if (tx.categoryId !== goal.categoryId) continue;
        if (tx.mode === 'spent') net += tx.amountCents;
        else if (tx.mode === 'earned') net -= tx.amountCents;
      }
      if (net > 0) {
        addTransactions([
          {
            id: generateId('tx'),
            seriesId: null,
            mode: 'earned',
            amountCents: net,
            title: `Returned from ${goal.name}`,
            date: new Date().toISOString(),
            categoryId: null,
          },
        ]);
      }
      setGoals((g) => g.filter((x) => x.id !== id));
      deleteCategory(goal.categoryId);
    },
    [goals, transactions, addTransactions, deleteCategory],
  );

  const contributeToGoal = useCallback(
    (id: string, cents: number) => {
      const goal = goals.find((g) => g.id === id);
      if (!goal || cents <= 0) return;
      const tx: Transaction = {
        id: generateId('tx'),
        seriesId: null,
        mode: 'spent',
        amountCents: Math.round(cents),
        title: `Save toward ${goal.name}`,
        date: new Date().toISOString(),
        categoryId: goal.categoryId,
      };
      addTransactions([tx]);
    },
    [goals, addTransactions],
  );

  const withdrawFromGoal = useCallback(
    (id: string, cents: number) => {
      const goal = goals.find((g) => g.id === id);
      if (!goal || cents <= 0) return;
      const tx: Transaction = {
        id: generateId('tx'),
        seriesId: null,
        mode: 'earned',
        amountCents: Math.round(cents),
        title: `Withdraw from ${goal.name}`,
        date: new Date().toISOString(),
        categoryId: goal.categoryId,
      };
      addTransactions([tx]);
    },
    [goals, addTransactions],
  );

  const replaceAll = useCallback((gs: Goal[]) => setGoals(gs), []);

  const clearAll = useCallback(() => {
    setGoals((current) => {
      for (const g of current) deleteCategory(g.categoryId);
      return [];
    });
  }, [deleteCategory]);

  const getGoalByCategory = useCallback(
    (categoryId: string | null) => {
      if (!categoryId) return null;
      return goals.find((g) => g.categoryId === categoryId) ?? null;
    },
    [goals],
  );

  const value = useMemo(
    () => ({
      goals,
      hydrated,
      addGoal,
      updateGoal,
      deleteGoal,
      contributeToGoal,
      withdrawFromGoal,
      replaceAll,
      clearAll,
      getGoalByCategory,
    }),
    [
      goals,
      hydrated,
      addGoal,
      updateGoal,
      deleteGoal,
      contributeToGoal,
      withdrawFromGoal,
      replaceAll,
      clearAll,
      getGoalByCategory,
    ],
  );

  return <GoalsContext.Provider value={value}>{children}</GoalsContext.Provider>;
}

export function useGoals() {
  const ctx = useContext(GoalsContext);
  if (!ctx) throw new Error('useGoals must be used inside GoalsProvider');
  return ctx;
}
