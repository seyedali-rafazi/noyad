import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const conversations = sqliteTable('conversations', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  metadata: text('metadata'),
});

export type ConversationTable = typeof conversations;
export type ConversationSelect = typeof conversations.$inferSelect;
export type ConversationInsert = typeof conversations.$inferInsert;
