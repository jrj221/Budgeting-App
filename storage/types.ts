/**
 * StoredData v1 — mirrors runtime types but as plain JSON-serialisable shapes.
 * Bump CURRENT_VERSION and add a migration whenever a field is added/changed/removed.
 */

export const CURRENT_VERSION = 1;

export type StoredCategory = {
  id: string;
  name: string;
  color: string;
  weeklyBudgetCents: number | null;
  monthlyOverrideCents: number | null;
  isGoal: boolean;
};

export type StoredTransaction = {
  id: string;
  seriesId: string | null;
  mode: 'spent' | 'earned';
  amountCents: number;
  title: string;
  date: string;
  categoryId: string | null;
};

export type StoredGoal = {
  id: string;
  name: string;
  targetCents: number;
  weeklyContributionCents: number;
  weeksTarget: number;
  categoryId: string;
  createdAt: string;
  creationMode: 'fromWeekly' | 'fromWeeks';
};

export type StoredData = {
  schemaVersion: number;
  transactions: StoredTransaction[];
  categories: StoredCategory[];
  goals: StoredGoal[];
  schemeId: string | null;
};
