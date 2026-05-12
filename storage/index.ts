import AsyncStorage from '@react-native-async-storage/async-storage';

import { STORAGE_KEYS } from './keys';
import { applyMigrations } from './migrations';
import { StoredData, CURRENT_VERSION } from './types';

export { STORAGE_KEYS } from './keys';
export { applyMigrations, MIGRATIONS } from './migrations';
export { CURRENT_VERSION } from './types';
export type { StoredData, StoredTransaction, StoredCategory, StoredGoal } from './types';

/**
 * Load all persisted app data, applying any pending schema migrations.
 * Returns a fully-migrated StoredData object (falls back to empty defaults on any error).
 */
export async function loadStorageData(): Promise<StoredData> {
  try {
    const keys = [
      STORAGE_KEYS.SCHEMA_VERSION,
      STORAGE_KEYS.TRANSACTIONS,
      STORAGE_KEYS.CATEGORIES,
      STORAGE_KEYS.GOALS,
      STORAGE_KEYS.SCHEME_ID,
    ] as const;

    const pairs = await AsyncStorage.multiGet(keys);
    const map = Object.fromEntries(pairs.map(([k, v]) => [k, v]));

    const schemaVersion = map[STORAGE_KEYS.SCHEMA_VERSION]
      ? parseInt(map[STORAGE_KEYS.SCHEMA_VERSION] as string, 10)
      : 0;

    const raw: Partial<StoredData> = {
      schemaVersion,
      transactions: parseJson(map[STORAGE_KEYS.TRANSACTIONS], []),
      categories: parseJson(map[STORAGE_KEYS.CATEGORIES], []),
      goals: parseJson(map[STORAGE_KEYS.GOALS], []),
      schemeId: map[STORAGE_KEYS.SCHEME_ID] ?? null,
    };

    const migrated = applyMigrations(raw);

    // If migrations ran, persist upgraded data immediately.
    if (migrated.schemaVersion !== schemaVersion) {
      await saveStorageData(migrated);
    }

    return migrated;
  } catch {
    return applyMigrations({});
  }
}

/**
 * Persist the full app state to AsyncStorage in a single multiSet call.
 */
export async function saveStorageData(data: Partial<StoredData>): Promise<void> {
  try {
    const pairs: [string, string][] = [
      [STORAGE_KEYS.SCHEMA_VERSION, String(CURRENT_VERSION)],
    ];

    if (data.transactions !== undefined) {
      pairs.push([STORAGE_KEYS.TRANSACTIONS, JSON.stringify(data.transactions)]);
    }
    if (data.categories !== undefined) {
      pairs.push([STORAGE_KEYS.CATEGORIES, JSON.stringify(data.categories)]);
    }
    if (data.goals !== undefined) {
      pairs.push([STORAGE_KEYS.GOALS, JSON.stringify(data.goals)]);
    }
    if (data.schemeId !== undefined) {
      pairs.push([STORAGE_KEYS.SCHEME_ID, data.schemeId ?? '']);
    }

    await AsyncStorage.multiSet(pairs);
  } catch {
    // best-effort: if storage fails, in-memory state is still correct
  }
}

function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
