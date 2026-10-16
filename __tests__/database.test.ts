import { openDatabaseSync } from 'expo-sqlite';
import {
  DATABASE_NAME,
  initializeDatabase,
  getDatabase,
  getExpoDatabase,
  closeDatabase,
  isDatabaseInitialized,
  DatabaseInitializationError,
  applyMigrations,
  migrationsManifest,
  schema,
  db,
  expoDb,
} from '../src/core/database';

describe('Local Database Infrastructure Tests', () => {
  beforeEach(() => {
    closeDatabase();
    jest.clearAllMocks();
  });

  afterEach(() => {
    closeDatabase();
  });

  it('verifies database configuration constants and schema registry', () => {
    expect(DATABASE_NAME).toBe('ai_calender.db');
    expect(schema).toBeDefined();
    expect(typeof schema).toBe('object');
  });

  it('initializes the database singleton and applies WAL and foreign key pragmas', () => {
    expect(isDatabaseInitialized()).toBe(false);

    const database = initializeDatabase();
    expect(database).toBeDefined();
    expect(isDatabaseInitialized()).toBe(true);

    expect(openDatabaseSync).toHaveBeenCalledTimes(1);
    expect(openDatabaseSync).toHaveBeenCalledWith('ai_calender.db');

    const nativeInstance = (openDatabaseSync as jest.Mock).mock.results[0].value;
    expect(nativeInstance.execSync).toHaveBeenCalledWith(
      'PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;'
    );
  });

  it('guarantees singleton behavior and prevents duplicate connection openings', () => {
    const db1 = initializeDatabase();
    const db2 = initializeDatabase();
    const db3 = getDatabase();

    expect(db1).toBe(db2);
    expect(db2).toBe(db3);
    expect(openDatabaseSync).toHaveBeenCalledTimes(1);
  });

  it('allows customizing journalMode and foreignKeys in initializeDatabase', () => {
    initializeDatabase({ journalMode: 'DELETE', enableForeignKeys: false });

    const nativeInstance = (openDatabaseSync as jest.Mock).mock.results[0].value;
    expect(nativeInstance.execSync).toHaveBeenCalledWith(
      'PRAGMA journal_mode = DELETE; PRAGMA foreign_keys = OFF;'
    );
  });

  it('handles and wraps initialization errors explicitly in DatabaseInitializationError', () => {
    (openDatabaseSync as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Disk I/O failure or permission denied');
    });

    expect(() => initializeDatabase()).toThrow(DatabaseInitializationError);
    expect(isDatabaseInitialized()).toBe(false);
  });

  it('closes the database connection and resets initialization state cleanly', () => {
    initializeDatabase();
    expect(isDatabaseInitialized()).toBe(true);

    const nativeInstance = (openDatabaseSync as jest.Mock).mock.results[0].value;
    closeDatabase();

    expect(nativeInstance.closeSync).toHaveBeenCalledTimes(1);
    expect(isDatabaseInitialized()).toBe(false);
  });

  it('resolves lazy access proxies (db and expoDb) properly', () => {
    expect(isDatabaseInitialized()).toBe(false);

    // Triggering property access on expoDb initializes lazily
    expect(expoDb).toBeDefined();
    const expoHandle = getExpoDatabase();
    expect(expoHandle).toBeDefined();
    expect(isDatabaseInitialized()).toBe(true);

    // db proxy is defined and accessible
    expect(db).toBeDefined();
  });

  it('verifies the migrations manifest structure and empty baseline', () => {
    expect(migrationsManifest).toBeDefined();
    expect(migrationsManifest.journal).toBeDefined();
    expect(Array.isArray(migrationsManifest.journal.entries)).toBe(true);
    expect(migrationsManifest.migrations).toBeDefined();
    expect(typeof migrationsManifest.migrations).toBe('object');
  });

  it('applies migrations cleanly when pending migrations exist', async () => {
    const result = await applyMigrations();
    expect(result.success).toBe(true);
    expect(result.appliedEntriesCount).toBe(migrationsManifest.journal.entries.length);
  });
});
