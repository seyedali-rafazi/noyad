import journal from './meta/_journal.json';

export interface MigrationJournalEntry {
  idx: number;
  when: number;
  tag: string;
  breakpoints: boolean;
}

export interface MigrationManifest {
  journal: {
    entries: MigrationJournalEntry[];
  };
  migrations: Record<string, string>;
}

/**
 * Registry of bundled SQL migrations for Expo SQLite.
 *
 * When SQL migration files are generated via `npm run db:generate`,
 * each generated SQL script is mapped here (e.g., `m0000: '...'`).
 */
export const migrationsManifest: MigrationManifest = {
  journal: journal as unknown as MigrationManifest['journal'],
  migrations: {},
};
