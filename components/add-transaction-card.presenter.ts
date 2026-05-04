export type TransactionMode = 'spent' | 'earned';

export type Category = {
  id: string;
  name: string;
};

export type DraftTransaction = {
  mode: TransactionMode;
  amountDigits: string;
  title: string;
  date: Date;
  categoryId: string | null;
};

export type Transaction = {
  id: string;
  mode: TransactionMode;
  amountCents: number;
  title: string;
  date: string;
  categoryId: string | null;
};

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'food', name: 'Food' },
  { id: 'gas', name: 'Gas' },
  { id: 'fun', name: 'Fun' },
  { id: 'bills', name: 'Bills' },
  { id: 'work', name: 'Work' },
];

export const MODE_LABELS: Record<TransactionMode, string> = {
  spent: 'Spent',
  earned: 'Earned',
};

const MAX_AMOUNT_DIGITS = 9;

export function sanitizeAmountDigits(input: string): string {
  const digitsOnly = input.replace(/\D/g, '');
  const trimmed = digitsOnly.replace(/^0+/, '');
  return trimmed.slice(0, MAX_AMOUNT_DIGITS);
}

export function formatAmountDisplay(amountDigits: string): string {
  const padded = (amountDigits || '0').padStart(3, '0');
  const dollars = padded.slice(0, -2);
  const cents = padded.slice(-2);
  const dollarsWithCommas = dollars.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `$${dollarsWithCommas}.${cents}`;
}

export function amountDigitsToCents(amountDigits: string): number {
  if (!amountDigits) return 0;
  return parseInt(amountDigits, 10);
}

export function isDraftSubmittable(draft: DraftTransaction): boolean {
  return amountDigitsToCents(draft.amountDigits) > 0 && draft.title.trim().length > 0;
}

export function formatDateLabel(date: Date, today: Date = new Date()): string {
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (sameDay(date, today)) return 'Today';
  if (sameDay(date, yesterday)) return 'Yesterday';
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() === today.getFullYear() ? undefined : 'numeric',
  });
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createCategory(name: string): Category {
  return { id: generateId('cat'), name: name.trim() };
}

export function isCategoryNameValid(name: string, existing: Category[]): boolean {
  const trimmed = name.trim();
  if (trimmed.length === 0) return false;
  return !existing.some((c) => c.name.toLowerCase() === trimmed.toLowerCase());
}

export function buildTransaction(draft: DraftTransaction): Transaction {
  return {
    id: generateId('tx'),
    mode: draft.mode,
    amountCents: amountDigitsToCents(draft.amountDigits),
    title: draft.title.trim(),
    date: draft.date.toISOString(),
    categoryId: draft.categoryId,
  };
}

export function makeInitialDraft(): DraftTransaction {
  return {
    mode: 'spent',
    amountDigits: '',
    title: '',
    date: new Date(),
    categoryId: null,
  };
}

export function submitButtonLabel(mode: TransactionMode): string {
  return mode === 'spent' ? 'Add Expense' : 'Add Income';
}
