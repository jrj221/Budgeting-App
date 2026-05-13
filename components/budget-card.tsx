import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Svg, { Line, Rect } from "react-native-svg";

import { effectiveBudgetCents, formatCentsDisplay } from "@/components/add-transaction-card.presenter";
import { budgetCardStyles as styles } from "@/components/budget-card.styles";
import { BudgetProgressBar } from "@/components/budget-progress-bar";
import { Palette, paleColor } from "@/constants/colors";
import { useCategories } from "@/contexts/categories-context";
import { useAppTheme } from "@/contexts/theme-context";
import { useTransactions } from "@/contexts/transactions-context";
import { BudgetWindow, computeUsage } from "@/utils/budget-calc";

type BudgetCardProps = {
	onOpenEditor: () => void;
};

const TOGGLE_LABELS: Record<BudgetWindow, string> = {
	week: "Week",
	month: "Month",
};

export function BudgetCard({ onOpenEditor }: BudgetCardProps) {
	const { categories } = useCategories();
	const { transactions } = useTransactions();
	const { scheme } = useAppTheme();
	const [window, setWindow] = useState<BudgetWindow>("week");

	const items = useMemo(() => {
		return categories
			.filter((c) => !c.isGoal)
			.map((cat) => {
				const budget = effectiveBudgetCents(cat, window);
				if (budget <= 0) return null;
				const usage = computeUsage(transactions, cat.id, window);
				return { cat, budget, ...usage };
			})
			.filter((x): x is NonNullable<typeof x> => x !== null);
	}, [categories, transactions, window]);

	return (
		<View style={[styles.container, { backgroundColor: scheme.cardBackground }]}>
			<View style={styles.header}>
				<View style={styles.headerLeft}>
					<Text style={[styles.title, { color: scheme.text }]}>Budget</Text>
					<Text style={[styles.subtitle, { color: scheme.textMuted }]}>How much room you have left.</Text>
				</View>

				<View style={[styles.toggle, { backgroundColor: scheme.toggleTrack }]}>
					{(Object.keys(TOGGLE_LABELS) as BudgetWindow[]).map((w) => {
						const active = window === w;
						return (
							<Pressable
								key={w}
								onPress={() => setWindow(w)}
								style={[
									styles.toggleBtn,
									active && [styles.toggleBtnActive, { backgroundColor: scheme.cardBackground }],
								]}
							>
								<Text
									style={[
										styles.toggleText,
										{ color: scheme.textMuted },
										active && [styles.toggleTextActive, { color: scheme.text }],
									]}
								>
									{TOGGLE_LABELS[w]}
								</Text>
							</Pressable>
						);
					})}
				</View>

				<Pressable
					onPress={onOpenEditor}
					style={[styles.plusBtn, { backgroundColor: scheme.surface, borderColor: scheme.border }]}
					hitSlop={6}
				>
					<Text style={{ color: scheme.text, fontSize: 14, fontWeight: "600" }}>Edit</Text>
				</Pressable>
			</View>

			{items.length === 0 ? (
				<View style={styles.empty}>
					<Ionicons name="wallet-outline" size={26} color={scheme.textMuted} />
					<Text style={[styles.emptyText, { color: scheme.textMuted }]}>
						No budgets set yet. Tap Edit to choose how much you want to spend per category.
					</Text>
					<Pressable onPress={onOpenEditor} style={styles.emptyCta}>
						<Text style={styles.emptyCtaText}>Set budgets</Text>
					</Pressable>
				</View>
			) : (
				<View style={styles.list}>
					{items.map((item) => (
						<BudgetRow key={item.cat.id} {...item} />
					))}
					<View style={styles.legend}>
						<View style={styles.legendItem}>
							<View style={[styles.legendSwatch, { backgroundColor: scheme.text }]} />
							<Text style={[styles.legendText, { color: scheme.textMuted }]}>Spent</Text>
						</View>
						<View style={styles.legendItem}>
							<StripesSwatch />
							<Text style={[styles.legendText, { color: scheme.textMuted }]}>Planned</Text>
						</View>
					</View>
				</View>
			)}
		</View>
	);
}

function BudgetRow({
	cat,
	budget,
	actualCents,
	plannedCents,
}: {
	cat: { id: string; name: string; color: string; icon: string };
	budget: number;
	actualCents: number;
	plannedCents: number;
}) {
	const { scheme } = useAppTheme();
	const actualFraction = budget > 0 ? actualCents / budget : 0;
	const plannedFraction = budget > 0 ? plannedCents / budget : 0;
	const projectedTotal = actualCents + plannedCents;
	const overBudget = actualCents > budget;
	const projectedOver = projectedTotal > budget && !overBudget;

	let metaText = "";
	if (overBudget) {
		metaText = `Over by ${formatCentsDisplay(actualCents - budget)}`;
	} else if (plannedCents > 0) {
		if (projectedOver) {
			metaText = `${formatCentsDisplay(plannedCents)} planned — projected ${formatCentsDisplay(actualCents - budget + plannedCents)} over`;
		} else {
			metaText = `${formatCentsDisplay(plannedCents)} planned`;
		}
	} else {
		metaText = `${formatCentsDisplay(Math.max(0, budget - actualCents))} left`;
	}

	return (
		<View style={styles.row}>
			<View style={styles.rowHeader}>
				<View style={styles.rowLeft}>
					<View
						style={[
							styles.dot,
							{ backgroundColor: cat.color + "22", alignItems: "center", justifyContent: "center" },
						]}
					>
						<FontAwesome5 name={cat.icon as any} size={12} color={cat.color} solid />
					</View>
					<Text style={[styles.rowName, { color: scheme.text }]}>{cat.name}</Text>
				</View>
				<Text style={[styles.rowAmounts, { color: scheme.text }, overBudget && styles.rowAmountsOver]}>
					{formatCentsDisplay(actualCents)} / {formatCentsDisplay(budget)}
				</Text>
			</View>
			<BudgetProgressBar
				color={cat.color}
				backgroundColor={paleColor(cat.color)}
				actualFraction={actualFraction}
				plannedFraction={plannedFraction}
				patternKey={cat.id}
			/>
			<Text style={[styles.rowMeta, { color: scheme.textMuted }]}>{metaText}</Text>
		</View>
	);
}

function StripesSwatch() {
	const w = 14;
	const h = 8;
	const spacing = 5;
	const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
	const count = Math.ceil((w + h) / spacing) + 1;
	for (let i = 0; i < count; i++) {
		const x = -h + i * spacing;
		lines.push({ x1: x, y1: h, x2: x + h, y2: 0 });
	}
	return (
		<View style={{ width: w, height: h, borderRadius: 2, overflow: "hidden" }}>
			<Svg width={w} height={h}>
				<Rect x={0} y={0} width={w} height={h} fill={Palette.surface} />
				{lines.map((s, i) => (
					<Line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={Palette.text} strokeWidth={2} />
				))}
			</Svg>
		</View>
	);
}
