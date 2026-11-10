import { asc, desc, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db, schema } from '@/db';

export const runtime = 'nodejs';

const createTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Add a task title.')
    .max(200, 'Keep task titles under 200 characters.'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  dueDate: z.string().date().nullable().optional(),
});

export async function GET() {
  const rows = db
    .select()
    .from(schema.tasks)
    .orderBy(
      asc(schema.tasks.completedAt),
      asc(schema.tasks.dueDate),
      asc(sql`CASE ${schema.tasks.priority} WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END`),
      desc(schema.tasks.createdAt)
    )
    .limit(200)
    .all();

  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Please submit a valid task.' }, { status: 400 });
  }

  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Check the task details.' },
      { status: 400 }
    );
  }

  const now = new Date();
  const [task] = db
    .insert(schema.tasks)
    .values({
      title: parsed.data.title,
      priority: parsed.data.priority,
      dueDate: parsed.data.dueDate ?? null,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .all();

  return NextResponse.json(task, { status: 201 });
}
