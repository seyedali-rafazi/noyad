import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const appSettings = sqliteTable('app_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export type AppSettingsTable = typeof appSettings;
export type AppSettingSelect = typeof appSettings.$inferSelect;
export type AppSettingInsert = typeof appSettings.$inferInsert;
