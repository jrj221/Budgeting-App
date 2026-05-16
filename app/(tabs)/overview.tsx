import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Category, formatCentsDisplay, Transaction } from "@/components/add-transaction-card.presenter";
import { generateSampleTransactions, SAMPLE_CATEGORY_BUDGETS } from "@/utils/sample-transactions";
import { BudgetCard } from "@/components/budget-card";
import { BudgetEditorSheet } from "@/components/budget-editor-sheet";
import { chartStyles } from "@/components/charts/charts.styles";
import { LineChart, LinePoint } from "@/components/charts/line-chart";
import { PieChart, PieSlice } from "@/components/charts/pie-chart";
import { HelpButton } from "@/components/help-button";
import { Palette } from "@/constants/colors";
import { useCategories } from "@/contexts/categories-context";
import { useGoals } from "@/contexts/goals-context";
import { useAppTheme } from "@/contexts/theme-context";
import { TOUR_STEPS, useTour } from "@/contexts/tour-context";
import { useTransactions } from "@/contexts/transactions-context";
import { styles } from "@/styles/overview.styles";

const UNCATEGORIZED_KEY = "__uncategorized__";

const OVERVIEW_HELP_STEPS = [
	{ title: "Balance", body: "Your running total — all earned minus all spent (not counting future transactions)." },
	{
		title: "Budgets",
		body: "Per-category spending caps. Tap 'Edit' to set weekly or monthly limits; the bars fill as you spend.",
	},
	{
		title: "Projected balance chart",
		body: "Shows how your future balance trends based on upcoming scheduled transactions.",
	},
	{
		title: "Spending breakdown",
		body: "A pie chart of spending by category. Tap the filter button to change the time window (last 7 days, 30 days, a specific month, or all time).",
	},
];

type PieFilter =
	| { kind: "week" }
	| { kind: "days30" }
	| { kind: "all" }
	| { kind: "month"; year: number; month: number };

export default function OverviewScreen() {
	const { transactions, addTransactions, replaceAll: replaceAllTx } = useTransactions();
	const { categories, setCategoryBudget, replaceAll: replaceAllCats } = useCategories();
	const { getRetiredGoalCategoryMeta } = useGoals();
	const { scheme } = useAppTheme();
	const { stepIndex } = useTour();
	const { width } = useWindowDimensions();

	const chartWidth = width - 40 - 32;
	const lineHeight = 240;
	const pieSize = Math.min(220, chartWidth);

	const [pieFilter, setPieFilter] = useState<PieFilter>({ kind: "days30" });
	const [filterOpen, setFilterOpen] = useState(false);
	const [budgetEditorOpen, setBudgetEditorOpen] = useState(false);

	const scrollRef = useRef<ScrollView>(null);
	const balanceRef = useRef<View>(null);
	const lineChartRef = useRef<View>(null);
	const budgetRef = useRef<View>(null);
	const pieRef = useRef<View>(null);
	// stepTargets order matches OVERVIEW_HELP_STEPS: balance, budgets, chart, pie
	const stepTargets = [balanceRef, budgetRef, lineChartRef, pieRef];

	// Snapshot/restore for help tour sample data injection.
	const tourSnapshotRef = useRef<{ tx: typeof transactions; cats: typeof categories } | null>(null);
	const needsSampleData = transactions.length === 0;

	const onTourStart = useCallback(() => {
		if (!needsSampleData) return;
		tourSnapshotRef.current = { tx: [...transactions], cats: [...categories] };
		addTransactions(generateSampleTransactions());
		for (const b of SAMPLE_CATEGORY_BUDGETS) {
			setCategoryBudget(b.categoryId, b.weeklyCents, b.monthlyOverrideCents);
		}
	}, [needsSampleData, transactions, categories, addTransactions, setCategoryBudget]);

	const onTourDismiss = useCallback(() => {
		const snap = tourSnapshotRef.current;
		if (!snap) return;
		replaceAllTx(snap.tx);
		replaceAllCats(snap.cats);
		tourSnapshotRef.current = null;
	}, [replaceAllTx, replaceAllCats]);

	const tourStep = stepIndex !== null ? TOUR_STEPS[stepIndex] : null;
	const isOverviewTourInfo = tourStep?.kind === "info" && tourStep.tabIndex === 0;

	useEffect(() => {
		if (!isOverviewTourInfo) return;
		const t = setTimeout(() => {
			scrollRef.current?.scrollTo({ y: 600, animated: true });
		}, 0);
		return () => clearTimeout(t);
	}, [isOverviewTourInfo]);

	const balanceCents = useMemo(() => {
		let total = 0;
		const todayEnd = new Date();
		todayEnd.setHours(23, 59, 59, 999);
		for (const tx of transactions) {
			if (new Date(tx.date).getTime() > todayEnd.getTime()) continue;
			total += tx.mode === "earned" ? tx.amountCents : -tx.amountCents;
		}
		return total;
	}, [transactions]);

	const showBalanceInfo = () => {
		Alert.alert(
			"About your balance",
			"This balance only reflects the starting balance you entered plus any transactions you've logged here that have already taken place. It does not reflect actual funds, deposits, or charges in your real bank account.",
			[{ text: "Got it" }],
		);
	};

	const lineData = useMemo(() => buildFutureCashflow(transactions), [transactions]);
	const pieData = useMemo(
		() => buildCategoryDistribution(transactions, categories, pieFilter, getRetiredGoalCategoryMeta),
		[transactions, categories, pieFilter, getRetiredGoalCategoryMeta],
	);
	const availableMonths = useMemo(() => listSpentMonths(transactions), [transactions]);

	const totalSpent = pieData.reduce((acc, s) => acc + s.value, 0);

	const filterOptions = buildFilterOptions(availableMonths);

	return (
		<SafeAreaView style={[styles.safe, { backgroundColor: scheme.background }]} edges={["top"]}>
			<ScrollView ref={scrollRef} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
				<View style={styles.header}>
					<View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
						<View style={{ flex: 1 }}>
							<Text style={[styles.title, { color: scheme.text }]}>Home</Text>
							<Text style={[styles.subtitle, { color: scheme.textMuted }]}>
								Where your money goes — past and projected.
							</Text>
						</View>
						<HelpButton
							steps={OVERVIEW_HELP_STEPS}
							stepTargets={stepTargets}
							scrollRef={scrollRef}
							onStart={onTourStart}
							onDismiss={onTourDismiss}
						/>
					</View>
				</View>

				<View
					ref={balanceRef}
					collapsable={false}
					style={[styles.balanceCard, { backgroundColor: scheme.cardBackground }]}
				>
					<View style={styles.balanceHeaderRow}>
						<Text style={[styles.balanceLabel, { color: scheme.textMuted }]}>Current balance</Text>
						<Pressable
							onPress={showBalanceInfo}
							hitSlop={8}
							style={[styles.infoBtn, { backgroundColor: scheme.surface, borderColor: scheme.border }]}
						>
							<Ionicons name="information" size={13} color={scheme.textMuted} />
						</Pressable>
					</View>
					<Text
						style={[
							styles.balanceAmount,
							{ color: scheme.text },
							balanceCents < 0 && styles.balanceAmountNeg,
						]}
					>
						{balanceCents < 0
							? `-${formatCentsDisplay(Math.abs(balanceCents))}`
							: formatCentsDisplay(balanceCents)}
					</Text>
					<Text style={[styles.balanceSub, { color: scheme.textMuted }]}>
						Starting balance plus completed transactions you&apos;ve logged.
					</Text>
				</View>

				<View ref={budgetRef} collapsable={false}>
					<BudgetCard onOpenEditor={() => setBudgetEditorOpen(true)} />
				</View>

				<View
					ref={lineChartRef}
					collapsable={false}
					style={[chartStyles.container, { backgroundColor: scheme.cardBackground }]}
				>
					<Text style={[chartStyles.title, { color: scheme.text }]}>Projected balance</Text>
					<Text style={[chartStyles.subtitle, { color: scheme.textMuted }]}>
						Running total of future earnings and expenses.
					</Text>
					{lineData.points.length > 1 ? (
						<LineChart
							data={lineData.points}
							width={chartWidth}
							height={lineHeight}
							xMin={lineData.xMin}
							xMax={lineData.xMax}
							yMin={lineData.yMin}
							yMax={lineData.yMax}
							formatYAxis={(cents) => formatCompactCents(cents)}
							formatYTooltip={(cents) => formatSignedCents(cents)}
							formatX={(ts) => formatDateShort(ts)}
							lineColor={scheme.lineChart}
						/>
					) : (
						<View style={chartStyles.empty}>
							<Ionicons name="trending-up-outline" size={28} color={scheme.textMuted} />
							<Text style={[chartStyles.emptyText, { color: scheme.textMuted }]}>
								Schedule future transactions to see a projection.
							</Text>
						</View>
					)}
				</View>

				<View
					ref={pieRef}
					collapsable={false}
					style={[chartStyles.container, { backgroundColor: scheme.cardBackground }]}
				>
					<View style={chartStyles.headerRow}>
						<View style={chartStyles.headerLeft}>
							<Text style={[chartStyles.title, { color: scheme.text }]}>Spending by category</Text>
							<Text style={[chartStyles.subtitle, { color: scheme.textMuted }]}>
								Past expenses, grouped.
							</Text>
						</View>
						<Pressable
							onPress={() => setFilterOpen(true)}
							style={[
								chartStyles.filterButton,
								{ backgroundColor: scheme.surface, borderColor: scheme.border },
							]}
						>
							<Text style={[chartStyles.filterText, { color: scheme.textMuted }]}>
								{filterLabel(pieFilter)}
							</Text>
							<Ionicons name="chevron-down" size={14} color={scheme.textMuted} />
						</Pressable>
					</View>

					{pieData.length > 0 ? (
						<>
							<View style={styles.pieRow}>
								<PieChart
									data={pieData}
									size={pieSize}
									innerRatio={0.55}
									formatValue={(v) => formatCentsDisplay(v)}
									innerColor={scheme.cardBackground}
									labelColor={scheme.text}
									labelMutedColor={scheme.textMuted}
								/>
								<Text style={[styles.totalLabel, { color: scheme.textMuted }]}>Total</Text>
								<Text style={[styles.totalAmount, { color: scheme.text }]}>
									{formatCentsDisplay(totalSpent)}
								</Text>
							</View>
							<View style={chartStyles.legend}>
								{pieData.map((slice) => (
									<View key={slice.key} style={chartStyles.legendRow}>
										<View style={chartStyles.legendLeft}>
											<View style={[chartStyles.legendDot, { backgroundColor: slice.color }]} />
											<Text style={[chartStyles.legendName, { color: scheme.text }]}>
												{slice.label}
											</Text>
										</View>
										<Text style={[chartStyles.legendValue, { color: scheme.text }]}>
											{formatCentsDisplay(slice.value)}
										</Text>
										<Text style={[chartStyles.legendPercent, { color: scheme.textMuted }]}>
											{((slice.value / totalSpent) * 100).toFixed(0)}%
										</Text>
									</View>
								))}
							</View>
						</>
					) : (
						<View style={chartStyles.empty}>
							<Ionicons name="pie-chart-outline" size={28} color={scheme.textMuted} />
							<Text style={[chartStyles.emptyText, { color: scheme.textMuted }]}>
								No expenses {filterEmptyHint(pieFilter)}.
							</Text>
						</View>
					)}
				</View>
			</ScrollView>

			<FilterMenu
				visible={filterOpen}
				options={filterOptions}
				current={pieFilter}
				onSelect={(f) => {
					setPieFilter(f);
					setFilterOpen(false);
				}}
				onClose={() => setFilterOpen(false)}
			/>

			<BudgetEditorSheet visible={budgetEditorOpen} onClose={() => setBudgetEditorOpen(false)} />
		</SafeAreaView>
	);
}

type FilterMenuProps = {
	visible: boolean;
	options: { id: string; label: string; filter: PieFilter }[];
	current: PieFilter;
	onSelect: (f: PieFilter) => void;
	onClose: () => void;
};

function FilterMenu({ visible, options, current, onSelect, onClose }: FilterMenuProps) {
	const { scheme } = useAppTheme();
	const currentId = filterId(current);
	return (
		<Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
			<Pressable style={chartStyles.menuOverlay} onPress={onClose}>
				<Pressable
					style={[
						chartStyles.menuCard,
						{ backgroundColor: scheme.surface, borderWidth: 1, borderColor: scheme.border },
					]}
					onPress={() => {}}
				>
					<ScrollView style={chartStyles.menuScroll}>
						{options.map((opt) => {
							const active = opt.id === currentId;
							return (
								<Pressable
									key={opt.id}
									onPress={() => onSelect(opt.filter)}
									style={[chartStyles.menuRow, { borderBottomColor: scheme.border }]}
								>
									<Text style={[chartStyles.menuRowText, { color: scheme.text }]}>{opt.label}</Text>
									{active && <Ionicons name="checkmark" size={20} color={Palette.brand} />}
								</Pressable>
							);
						})}
					</ScrollView>
				</Pressable>
			</Pressable>
		</Modal>
	);
}

function filterId(f: PieFilter): string {
	if (f.kind === "month") return `month-${f.year}-${f.month}`;
	return f.kind;
}

function filterLabel(f: PieFilter): string {
	if (f.kind === "week") return "Past week";
	if (f.kind === "days30") return "Past 30 days";
	if (f.kind === "all") return "All time";
	return new Date(f.year, f.month, 1).toLocaleDateString(undefined, {
		month: "long",
		year: "numeric",
	});
}

function filterEmptyHint(f: PieFilter): string {
	if (f.kind === "week") return "in the past week";
	if (f.kind === "days30") return "in the past 30 days";
	if (f.kind === "month")
		return `in ${new Date(f.year, f.month, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" })}`;
	return "recorded yet";
}

function buildFilterOptions(months: { year: number; month: number }[]) {
	const base: { id: string; label: string; filter: PieFilter }[] = [
		{ id: "week", label: "Past week", filter: { kind: "week" } },
		{ id: "days30", label: "Past 30 days", filter: { kind: "days30" } },
		{ id: "all", label: "All time", filter: { kind: "all" } },
	];
	for (const m of months) {
		base.push({
			id: `month-${m.year}-${m.month}`,
			label: new Date(m.year, m.month, 1).toLocaleDateString(undefined, {
				month: "long",
				year: "numeric",
			}),
			filter: { kind: "month", year: m.year, month: m.month },
		});
	}
	return base;
}

type LineData = {
	points: LinePoint[];
	xMin: number;
	xMax: number;
	yMin: number;
	yMax: number;
};

function startOfDay(date: Date): Date {
	const d = new Date(date);
	d.setHours(0, 0, 0, 0);
	return d;
}

function buildFutureCashflow(transactions: Transaction[]): LineData {
	const today = startOfDay(new Date());
	const todayMs = today.getTime();

	const future = transactions
		.filter((t) => new Date(t.date).getTime() > todayMs)
		.map((t) => ({
			date: new Date(t.date),
			cents: t.amountCents,
			mode: t.mode,
			id: t.id,
		}))
		.sort((a, b) => {
			const dt = a.date.getTime() - b.date.getTime();
			if (dt !== 0) return dt;
			if (a.mode !== b.mode) return a.mode === "earned" ? -1 : 1;
			return a.id.localeCompare(b.id);
		});

	if (future.length === 0) {
		return { points: [], xMin: todayMs, xMax: todayMs, yMin: 0, yMax: 0 };
	}

	const points: LinePoint[] = [{ x: todayMs, y: 0 }];
	let running = 0;
	let yMin = 0;
	let yMax = 0;

	for (const tx of future) {
		running += tx.mode === "earned" ? tx.cents : -tx.cents;
		points.push({ x: tx.date.getTime(), y: running });
		if (running < yMin) yMin = running;
		if (running > yMax) yMax = running;
	}

	return {
		points,
		xMin: todayMs,
		xMax: future[future.length - 1].date.getTime(),
		yMin,
		yMax,
	};
}

function formatSignedCents(cents: number): string {
	const sign = cents < 0 ? "-" : "";
	return `${sign}${formatCentsDisplay(Math.abs(cents))}`;
}

function formatCompactCents(cents: number): string {
	const sign = cents < 0 ? "-" : "";
	const dollars = Math.abs(cents) / 100;
	if (dollars >= 1_000_000) {
		const v = dollars / 1_000_000;
		const text = v >= 10 ? Math.round(v).toString() : v.toFixed(1).replace(/\.0$/, "");
		return `${sign}$${text}m`;
	}
	if (dollars >= 1_000) {
		const v = dollars / 1_000;
		const text = v >= 10 ? Math.round(v).toString() : v.toFixed(1).replace(/\.0$/, "");
		return `${sign}$${text}k`;
	}
	return `${sign}$${Math.round(dollars)}`;
}

function formatDateShort(timestamp: number): string {
	const date = new Date(timestamp);
	const today = startOfDay(new Date());
	if (date.getTime() === today.getTime()) return "Today";
	return date.toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
		year: date.getFullYear() === today.getFullYear() ? undefined : "numeric",
	});
}

function listSpentMonths(transactions: Transaction[]): { year: number; month: number }[] {
	const today = startOfDay(new Date());
	const seen = new Set<string>();
	for (const tx of transactions) {
		if (tx.mode !== "spent") continue;
		const d = new Date(tx.date);
		if (d.getTime() > today.getTime()) continue;
		seen.add(`${d.getFullYear()}-${d.getMonth()}`);
	}
	return Array.from(seen)
		.map((k) => {
			const [y, m] = k.split("-").map(Number);
			return { year: y, month: m };
		})
		.sort((a, b) => b.year - a.year || b.month - a.month);
}

type PieEntry = PieSlice;

function buildCategoryDistribution(
	transactions: Transaction[],
	categories: Category[],
	filter: PieFilter,
	getRetiredMeta: (id: string | null | undefined) => { name: string; color: string } | null,
): PieEntry[] {
	const today = startOfDay(new Date());
	const todayEnd = new Date(today);
	todayEnd.setHours(23, 59, 59, 999);
	const cutoff = todayEnd.getTime();

	const buckets = new Map<string, number>();
	for (const tx of transactions) {
		if (tx.mode !== "spent") continue;
		const d = new Date(tx.date);
		const ms = d.getTime();
		if (ms > cutoff) continue;
		if (!matchesFilter(d, filter, today)) continue;
		const key = tx.categoryId ?? UNCATEGORIZED_KEY;
		buckets.set(key, (buckets.get(key) ?? 0) + tx.amountCents);
	}

	const entries: PieEntry[] = [];
	for (const [key, value] of buckets) {
		if (value <= 0) continue;
		if (key === UNCATEGORIZED_KEY) {
			entries.push({ key, value, color: Palette.uncategorized, label: "Uncategorized" });
		} else {
			const cat = categories.find((c) => c.id === key);
			if (!cat) {
				const retired = getRetiredMeta(key);
				entries.push({
					key,
					value,
					color: retired?.color ?? Palette.uncategorized,
					label: retired?.name ?? "Removed category",
				});
			} else {
				entries.push({ key, value, color: cat.color, label: cat.name });
			}
		}
	}
	entries.sort((a, b) => b.value - a.value);
	return entries;
}

function matchesFilter(date: Date, filter: PieFilter, today: Date): boolean {
	if (filter.kind === "all") return true;
	if (filter.kind === "week") {
		const cutoff = new Date(today);
		cutoff.setDate(cutoff.getDate() - 7);
		return date.getTime() >= cutoff.getTime();
	}
	if (filter.kind === "days30") {
		const cutoff = new Date(today);
		cutoff.setDate(cutoff.getDate() - 30);
		return date.getTime() >= cutoff.getTime();
	}
	return date.getFullYear() === filter.year && date.getMonth() === filter.month;
}
