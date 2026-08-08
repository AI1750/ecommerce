import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { config } from '../config';

let db: Database | null = null;

/**
 * Wrapper around sql.js that mimics better-sqlite3's synchronous API
 */
export class Database {
  private sqlDb: SqlJsDatabase;
  private dbPath: string;

  constructor(sqlDb: SqlJsDatabase, dbPath: string) {
    this.sqlDb = sqlDb;
    this.dbPath = dbPath;
  }

  prepare(sql: string) {
    return new Statement(this, sql);
  }

  exec(sql: string): void {
    this.sqlDb.run(sql);
    this.save();
  }

  run(sql: string, ...params: any[]): { changes: number; lastInsertRowid: number | bigint } {
    const stmt = this.prepare(sql);
    const result = stmt.run(...params);
    stmt.free();
    return result;
  }

  get(sql: string, ...params: any[]): any | undefined {
    const stmt = this.prepare(sql);
    const result = stmt.get(...params);
    stmt.free();
    return result;
  }

  all(sql: string, ...params: any[]): any[] {
    const stmt = this.prepare(sql);
    const result = stmt.all(...params);
    stmt.free();
    return result;
  }

  transaction(fn: () => void): void {
    this.sqlDb.run('BEGIN');
    try {
      fn();
      this.sqlDb.run('COMMIT');
    } catch (err) {
      try { this.sqlDb.run('ROLLBACK'); } catch {}
      throw err;
    }
    this.save();
  }

  pragma(pragma: string): void {
    this.exec(`PRAGMA ${pragma}`);
  }

  getRawDb(): SqlJsDatabase {
    return this.sqlDb;
  }

  save(): void {
    const data = this.sqlDb.export();
    const buffer = Buffer.from(data);
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.dbPath, buffer);
  }

  close(): void {
    this.save();
    this.sqlDb.close();
  }
}

class Statement {
  private db: Database;
  private sql: string;

  constructor(db: Database, sql: string) {
    this.db = db;
    this.sql = sql;
  }

  run(...params: any[]): { changes: number; lastInsertRowid: number | bigint } {
    const sqlDb = this.db.getRawDb();
    sqlDb.run(this.sql, params);
    this.db.save();
    const rows = sqlDb.exec('SELECT last_insert_rowid(), changes()');
    return {
      lastInsertRowid: rows[0]?.values[0]?.[0] || 0,
      changes: rows[0]?.values[0]?.[1] || 0,
    };
  }

  get(...params: any[]): any | undefined {
    const sqlDb = this.db.getRawDb();
    const stmt = sqlDb.prepare(this.sql);
    if (params.length > 0) {
      stmt.bind(params);
    }
    let row: any = undefined;
    if (stmt.step()) {
      const cols = stmt.getColumnNames();
      const vals = stmt.get();
      row = {};
      cols.forEach((col, i) => {
        row[col] = vals[i];
      });
    }
    stmt.free();
    return row;
  }

  all(...params: any[]): any[] {
    const sqlDb = this.db.getRawDb();
    const stmt = sqlDb.prepare(this.sql);
    if (params.length > 0) {
      stmt.bind(params);
    }
    const results: any[] = [];
    const cols = stmt.getColumnNames();
    while (stmt.step()) {
      const vals = stmt.get();
      const row: any = {};
      cols.forEach((col, i) => {
        row[col] = vals[i];
      });
      results.push(row);
    }
    stmt.free();
    return results;
  }

  free(): void {}
}

export async function getDb(): Promise<Database> {
  if (!db) {
    const SQL = await initSqlJs();

    // Ensure data directory exists
    const dbDir = path.dirname(config.dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    let sqlDb: SqlJsDatabase;
    if (fs.existsSync(config.dbPath)) {
      const fileBuffer = fs.readFileSync(config.dbPath);
      sqlDb = new SQL.Database(fileBuffer);
    } else {
      sqlDb = new SQL.Database();
    }

    db = new Database(sqlDb, config.dbPath);
    db.pragma('foreign_keys = ON');
    console.log(`[DB] Connected to SQLite at ${config.dbPath}`);
  }
  return db;
}

export async function closeDb(): Promise<void> {
  if (db) {
    db.close();
    db = null;
    console.log('[DB] Connection closed');
  }
}
