import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { useCallback, useMemo, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import type { SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, { interpolate, useAnimatedStyle } from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { formatCentsDisplay, Transaction } from "@/components/add-transaction-card.presenter";
import { EditTransactionSheet } from "@/components/edit-transaction-sheet";
import { HelpButton } from "@/components/help-button";
import { Palette } from "@/constants/colors";
import { useCategories } from "@/contexts/categories-context";
import { useGoals } from "@/contexts/goals-context";
import { useAppTheme } from "@/contexts/theme-context";
import { useTransactions } from "@/contexts/transactions-context";
import { styles } from "@/styles/history.styles";
import { generateSampleTransactions } from "@/utils/sample-transactions";


type TabKey = "upcoming" | "completed";

const TAB_LABELS: Record<TabKey, string> = {
	upcoming: "Upcoming",
	completed: "Completed",
};

const HISTORY_HELP_STEPS = [
	{ title: "Upcoming / Completed", body: "Upcoming shows future-dated transactions; Completed shows everything dated today or earlier." },
	{ title: "Transaction rows", body: "Tap any row to edit the amount, title, date, or category. Changes take effect immediately." },
	{ title: "Swipe to delete", body: "Swipe a row left to reveal the Delete button and remove it in one tap." },
	{ title: "Repeat icon", body: "The loop icon on a transaction means it's part of a recurring series. Editing asks whether to change just this one or the whole series." },
];

export default function HistoryScreen() {
	const { transactions, addTransactions, replaceAll: replaceAllTx } = useTransactions();
	const { scheme } = useAppTheme();
	const [tab, setTab] = useState<TabKey>("upcoming");
	const [editingId, setEditingId] = useState<string | null>(null);

	const scrollRef = useRef<ScrollView>(null);
	const tabBarRef = useRef<View>(null);
	const listRef = useRef<View>(null);
	const repeatRef = useRef<View>(null);
	// step 0: tab bar, steps 1-2: list, step 3: first recurring row
	const stepTargets = [tabBarRef, listRef, listRef, repeatRef];

	const tourSnapshotRef = useRef<typeof transactions | null>(null);
	const needsSampleData = transactions.length === 0;

	const onTourStart = useCallback(() => {
		if (!needsSampleData) return;
		tourSnapshotRef.current = [...transactions];
		addTransactions(generateSampleTransactions());
	}, [needsSampleData, transactions, addTransactions]);

	const onTourDismiss = useCallback(() => {
		if (!tourSnapshotRef.current) return;
		replaceAllTx(tourSnapshotRef.current);
		tourSnapshotRef.current = null;
	}, [replaceAllTx]);

	const { upcoming, completed } = useMemo(() => splitByDate(transactions), [transactions]);
	const visible = tab === "upcoming" ? upcoming : completed;
	const editing = editingId ? (transactions.find((t) => t.id === editingId) ?? null) : null;

	return (
		<SafeAreaView style={[styles.safe, { backgroundColor: scheme.background }]} edges={["top"]}>
			<ScrollView ref={scrollRef} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
				<View style={styles.header}>
					<View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
						<View style={{ flex: 1 }}>
							<Text style={[styles.title, { color: scheme.text }]}>History</Text>
							<Text style={[styles.subtitle, { color: scheme.textMuted }]}>
								Past activity and what's planned next.
							</Text>
						</View>
						<HelpButton
							steps={HISTORY_HELP_STEPS}
							stepTargets={stepTargets}
							scrollRef={scrollRef}
							onStart={onTourStart}
							onDismiss={onTourDismiss}
						/>
					</View>
				</View>

				<View ref={tabBarRef} collapsable={false} style={[styles.tabBar, { backgroundColor: scheme.toggleTrack }]}>
					{(Object.keys(TAB_LABELS) as TabKey[]).map((key) => {
						const active = tab === key;
						const count = key === "upcoming" ? upcoming.length : completed.length;
						return (
							<Pressable
								key={key}
								onPress={() => setTab(key)}
								style={[
									styles.tabBtn,
									active && [styles.tabBtnActive, { backgroundColor: scheme.cardBackground }],
								]}
							>
								<Text
									style={[
										styles.tabText,
										{ color: scheme.textMuted },
										active && [styles.tabTextActive, { color: scheme.text }],
									]}
								>
									{TAB_LABELS[key]} {count > 0 ? `(${count})` : ""}
								</Text>
							</Pressable>
						);
					})}
				</View>

				<View ref={listRef} collapsable={false}>
					{visible.length === 0 ? (
						<EmptyState tab={tab} />
					) : (
						<TransactionGroupedList
							transactions={visible}
							reverse={tab === "completed"}
							onSelect={setEditingId}
							repeatRef={repeatRef}
						/>
					)}
				</View>
			</ScrollView>

			<EditTransactionSheet visible={editing !== null} transaction={editing} onClose={() => setEditingId(null)} />
		</SafeAreaView>
	);
}

function EmptyState({ tab }: { tab: TabKey }) {
	const { scheme } = useAppTheme();
	return (
		<View style={[styles.list, styles.empty, { backgroundColor: scheme.cardBackground }]}>
			<Ionicons
				name={tab === "upcoming" ? "calendar-outline" : "time-outline"}
				size={28}
				color={scheme.textMuted}
			/>
			<Text style={[styles.emptyTitle, { color: scheme.text }]}>
				{tab === "upcoming" ? "No upcoming transactions" : "No completed transactions"}
			</Text>
			<Text style={[styles.emptySubtitle, { color: scheme.textMuted }]}>
				{tab === "upcoming"
					? "Schedule a recurring transaction to see future entries here."
					: "Add your first transaction to start building history."}
			</Text>
		</View>
	);
}

function TransactionGroupedList({
	transactions,
	reverse,
	onSelect,
	repeatRef,
}: {
	transactions: Transaction[];
	reverse: boolean;
	onSelect: (id: string) => void;
	repeatRef?: React.RefObject<View | null>;
}) {
	const groups = useMemo(() => groupByDay(transactions, reverse), [transactions, reverse]);
	const { scheme } = useAppTheme();

	// Find the index path of the first recurring transaction so we can attach repeatRef.
	let firstRepeatGroup = -1;
	let firstRepeatItem = -1;
	outer: for (let gi = 0; gi < groups.length; gi++) {
		for (let ii = 0; ii < groups[gi].items.length; ii++) {
			if (groups[gi].items[ii].seriesId) {
				firstRepeatGroup = gi;
				firstRepeatItem = ii;
				break outer;
			}
		}
	}

	return (
		<View style={{ gap: 16 }}>
			{groups.map((group, gi) => (
				<View key={group.key}>
					<Text style={[styles.groupHeader, { color: scheme.textMuted }]}>{group.label}</Text>
					<View style={[styles.list, { backgroundColor: scheme.cardBackground }]}>
						{group.items.map((tx, index) => (
							<TransactionRow
								key={tx.id}
								tx={tx}
								isLast={index === group.items.length - 1}
								onPress={() => onSelect(tx.id)}
								rowRef={gi === firstRepeatGroup && index === firstRepeatItem ? repeatRef : undefined}
							/>
						))}
					</View>
				</View>
			))}
		</View>
	);
}

function DeleteAction({ progress, onPress }: { progress: SharedValue<number>; onPress: () => void }) {
	const slideStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: interpolate(progress.value, [0, 1], [80, 0]) }],
	}));
	return (
		<View style={styles.deleteBtnClip}>
			<Animated.View style={slideStyle}>
				<Pressable testID="swipe-delete-btn" onPress={onPress} style={styles.deleteBtn}>
					<Ionicons name="trash" size={20} color="#fff" />
				</Pressable>
			</Animated.View>
		</View>
	);
}

function TransactionRow({ tx, isLast, onPress, rowRef }: { tx: Transaction; isLast: boolean; onPress: () => void; rowRef?: React.RefObject<View | null> }) {
	const { getCategory } = useCategories();
	const { isRetiredGoalCategory, getRetiredGoalCategoryMeta } = useGoals();
	const { deleteTransaction, deleteTransactionAndFuture } = useTransactions();
	const { scheme } = useAppTheme();
	const category = getCategory(tx.categoryId);
	const retiredMeta = getRetiredGoalCategoryMeta(tx.categoryId);
	const categoryName = category?.name ?? retiredMeta?.name ?? null;
	const sign = tx.mode === "spent" ? "-" : "+";
	const isRetired = isRetiredGoalCategory(tx.categoryId);
	const isGoalReturn = !tx.categoryId && tx.mode === "earned" && tx.title.startsWith("Returned from ");
	const isGoalTx = !!category?.isGoal || isRetired;
	const goalColor = category?.color ?? retiredMeta?.color;
	const isLocked = isRetired || isGoalReturn;
	const showGoalBadge = (isGoalTx && !!goalColor) || isGoalReturn;
	const badgeColor = goalColor ?? Palette.uncategorized;
	const badgeLabel = isGoalReturn ? "Goal deleted" : tx.mode === "spent" ? "Contribution" : "Withdrawal";

	const swipeableRef = useRef<SwipeableMethods>(null);

	const handleSwipeDelete = () => {
		swipeableRef.current?.close();
		if (tx.seriesId) {
			Alert.alert("Delete transaction", "Remove just this entry, or this and all future occurrences?", [
				{ text: "Cancel", style: "cancel" },
				{ text: "This only", style: "destructive", onPress: () => deleteTransaction(tx.id) },
				{ text: "This & future", style: "destructive", onPress: () => deleteTransactionAndFuture(tx.id) },
			]);
		} else {
			Alert.alert("Delete transaction?", "This cannot be undone.", [
				{ text: "Cancel", style: "cancel" },
				{ text: "Delete", style: "destructive", onPress: () => deleteTransaction(tx.id) },
			]);
		}
	};

	const renderRightActions = (progress: SharedValue<number>) => (
		<DeleteAction progress={progress} onPress={handleSwipeDelete} />
	);

	return (
		<ReanimatedSwipeable
			ref={swipeableRef}
			enabled={!isLocked}
			renderRightActions={renderRightActions}
			rightThreshold={40}
			overshootRight={false}
		>
			<Pressable
				ref={rowRef}
				onPress={isLocked ? undefined : onPress}
				style={[
					styles.row,
					isLast && styles.rowLast,
					{ backgroundColor: scheme.cardBackground },
					showGoalBadge ? { borderLeftWidth: 4, borderLeftColor: badgeColor, paddingLeft: 12 } : null,
					isLocked && { opacity: 0.45 },
				]}
			>
				<View style={styles.rowMain}>
					<View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
						{showGoalBadge && <Ionicons name="flag" size={14} color={badgeColor} />}
						<Text style={[styles.rowTitle, { color: scheme.text }]}>{tx.title}</Text>
					</View>
					<View style={styles.seriesBadge}>
						{showGoalBadge && (
							<>
								<View
									style={{
										flexDirection: "row",
										alignItems: "center",
										gap: 3,
										paddingHorizontal: 6,
										paddingVertical: 2,
										borderRadius: 999,
										backgroundColor: badgeColor,
									}}
								>
									<Ionicons
										name={tx.mode === "spent" ? "arrow-up" : "arrow-down"}
										size={9}
										color="#fff"
									/>
									<Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>{badgeLabel}</Text>
								</View>
								{(categoryName || tx.seriesId) && (
									<Text style={[styles.rowMeta, { color: scheme.textMuted }]}>·</Text>
								)}
							</>
						)}
						{category ? (
							<View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
								<FontAwesome5 name={category.icon as any} size={11} color={category.color} solid />
								<Text style={[styles.rowMeta, { color: scheme.textMuted }]}>{categoryName}</Text>
							</View>
						) : retiredMeta ? (
							<Text style={[styles.rowMeta, { color: scheme.textMuted }]}>{retiredMeta.name}</Text>
						) : null}
						{tx.seriesId && (
							<>
								{categoryName && <Text style={[styles.rowMeta, { color: scheme.textMuted }]}>·</Text>}
								<Ionicons name="repeat" size={12} color={scheme.textMuted} />
								<Text style={[styles.seriesBadgeText, { color: scheme.textMuted }]}>Recurring</Text>
							</>
						)}
					</View>
				</View>
				<Text style={[styles.rowAmount, tx.mode === "spent" ? styles.amountSpent : styles.amountEarned]}>
					{sign}
					{formatCentsDisplay(tx.amountCents)}
				</Text>
				<Ionicons name={isLocked ? "lock-closed-outline" : "chevron-forward"} size={16} color={scheme.textMuted} />
			</Pressable>
		</ReanimatedSwipeable>
	);
}

function startOfDay(date: Date): Date {
	const d = new Date(date);
	d.setHours(0, 0, 0, 0);
	return d;
}

function splitByDate(transactions: Transaction[]) {
	const today = startOfDay(new Date()).getTime();
	const upcoming: Transaction[] = [];
	const completed: Transaction[] = [];
	for (const tx of transactions) {
		const day = startOfDay(new Date(tx.date)).getTime();
		if (day > today) upcoming.push(tx);
		else completed.push(tx);
	}
	return { upcoming, completed };
}

type DayGroup = { key: string; label: string; items: Transaction[] };

function groupByDay(transactions: Transaction[], reverse: boolean): DayGroup[] {
	const map = new Map<string, Transaction[]>();
	for (const tx of transactions) {
		const d = startOfDay(new Date(tx.date));
		const key = d.toISOString().slice(0, 10);
		const list = map.get(key);
		if (list) list.push(tx);
		else map.set(key, [tx]);
	}

	const today = startOfDay(new Date());
	const yesterday = new Date(today);
	yesterday.setDate(yesterday.getDate() - 1);
	const tomorrow = new Date(today);
	tomorrow.setDate(tomorrow.getDate() + 1);

	const sortedKeys = Array.from(map.keys()).sort();
	const ordered = reverse ? sortedKeys.reverse() : sortedKeys;

	return ordered.map((key) => {
		const date = new Date(`${key}T00:00:00`);
		return {
			key,
			label: dayLabel(date, today, yesterday, tomorrow),
			items: map
				.get(key)!
				.slice()
				.sort((a, b) => (a.date < b.date ? -1 : 1)),
		};
	});
}

function dayLabel(date: Date, today: Date, yesterday: Date, tomorrow: Date): string {
	const sameDay = (a: Date, b: Date) =>
		a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
	if (sameDay(date, today)) return "Today";
	if (sameDay(date, yesterday)) return "Yesterday";
	if (sameDay(date, tomorrow)) return "Tomorrow";
	return date.toLocaleDateString(undefined, {
		weekday: "short",
		month: "short",
		day: "numeric",
		year: date.getFullYear() === today.getFullYear() ? undefined : "numeric",
	});
}
