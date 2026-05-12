# Storage Explainer

A guide to how this app persists data, the guarantees it provides, and the limits you should understand as a developer (or user).

---

## How AsyncStorage Works on iOS

AsyncStorage on iOS is backed by an **SQLite database** stored in the app's sandboxed container (`Library/Application Support`). Key facts:

- **Survives app updates** — the SQLite file remains when you update the app from the App Store.
- **Lost on app delete** — uninstalling removes the entire app container, including all stored data.
- **iCloud backup** — by default the `Library/Application Support` directory is included in iCloud backups. This means data can be restored when reinstalling on the same or a new device, *as long as* the user has iCloud backup enabled and a recent backup exists.
- **Not a database you can query** — it is a simple key-value store. Each key maps to a single string value (we store JSON).

---

## How AsyncStorage Works on Android

On Android, AsyncStorage uses either **SQLite** or **SharedPreferences** depending on the library version and device:

- **Lost on uninstall** — same as iOS; uninstalling wipes all stored data.
- **Not backed up by default** — Android's Auto Backup can include SharedPreferences, but AsyncStorage data is not guaranteed to be backed up unless `android:allowBackup="true"` is set and the backup rules include the storage path.
- **Slower than iOS** — disk I/O on older Android devices can make AsyncStorage noticeably slower; always keep stored values small.

---

## What Schema Versioning Protects Against

When you add a field to `Transaction`, `Category`, or `Goal` (or change the type of an existing field), old data stored on a user's device does not have that field. Without migrations, accessing the new field would return `undefined`, which could silently corrupt calculations or crash the app.

**Schema versioning** (the `budget:schema_version` key + migration registry) protects against this:

- Every release stores a `schemaVersion` number alongside the data.
- When the app loads, it compares the stored version against `CURRENT_VERSION`.
- Any pending migrations are applied in order, filling in defaults for new fields and transforming old ones.
- The upgraded data is saved back so future loads skip already-applied migrations.

The result: users upgrading from any previous version always get their data safely brought up to the current format.

---

## What Schema Versioning Does NOT Protect Against

- **Manual data deletion** — if the user clears app storage via iOS Settings → [App] → Storage, all data is gone. No migration can recover it.
- **Device wipe / factory reset** — all app data is lost, even with migrations.
- **Users who disabled iCloud backup** — if they delete and reinstall the app, their data is gone (no backup to restore from).
- **Corruption from bugs** — if a migration has a bug that writes bad data, subsequent migrations receive the bad data. Always test migrations with `__tests__/storage/migrations.test.ts`.
- **Cross-device sync** — AsyncStorage is per-device. Data on one iPhone is not visible on another iPhone unless both restore from the same iCloud backup.

---

## How the Migration System Works (Step by Step)

Every time the app starts, `loadStorageData()` in `storage/index.ts` does the following:

1. **Read** `budget:schema_version` from AsyncStorage. If missing, treat as version `0`.
2. **Read** all other data keys (`budget:transactions`, `budget:categories`, `budget:goals`, `budget:scheme_id`).
3. **Call `applyMigrations(raw)`** — this loops through `MIGRATIONS` in `storage/migrations.ts` and applies any migration whose `fromVersion` matches the current `schemaVersion`. Each migration increments the version by 1.
4. **If the version changed**, call `saveStorageData(migrated)` to persist the upgraded data immediately — the next launch will not need to re-run those migrations.
5. **Return** the fully-migrated data to the calling context, which hydrates its state.

Users never lose data from a version bump. The worst case is that a new field gets a default value (e.g., `isGoal: false`), which is always safe and correct for old records.

---

## Adding a Migration (For Future Developers)

1. Change your data types in `storage/types.ts`.
2. Increment `CURRENT_VERSION`.
3. Append a new entry to `MIGRATIONS` in `storage/migrations.ts`:

```ts
{
  fromVersion: 1,          // the version BEFORE this migration
  migrate: (data) => ({
    ...data,
    schemaVersion: 2,
    transactions: data.transactions.map((tx) => ({
      ...tx,
      newField: tx.newField ?? 'default_value',   // safe default
    })),
  }),
},
```

4. Add a test in `__tests__/storage/migrations.test.ts` that passes a v1 payload and asserts the v2 shape.

---

## Recommendations for the Future

### User-Side JSON Export / Import

The most robust way to protect users from data loss is to let them export their data as a JSON file and import it on a new device. This would:
- Work for users without iCloud backups.
- Let users migrate between Android and iOS.
- Serve as a manual backup before a major update.

Implementation: add an "Export data" and "Import data" option in Settings; serialize the full `StoredData` object as JSON, share via the system share sheet (iOS/Android), and reverse the process on import.

### Optional iCloud Drive Sync

For iOS-only persistence across devices without needing the export flow, `expo-file-system` + iCloud Drive (via `NSURL ubiquitous containers`) could sync the JSON file. This is more complex than AsyncStorage but gives near-real-time cross-device sync.

### Cloud Backup (Cross-Platform)

For a full cross-platform cloud sync, consider a lightweight backend (Supabase, Firebase Firestore, or a custom API) keyed on the user's Apple/Google account. This removes the platform-specific backup dependency entirely.
