import { desc } from 'drizzle-orm';
import { db } from '@/db';
import { tasks } from '@/db/schema';
import { TaskList } from './task-list';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const savedTasks = await db.select().from(tasks).orderBy(desc(tasks.createdAt));

  return (
    <main className="page-shell">
      <TaskList initialTasks={savedTasks.map(({ id, title, completed }) => ({ id, title, completed }))} />
      <footer className="page-footer">
        <span>Personal task list</span>
        <span>Keep it light.</span>
      </footer>
    </main>
  );
}
