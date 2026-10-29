import 'dotenv/config';
import { db } from './index';
import { tasks } from './schema';

const starterTasks = [
  {
    title: 'Outline the week ahead',
    notes: 'Pick three outcomes that will make this week feel meaningful.',
    status: 'todo' as const,
    dueDate: null,
  },
  {
    title: 'Reply to the design review',
    notes: 'Share the final notes and call out the two decisions we made.',
    status: 'in-progress' as const,
    dueDate: null,
  },
  {
    title: 'Set up the project workspace',
    notes: 'The basics are in place and ready for the next step.',
    status: 'completed' as const,
    dueDate: null,
  },
];

async function main() {
  const existing = await db.select({ id: tasks.id }).from(tasks).limit(1);

  if (existing.length === 0) {
    const now = new Date();
    await db
      .insert(tasks)
      .values(starterTasks.map((task) => ({ ...task, createdAt: now, updatedAt: now })));
  }

  console.log('Seeding complete.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
