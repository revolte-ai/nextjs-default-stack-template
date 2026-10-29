import 'dotenv/config';

import { db } from './index';
import { tasks } from './schema';

const seedTasks = [
  { title: 'Map the first-run experience', status: 'completed' as const },
  { title: 'Write the empty state copy', status: 'in-progress' as const },
  { title: 'Review keyboard navigation', status: 'ready' as const },
  { title: 'Define the launch checklist', status: 'ready' as const },
];

async function main() {
  const existing = await db.select().from(tasks).limit(1);
  if (existing.length > 0) {
    console.log('Tasks already seeded.');
    return;
  }

  const now = new Date();
  await db.insert(tasks).values(
    seedTasks.map((task, index) => ({
      ...task,
      createdAt: new Date(now.getTime() - index * 86_400_000),
      updatedAt: now,
    }))
  );
  console.log('Seeded task tracker.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
