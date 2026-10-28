import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { taskStatuses, tasks } from '@/db/schema';

const updateTaskSchema = z.object({
  status: z.enum(taskStatuses),
});

function getTaskId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

type TaskRouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: TaskRouteContext) {
  const id = getTaskId((await context.params).id);
  if (!id) {
    return NextResponse.json({ error: 'Invalid task.' }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const result = updateTaskSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: 'Choose a valid task status.' }, { status: 400 });
  }

  const [updatedTask] = await db
    .update(tasks)
    .set({ status: result.data.status })
    .where(eq(tasks.id, id))
    .returning();

  if (!updatedTask) {
    return NextResponse.json({ error: 'Task not found.' }, { status: 404 });
  }

  return NextResponse.json({ task: updatedTask });
}

export async function DELETE(request: Request, context: TaskRouteContext) {
  const id = getTaskId((await context.params).id);
  if (!id) {
    return NextResponse.json({ error: 'Invalid task.' }, { status: 400 });
  }

  const [deletedTask] = await db.delete(tasks).where(eq(tasks.id, id)).returning();
  if (!deletedTask) {
    return NextResponse.json({ error: 'Task not found.' }, { status: 404 });
  }

  return new Response(null, { status: 204 });
}
