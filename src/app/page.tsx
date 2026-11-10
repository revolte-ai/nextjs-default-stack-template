import { asc, desc, sql } from 'drizzle-orm';
import { db, schema } from '@/db';
import TaskTracker from './task-tracker';

export const dynamic = 'force-dynamic';

export default function Home() {
  const tasks = db
    .select()
    .from(schema.tasks)
    .orderBy(
      asc(schema.tasks.completedAt),
      asc(schema.tasks.dueDate),
      asc(sql`CASE ${schema.tasks.priority} WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END`),
      desc(schema.tasks.createdAt)
    )
    .limit(200)
    .all()
    .map((task) => ({
      ...task,
      completedAt: task.completedAt?.toISOString() ?? null,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    }));

  return <TaskTracker initialTasks={tasks} />;
}
