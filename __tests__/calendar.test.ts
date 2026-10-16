import {
  toPersianDigits,
  toAsciiDigits,
  formatJalali,
  formatJalaliFullDate,
  formatJalaliShortDate,
  formatPersianTime,
  getPersianGreeting,
  getRelativeJalaliLabel,
  isLeapJalaliYear,
  getDaysInJalaliMonth,
  getJalaliMonthGrid,
  jalaliToDate,
  isSameJalaliDay,
} from '../src/core/calendar/jalali';

describe('Jalali Calendar Foundation', () => {
  describe('Digit conversions', () => {
    it('converts ASCII digits to Persian digits', () => {
      expect(toPersianDigits('0123456789')).toBe('۰۱۲۳۴۵۶۷۸۹');
      expect(toPersianDigits(1405)).toBe('۱۴۰۵');
      expect(toPersianDigits('Time: 14:30')).toBe('Time: ۱۴:۳۰');
    });

    it('converts Persian digits to ASCII digits', () => {
      expect(toAsciiDigits('۰۱۲۳۴۵۶۷۸۹')).toBe('0123456789');
      expect(toAsciiDigits('۱۴۰۵/۰۷/۲۴')).toBe('1405/07/24');
    });

    it('handles empty and null values gracefully', () => {
      expect(toPersianDigits('')).toBe('');
      expect(toPersianDigits(null)).toBe('');
      expect(toAsciiDigits('')).toBe('');
    });
  });

  describe('Leap year & Days in month calculation', () => {
    it('identifies Jalali leap years correctly', () => {
      // 1403 is a known leap year in the 33-year Jalali cycle
      expect(isLeapJalaliYear(1403)).toBe(true);
      // 1404 is a standard non-leap year
      expect(isLeapJalaliYear(1404)).toBe(false);
    });

    it('returns 31 days for the first 6 months (Farvardin to Shahrivar)', () => {
      for (let m = 1; m <= 6; m++) {
        expect(getDaysInJalaliMonth(1404, m)).toBe(31);
      }
    });

    it('returns 30 days for months 7 to 11 (Mehr to Bahman)', () => {
      for (let m = 7; m <= 11; m++) {
        expect(getDaysInJalaliMonth(1404, m)).toBe(30);
      }
    });

    it('returns 29 days for Esfand in non-leap year and 30 days in leap year', () => {
      expect(getDaysInJalaliMonth(1404, 12)).toBe(29);
      expect(getDaysInJalaliMonth(1403, 12)).toBe(30);
    });
  });

  describe('Date conversions and formatting', () => {
    it('formats a date to Jalali full date string with Persian numerals', () => {
      const date = jalaliToDate(1405, 7, 24, 12, 0); // 24 Mehr 1405
      const formatted = formatJalaliFullDate(date);
      expect(formatted).toContain('مهر');
      expect(formatted).toContain('۱۴۰۵');
      expect(formatted).toContain('۲۴');
    });

    it('formats short Jalali date', () => {
      const date = jalaliToDate(1405, 7, 24);
      expect(formatJalaliShortDate(date)).toBe('۲۴ مهر');
    });

    it('formats Persian time', () => {
      const date = new Date(2026, 9, 15, 14, 30);
      expect(formatPersianTime(date)).toBe('۱۴:۳۰');
    });

    it('formats using custom pattern', () => {
      const date = jalaliToDate(1405, 7, 24);
      const patternFormatted = formatJalali(date, 'yyyy/MM/dd');
      expect(patternFormatted).toBe('۱۴۰۵/۰۷/۲۴');
    });
  });

  describe('Relative labels and greetings', () => {
    it('returns "امروز" for the same day', () => {
      const base = new Date();
      expect(getRelativeJalaliLabel(base, base)).toBe('امروز');
    });

    it('returns "فردا" for the next day', () => {
      const base = new Date('2026-10-15T10:00:00Z');
      const tomorrow = new Date('2026-10-16T10:00:00Z');
      expect(getRelativeJalaliLabel(tomorrow, base)).toBe('فردا');
    });

    it('returns "دیروز" for the previous day', () => {
      const base = new Date('2026-10-15T10:00:00Z');
      const yesterday = new Date('2026-10-14T10:00:00Z');
      expect(getRelativeJalaliLabel(yesterday, base)).toBe('دیروز');
    });

    it('returns time-of-day greetings correctly', () => {
      expect(getPersianGreeting(new Date(2026, 0, 1, 8, 0))).toBe('صبح بخیر');
      expect(getPersianGreeting(new Date(2026, 0, 1, 13, 0))).toBe('ظهر بخیر');
      expect(getPersianGreeting(new Date(2026, 0, 1, 17, 0))).toBe('عصر بخیر');
      expect(getPersianGreeting(new Date(2026, 0, 1, 22, 0))).toBe('شب بخیر');
    });
  });

  describe('Month grid generation', () => {
    it('generates a grid of days for a Jalali month with Saturday as the first day of each week', () => {
      const targetDate = jalaliToDate(1405, 7, 1); // 1 Mehr 1405
      const grid = getJalaliMonthGrid(targetDate);

      // Grid must be divisible by 7 (full weeks)
      expect(grid.length % 7).toBe(0);
      expect(grid.length).toBeGreaterThanOrEqual(28);

      // First day of each row must be Saturday (شنبه)
      expect(grid[0]?.weekdayName).toBe('شنبه');

      // Month must contain all 30 days of Mehr marked as isCurrentMonth: true
      const currentMonthDays = grid.filter((d) => d.isCurrentMonth);
      expect(currentMonthDays.length).toBe(30);

      // Check day numbers
      expect(currentMonthDays[0]?.dayNumberPersian).toBe('۱');
      expect(currentMonthDays[29]?.dayNumberPersian).toBe('۳۰');
    });

    it('correctly compares same Jalali day', () => {
      const d1 = jalaliToDate(1405, 7, 24, 10, 0);
      const d2 = jalaliToDate(1405, 7, 24, 18, 30);
      const d3 = jalaliToDate(1405, 7, 25, 10, 0);

      expect(isSameJalaliDay(d1, d2)).toBe(true);
      expect(isSameJalaliDay(d1, d3)).toBe(false);
    });
  });
});
