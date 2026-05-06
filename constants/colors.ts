import type { TransactionMode } from '@/components/add-transaction-card.presenter';

export const Palette = {
  brand: '#3D95CE',
  spent: '#e53935',
  earned: '#22a06b',

  pageBackground: '#f5f7fa',
  cardBackground: '#fff',
  surface: '#f7f8fa',
  border: '#e6e8eb',
  toggleTrack: '#f1f3f5',
  shadow: '#000',
  transparent: 'transparent',

  text: '#11181C',
  textMuted: '#687076',
  textSubtle: '#777',
  amountPlaceholder: '#c4c8cc',
  iconMuted: '#9aa0a6',

  sheetHandle: '#d0d4d9',
  switchTrackOff: '#b6bcc3',
  submitDisabled: '#cfd8dc',
  uncategorized: '#9aa0a6',
} as const;

export const CategoryColorPalette: readonly string[] = [
  '#ef4444',
  '#f59e0b',
  '#eab308',
  '#84cc16',
  '#10b981',
  '#06b6d4',
  '#3b82f6',
  '#6366f1',
  '#a855f7',
  '#ec4899',
  '#f97316',
  '#14b8a6',
];

export function pickNextCategoryColor(usedColors: readonly string[]): string {
  for (const color of CategoryColorPalette) {
    if (!usedColors.includes(color)) return color;
  }
  return CategoryColorPalette[usedColors.length % CategoryColorPalette.length];
}

export type ColorScheme = {
  id: string;
  name: string;
  background: string;
  text: string;
  textMuted: string;
  lineChart: string;
};

export const COLOR_SCHEMES: ColorScheme[] = [
  {
    id: 'default',
    name: 'Daylight',
    background: '#f5f7fa',
    text: '#11181C',
    textMuted: '#687076',
    lineChart: '#3D95CE',
  },
  {
    id: 'midnight',
    name: 'Midnight',
    background: '#0f172a',
    text: '#e2e8f0',
    textMuted: '#94a3b8',
    lineChart: '#38bdf8',
  },
  {
    id: 'forest',
    name: 'Forest',
    background: '#14241b',
    text: '#e7f4ea',
    textMuted: '#a8c0ad',
    lineChart: '#4ade80',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    background: '#fff4e6',
    text: '#7c2d12',
    textMuted: '#a8745a',
    lineChart: '#ea580c',
  },
  {
    id: 'mono',
    name: 'Mono',
    background: '#f4f4f5',
    text: '#18181b',
    textMuted: '#71717a',
    lineChart: '#52525b',
  },
  {
    id: 'blossom',
    name: 'Blossom',
    background: '#fdf2f8',
    text: '#831843',
    textMuted: '#a8638b',
    lineChart: '#ec4899',
  },
];

export const DEFAULT_COLOR_SCHEME_ID = 'default';

export const ModeColors: Record<TransactionMode, string> = {
  spent: Palette.spent,
  earned: Palette.earned,
};
