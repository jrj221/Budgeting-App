import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
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

import { Category } from '@/components/add-transaction-card.presenter';
import { budgetEditorStyles as styles } from '@/components/budget-editor-sheet.styles';
import { Palette } from '@/constants/colors';
import { useCategories } from '@/contexts/categories-context';

const ACCESSORY_ID = 'budget-editor-done';

type BudgetEditorSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** When true, primary button reads "Save and continue" and a Skip option is shown. */
  tourMode?: boolean;
  onSkip?: () => void;
};

export function BudgetEditorSheet({
  visible,
  onClose,
  tourMode = false,
  onSkip,
}: BudgetEditorSheetProps) {
  const { categories, addCategory, deleteCategory, renameCategory, setCategoryBudget } =
    useCategories();

  const translateY = useSharedValue(0);
  const baseY = useSharedValue(0);

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
                  <Text style={styles.headerLeft}>{tourMode ? 'Later' : 'Cancel'}</Text>
                </Pressable>
                <Text style={styles.headerTitle}>Budget</Text>
                <Pressable onPress={onClose} hitSlop={10}>
                  <Text style={styles.headerRight}>{tourMode ? '' : 'Done'}</Text>
                </Pressable>
              </View>
            </View>
          </GestureDetector>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 8 }}>
            <Text style={styles.hint}>
              Pick how much you want to spend each week. Monthly is auto-calculated as
              weekly × 4 — toggle to manual to set it yourself.
            </Text>

            <View style={styles.list}>
              {categories.map((cat) => (
                <CategoryRow
                  key={cat.id}
                  category={cat}
                  onRename={renameCategory}
                  onDelete={deleteCategory}
                  onSetBudget={setCategoryBudget}
                />
              ))}

              <AddCategoryRow onAdd={(name) => addCategory(name)} />
            </View>

            {tourMode && (
              <>
                <Pressable style={styles.primaryBtn} onPress={onClose}>
                  <Text style={styles.primaryText}>Save and continue</Text>
                </Pressable>
                {onSkip && (
                  <Pressable style={styles.skipBtn} onPress={onSkip}>
                    <Text style={styles.skipText}>Skip — set this up later</Text>
                  </Pressable>
                )}
              </>
            )}
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
    </Modal>
  );
}

function CategoryRow({
  category,
  onRename,
  onDelete,
  onSetBudget,
}: {
  category: Category;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onSetBudget: (
    id: string,
    weeklyCents: number | null,
    monthlyOverrideCents: number | null,
  ) => void;
}) {
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(category.name);
  const [weeklyDraft, setWeeklyDraft] = useState(
    category.weeklyBudgetCents != null ? String(Math.round(category.weeklyBudgetCents / 100)) : '',
  );
  const monthlyMode: 'auto' | 'manual' = category.monthlyOverrideCents == null ? 'auto' : 'manual';
  const monthlyAutoDollars =
    category.weeklyBudgetCents != null ? Math.round(category.weeklyBudgetCents * 4 / 100) : 0;
  const [manualMonthlyDraft, setManualMonthlyDraft] = useState(
    category.monthlyOverrideCents != null
      ? String(Math.round(category.monthlyOverrideCents / 100))
      : '',
  );

  useEffect(() => {
    setDraftName(category.name);
    setWeeklyDraft(
      category.weeklyBudgetCents != null
        ? String(Math.round(category.weeklyBudgetCents / 100))
        : '',
    );
    setManualMonthlyDraft(
      category.monthlyOverrideCents != null
        ? String(Math.round(category.monthlyOverrideCents / 100))
        : '',
    );
  }, [category.id, category.name, category.weeklyBudgetCents, category.monthlyOverrideCents]);

  const commitName = () => {
    setEditingName(false);
    if (draftName.trim() && draftName.trim() !== category.name) {
      onRename(category.id, draftName.trim());
    } else {
      setDraftName(category.name);
    }
  };

  const commitWeekly = (raw: string) => {
    const dollars = parseInt(raw.replace(/\D/g, ''), 10);
    const cents = Number.isFinite(dollars) && dollars > 0 ? dollars * 100 : null;
    onSetBudget(category.id, cents, category.monthlyOverrideCents);
  };

  const commitManualMonthly = (raw: string) => {
    const dollars = parseInt(raw.replace(/\D/g, ''), 10);
    const cents = Number.isFinite(dollars) && dollars > 0 ? dollars * 100 : null;
    onSetBudget(category.id, category.weeklyBudgetCents, cents);
  };

  const switchToAuto = () => {
    onSetBudget(category.id, category.weeklyBudgetCents, null);
  };

  const switchToManual = () => {
    const fallback =
      category.weeklyBudgetCents != null ? category.weeklyBudgetCents * 4 : 0;
    onSetBudget(category.id, category.weeklyBudgetCents, fallback);
  };

  return (
    <View style={styles.catRow}>
      <View style={styles.catRowTop}>
        <View style={[styles.catDot, { backgroundColor: category.color }]} />
        {editingName ? (
          <TextInput
            style={styles.catNameInput}
            value={draftName}
            onChangeText={setDraftName}
            autoFocus
            onBlur={commitName}
            onSubmitEditing={commitName}
            returnKeyType="done"
          />
        ) : (
          <Pressable style={{ flex: 1 }} onPress={() => setEditingName(true)}>
            <Text style={styles.catName}>{category.name}</Text>
          </Pressable>
        )}
        <Pressable
          style={styles.iconBtn}
          onPress={() => onDelete(category.id)}
          hitSlop={6}>
          <Ionicons name="trash-outline" size={18} color={Palette.spent} />
        </Pressable>
      </View>

      <View style={styles.budgetRow}>
        <Text style={styles.budgetLabel}>Weekly</Text>
        <TextInput
          style={styles.budgetInput}
          keyboardType="number-pad"
          inputAccessoryViewID={ACCESSORY_ID}
          placeholder="$"
          placeholderTextColor={Palette.iconMuted}
          value={weeklyDraft ? `$${weeklyDraft}` : ''}
          onChangeText={(v) => {
            const digits = v.replace(/\D/g, '');
            setWeeklyDraft(digits);
          }}
          onBlur={() => commitWeekly(weeklyDraft)}
          onEndEditing={() => commitWeekly(weeklyDraft)}
        />
      </View>

      <View style={styles.budgetRow}>
        <Text style={styles.budgetLabel}>Monthly</Text>
        <TextInput
          style={[
            styles.budgetInput,
            monthlyMode === 'auto' && styles.budgetInputDisabled,
          ]}
          keyboardType="number-pad"
          inputAccessoryViewID={ACCESSORY_ID}
          placeholder="$"
          placeholderTextColor={Palette.iconMuted}
          editable={monthlyMode === 'manual'}
          value={
            monthlyMode === 'auto'
              ? monthlyAutoDollars > 0
                ? `$${monthlyAutoDollars}`
                : ''
              : manualMonthlyDraft
                ? `$${manualMonthlyDraft}`
                : ''
          }
          onChangeText={(v) => {
            const digits = v.replace(/\D/g, '');
            setManualMonthlyDraft(digits);
          }}
          onBlur={() => commitManualMonthly(manualMonthlyDraft)}
          onEndEditing={() => commitManualMonthly(manualMonthlyDraft)}
        />
        <View style={styles.modeToggle}>
          {(['auto', 'manual'] as const).map((m) => {
            const active = monthlyMode === m;
            return (
              <Pressable
                key={m}
                onPress={() => (m === 'auto' ? switchToAuto() : switchToManual())}
                style={[styles.modeBtn, active && styles.modeBtnActive]}>
                <Text style={[styles.modeText, active && styles.modeTextActive]}>{m}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function AddCategoryRow({ onAdd }: { onAdd: (name: string) => unknown }) {
  const [name, setName] = useState('');
  const trimmed = name.trim();
  const canAdd = trimmed.length > 0;

  const submit = () => {
    if (!canAdd) return;
    onAdd(trimmed);
    setName('');
  };

  return (
    <View style={styles.addRow}>
      <Ionicons name="add-circle-outline" size={20} color={Palette.brand} />
      <TextInput
        style={styles.addInput}
        placeholder="Add category"
        placeholderTextColor={Palette.iconMuted}
        value={name}
        onChangeText={setName}
        onSubmitEditing={submit}
        returnKeyType="done"
      />
      <Pressable
        onPress={submit}
        disabled={!canAdd}
        style={[styles.addBtn, !canAdd && styles.addBtnDisabled]}>
        <Text style={styles.addBtnText}>Add</Text>
      </Pressable>
    </View>
  );
}
