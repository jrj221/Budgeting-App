import { StyleSheet } from 'react-native';

import { Palette } from '@/constants/colors';

export const editStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Palette.cardBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 12,
    maxHeight: '92%',
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Palette.sheetHandle,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Palette.border,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Palette.text,
  },
  headerCancel: {
    fontSize: 16,
    color: Palette.text,
  },
  headerSpacer: {
    width: 50,
  },
  body: {
    gap: 12,
  },
  amountWrap: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  amount: {
    fontSize: 44,
    fontWeight: '700',
    color: Palette.text,
    letterSpacing: -1,
  },
  amountMuted: {
    color: Palette.amountPlaceholder,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 1,
    width: 1,
  },
  modeRow: {
    flexDirection: 'row',
    backgroundColor: Palette.toggleTrack,
    borderRadius: 999,
    padding: 4,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 999,
  },
  modeBtnActive: {
    shadowColor: Palette.shadow,
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  modeText: {
    fontSize: 15,
    fontWeight: '600',
    color: Palette.textSubtle,
  },
  modeTextActive: {
    color: '#fff',
  },
  titleInput: {
    fontSize: 17,
    fontWeight: '500',
    color: Palette.text,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: Palette.surface,
    borderRadius: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: Palette.surface,
    borderRadius: 12,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Palette.text,
  },
  rowValue: {
    fontSize: 16,
    color: Palette.text,
  },
  rowValueMuted: {
    color: Palette.iconMuted,
  },
  wheelWrap: {
    backgroundColor: Palette.cardBackground,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.border,
    overflow: 'hidden',
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Palette.surface,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.border,
  },
  catChipActive: {
    borderColor: Palette.brand,
    backgroundColor: Palette.cardBackground,
  },
  catDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  catName: {
    fontSize: 14,
    color: Palette.text,
  },
  saveBtn: {
    backgroundColor: Palette.brand,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    marginTop: 4,
  },
  saveDisabled: {
    backgroundColor: Palette.submitDisabled,
  },
  saveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  saveAltBtn: {
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.brand,
  },
  saveAltText: {
    color: Palette.brand,
    fontSize: 15,
    fontWeight: '700',
  },
  dangerZone: {
    gap: 8,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Palette.border,
  },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.spent,
  },
  dangerText: {
    color: Palette.spent,
    fontSize: 15,
    fontWeight: '700',
  },
});
