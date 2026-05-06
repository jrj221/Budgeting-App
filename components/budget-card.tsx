import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';

import {
  effectiveBudgetCents,
  formatCentsDisplay,
} from '@/components/add-transaction-card.presenter';
import { budgetCardStyles as styles } from '@/components/budget-card.styles';
import { BudgetProgressBar } from '@/components/budget-progress-bar';
import { Palette, paleColor } from '@/constants/colors';
import { useCategories } from '@/contexts/categories-context';
import { useTransactions } from '@/contexts/transactions-context';
import { BudgetWindow, computeUsage } from '@/utils/budget-calc';

type BudgetCardProps = {
  onOpenEditor: () => void;
};

const TOGGLE_LABELS: Record<BudgetWindow, string> = {
  week: 'Week',
  month: 'Month',
};

export function BudgetCard({ onOpenEditor }: BudgetCardProps) {
  const { categories } = useCategories();
  const { transactions } = useTransactions();
  const [window, setWindow] = useState<BudgetWindow>('week');

  const items = useMemo(() => {
    return categories
      .map((cat) => {
        const budget = effectiveBudgetCents(cat, window);
        if (budget <= 0) return null;
        const usage = computeUsage(transactions, cat.id, window);
        return { cat, budget, ...usage };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [categories, transactions, window]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Budget</Text>
          <Text style={styles.subtitle}>How much room you have left.</Text>
        </View>

        <View style={styles.toggle}>
          {(Object.keys(TOGGLE_LABELS) as BudgetWindow[]).map((w) => {
            const active = window === w;
            return (
              <Pressable
                key={w}
                onPress={() => setWindow(w)}
                style={[styles.toggleBtn, active && styles.toggleBtnActive]}>
                <Text style={[styles.toggleText, active && styles.toggleTextActive]}>
                  {TOGGLE_LABELS[w]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable onPress={onOpenEditor} style={styles.plusBtn} hitSlop={6}>
          <Ionicons name="add" size={20} color={Palette.text} />
        </Pressable>
      </View>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="wallet-outline" size={26} color={Palette.iconMuted} />
          <Text style={styles.emptyText}>
            No budgets set yet. Tap the + to choose how much you want to spend per category.
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
              <View style={[styles.legendSwatch, { backgroundColor: Palette.text }]} />
              <Text style={styles.legendText}>Spent</Text>
            </View>
            <View style={styles.legendItem}>
              <StripesSwatch />
              <Text style={styles.legendText}>Planned</Text>
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
  cat: { id: string; name: string; color: string };
  budget: number;
  actualCents: number;
  plannedCents: number;
}) {
  const actualFraction = budget > 0 ? actualCents / budget : 0;
  const plannedFraction = budget > 0 ? plannedCents / budget : 0;
  const projectedTotal = actualCents + plannedCents;
  const overBudget = actualCents > budget;
  const projectedOver = projectedTotal > budget && !overBudget;

  let metaText = '';
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
          <View style={[styles.dot, { backgroundColor: cat.color }]} />
          <Text style={styles.rowName}>{cat.name}</Text>
        </View>
        <Text style={[styles.rowAmounts, overBudget && styles.rowAmountsOver]}>
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
      <Text style={styles.rowMeta}>{metaText}</Text>
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
    <View style={{ width: w, height: h, borderRadius: 2, overflow: 'hidden' }}>
      <Svg width={w} height={h}>
        <Rect x={0} y={0} width={w} height={h} fill={Palette.surface} />
        {lines.map((s, i) => (
          <Line
            key={i}
            x1={s.x1}
            y1={s.y1}
            x2={s.x2}
            y2={s.y2}
            stroke={Palette.text}
            strokeWidth={2}
          />
        ))}
      </Svg>
    </View>
  );
}
