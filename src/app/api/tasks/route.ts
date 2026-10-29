import { NextResponse } from 'next/server';
import { z } from 'zod';
import { desc } from 'drizzle-orm';
import { db } from '@/db';
import { tasks } from '@/db/schema';

const createTaskSchema = z.object({
  title: z.string().trim().min(1, 'Task title is required.').max(160, 'Task title must be 160 characters or fewer.'),
});

export async function GET() {
  const taskRows = await db.select().from(tasks).orderBy(desc(tasks.createdAt));
  return NextResponse.json({ tasks: taskRows });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createTaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid task.' }, { status: 400 });
    }

    const [task] = await db.insert(tasks).values({ title: parsed.data.title, status: 'todo' }).returning();
    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error('Failed to create task', error);
    return NextResponse.json({ error: 'Unable to create task.' }, { status: 500 });
  }
}
