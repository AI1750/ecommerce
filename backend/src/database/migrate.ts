import fs from 'fs';
import path from 'path';
import { getDb } from './connection';

export async function runMigrations(): Promise<void> {
  const db = await getDb();

  // Create migrations tracking table
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      executed_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Get already executed migrations
  const executed = db
    .prepare('SELECT name FROM _migrations')
    .all()
    .map((row: any) => row.name);

  // Find and run pending migrations
  const migrationsDir = path.join(__dirname, 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    console.log('[Migrate] No migrations directory found');
    return;
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    if (executed.includes(file)) {
      continue;
    }

    console.log(`[Migrate] Running: ${file}`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');

    db.exec(sql);
    db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(file);

    console.log(`[Migrate] Completed: ${file}`);
  }

  console.log('[Migrate] All migrations complete');
}
