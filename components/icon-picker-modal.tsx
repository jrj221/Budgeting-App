import { FontAwesome5 } from '@expo/vector-icons';
import { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { CATEGORY_ICONS } from '@/constants/category-icons';
import { Palette } from '@/constants/colors';

type IconPickerModalProps = {
  visible: boolean;
  selected: string;
  color: string;
  title?: string;
  onClose: () => void;
  onSelect: (icon: string) => void;
};

const COLUMNS = 5;
const CELL_SIZE = 56;

export function IconPickerModal({
  visible,
  selected,
  color,
  title = 'Pick an icon',
  onClose,
  onSelect,
}: IconPickerModalProps) {
  const [query, setQuery] = useState('');

  const filtered = query.trim()
    ? CATEGORY_ICONS.filter((i) => i.includes(query.trim().toLowerCase().replace(/\s+/g, '-')))
    : CATEGORY_ICONS;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>{title}</Text>
          <TextInput
            style={styles.search}
            placeholder="Search icons…"
            placeholderTextColor={Palette.iconMuted}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            returnKeyType="done"
          />
          <FlatList
            data={filtered as string[]}
            keyExtractor={(item) => item}
            numColumns={COLUMNS}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const active = item === selected;
              return (
                <Pressable
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}
                  style={[styles.cell, active && { backgroundColor: color + '22', borderColor: color, borderWidth: 2 }]}>
                  <FontAwesome5
                    name={item as any}
                    size={22}
                    color={active ? color : Palette.text}
                  solid />
                </Pressable>
              );
            }}
          />
          <Pressable style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: Palette.cardBackground,
    borderRadius: 20,
    width: '100%',
    maxWidth: 360,
    maxHeight: '82%',
    padding: 16,
    gap: 12,
    shadowColor: Palette.shadow,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    elevation: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: Palette.text,
    textAlign: 'center',
  },
  search: {
    backgroundColor: Palette.surface,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    color: Palette.text,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.border,
  },
  list: {
    flexGrow: 0,
  },
  listContent: {
    gap: 4,
  },
  cell: {
    flex: 1,
    height: CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    margin: 2,
    backgroundColor: Palette.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.border,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  cancelText: {
    fontSize: 15,
    color: Palette.textMuted,
    fontWeight: '600',
  },
});
