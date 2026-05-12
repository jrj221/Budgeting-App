import { DEFAULT_CATEGORIES } from '@/components/add-transaction-card.presenter';
import { StoredData, CURRENT_VERSION } from './types';

/**
 * Migration registry.
 *
 * Each entry describes how to upgrade data FROM a given version TO version+1.
 * To add v2: append { fromVersion: 2, migrate: (data) => ({ ...data, schemaVersion: 3, ... }) }
 *
 * Rules:
 *  - Never remove an entry (old installs may still be on old versions).
 *  - Always set `schemaVersion` to `fromVersion + 1` in the returned data.
 *  - Be defensive: use nullish coalescing for any new field so existing data is safe.
 */
type Migration = {
  fromVersion: number;
  migrate: (data: StoredData) => StoredData;
};

export const MIGRATIONS: Migration[] = [
  // v1 is the initial schema — no actual data transform needed, just stamp the version.
  {
    fromVersion: 0,
    migrate: (data) => ({
      ...data,
      schemaVersion: 1,
      transactions: (data.transactions ?? []).map((tx) => ({
        id: tx.id ?? '',
        seriesId: tx.seriesId ?? null,
        mode: tx.mode ?? 'spent',
        amountCents: tx.amountCents ?? 0,
        title: tx.title ?? '',
        date: tx.date ?? new Date().toISOString(),
        categoryId: tx.categoryId ?? null,
      })),
      categories: (data.categories ?? []).map((c) => ({
        id: c.id ?? '',
        name: c.name ?? '',
        color: c.color ?? '#888888',
        weeklyBudgetCents: c.weeklyBudgetCents ?? null,
        monthlyOverrideCents: c.monthlyOverrideCents ?? null,
        icon: c.icon ?? DEFAULT_CATEGORIES.find((d) => d.id === c.id)?.icon ?? 'tag',
        isGoal: c.isGoal ?? false,
      })),
      goals: (data.goals ?? []).map((g) => ({
        id: g.id ?? '',
        name: g.name ?? '',
        targetCents: g.targetCents ?? 0,
        weeklyContributionCents: g.weeklyContributionCents ?? 0,
        weeksTarget: g.weeksTarget ?? 0,
        categoryId: g.categoryId ?? '',
        createdAt: g.createdAt ?? new Date().toISOString(),
        creationMode: g.creationMode ?? 'fromWeekly',
      })),
      schemeId: data.schemeId ?? null,
    }),
  },
  // Future migrations go here, e.g.:
  // { fromVersion: 1, migrate: (data) => ({ ...data, schemaVersion: 2, newField: 'default' }) },
];

/**
 * Apply all pending migrations to bring `data` up to CURRENT_VERSION.
 */
export function applyMigrations(raw: Partial<StoredData>): StoredData {
  let data: StoredData = {
    schemaVersion: raw.schemaVersion ?? 0,
    transactions: raw.transactions ?? [],
    categories: raw.categories ?? [],
    goals: raw.goals ?? [],
    schemeId: raw.schemeId ?? null,
  };

  for (const migration of MIGRATIONS) {
    if (data.schemaVersion === migration.fromVersion) {
      data = migration.migrate(data);
    }
  }

  // Ensure we're at CURRENT_VERSION (guard against gaps in migration registry).
  if (data.schemaVersion < CURRENT_VERSION) {
    data = { ...data, schemaVersion: CURRENT_VERSION };
  }

  return data;
}
