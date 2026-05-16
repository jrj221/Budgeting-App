import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CategoriesProvider } from '../../contexts/categories-context';
import { GoalsProvider } from '../../contexts/goals-context';
import { TransactionsProvider, useTransactions } from '../../contexts/transactions-context';
import { TourProvider, useTour } from '../../contexts/tour-context';
import type { Transaction } from '../../components/add-transaction-card.presenter';

function AllProviders({ children }: { children: React.ReactNode }) {
  return (
    <TransactionsProvider>
      <CategoriesProvider>
        <GoalsProvider>
          <TourProvider>{children}</TourProvider>
        </GoalsProvider>
      </CategoriesProvider>
    </TransactionsProvider>
  );
}

function useAll() {
  return { txs: useTransactions(), tour: useTour() };
}

function makeStartingBalanceTx(amountCents: number): Transaction {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(12, 0, 0, 0);
  return {
    id: `tx-starting-test`,
    seriesId: null,
    mode: 'earned',
    amountCents,
    title: 'Starting balance',
    date: yesterday.toISOString(),
    categoryId: null,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  const store = (AsyncStorage as any)._store;
  if (store) Object.keys(store).forEach((k: string) => delete store[k]);
});

describe('Tour starting balance persistence', () => {
  it('preserves starting balance after tour is skipped', async () => {
    const { result } = renderHook(() => useAll(), { wrapper: AllProviders });
    await waitFor(() => expect(result.current.txs.hydrated).toBe(true));

    const startingTx = makeStartingBalanceTx(50000);

    // Simulate welcome screen: add balance, then start tour passing the tx explicitly
    await act(async () => {
      result.current.txs.addTransactions([startingTx]);
      // startTour is called synchronously after addTransactions — state hasn't updated yet,
      // so the tx must be passed explicitly to be included in the snapshot.
      result.current.tour.startTour([startingTx]);
    });

    await waitFor(() => expect(result.current.tour.stepIndex).toBe(0));

    // Skip the tour
    await act(async () => {
      result.current.tour.skip();
    });

    await waitFor(() => expect(result.current.tour.stepIndex).toBeNull());

    const balance = result.current.txs.transactions.find(
      (tx) => tx.title === 'Starting balance' && tx.amountCents === 50000,
    );
    expect(balance).toBeDefined();
  });

  it('preserves starting balance after tour is completed', async () => {
    const { result } = renderHook(() => useAll(), { wrapper: AllProviders });
    await waitFor(() => expect(result.current.txs.hydrated).toBe(true));

    const startingTx = makeStartingBalanceTx(75000);

    await act(async () => {
      result.current.txs.addTransactions([startingTx]);
      result.current.tour.startTour([startingTx]);
    });

    await waitFor(() => expect(result.current.tour.stepIndex).toBe(0));

    // Advance through all steps
    const { totalSteps } = result.current.tour;
    for (let i = 0; i < totalSteps; i++) {
      await act(async () => { result.current.tour.advance(); });
    }

    await waitFor(() => expect(result.current.tour.stepIndex).toBeNull());

    const balance = result.current.txs.transactions.find(
      (tx) => tx.title === 'Starting balance' && tx.amountCents === 75000,
    );
    expect(balance).toBeDefined();
  });

  it('starting balance is not present when tour starts without one', async () => {
    const { result } = renderHook(() => useAll(), { wrapper: AllProviders });
    await waitFor(() => expect(result.current.txs.hydrated).toBe(true));

    // Start tour with no starting balance (user entered $0)
    await act(async () => {
      result.current.tour.startTour();
    });

    await waitFor(() => expect(result.current.tour.stepIndex).toBe(0));

    await act(async () => { result.current.tour.skip(); });
    await waitFor(() => expect(result.current.tour.stepIndex).toBeNull());

    const balance = result.current.txs.transactions.find(
      (tx) => tx.title === 'Starting balance',
    );
    expect(balance).toBeUndefined();
  });
});
