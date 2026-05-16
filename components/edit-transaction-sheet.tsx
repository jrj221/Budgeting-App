import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  InputAccessoryView,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import {
  formatCentsDisplay,
  formatDateLabel,
  Transaction,
  TransactionMode,
} from '@/components/add-transaction-card.presenter';
import { AmountInput } from '@/components/amount-input';
import { editStyles as styles } from '@/components/edit-transaction-sheet.styles';
import { isColorSchemeDark, ModeColors, Palette } from '@/constants/colors';
import { useCategories } from '@/contexts/categories-context';
import { useAppTheme } from '@/contexts/theme-context';
import { useGoals } from '@/contexts/goals-context';
import { useTransactions } from '@/contexts/transactions-context';

const EDIT_NUMPAD_ACCESSORY_ID = 'edit-number-pad-done';

type EditTransactionSheetProps = {
  visible: boolean;
  transaction: Transaction | null;
  onClose: () => void;
};

export function EditTransactionSheet({
  visible,
  transaction,
  onClose,
}: EditTransactionSheetProps) {
  const { scheme } = useAppTheme();
  const isDark = isColorSchemeDark(scheme);
  const { categories, getCategory } = useCategories();
  const { getGoalByCategory } = useGoals();
  const {
    transactions,
    updateTransaction,
    updateTransactionAndFuture,
    deleteTransaction,
    deleteTransactionAndFuture,
  } = useTransactions();

  const [mode, setMode] = useState<TransactionMode>('spent');
  const [amountDigits, setAmountDigits] = useState('');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);


  const translateY = useSharedValue(0);
  const baseY = useSharedValue(0);

  useEffect(() => {
    if (!transaction) return;
    setMode(transaction.mode);
    setAmountDigits(String(transaction.amountCents));
    setTitle(transaction.title);
    setDate(new Date(transaction.date));
    setCategoryId(transaction.categoryId);
    setIsDatePickerOpen(false);
  }, [transaction]);

  useEffect(() => {
    if (visible) {
      translateY.value = 0;
      baseY.value = 0;
    }
  }, [visible, translateY, baseY]);

  const dragGesture = useMemo(
    () =>
      Gesture.Pan()
        .onUpdate((e) => {
          translateY.value = Math.max(0, baseY.value + e.translationY);
        })
        .onEnd((e) => {
          const finalY = Math.max(0, baseY.value + e.translationY);
          if (finalY > 120 || e.velocityY > 800) {
            baseY.value = 0;
            translateY.value = withTiming(0, { duration: 180 });
            runOnJS(onClose)();
          } else {
            baseY.value = 0;
            translateY.value = withTiming(0, { duration: 180 });
          }
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onClose],
  );

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const isSeries = !!transaction?.seriesId;

  const txCategory = transaction ? getCategory(transaction.categoryId) : null;
  const isGoalTx = !!txCategory?.isGoal;
  const linkedGoal = isGoalTx ? getGoalByCategory(transaction!.categoryId) : null;
  const goalColor = txCategory?.color ?? Palette.brand;

  const autoGoalTitle = (m: TransactionMode) =>
    linkedGoal
      ? m === 'spent'
        ? `Save toward ${linkedGoal.name}`
        : `Withdraw from ${linkedGoal.name}`
      : title;

  const effectiveTitle = isGoalTx ? autoGoalTitle(mode) : title.trim();

  const canSubmit = useMemo(
    () => parseInt(amountDigits || '0', 10) > 0 && effectiveTitle.length > 0,
    [amountDigits, effectiveTitle],
  );

  const buildPatch = () => ({
    mode,
    amountCents: parseInt(amountDigits || '0', 10),
    title: effectiveTitle,
    date: date.toISOString(),
    categoryId,
  });

  const checkGoalBalance = (): { ok: boolean; resultingNet: number } => {
    if (!isGoalTx || !transaction || !linkedGoal) return { ok: true, resultingNet: 0 };
    const newAmount = parseInt(amountDigits || '0', 10);
    let otherNet = 0;
    for (const tx of transactions) {
      if (tx.id === transaction.id) continue;
      if (tx.categoryId !== linkedGoal.categoryId) continue;
      if (tx.mode === 'spent') otherNet += tx.amountCents;
      else if (tx.mode === 'earned') otherNet -= tx.amountCents;
    }
    const delta = mode === 'spent' ? newAmount : -newAmount;
    const resultingNet = otherNet + delta;
    return { ok: resultingNet >= 0, resultingNet };
  };

  const handleSaveOnly = () => {
    if (!transaction || !canSubmit) return;
    if (isGoalTx) {
      const { ok, resultingNet } = checkGoalBalance();
      if (!ok) {
        Alert.alert(
          'Not enough in this goal',
          `Saving this change would push your "${linkedGoal!.name}" goal balance to ${formatCentsDisplay(resultingNet)}. You can't withdraw more than is currently saved.`,
        );
        return;
      }
    }
    updateTransaction(transaction.id, buildPatch());
    onClose();
  };

  const handleSaveAndFuture = () => {
    if (!transaction || !canSubmit) return;
    updateTransactionAndFuture(transaction.id, buildPatch());
    onClose();
  };

  const handleDeleteOnly = () => {
    if (!transaction) return;
    Alert.alert('Delete this transaction?', 'This removes only this entry.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteTransaction(transaction.id);
          onClose();
        },
      },
    ]);
  };

  const handleDeleteAndFuture = () => {
    if (!transaction) return;
    Alert.alert(
      'Delete this and all future?',
      'This entry plus every future occurrence in the series will be removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete all',
          style: 'destructive',
          onPress: () => {
            deleteTransactionAndFuture(transaction.id);
            onClose();
          },
        },
      ],
    );
  };

  if (!transaction) return null;
  const originalCategory = categories.find((c) => c.id === transaction.categoryId) ?? null;
  const selectedCategory = categories.find((c) => c.id === categoryId) ?? null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalRoot}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <Animated.View style={[styles.sheet, { backgroundColor: scheme.background }, sheetAnimatedStyle]}>
          <GestureDetector gesture={dragGesture}>
            <View style={styles.dragHandleArea}>
              <View style={styles.grabber} />
              <View style={[styles.header, { borderBottomColor: scheme.border }]}>
                <Pressable onPress={onClose} hitSlop={10}>
                  <Text style={[styles.headerCancel, { color: scheme.textMuted }]}>Cancel</Text>
                </Pressable>
                <Text style={[styles.headerTitle, { color: scheme.text }]}>Edit transaction</Text>
                <View style={styles.headerSpacer} />
              </View>
            </View>
          </GestureDetector>

          <ScrollView
            contentContainerStyle={styles.body}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {isGoalTx && linkedGoal && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  padding: 12,
                  borderRadius: 12,
                  backgroundColor: goalColor + '22',
                  borderLeftWidth: 4,
                  borderLeftColor: goalColor,
                }}>
                <Ionicons name="flag" size={18} color={goalColor} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: scheme.text }}>
                    {mode === 'spent' ? 'Goal contribution' : 'Goal withdrawal'}
                  </Text>
                  <Text style={{ fontSize: 12, color: scheme.textMuted }}>
                    {linkedGoal.name} · Title and category are managed by the goal.
                  </Text>
                </View>
              </View>
            )}

            <View style={[styles.modeRow, { backgroundColor: scheme.toggleTrack }]}>
              {(['spent', 'earned'] as TransactionMode[]).map((m) => {
                const active = mode === m;
                return (
                  <Pressable
                    key={m}
                    onPress={() => setMode(m)}
                    style={[
                      styles.modeBtn,
                      active && styles.modeBtnActive,
                      active && { backgroundColor: ModeColors[m] },
                    ]}>
                    <Text style={[styles.modeText, { color: scheme.textMuted }, active && styles.modeTextActive]}>
                      {m === 'spent' ? 'Spent' : 'Earned'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <AmountInput
              digits={amountDigits}
              onChangeDigits={setAmountDigits}
              accessoryViewId={EDIT_NUMPAD_ACCESSORY_ID}
              wrapStyle={styles.amountWrap}
              textStyle={[styles.amount, { color: scheme.text }]}
              placeholderStyle={styles.amountMuted}
            />

            {isGoalTx ? (
              <View style={[styles.titleInput, { backgroundColor: scheme.surface, justifyContent: 'center' }]}>
                <Text style={{ fontSize: 17, fontWeight: '500', color: scheme.text }}>
                  {effectiveTitle}
                </Text>
              </View>
            ) : (
              <TextInput
                style={[styles.titleInput, { backgroundColor: scheme.surface, color: scheme.text }]}
                placeholder="What's it for?"
                placeholderTextColor={scheme.textMuted}
                value={title}
                onChangeText={setTitle}
                returnKeyType="done"
              />
            )}

            <Pressable
              style={[styles.row, { backgroundColor: scheme.surface }]}
              onPress={() => {
                Keyboard.dismiss();
                setIsDatePickerOpen((v) => !v);
              }}>
              <View style={styles.rowLeft}>
                <Ionicons name="calendar-outline" size={20} color={scheme.text} />
                <Text style={[styles.rowLabel, { color: scheme.text }]}>Date</Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={[styles.rowValue, { color: scheme.text }]}>{formatDateLabel(date)}</Text>
                <Ionicons
                  name={isDatePickerOpen ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={scheme.textMuted}
                />
              </View>
            </Pressable>
            {isDatePickerOpen && (
              <View style={[styles.wheelWrap, styles.calendarWrap, { backgroundColor: scheme.surface, borderColor: scheme.border }]}>
                <View style={styles.calendarScale}>
                  <DateTimePicker
                    value={date}
                    mode="date"
                    display="inline"
                    themeVariant={isDark ? 'dark' : 'light'}
                    accentColor={scheme.lineChart}
                    onChange={(_, d) => {
                      if (d) setDate(d);
                    }}
                  />
                </View>
              </View>
            )}

            {!isGoalTx && (
            <View>
              <Text style={[styles.rowLabel, { color: scheme.text, marginBottom: 8 }]}>Category</Text>
              <View style={styles.catGrid}>
                <Pressable
                  onPress={() => setCategoryId(null)}
                  style={[styles.catChip, { backgroundColor: scheme.surface, borderColor: scheme.border }, categoryId === null && [styles.catChipActive, { backgroundColor: scheme.background, borderColor: Palette.brand }]]}>
                  <View style={[styles.catDot, { backgroundColor: Palette.uncategorized }]} />
                  <Text style={[styles.catName, { color: scheme.text }]}>None</Text>
                </Pressable>
                {categories.map((cat) => {
                  const active = categoryId === cat.id;
                  return (
                    <Pressable
                      key={cat.id}
                      onPress={() => setCategoryId(cat.id)}
                      style={[styles.catChip, { backgroundColor: scheme.surface, borderColor: scheme.border }, active && [styles.catChipActive, { backgroundColor: scheme.background, borderColor: Palette.brand }]]}>
                      <View style={[styles.catDot, { backgroundColor: cat.color }]} />
                      <Text style={[styles.catName, { color: scheme.text }]}>{cat.name}</Text>
                    </Pressable>
                  );
                })}
              </View>
              {originalCategory && categoryId !== transaction.categoryId && (
                <Text style={{ marginTop: 6, fontSize: 12, color: scheme.textMuted }}>
                  Previously: {originalCategory.name}
                </Text>
              )}
            </View>
            )}

            <Pressable
              style={[styles.saveBtn, !canSubmit && styles.saveDisabled]}
              disabled={!canSubmit}
              onPress={handleSaveOnly}>
              <Text style={styles.saveText}>{isSeries ? 'Save only this' : 'Save'}</Text>
            </Pressable>

            {isSeries && (
              <Pressable
                style={styles.saveAltBtn}
                disabled={!canSubmit}
                onPress={handleSaveAndFuture}>
                <Text style={styles.saveAltText}>Save this & future occurrences</Text>
              </Pressable>
            )}

            <View style={styles.dangerZone}>
              <Pressable style={styles.dangerBtn} onPress={handleDeleteOnly}>
                <Ionicons name="trash-outline" size={18} color={Palette.spent} />
                <Text style={styles.dangerText}>Delete this transaction</Text>
              </Pressable>
              {isSeries && (
                <Pressable style={styles.dangerBtn} onPress={handleDeleteAndFuture}>
                  <Ionicons name="trash-bin-outline" size={18} color={Palette.spent} />
                  <Text style={styles.dangerText}>Delete this & all future</Text>
                </Pressable>
              )}
            </View>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>

      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID={EDIT_NUMPAD_ACCESSORY_ID}>
          <View style={[styles.kbAccessory, { backgroundColor: scheme.surface, borderTopColor: scheme.border }]}>
            <Pressable
              onPress={() => Keyboard.dismiss()}
              hitSlop={10}
              style={styles.kbAccessoryBtn}>
              <Ionicons name="checkmark" size={22} color={Palette.brand} />
              <Text style={styles.kbAccessoryText}>Done</Text>
            </Pressable>
          </View>
        </InputAccessoryView>
      )}
    </Modal>
  );
}
