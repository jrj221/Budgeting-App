import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { Category, Transaction } from "@/components/add-transaction-card.presenter";
import { useCategories } from "@/contexts/categories-context";
import { useGoals } from "@/contexts/goals-context";
import { useTransactions } from "@/contexts/transactions-context";
import { Goal } from "@/utils/goal-calc";
import { generateSampleTransactions, SAMPLE_CATEGORY_BUDGETS } from "@/utils/sample-transactions";

export type TourStep =
	| { kind: "info"; title: string; body: string; tabIndex: number }
	| { kind: "tap-tab"; title: string; body: string; tabIndex: number; expectedPath: string };

export const TOUR_STEPS: TourStep[] = [
	{
		kind: "info",
		title: "You're on Home",
		body: "This is where you'll add transactions (income or expenses).",
		tabIndex: 0,
	},
	{
		kind: "tap-tab",
		title: "Tap Overview",
		body: "Open the Overview tab.",
		tabIndex: 1,
		expectedPath: "/overview",
	},
	{
		kind: "info",
		title: "Overview",
		body: "Your current balance, budgets, projected cash flow, and a category breakdown of spending all live here.",
		tabIndex: 1,
	},
	{
		kind: "tap-tab",
		title: "Tap Goals",
		body: "Open the Goals tab.",
		tabIndex: 2,
		expectedPath: "/goals",
	},
	{
		kind: "info",
		title: "Goals",
		body: "Save toward something specific. Each goal makes its own category — contribute as an expense, withdraw as income. Pick a deadline or a weekly amount and the app works out the other.",
		tabIndex: 2,
	},
	{
		kind: "tap-tab",
		title: "Tap History",
		body: "Open the History tab.",
		tabIndex: 3,
		expectedPath: "/history",
	},
	{
		kind: "info",
		title: "History",
		body: "Every past and upcoming transaction lives here. Tap any transaction to edit or delete it.",
		tabIndex: 3,
	},
	{
		kind: "tap-tab",
		title: "Tap Settings",
		body: "Open the Settings tab.",
		tabIndex: 4,
		expectedPath: "/settings",
	},
	{
		kind: "info",
		title: "Settings",
		body: "Try different color schemes or reset the app to its initial state in the welcome tour to start over.",
		tabIndex: 4,
	},
	{
		kind: "tap-tab",
		title: "Back to Home",
		body: "Tap Home to wrap up.",
		tabIndex: 0,
		expectedPath: "/",
	},
];

type Snapshot = {
	transactions: Transaction[];
	categories: Category[];
	goals: Goal[];
};

type TourContextValue = {
	stepIndex: number | null;
	totalSteps: number;
	startTour: () => void;
	advance: () => void;
	skip: () => void;
};

const TourContext = createContext<TourContextValue | null>(null);

export function TourProvider({ children }: { children: ReactNode }) {
	const [stepIndex, setStepIndex] = useState<number | null>(null);
	const snapshotRef = useRef<Snapshot | null>(null);

	const { transactions, addTransactions, replaceAll: replaceAllTransactions } = useTransactions();
	const { categories, setCategoryBudget, replaceAll: replaceAllCategories } = useCategories();
	const { goals, addGoal, contributeToGoal, replaceAll: replaceAllGoals } = useGoals();

	const restoreSnapshot = useCallback(() => {
		const snap = snapshotRef.current;
		if (!snap) return;
		replaceAllTransactions(snap.transactions);
		replaceAllCategories(snap.categories);
		replaceAllGoals(snap.goals);
		snapshotRef.current = null;
	}, [replaceAllTransactions, replaceAllCategories, replaceAllGoals]);

	const startTour = useCallback(() => {
		snapshotRef.current = {
			transactions: [...transactions],
			categories: categories.map((c) => ({ ...c })),
			goals: goals.map((g) => ({ ...g })),
		};
		// Load sample data on top of the snapshot
		addTransactions(generateSampleTransactions());
		for (const b of SAMPLE_CATEGORY_BUDGETS) {
			setCategoryBudget(b.categoryId, b.weeklyCents, b.monthlyOverrideCents);
		}
		const sampleGoal = addGoal({
			name: "New laptop",
			color: "#22c55e",
			targetCents: 120000,
			mode: "fromWeeks",
			weeksTarget: 24,
			weeklyContributionCents: 5000,
		});
		if (sampleGoal) contributeToGoal(sampleGoal.id, 25000);
		setStepIndex(0);
	}, [transactions, categories, goals, addTransactions, setCategoryBudget, addGoal, contributeToGoal]);

	const skip = useCallback(() => {
		setStepIndex(null);
	}, []);

	const advance = useCallback(() => {
		setStepIndex((idx) => {
			if (idx === null) return null;
			const next = idx + 1;
			return next >= TOUR_STEPS.length ? null : next;
		});
	}, []);

	// When tour leaves the active state, restore the pre-tour snapshot.
	useEffect(() => {
		if (stepIndex === null && snapshotRef.current) {
			restoreSnapshot();
		}
	}, [stepIndex, restoreSnapshot]);

	const value = useMemo(
		() => ({
			stepIndex,
			totalSteps: TOUR_STEPS.length,
			startTour,
			advance,
			skip,
		}),
		[stepIndex, startTour, advance, skip],
	);

	return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

export function useTour() {
	const ctx = useContext(TourContext);
	if (!ctx) throw new Error("useTour must be used inside TourProvider");
	return ctx;
}
