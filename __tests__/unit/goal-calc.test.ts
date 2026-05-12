import { computeGoalDerived, computeGoalProgress, weeksSince } from '../../utils/goal-calc';
import type { Transaction } from '../../components/add-transaction-card.presenter';

describe('computeGoalDerived', () => {
  it('fromWeekly: calculates weeks from weekly amount', () => {
    const result = computeGoalDerived({
      name: 'Test', color: '#ff0000', targetCents: 10000,
      icon: 'tag', mode: 'fromWeekly', weeklyContributionCents: 1000, weeksTarget: 0,
    });
    expect(result.weeklyCents).toBe(1000);
    expect(result.weeks).toBe(10); // ceil(10000/1000)
  });

  it('fromWeekly: weeks is 0 when weekly is 0', () => {
    const result = computeGoalDerived({
      name: 'Test', color: '#ff0000', targetCents: 10000,
      icon: 'tag', mode: 'fromWeekly', weeklyContributionCents: 0, weeksTarget: 0,
    });
    expect(result.weeks).toBe(0);
  });

  it('fromWeeks: calculates weekly from weeks', () => {
    const result = computeGoalDerived({
      name: 'Test', color: '#ff0000', targetCents: 1000,
      icon: 'tag', mode: 'fromWeeks', weeklyContributionCents: 0, weeksTarget: 10,
    });
    expect(result.weeks).toBe(10);
    expect(result.weeklyCents).toBe(100); // ceil(1000/10)
  });

  it('fromWeeks: weekly is 0 when weeks is 0', () => {
    const result = computeGoalDerived({
      name: 'Test', color: '#ff0000', targetCents: 1000,
      icon: 'tag', mode: 'fromWeeks', weeklyContributionCents: 0, weeksTarget: 0,
    });
    expect(result.weeklyCents).toBe(0);
  });
});

describe('computeGoalProgress', () => {
  function makeTx(mode: 'spent' | 'earned', amountCents: number, categoryId = 'goal-cat'): Transaction {
    return { id: 'tx', seriesId: null, mode, amountCents, title: 'T', date: new Date().toISOString(), categoryId };
  }

  it('sums contributions', () => {
    const txs = [makeTx('spent', 500), makeTx('spent', 300)];
    const p = computeGoalProgress(txs, 'goal-cat', 1000);
    expect(p.contributedCents).toBe(800);
    expect(p.withdrawnCents).toBe(0);
    expect(p.netCents).toBe(800);
  });

  it('subtracts withdrawals', () => {
    const txs = [makeTx('spent', 1000), makeTx('earned', 200)];
    const p = computeGoalProgress(txs, 'goal-cat', 1000);
    expect(p.netCents).toBe(800);
    expect(p.fractionComplete).toBe(0.8);
  });

  it('ignores other categories', () => {
    const txs = [makeTx('spent', 500, 'other')];
    const p = computeGoalProgress(txs, 'goal-cat', 1000);
    expect(p.contributedCents).toBe(0);
  });

  it('fraction is capped at 0 minimum (not negative)', () => {
    const txs = [makeTx('earned', 500)]; // net = -500
    const p = computeGoalProgress(txs, 'goal-cat', 1000);
    expect(p.fractionComplete).toBe(0);
  });

  it('fraction can exceed 1 (overgoal)', () => {
    const txs = [makeTx('spent', 2000)];
    const p = computeGoalProgress(txs, 'goal-cat', 1000);
    expect(p.fractionComplete).toBe(2);
  });
});

describe('weeksSince', () => {
  it('returns 0 for same instant', () => {
    const now = new Date(2024, 0, 10);
    expect(weeksSince(now.toISOString(), now)).toBe(0);
  });

  it('returns 1 for exactly 7 days later', () => {
    const start = new Date(2024, 0, 1);
    const now = new Date(2024, 0, 8);
    expect(weeksSince(start.toISOString(), now)).toBe(1);
  });

  it('returns fractional weeks', () => {
    const start = new Date(2024, 0, 1);
    const now = new Date(2024, 0, 4); // 3 days
    const weeks = weeksSince(start.toISOString(), now);
    expect(weeks).toBeCloseTo(3 / 7, 3);
  });

  it('returns 0 for future createdAt', () => {
    const future = new Date(2025, 0, 1);
    const now = new Date(2024, 0, 1);
    expect(weeksSince(future.toISOString(), now)).toBe(0);
  });
});
