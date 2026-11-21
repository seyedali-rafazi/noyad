/**
 * Android Notification Channels Management
 *
 * Configures distinct channels for task reminders, urgent alerts, and daily briefings
 * with proper Persian descriptions, importance levels, lights, and vibration patterns.
 */

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { NotificationChannelId } from './types';

export interface ChannelDefinition {
  id: NotificationChannelId;
  name: string;
  description: string;
  importance: Notifications.AndroidImportance;
  vibrationPattern?: number[];
  lightColor?: string;
  sound?: string;
  enableLights?: boolean;
  enableVibrate?: boolean;
}

export const NOTIFICATION_CHANNELS: readonly ChannelDefinition[] = [
  {
    id: 'task-reminders',
    name: 'یادآور تسک‌ها',
    description: 'اعلان‌های یادآوری زمان انجام کارهای روزانه',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#E67E22',
    sound: 'default',
    enableLights: true,
    enableVibrate: true,
  },
  {
    id: 'urgent-alerts',
    name: 'هشدارهای فوری',
    description: 'هشدارهای اولویت بالا و فوری کارهای نویاد',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 300, 200, 300, 200, 300],
    lightColor: '#E74C3C',
    sound: 'default',
    enableLights: true,
    enableVibrate: true,
  },
  {
    id: 'daily-briefing',
    name: 'خلاصه برنامه صبحگاهی',
    description: 'مرور وظایف و کارهای روزانه در آغاز روز',
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: '#3498DB',
    sound: 'default',
    enableLights: true,
    enableVibrate: false,
  },
];

/**
 * Creates or updates all required Android notification channels.
 * Safe no-op on iOS and Web platforms.
 */
export async function setupNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  try {
    for (const ch of NOTIFICATION_CHANNELS) {
      await Notifications.setNotificationChannelAsync(ch.id, {
        name: ch.name,
        description: ch.description,
        importance: ch.importance,
        vibrationPattern: ch.vibrationPattern,
        lightColor: ch.lightColor,
        sound: ch.sound,
        enableLights: ch.enableLights,
        enableVibrate: ch.enableVibrate,
      });
    }
  } catch (error) {
    console.warn('Failed to setup Android notification channels:', error);
  }
}
