import { Transaction } from '@/components/add-transaction-card.presenter';

export type GoalCreationMode = 'fromWeekly' | 'fromWeeks';

export type Goal = {
  id: string;
  name: string;
  targetCents: number;
  weeklyContributionCents: number;
  weeksTarget: number;
  categoryId: string;
  createdAt: string;
  creationMode: GoalCreationMode;
};

export type GoalDraft = {
  name: string;
  color: string;
  targetCents: number;
  mode: GoalCreationMode;
  weeklyContributionCents: number;
  weeksTarget: number;
};

export type GoalProgress = {
  contributedCents: number;
  withdrawnCents: number;
  netCents: number;
  fractionComplete: number;
};

export function computeGoalDerived(
  draft: GoalDraft,
): { weeklyCents: number; weeks: number } {
  if (draft.mode === 'fromWeekly') {
    const weekly = Math.max(0, draft.weeklyContributionCents);
    const weeks =
      weekly > 0 && draft.targetCents > 0
        ? Math.ceil(draft.targetCents / weekly)
        : 0;
    return { weeklyCents: weekly, weeks };
  }
  const weeks = Math.max(0, draft.weeksTarget);
  const weekly =
    weeks > 0 && draft.targetCents > 0 ? Math.ceil(draft.targetCents / weeks) : 0;
  return { weeklyCents: weekly, weeks };
}

export function computeGoalProgress(
  transactions: Transaction[],
  categoryId: string,
  targetCents: number,
): GoalProgress {
  let contributed = 0;
  let withdrawn = 0;
  for (const tx of transactions) {
    if (tx.categoryId !== categoryId) continue;
    if (tx.mode === 'spent') contributed += tx.amountCents;
    else if (tx.mode === 'earned') withdrawn += tx.amountCents;
  }
  const net = contributed - withdrawn;
  const fraction = targetCents > 0 ? Math.max(0, net) / targetCents : 0;
  return {
    contributedCents: contributed,
    withdrawnCents: withdrawn,
    netCents: net,
    fractionComplete: fraction,
  };
}

export function weeksSince(createdAtIso: string, now: Date = new Date()): number {
  const start = new Date(createdAtIso);
  const diffMs = now.getTime() - start.getTime();
  return Math.max(0, diffMs / (7 * 24 * 60 * 60 * 1000));
}
