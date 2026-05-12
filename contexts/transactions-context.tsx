import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

import { Transaction } from '@/components/add-transaction-card.presenter';

type TransactionPatch = Partial<Pick<Transaction, 'mode' | 'amountCents' | 'title' | 'date' | 'categoryId'>>;

type TransactionsContextValue = {
  transactions: Transaction[];
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
