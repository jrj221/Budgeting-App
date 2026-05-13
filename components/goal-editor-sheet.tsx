import { FontAwesome5, Ionicons } from '@expo/vector-icons';
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
import { IconPickerModal } from '@/components/icon-picker-modal';
import { goalEditorStyles as styles } from '@/components/goal-editor-sheet.styles';
import { CategoryColorPalette, isColorSchemeDark, Palette, pickNextCategoryColor } from '@/constants/colors';
import { useCategories } from '@/contexts/categories-context';
import { useAppTheme } from '@/contexts/theme-context';
import { useGoals } from '@/contexts/goals-context';
import { computeGoalDerived, Goal, GoalCreationMode } from '@/utils/goal-calc';

const ACCESSORY_ID = 'goal-editor-done';

type GoalEditorSheetProps = {
  visible: boolean;
  goal?: Goal | null;
  onClose: () => void;
};

export function GoalEditorSheet({ visible, goal, onClose }: GoalEditorSheetProps) {
  const { scheme } = useAppTheme();
  const isDark = isColorSchemeDark(scheme);
  const { categories, getCategory } = useCategories();
  const { addGoal, updateGoal } = useGoals();
  const isEditing = goal != null;

  const existingColors = categories.map((c) => c.color);
  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(() =>
    pickNextCategoryColor(existingColors.length ? existingColors : CategoryColorPalette.slice()),
  );
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [icon, setIcon] = useState('flag');
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
      setIcon(cat?.icon ?? 'flag');
      setTargetDigits(String(goal.targetCents));
      setMode(goal.creationMode);
      setWeeksDraft(String(goal.weeksTarget));
      setWeeklyDollarsDraft(String(Math.round(goal.weeklyContributionCents / 100)));
    } else {
      setName('');
      setColor(
        pickNextCategoryColor(existingColors.length ? existingColors : CategoryColorPalette.slice()),
      );
      setIcon('flag');
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
      icon,
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
        <Animated.View style={[styles.sheet, { backgroundColor: scheme.background }, sheetAnimatedStyle]}>
          <GestureDetector gesture={dragGesture}>
            <View style={styles.dragHandleArea}>
              <View style={styles.grabber} />
              <View style={[styles.header, { borderBottomColor: scheme.border }]}>
                <Pressable onPress={onClose} hitSlop={10}>
                  <Text style={[styles.headerLeft, { color: scheme.textMuted }]}>Cancel</Text>
                </Pressable>
                <Text style={[styles.headerTitle, { color: scheme.text }]}>{isEditing ? 'Edit goal' : 'New goal'}</Text>
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
                style={[styles.editColorBtn, { backgroundColor: scheme.surface }]}>
                <View style={[styles.catDot, { backgroundColor: color }]} />
                <View style={[styles.editColorBadge, { backgroundColor: scheme.surface }]}>
                  <Ionicons name="color-palette" size={10} color={Palette.iconMuted} />
                </View>
              </Pressable>
              <Pressable
                onPress={() => setIconPickerOpen(true)}
                hitSlop={6}
                style={[styles.editColorBtn, { backgroundColor: color + '18' }]}>
                <FontAwesome5 name={icon as any} size={14} color={color} solid />
              </Pressable>
              <TextInput
                style={[styles.nameInput, { backgroundColor: scheme.surface, color: scheme.text }]}
                placeholder="Goal name (e.g. New laptop)"
                placeholderTextColor={scheme.textMuted}
                value={name}
                onChangeText={setName}
                returnKeyType="done"
              />
            </View>

            <View>
              <Text style={[styles.label, { color: scheme.textMuted }]}>Target amount</Text>
              <Pressable
                style={[styles.amountWrap, { backgroundColor: scheme.surface }]}
                onPress={() => targetInputRef.current?.focus()}>
                <Text style={[styles.amount, { color: scheme.text }, !targetDigits && styles.amountMuted]}>
                  {formatAmountDisplay(targetDigits)}
                </Text>
                <TextInput
                  ref={targetInputRef}
                  value={targetDigits}
                  onChangeText={(v) => setTargetDigits(sanitizeAmountDigits(v))}
                  keyboardType="number-pad"
                  keyboardAppearance={isDark ? 'dark' : 'light'}
                  style={styles.hiddenInput}
                  caretHidden
                  maxLength={9}
                  inputAccessoryViewID={ACCESSORY_ID}
                />
              </Pressable>
            </View>

            <View style={[styles.modeToggle, { backgroundColor: scheme.toggleTrack }]}>
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
                    style={[styles.modeBtn, active && styles.modeBtnActive, active && { backgroundColor: scheme.background }]}>
                    <Text style={[styles.modeText, { color: scheme.textMuted }, active && [styles.modeTextActive, { color: scheme.text }]]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {mode === 'fromWeeks' ? (
              <>
                <Text style={[styles.label, { color: scheme.textMuted }]}>Weeks until I want it</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={[styles.numberInput, { backgroundColor: scheme.surface, color: scheme.text }]}
                    keyboardType="number-pad"
                    keyboardAppearance={isDark ? 'dark' : 'light'}
                    inputAccessoryViewID={ACCESSORY_ID}
                    value={weeksDraft}
                    onChangeText={(v) => setWeeksDraft(v.replace(/\D/g, ''))}
                    maxLength={4}
                  />
                  <Text style={{ color: scheme.textMuted }}>weeks</Text>
                </View>
                <View style={[styles.derivedCard, { backgroundColor: scheme.surface }]}>
                  <Text style={[styles.derivedTitle, { color: scheme.textMuted }]}>You&apos;ll need to save</Text>
                  <Text style={[styles.derivedValue, { color: scheme.text }]}>
                    {formatCentsDisplay(derived.weeklyCents)} / week
                  </Text>
                </View>
              </>
            ) : (
              <>
                <Text style={[styles.label, { color: scheme.textMuted }]}>Weekly contribution</Text>
                <View style={styles.inputRow}>
                  <Text style={{ color: scheme.textMuted }}>$</Text>
                  <TextInput
                    style={[styles.numberInput, { backgroundColor: scheme.surface, color: scheme.text }]}
                    keyboardType="number-pad"
                    keyboardAppearance={isDark ? 'dark' : 'light'}
                    inputAccessoryViewID={ACCESSORY_ID}
                    value={weeklyDollarsDraft}
                    onChangeText={(v) => setWeeklyDollarsDraft(v.replace(/\D/g, ''))}
                    maxLength={5}
                  />
                  <Text style={{ color: scheme.textMuted }}>/ week</Text>
                </View>
                <View style={[styles.derivedCard, { backgroundColor: scheme.surface }]}>
                  <Text style={[styles.derivedTitle, { color: scheme.textMuted }]}>You&apos;ll hit your target in</Text>
                  <Text style={[styles.derivedValue, { color: scheme.text }]}>{derived.weeks} weeks</Text>
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

      <IconPickerModal
        visible={iconPickerOpen}
        selected={icon}
        color={color}
        title="Pick an icon"
        onClose={() => setIconPickerOpen(false)}
        onSelect={setIcon}
      />
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
