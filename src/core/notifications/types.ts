/**
 * Types & Domain Contracts for Local Notifications & Reminders Engine
 */

export type NotificationChannelId = 'task-reminders' | 'daily-briefing' | 'urgent-alerts';

export type NotificationPermissionStatus = 'granted' | 'denied' | 'undetermined';

export interface ReminderOffsetOption {
  readonly offsetMinutes: number | null;
  readonly labelPersian: string;
}

export const REMINDER_OFFSET_OPTIONS: readonly ReminderOffsetOption[] = [
  { offsetMinutes: null, labelPersian: 'بدون یادآور' },
  { offsetMinutes: 0, labelPersian: 'در زمان سررسید' },
  { offsetMinutes: 5, labelPersian: '۵ دقیقه قبل' },
  { offsetMinutes: 10, labelPersian: '۱۰ دقیقه قبل' },
  { offsetMinutes: 15, labelPersian: '۱۵ دقیقه قبل' },
  { offsetMinutes: 30, labelPersian: '۳۰ دقیقه قبل' },
  { offsetMinutes: 60, labelPersian: '۱ ساعت قبل' },
  { offsetMinutes: 120, labelPersian: '۲ ساعت قبل' },
  { offsetMinutes: 1440, labelPersian: '۱ روز قبل' },
];

export interface NotificationPayloadData {
  type: 'task-reminder' | 'daily-briefing' | 'test-notification';
  taskId?: string;
  action?: 'view_task' | 'open_briefing';
  timestamp: string;
}

export interface NotificationSettings {
  taskRemindersEnabled: boolean;
  dailyBriefingEnabled: boolean;
  dailyBriefingHour: number;
  dailyBriefingMinute: number;
  defaultReminderOffsetMinutes: number;
  permissionStatus: NotificationPermissionStatus;
}
