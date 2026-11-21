/**
 * Local Notifications & Reminders Engine Scheduler
 *
 * Core scheduling engine providing task reminder scheduling, cancellation,
 * daily briefing recurring triggers, and instant test notifications with Persian localization.
 */

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Task } from '../../domain/models/task';
import { NotificationChannelId, NotificationPayloadData } from './types';
import { toPersianDigits } from '../calendar';

// Configure default notification handler for in-app (foreground) presentation
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Returns formatted Persian offset phrase.
 */
export function formatReminderOffsetPersian(offsetMinutes: number): string {
  if (offsetMinutes <= 0) {
    return 'هم‌اکنون';
  }
  if (offsetMinutes === 5) return '۵ دقیقه دیگر';
  if (offsetMinutes === 10) return '۱۰ دقیقه دیگر';
  if (offsetMinutes === 15) return '۱۵ دقیقه دیگر';
  if (offsetMinutes === 30) return '۳۰ دقیقه دیگر';
  if (offsetMinutes === 60) return '۱ ساعت دیگر';
  if (offsetMinutes === 120) return '۲ ساعت دیگر';
  if (offsetMinutes === 1440) return '۱ روز دیگر';

  return `${toPersianDigits(offsetMinutes)} دقیقه دیگر`;
}

/**
 * Returns the notification channel appropriate for a task's priority.
 */
export function getChannelForTaskPriority(priority: Task['priority']): NotificationChannelId {
  if (priority === 'urgent' || priority === 'high') {
    return 'urgent-alerts';
  }
  return 'task-reminders';
}

/**
 * Formats notification title with Persian priority indicators.
 */
export function formatTaskReminderTitle(task: Task): string {
  if (task.priority === 'urgent') {
    return `⚠️ سررسید فوری: ${task.title}`;
  }
  if (task.priority === 'high') {
    return `🔔 یادآور مهم: ${task.title}`;
  }
  return `🗓️ یادآوری تسک: ${task.title}`;
}

/**
 * Unique identifier for task reminder notifications.
 */
export function getTaskNotificationIdentifier(taskId: string): string {
  return `task-reminder-${taskId}`;
}

export const DAILY_BRIEFING_IDENTIFIER = 'daily-briefing-notification';

/**
 * Schedules a local reminder notification for a given task.
 *
 * Returns the notification identifier if scheduled, or null if skipped (e.g. past due, completed, or no due date).
 */
export async function scheduleTaskReminder(
  task: Task,
  defaultOffsetMinutes: number = 10
): Promise<string | null> {
  const notificationId = getTaskNotificationIdentifier(task.id);

  // If task has no due date or is completed/cancelled, ensure any pending notification is cancelled
  if (!task.dueDate || task.status === 'completed' || task.status === 'cancelled') {
    await cancelTaskReminder(task.id);
    return null;
  }

  // If reminder is explicitly disabled for this task (reminderOffsetMinutes === null)
  if (task.reminderOffsetMinutes === null && task.reminderOffsetMinutes !== undefined) {
    await cancelTaskReminder(task.id);
    return null;
  }

  const offset = task.reminderOffsetMinutes ?? defaultOffsetMinutes;
  const dueDateMs = new Date(task.dueDate).getTime();
  const triggerMs = dueDateMs - offset * 60 * 1000;
  const nowMs = Date.now();

  // If trigger time is already in the past, do not schedule
  if (triggerMs <= nowMs) {
    return null;
  }

  const channelId = getChannelForTaskPriority(task.priority);
  const title = formatTaskReminderTitle(task);
  const timeDesc = formatReminderOffsetPersian(offset);

  let body = offset > 0
    ? `موعد انجام این وظیفه ${timeDesc} است.`
    : 'اکنون موعد انجام این وظیفه فرارسیده است.';

  if (task.description && task.description.trim().length > 0) {
    const descExcerpt = task.description.trim().slice(0, 80);
    body += `\n${descExcerpt}`;
  }

  const payload: NotificationPayloadData = {
    type: 'task-reminder',
    taskId: task.id,
    action: 'view_task',
    timestamp: new Date().toISOString(),
  };

  try {
    // Cancel any previous reminder for this task before rescheduling
    await cancelTaskReminder(task.id);

    await Notifications.scheduleNotificationAsync({
      identifier: notificationId,
      content: {
        title,
        body,
        data: payload as unknown as Record<string, unknown>,
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(triggerMs),
        channelId,
      },
    });

    return notificationId;
  } catch (error) {
    console.warn(`Failed to schedule reminder for task ${task.id}:`, error);
    return null;
  }
}

/**
 * Cancels a scheduled task reminder notification by task ID.
 */
export async function cancelTaskReminder(taskId: string): Promise<void> {
  try {
    const notificationId = getTaskNotificationIdentifier(taskId);
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // Silently handle cancellation errors if notification does not exist
  }
}

/**
 * Schedules a recurring daily briefing notification at the specified hour and minute.
 */
export async function scheduleDailyBriefing(options: {
  hour: number;
  minute: number;
}): Promise<string | null> {
  const { hour, minute } = options;

  try {
    // Cancel existing daily briefing
    await cancelDailyBriefing();

    const payload: NotificationPayloadData = {
      type: 'daily-briefing',
      action: 'open_briefing',
      timestamp: new Date().toISOString(),
    };

    const scheduledId = await Notifications.scheduleNotificationAsync({
      identifier: DAILY_BRIEFING_IDENTIFIER,
      content: {
        title: '☀️ صبح بخیر! مرور برنامه امروز',
        body: 'روز خود را با مرور اهداف و کارهای امروز در نویاد آغاز کنید.',
        data: payload as unknown as Record<string, unknown>,
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: 'daily-briefing',
      },
    });

    return scheduledId;
  } catch (error) {
    console.warn('Failed to schedule daily briefing notification:', error);
    return null;
  }
}

/**
 * Cancels the scheduled daily briefing notification.
 */
export async function cancelDailyBriefing(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(DAILY_BRIEFING_IDENTIFIER);
  } catch {
    // Ignore error if not scheduled
  }
}

/**
 * Delivers an immediate test notification to demonstrate notification sound,
 * banner, and Persian typography.
 */
export async function sendImmediateTestNotification(): Promise<string | null> {
  const payload: NotificationPayloadData = {
    type: 'test-notification',
    timestamp: new Date().toISOString(),
  };

  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window) {
      if (window.Notification.permission === 'granted') {
        new window.Notification('✨ آزمون اعلان نویاد', {
          body: 'سیستم اعلان‌ها و یادآورهای محلی شما با موفقیت فعال و آماده کار است.',
          icon: '/assets/icon.png',
        });
        return 'web-test-notification';
      }
    }

    const testId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '✨ آزمون اعلان نویاد',
        body: 'سیستم اعلان‌ها و یادآورهای محلی شما با موفقیت فعال و آماده کار است.',
        data: payload as unknown as Record<string, unknown>,
        sound: 'default',
      },
      trigger: null,
    });

    return testId;
  } catch (error) {
    console.warn('Failed to send test notification:', error);
    return null;
  }
}

/**
 * Synchronizes scheduled reminders for all tasks according to user settings.
 */
export async function syncAllTaskReminders(
  tasks: readonly Task[],
  remindersEnabled: boolean,
  defaultOffsetMinutes: number
): Promise<void> {
  if (!remindersEnabled) {
    // Cancel all scheduled task notifications
    for (const task of tasks) {
      await cancelTaskReminder(task.id);
    }
    return;
  }

  for (const task of tasks) {
    if (task.status === 'pending' || task.status === 'in_progress') {
      await scheduleTaskReminder(task, defaultOffsetMinutes);
    } else {
      await cancelTaskReminder(task.id);
    }
  }
}
