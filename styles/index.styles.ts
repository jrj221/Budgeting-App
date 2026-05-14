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
});
