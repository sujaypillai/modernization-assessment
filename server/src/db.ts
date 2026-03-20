import Database, { Database as DatabaseType } from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { seedDatabase } from './seed';

const DATA_DIR = process.env.NODE_ENV === 'production' ? '/data' : path.join(__dirname, '..', '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'modernization.db');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const isNew = !fs.existsSync(DB_PATH);

const db: DatabaseType = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

export function initializeDatabase(): void {
  // Application table
  db.exec(`
    CREATE TABLE IF NOT EXISTS Application (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      include INTEGER DEFAULT 1,
      effort INTEGER DEFAULT 0,
      target TEXT,
      reportFilename TEXT,
      properties TEXT DEFAULT '{}',
      drivers TEXT DEFAULT '{}'
    )
  `);

  // AppType table
  db.exec(`
    CREATE TABLE IF NOT EXISTS AppType (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      language TEXT,
      langVer TEXT,
      framework TEXT,
      frameworkVer TEXT
    )
  `);

  // AppProperty table
  db.exec(`
    CREATE TABLE IF NOT EXISTS AppProperty (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      dataType TEXT DEFAULT 'VAR',
      defaultValue TEXT
    )
  `);

  // ModDriver table
  db.exec(`
    CREATE TABLE IF NOT EXISTS ModDriver (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      desc TEXT,
      score INTEGER DEFAULT 0
    )
  `);

  if (isNew) {
    console.log('Fresh database created, seeding from server/data/seed...');
    seedDatabase(db);
    console.log('Seeding complete');
  }
}

export default db;
