import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db';
import { tasks, taskStatuses } from '@/db/schema';

const updateTaskSchema = z.object({
  status: z.enum(taskStatuses),
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const taskId = Number(id);
  const body = await request.json().catch(() => null);
  const parsed = updateTaskSchema.safeParse(body);

  if (!Number.isInteger(taskId) || taskId < 1 || !parsed.success) {
    return Response.json({ error: 'Choose a valid task status.' }, { status: 400 });
  }

  const [task] = await db
    .update(tasks)
    .set({ status: parsed.data.status, updatedAt: new Date() })
    .where(eq(tasks.id, taskId))
    .returning();

  if (!task) {
    return Response.json({ error: 'Task not found.' }, { status: 404 });
  }

  return Response.json(task);
}
