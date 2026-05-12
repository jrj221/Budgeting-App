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
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
  },
  headerLeft: {
    gap: 4,
    flex: 1,
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
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Palette.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    gap: 14,
  },
  empty: {
    backgroundColor: Palette.cardBackground,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    shadowColor: Palette.shadow,
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
    elevation: 2,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Palette.text,
  },
  emptyBody: {
    fontSize: 14,
    color: Palette.textMuted,
    textAlign: 'center',
  },
  emptyCta: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: Palette.brand,
    marginTop: 4,
  },
  emptyCtaText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
