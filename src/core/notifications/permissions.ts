/**
 * Notification Permissions Handler
 *
 * Requests and inspects notification permissions across iOS, Android, and Web.
 */

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { NotificationPermissionStatus } from './types';

/**
 * Normalizes expo/browser permission status to 'granted' | 'denied' | 'undetermined'.
 */
function normalizeStatus(status: Notifications.PermissionStatus | string): NotificationPermissionStatus {
  switch (status) {
    case Notifications.PermissionStatus.GRANTED:
    case 'granted':
      return 'granted';
    case Notifications.PermissionStatus.DENIED:
    case 'denied':
      return 'denied';
    case Notifications.PermissionStatus.UNDETERMINED:
    case 'default':
    default:
      return 'undetermined';
  }
}

/**
 * Checks the current notification permission status without prompting the user.
 */
export async function getNotificationPermissions(): Promise<NotificationPermissionStatus> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return normalizeStatus(window.Notification.permission);
    }
    return 'undetermined';
  }

  try {
    const permissions = await Notifications.getPermissionsAsync();
    return normalizeStatus(permissions.status);
  } catch (error) {
    console.warn('Failed to get notification permissions:', error);
    return 'undetermined';
  }
}

/**
 * Prompts the user to grant notification permissions.
 */
export async function requestNotificationPermissions(): Promise<NotificationPermissionStatus> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const result = await window.Notification.requestPermission();
        return normalizeStatus(result);
      } catch {
        return 'denied';
      }
    }
    return 'undetermined';
  }

  try {
    const permissions = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
    return normalizeStatus(permissions.status);
  } catch (error) {
    console.warn('Failed to request notification permissions:', error);
    return 'denied';
  }
}
