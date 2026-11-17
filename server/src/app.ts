import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import apiRouter from './routes';
import { errorHandler } from './middleware/errorHandler';
import { gridFSStorage, baseUploadDir } from './services/storage';

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
  if (req.url.startsWith('/api/index/')) {
    req.url = req.url.replace('/api/index/', '/api/');
  } else if (req.url === '/api/index') {
    req.url = '/api';
  }
  if (req.originalUrl && req.url !== req.originalUrl && !req.url.startsWith('/api/')) {
    req.url = req.originalUrl;
  }
  next();
});

// Body parsers
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

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

