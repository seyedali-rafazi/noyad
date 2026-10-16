import { z } from 'zod';
import { create } from 'zustand';
import { format as formatGregorian } from 'date-fns';
import { format as formatJalali } from 'date-fns-jalali';
import { DATABASE_NAME, schema } from '../src/core/database';

describe('Infrastructure Setup Smoke Tests', () => {
  it('verifies runtime validation infrastructure (Zod)', () => {
    const testSchema = z.object({ id: z.string() });
    const parsed = testSchema.safeParse({ id: 'test-123' });
    expect(parsed.success).toBe(true);
  });

  it('verifies state management infrastructure (Zustand)', () => {
    expect(typeof create).toBe('function');
  });

  it('verifies calendar utilities infrastructure (Gregorian & Jalali)', () => {
    const testDate = new Date('2026-03-21T00:00:00Z');
    expect(typeof formatGregorian(testDate, 'yyyy-MM-dd')).toBe('string');
    expect(typeof formatJalali(testDate, 'yyyy-MM-dd')).toBe('string');
  });

  it('verifies database configuration metadata and schema registry', () => {
    expect(DATABASE_NAME).toBe('ai_calender.db');
    expect(schema).toBeDefined();
  });
});
