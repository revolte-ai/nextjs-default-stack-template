import 'dotenv/config';
import { db, schema } from './index';

async function main() {
  const existing = db.select({ id: schema.tasks.id }).from(schema.tasks).limit(1).all();
  if (existing.length > 0) {
    console.log('Tasks already exist; skipping seed.');
    return;
  }

  const now = new Date();
  const today = new Date();
  const date = (offset: number) => {
    const value = new Date(today);
    value.setDate(value.getDate() + offset);
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
  };

  db.insert(schema.tasks)
    .values([
      {
        title: 'Review the project brief',
        priority: 'high',
        dueDate: date(0),
        completedAt: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        title: 'Send the updated timeline to Maya',
        priority: 'medium',
        dueDate: date(0),
        completedAt: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        title: 'Block time for focused work',
        priority: 'low',
        dueDate: date(1),
        completedAt: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        title: 'Clear the notes from yesterday',
        priority: 'low',
        dueDate: date(-1),
        completedAt: now,
        createdAt: now,
        updatedAt: now,
      },
    ])
    .run();

  console.log('Seeded example tasks.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
