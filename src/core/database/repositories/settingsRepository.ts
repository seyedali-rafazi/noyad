import { eq } from 'drizzle-orm';
import { getDatabase, isDatabaseSupported, type AppDatabase } from '../client';
import { appSettings } from '../schema/appSettings';

const WEB_PREFIX = 'noyad_setting_';

function readWebStorage<T>(key: string): T | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(`${WEB_PREFIX}${key}`);
      if (raw !== null) {
        return JSON.parse(raw) as T;
      }
    } catch {
      // Ignore parse/storage errors
    }
  }
  return null;
}

function writeWebStorage<T>(key: string, value: T): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(`${WEB_PREFIX}${key}`, JSON.stringify(value));
    } catch {
      // Ignore storage quota errors
    }
  }
}

function removeWebStorage(key: string): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem(`${WEB_PREFIX}${key}`);
    } catch {
      // Ignore
    }
  }
}

export class SqliteSettingsRepository {
  constructor(private readonly getDb: () => AppDatabase = getDatabase) {}

  async get<T>(key: string): Promise<T | null> {
    if (isDatabaseSupported()) {
      try {
        const db = this.getDb();
        const rows = await db
          .select()
          .from(appSettings)
          .where(eq(appSettings.key, key))
          .limit(1);

        if (rows.length > 0) {
          const parsed = JSON.parse(rows[0].value) as T;
          writeWebStorage(key, parsed);
          return parsed;
        }
      } catch {
        // Fallback to web storage
      }
    }

    return readWebStorage<T>(key);
  }

  async set<T>(key: string, value: T): Promise<void> {
    writeWebStorage(key, value);

    if (isDatabaseSupported()) {
      try {
        const db = this.getDb();
        const now = new Date().toISOString();
        const serialized = JSON.stringify(value);
        await db
          .insert(appSettings)
          .values({
            key,
            value: serialized,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: appSettings.key,
            set: {
              value: serialized,
              updatedAt: now,
            },
          });
      } catch {
        // Keep web/memory value if SQLite write is unavailable
      }
    }
  }

  async delete(key: string): Promise<void> {
    removeWebStorage(key);

    if (isDatabaseSupported()) {
      try {
        const db = this.getDb();
        await db.delete(appSettings).where(eq(appSettings.key, key));
      } catch {
        // Ignore
      }
    }
  }
}

export const settingsRepository = new SqliteSettingsRepository();
