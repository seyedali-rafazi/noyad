// Mock expo-sqlite for test environment
jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => {
    const execResult = {
      getAllSync: jest.fn(() => []),
      getFirstSync: jest.fn(() => null),
      lastInsertRowId: 0,
      changes: 0,
      resetSync: jest.fn(),
    };

    return {
      execSync: jest.fn(),
      runSync: jest.fn(() => ({ lastInsertRowId: 0, changes: 0 })),
      getAllSync: jest.fn(() => []),
      getFirstSync: jest.fn(() => null),
      closeSync: jest.fn(),
      prepareSync: jest.fn(() => ({
        executeSync: jest.fn(() => execResult),
        executeForRawResultSync: jest.fn(() => execResult),
        finalizeSync: jest.fn(),
      })),
    };
  }),
  openDatabaseAsync: jest.fn(async () => ({
    execAsync: jest.fn(),
    runAsync: jest.fn(async () => ({ lastInsertRowId: 0, changes: 0 })),
    getAllAsync: jest.fn(async () => []),
    getFirstAsync: jest.fn(async () => null),
    closeAsync: jest.fn(),
  })),
}));

// Mock expo-notifications for test environment
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  scheduleNotificationAsync: jest.fn(async (options: { identifier?: string }) => {
    return options?.identifier ?? `mock-notification-${Date.now()}`;
  }),
  cancelScheduledNotificationAsync: jest.fn(async () => {}),
  cancelAllScheduledNotificationsAsync: jest.fn(async () => {}),
  getAllScheduledNotificationsAsync: jest.fn(async () => []),
  setNotificationChannelAsync: jest.fn(async () => {}),
  getPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  SchedulableTriggerInputTypes: {
    CALENDAR: 'calendar',
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
    YEARLY: 'yearly',
    DATE: 'date',
    TIME_INTERVAL: 'timeInterval',
  },
  AndroidImportance: {
    UNKNOWN: 0,
    MIN: 1,
    LOW: 2,
    DEFAULT: 3,
    HIGH: 4,
    MAX: 5,
  },
  PermissionStatus: {
    GRANTED: 'granted',
    UNDETERMINED: 'undetermined',
    DENIED: 'denied',
  },
}));
