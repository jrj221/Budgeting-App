import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  formatAmountDisplay,
  formatDateLabel,
  sanitizeAmountDigits,
  Transaction,
  TransactionMode,
} from '@/components/add-transaction-card.presenter';
import { editStyles as styles } from '@/components/edit-transaction-sheet.styles';
import { ModeColors, Palette } from '@/constants/colors';
import { useCategories } from '@/contexts/categories-context';
import { useTransactions } from '@/contexts/transactions-context';

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
  const { categories } = useCategories();
  const {
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

  const amountInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!transaction) return;
    setMode(transaction.mode);
    setAmountDigits(String(transaction.amountCents));
    setTitle(transaction.title);
    setDate(new Date(transaction.date));
    setCategoryId(transaction.categoryId);
    setIsDatePickerOpen(false);
  }, [transaction]);

  const isSeries = !!transaction?.seriesId;
  const canSubmit = useMemo(
    () => parseInt(amountDigits || '0', 10) > 0 && title.trim().length > 0,
    [amountDigits, title],
  );

  const buildPatch = () => ({
    mode,
    amountCents: parseInt(amountDigits || '0', 10),
    title: title.trim(),
    date: date.toISOString(),
    categoryId,
  });

  const handleSaveOnly = () => {
    if (!transaction || !canSubmit) return;
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
  const selectedCategory = categories.find((c) => c.id === categoryId) ?? null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.grabber} />
          <View style={styles.header}>
            <Pressable onPress={onClose} hitSlop={10}>
              <Text style={styles.headerCancel}>Cancel</Text>
            </Pressable>
            <Text style={styles.headerTitle}>Edit transaction</Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView
            contentContainerStyle={styles.body}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View style={styles.modeRow}>
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
                    <Text style={[styles.modeText, active && styles.modeTextActive]}>
                      {m === 'spent' ? 'Spent' : 'Earned'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              style={styles.amountWrap}
              onPress={() => amountInputRef.current?.focus()}>
              <Text style={[styles.amount, !amountDigits && styles.amountMuted]}>
                {formatAmountDisplay(amountDigits)}
              </Text>
              <TextInput
                ref={amountInputRef}
                value={amountDigits}
                onChangeText={(v) => setAmountDigits(sanitizeAmountDigits(v))}
                keyboardType="number-pad"
                style={styles.hiddenInput}
                caretHidden
                maxLength={9}
              />
            </Pressable>

            <TextInput
              style={styles.titleInput}
              placeholder="What's it for?"
              placeholderTextColor={Palette.iconMuted}
              value={title}
              onChangeText={setTitle}
              returnKeyType="done"
            />

            <Pressable
              style={styles.row}
              onPress={() => {
                Keyboard.dismiss();
                setIsDatePickerOpen((v) => !v);
              }}>
              <View style={styles.rowLeft}>
                <Ionicons name="calendar-outline" size={20} color={Palette.text} />
                <Text style={styles.rowLabel}>Date</Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={styles.rowValue}>{formatDateLabel(date)}</Text>
                <Ionicons
                  name={isDatePickerOpen ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={Palette.iconMuted}
                />
              </View>
            </Pressable>
            {isDatePickerOpen && (
              <View style={styles.wheelWrap}>
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="spinner"
                  themeVariant="light"
                  textColor={Palette.text}
                  onChange={(_, d) => {
                    if (d) setDate(d);
                  }}
                />
              </View>
            )}

            <View>
              <Text style={[styles.rowLabel, { marginBottom: 8 }]}>Category</Text>
              <View style={styles.catGrid}>
                <Pressable
                  onPress={() => setCategoryId(null)}
                  style={[styles.catChip, categoryId === null && styles.catChipActive]}>
                  <View
                    style={[
                      styles.catDot,
                      { backgroundColor: Palette.uncategorized },
                    ]}
                  />
                  <Text style={styles.catName}>None</Text>
                </Pressable>
                {categories.map((cat) => {
                  const active = categoryId === cat.id;
                  return (
                    <Pressable
                      key={cat.id}
                      onPress={() => setCategoryId(cat.id)}
                      style={[styles.catChip, active && styles.catChipActive]}>
                      <View style={[styles.catDot, { backgroundColor: cat.color }]} />
                      <Text style={styles.catName}>{cat.name}</Text>
                    </Pressable>
                  );
                })}
              </View>
              {selectedCategory && (
                <Text
                  style={{
                    marginTop: 6,
                    fontSize: 12,
                    color: Palette.textMuted,
                  }}>
                  Currently: {selectedCategory.name}
                </Text>
              )}
            </View>

            <Pressable
              style={[styles.saveBtn, !canSubmit && styles.saveDisabled]}
              disabled={!canSubmit}
              onPress={handleSaveOnly}>
              <Text style={styles.saveText}>Save only this</Text>
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
        </Pressable>
      </Pressable>
    </Modal>
  );
}
