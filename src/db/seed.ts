import 'dotenv/config';
import { db } from './index';
import { tasks } from './schema';

await db.insert(tasks).values([
  { title: 'Choose the one thing that would make today lighter', status: 'todo' },
  { title: 'Clear the first ten minutes of your inbox', status: 'in-progress' },
  { title: 'Make a little room for a proper break', status: 'completed' },
]);

console.log('Seeded tasks.');
