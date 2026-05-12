import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CategoriesProvider } from '../../contexts/categories-context';
import { TransactionsProvider, useTransactions } from '../../contexts/transactions-context';
import { GoalsProvider, useGoals } from '../../contexts/goals-context';
import { computeGoalProgress } from '../../utils/goal-calc';
import type { GoalDraft } from '../../utils/goal-calc';

function AllProviders({ children }: { children: React.ReactNode }) {
  return (
    <TransactionsProvider>
      <CategoriesProvider>
        <GoalsProvider>{children}</GoalsProvider>
      </CategoriesProvider>
    </TransactionsProvider>
  );
}

function useAll() {
  return { goals: useGoals(), txs: useTransactions() };
}

beforeEach(() => {
  jest.clearAllMocks();
  (AsyncStorage as any)._store && Object.keys((AsyncStorage as any)._store).forEach((k: string) => delete (AsyncStorage as any)._store[k]);
});

describe('Goal full flow integration', () => {
  const draft: GoalDraft = {
    name: 'Emergency Fund',
    color: '#10b981',
    targetCents: 50000,
    mode: 'fromWeeks', icon: 'tag',
    weeklyContributionCents: 0,
    weeksTarget: 10,
  };

  it('create → contribute → progress updates → delete → refund', async () => {
    const { result } = renderHook(() => useAll(), { wrapper: AllProviders });
    await waitFor(() => expect(result.current.goals.hydrated).toBe(true));
    await waitFor(() => expect(result.current.txs.hydrated).toBe(true));

    // 1. Create goal
    await act(async () => { result.current.goals.addGoal(draft); });
    await waitFor(() => expect(result.current.goals.goals.length).toBe(1));
    expect(result.current.goals.goals[0].name).toBe('Emergency Fund');

    const goalId = result.current.goals.goals[0].id;
    const categoryId = result.current.goals.goals[0].categoryId;
    const targetCents = result.current.goals.goals[0].targetCents;

    // 2. Contribute twice
    await act(async () => { result.current.goals.contributeToGoal(goalId, 10000); });
    await waitFor(() => expect(result.current.txs.transactions.length).toBe(1));
    await act(async () => { result.current.goals.contributeToGoal(goalId, 5000); });
    await waitFor(() => expect(result.current.txs.transactions.length).toBe(2));

    // 3. Check progress
    const progress = computeGoalProgress(
      result.current.txs.transactions,
      categoryId,
      targetCents,
    );
    expect(progress.contributedCents).toBe(15000);
    expect(progress.netCents).toBe(15000);
    expect(progress.fractionComplete).toBeCloseTo(0.3, 2);

    // 4. Withdraw some
    await act(async () => { result.current.goals.withdrawFromGoal(goalId, 2000); });
    await waitFor(() => expect(result.current.txs.transactions.length).toBe(3));
    const progress2 = computeGoalProgress(
      result.current.txs.transactions,
      categoryId,
      targetCents,
    );
    expect(progress2.netCents).toBe(13000);

    // 5. Delete goal → refund transaction created
    await act(async () => { result.current.goals.deleteGoal(goalId); });
    await waitFor(() => expect(result.current.goals.goals).toHaveLength(0));

    const refund = result.current.txs.transactions.find(
      (tx) => tx.mode === 'earned' && tx.title.includes('Returned from Emergency Fund'),
    );
    expect(refund).toBeDefined();
    expect(refund!.amountCents).toBe(13000);
    expect(refund!.categoryId).toBeNull();
  });

  it('getGoalByCategory returns the correct goal', async () => {
    const { result } = renderHook(() => useGoals(), { wrapper: AllProviders });
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    await act(async () => { result.current.addGoal(draft); });
    await waitFor(() => expect(result.current.goals.length).toBe(1));

    const goal = result.current.goals[0];
    const found = result.current.getGoalByCategory(goal.categoryId);
    expect(found?.id).toBe(goal.id);
    expect(result.current.getGoalByCategory(null)).toBeNull();
    expect(result.current.getGoalByCategory('nonexistent')).toBeNull();
  });
});
