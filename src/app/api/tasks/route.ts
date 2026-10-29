import { desc } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db';
import { tasks } from '@/db/schema';

const createTaskSchema = z.object({
  title: z.string().trim().min(1, 'Add a title before creating the task.').max(120),
});

export async function GET() {
  const result = await db.select().from(tasks).orderBy(desc(tasks.createdAt));
  return Response.json(result);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = createTaskSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid task.' },
      { status: 400 }
    );
  }

  const now = new Date();
  const [task] = await db
    .insert(tasks)
    .values({ title: parsed.data.title, status: 'ready', createdAt: now, updatedAt: now })
    .returning();

  return Response.json(task, { status: 201 });
}
