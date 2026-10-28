import { desc } from 'drizzle-orm';
import TaskList from './task-list';
import { db } from '@/db';
import { tasks } from '@/db/schema';

export default async function Home() {
  const initialTasks = await db.select().from(tasks).orderBy(desc(tasks.createdAt));

  return (
    <main className="page-frame">
      <TaskList initialTasks={initialTasks} />
    </main>
  );
}
