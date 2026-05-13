import { Transaction } from '@/components/add-transaction-card.presenter';

export type SampleBudget = {
  categoryId: string;
  weeklyCents: number | null;
  monthlyOverrideCents: number | null;
};

export const SAMPLE_CATEGORY_BUDGETS: SampleBudget[] = [
  { categoryId: 'food', weeklyCents: 8000, monthlyOverrideCents: null },
  { categoryId: 'gas', weeklyCents: 6000, monthlyOverrideCents: null },
  { categoryId: 'fun', weeklyCents: 4000, monthlyOverrideCents: null },
  { categoryId: 'bills', weeklyCents: null, monthlyOverrideCents: 170000 },
];

function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function dayOffsetIso(daysOffset: number, base: Date = new Date()): string {
  const d = new Date(base);
  d.setDate(d.getDate() + daysOffset);
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
}

function monthOffsetIso(monthOffset: number, dayOfMonth: number, base: Date = new Date()): string {
  const d = new Date(base);
  d.setMonth(d.getMonth() + monthOffset, dayOfMonth);
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
}

export function generateSampleTransactions(): Transaction[] {
  const now = new Date();
  const out: Transaction[] = [];

  const oneOff = (
    daysOffset: number,
    title: string,
    amountCents: number,
    categoryId: string | null,
    mode: 'spent' | 'earned' = 'spent',
  ) => {
    out.push({
      id: makeId('tx-sample'),
      seriesId: null,
      mode,
      amountCents,
      title,
      date: dayOffsetIso(daysOffset, now),
      categoryId,
    });
  };

  oneOff(-1, 'Lunch', 1450, 'food');
  oneOff(-2, 'Coffee', 580, 'food');
  oneOff(-4, 'Groceries', 8240, 'food');
  oneOff(-7, 'Dinner out', 6200, 'food');
  oneOff(-10, 'Takeout', 1875, 'food');
  oneOff(-14, 'Coffee', 550, 'food');
  oneOff(-18, 'Groceries', 9100, 'food');
  oneOff(-22, 'Bagel', 420, 'food');

  oneOff(-3, 'Gas fill-up', 4820, 'gas');
  oneOff(-11, 'Gas fill-up', 5210, 'gas');
  oneOff(-19, 'Gas fill-up', 4720, 'gas');
  oneOff(-27, 'Gas fill-up', 5010, 'gas');

  oneOff(-5, 'Concert', 7500, 'fun');
  oneOff(-12, 'Movie', 1800, 'fun');
  oneOff(-20, 'Game', 6000, 'fun');

  // Recurring rent: 2 past + 4 future, monthly on the 1st.
  const rentSeries = makeId('series-rent');
  for (let m = -2; m <= 4; m++) {
    out.push({
      id: makeId('tx-sample'),
      seriesId: rentSeries,
      mode: 'spent',
      amountCents: 150000,
      title: 'Rent',
      date: monthOffsetIso(m, 1, now),
      categoryId: 'bills',
    });
  }

  // Biweekly paycheck: 4 past + 4 future
  const paycheckSeries = makeId('series-paycheck');
  for (let i = -4; i <= 4; i++) {
    out.push({
      id: makeId('tx-sample'),
      seriesId: paycheckSeries,
      mode: 'earned',
      amountCents: 250000,
      title: 'Paycheck',
      date: dayOffsetIso(i * 14, now),
      categoryId: null,
    });
  }

  // A few future one-offs for the projection chart
  oneOff(5, 'Streaming subscription', 1499, 'bills');
  oneOff(9, 'Concert tickets', 9500, 'fun');
  oneOff(16, 'Weekend trip', 35000, 'fun');
  oneOff(23, 'Phone bill', 6500, 'bills');

  return out;
}

export function generateSampleGoalTransactions(categoryId: string, goalName: string): Transaction[] {
  const now = new Date();
  const out: Transaction[] = [];

  const contribution = (daysOffset: number, amountCents: number) => {
    out.push({
      id: makeId('tx-sample'),
      seriesId: null,
      mode: 'spent',
      amountCents,
      title: `Save toward ${goalName}`,
      date: dayOffsetIso(daysOffset, now),
      categoryId,
    });
  };

  // Eight weeks of past contributions
  contribution(-7, 5000);
  contribution(-14, 5000);
  contribution(-21, 5000);
  contribution(-28, 5000);
  contribution(-35, 5000);
  contribution(-42, 5000);
  contribution(-49, 5000);
  contribution(-56, 5000);

  // One past withdrawal
  out.push({
    id: makeId('tx-sample'),
    seriesId: null,
    mode: 'earned',
    amountCents: 10000,
    title: `Withdraw from ${goalName}`,
    date: dayOffsetIso(-30, now),
    categoryId,
  });

  // A few future scheduled contributions
  contribution(7, 5000);
  contribution(14, 5000);
  contribution(21, 5000);

  return out;
}
