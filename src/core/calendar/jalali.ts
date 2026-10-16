/**
 * Persian (Jalali) Calendar and Date Formatting Utilities
 *
 * Built on top of `date-fns-jalali` and standard Date objects.
 *
 * Architectural Boundary:
 * - Internal & persistence timestamps remain standard UTC ISO 8601 strings or Date objects.
 * - This module handles conversions, month grid generation, and localized Persian formatting.
 * - Timezone policy: Defaults to 'Asia/Tehran' with configurable policy.
 */

import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  addDays,
  isSameDay,
  isToday as isJalaliToday,
  isBefore,
  parseISO,
  isValid,
  newDate,
} from 'date-fns-jalali';
import { faIR } from 'date-fns-jalali/locale';

export const DEFAULT_TIMEZONE = 'Asia/Tehran';

export const PERSIAN_MONTH_NAMES = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
] as const;

export const PERSIAN_WEEKDAY_NAMES_FULL = [
  'شنبه',
  'یک‌شنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنج‌شنبه',
  'جمعه',
] as const;

export const PERSIAN_WEEKDAY_NAMES_SHORT = [
  'ش',
  '۱ش',
  '۲ش',
  '۳ش',
  '۴ش',
  '۵ش',
  'ج',
] as const;

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const ASCII_DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

/**
 * Converts Western Arabic digits (0-9) to Persian digits (۰-۹).
 */
export function toPersianDigits(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  return str.replace(/[0-9]/g, (digit) => PERSIAN_DIGITS[parseInt(digit, 10)] ?? digit);
}

/**
 * Converts Persian digits (۰-۹) to Western Arabic digits (0-9).
 */
export function toAsciiDigits(value: string): string {
  if (!value) return '';
  let result = value;
  for (let i = 0; i < 10; i++) {
    result = result.replace(new RegExp(PERSIAN_DIGITS[i]!, 'g'), ASCII_DIGITS[i]!);
  }
  return result;
}

/**
 * Safely normalizes input to a Date instance.
 */
export function toDate(input: Date | string | number): Date {
  if (input instanceof Date) return input;
  if (typeof input === 'string') {
    const parsed = parseISO(input);
    if (isValid(parsed)) return parsed;
    return new Date(input);
  }
  return new Date(input);
}

/**
 * Formats a Date using Jalali pattern and converts numbers to Persian digits.
 * Example patterns:
 * - 'yyyy/MM/dd' -> '۱۴۰۵/۰۷/۲۴'
 * - 'EEEE d MMMM yyyy' -> 'پنج‌شنبه ۲۴ مهر ۱۴۰۵'
 */
export function formatJalali(dateInput: Date | string, formatPattern: string): string {
  const date = toDate(dateInput);
  if (!isValid(date)) return '';
  const formatted = format(date, formatPattern, { locale: faIR });
  return toPersianDigits(formatted);
}

/**
 * Formats full Persian date with weekday (e.g. «پنج‌شنبه، ۲۴ مهر ۱۴۰۵»).
 */
export function formatJalaliFullDate(dateInput: Date | string): string {
  const date = toDate(dateInput);
  if (!isValid(date)) return '';
  const weekday = format(date, 'EEEE', { locale: faIR });
  const day = toPersianDigits(format(date, 'd', { locale: faIR }));
  const month = format(date, 'MMMM', { locale: faIR });
  const year = toPersianDigits(format(date, 'yyyy', { locale: faIR }));
  return `${weekday}، ${day} ${month} ${year}`;
}

/**
 * Formats short Persian date (e.g. «۲۴ مهر»).
 */
export function formatJalaliShortDate(dateInput: Date | string): string {
  const date = toDate(dateInput);
  if (!isValid(date)) return '';
  const day = toPersianDigits(format(date, 'd', { locale: faIR }));
  const month = format(date, 'MMMM', { locale: faIR });
  return `${day} ${month}`;
}

/**
 * Formats time in Persian digits (e.g. «۱۴:۳۰»).
 */
export function formatPersianTime(dateInput: Date | string): string {
  const date = toDate(dateInput);
  if (!isValid(date)) return '';
  const timeStr = format(date, 'HH:mm');
  return toPersianDigits(timeStr);
}

/**
 * Returns a time-of-day greeting in Persian.
 */
export function getPersianGreeting(referenceDate?: Date): string {
  const date = referenceDate ?? new Date();
  const hour = date.getHours();

  if (hour >= 5 && hour < 12) {
    return 'صبح بخیر';
  }
  if (hour >= 12 && hour < 16) {
    return 'ظهر بخیر';
  }
  if (hour >= 16 && hour < 20) {
    return 'عصر بخیر';
  }
  return 'شب بخیر';
}

/**
 * Returns a human-friendly relative Persian label (e.g., "امروز", "فردا", "دیروز", or short date).
 */
export function getRelativeJalaliLabel(
  dateInput: Date | string,
  baseDateInput: Date = new Date()
): string {
  const target = toDate(dateInput);
  const base = toDate(baseDateInput);

  if (!isValid(target)) return '';

  if (isSameDay(target, base)) {
    return 'امروز';
  }

  const tomorrow = addDays(base, 1);
  if (isSameDay(target, tomorrow)) {
    return 'فردا';
  }

  const yesterday = addDays(base, -1);
  if (isSameDay(target, yesterday)) {
    return 'دیروز';
  }

  return formatJalaliShortDate(target);
}

/**
 * Checks whether a given Jalali year is a leap year.
 * Jalali leap years have 30 days in Esfand (month 12).
 */
export function isLeapJalaliYear(year: number): boolean {
  // Test by checking if Esfand 30th is valid
  // In date-fns-jalali, newDate(year, 11, 30) (month is 0-indexed)
  // If it's a leap year, day 30 will remain in month 11.
  const d = newDate(year, 11, 30);
  const month = parseInt(format(d, 'M'), 10);
  return month === 12;
}

/**
 * Returns the number of days in a given Jalali month (1-indexed: 1 = Farvardin, 12 = Esfand).
 */
export function getDaysInJalaliMonth(year: number, month1Indexed: number): number {
  if (month1Indexed >= 1 && month1Indexed <= 6) {
    return 31;
  }
  if (month1Indexed >= 7 && month1Indexed <= 11) {
    return 30;
  }
  if (month1Indexed === 12) {
    return isLeapJalaliYear(year) ? 30 : 29;
  }
  throw new Error(`Invalid Jalali month: ${month1Indexed}. Expected 1-12.`);
}

export interface JalaliCalendarDay {
  readonly date: Date;
  readonly isoString: string;
  readonly jalaliYear: number;
  readonly jalaliMonth: number; // 1-12
  readonly jalaliDay: number; // 1-31
  readonly dayNumberPersian: string;
  readonly weekdayName: string;
  readonly isToday: boolean;
  readonly isCurrentMonth: boolean;
  readonly isSelected: boolean;
  readonly hasTasks?: boolean;
}

/**
 * Generates the complete 7-column calendar grid for a given Jalali month.
 * Automatically pads days from the preceding and succeeding months so all rows
 * start on Saturday (weekStartsOn: 6).
 */
export function getJalaliMonthGrid(
  currentMonthDate: Date,
  selectedDate?: Date
): JalaliCalendarDay[] {
  const som = startOfMonth(currentMonthDate);
  const eom = endOfMonth(currentMonthDate);

  // In Persian calendar, week starts on Saturday (which is 6 in date-fns weekday indexing)
  const gridStart = startOfWeek(som, { locale: faIR, weekStartsOn: 6 });
  const gridEnd = endOfWeek(eom, { locale: faIR, weekStartsOn: 6 });

  const daysInterval = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const targetMonthNum = parseInt(format(currentMonthDate, 'M'), 10);
  const targetYearNum = parseInt(format(currentMonthDate, 'yyyy'), 10);

  return daysInterval.map((dayDate) => {
    const dayYear = parseInt(format(dayDate, 'yyyy'), 10);
    const dayMonth = parseInt(format(dayDate, 'M'), 10);
    const dayOfMonth = parseInt(format(dayDate, 'd'), 10);

    const isCurrentMonth = dayYear === targetYearNum && dayMonth === targetMonthNum;
    const isSelected = selectedDate ? isSameDay(dayDate, selectedDate) : false;

    return {
      date: dayDate,
      isoString: dayDate.toISOString(),
      jalaliYear: dayYear,
      jalaliMonth: dayMonth,
      jalaliDay: dayOfMonth,
      dayNumberPersian: toPersianDigits(dayOfMonth),
      weekdayName: format(dayDate, 'EEEE', { locale: faIR }),
      isToday: isJalaliToday(dayDate),
      isCurrentMonth,
      isSelected,
    };
  });
}

/**
 * Generates a horizontal strip of days (e.g. today +/- offset days) for the daily planner.
 */
export function getHorizontalDaysStrip(
  baseDate: Date = new Date(),
  pastDaysCount = 7,
  futureDaysCount = 14,
  selectedDate?: Date
): JalaliCalendarDay[] {
  const result: JalaliCalendarDay[] = [];
  const currentMonthNum = parseInt(format(baseDate, 'M'), 10);

  for (let offset = -pastDaysCount; offset <= futureDaysCount; offset++) {
    const dayDate = addDays(baseDate, offset);
    const dayYear = parseInt(format(dayDate, 'yyyy'), 10);
    const dayMonth = parseInt(format(dayDate, 'M'), 10);
    const dayOfMonth = parseInt(format(dayDate, 'd'), 10);
    const isSelected = selectedDate ? isSameDay(dayDate, selectedDate) : isSameDay(dayDate, baseDate);

    result.push({
      date: dayDate,
      isoString: dayDate.toISOString(),
      jalaliYear: dayYear,
      jalaliMonth: dayMonth,
      jalaliDay: dayOfMonth,
      dayNumberPersian: toPersianDigits(dayOfMonth),
      weekdayName: format(dayDate, 'EEEE', { locale: faIR }),
      isToday: isJalaliToday(dayDate),
      isCurrentMonth: dayMonth === currentMonthNum,
      isSelected,
    });
  }

  return result;
}

/**
 * Converts a selected Jalali year, month (1-12), and day (1-31) to a UTC Date.
 */
export function jalaliToDate(
  year: number,
  month1Indexed: number,
  day: number,
  hour = 0,
  minute = 0
): Date {
  const d = newDate(year, month1Indexed - 1, day);
  d.setHours(hour, minute, 0, 0);
  return d;
}

/**
 * Returns whether target date is before today (overdue).
 */
export function isOverdue(dateInput: Date | string, referenceDate: Date = new Date()): boolean {
  const target = toDate(dateInput);
  if (!isValid(target)) return false;
  return isBefore(target, referenceDate) && !isSameDay(target, referenceDate);
}

/**
 * Checks whether two dates represent the same Jalali day.
 */
export { isSameDay as isSameJalaliDay, addMonths as addJalaliMonths, subMonths as subJalaliMonths };
