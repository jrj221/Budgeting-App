import { Transaction } from '@/components/add-transaction-card.presenter';

export type BudgetWindow = 'week' | 'month';

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function getWindowRange(window: BudgetWindow, ref: Date): { start: Date; end: Date } {
  if (window === 'week') {
    const start = startOfDay(ref);
    start.setDate(start.getDate() - start.getDay()); // Sunday
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }
  const start = new Date(ref.getFullYear(), ref.getMonth(), 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export type BudgetUsage = { actualCents: number; plannedCents: number };

export function computeUsage(
  transactions: Transaction[],
  categoryId: string,
  window: BudgetWindow,
  ref: Date = new Date(),
): BudgetUsage {
  const { start, end } = getWindowRange(window, ref);
  const startMs = start.getTime();
  const endMs = end.getTime();
  const todayEndMs = endOfDay(ref).getTime();

  let actualCents = 0;
  let plannedCents = 0;

  for (const tx of transactions) {
    if (tx.mode !== 'spent') continue;
    if (tx.categoryId !== categoryId) continue;
    const ms = new Date(tx.date).getTime();
    if (ms < startMs || ms > endMs) continue;
    if (ms <= todayEndMs) actualCents += tx.amountCents;
    else plannedCents += tx.amountCents;
  }
  return { actualCents, plannedCents };
}
