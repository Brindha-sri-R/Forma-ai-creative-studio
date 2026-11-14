import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import apiRouter from './routes';
import { errorHandler } from './middleware/errorHandler';
import { gridFSStorage } from './services/storage';

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

// Static assets: serve uploaded files & generated media from local disk cache
const uploadsDir = path.resolve(__dirname, '../../uploads');
app.use('/uploads', express.static(uploadsDir));

// Fallback: If not found on local disk, stream from MongoDB Atlas GridFS persistent storage
app.get('/uploads/:folder/:filename', async (req, res, next) => {
  const { filename } = req.params;
  const streamed = await gridFSStorage.streamToResponse(filename, res);
  if (!streamed) {
    res.status(404).json({ success: false, error: 'Media asset not found' });
  }
});

// Mount REST API
app.use('/api', apiRouter);

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

