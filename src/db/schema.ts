import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const taskStatuses = ['active', 'in-progress', 'completed', 'cancelled'] as const;

export type TaskStatus = (typeof taskStatuses)[number];

export const tasks = sqliteTable('tasks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  status: text('status', { enum: taskStatuses }).notNull().default('active'),
  createdAt: text('created_at').notNull(),
});
