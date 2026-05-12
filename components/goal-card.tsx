import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import {
  Alert,
  InputAccessoryView,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  formatAmountDisplay,
  formatCentsDisplay,
  sanitizeAmountDigits,
} from '@/components/add-transaction-card.presenter';
import { BudgetProgressBar } from '@/components/budget-progress-bar';
import { goalCardStyles as styles } from '@/components/goal-card.styles';
import { Palette, paleColor } from '@/constants/colors';
import { useGoals } from '@/contexts/goals-context';
import { useTransactions } from '@/contexts/transactions-context';
import { computeGoalProgress, Goal, weeksSince } from '@/utils/goal-calc';

const ACCESSORY_ID_BASE = 'goal-amount-done';

type GoalCardProps = {
  goal: Goal;
  color: string;
  onEdit: () => void;
};

export function GoalCard({ goal, color, onEdit }: GoalCardProps) {
  const { transactions } = useTransactions();
  const { contributeToGoal, withdrawFromGoal, deleteGoal } = useGoals();

  const progress = computeGoalProgress(transactions, goal.categoryId, goal.targetCents);
  const elapsed = weeksSince(goal.createdAt);
  // Only count COMPLETED weeks for pace — a brand-new goal isn't behind during
  // its first week.
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

  return (
    <View style={[styles.card, { borderTopColor: color }]}>
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: color }]}>
          <Ionicons name="flag" size={11} color="#fff" />
          <Text style={styles.badgeText}>Goal</Text>
        </View>
        <Text style={styles.name}>{goal.name}</Text>
        <Pressable style={styles.iconBtn} onPress={onEdit} hitSlop={6}>
          <Ionicons name="create-outline" size={18} color={Palette.text} />
        </Pressable>
        <Pressable style={styles.iconBtn} onPress={onDelete} hitSlop={6}>
          <Ionicons name="trash-outline" size={18} color={Palette.spent} />
        </Pressable>
      </View>

      <View style={styles.amountRow}>
        <Text style={styles.saved}>{formatCentsDisplay(Math.max(0, progress.netCents))}</Text>
        <Text style={styles.target}>of {formatCentsDisplay(goal.targetCents)}</Text>
      </View>

      <Text style={styles.weekly}>{weeklyLabel}</Text>

      <BudgetProgressBar
        color={color}
        backgroundColor={paleColor(color)}
        actualFraction={progress.fractionComplete}
        plannedFraction={0}
        patternKey={`goal-${goal.id}`}
      />

      <Text style={paceStyle}>{paceLabel}</Text>
      {expectedLabel && <Text style={styles.pace}>{expectedLabel}</Text>}

      <View style={styles.actions}>
        <Pressable
          style={[styles.actionBtn, styles.contribute]}
          onPress={() => setContributeOpen(true)}>
          <Ionicons name="add" size={16} color="#fff" />
          <Text style={styles.contributeText}>Contribute</Text>
        </Pressable>
        <Pressable
          style={[styles.actionBtn, styles.withdraw]}
          onPress={() => setWithdrawOpen(true)}>
          <Ionicons name="remove" size={16} color={Palette.text} />
          <Text style={styles.withdrawText}>Withdraw</Text>
        </Pressable>
      </View>

      <AmountInputModal
        visible={contributeOpen}
        title={`Contribute to ${goal.name}`}
        body={`Logged as an expense in the "${goal.name}" category.`}
        confirmLabel="Contribute"
        accessoryId={`${ACCESSORY_ID_BASE}-contribute-${goal.id}`}
        onClose={() => setContributeOpen(false)}
        onConfirm={(cents) => {
          contributeToGoal(goal.id, cents);
        }}
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
  const [digits, setDigits] = useState('');
  const inputRef = useRef<TextInput>(null);

  const cents = parseInt(digits || '0', 10);
  const exceedsMax = typeof maxCents === 'number' && cents > maxCents;
  const canSubmit = cents > 0 && !exceedsMax;

  const dismiss = () => {
    Keyboard.dismiss();
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
      <KeyboardAvoidingView
        style={styles.amountInputModalRoot}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.amountInputCard}>
          <Text style={styles.amountInputTitle}>{title}</Text>
          <Text style={styles.amountInputBody}>{body}</Text>
          <Pressable
            style={styles.amountInputWrap}
            onPress={() => inputRef.current?.focus()}>
            <Text style={[styles.amountInputText, !digits && styles.amountInputMuted]}>
              {formatAmountDisplay(digits)}
            </Text>
            <TextInput
              ref={inputRef}
              value={digits}
              onChangeText={(v) => setDigits(sanitizeAmountDigits(v))}
              keyboardType="number-pad"
              style={styles.hiddenInput}
              caretHidden
              maxLength={9}
              inputAccessoryViewID={accessoryId}
              autoFocus
            />
          </Pressable>
          {exceedsMax && (
            <Text style={{ fontSize: 12, color: Palette.spent, textAlign: 'center' }}>
              Max available: {formatCentsDisplay(maxCents ?? 0)}
            </Text>
          )}
          <View style={styles.buttonRow}>
            <Pressable style={styles.secondaryBtn} onPress={dismiss}>
              <Text style={styles.secondaryText}>Cancel</Text>
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
      </KeyboardAvoidingView>

      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID={accessoryId}>
          <View style={styles.amountAccessory}>
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
