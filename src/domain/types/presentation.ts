/**
 * UI Presentation Models (Presentation Boundary)
 *
 * These models are tailored for React Native presentation and user interaction,
 * particularly for Persian-first RTL requirements.
 *
 * Architectural Boundary:
 * - Domain models are locale-agnostic and use UTC ISO 8601 strings.
 * - Presentation models contain pre-computed localized formatting: Jalali strings
 *   (via date-fns-jalali), Persian numeral displays, relative time strings
 *   (e.g., "امروز", "فردا"), badge colors, and localized status/priority labels.
 * - Domain logic must NEVER produce presentation strings directly. UI hooks/selectors
 *   project Domain Models into Presentation Models.
 */

import { TaskId, NoteId, TaskPriority, TaskStatus } from './common';

export interface TaskPresentationModel {
  readonly id: TaskId;
  readonly title: string;
  readonly description: string | null;
  /**
   * Formatted Jalali date string with Persian numerals (e.g. "۱۴۰۵/۰۷/۲۴")
   */
  readonly formattedJalaliDueDate: string | null;
  /**
   * Relative time label in Persian (e.g. "امروز", "فردا", "۳ روز پیش")
   */
  readonly relativeDueDateLabel: string | null;
  /**
   * Whether the task is overdue based on current time
   */
  readonly isOverdue: boolean;
  readonly isCompleted: boolean;
  readonly priority: TaskPriority;
  /**
   * Localized Persian label for priority (e.g. "فوری", "زیاد", "متوسط", "کم")
   */
  readonly priorityLabel: string;
  /**
   * UI color token key for badge/indicator
   */
  readonly priorityColorToken: string;
  readonly status: TaskStatus;
  /**
   * Localized Persian label for status (e.g. "در انتظار", "در حال انجام", "انجام شد")
   */
  readonly statusLabel: string;
  /**
   * Recommended text alignment for RTL/LTR content
   */
  readonly textDirection: 'rtl' | 'ltr';
}

export interface NotePresentationModel {
  readonly id: NoteId;
  readonly title: string;
  readonly contentSnippet: string; // Truncated for list preview
  readonly formattedJalaliCreatedAt: string;
  readonly formattedJalaliUpdatedAt: string;
  readonly tags: readonly string[];
  readonly isPinned: boolean;
  readonly textDirection: 'rtl' | 'ltr';
}
