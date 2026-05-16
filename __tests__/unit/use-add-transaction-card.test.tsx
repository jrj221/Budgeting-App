import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import React from "react";

import { CategoriesProvider } from "../../contexts/categories-context";
import { PreferencesProvider, usePreferences } from "../../contexts/preferences-context";
import { useAddTransactionCard } from "../../hooks/use-add-transaction-card";

const AllProviders = ({ children }: { children: React.ReactNode }) => (
  <PreferencesProvider>
    <CategoriesProvider>{children}</CategoriesProvider>
  </PreferencesProvider>
);

beforeEach(() => {
  jest.clearAllMocks();
  (AsyncStorage as any)._store &&
    Object.keys((AsyncStorage as any)._store).forEach((k) => delete (AsyncStorage as any)._store[k]);
});

async function getHydrated() {
  const { result } = renderHook(() => useAddTransactionCard(), { wrapper: AllProviders });
  await waitFor(() => expect(result.current.canSubmit).toBeDefined());
  return result;
}

describe("useAddTransactionCard — require named transactions ON (default)", () => {
  it("canSubmit is false when amount is zero", async () => {
    const result = await getHydrated();
    expect(result.current.canSubmit).toBe(false);
  });

  it("canSubmit is true when amount is set, even without a title", async () => {
    const result = await getHydrated();
    act(() => result.current.setAmountFromInput("100"));
    expect(result.current.canSubmit).toBe(true);
  });

  it("submit with no title sets titleError and does not call onSubmit", async () => {
    const onSubmit = jest.fn();
    const { result } = renderHook(() => useAddTransactionCard({ onSubmit }), {
      wrapper: AllProviders,
    });

    act(() => result.current.setAmountFromInput("500"));
    act(() => result.current.submit());

    expect(result.current.titleError).toBe(true);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submit with title clears titleError and calls onSubmit", async () => {
    const onSubmit = jest.fn();
    const { result } = renderHook(() => useAddTransactionCard({ onSubmit }), {
      wrapper: AllProviders,
    });

    act(() => result.current.setAmountFromInput("500"));
    act(() => result.current.submit());
    expect(result.current.titleError).toBe(true);

    act(() => result.current.setTitle("Coffee"));
    expect(result.current.titleError).toBe(false);

    act(() => result.current.submit());
    expect(onSubmit).toHaveBeenCalledTimes(1);
    const [transactions] = onSubmit.mock.calls[0];
    expect(transactions[0].title).toBe("Coffee");
  });

  it("typing a non-empty title clears titleError", async () => {
    const { result } = renderHook(() => useAddTransactionCard(), { wrapper: AllProviders });

    act(() => result.current.setAmountFromInput("100"));
    act(() => result.current.submit());
    expect(result.current.titleError).toBe(true);

    act(() => result.current.setTitle("Lunch"));
    expect(result.current.titleError).toBe(false);
  });
});

describe("useAddTransactionCard — require named transactions OFF", () => {
  const OffProviders = ({ children }: { children: React.ReactNode }) => {
    return (
      <PreferencesProvider>
        <CategoriesProvider>{children}</CategoriesProvider>
      </PreferencesProvider>
    );
  };

  async function getHookWithPreferenceOff() {
    // Seed storage so the context hydrates with requireNamedTransactions: false
    await AsyncStorage.setItem(
      "budget:preferences",
      JSON.stringify({ requireNamedTransactions: false }),
    );

    const onSubmit = jest.fn();
    const { result } = renderHook(() => useAddTransactionCard({ onSubmit }), {
      wrapper: OffProviders,
    });

    // Wait for both providers to hydrate
    const prefResult = renderHook(() => usePreferences(), { wrapper: OffProviders });
    await waitFor(() => expect(prefResult.result.current.hydrated).toBe(true));

    return { result, onSubmit };
  }

  it("submits with 'Unnamed Expense' when mode is spent and title is empty", async () => {
    const { result, onSubmit } = await getHookWithPreferenceOff();

    act(() => result.current.setAmountFromInput("200"));
    act(() => result.current.submit());

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    const [transactions] = onSubmit.mock.calls[0];
    expect(transactions[0].title).toBe("Unnamed Expense");
    expect(result.current.titleError).toBe(false);
  });

  it("submits with 'Unnamed Earning' when mode is earned and title is empty", async () => {
    const { result, onSubmit } = await getHookWithPreferenceOff();

    act(() => result.current.setMode("earned"));
    act(() => result.current.setAmountFromInput("300"));
    act(() => result.current.submit());

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    const [transactions] = onSubmit.mock.calls[0];
    expect(transactions[0].title).toBe("Unnamed Earning");
  });

  it("submits with provided title when title is not empty", async () => {
    const { result, onSubmit } = await getHookWithPreferenceOff();

    act(() => result.current.setAmountFromInput("100"));
    act(() => result.current.setTitle("Salary"));
    act(() => result.current.submit());

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    const [transactions] = onSubmit.mock.calls[0];
    expect(transactions[0].title).toBe("Salary");
  });
});

describe("useAddTransactionCard — presenter helpers", () => {
  it("resolveTitle returns mode-appropriate fallback", () => {
    const { resolveTitle } = require("../../components/add-transaction-card.presenter");
    expect(resolveTitle("", "spent")).toBe("Unnamed Expense");
    expect(resolveTitle("", "earned")).toBe("Unnamed Earning");
    expect(resolveTitle("  ", "spent")).toBe("Unnamed Expense");
    expect(resolveTitle("Coffee", "spent")).toBe("Coffee");
  });

  it("isDraftAmountValid only checks amount", () => {
    const { isDraftAmountValid } = require("../../components/add-transaction-card.presenter");
    const base = { mode: "spent", amountDigits: "", title: "", date: new Date(), categoryId: null };
    expect(isDraftAmountValid({ ...base, amountDigits: "0" })).toBe(false);
    expect(isDraftAmountValid({ ...base, amountDigits: "100" })).toBe(true);
    // title doesn't matter
    expect(isDraftAmountValid({ ...base, amountDigits: "100", title: "" })).toBe(true);
  });
});
