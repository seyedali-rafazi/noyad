import { Platform } from 'react-native';
import { openDatabaseSync, SQLiteDatabase } from 'expo-sqlite';
import { drizzle, ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';

export const DATABASE_NAME = 'ai_calender.db';

export interface DatabaseInitOptions {
  /**
   * SQLite journal mode. WAL (Write-Ahead Logging) is recommended for mobile apps
   * to allow concurrent reads during write transactions.
   * @default 'WAL'
   */
  journalMode?: 'WAL' | 'DELETE';
  /**
   * Whether to enforce SQLite foreign key constraints.
   * @default true
   */
  enableForeignKeys?: boolean;
}

export class DatabaseInitializationError extends Error {
  public readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'DatabaseInitializationError';
    this.cause = cause;
    Object.setPrototypeOf(this, DatabaseInitializationError.prototype);
  }
}

let expoDbInstance: SQLiteDatabase | null = null;
let dbInstance: ExpoSQLiteDatabase<typeof schema> | null = null;

/**
 * Checks if SQLite is supported in the current environment.
 * On web, expo-sqlite requires SharedArrayBuffer (cross-origin isolation).
 */
export function isDatabaseSupported(): boolean {
  if (Platform.OS === 'web') {
    return (
      typeof window !== 'undefined' &&
      typeof (window as unknown as { SharedArrayBuffer?: unknown }).SharedArrayBuffer !== 'undefined'
    );
  }
  return true;
}

/**
 * Initializes the local SQLite database and Drizzle ORM client.
 *
 * Guaranteed singleton: subsequent calls return the existing active database instance
 * without opening redundant connections.
 *
 * Configures optimal mobile SQLite pragmas (WAL journal mode and foreign keys).
 *
 * @throws {DatabaseInitializationError} If opening the database or configuring pragmas fails.
 */
export function initializeDatabase(
  options?: DatabaseInitOptions
): ExpoSQLiteDatabase<typeof schema> {
  if (dbInstance && expoDbInstance) {
    return dbInstance;
  }

  if (!isDatabaseSupported()) {
    throw new DatabaseInitializationError(
      `SharedArrayBuffer is not available in this browser. SQLite WASM requires cross-origin isolation headers.`
    );
  }

  try {
    const nativeDb = openDatabaseSync(DATABASE_NAME);

    const journalMode = options?.journalMode ?? 'WAL';
    const enableForeignKeys = options?.enableForeignKeys ?? true;

    // Apply mobile SQLite performance and relational integrity pragmas
    nativeDb.execSync(
      `PRAGMA journal_mode = ${journalMode}; PRAGMA foreign_keys = ${enableForeignKeys ? 'ON' : 'OFF'};`
    );

    expoDbInstance = nativeDb;
    dbInstance = drizzle(nativeDb, { schema });

    return dbInstance;
  } catch (error) {
    // Reset handles if initialization failed partially
    expoDbInstance = null;
    dbInstance = null;
    const message = error instanceof Error ? error.message : String(error);
    throw new DatabaseInitializationError(
      `Failed to initialize SQLite database "${DATABASE_NAME}": ${message}`,
      error
    );
  }
}

/**
 * Returns the native Expo SQLite database handle, initializing it if not yet opened.
 */
export function getExpoDatabase(): SQLiteDatabase {
  if (!expoDbInstance) {
    initializeDatabase();
  }
  return expoDbInstance!;
}

/**
 * Returns the Drizzle ORM client, initializing it if not yet opened.
 */
export function getDatabase(): ExpoSQLiteDatabase<typeof schema> {
  if (!dbInstance) {
    return initializeDatabase();
  }
  return dbInstance;
}

/**
 * Returns whether the database connection has been established.
 */
export function isDatabaseInitialized(): boolean {
  return expoDbInstance !== null && dbInstance !== null;
}

/**
 * Closes the active database connection and resets the singleton instance.
 * Useful for test isolation, migrations reset, or application teardown.
 */
export function closeDatabase(): void {
  if (expoDbInstance) {
    try {
      expoDbInstance.closeSync();
    } catch {
      // Ignore closing errors during shutdown/reset
    }
    expoDbInstance = null;
  }
  dbInstance = null;
}

/**
 * Convenience proxy to access Drizzle database operations lazily.
 */
export const db = new Proxy({} as ExpoSQLiteDatabase<typeof schema>, {
  get(_target, prop, receiver) {
    const instance = getDatabase();
    const value = Reflect.get(instance as unknown as object, prop, receiver);
    return typeof value === 'function' ? value.bind(instance) : value;
  },
});

/**
 * Convenience proxy to access the raw Expo SQLite handle lazily.
 */
export const expoDb = new Proxy({} as SQLiteDatabase, {
  get(_target, prop, receiver) {
    const instance = getExpoDatabase();
    const value = Reflect.get(instance as unknown as object, prop, receiver);
    return typeof value === 'function' ? value.bind(instance) : value;
  },
});

export type AppDatabase = ExpoSQLiteDatabase<typeof schema>;
