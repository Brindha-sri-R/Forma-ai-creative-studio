import mongoose from 'mongoose';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { config } from './env';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, '../../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
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
export const localDb = new DatabaseSync(path.join(dataDir, 'studio.db'));

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
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 5000,
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

