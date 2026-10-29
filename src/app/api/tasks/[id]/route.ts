import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { taskStatuses, tasks } from '@/db/schema';

const statusSchema = z.object({
  status: z.enum(taskStatuses),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = Number(rawId);

  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: 'Task not found.' }, { status: 404 });
  }

  try {
    const payload = statusSchema.safeParse(await request.json());

    if (!payload.success) {
      return NextResponse.json({ error: 'Choose a valid task status.' }, { status: 400 });
    }

    const [task] = await db
      .update(tasks)
      .set({ status: payload.data.status, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();

    if (!task) {
      return NextResponse.json({ error: 'Task not found.' }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('Failed to update task', error);
    return NextResponse.json({ error: 'Unable to update that task right now.' }, { status: 500 });
  }
}
