import { Ionicons } from "@expo/vector-icons";
import { useCallback, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GoalCard, GoalCardSectionRefs } from "@/components/goal-card";
import { GoalEditorSheet } from "@/components/goal-editor-sheet";
import { HelpButton } from "@/components/help-button";
import { Palette } from "@/constants/colors";
import { useCategories } from "@/contexts/categories-context";
import { useGoals } from "@/contexts/goals-context";
import { useAppTheme } from "@/contexts/theme-context";
import { useTransactions } from "@/contexts/transactions-context";
import { styles } from "@/styles/goals.styles";
import { generateSampleGoalTransactions, generateSampleTransactions } from "@/utils/sample-transactions";

const GOALS_HELP_STEPS = [
	{
		title: "Goal cards",
		body: "Each goal tracks progress toward a savings target. Contributing logs an expense in the goal's category; withdrawing logs income.",
	},
	{
		title: "Progress bar",
		body: "The solid fill is money saved so far. The textured section shows planned future contributions already scheduled.",
	},
	{
		title: "Pace marker (◎)",
		body: "The circle on the bar marks where you should be today to stay on pace. Behind it means you're falling behind schedule. If you don't see it, that means you're on pace!",
	},
	{
		title: "Contribute / Withdraw",
		body: "Contribute to add money, optionally on a repeat schedule. Withdraw to take money back out — it returns to your balance as income.",
	},
	{
		title: "Complete goal",
		body: "When you hit your target, a Complete button appears. Completing keeps the saved amount in the category rather than refunding it to your balance.",
	},
];

export default function GoalsScreen() {
	const { scheme } = useAppTheme();
	const { goals, addGoal, contributeToGoal, replaceAll: replaceAllGoals } = useGoals();
	const { categories, getCategory, replaceAll: replaceAllCats } = useCategories();
	const { transactions, addTransactions, replaceAll: replaceAllTx } = useTransactions();
	const [editorOpen, setEditorOpen] = useState(false);
	const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

	const scrollRef = useRef<ScrollView>(null);
	const contentRef = useRef<View>(null);
	const progressBarRef = useRef<View>(null);
	const actionsRef = useRef<View>(null);

	const goalSectionRefs: GoalCardSectionRefs = { progressBar: progressBarRef, actions: actionsRef };

	// step 0: whole first card, 1-2: progress bar, 3-4: actions
	const stepTargets = [contentRef, progressBarRef, progressBarRef, actionsRef, actionsRef];

	const tourSnapshotRef = useRef<{ goals: typeof goals; tx: typeof transactions; cats: typeof categories } | null>(
		null,
	);
	const needsSampleData = goals.length === 0;

	const onTourStart = useCallback(() => {
		if (!needsSampleData) return;
		tourSnapshotRef.current = { goals: [...goals], tx: [...transactions], cats: [...categories] };
		addTransactions(generateSampleTransactions());
		const sampleGoal = addGoal({
			name: "New laptop",
			color: "#22c55e",
			icon: "laptop",
			targetCents: 120000,
			mode: "fromWeeks",
			weeksTarget: 24,
			weeklyContributionCents: 5000,
		});
		if (sampleGoal) {
			contributeToGoal(sampleGoal.id, 25000);
			addTransactions(generateSampleGoalTransactions(sampleGoal.categoryId, sampleGoal.name));
		}
	}, [needsSampleData, goals, transactions, categories, addGoal, contributeToGoal, addTransactions]);

	const onTourDismiss = useCallback(() => {
		const snap = tourSnapshotRef.current;
		if (!snap) return;
		replaceAllGoals(snap.goals);
		replaceAllTx(snap.tx);
		replaceAllCats(snap.cats);
		tourSnapshotRef.current = null;
	}, [replaceAllGoals, replaceAllTx, replaceAllCats]);

	const editingGoal = editingGoalId ? (goals.find((g) => g.id === editingGoalId) ?? null) : null;

	const openEditor = (goalId?: string) => {
		setEditingGoalId(goalId ?? null);
		setEditorOpen(true);
	};

	const closeEditor = () => {
		setEditorOpen(false);
		setEditingGoalId(null);
	};

	return (
		<SafeAreaView style={[styles.safe, { backgroundColor: scheme.background }]} edges={["top"]}>
			<ScrollView ref={scrollRef} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
				<View style={styles.header}>
					<View style={styles.headerLeft}>
						<Text style={[styles.title, { color: scheme.text }]}>Goals</Text>
						<Text style={[styles.subtitle, { color: scheme.textMuted }]}>
							Save toward something specific.
						</Text>
					</View>
					<View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
						<HelpButton
							steps={GOALS_HELP_STEPS}
							stepTargets={stepTargets}
							scrollRef={scrollRef}
							onStart={onTourStart}
							onDismiss={onTourDismiss}
						/>
						<Pressable style={styles.addBtn} onPress={() => openEditor()} hitSlop={6}>
							<Ionicons name="add" size={26} color="#fff" />
						</Pressable>
					</View>
				</View>

				{goals.length === 0 ? (
					<View
						ref={contentRef}
						collapsable={false}
						style={[styles.empty, { backgroundColor: scheme.cardBackground }]}
					>
						<Ionicons name="flag-outline" size={28} color={Palette.iconMuted} />
						<Text style={[styles.emptyTitle, { color: scheme.text }]}>No goals yet</Text>
						<Text style={[styles.emptyBody, { color: scheme.textMuted }]}>
							Set a target amount and either a deadline or a weekly contribution. Each goal creates its
							own category so any transaction you log against it counts.
						</Text>
						<Pressable style={styles.emptyCta} onPress={() => openEditor()}>
							<Text style={styles.emptyCtaText}>Create a goal</Text>
						</Pressable>
					</View>
				) : (
					<View style={styles.list}>
						<Text style={[styles.paceHint, { color: scheme.textMuted }]}>
							The ◎ marker on a goal's progress bar shows where you should be at today's date to stay on
							pace.
						</Text>
						{goals.map((goal, i) => {
							const cat = getCategory(goal.categoryId);
							const color = cat?.color ?? Palette.brand;
							return (
								<View key={goal.id} ref={i === 0 ? contentRef : undefined} collapsable={false}>
									<GoalCard
										goal={goal}
										color={color}
										onEdit={() => openEditor(goal.id)}
										sectionRefs={i === 0 ? goalSectionRefs : undefined}
									/>
								</View>
							);
						})}
					</View>
				)}
			</ScrollView>

			<GoalEditorSheet visible={editorOpen} goal={editingGoal} onClose={closeEditor} />
		</SafeAreaView>
	);
}
