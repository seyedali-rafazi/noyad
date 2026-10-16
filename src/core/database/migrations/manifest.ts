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
 */
export const migrationsManifest: MigrationManifest = {
  journal: journal as unknown as MigrationManifest['journal'],
  migrations: {
    m0000: `CREATE TABLE IF NOT EXISTS \`tasks\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`title\` text NOT NULL,
	\`description\` text,
	\`due_date\` text,
	\`is_all_day\` integer DEFAULT 0 NOT NULL,
	\`priority\` text DEFAULT 'medium' NOT NULL,
	\`status\` text DEFAULT 'pending' NOT NULL,
	\`completed_at\` text,
	\`created_at\` text NOT NULL,
	\`updated_at\` text NOT NULL,
	\`timezone\` text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS \`notes\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`title\` text NOT NULL,
	\`content\` text NOT NULL,
	\`tags\` text DEFAULT '[]' NOT NULL,
	\`is_pinned\` integer DEFAULT 0 NOT NULL,
	\`created_at\` text NOT NULL,
	\`updated_at\` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS \`conversations\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`title\` text NOT NULL,
	\`created_at\` text NOT NULL,
	\`updated_at\` text NOT NULL,
	\`metadata\` text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS \`messages\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`conversation_id\` text NOT NULL,
	\`role\` text NOT NULL,
	\`content\` text NOT NULL,
	\`metadata\` text,
	\`created_at\` text NOT NULL,
	FOREIGN KEY (\`conversation_id\`) REFERENCES \`conversations\`(\`id\`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS \`ai_api_keys\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`provider\` text DEFAULT 'gemini' NOT NULL,
	\`api_key\` text NOT NULL,
	\`label\` text,
	\`status\` text DEFAULT 'active' NOT NULL,
	\`failure_count\` integer DEFAULT 0 NOT NULL,
	\`created_at\` text NOT NULL,
	\`updated_at\` text NOT NULL
);`,
  },
};
