import * as Notifications from 'expo-notifications';
import { createTask, Task } from '../src/domain/models/task';
import {
  formatReminderOffsetPersian,
  getChannelForTaskPriority,
  formatTaskReminderTitle,
  getTaskNotificationIdentifier,
  scheduleTaskReminder,
  cancelTaskReminder,
  scheduleDailyBriefing,
  cancelDailyBriefing,
  sendImmediateTestNotification,
  syncAllTaskReminders,
  setupNotificationChannels,
  getNotificationPermissions,
  requestNotificationPermissions,
  setupNotificationListeners,
  useNotificationStore,
  DAILY_BRIEFING_IDENTIFIER,
} from '../src/core/notifications';

describe('Notifications & Reminders Engine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Localization & Formatting Utilities', () => {
    it('formats reminder lead time offsets in Persian correctly', () => {
      expect(formatReminderOffsetPersian(0)).toBe('هم‌اکنون');
      expect(formatReminderOffsetPersian(5)).toBe('۵ دقیقه دیگر');
      expect(formatReminderOffsetPersian(10)).toBe('۱۰ دقیقه دیگر');
      expect(formatReminderOffsetPersian(15)).toBe('۱۵ دقیقه دیگر');
      expect(formatReminderOffsetPersian(30)).toBe('۳۰ دقیقه دیگر');
      expect(formatReminderOffsetPersian(60)).toBe('۱ ساعت دیگر');
      expect(formatReminderOffsetPersian(120)).toBe('۲ ساعت دیگر');
      expect(formatReminderOffsetPersian(1440)).toBe('۱ روز دیگر');
      expect(formatReminderOffsetPersian(45)).toBe('۴۵ دقیقه دیگر');
    });

    it('assigns channels based on task priority', () => {
      expect(getChannelForTaskPriority('urgent')).toBe('urgent-alerts');
      expect(getChannelForTaskPriority('high')).toBe('urgent-alerts');
      expect(getChannelForTaskPriority('medium')).toBe('task-reminders');
      expect(getChannelForTaskPriority('low')).toBe('task-reminders');
    });

    it('formats task reminder title with Persian severity icons', () => {
      const urgentTask = createTask({ id: 't1', title: 'جلسه اضطراری', priority: 'urgent' });
      const highTask = createTask({ id: 't2', title: 'ارائه گزارش', priority: 'high' });
      const normalTask = createTask({ id: 't3', title: 'خرید کتاب', priority: 'medium' });

      expect(formatTaskReminderTitle(urgentTask)).toBe('⚠️ سررسید فوری: جلسه اضطراری');
      expect(formatTaskReminderTitle(highTask)).toBe('🔔 یادآور مهم: ارائه گزارش');
      expect(formatTaskReminderTitle(normalTask)).toBe('🗓️ یادآوری تسک: خرید کتاب');
    });

    it('generates consistent task notification identifiers', () => {
      expect(getTaskNotificationIdentifier('task-999')).toBe('task-reminder-task-999');
    });
  });

  describe('Permissions & Channels', () => {
    it('checks and requests notification permissions', async () => {
      const status = await getNotificationPermissions();
      expect(status).toBe('granted');

      const requested = await requestNotificationPermissions();
      expect(requested).toBe('granted');
      expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
    });

    it('sets up Android channels without error', async () => {
      await expect(setupNotificationChannels()).resolves.not.toThrow();
    });
  });

  describe('Task Reminders Scheduling Engine', () => {
    it('schedules notification for a task with a future due date', async () => {
      // 2 hours in the future
      const futureDueDate = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
      const task: Task = createTask({
        id: 'task-100',
        title: 'تکمیل طراحی داشبورد',
        dueDate: futureDueDate,
        reminderOffsetMinutes: 15,
      });

      const result = await scheduleTaskReminder(task);
      expect(result).toBe('task-reminder-task-100');
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          identifier: 'task-reminder-task-100',
          content: expect.objectContaining({
            title: '🗓️ یادآوری تسک: تکمیل طراحی داشبورد',
            body: expect.stringContaining('۱۵ دقیقه دیگر'),
          }),
        })
      );
    });

    it('cancels scheduled notification when task has no due date', async () => {
      const task: Task = createTask({
        id: 'task-no-due',
        title: 'کار بدون تاریخ',
        dueDate: null,
      });

      const result = await scheduleTaskReminder(task);
      expect(result).toBeNull();
      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('task-reminder-task-no-due');
    });

    it('cancels scheduled notification when task is completed or cancelled', async () => {
      const futureDueDate = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      const completedTask: Task = createTask({
        id: 'task-done',
        title: 'کار انجام شده',
        dueDate: futureDueDate,
        status: 'completed',
      });

      const result = await scheduleTaskReminder(completedTask);
      expect(result).toBeNull();
      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('task-reminder-task-done');
    });

    it('skips scheduling when trigger time is in the past', async () => {
      // 10 minutes ago
      const pastDueDate = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const pastTask: Task = createTask({
        id: 'task-past',
        title: 'کار گذشته',
        dueDate: pastDueDate,
        reminderOffsetMinutes: 0,
      });

      const result = await scheduleTaskReminder(pastTask);
      expect(result).toBeNull();
      expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });

    it('cancels reminder by taskId', async () => {
      await cancelTaskReminder('task-del-1');
      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('task-reminder-task-del-1');
    });
  });

  describe('Daily Morning Briefing & Instant Test', () => {
    it('schedules recurring daily briefing notification', async () => {
      const result = await scheduleDailyBriefing({ hour: 8, minute: 30 });
      expect(result).toBe(DAILY_BRIEFING_IDENTIFIER);
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          identifier: DAILY_BRIEFING_IDENTIFIER,
          content: expect.objectContaining({
            title: expect.stringContaining('صبح بخیر'),
          }),
          trigger: expect.objectContaining({
            hour: 8,
            minute: 30,
          }),
        })
      );
    });

    it('cancels daily briefing notification', async () => {
      await cancelDailyBriefing();
      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(DAILY_BRIEFING_IDENTIFIER);
    });

    it('delivers an immediate test notification with trigger null', async () => {
      const result = await sendImmediateTestNotification();
      expect(result).toBeDefined();
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            title: '✨ آزمون اعلان نویاد',
          }),
          trigger: null,
        })
      );
    });

    it('synchronizes all task reminders according to preferences', async () => {
      const futureDueDate = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
      const task1 = createTask({ id: 'sync-1', title: 'کار فعال', dueDate: futureDueDate, status: 'pending' });
      const task2 = createTask({ id: 'sync-2', title: 'کار تمام', dueDate: futureDueDate, status: 'completed' });

      // When reminders enabled
      await syncAllTaskReminders([task1, task2], true, 10);
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({ identifier: 'task-reminder-sync-1' })
      );
      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('task-reminder-sync-2');

      // When reminders disabled
      jest.clearAllMocks();
      await syncAllTaskReminders([task1, task2], false, 10);
      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('task-reminder-sync-1');
      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('task-reminder-sync-2');
    });
  });

  describe('Notification Store State & Actions', () => {
    it('initializes store, updates preferences and schedules briefing', async () => {
      const store = useNotificationStore.getState();

      await store.initialize();
      expect(useNotificationStore.getState().isInitialized).toBe(true);

      await store.setTaskRemindersEnabled(false);
      expect(useNotificationStore.getState().taskRemindersEnabled).toBe(false);

      await store.setDefaultReminderOffsetMinutes(30);
      expect(useNotificationStore.getState().defaultReminderOffsetMinutes).toBe(30);

      await store.setDailyBriefingTime(9, 15);
      expect(useNotificationStore.getState().dailyBriefingHour).toBe(9);
      expect(useNotificationStore.getState().dailyBriefingMinute).toBe(15);

      await store.setDailyBriefingEnabled(false);
      expect(useNotificationStore.getState().dailyBriefingEnabled).toBe(false);
      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(DAILY_BRIEFING_IDENTIFIER);
    });

    it('sends test notification via store action', async () => {
      const success = await useNotificationStore.getState().sendTestNotification();
      expect(success).toBe(true);
    });
  });

  describe('Notification Interaction Listeners', () => {
    it('registers listeners and dispatches callbacks on user tap', () => {
      const onSelectTask = jest.fn();
      const onOpenBriefing = jest.fn();

      const unsubscribe = setupNotificationListeners({
        onSelectTask,
        onOpenBriefing,
      });

      expect(typeof unsubscribe).toBe('function');
      expect(Notifications.addNotificationResponseReceivedListener).toHaveBeenCalled();
      expect(Notifications.addNotificationReceivedListener).toHaveBeenCalled();

      // Retrieve the registered response listener
      const [[listener]] = (Notifications.addNotificationResponseReceivedListener as jest.Mock).mock.calls;

      // Simulate tapping task reminder
      listener({
        notification: {
          request: {
            content: {
              data: { type: 'task-reminder', taskId: 'clicked-task-42' },
            },
          },
        },
      });
      expect(onSelectTask).toHaveBeenCalledWith('clicked-task-42');

      // Simulate tapping daily briefing
      listener({
        notification: {
          request: {
            content: {
              data: { type: 'daily-briefing' },
            },
          },
        },
      });
      expect(onOpenBriefing).toHaveBeenCalled();

      // Clean up
      unsubscribe();
    });
  });
});
