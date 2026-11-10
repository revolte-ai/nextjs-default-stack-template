import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db, schema } from '@/db';

export const runtime = 'nodejs';

const updateTaskSchema = z.object({
  completed: z.boolean(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isSafeInteger(id) || id < 1) {
    return NextResponse.json({ error: 'Task not found.' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Please submit a valid update.' }, { status: 400 });
  }

  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Choose whether the task is complete.' }, { status: 400 });
  }

  const now = new Date();
  const [task] = db
    .update(schema.tasks)
    .set({ completedAt: parsed.data.completed ? now : null, updatedAt: now })
    .where(eq(schema.tasks.id, id))
    .returning()
    .all();

  if (!task) return NextResponse.json({ error: 'Task not found.' }, { status: 404 });
  return NextResponse.json(task);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isSafeInteger(id) || id < 1) {
    return NextResponse.json({ error: 'Task not found.' }, { status: 404 });
  }

  const [task] = db
    .delete(schema.tasks)
    .where(eq(schema.tasks.id, id))
    .returning({ id: schema.tasks.id })
    .all();
  if (!task) return NextResponse.json({ error: 'Task not found.' }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}
