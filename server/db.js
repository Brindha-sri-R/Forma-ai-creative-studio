import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, '..', 'data');
const uploadsDir = path.resolve(__dirname, '..', 'uploads');
const creationsUploadDir = path.join(uploadsDir, 'creations');
const referencesUploadDir = path.join(uploadsDir, 'references');

for (const dir of [dataDir, uploadsDir, creationsUploadDir, referencesUploadDir]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const dbPath = path.join(dataDir, 'studio.db');
export const db = new DatabaseSync(dbPath);

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    plan_id TEXT DEFAULT 'free',
    credits INTEGER DEFAULT 25,
    max_credits INTEGER DEFAULT 25,
    reset_code TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS creations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    prompt TEXT NOT NULL,
    negative_prompt TEXT,
    mode TEXT NOT NULL,
    aspect_ratio TEXT NOT NULL,
    resolution TEXT NOT NULL,
    style TEXT NOT NULL,
    model TEXT NOT NULL,
    variations INTEGER DEFAULT 1,
    duration TEXT,
    motion TEXT,
    fps TEXT,
    reference_asset_url TEXT,
    reference_asset_name TEXT,
    reference_media_kind TEXT,
    seed INTEGER NOT NULL,
    dimensions TEXT NOT NULL,
    credits_used INTEGER NOT NULL,
    provider TEXT DEFAULT 'forma-engine',
    media_url TEXT NOT NULL,
    media_kind TEXT NOT NULL,
    saved INTEGER DEFAULT 0,
    collection TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS credit_transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    label TEXT NOT NULL,
    mode TEXT NOT NULL,
    delta INTEGER NOT NULL,
    timestamp TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS collections (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_creations_user ON creations(user_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_user ON credit_transactions(user_id);
  CREATE INDEX IF NOT EXISTS idx_collections_user ON collections(user_id);
`);

console.log(`[Database] SQLite connected at ${dbPath}`);

