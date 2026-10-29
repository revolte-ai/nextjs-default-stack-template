import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const taskStatuses = ['ready', 'in-progress', 'completed'] as const;
export type TaskStatus = (typeof taskStatuses)[number];

export const tasks = sqliteTable('tasks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  status: text('status', { enum: taskStatuses }).notNull().default('ready'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

export type Task = typeof tasks.$inferSelect;
