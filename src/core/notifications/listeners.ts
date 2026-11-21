/**
 * Notification Listeners & Response Dispatcher
 *
 * Captures user interactions with notifications (such as tapping a task reminder)
 * and dispatches navigation or action events.
 */

import * as Notifications from 'expo-notifications';
import { NotificationPayloadData } from './types';

export interface NotificationListenerHandlers {
  onSelectTask?: (taskId: string) => void;
  onOpenBriefing?: () => void;
  onNotificationReceived?: (notification: Notifications.Notification) => void;
}

/**
 * Registers foreground notification and user response event listeners.
 *
 * Returns an unsubscription callback to prevent memory leaks.
 */
export function setupNotificationListeners(
  handlers: NotificationListenerHandlers
): () => void {
  // Listen for user interaction (tap / action on notification banner)
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(
    response => {
      try {
        const data = response.notification.request.content.data as
          | NotificationPayloadData
          | undefined;

        if (!data) return;

        if (data.type === 'task-reminder' && data.taskId) {
          handlers.onSelectTask?.(data.taskId);
        } else if (data.type === 'daily-briefing') {
          handlers.onOpenBriefing?.();
        }
      } catch (error) {
        console.warn('Error processing notification response:', error);
      }
    }
  );

  // Listen for notifications received while app is running in foreground
  const receivedSubscription = Notifications.addNotificationReceivedListener(
    notification => {
      handlers.onNotificationReceived?.(notification);
    }
  );

  return () => {
    responseSubscription.remove();
    receivedSubscription.remove();
  };
}
