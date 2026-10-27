'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/db';
import { tasks } from '@/db/schema';

const taskTitleSchema = z
  .string()
  .trim()
  .min(1, 'Add a title before saving.')
  .max(200, 'Keep task titles under 200 characters.');
const taskIdSchema = z.number().int().positive();
const taskStatusSchema = z.enum(['todo', 'in_progress', 'complete']);

export async function createTask(title: string) {
  const result = taskTitleSchema.safeParse(title);

  if (!result.success) {
    return {
      success: false,
      error: result.error.issues[0]?.message ?? 'Enter a valid task title.',
    };
  }

  try {
    const [task] = await db
      .insert(tasks)
      .values({
        title: result.data,
        createdAt: Date.now(),
      })
      .returning({ id: tasks.id });
    if (!task) {
      return { success: false, error: 'We could not save that task. Try again.' };
    }

    revalidatePath('/');
    return { success: true, id: task.id };
  } catch (error) {
    console.error('Failed to create task', error);
    return { success: false, error: 'We could not save that task. Try again.' };
  }
}

export async function updateTaskStatus(id: number, status: string) {
  const parsedId = taskIdSchema.safeParse(id);
  const parsedStatus = taskStatusSchema.safeParse(status);

  if (!parsedId.success || !parsedStatus.success) {
    return { success: false, error: 'That task could not be updated.' };
  }

  try {
    await db.update(tasks).set({ status: parsedStatus.data }).where(eq(tasks.id, parsedId.data));
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to update task', error);
    return { success: false, error: 'We could not update that task. Try again.' };
  }
}

export async function deleteTask(id: number) {
  const parsedId = taskIdSchema.safeParse(id);

  if (!parsedId.success) {
    return { success: false, error: 'That task could not be found.' };
  }

  try {
    await db.delete(tasks).where(eq(tasks.id, parsedId.data));
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete task', error);
    return { success: false, error: 'We could not delete that task. Try again.' };
  }
}
