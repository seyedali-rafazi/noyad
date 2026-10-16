import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const notes = sqliteTable('notes', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  tags: text('tags').notNull().default('[]'),
  isPinned: integer('is_pinned').notNull().default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export type NoteTable = typeof notes;
export type NoteSelect = typeof notes.$inferSelect;
export type NoteInsert = typeof notes.$inferInsert;
