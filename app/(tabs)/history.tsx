import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { styles } from '@/app/(tabs)/history.styles';
import {
  formatCentsDisplay,
  Transaction,
} from '@/components/add-transaction-card.presenter';
import { EditTransactionSheet } from '@/components/edit-transaction-sheet';
import { useCategories } from '@/contexts/categories-context';
import { useAppTheme } from '@/contexts/theme-context';
import { useTransactions } from '@/contexts/transactions-context';
import { Palette } from '@/constants/colors';

type TabKey = 'upcoming' | 'completed';

const TAB_LABELS: Record<TabKey, string> = {
  upcoming: 'Upcoming',
  completed: 'Completed',
};

export default function HistoryScreen() {
  const { transactions } = useTransactions();
  const { scheme } = useAppTheme();
  const [tab, setTab] = useState<TabKey>('upcoming');
  const [editingId, setEditingId] = useState<string | null>(null);

  const { upcoming, completed } = useMemo(() => splitByDate(transactions), [transactions]);
  const visible = tab === 'upcoming' ? upcoming : completed;
  const editing = editingId ? transactions.find((t) => t.id === editingId) ?? null : null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: scheme.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: scheme.text }]}>History</Text>
          <Text style={[styles.subtitle, { color: scheme.textMuted }]}>
            Past activity and what's planned next.
          </Text>
        </View>

        <View style={styles.tabBar}>
          {(Object.keys(TAB_LABELS) as TabKey[]).map((key) => {
            const active = tab === key;
            const count = key === 'upcoming' ? upcoming.length : completed.length;
            return (
              <Pressable
                key={key}
                onPress={() => setTab(key)}
                style={[styles.tabBtn, active && styles.tabBtnActive]}>
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {TAB_LABELS[key]} {count > 0 ? `(${count})` : ''}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {visible.length === 0 ? (
          <EmptyState tab={tab} />
        ) : (
          <TransactionGroupedList
            transactions={visible}
            reverse={tab === 'completed'}
            onSelect={setEditingId}
          />
        )}
      </ScrollView>

      <EditTransactionSheet
        visible={editing !== null}
        transaction={editing}
        onClose={() => setEditingId(null)}
      />
    </SafeAreaView>
  );
}

function EmptyState({ tab }: { tab: TabKey }) {
  return (
    <View style={[styles.list, styles.empty]}>
      <Ionicons
        name={tab === 'upcoming' ? 'calendar-outline' : 'time-outline'}
        size={28}
        color={Palette.iconMuted}
      />
      <Text style={styles.emptyTitle}>
        {tab === 'upcoming' ? 'No upcoming transactions' : 'No completed transactions'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {tab === 'upcoming'
          ? 'Schedule a recurring transaction to see future entries here.'
          : 'Add your first transaction to start building history.'}
      </Text>
    </View>
  );
}

function TransactionGroupedList({
  transactions,
  reverse,
  onSelect,
}: {
  transactions: Transaction[];
  reverse: boolean;
  onSelect: (id: string) => void;
}) {
  const groups = useMemo(() => groupByDay(transactions, reverse), [transactions, reverse]);

  return (
    <View style={{ gap: 16 }}>
      {groups.map((group) => (
        <View key={group.key}>
          <Text style={styles.groupHeader}>{group.label}</Text>
          <View style={styles.list}>
            {group.items.map((tx, index) => (
              <TransactionRow
                key={tx.id}
                tx={tx}
                isLast={index === group.items.length - 1}
                onPress={() => onSelect(tx.id)}
              />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

function TransactionRow({
  tx,
  isLast,
  onPress,
}: {
  tx: Transaction;
  isLast: boolean;
  onPress: () => void;
}) {
  const { getCategory } = useCategories();
  const category = getCategory(tx.categoryId);
  const categoryName = category?.name ?? null;
  const sign = tx.mode === 'spent' ? '-' : '+';
  const isGoalTx = !!category?.isGoal;
  const goalColor = category?.color;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.row,
        isLast && styles.rowLast,
        isGoalTx && goalColor ? { borderLeftWidth: 4, borderLeftColor: goalColor, paddingLeft: 12 } : null,
      ]}>
      <View style={styles.rowMain}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {isGoalTx && goalColor && (
            <Ionicons name="flag" size={14} color={goalColor} />
          )}
          <Text style={styles.rowTitle}>{tx.title}</Text>
        </View>
        <View style={styles.seriesBadge}>
          {isGoalTx && goalColor && (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999, backgroundColor: goalColor }}>
                <Ionicons name={tx.mode === 'spent' ? 'arrow-up' : 'arrow-down'} size={9} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>
                  {tx.mode === 'spent' ? 'Contribution' : 'Withdrawal'}
                </Text>
              </View>
              {(categoryName || tx.seriesId) && <Text style={styles.rowMeta}>·</Text>}
            </>
          )}
          {category && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <FontAwesome5 name={category.icon as any} size={11} color={category.color} solid />
                <Text style={styles.rowMeta}>{categoryName}</Text>
              </View>
            )}
          {tx.seriesId && (
            <>
              {categoryName && <Text style={styles.rowMeta}>·</Text>}
              <Ionicons name="repeat" size={12} color={Palette.textMuted} />
              <Text style={styles.seriesBadgeText}>Recurring</Text>
            </>
          )}
        </View>
      </View>
      <Text
        style={[
          styles.rowAmount,
          tx.mode === 'spent' ? styles.amountSpent : styles.amountEarned,
        ]}>
        {sign}
        {formatCentsDisplay(tx.amountCents)}
      </Text>
      <Ionicons name="chevron-forward" size={16} color={Palette.iconMuted} />
    </Pressable>
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
      items: map.get(key)!.slice().sort((a, b) => (a.date < b.date ? -1 : 1)),
    };
  });
}

function dayLabel(date: Date, today: Date, yesterday: Date, tomorrow: Date): string {
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (sameDay(date, today)) return 'Today';
  if (sameDay(date, yesterday)) return 'Yesterday';
  if (sameDay(date, tomorrow)) return 'Tomorrow';
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() === today.getFullYear() ? undefined : 'numeric',
  });
}
