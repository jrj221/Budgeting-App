import { StyleSheet } from 'react-native';

import { Palette } from '@/constants/colors';

export const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Palette.pageBackground,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 20,
    flexGrow: 1,
  },
  logoBubble: {
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Palette.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Palette.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: Palette.textMuted,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  featureList: {
    gap: 12,
    paddingHorizontal: 4,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  featureIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  featureBody: {
    flex: 1,
    gap: 2,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.text,
  },
  featureSubtitle: {
    fontSize: 13,
    color: Palette.textMuted,
    lineHeight: 18,
  },
  card: {
    backgroundColor: Palette.cardBackground,
    borderRadius: 18,
    padding: 14,
    gap: 8,
    shadowColor: Palette.shadow,
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
    elevation: 2,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    textAlign: 'center',
  },
  cardHint: {
    fontSize: 12,
    color: Palette.textMuted,
    textAlign: 'center',
  },
  balanceAmountWrap: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  balanceAmount: {
    fontSize: 40,
    fontWeight: '700',
    color: Palette.text,
    letterSpacing: -1,
  },
  balanceAmountMuted: {
    color: Palette.amountPlaceholder,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 1,
    width: 1,
  },
  themeChipsRow: {
    paddingVertical: 4,
    gap: 8,
  },
  themeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
  },
  themeChipActive: {
    borderColor: Palette.brand,
    borderWidth: 2,
    backgroundColor: Palette.cardBackground,
  },
  swatchTrio: {
    flexDirection: 'row',
    gap: 3,
  },
  swatchSm: {
    width: 12,
    height: 12,
    borderRadius: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.border,
  },
  themeName: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.text,
  },
  ctaWrap: {
    gap: 8,
  },
  startBtn: {
    backgroundColor: Palette.brand,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
  },
  startText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  skipBtn: {
    paddingVertical: 6,
    alignItems: 'center',
  },
  skipText: {
    color: Palette.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  kbAccessory: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    backgroundColor: Palette.toggleTrack,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Palette.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  kbAccessoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  kbAccessoryText: {
    fontSize: 16,
    color: Palette.brand,
    fontWeight: '600',
  },
});
