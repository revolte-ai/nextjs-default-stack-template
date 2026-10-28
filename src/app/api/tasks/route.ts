import { desc } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { tasks } from '@/db/schema';

const createTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Add a task title.')
    .max(200, 'Keep task titles under 200 characters.'),
});

export async function GET() {
  const taskList = await db.select().from(tasks).orderBy(desc(tasks.createdAt));
  return NextResponse.json({ tasks: taskList });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const result = createTaskSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? 'Enter a valid task title.' },
      { status: 400 }
    );
  }

  const task = {
    title: result.data.title,
    status: 'active' as const,
    createdAt: new Date().toISOString(),
  };

  const [createdTask] = await db.insert(tasks).values(task).returning();
  return NextResponse.json({ task: createdTask }, { status: 201 });
}
