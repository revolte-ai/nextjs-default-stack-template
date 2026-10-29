import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { tasks } from '@/db/schema';

const idSchema = z.coerce.number().int().positive();
const updateTaskSchema = z.object({
  status: z.enum(['todo', 'in-progress', 'completed']),
});

type TaskRouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: TaskRouteContext) {
  try {
    const { id: rawId } = await params;
    const id = idSchema.safeParse(rawId);
    const body = updateTaskSchema.safeParse(await request.json());
    if (!id.success || !body.success) {
      return NextResponse.json({ error: 'Invalid task update.' }, { status: 400 });
    }

    const [task] = await db.update(tasks).set({ status: body.data.status, updatedAt: new Date() }).where(eq(tasks.id, id.data)).returning();
    if (!task) return NextResponse.json({ error: 'Task not found.' }, { status: 404 });
    return NextResponse.json({ task });
  } catch (error) {
    console.error('Failed to update task', error);
    return NextResponse.json({ error: 'Unable to update task.' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: TaskRouteContext) {
  try {
    const { id: rawId } = await params;
    const id = idSchema.safeParse(rawId);
    if (!id.success) return NextResponse.json({ error: 'Invalid task id.' }, { status: 400 });

    const [task] = await db.delete(tasks).where(eq(tasks.id, id.data)).returning();
    if (!task) return NextResponse.json({ error: 'Task not found.' }, { status: 404 });
    return NextResponse.json({ task });
  } catch (error) {
    console.error('Failed to delete task', error);
    return NextResponse.json({ error: 'Unable to delete task.' }, { status: 500 });
  }
}
