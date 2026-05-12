import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CategoriesProvider } from '../../contexts/categories-context';
import { TransactionsProvider, useTransactions } from '../../contexts/transactions-context';
import { GoalsProvider, useGoals } from '../../contexts/goals-context';
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

const draft: GoalDraft = {
  name: 'Vacation',
  color: '#3b82f6',
  targetCents: 100000,
  icon: 'tag', mode: 'fromWeekly',
  weeklyContributionCents: 5000,
  weeksTarget: 0,
};

describe('GoalsProvider', () => {
  it('starts with empty goals', async () => {
    const { result } = renderHook(() => useGoals(), { wrapper: AllProviders });
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    expect(result.current.goals).toHaveLength(0);
  });

  it('addGoal creates a goal', async () => {
    const { result } = renderHook(() => useGoals(), { wrapper: AllProviders });
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    await act(async () => { result.current.addGoal(draft); });
    await waitFor(() => expect(result.current.goals.length).toBe(1));
    expect(result.current.goals[0].name).toBe('Vacation');
  });

  it('contributeToGoal adds a spent transaction', async () => {
    const { result } = renderHook(() => useAll(), { wrapper: AllProviders });
    await waitFor(() => expect(result.current.goals.hydrated).toBe(true));
    await waitFor(() => expect(result.current.txs.hydrated).toBe(true));

    await act(async () => { result.current.goals.addGoal(draft); });
    await waitFor(() => expect(result.current.goals.goals.length).toBe(1));

    const goalId = result.current.goals.goals[0].id;
    const catId = result.current.goals.goals[0].categoryId;

    await act(async () => { result.current.goals.contributeToGoal(goalId, 1000); });
    await waitFor(() => expect(result.current.txs.transactions.length).toBeGreaterThan(0));

    const goalTxs = result.current.txs.transactions.filter(
      (tx) => tx.categoryId === catId && tx.mode === 'spent',
    );
    expect(goalTxs).toHaveLength(1);
    expect(goalTxs[0].amountCents).toBe(1000);
  });

  it('withdrawFromGoal adds an earned transaction', async () => {
    const { result } = renderHook(() => useAll(), { wrapper: AllProviders });
    await waitFor(() => expect(result.current.goals.hydrated).toBe(true));
    await waitFor(() => expect(result.current.txs.hydrated).toBe(true));

    await act(async () => { result.current.goals.addGoal(draft); });
    await waitFor(() => expect(result.current.goals.goals.length).toBe(1));

    const goalId = result.current.goals.goals[0].id;
    const catId = result.current.goals.goals[0].categoryId;

    await act(async () => { result.current.goals.withdrawFromGoal(goalId, 500); });
    await waitFor(() => expect(result.current.txs.transactions.length).toBeGreaterThan(0));

    const earned = result.current.txs.transactions.filter(
      (tx) => tx.categoryId === catId && tx.mode === 'earned',
    );
    expect(earned).toHaveLength(1);
    expect(earned[0].amountCents).toBe(500);
  });

  it('deleteGoal creates a refund transaction when net > 0', async () => {
    const { result } = renderHook(() => useAll(), { wrapper: AllProviders });
    await waitFor(() => expect(result.current.goals.hydrated).toBe(true));
    await waitFor(() => expect(result.current.txs.hydrated).toBe(true));

    await act(async () => { result.current.goals.addGoal(draft); });
    await waitFor(() => expect(result.current.goals.goals.length).toBe(1));

    const goalId = result.current.goals.goals[0].id;

    await act(async () => { result.current.goals.contributeToGoal(goalId, 3000); });
    await waitFor(() => expect(result.current.txs.transactions.length).toBeGreaterThan(0));

    await act(async () => { result.current.goals.deleteGoal(goalId); });
    await waitFor(() => expect(result.current.goals.goals).toHaveLength(0));

    const refundTx = result.current.txs.transactions.find(
      (tx) => tx.mode === 'earned' && tx.title.includes('Returned from'),
    );
    expect(refundTx).toBeDefined();
    expect(refundTx!.amountCents).toBe(3000);
  });

  it('deleteGoal with no net does not create refund', async () => {
    const { result } = renderHook(() => useAll(), { wrapper: AllProviders });
    await waitFor(() => expect(result.current.goals.hydrated).toBe(true));
    await waitFor(() => expect(result.current.txs.hydrated).toBe(true));

    await act(async () => { result.current.goals.addGoal(draft); });
    await waitFor(() => expect(result.current.goals.goals.length).toBe(1));

    const goalId = result.current.goals.goals[0].id;

    await act(async () => { result.current.goals.deleteGoal(goalId); });
    await waitFor(() => expect(result.current.goals.goals).toHaveLength(0));

    const refundTx = result.current.txs.transactions.find(
      (tx) => tx.mode === 'earned' && tx.title.includes('Returned from'),
    );
    expect(refundTx).toBeUndefined();
  });
});
