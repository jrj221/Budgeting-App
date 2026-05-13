export const STORAGE_KEYS = {
  SCHEMA_VERSION: 'budget:schema_version',
  TRANSACTIONS: 'budget:transactions',
  CATEGORIES: 'budget:categories',
  GOALS: 'budget:goals',
  SCHEME_ID: 'budget:scheme_id',
  HAS_SEEN_WELCOME: 'budget:has-seen-welcome',
  RETIRED_GOAL_CATEGORY_IDS: 'budget:retired-goal-category-ids',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
