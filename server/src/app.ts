import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import apiRouter from './routes';
import { errorHandler } from './middleware/errorHandler';
import { gridFSStorage, baseUploadDir } from './services/storage';
import { connectDatabase } from './config/db';
import { dbRepository } from './services/dbRepository';
import { hashPassword } from './utils/password';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

// Security & CORS
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Normalize rewritten URL in serverless environments (e.g. Vercel rewrites)
app.use((req, _res, next) => {
  const matchedPath = (req.headers['x-matched-path'] || req.headers['x-vercel-matched-path']) as string | undefined;
  if (matchedPath && (matchedPath.startsWith('/api') || matchedPath.startsWith('/uploads'))) {
    req.url = matchedPath;
  } else if (req.url.startsWith('/api/index/')) {
    req.url = req.url.replace('/api/index/', '/api/');
  } else if (req.url === '/api/index') {
    if (req.originalUrl && req.originalUrl.startsWith('/api/')) {
      req.url = req.originalUrl;
    } else {
      req.url = '/api';
    }
  }
  next();
});

// Body parsers
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Ensure req.body is always defined in serverless environments
app.use((req, _res, next) => {
  if (!req.body || typeof req.body !== 'object') {
    req.body = {};
  }
  next();
});

// Lazy DB initialization & default user seeding middleware for serverless cold-starts
let isDbInitialized = false;
let dbInitPromise: Promise<void> | null = null;

export async function ensureDatabaseReady(): Promise<void> {
  if (isDbInitialized) return;
  if (!dbInitPromise) {
    dbInitPromise = (async () => {
      try {
        await connectDatabase();
        const existing = await dbRepository.users.findByEmail('creator@studio.in');
        if (!existing) {
          const hashedPassword = await hashPassword('password123');
          const user = await dbRepository.users.create({
            email: 'creator@studio.in',
            name: 'Forma Studio Lead',
            password: hashedPassword,
            planId: 'free',
            credits: 25,
            maxCredits: 25,
          });

          await dbRepository.collections.create(user.id, 'Brand Kit');
          await dbRepository.collections.create(user.id, 'Campaigns');
          await dbRepository.collections.create(user.id, 'Motion Studies');

          await dbRepository.usageQuota.log({
            userId: user.id,
            label: 'Welcome Free Plan allocation',
            mode: 'topup',
            delta: 25,
            balanceAfter: 25,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          });
          console.log('[Database] Default creator account initialized (creator@studio.in / password123)');
        }
        isDbInitialized = true;
      } catch (err: any) {
        console.warn('[Database] Cold-start initialization notice:', err.message || err);
      } finally {
        dbInitPromise = null;
      }
    })();
  }
  return dbInitPromise;
}

app.use(async (_req, _res, next) => {
  try {
    await ensureDatabaseReady();
  } catch (err) {
    console.warn('[Database Middleware Error]', err);
  }
  next();
});

// Request Logging Middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (!req.path.startsWith('/uploads') && !req.path.startsWith('/assets')) {
      console.log(`[HTTP] ${req.method} ${req.path} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Static assets: serve uploaded files & generated media from disk cache
app.use('/uploads', express.static(baseUploadDir));

// Fallback: If not found on local disk, stream from MongoDB Atlas GridFS persistent storage
app.get('/uploads/:folder/:filename', async (req, res, next) => {
  const { filename } = req.params;
  const streamed = await gridFSStorage.streamToResponse(filename, res);
  if (!streamed) {
    res.status(404).json({ success: false, error: 'Media asset not found' });
  }
});

// Mount REST API: support both /api prefix and root-rewritten routes
app.use('/api', apiRouter);
app.use(apiRouter);

// 404 Fallback for unknown API routes
app.use('/api/*', (_req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Production: serve Vite frontend bundle from dist/
const distDir = path.resolve(__dirname, '../../dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

// Centralized error handler
app.use(errorHandler);

