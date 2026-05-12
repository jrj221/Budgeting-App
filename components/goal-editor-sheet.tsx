import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
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
  formatAmountDisplay,
  formatCentsDisplay,
  sanitizeAmountDigits,
} from '@/components/add-transaction-card.presenter';
import { ColorPickerModal } from '@/components/color-picker-modal';
import { goalEditorStyles as styles } from '@/components/goal-editor-sheet.styles';
import { CategoryColorPalette, Palette, pickNextCategoryColor } from '@/constants/colors';
import { useCategories } from '@/contexts/categories-context';
import { useGoals } from '@/contexts/goals-context';
import { computeGoalDerived, Goal, GoalCreationMode } from '@/utils/goal-calc';

const ACCESSORY_ID = 'goal-editor-done';

type GoalEditorSheetProps = {
  visible: boolean;
  goal?: Goal | null;
  onClose: () => void;
};

export function GoalEditorSheet({ visible, goal, onClose }: GoalEditorSheetProps) {
  const { categories, getCategory } = useCategories();
  const { addGoal, updateGoal } = useGoals();
  const isEditing = goal != null;

  const existingColors = categories.map((c) => c.color);
  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(() =>
    pickNextCategoryColor(existingColors.length ? existingColors : CategoryColorPalette.slice()),
  );
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [targetDigits, setTargetDigits] = useState('');
  const [mode, setMode] = useState<GoalCreationMode>('fromWeeks');
  const [weeksDraft, setWeeksDraft] = useState('12');
  const [weeklyDollarsDraft, setWeeklyDollarsDraft] = useState('20');
  const targetInputRef = useRef<TextInput>(null);

  const translateY = useSharedValue(0);
  const baseY = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;
    translateY.value = 0;
    baseY.value = 0;
    if (goal) {
      const cat = getCategory(goal.categoryId);
      setName(goal.name);
      setColor(cat?.color ?? Palette.brand);
      setTargetDigits(String(goal.targetCents));
      setMode('fromWeeks');
      setWeeksDraft(String(goal.weeksTarget));
      setWeeklyDollarsDraft(String(Math.round(goal.weeklyContributionCents / 100)));
    } else {
      setName('');
      setColor(
        pickNextCategoryColor(existingColors.length ? existingColors : CategoryColorPalette.slice()),
      );
      setTargetDigits('');
      setMode('fromWeeks');
      setWeeksDraft('12');
      setWeeklyDollarsDraft('20');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, goal]);

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

  const targetCents = parseInt(targetDigits || '0', 10);
  const weeksValue = parseInt(weeksDraft || '0', 10);
  const weeklyCentsValue = parseInt(weeklyDollarsDraft || '0', 10) * 100;
  const derived = computeGoalDerived({
    name,
    color,
    targetCents,
    mode,
    weeklyContributionCents: weeklyCentsValue,
    weeksTarget: weeksValue,
  });
  const canSave =
    name.trim().length > 0 &&
    targetCents > 0 &&
    derived.weeks > 0 &&
    derived.weeklyCents > 0;

  const handleSave = () => {
    if (!canSave) return;
    const draft = {
      name,
      color,
      targetCents,
      mode,
      weeklyContributionCents: weeklyCentsValue,
      weeksTarget: weeksValue,
    };
    const result = isEditing ? updateGoal(goal!.id, draft) : addGoal(draft);
    if (result) onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalRoot}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <Animated.View style={[styles.sheet, sheetAnimatedStyle]}>
          <GestureDetector gesture={dragGesture}>
            <View style={styles.dragHandleArea}>
              <View style={styles.grabber} />
              <View style={styles.header}>
                <Pressable onPress={onClose} hitSlop={10}>
                  <Text style={styles.headerLeft}>Cancel</Text>
                </Pressable>
                <Text style={styles.headerTitle}>{isEditing ? 'Edit goal' : 'New goal'}</Text>
                <View style={styles.headerRight} />
              </View>
            </View>
          </GestureDetector>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.body}>
            <View style={styles.nameRow}>
              <Pressable
                onPress={() => setColorPickerOpen(true)}
                hitSlop={6}
                style={styles.editColorBtn}>
                <View style={[styles.catDot, { backgroundColor: color }]} />
                <View style={styles.editColorBadge}>
                  <Ionicons name="color-palette" size={10} color={Palette.iconMuted} />
                </View>
              </Pressable>
              <TextInput
                style={styles.nameInput}
                placeholder="Goal name (e.g. New laptop)"
                placeholderTextColor={Palette.iconMuted}
                value={name}
                onChangeText={setName}
                returnKeyType="done"
              />
            </View>

            <View>
              <Text style={styles.label}>Target amount</Text>
              <Pressable
                style={styles.amountWrap}
                onPress={() => targetInputRef.current?.focus()}>
                <Text style={[styles.amount, !targetDigits && styles.amountMuted]}>
                  {formatAmountDisplay(targetDigits)}
                </Text>
                <TextInput
                  ref={targetInputRef}
                  value={targetDigits}
                  onChangeText={(v) => setTargetDigits(sanitizeAmountDigits(v))}
                  keyboardType="number-pad"
                  style={styles.hiddenInput}
                  caretHidden
                  maxLength={9}
                  inputAccessoryViewID={ACCESSORY_ID}
                />
              </Pressable>
            </View>

            <View style={styles.modeToggle}>
              {(
                [
                  { id: 'fromWeeks', label: 'Set a deadline' },
                  { id: 'fromWeekly', label: 'Set a weekly amount' },
                ] as { id: GoalCreationMode; label: string }[]
              ).map((opt) => {
                const active = mode === opt.id;
                return (
                  <Pressable
                    key={opt.id}
                    onPress={() => setMode(opt.id)}
                    style={[styles.modeBtn, active && styles.modeBtnActive]}>
                    <Text style={[styles.modeText, active && styles.modeTextActive]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {mode === 'fromWeeks' ? (
              <>
                <Text style={styles.label}>Weeks until I want it</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.numberInput}
                    keyboardType="number-pad"
                    inputAccessoryViewID={ACCESSORY_ID}
                    value={weeksDraft}
                    onChangeText={(v) => setWeeksDraft(v.replace(/\D/g, ''))}
                    maxLength={4}
                  />
                  <Text style={{ color: Palette.textMuted }}>weeks</Text>
                </View>
                <View style={styles.derivedCard}>
                  <Text style={styles.derivedTitle}>You&apos;ll need to save</Text>
                  <Text style={styles.derivedValue}>
                    {formatCentsDisplay(derived.weeklyCents)} / week
                  </Text>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.label}>Weekly contribution</Text>
                <View style={styles.inputRow}>
                  <Text style={{ color: Palette.textMuted }}>$</Text>
                  <TextInput
                    style={styles.numberInput}
                    keyboardType="number-pad"
                    inputAccessoryViewID={ACCESSORY_ID}
                    value={weeklyDollarsDraft}
                    onChangeText={(v) => setWeeklyDollarsDraft(v.replace(/\D/g, ''))}
                    maxLength={5}
                  />
                  <Text style={{ color: Palette.textMuted }}>/ week</Text>
                </View>
                <View style={styles.derivedCard}>
                  <Text style={styles.derivedTitle}>You&apos;ll hit your target in</Text>
                  <Text style={styles.derivedValue}>{derived.weeks} weeks</Text>
                </View>
              </>
            )}

            <Pressable
              style={[styles.saveBtn, !canSave && styles.saveDisabled]}
              disabled={!canSave}
              onPress={handleSave}>
              <Text style={styles.saveText}>{isEditing ? 'Save changes' : 'Create goal'}</Text>
            </Pressable>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>

      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID={ACCESSORY_ID}>
          <View style={styles.kbAccessory}>
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

      <ColorPickerModal
        visible={colorPickerOpen}
        initialColor={color}
        title="Pick a color"
        onClose={() => setColorPickerOpen(false)}
        onSelect={setColor}
      />
    </Modal>
  );
}
