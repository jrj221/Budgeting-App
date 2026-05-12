import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TransactionsProvider, useTransactions } from '../../contexts/transactions-context';
import type { Transaction } from '../../components/add-transaction-card.presenter';

function makeTx(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: `tx-${Math.random().toString(36).slice(2)}`,
    seriesId: null,
    mode: 'spent',
    amountCents: 1000,
    title: 'Test',
    date: new Date().toISOString(),
    categoryId: null,
    ...overrides,
  };
}

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TransactionsProvider>{children}</TransactionsProvider>
);

beforeEach(() => {
  jest.clearAllMocks();
  (AsyncStorage as any)._store && Object.keys((AsyncStorage as any)._store).forEach((k) => delete (AsyncStorage as any)._store[k]);
});

describe('TransactionsProvider', () => {
  it('starts with empty transactions', async () => {
    const { result } = renderHook(() => useTransactions(), { wrapper });
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    expect(result.current.transactions).toEqual([]);
  });

  it('hydrates from AsyncStorage on mount', async () => {
    const stored: Transaction[] = [makeTx({ id: 'tx-stored' })];
    await AsyncStorage.setItem('budget:transactions', JSON.stringify(stored));

    const { result } = renderHook(() => useTransactions(), { wrapper });
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    expect(result.current.transactions).toHaveLength(1);
    expect(result.current.transactions[0].id).toBe('tx-stored');
  });

  it('addTransactions adds to list', async () => {
    const { result } = renderHook(() => useTransactions(), { wrapper });
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    const tx = makeTx({ id: 'tx-1' });
    act(() => { result.current.addTransactions([tx]); });

    expect(result.current.transactions).toHaveLength(1);
    expect(result.current.transactions[0].id).toBe('tx-1');
  });

  it('updateTransaction updates a single tx', async () => {
    const { result } = renderHook(() => useTransactions(), { wrapper });
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    const tx = makeTx({ id: 'tx-a', title: 'Before' });
    act(() => { result.current.addTransactions([tx]); });
    act(() => { result.current.updateTransaction('tx-a', { title: 'After' }); });

    expect(result.current.transactions[0].title).toBe('After');
  });

  it('deleteTransaction removes a tx', async () => {
    const { result } = renderHook(() => useTransactions(), { wrapper });
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    const tx = makeTx({ id: 'tx-del' });
    act(() => { result.current.addTransactions([tx]); });
    act(() => { result.current.deleteTransaction('tx-del'); });

    expect(result.current.transactions).toHaveLength(0);
  });

  it('deleteTransactionAndFuture removes target and future series members', async () => {
    const { result } = renderHook(() => useTransactions(), { wrapper });
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    const seriesId = 'series-1';
    const past = makeTx({ id: 'tx-past', seriesId, date: new Date(2024, 0, 1).toISOString() });
    const target = makeTx({ id: 'tx-target', seriesId, date: new Date(2024, 0, 8).toISOString() });
    const future = makeTx({ id: 'tx-future', seriesId, date: new Date(2024, 0, 15).toISOString() });

    act(() => { result.current.addTransactions([past, target, future]); });
    act(() => { result.current.deleteTransactionAndFuture('tx-target'); });

    const ids = result.current.transactions.map((t) => t.id);
    expect(ids).toContain('tx-past');
    expect(ids).not.toContain('tx-target');
    expect(ids).not.toContain('tx-future');
  });

  it('clearAll empties all transactions', async () => {
    const { result } = renderHook(() => useTransactions(), { wrapper });
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    act(() => { result.current.addTransactions([makeTx(), makeTx()]); });
    act(() => { result.current.clearAll(); });

    expect(result.current.transactions).toHaveLength(0);
  });

  it('persists to AsyncStorage after hydration', async () => {
    const { result } = renderHook(() => useTransactions(), { wrapper });
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    const tx = makeTx({ id: 'tx-persist' });
    act(() => { result.current.addTransactions([tx]); });

    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'budget:transactions',
        expect.stringContaining('tx-persist'),
      );
    });
  });
});
