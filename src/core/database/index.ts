export {
  db,
  expoDb,
  DATABASE_NAME,
  initializeDatabase,
  getDatabase,
  getExpoDatabase,
  closeDatabase,
  isDatabaseInitialized,
  isDatabaseSupported,
  DatabaseInitializationError,
  type AppDatabase,
  type DatabaseInitOptions,
} from './client';

export {
  applyMigrations,
  MigrationError,
  type MigrationExecutionResult,
} from './migrator';

export {
  migrationsManifest,
  type MigrationManifest,
  type MigrationJournalEntry,
} from './migrations/manifest';

export * from './schema';
export * from './repositories';
