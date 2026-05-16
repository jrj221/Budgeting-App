import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { type RefObject, useEffect, useState } from 'react';
import {
  Alert,
  InputAccessoryView,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  buildTransactionSeries,
  formatCentsDisplay,
  formatRepeatSummary,
  makeInitialRepeatConfig,
  REPEAT_PERIOD_LABELS,
  RepeatConfig,
  RepeatEndMode,
  RepeatPeriod,
  Transaction,
} from '@/components/add-transaction-card.presenter';
import { AmountInput } from '@/components/amount-input';
import { BudgetProgressBar } from '@/components/budget-progress-bar';
import { goalCardStyles as styles } from '@/components/goal-card.styles';
import { isColorSchemeDark, Palette, paleColor } from '@/constants/colors';
import { useAppTheme } from '@/contexts/theme-context';
import { useGoals } from '@/contexts/goals-context';
import { useTransactions } from '@/contexts/transactions-context';
import { computeGoalProgress, Goal, weeksSince } from '@/utils/goal-calc';

const ACCESSORY_ID_BASE = 'goal-amount-done';

export type GoalCardSectionRefs = {
  progressBar?: RefObject<View | null>;
  actions?: RefObject<View | null>;
};

type GoalCardProps = {
  goal: Goal;
  color: string;
  onEdit: () => void;
  sectionRefs?: GoalCardSectionRefs;
};

export function GoalCard({ goal, color, onEdit, sectionRefs }: GoalCardProps) {
  const { transactions } = useTransactions();
  const { contributeSeriestoGoal, withdrawFromGoal, deleteGoal, completeGoal } = useGoals();
  const { scheme } = useAppTheme();
  const isDark = isColorSchemeDark(scheme);

  const now = new Date();
  // end of today — transactions dated "today" count as actual, not planned
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);
  const pastTransactions = transactions.filter((tx) => new Date(tx.date) <= endOfToday);
  const progress = computeGoalProgress(pastTransactions, goal.categoryId, goal.targetCents);
  const elapsed = weeksSince(goal.createdAt);
  const completedWeeks = Math.floor(elapsed);
  const expectedNet = goal.weeklyContributionCents * completedWeeks;
  const isComplete = progress.netCents >= goal.targetCents && goal.targetCents > 0;
  const onPace = progress.netCents >= expectedNet;
  const weeksLeft = Math.max(
    0,
    Math.ceil(
      (goal.targetCents - progress.netCents) /
        Math.max(1, goal.weeklyContributionCents),
    ),
  );

  // Future planned contributions (for progress bar) — strictly after today
  const futureCents = transactions
    .filter(
      (tx) =>
        tx.categoryId === goal.categoryId &&
        tx.mode === 'spent' &&
        new Date(tx.date) > endOfToday,
    )
    .reduce((sum, tx) => sum + tx.amountCents, 0);
  const plannedFraction = goal.targetCents > 0 ? futureCents / goal.targetCents : 0;

  // Pace marker: only show when week > 0 and user isn't already exactly on expected pace
  const paceMarkerFraction =
    goal.targetCents > 0 && completedWeeks > 0 && progress.netCents !== expectedNet
      ? Math.min(1, expectedNet / goal.targetCents)
      : undefined;

  const [contributeOpen, setContributeOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const refundCents = Math.max(0, progress.netCents);
  const remainingTargetCents = Math.max(0, goal.targetCents - progress.netCents);
  const remainingPlannedWeeks = Math.max(0, goal.weeksTarget - completedWeeks);
  const weeksAtPlannedRate =
    goal.weeklyContributionCents > 0
      ? Math.ceil(remainingTargetCents / goal.weeklyContributionCents)
      : 0;
  const requiredWeeklyToHitDeadline =
    remainingPlannedWeeks > 0
      ? Math.ceil(remainingTargetCents / remainingPlannedWeeks)
      : remainingTargetCents;
  const expectedCompletionDate = new Date(
    Date.now() + weeksAtPlannedRate * 7 * 24 * 60 * 60 * 1000,
  );
  const expectedLabel = isComplete
    ? null
    : `Expected completion: ${expectedCompletionDate.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })}`;

  const goalDeadline =
    goal.weeksTarget > 0
      ? new Date(new Date(goal.createdAt).getTime() + goal.weeksTarget * 7 * 24 * 60 * 60 * 1000)
      : null;

  const weeklyLabel = `Save ${formatCentsDisplay(goal.weeklyContributionCents)} / week for ${goal.weeksTarget} weeks`;

  let paceLabel: string;
  let paceStyle = styles.pace;
  if (isComplete) {
    const overCents = Math.max(0, progress.netCents - goal.targetCents);
    if (overCents > 0) {
      paceLabel = `${formatCentsDisplay(overCents)} above goal · Goal reached — nice work.`;
    } else {
      paceLabel = 'Goal reached — nice work.';
    }
    paceStyle = [styles.pace, styles.paceComplete] as never;
  } else if (goal.targetCents <= 0) {
    paceLabel = 'Set a target to start tracking pace.';
  } else if (onPace) {
    paceLabel = `On pace · about ${weeksLeft} weeks to go.`;
  } else if (goal.creationMode === 'fromWeeks') {
    paceLabel = `Behind pace · save ${formatCentsDisplay(requiredWeeklyToHitDeadline)} / week to still hit your ${goal.weeksTarget}-week target.`;
  } else {
    const extraWeeks = Math.max(0, weeksAtPlannedRate - remainingPlannedWeeks);
    paceLabel = `Behind pace · ${extraWeeks} extra week${extraWeeks === 1 ? '' : 's'} added at your current rate.`;
  }

  const onDelete = () => {
    Alert.alert(
      'Delete this goal?',
      refundCents > 0
        ? `The ${formatCentsDisplay(refundCents)} you've saved will be returned to your balance as income, and the category will be removed.`
        : 'Removes the goal and its category. There is nothing currently saved to return.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteGoal(goal.id),
        },
      ],
    );
  };

  const onComplete = () => {
    Alert.alert(
      'Complete this goal?',
      `This marks "${goal.name}" as done. The ${formatCentsDisplay(refundCents)} saved stays in your goal — it won't be returned to your balance.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: () => completeGoal(goal.id),
        },
      ],
    );
  };

  return (
    <View style={[styles.card, { borderTopColor: color, backgroundColor: scheme.cardBackground }]}>
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: color }]}>
          <Ionicons name="flag" size={11} color="#fff" />
          <Text style={styles.badgeText}>Goal</Text>
        </View>
        <Text style={[styles.name, { color: scheme.text }]}>{goal.name}</Text>
        <Pressable style={styles.iconBtn} onPress={onEdit} hitSlop={6}>
          <Ionicons name="create-outline" size={18} color={scheme.text} />
        </Pressable>
        <Pressable style={styles.iconBtn} onPress={onDelete} hitSlop={6}>
          <Ionicons name="trash-outline" size={18} color={Palette.spent} />
        </Pressable>
      </View>

      <View style={styles.amountRow}>
        <Text style={[styles.saved, { color: scheme.text }]}>{formatCentsDisplay(Math.max(0, progress.netCents))}</Text>
        <Text style={[styles.target, { color: scheme.textMuted }]}>of {formatCentsDisplay(goal.targetCents)}</Text>
      </View>

      <Text style={[styles.weekly, { color: scheme.textMuted }]}>{weeklyLabel}</Text>

      <View ref={sectionRefs?.progressBar} collapsable={false}>
        <BudgetProgressBar
          color={color}
          backgroundColor={paleColor(color)}
          actualFraction={progress.fractionComplete}
          plannedFraction={plannedFraction}
          paceMarkerFraction={paceMarkerFraction}
          patternKey={`goal-${goal.id}`}
        />
        <Text style={[paceStyle, { color: isComplete ? Palette.earned : scheme.textMuted }]}>{paceLabel}</Text>
        {expectedLabel && <Text style={[styles.pace, { color: scheme.textMuted }]}>{expectedLabel}</Text>}
      </View>

      <View ref={sectionRefs?.actions} collapsable={false}>
        {isComplete && (
          <Pressable
            style={[styles.actionBtn, { backgroundColor: Palette.earned, marginTop: 0 }]}
            onPress={onComplete}>
            <Ionicons name="checkmark-circle" size={16} color="#fff" />
            <Text style={styles.contributeText}>Complete Goal</Text>
          </Pressable>
        )}
        <View style={styles.actions}>
          <Pressable
            style={[styles.actionBtn, styles.contribute]}
            onPress={() => setContributeOpen(true)}>
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={styles.contributeText}>Contribute</Text>
          </Pressable>
          <Pressable
            style={[styles.actionBtn, styles.withdraw, { backgroundColor: scheme.surface, borderColor: scheme.border }]}
            onPress={() => setWithdrawOpen(true)}>
            <Ionicons name="remove" size={16} color={scheme.text} />
            <Text style={[styles.withdrawText, { color: scheme.text }]}>Withdraw</Text>
          </Pressable>
        </View>
      </View>

      <ContributeSheet
        visible={contributeOpen}
        goal={goal}
        goalDeadline={goalDeadline}
        onClose={() => setContributeOpen(false)}
        onConfirm={(txs) => contributeSeriestoGoal(goal.id, txs)}
      />
      <AmountInputModal
        visible={withdrawOpen}
        title={`Withdraw from ${goal.name}`}
        body={`Logged as income in the "${goal.name}" category. Are you sure you want to take from this savings goal?`}
        confirmLabel="Withdraw"
        maxCents={refundCents}
        confirmDestructive
        requireConfirmAlert
        accessoryId={`${ACCESSORY_ID_BASE}-withdraw-${goal.id}`}
        onClose={() => setWithdrawOpen(false)}
        onConfirm={(cents) => {
          withdrawFromGoal(goal.id, cents);
        }}
      />
    </View>
  );
}

// ─── Contribute Sheet (with repeat support) ───────────────────────────────────

type ContributeSheetProps = {
  visible: boolean;
  goal: Goal;
  goalDeadline: Date | null;
  onClose: () => void;
  onConfirm: (txs: Transaction[]) => void;
};

function ContributeSheet({ visible, goal, goalDeadline, onClose, onConfirm }: ContributeSheetProps) {
  const { scheme } = useAppTheme();
  const isDark = isColorSchemeDark(scheme);
  const [digits, setDigits] = useState('');
  const [repeat, setRepeat] = useState<RepeatConfig>(() => makeInitialRepeatConfig());
  const accessoryId = `${ACCESSORY_ID_BASE}-contribute-${goal.id}`;

  useEffect(() => {
    if (visible) {
      setDigits('');
      setRepeat(makeInitialRepeatConfig());
    }
  }, [visible]);

  const cents = parseInt(digits || '0', 10);
  const canSubmit = cents > 0;

  const dismiss = () => {
    onClose();
  };

  const handleConfirm = () => {
    if (!canSubmit) return;
    const txs = buildTransactionSeries(
      {
        mode: 'spent',
        amountDigits: digits,
        title: `Save toward ${goal.name}`,
        date: new Date(),
        categoryId: goal.categoryId,
      },
      repeat,
    );
    onConfirm(txs);
    dismiss();
  };

  // Cap end date to goal deadline if set
  const maxEndDate = goalDeadline ?? undefined;

  const setRepeatEndDate = (d: Date) => {
    const capped = maxEndDate && d > maxEndDate ? maxEndDate : d;
    setRepeat((r) => ({ ...r, endDate: capped }));
  };

  const setRepeatEnabled = (enabled: boolean) => {
    setRepeat((r) => {
      const base = { ...r, enabled };
      if (enabled && maxEndDate && base.endDate > maxEndDate) {
        base.endDate = maxEndDate;
      }
      return base;
    });
  };

  const periodOptions: RepeatPeriod[] = ['weeks', 'months'];
  const endModeOptions: RepeatEndMode[] = ['date', 'count'];
  const periodLabel = (p: RepeatPeriod) =>
    repeat.every === 1 ? REPEAT_PERIOD_LABELS[p].singular : REPEAT_PERIOD_LABELS[p].plural;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={dismiss}>
      <ScrollView
        style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.45)' }}
        contentContainerStyle={{ minHeight: '100%', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 32 }}
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
        bounces={false}
        directionalLockEnabled>
        {/* Backdrop — renders under the card, tap to dismiss */}
        <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />
        {/* Card — rendered after backdrop so it sits on top */}
        <Pressable onPress={() => {}}>
        <View style={[styles.amountInputCard, { backgroundColor: scheme.surface }]}>
          <Text style={[styles.amountInputTitle, { color: scheme.text }]}>
            Contribute to {goal.name}
          </Text>
          <Text style={[styles.amountInputBody, { color: scheme.textMuted }]}>
            Logged as an expense in the &quot;{goal.name}&quot; category.
          </Text>

          <AmountInput
            digits={digits}
            onChangeDigits={setDigits}
            accessoryViewId={accessoryId}
            wrapStyle={[styles.amountInputWrap, { backgroundColor: scheme.toggleTrack }]}
            textStyle={[styles.amountInputText, { color: scheme.text }]}
            placeholderStyle={styles.amountInputMuted}
          />

            {/* Repeat toggle */}
            <View style={[repeatStyles.toggleRow, { backgroundColor: scheme.toggleTrack, borderColor: scheme.border }]}>
              <View style={repeatStyles.rowLeft}>
                <Ionicons name="repeat" size={18} color={scheme.text} />
                <Text style={[repeatStyles.label, { color: scheme.text }]}>Repeat</Text>
              </View>
              <Switch
                value={repeat.enabled}
                onValueChange={setRepeatEnabled}
                trackColor={{ false: Palette.switchTrackOff, true: Palette.brand }}
                ios_backgroundColor={Palette.switchTrackOff}
              />
            </View>

            {repeat.enabled && (
              <>
                <View style={repeatStyles.everyRow}>
                  <Text style={[repeatStyles.label, { color: scheme.text }]}>Every</Text>
                  <TextInput
                    style={[repeatStyles.numberInput, { backgroundColor: scheme.surface, color: scheme.text }]}
                    keyboardType="number-pad"
                    value={String(repeat.every)}
                    inputAccessoryViewID={accessoryId}
                    onChangeText={(v) => {
                      const n = parseInt(v.replace(/\D/g, ''), 10);
                      if (Number.isFinite(n) && n >= 1) setRepeat((r) => ({ ...r, every: n }));
                    }}
                    maxLength={3}
                  />
                  <View style={[repeatStyles.periodToggle, { backgroundColor: scheme.toggleTrack }]}>
                    {periodOptions.map((p) => {
                      const active = repeat.period === p;
                      return (
                        <Pressable
                          key={p}
                          onPress={() => setRepeat((r) => ({ ...r, period: p }))}
                          style={[repeatStyles.periodBtn, active && repeatStyles.periodBtnActive, active && { backgroundColor: scheme.background }]}>
                          <Text style={[repeatStyles.periodText, { color: scheme.textMuted }, active && { color: scheme.text, fontWeight: '700' }]}>
                            {periodLabel(p)}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View style={[repeatStyles.endToggle, { backgroundColor: scheme.toggleTrack }]}>
                  {endModeOptions.map((m) => {
                    const active = repeat.endMode === m;
                    return (
                      <Pressable
                        key={m}
                        onPress={() => setRepeat((r) => ({ ...r, endMode: m }))}
                        style={[repeatStyles.endBtn, active && repeatStyles.endBtnActive, active && { backgroundColor: scheme.cardBackground }]}>
                        <Text style={[repeatStyles.periodText, { color: scheme.textMuted }, active && { color: scheme.text, fontWeight: '700' }]}>
                          {m === 'date' ? 'Until date' : 'After N times'}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {repeat.endMode === 'date' ? (
                  <View style={{ borderRadius: 12, overflow: 'hidden', backgroundColor: scheme.surface }}>
                    <DateTimePicker
                      value={repeat.endDate}
                      mode="date"
                      display="spinner"
                      themeVariant={isDark ? 'dark' : 'light'}
                      textColor={scheme.text}
                      maximumDate={maxEndDate}
                      onChange={(_, d) => { if (d) setRepeatEndDate(d); }}
                    />
                    {maxEndDate && (
                      <Text style={{ fontSize: 11, color: scheme.textMuted, textAlign: 'center', paddingBottom: 8 }}>
                        Capped at goal deadline: {maxEndDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </Text>
                    )}
                  </View>
                ) : (
                  <View style={[repeatStyles.toggleRow, { backgroundColor: scheme.surface, borderColor: scheme.border }]}>
                    <Text style={[repeatStyles.label, { color: scheme.text }]}>Number of times</Text>
                    <TextInput
                      style={[repeatStyles.numberInput, { backgroundColor: scheme.cardBackground, color: scheme.text }]}
                      keyboardType="number-pad"
                      inputAccessoryViewID={accessoryId}
                      value={String(repeat.count)}
                      onChangeText={(v) => {
                        const n = parseInt(v.replace(/\D/g, ''), 10);
                        if (Number.isFinite(n) && n >= 1) setRepeat((r) => ({ ...r, count: n }));
                      }}
                      maxLength={3}
                    />
                  </View>
                )}

                <Text style={{ fontSize: 12, color: scheme.textMuted, textAlign: 'center' }}>
                  {formatRepeatSummary(repeat)}
                </Text>
              </>
            )}

          <View style={styles.buttonRow}>
            <Pressable style={[styles.secondaryBtn, { backgroundColor: scheme.toggleTrack, borderColor: scheme.border }]} onPress={dismiss}>
              <Text style={[styles.secondaryText, { color: scheme.text }]}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.primaryBtn, !canSubmit && styles.primaryDisabled]}
              disabled={!canSubmit}
              onPress={handleConfirm}>
              <Text style={styles.primaryText}>Contribute</Text>
            </Pressable>
          </View>
        </View>
        </Pressable>
      </ScrollView>

      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID={accessoryId}>
          <View style={[styles.amountAccessory, { backgroundColor: scheme.surface, borderTopColor: scheme.border }]}>
            <Pressable onPress={() => Keyboard.dismiss()} hitSlop={10} style={styles.amountAccessoryBtn}>
              <Ionicons name="checkmark" size={22} color={Palette.brand} />
              <Text style={styles.amountAccessoryText}>Done</Text>
            </Pressable>
          </View>
        </InputAccessoryView>
      )}
    </Modal>
  );
}

const repeatStyles = {
  toggleRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  rowLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '500' as const,
  },
  everyRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  numberInput: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 15,
    minWidth: 52,
    textAlign: 'center' as const,
  },
  periodToggle: {
    flex: 1,
    flexDirection: 'row' as const,
    borderRadius: 999,
    padding: 3,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center' as const,
    borderRadius: 999,
  },
  periodBtnActive: {},
  periodText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  endToggle: {
    flexDirection: 'row' as const,
    borderRadius: 999,
    padding: 3,
  },
  endBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center' as const,
    borderRadius: 999,
  },
  endBtnActive: {},
};

// ─── Simple amount-input modal (for withdrawals) ───────────────────────────────

type AmountInputModalProps = {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  confirmDestructive?: boolean;
  requireConfirmAlert?: boolean;
  maxCents?: number;
  accessoryId: string;
  onClose: () => void;
  onConfirm: (cents: number) => void;
};

function AmountInputModal({
  visible,
  title,
  body,
  confirmLabel,
  confirmDestructive,
  requireConfirmAlert,
  maxCents,
  accessoryId,
  onClose,
  onConfirm,
}: AmountInputModalProps) {
  const { scheme } = useAppTheme();
  const [digits, setDigits] = useState('');

  const cents = parseInt(digits || '0', 10);
  const exceedsMax = typeof maxCents === 'number' && cents > maxCents;
  const canSubmit = cents > 0 && !exceedsMax;

  const dismiss = () => {
    setDigits('');
    onClose();
  };

  const performConfirm = () => {
    onConfirm(cents);
    dismiss();
  };

  const handleConfirm = () => {
    if (!canSubmit) return;
    if (requireConfirmAlert) {
      Alert.alert(
        'Are you sure?',
        `Taking ${formatCentsDisplay(cents)} out of this goal will count as income against it.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Take it out', style: 'destructive', onPress: performConfirm },
        ],
      );
    } else {
      performConfirm();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={dismiss}>
      <ScrollView
        style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.45)' }}
        contentContainerStyle={{ minHeight: '100%', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 32 }}
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
        bounces={false}
        directionalLockEnabled>
        {/* Backdrop — renders under the card, tap to dismiss */}
        <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />
        {/* Card — rendered after backdrop so it sits on top */}
        <Pressable onPress={() => {}}>
          <View style={[styles.amountInputCard, { backgroundColor: scheme.surface }]}>
            <Text style={[styles.amountInputTitle, { color: scheme.text }]}>{title}</Text>
            <Text style={[styles.amountInputBody, { color: scheme.textMuted }]}>{body}</Text>
            <AmountInput
              digits={digits}
              onChangeDigits={setDigits}
              accessoryViewId={accessoryId}
              wrapStyle={[styles.amountInputWrap, { backgroundColor: scheme.toggleTrack }]}
              textStyle={[styles.amountInputText, { color: scheme.text }]}
              placeholderStyle={styles.amountInputMuted}
            />
            {exceedsMax && (
              <Text style={{ fontSize: 12, color: Palette.spent, textAlign: 'center' }}>
                Max available: {formatCentsDisplay(maxCents ?? 0)}
              </Text>
            )}
            <View style={styles.buttonRow}>
              <Pressable style={[styles.secondaryBtn, { backgroundColor: scheme.toggleTrack, borderColor: scheme.border }]} onPress={dismiss}>
                <Text style={[styles.secondaryText, { color: scheme.text }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.primaryBtn,
                  !canSubmit && styles.primaryDisabled,
                  confirmDestructive && { backgroundColor: Palette.spent },
                ]}
                disabled={!canSubmit}
                onPress={handleConfirm}>
                <Text style={styles.primaryText}>{confirmLabel}</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </ScrollView>

      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID={accessoryId}>
          <View style={[styles.amountAccessory, { backgroundColor: scheme.surface, borderTopColor: scheme.border }]}>
            <Pressable
              onPress={() => Keyboard.dismiss()}
              hitSlop={10}
              style={styles.amountAccessoryBtn}>
              <Ionicons name="checkmark" size={22} color={Palette.brand} />
              <Text style={styles.amountAccessoryText}>Done</Text>
            </Pressable>
          </View>
        </InputAccessoryView>
      )}
    </Modal>
  );
}
