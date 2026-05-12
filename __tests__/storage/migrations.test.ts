import { applyMigrations, MIGRATIONS } from '../../storage/migrations';
import { CURRENT_VERSION, StoredData } from '../../storage/types';

const emptyData: StoredData = {
  schemaVersion: 0,
  transactions: [],
  categories: [],
  goals: [],
  schemeId: null,
};

describe('applyMigrations', () => {
  it('brings schemaVersion 0 up to CURRENT_VERSION', () => {
    const result = applyMigrations({ schemaVersion: 0 });
    expect(result.schemaVersion).toBe(CURRENT_VERSION);
  });

  it('leaves data at CURRENT_VERSION unchanged in version', () => {
    const data: StoredData = { ...emptyData, schemaVersion: CURRENT_VERSION };
    const result = applyMigrations(data);
    expect(result.schemaVersion).toBe(CURRENT_VERSION);
  });

  it('defaults missing arrays to []', () => {
    const result = applyMigrations({});
    expect(Array.isArray(result.transactions)).toBe(true);
    expect(Array.isArray(result.categories)).toBe(true);
    expect(Array.isArray(result.goals)).toBe(true);
  });

  it('fills forward-compat defaults on transactions', () => {
    const raw = {
      schemaVersion: 0,
      transactions: [{ id: 'tx1' }] as any,
      categories: [],
      goals: [],
      schemeId: null,
    };
    const result = applyMigrations(raw);
    expect(result.transactions[0].id).toBe('tx1');
    expect(result.transactions[0].seriesId).toBeNull();
    expect(result.transactions[0].mode).toBe('spent');
    expect(result.transactions[0].amountCents).toBe(0);
    expect(result.transactions[0].title).toBe('');
    expect(result.transactions[0].categoryId).toBeNull();
  });

  it('fills forward-compat defaults on categories', () => {
    const raw = {
      schemaVersion: 0,
      transactions: [],
      categories: [{ id: 'cat1', name: 'Food', color: '#ff0000' }] as any,
      goals: [],
      schemeId: null,
    };
    const result = applyMigrations(raw);
    expect(result.categories[0].weeklyBudgetCents).toBeNull();
    expect(result.categories[0].monthlyOverrideCents).toBeNull();
    expect(result.categories[0].isGoal).toBe(false);
  });

  it('fills forward-compat defaults on goals', () => {
    const raw = {
      schemaVersion: 0,
      transactions: [],
      categories: [],
      goals: [{ id: 'g1', name: 'Vacation' }] as any,
      schemeId: null,
    };
    const result = applyMigrations(raw);
    expect(result.goals[0].creationMode).toBe('fromWeekly');
    expect(result.goals[0].targetCents).toBe(0);
    expect(result.goals[0].weeklyContributionCents).toBe(0);
  });

  it('round-trips: data is stable after second migration pass', () => {
    const first = applyMigrations({ schemaVersion: 0 });
    const second = applyMigrations(first);
    expect(second.schemaVersion).toBe(first.schemaVersion);
  });

  it('MIGRATIONS array has entry for version 0', () => {
    const v0 = MIGRATIONS.find((m) => m.fromVersion === 0);
    expect(v0).toBeDefined();
  });

  it('encodes and decodes correctly', () => {
    const data: StoredData = {
      schemaVersion: CURRENT_VERSION,
      transactions: [{ id: 'tx1', seriesId: null, mode: 'spent', amountCents: 1000, title: 'Lunch', date: '2024-01-01T00:00:00.000Z', categoryId: 'food' }],
      categories: [{ id: 'food', name: 'Food', color: '#ef4444', weeklyBudgetCents: null, monthlyOverrideCents: null, isGoal: false }],
      goals: [],
      schemeId: 'default',
    };
    const json = JSON.stringify(data);
    const decoded: StoredData = JSON.parse(json);
    expect(decoded.transactions[0].amountCents).toBe(1000);
    expect(decoded.categories[0].name).toBe('Food');
  });
});
