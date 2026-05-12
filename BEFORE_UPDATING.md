# Before Updating / Merging Checklist

Run through every section relevant to your change before merging to `main`.

---

## 1. Schema Migration Checklist

- [ ] Did you add, remove, or rename a field on `Transaction`, `Category`, or `Goal`?
  - If yes: open `storage/types.ts` and update the `StoredData` type.
  - Add a new migration object to `storage/migrations.ts`:
    ```ts
    { fromVersion: N, migrate: (data) => ({ ...data, schemaVersion: N+1, ... }) }
    ```
  - Bump `CURRENT_VERSION` in `storage/types.ts`.
- [ ] Did you write a round-trip test in `__tests__/storage/migrations.test.ts`?
- [ ] Did you verify the migration runs on a simulated old-version payload (not just empty data)?

---

## 2. Tests Checklist

- [ ] Run `npm test` — **zero failures, zero skipped tests** (unless you explicitly skipped for a reason).
- [ ] Added new tests for any new logic (presenter functions, utilities, new context operations).
- [ ] Did not delete existing tests without a documented reason.

---

## 3. Storage Compatibility Checklist

- [ ] Can existing app data (v1) load without crashing after your change?
  - Simulate: put old JSON into the AsyncStorage mock and run the migration path.
- [ ] Are all new fields given sensible defaults on migration so old records don't break?
- [ ] Did you verify the `hydrated` guard is preserved in any modified context (prevents overwriting storage before load completes)?

---

## 4. Breaking-Change Audit

- [ ] **Context API** — function names, parameter types, and return types in all `*-context.tsx` files are unchanged (or you updated all call sites).
- [ ] **Presenter types** — `Transaction`, `Category`, `RepeatConfig`, etc. in `add-transaction-card.presenter.ts` are unchanged (or downstream code updated).
- [ ] **Route changes** — adding/removing a tab in `app/(tabs)/_layout.tsx` requires updating all `tabIndex` references in the tour (see Section 5).
- [ ] **Utility function signatures** — `budget-calc.ts`, `goal-calc.ts`, `color-conversion.ts` are unchanged or all callers updated.

---

## 5. Tour Step Index Audit

The `tour-overlay.tsx` and `tour-context.tsx` reference tabs by their numeric index in the bottom-tab bar. Adding or removing tabs shifts every subsequent index.

- [ ] If you added a tab: find every `tabIndex` in `components/tour-overlay.tsx` and increment indices after the insertion point.
- [ ] If you removed a tab: decrement affected indices.
- [ ] Smoke-test the tour end-to-end after any tab layout change.

---

## 6. AsyncStorage Key Audit

- [ ] You did **not** delete a storage key constant from `storage/keys.ts` — old installs may still have that key stored and it must be migrated, not orphaned.
- [ ] If a key is no longer needed: mark it deprecated with a comment, add a migration that reads the old key and writes to the new one, then remove the old key via `AsyncStorage.removeItem` inside the migration.
- [ ] All new keys are added to `STORAGE_KEYS` in `storage/keys.ts`.

---

## 7. Dependency Upgrade Checklist

- [ ] Run `npm audit` — address any high/critical vulnerabilities.
- [ ] If upgrading `react-native`, `expo`, or `react`: check the Expo SDK changelog for breaking changes.
- [ ] If upgrading `@react-native-async-storage/async-storage`: verify the mock in `__mocks__/@react-native-async-storage/async-storage.js` still covers all methods the app uses.
- [ ] If upgrading `@shopify/react-native-skia`: update `__mocks__/@shopify/react-native-skia.js` accordingly.
- [ ] Run `npx --no-install tsc --noEmit` after dependency upgrades.

---

## 8. Manual Smoke Test List

Run these on a device or simulator before shipping:

- [ ] **First launch** — fresh install (or clear app data). Welcome screen appears, tour works.
- [ ] **Welcome flow** — step through all tour bubbles, confirm they highlight the correct elements.
- [ ] **Add transaction** — add a one-time expense and a recurring weekly expense; verify both appear in History.
- [ ] **Edit transaction** — change amount, category, and date on an existing transaction; verify persistence after restart.
- [ ] **Delete transaction / series** — delete a single entry and "this and future"; verify correct entries are removed.
- [ ] **Create goal** — create a goal via "weekly amount" mode and via "number of weeks" mode.
- [ ] **Contribute to goal** — contribute an amount; verify progress bar updates.
- [ ] **Withdraw from goal** — withdraw; verify progress decreases.
- [ ] **Delete goal** — delete a goal with a non-zero balance; verify refund transaction appears in main ledger.
- [ ] **Budget cards** — set a weekly budget on a category; verify the budget bar reflects spending.
- [ ] **Overview** — verify spending charts render correctly across the current week and month.
- [ ] **History** — scroll through history; verify dates, amounts, and categories are correct.
- [ ] **Reset budget** — use Settings → Reset; verify transactions and categories are cleared.
- [ ] **Theme change** — change color scheme in Settings; verify it persists after app restart.
- [ ] **Restart persistence** — force-quit and reopen the app; verify all data (transactions, categories, goals, color scheme) survived.
