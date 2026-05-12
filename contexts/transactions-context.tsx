import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { Transaction } from '@/components/add-transaction-card.presenter';
import { STORAGE_KEYS } from '@/storage/keys';

type TransactionPatch = Partial<Pick<Transaction, 'mode' | 'amountCents' | 'title' | 'date' | 'categoryId'>>;

type TransactionsContextValue = {
  transactions: Transaction[];
  hydrated: boolean;
  addTransactions: (txs: Transaction[]) => void;
  updateTransaction: (id: string, patch: TransactionPatch) => void;
  updateTransactionAndFuture: (id: string, patch: TransactionPatch) => void;
  deleteTransaction: (id: string) => void;
  deleteTransactionAndFuture: (id: string) => void;
  replaceAll: (txs: Transaction[]) => void;
  clearAll: () => void;
};

const TransactionsContext = createContext<TransactionsContextValue | null>(null);

export function TransactionsProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from storage on mount
  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS)
      .then((raw) => {
        if (cancelled) return;
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as Transaction[];
            // Forward-compat: fill in any missing fields
            const safe = parsed.map((tx) => ({
              id: tx.id ?? '',
              seriesId: tx.seriesId ?? null,
              mode: tx.mode ?? 'spent',
              amountCents: tx.amountCents ?? 0,
              title: tx.title ?? '',
              date: tx.date ?? new Date().toISOString(),
              categoryId: tx.categoryId ?? null,
            }));
            setTransactions(safe);
          } catch {
            // corrupt data — start fresh
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
    AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions)).catch(() => {});
  }, [transactions, hydrated]);

  const addTransactions = useCallback((txs: Transaction[]) => {
    if (txs.length === 0) return;
    setTransactions((existing) => [...existing, ...txs]);
  }, []);

  const updateTransaction = useCallback((id: string, patch: TransactionPatch) => {
    setTransactions((existing) =>
      existing.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    );
  }, []);

  const updateTransactionAndFuture = useCallback((id: string, patch: TransactionPatch) => {
    setTransactions((existing) => {
      const target = existing.find((t) => t.id === id);
      if (!target) return existing;
      const seriesId = target.seriesId;
      const fromTime = new Date(target.date).getTime();
      return existing.map((t) => {
        if (t.id === id) return { ...t, ...patch };
        if (
          seriesId &&
          t.seriesId === seriesId &&
          new Date(t.date).getTime() >= fromTime
        ) {
          // For future siblings, never overwrite their date — only the editable fields.
          const { date: _, ...rest } = patch;
          void _;
          return { ...t, ...rest };
        }
        return t;
      });
    });
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions((existing) => existing.filter((t) => t.id !== id));
  }, []);

  const deleteTransactionAndFuture = useCallback((id: string) => {
    setTransactions((existing) => {
      const target = existing.find((t) => t.id === id);
      if (!target) return existing;
      const fromTime = new Date(target.date).getTime();
      const seriesId = target.seriesId;
      return existing.filter((t) => {
        if (t.id === id) return false;
        if (
          seriesId &&
          t.seriesId === seriesId &&
          new Date(t.date).getTime() >= fromTime
        ) {
          return false;
        }
        return true;
      });
    });
  }, []);

  const replaceAll = useCallback((txs: Transaction[]) => setTransactions(txs), []);

  const clearAll = useCallback(() => setTransactions([]), []);

  const value = useMemo(
    () => ({
      transactions,
      hydrated,
      addTransactions,
      updateTransaction,
      updateTransactionAndFuture,
      deleteTransaction,
      deleteTransactionAndFuture,
      replaceAll,
      clearAll,
    }),
    [
      transactions,
      hydrated,
      addTransactions,
      updateTransaction,
      updateTransactionAndFuture,
      deleteTransaction,
      deleteTransactionAndFuture,
      replaceAll,
      clearAll,
    ],
  );

  return <TransactionsContext.Provider value={value}>{children}</TransactionsContext.Provider>;
}

export function useTransactions() {
  const ctx = useContext(TransactionsContext);
  if (!ctx) throw new Error('useTransactions must be used inside TransactionsProvider');
  return ctx;
}
