import { StyleSheet } from 'react-native';

import { Palette } from '@/constants/colors';

export const pickerStyles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    padding: 24,
  },
  card: {
    backgroundColor: Palette.cardBackground,
    borderRadius: 20,
    padding: 20,
    gap: 16,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
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
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    alignSelf: 'stretch',
  },
  previewSwatch: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.border,
  },
  previewHex: {
    fontSize: 14,
    fontWeight: '600',
    color: Palette.text,
    fontVariant: ['tabular-nums'],
  },
  actions: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    gap: 8,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
  },
  primary: {
    backgroundColor: Palette.brand,
  },
  primaryText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  secondary: {
    backgroundColor: Palette.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.border,
  },
  secondaryText: {
    color: Palette.text,
    fontSize: 15,
    fontWeight: '600',
  },
  brightnessTrack: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
