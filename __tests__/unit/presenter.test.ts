import {
  formatAmountDisplay,
  sanitizeAmountDigits,
  amountDigitsToCents,
  isDraftSubmittable,
  formatDateLabel,
  buildTransactionSeries,
  expandRepeatDates,
  makeInitialRepeatConfig,
} from '../../components/add-transaction-card.presenter';

describe('sanitizeAmountDigits', () => {
  it('strips non-digits', () => expect(sanitizeAmountDigits('1a2b3')).toBe('123'));
  it('strips leading zeros', () => expect(sanitizeAmountDigits('007')).toBe('7'));
  it('truncates to 9 digits', () => expect(sanitizeAmountDigits('1234567890')).toBe('123456789'));
  it('empty string returns empty', () => expect(sanitizeAmountDigits('')).toBe(''));
  it('all zeros returns empty', () => expect(sanitizeAmountDigits('000')).toBe(''));
});

describe('formatAmountDisplay', () => {
  it('formats cents correctly', () => expect(formatAmountDisplay('100')).toBe('$1.00'));
  it('formats zero', () => expect(formatAmountDisplay('')).toBe('$0.00'));
  it('formats thousands', () => expect(formatAmountDisplay('100000')).toBe('$1,000.00'));
  it('formats single digit', () => expect(formatAmountDisplay('5')).toBe('$0.05'));
  it('formats large amount', () => expect(formatAmountDisplay('123456789')).toBe('$1,234,567.89'));
});

describe('amountDigitsToCents', () => {
  it('converts string to int', () => expect(amountDigitsToCents('123')).toBe(123));
  it('returns 0 for empty', () => expect(amountDigitsToCents('')).toBe(0));
  it('returns 0 for falsy', () => expect(amountDigitsToCents('')).toBe(0));
});

describe('isDraftSubmittable', () => {
  const base = { mode: 'spent' as const, amountDigits: '', title: '', date: new Date(), categoryId: null };
  it('false when amount is 0', () => expect(isDraftSubmittable({ ...base, amountDigits: '0', title: 'test' })).toBe(false));
  it('false when title is empty', () => expect(isDraftSubmittable({ ...base, amountDigits: '100', title: '' })).toBe(false));
  it('false when both empty', () => expect(isDraftSubmittable(base)).toBe(false));
  it('true when both filled', () => expect(isDraftSubmittable({ ...base, amountDigits: '100', title: 'Food' })).toBe(true));
  it('false when title is whitespace', () => expect(isDraftSubmittable({ ...base, amountDigits: '100', title: '   ' })).toBe(false));
});

describe('formatDateLabel', () => {
  const today = new Date(2024, 0, 15); // Jan 15
  it('returns Today for same day', () => expect(formatDateLabel(today, today)).toBe('Today'));
  it('returns Yesterday for previous day', () => {
    const yesterday = new Date(2024, 0, 14);
    expect(formatDateLabel(yesterday, today)).toBe('Yesterday');
  });
  it('returns formatted date for other days', () => {
    const older = new Date(2024, 0, 10);
    const label = formatDateLabel(older, today);
    expect(label).toMatch(/Jan/);
  });
  it('includes year for different year', () => {
    const old = new Date(2023, 0, 10);
    const label = formatDateLabel(old, today);
    expect(label).toMatch(/2023/);
  });
});

describe('expandRepeatDates', () => {
  const base = new Date(2024, 0, 1); // Jan 1
  const noRepeat = makeInitialRepeatConfig(base);

  it('returns single date when repeat disabled', () => {
    const dates = expandRepeatDates(base, { ...noRepeat, enabled: false });
    expect(dates).toHaveLength(1);
  });

  it('returns count occurrences', () => {
    const repeat = { ...noRepeat, enabled: true, every: 1, period: 'weeks' as const, endMode: 'count' as const, count: 4 };
    const dates = expandRepeatDates(base, repeat);
    expect(dates).toHaveLength(4);
  });

  it('weekly spacing is 7 days', () => {
    const repeat = { ...noRepeat, enabled: true, every: 1, period: 'weeks' as const, endMode: 'count' as const, count: 2 };
    const dates = expandRepeatDates(base, repeat);
    const diff = dates[1].getTime() - dates[0].getTime();
    expect(diff).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it('respects end date', () => {
    const endDate = new Date(2024, 0, 15); // Jan 15
    const repeat = { ...noRepeat, enabled: true, every: 1, period: 'weeks' as const, endMode: 'date' as const, endDate };
    const dates = expandRepeatDates(base, repeat);
    expect(dates.length).toBeGreaterThanOrEqual(1);
    for (const d of dates) {
      expect(d.getTime()).toBeLessThanOrEqual(endDate.getTime() + 24 * 60 * 60 * 1000);
    }
  });
});

describe('buildTransactionSeries', () => {
  const base = new Date(2024, 0, 1);
  const noRepeat = makeInitialRepeatConfig(base);
  const draft = { mode: 'spent' as const, amountDigits: '500', title: 'Lunch', date: base, categoryId: null };

  it('single tx when repeat disabled', () => {
    const txs = buildTransactionSeries(draft, { ...noRepeat, enabled: false });
    expect(txs).toHaveLength(1);
    expect(txs[0].seriesId).toBeNull();
  });

  it('multiple txs with seriesId when repeat enabled', () => {
    const repeat = { ...noRepeat, enabled: true, every: 1, period: 'weeks' as const, endMode: 'count' as const, count: 3 };
    const txs = buildTransactionSeries(draft, repeat);
    expect(txs).toHaveLength(3);
    expect(txs[0].seriesId).toBe(txs[1].seriesId);
    expect(txs[0].seriesId).not.toBeNull();
  });

  it('amounts are correct', () => {
    const txs = buildTransactionSeries(draft, { ...noRepeat, enabled: false });
    expect(txs[0].amountCents).toBe(500);
    expect(txs[0].mode).toBe('spent');
  });
});
