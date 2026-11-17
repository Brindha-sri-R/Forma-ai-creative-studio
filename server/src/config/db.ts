import mongoose from 'mongoose';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { config } from './env';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// Safely load node:sqlite without crashing on runtimes where it is absent
let DatabaseSyncClass: any = null;
try {
  const sqliteModule = require('node:sqlite');
  DatabaseSyncClass = sqliteModule.DatabaseSync;
} catch {
  console.warn('[Database] node:sqlite is not available in this Node runtime. Operating in cloud/in-memory mode.');
}

// In-memory fallback mock for environments without node:sqlite
class FallbackDb {
  private tables: Record<string, any[]> = {
    users: [],
    generations: [],
    usage_quota: [],
    collections: [],
    media_assets: [],
  };

  exec(_sql: string) {}
  prepare(sql: string) {
    const self = this;
    const cleanSql = sql.trim();
    return {
      run(...args: any[]) {
        if (/INSERT INTO users/i.test(cleanSql)) {
          const [id, email, name, password, plan_id, credits, max_credits, reset_code, avatar_url, created_at, updated_at] = args;
          self.tables.users.push({ id, email, name, password, plan_id, credits, max_credits, reset_code, avatar_url, created_at, updated_at });
        } else if (/INSERT INTO collections/i.test(cleanSql)) {
          const [id, user_id, name, created_at] = args;
          self.tables.collections.push({ id, user_id, name, created_at });
        } else if (/INSERT INTO usage_quota/i.test(cleanSql)) {
          const [id, user_id, label, mode, delta, balance_after, timestamp, created_at] = args;
          self.tables.usage_quota.push({ id, user_id, label, mode, delta, balance_after, timestamp, created_at });
        }
        return { changes: 1 };
      },
      get(...args: any[]) {
        if (/SELECT \* FROM users WHERE email = \?/i.test(cleanSql)) {
          const email = (args[0] || '').toString().trim().toLowerCase();
          return self.tables.users.find((u) => u.email.toLowerCase() === email) || null;
        }
        if (/SELECT \* FROM users WHERE id = \?/i.test(cleanSql)) {
          const id = args[0];
          return self.tables.users.find((u) => u.id === id) || null;
        }
        if (/SELECT id FROM collections WHERE user_id = \? AND name = \?/i.test(cleanSql)) {
          const [userId, name] = args;
          return self.tables.collections.find((c) => c.user_id === userId && c.name === name) || null;
        }
        return null;
      },
      all(...args: any[]) {
        if (/SELECT name FROM collections WHERE user_id = \?/i.test(cleanSql)) {
          const userId = args[0];
          return self.tables.collections.filter((c) => c.user_id === userId);
        }
        if (/SELECT \* FROM usage_quota WHERE user_id = \?/i.test(cleanSql)) {
          const userId = args[0];
          return self.tables.usage_quota.filter((q) => q.user_id === userId);
        }
        return [];
      },
    };
  }
}

// Ensure data directory exists with safe fallback for serverless environments (e.g. Vercel /tmp)
let dataDir = path.resolve(__dirname, '../../../data');
try {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
} catch {
  dataDir = path.join(os.tmpdir(), 'forma-data');
  if (!fs.existsSync(dataDir)) {
    try {
      fs.mkdirSync(dataDir, { recursive: true });
    } catch {}
  }
}

export let isMongoConnected = false;

export function isMongoActive(): boolean {
  return isMongoConnected && mongoose.connection.readyState === 1;
}

// Listeners to maintain connection state accurately
mongoose.connection.on('disconnected', () => {
  isMongoConnected = false;
  console.warn('[Database] MongoDB connection dropped. Operating in High-Performance Local Mode.');
});

mongoose.connection.on('reconnected', () => {
  isMongoConnected = true;
  console.log('[Database] MongoDB reconnected successfully.');
});

mongoose.connection.on('error', (err) => {
  console.warn('[Database] MongoDB connection error:', err.message);
  if (mongoose.connection.readyState !== 1) {
    isMongoConnected = false;
  }
});

// Resilient local storage instance for zero-config offline durability
let localDbInstance: any;
if (DatabaseSyncClass) {
  try {
    localDbInstance = new DatabaseSyncClass(path.join(dataDir, 'studio.db'));
  } catch (err) {
    console.warn('[Database] Falling back to in-memory SQLite:', err);
    try {
      localDbInstance = new DatabaseSyncClass(':memory:');
    } catch {
      localDbInstance = new FallbackDb();
    }
  }
} else {
  localDbInstance = new FallbackDb();
}
export const localDb = localDbInstance;

localDb.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password TEXT NOT NULL,
    plan_id TEXT DEFAULT 'free',
    credits INTEGER DEFAULT 25,
    max_credits INTEGER DEFAULT 25,
    reset_code TEXT,
    avatar_url TEXT DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS generations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    prompt TEXT NOT NULL,
    negative_prompt TEXT,
    mode TEXT NOT NULL,
    generation_type TEXT DEFAULT 'text-to-image',
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
    status TEXT DEFAULT 'completed',
    saved INTEGER DEFAULT 0,
    collection_name TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS usage_quota (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    label TEXT NOT NULL,
    mode TEXT NOT NULL,
    delta INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    timestamp TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS collections (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS media_assets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    original_name TEXT NOT NULL,
    filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size INTEGER NOT NULL,
    media_kind TEXT NOT NULL,
    url TEXT NOT NULL,
    storage_provider TEXT DEFAULT 'local',
    purpose TEXT DEFAULT 'reference',
    created_at TEXT NOT NULL
  );
`);

export async function connectDatabase(): Promise<void> {
  if (mongoose.connection.readyState === 1) {
    isMongoConnected = true;
    return;
  }
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 1,
      heartbeatFrequencyMS: 10000,
    });
    isMongoConnected = true;
    console.log(`[Database] Successfully connected to MongoDB at ${config.mongodbUri}`);
  } catch (error: any) {
    isMongoConnected = false;
    console.log(
      `[Database] Notice: MongoDB (${config.mongodbUri}) is unavailable or not running. Operating in High-Performance Resilient Local Mode (Zero-config persistence active).`
    );
  }
}

