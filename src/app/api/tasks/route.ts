import { asc, desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { taskStatuses, tasks } from '@/db/schema';

const createTaskSchema = z.object({
  title: z.string().trim().min(1, 'Add a title before creating a task.').max(120),
  notes: z.string().trim().max(500).optional().default(''),
  dueDate: z.string().date().optional().or(z.literal('')).default(''),
});

export async function GET() {
  try {
    const taskRows = await db
      .select()
      .from(tasks)
      .orderBy(asc(tasks.status), desc(tasks.createdAt));

    return NextResponse.json(taskRows);
  } catch (error) {
    console.error('Failed to load tasks', error);
    return NextResponse.json({ error: 'Unable to load tasks right now.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = createTaskSchema.safeParse(await request.json());

    if (!payload.success) {
      return NextResponse.json(
        { error: payload.error.issues[0]?.message ?? 'Invalid task.' },
        { status: 400 }
      );
    }

    const now = new Date();
    const [task] = await db
      .insert(tasks)
      .values({
        title: payload.data.title,
        notes: payload.data.notes || null,
        dueDate: payload.data.dueDate || null,
        status: 'todo',
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Failed to create task', error);
    return NextResponse.json({ error: 'Unable to create that task right now.' }, { status: 500 });
  }
}

export function isTaskStatus(value: unknown): value is (typeof taskStatuses)[number] {
  return typeof value === 'string' && taskStatuses.includes(value as (typeof taskStatuses)[number]);
}

export async function getTask(id: number) {
  const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
  return task;
}
