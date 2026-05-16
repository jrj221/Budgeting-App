import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import React from "react";

import { PreferencesProvider, usePreferences } from "../../contexts/preferences-context";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <PreferencesProvider>{children}</PreferencesProvider>
);

beforeEach(() => {
  jest.clearAllMocks();
  (AsyncStorage as any)._store &&
    Object.keys((AsyncStorage as any)._store).forEach((k) => delete (AsyncStorage as any)._store[k]);
});

describe("PreferencesProvider", () => {
  it("starts with requireNamedTransactions true by default", async () => {
    const { result } = renderHook(() => usePreferences(), { wrapper });
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    expect(result.current.preferences.requireNamedTransactions).toBe(true);
  });

  it("hydrates requireNamedTransactions false from storage", async () => {
    await AsyncStorage.setItem(
      "budget:preferences",
      JSON.stringify({ requireNamedTransactions: false }),
    );

    const { result } = renderHook(() => usePreferences(), { wrapper });
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    expect(result.current.preferences.requireNamedTransactions).toBe(false);
  });

  it("persists when setRequireNamedTransactions is called", async () => {
    const { result } = renderHook(() => usePreferences(), { wrapper });
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    act(() => {
      result.current.setRequireNamedTransactions(false);
    });

    await waitFor(() => expect(result.current.preferences.requireNamedTransactions).toBe(false));

    const stored = await AsyncStorage.getItem("budget:preferences");
    expect(JSON.parse(stored!).requireNamedTransactions).toBe(false);
  });

  it("falls back to defaults when stored JSON is invalid", async () => {
    await AsyncStorage.setItem("budget:preferences", "not-json{{{");

    const { result } = renderHook(() => usePreferences(), { wrapper });
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    expect(result.current.preferences.requireNamedTransactions).toBe(true);
  });

  it("throws when used outside provider", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => usePreferences())).toThrow(
      "usePreferences must be used inside PreferencesProvider",
    );
    consoleSpy.mockRestore();
  });
});
