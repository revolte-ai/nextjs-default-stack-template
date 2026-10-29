import { desc } from 'drizzle-orm';

import { TasksClient } from './tasks-client';
import { db } from '@/db';
import { tasks } from '@/db/schema';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const initialTasks = await db.select().from(tasks).orderBy(desc(tasks.createdAt));
  return <TasksClient initialTasks={initialTasks} />;
}
