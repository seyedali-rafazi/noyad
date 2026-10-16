import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  dueDate: text('due_date'),
  isAllDay: integer('is_all_day').notNull().default(0),
  priority: text('priority', { enum: ['low', 'medium', 'high', 'urgent'] })
    .notNull()
    .default('medium'),
  status: text('status', {
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
  })
    .notNull()
    .default('pending'),
  completedAt: text('completed_at'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  timezone: text('timezone'),
});

export type TaskTable = typeof tasks;
export type TaskSelect = typeof tasks.$inferSelect;
export type TaskInsert = typeof tasks.$inferInsert;
