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
