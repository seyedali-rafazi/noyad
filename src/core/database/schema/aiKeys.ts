import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const aiApiKeys = sqliteTable('ai_api_keys', {
  id: text('id').primaryKey(),
  provider: text('provider').notNull().default('groq'),
  apiKey: text('api_key').notNull(),
  label: text('label'),
  status: text('status', { enum: ['active', 'exhausted', 'invalid'] })
    .notNull()
    .default('active'),
  failureCount: integer('failure_count').notNull().default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export type AiApiKeyTable = typeof aiApiKeys;
export type AiApiKeySelect = typeof aiApiKeys.$inferSelect;
export type AiApiKeyInsert = typeof aiApiKeys.$inferInsert;
