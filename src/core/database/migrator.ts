import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import { getDatabase, type AppDatabase } from './client';
import { migrationsManifest, type MigrationManifest } from './migrations/manifest';

export class MigrationError extends Error {
  public readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'MigrationError';
    this.cause = cause;
    Object.setPrototypeOf(this, MigrationError.prototype);
  }
}

export interface MigrationExecutionResult {
  success: boolean;
  appliedEntriesCount: number;
}

/**
 * Programmatically executes all pending migrations against the local Expo SQLite database.
 *
 * Runs inside a database transaction and updates the internal `__drizzle_migrations` table.
 *
 * @param database Optional Drizzle database instance. If omitted, uses the centralized singleton.
 * @param manifest Optional migration manifest. If omitted, uses the project's bundled manifest.
 * @throws {MigrationError} If migration execution fails.
 */
export async function applyMigrations(
  database?: AppDatabase,
  manifest: MigrationManifest = migrationsManifest
): Promise<MigrationExecutionResult> {
  const targetDb = database ?? getDatabase();

  try {
    await migrate(targetDb, manifest);
    return {
      success: true,
      appliedEntriesCount: manifest.journal.entries.length,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new MigrationError(`Failed to apply database migrations: ${message}`, error);
  }
}
