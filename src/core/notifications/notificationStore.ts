/**
 * Notification Settings & State Store
 *
 * Persistent Zustand store governing user notification preferences,
 * daily briefing schedules, default reminder offsets, and permission states.
 */

import { create } from 'zustand';
import {
  NotificationPermissionStatus,
  NotificationSettings,
} from './types';
import { setupNotificationChannels } from './channels';
import { getNotificationPermissions, requestNotificationPermissions } from './permissions';
import {
  scheduleDailyBriefing,
  cancelDailyBriefing,
  sendImmediateTestNotification,
} from './scheduler';
import { settingsRepository } from '../database/repositories/settingsRepository';

const SETTINGS_KEY = 'notification_settings';

interface StoredNotificationSettings {
  taskRemindersEnabled: boolean;
  dailyBriefingEnabled: boolean;
  dailyBriefingHour: number;
  dailyBriefingMinute: number;
  defaultReminderOffsetMinutes: number;
}

async function loadSettingsFromStorage(): Promise<Partial<StoredNotificationSettings> | null> {
  return settingsRepository.get<Partial<StoredNotificationSettings>>(SETTINGS_KEY);
}

async function saveSettingsToStorage(settings: StoredNotificationSettings): Promise<void> {
  await settingsRepository.set(SETTINGS_KEY, settings);
}

interface NotificationStoreState extends NotificationSettings {
  isInitialized: boolean;
  isSendingTest: boolean;

  // Actions
  initialize: () => Promise<void>;
  setTaskRemindersEnabled: (enabled: boolean) => Promise<void>;
  setDailyBriefingEnabled: (enabled: boolean) => Promise<void>;
  setDailyBriefingTime: (hour: number, minute: number) => Promise<void>;
  setDefaultReminderOffsetMinutes: (minutes: number) => Promise<void>;
  checkPermissions: () => Promise<NotificationPermissionStatus>;
  requestPermissions: () => Promise<NotificationPermissionStatus>;
  sendTestNotification: () => Promise<boolean>;
}

export const useNotificationStore = create<NotificationStoreState>((set, get) => ({
  taskRemindersEnabled: true,
  dailyBriefingEnabled: true,
  dailyBriefingHour: 8,
  dailyBriefingMinute: 0,
  defaultReminderOffsetMinutes: 10,
  permissionStatus: 'undetermined',
  isInitialized: false,
  isSendingTest: false,

  initialize: async () => {
    // 1. Load preferences from storage (SQLite on mobile, localStorage on web)
    const saved = await loadSettingsFromStorage();
    if (saved) {
      set({
        taskRemindersEnabled: saved.taskRemindersEnabled ?? true,
        dailyBriefingEnabled: saved.dailyBriefingEnabled ?? true,
        dailyBriefingHour: saved.dailyBriefingHour ?? 8,
        dailyBriefingMinute: saved.dailyBriefingMinute ?? 0,
        defaultReminderOffsetMinutes: saved.defaultReminderOffsetMinutes ?? 10,
      });
    }

    // 2. Setup Android channels
    await setupNotificationChannels();

    // 3. Inspect permissions
    const permission = await getNotificationPermissions();

    // 4. If daily briefing is enabled, schedule it
    const { dailyBriefingEnabled, dailyBriefingHour, dailyBriefingMinute } = get();
    if (dailyBriefingEnabled) {
      await scheduleDailyBriefing({
        hour: dailyBriefingHour,
        minute: dailyBriefingMinute,
      });
    }

    set({ permissionStatus: permission, isInitialized: true });
  },

  setTaskRemindersEnabled: async (enabled: boolean) => {
    set({ taskRemindersEnabled: enabled });
    const { dailyBriefingEnabled, dailyBriefingHour, dailyBriefingMinute, defaultReminderOffsetMinutes } = get();
    saveSettingsToStorage({
      taskRemindersEnabled: enabled,
      dailyBriefingEnabled,
      dailyBriefingHour,
      dailyBriefingMinute,
      defaultReminderOffsetMinutes,
    });
  },

  setDailyBriefingEnabled: async (enabled: boolean) => {
    set({ dailyBriefingEnabled: enabled });
    const { taskRemindersEnabled, dailyBriefingHour, dailyBriefingMinute, defaultReminderOffsetMinutes } = get();
    saveSettingsToStorage({
      taskRemindersEnabled,
      dailyBriefingEnabled: enabled,
      dailyBriefingHour,
      dailyBriefingMinute,
      defaultReminderOffsetMinutes,
    });

    if (enabled) {
      await scheduleDailyBriefing({ hour: dailyBriefingHour, minute: dailyBriefingMinute });
    } else {
      await cancelDailyBriefing();
    }
  },

  setDailyBriefingTime: async (hour: number, minute: number) => {
    set({ dailyBriefingHour: hour, dailyBriefingMinute: minute });
    const { taskRemindersEnabled, dailyBriefingEnabled, defaultReminderOffsetMinutes } = get();
    saveSettingsToStorage({
      taskRemindersEnabled,
      dailyBriefingEnabled,
      dailyBriefingHour: hour,
      dailyBriefingMinute: minute,
      defaultReminderOffsetMinutes,
    });

    if (dailyBriefingEnabled) {
      await scheduleDailyBriefing({ hour, minute });
    }
  },

  setDefaultReminderOffsetMinutes: async (minutes: number) => {
    set({ defaultReminderOffsetMinutes: minutes });
    const { taskRemindersEnabled, dailyBriefingEnabled, dailyBriefingHour, dailyBriefingMinute } = get();
    saveSettingsToStorage({
      taskRemindersEnabled,
      dailyBriefingEnabled,
      dailyBriefingHour,
      dailyBriefingMinute,
      defaultReminderOffsetMinutes: minutes,
    });
  },

  checkPermissions: async () => {
    const status = await getNotificationPermissions();
    set({ permissionStatus: status });
    return status;
  },

  requestPermissions: async () => {
    const status = await requestNotificationPermissions();
    set({ permissionStatus: status });
    return status;
  },

  sendTestNotification: async () => {
    set({ isSendingTest: true });
    try {
      const id = await sendImmediateTestNotification();
      return id !== null;
    } finally {
      set({ isSendingTest: false });
    }
  },
}));
