import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

import { Transaction } from '@/components/add-transaction-card.presenter';
import { useCategories } from '@/contexts/categories-context';
import { useTransactions } from '@/contexts/transactions-context';
import { computeGoalDerived, Goal, GoalDraft } from '@/utils/goal-calc';

function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

type GoalsContextValue = {
  goals: Goal[];
  addGoal: (draft: GoalDraft) => Goal | null;
  updateGoal: (id: string, draft: GoalDraft) => Goal | null;
  deleteGoal: (id: string) => void;
  contributeToGoal: (id: string, cents: number) => void;
  withdrawFromGoal: (id: string, cents: number) => void;
  getGoalByCategory: (categoryId: string | null) => Goal | null;
};

const GoalsContext = createContext<GoalsContextValue | null>(null);

export function GoalsProvider({ children }: { children: ReactNode }) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const { addCategory, deleteCategory, renameCategory, setCategoryColor } = useCategories();
  const { addTransactions, transactions } = useTransactions();

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
      addGoal,
      updateGoal,
      deleteGoal,
      contributeToGoal,
      withdrawFromGoal,
      getGoalByCategory,
    }),
    [
      goals,
      addGoal,
      updateGoal,
      deleteGoal,
      contributeToGoal,
      withdrawFromGoal,
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
