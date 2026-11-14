import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ensureDemoUser } from './auth.js';
import authRoutes from './routes/authRoutes.js';
import generateRoutes from './routes/generateRoutes.js';
import creationsRoutes from './routes/creationsRoutes.js';
import creditsRoutes from './routes/creditsRoutes.js';
import collectionsRoutes from './routes/collectionsRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import statsRoutes from './routes/statsRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Body parsers
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static uploads directory
const uploadsDir = path.resolve(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadsDir));

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Forma Studio API Engine',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/generate', generateRoutes);
app.use('/api/creations', creationsRoutes);
app.use('/api/credits', creditsRoutes);
app.use('/api/collections', collectionsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/stats', statsRoutes);

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('[Server Error]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

// Initialize DB demo seed and start listening
ensureDemoUser();

const server = app.listen(PORT, () => {
  console.log(`[Forma Server] API running on http://localhost:${PORT}`);
  console.log(`[Forma Server] Uploads served at http://localhost:${PORT}/uploads`);
});

process.on('SIGTERM', () => {
  server.close(() => {
    console.log('[Forma Server] Process terminated');
  });
});

