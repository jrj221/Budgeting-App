export type TransactionMode = "spent" | "earned";

export type Category = {
	id: string;
	name: string;
	color: string;
	icon: string;
	weeklyBudgetCents: number | null;
	monthlyOverrideCents: number | null;
	isGoal: boolean;
};

export type RepeatPeriod = "weeks" | "months";
export type RepeatEndMode = "date" | "count";

export type RepeatConfig = {
	enabled: boolean;
	every: number;
	period: RepeatPeriod;
	endMode: RepeatEndMode;
	endDate: Date;
	count: number;
};

export type DraftTransaction = {
	mode: TransactionMode;
	amountDigits: string;
	title: string;
	date: Date;
	categoryId: string | null;
};

export type Transaction = {
	id: string;
	seriesId: string | null;
	mode: TransactionMode;
	amountCents: number;
	title: string;
	date: string;
	categoryId: string | null;
};

export const DEFAULT_CATEGORIES: Category[] = [
	{
		id: "food",
		name: "Food",
		color: "#ef4444",
		icon: "utensils",
		weeklyBudgetCents: null,
		monthlyOverrideCents: null,
		isGoal: false,
	},
	{
		id: "gas",
		name: "Gas",
		color: "#f59e0b",
		icon: "gas-pump",
		weeklyBudgetCents: null,
		monthlyOverrideCents: null,
		isGoal: false,
	},
	{
		id: "fun",
		name: "Fun",
		color: "#a855f7",
		icon: "gamepad",
		weeklyBudgetCents: null,
		monthlyOverrideCents: null,
		isGoal: false,
	},
	{
		id: "bills",
		name: "Bills",
		color: "#3b82f6",
		icon: "bolt",
		weeklyBudgetCents: null,
		monthlyOverrideCents: null,
		isGoal: false,
	},
];

export const MODE_LABELS: Record<TransactionMode, string> = {
	spent: "Spent",
	earned: "Earned",
};

export const REPEAT_PERIOD_LABELS: Record<RepeatPeriod, { singular: string; plural: string }> = {
	weeks: { singular: "week", plural: "weeks" },
	months: { singular: "month", plural: "months" },
};

const MAX_AMOUNT_DIGITS = 9;
const MAX_OCCURRENCES = 520;

export function sanitizeAmountDigits(input: string): string {
	const digitsOnly = input.replace(/\D/g, "");
	const trimmed = digitsOnly.replace(/^0+/, "");
	return trimmed.slice(0, MAX_AMOUNT_DIGITS);
}

export function formatAmountDisplay(amountDigits: string): string {
	const padded = (amountDigits || "0").padStart(3, "0");
	const dollars = padded.slice(0, -2);
	const cents = padded.slice(-2);
	const dollarsWithCommas = dollars.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	return `$${dollarsWithCommas}.${cents}`;
}

export function formatCentsDisplay(cents: number): string {
	return formatAmountDisplay(String(Math.max(0, Math.round(cents))));
}

export function amountDigitsToCents(amountDigits: string): number {
	if (!amountDigits) return 0;
	return parseInt(amountDigits, 10);
}

export function isDraftSubmittable(draft: DraftTransaction): boolean {
	return amountDigitsToCents(draft.amountDigits) > 0 && draft.title.trim().length > 0;
}

export function formatDateLabel(date: Date, today: Date = new Date()): string {
	const sameDay = (a: Date, b: Date) =>
		a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
	const yesterday = new Date(today);
	yesterday.setDate(yesterday.getDate() - 1);
	if (sameDay(date, today)) return "Today";
	if (sameDay(date, yesterday)) return "Yesterday";
	return date.toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
		year: date.getFullYear() === today.getFullYear() ? undefined : "numeric",
	});
}

export function formatRepeatSummary(repeat: RepeatConfig): string {
	if (!repeat.enabled) return "Never";
	const period = REPEAT_PERIOD_LABELS[repeat.period];
	const cadence = repeat.every === 1 ? `Every ${period.singular}` : `Every ${repeat.every} ${period.plural}`;
	const tail =
		repeat.endMode === "date"
			? `until ${repeat.endDate.toLocaleDateString(undefined, {
					month: "short",
					day: "numeric",
					year: repeat.endDate.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
				})}`
			: `${repeat.count} times`;
	return `${cadence}, ${tail}`;
}

function generateId(prefix: string): string {
	return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createCategory(name: string, color: string, isGoal = false, icon = "tag"): Category {
	return {
		id: generateId("cat"),
		name: name.trim(),
		color,
		icon,
		weeklyBudgetCents: null,
		monthlyOverrideCents: null,
		isGoal,
	};
}

export function effectiveMonthlyBudgetCents(cat: Category): number {
	if (cat.monthlyOverrideCents != null) return cat.monthlyOverrideCents;
	if (cat.weeklyBudgetCents == null) return 0;
	return cat.weeklyBudgetCents * 4;
}

export function effectiveBudgetCents(cat: Category, window: "week" | "month"): number {
	if (window === "week") return cat.weeklyBudgetCents ?? 0;
	return effectiveMonthlyBudgetCents(cat);
}

export function isCategoryNameValid(name: string, existing: Category[]): boolean {
	const trimmed = name.trim();
	if (trimmed.length === 0) return false;
	return !existing.some((c) => c.name.toLowerCase() === trimmed.toLowerCase());
}

function addPeriod(start: Date, steps: number, period: RepeatPeriod): Date {
	const next = new Date(start);
	if (period === "weeks") {
		next.setDate(next.getDate() + 7 * steps);
	} else {
		next.setMonth(next.getMonth() + steps);
	}
	return next;
}

export function expandRepeatDates(start: Date, repeat: RepeatConfig): Date[] {
	if (!repeat.enabled || repeat.every < 1) return [new Date(start)];

	const dates: Date[] = [new Date(start)];
	if (repeat.endMode === "count") {
		const total = Math.min(Math.max(Math.floor(repeat.count), 1), MAX_OCCURRENCES);
		for (let i = 1; i < total; i++) {
			dates.push(addPeriod(start, repeat.every * i, repeat.period));
		}
		return dates;
	}

	const cutoff = endOfDay(repeat.endDate).getTime();
	for (let i = 1; i < MAX_OCCURRENCES; i++) {
		const next = addPeriod(start, repeat.every * i, repeat.period);
		if (next.getTime() > cutoff) break;
		dates.push(next);
	}
	return dates;
}

function endOfDay(date: Date): Date {
	const d = new Date(date);
	d.setHours(23, 59, 59, 999);
	return d;
}

export function buildTransactionSeries(draft: DraftTransaction, repeat: RepeatConfig): Transaction[] {
	const dates = expandRepeatDates(draft.date, repeat);
	const seriesId = repeat.enabled && dates.length > 1 ? generateId("series") : null;
	const cents = amountDigitsToCents(draft.amountDigits);
	const title = draft.title.trim();
	return dates.map((date) => ({
		id: generateId("tx"),
		seriesId,
		mode: draft.mode,
		amountCents: cents,
		title,
		date: date.toISOString(),
		categoryId: draft.categoryId,
	}));
}

export function makeInitialDraft(): DraftTransaction {
	return {
		mode: "spent",
		amountDigits: "",
		title: "",
		date: new Date(),
		categoryId: null,
	};
}

export function makeInitialRepeatConfig(start: Date = new Date()): RepeatConfig {
	const endDate = new Date(start);
	endDate.setMonth(endDate.getMonth() + 3);
	return {
		enabled: false,
		every: 1,
		period: "weeks",
		endMode: "date",
		endDate,
		count: 4,
	};
}

export function submitButtonLabel(mode: TransactionMode): string {
	return mode === "spent" ? "Add Expense" : "Add Income";
}
