import { getWindowRange, computeUsage } from '../../utils/budget-calc';
import type { Transaction } from '../../components/add-transaction-card.presenter';

describe('getWindowRange', () => {
  it('week range starts on Sunday', () => {
    const wednesday = new Date(2024, 0, 10); // Jan 10 2024 = Wednesday
    const { start, end } = getWindowRange('week', wednesday);
    expect(start.getDay()).toBe(0); // Sunday
    expect(end.getDay()).toBe(6); // Saturday
  });

  it('week range is 7 days', () => {
    const ref = new Date(2024, 0, 10);
    const { start, end } = getWindowRange('week', ref);
    const diff = end.getTime() - start.getTime();
    // ~7 days in ms (accounting for time part)
    expect(diff).toBeGreaterThan(6 * 24 * 60 * 60 * 1000);
    expect(diff).toBeLessThan(8 * 24 * 60 * 60 * 1000);
  });

  it('month range starts on the 1st', () => {
    const mid = new Date(2024, 2, 15); // March 15
    const { start } = getWindowRange('month', mid);
    expect(start.getDate()).toBe(1);
    expect(start.getMonth()).toBe(2);
  });

  it('month range ends on last day', () => {
    const mid = new Date(2024, 1, 15); // Feb 15 (leap year 2024)
    const { end } = getWindowRange('month', mid);
    expect(end.getDate()).toBe(29);
  });
});

describe('computeUsage', () => {
  const ref = new Date(2024, 0, 10, 12, 0, 0); // Jan 10 (Wed)

  function makeTx(overrides: Partial<Transaction>): Transaction {
    return {
      id: 'tx1',
      seriesId: null,
      mode: 'spent',
      amountCents: 1000,
      title: 'Test',
      date: new Date(2024, 0, 10).toISOString(),
      categoryId: 'food',
      ...overrides,
    };
  }

  it('sums actual spending in window', () => {
    const txs = [makeTx({ amountCents: 500 }), makeTx({ amountCents: 300 })];
    const usage = computeUsage(txs, 'food', 'week', ref);
    expect(usage.actualCents).toBe(800);
  });

  it('ignores different category', () => {
    const txs = [makeTx({ categoryId: 'gas' })];
    const usage = computeUsage(txs, 'food', 'week', ref);
    expect(usage.actualCents).toBe(0);
  });

  it('ignores earned transactions', () => {
    const txs = [makeTx({ mode: 'earned', amountCents: 5000 })];
    const usage = computeUsage(txs, 'food', 'week', ref);
    expect(usage.actualCents).toBe(0);
  });

  it('separates planned (future) spending', () => {
    const futureDate = new Date(2024, 0, 13, 12, 0, 0); // future within the week
    const txs = [makeTx({ date: futureDate.toISOString(), amountCents: 2000 })];
    const usage = computeUsage(txs, 'food', 'week', ref);
    expect(usage.plannedCents).toBe(2000);
    expect(usage.actualCents).toBe(0);
  });

  it('ignores transactions outside window', () => {
    const outsideDate = new Date(2024, 0, 1).toISOString(); // last month-ish
    const txs = [makeTx({ date: outsideDate })];
    const usage = computeUsage(txs, 'food', 'week', ref);
    expect(usage.actualCents).toBe(0);
    expect(usage.plannedCents).toBe(0);
  });
});
