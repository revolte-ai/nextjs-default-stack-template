import 'dotenv/config';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

const globalForDb = globalThis as unknown as {
  sqlite: Database.Database | undefined;
};

const sqlite =
  globalForDb.sqlite ?? new Database(process.env.DATABASE_URL?.replace(/^file:/, '') ?? './dev.db');

if (process.env.NODE_ENV !== 'production') globalForDb.sqlite = sqlite;

sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    due_date TEXT,
    completed_at INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )
`);

export const db = drizzle(sqlite, { schema });
export { schema };
