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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Palette.toggleTrack,
    borderRadius: 999,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 999,
  },
  tabBtnActive: {
    backgroundColor: Palette.cardBackground,
    shadowColor: Palette.shadow,
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: Palette.textSubtle,
  },
  tabTextActive: {
    color: Palette.text,
  },
  list: {
    backgroundColor: Palette.cardBackground,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: Palette.shadow,
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
    elevation: 2,
  },
  groupHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.textMuted,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Palette.border,
    gap: 12,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowMain: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Palette.text,
  },
  rowMeta: {
    fontSize: 13,
    color: Palette.textMuted,
  },
  rowAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  amountSpent: {
    color: Palette.spent,
  },
  amountEarned: {
    color: Palette.earned,
  },
  empty: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Palette.text,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Palette.textMuted,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  seriesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seriesBadgeText: {
    fontSize: 12,
    color: Palette.textMuted,
  },
});
