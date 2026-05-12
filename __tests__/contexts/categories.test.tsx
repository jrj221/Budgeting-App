import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import React from "react";
import { CategoriesProvider, useCategories } from "../../contexts/categories-context";

const wrapper = ({ children }: { children: React.ReactNode }) => <CategoriesProvider>{children}</CategoriesProvider>;

beforeEach(() => {
	jest.clearAllMocks();
	(AsyncStorage as any)._store &&
		Object.keys((AsyncStorage as any)._store).forEach((k) => delete (AsyncStorage as any)._store[k]);
});

describe("CategoriesProvider", () => {
	it("starts with default categories", async () => {
		const { result } = renderHook(() => useCategories(), { wrapper });
		await waitFor(() => expect(result.current.hydrated).toBe(true));
		expect(result.current.categories.length).toBeGreaterThan(0);
	});

	it("hydrates from storage, replacing defaults", async () => {
		const stored = [
			{
				id: "c1",
				name: "Custom",
				color: "#aabbcc",
				weeklyBudgetCents: null,
				monthlyOverrideCents: null,
				isGoal: false,
			},
		];
		await AsyncStorage.setItem("budget:categories", JSON.stringify(stored));

		const { result } = renderHook(() => useCategories(), { wrapper });
		await waitFor(() => expect(result.current.hydrated).toBe(true));
		expect(result.current.categories).toHaveLength(1);
		expect(result.current.categories[0].name).toBe("Custom");
	});

	it("addCategory adds a new category", async () => {
		const { result } = renderHook(() => useCategories(), { wrapper });
		await waitFor(() => expect(result.current.hydrated).toBe(true));

		const before = result.current.categories.length;
		act(() => {
			result.current.addCategory("NewCat", "#ff0000");
		});
		await waitFor(() => expect(result.current.categories.length).toBe(before + 1));
		expect(result.current.categories.some((c) => c.name === "NewCat")).toBe(true);
	});

	it("addCategory returns null for duplicate name", async () => {
		const { result } = renderHook(() => useCategories(), { wrapper });
		await waitFor(() => expect(result.current.hydrated).toBe(true));

		act(() => {
			result.current.addCategory("Dup", "#ff0000");
		});
		await waitFor(() => expect(result.current.categories.some((c) => c.name === "Dup")).toBe(true));

		let second: any;
		act(() => {
			second = result.current.addCategory("Dup", "#00ff00");
		});
		expect(second).toBeNull();
	});

	it("deleteCategory removes category", async () => {
		const { result } = renderHook(() => useCategories(), { wrapper });
		await waitFor(() => expect(result.current.hydrated).toBe(true));

		act(() => {
			result.current.addCategory("ToDelete", "#123456");
		});
		await waitFor(() => expect(result.current.categories.some((c) => c.name === "ToDelete")).toBe(true));
		const cat = result.current.categories.find((c) => c.name === "ToDelete")!;

		act(() => {
			result.current.deleteCategory(cat.id);
		});
		await waitFor(() => expect(result.current.categories.some((c) => c.id === cat.id)).toBe(false));
	});

	it("renameCategory updates name", async () => {
		const { result } = renderHook(() => useCategories(), { wrapper });
		await waitFor(() => expect(result.current.hydrated).toBe(true));

		act(() => {
			result.current.addCategory("OldName", "#123456");
		});
		await waitFor(() => expect(result.current.categories.some((c) => c.name === "OldName")).toBe(true));
		const cat = result.current.categories.find((c) => c.name === "OldName")!;

		act(() => {
			result.current.renameCategory(cat.id, "NewName");
		});
		await waitFor(() => {
			const updated = result.current.categories.find((c) => c.id === cat.id);
			expect(updated?.name).toBe("NewName");
		});
	});

	it("setCategoryColor updates color", async () => {
		const { result } = renderHook(() => useCategories(), { wrapper });
		await waitFor(() => expect(result.current.hydrated).toBe(true));

		act(() => {
			result.current.addCategory("ColorTest", "#000000");
		});
		await waitFor(() => expect(result.current.categories.some((c) => c.name === "ColorTest")).toBe(true));
		const cat = result.current.categories.find((c) => c.name === "ColorTest")!;

		act(() => {
			result.current.setCategoryColor(cat.id, "#ffffff");
		});
		await waitFor(() => {
			const updated = result.current.categories.find((c) => c.id === cat.id);
			expect(updated?.color).toBe("#ffffff");
		});
	});

	it("setCategoryBudget sets budget cents", async () => {
		const { result } = renderHook(() => useCategories(), { wrapper });
		await waitFor(() => expect(result.current.hydrated).toBe(true));

		act(() => {
			result.current.addCategory("BudgetTest", "#aabbcc");
		});
		await waitFor(() => expect(result.current.categories.some((c) => c.name === "BudgetTest")).toBe(true));
		const cat = result.current.categories.find((c) => c.name === "BudgetTest")!;

		act(() => {
			result.current.setCategoryBudget(cat.id, 5000, null);
		});
		await waitFor(() => {
			const updated = result.current.categories.find((c) => c.id === cat.id);
			expect(updated?.weeklyBudgetCents).toBe(5000);
		});
	});

	it("addCategory with isGoal flag stores flag", async () => {
		const { result } = renderHook(() => useCategories(), { wrapper });
		await waitFor(() => expect(result.current.hydrated).toBe(true));

		act(() => {
			result.current.addCategory("GoalCat", "#ff0000", true);
		});
		await waitFor(() => expect(result.current.categories.some((c) => c.name === "GoalCat")).toBe(true));
		const cat = result.current.categories.find((c) => c.name === "GoalCat")!;
		expect(cat.isGoal).toBe(true);
	});

	it("getCategory returns correct category or null", async () => {
		const { result } = renderHook(() => useCategories(), { wrapper });
		await waitFor(() => expect(result.current.hydrated).toBe(true));

		act(() => {
			result.current.addCategory("GetTest", "#aabbcc");
		});
		await waitFor(() => expect(result.current.categories.some((c) => c.name === "GetTest")).toBe(true));
		const cat = result.current.categories.find((c) => c.name === "GetTest")!;

		expect(result.current.getCategory(cat.id)?.name).toBe("GetTest");
		expect(result.current.getCategory(null)).toBeNull();
		expect(result.current.getCategory("nonexistent")).toBeNull();
	});
});
