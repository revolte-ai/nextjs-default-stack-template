import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const tasks = sqliteTable('tasks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  status: text('status', { enum: ['todo', 'in_progress', 'complete'] })
    .notNull()
    .default('todo'),
  createdAt: integer('created_at').notNull(),
});

export type Task = typeof tasks.$inferSelect;
