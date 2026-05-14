import { StyleSheet } from 'react-native';

import { Palette } from '@/constants/colors';

export const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Palette.pageBackground,
  },
  scroll: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },
  header: {
    gap: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Palette.text,
  },
  subtitle: {
    fontSize: 15,
    color: Palette.textMuted,
  },
  section: {
    backgroundColor: Palette.cardBackground,
    borderRadius: 20,
    padding: 16,
    gap: 8,
    shadowColor: Palette.shadow,
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.text,
    marginBottom: 4,
  },
  schemeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Palette.border,
    gap: 12,
  },
  schemeRowLast: {
    borderBottomWidth: 0,
  },
  schemeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  swatchGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  swatch: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.border,
  },
  schemeName: {
    fontSize: 16,
    fontWeight: '600',
    color: Palette.text,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Palette.textMuted,
    marginBottom: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Palette.border,
    gap: 10,
  },
  actionRowLast: {
    borderBottomWidth: 0,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: Palette.text,
  },
  actionMeta: {
    fontSize: 12,
    color: Palette.textMuted,
  },
});
