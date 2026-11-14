import { Router } from 'express';
import authRoutes from './authRoutes';
import generationRoutes from './generationRoutes';
import galleryRoutes from './galleryRoutes';
import dashboardRoutes from './dashboardRoutes';
import uploadRoutes from './uploadRoutes';
import creditsRoutes from './creditsRoutes';
import collectionsRoutes from './collectionsRoutes';
import { isMongoConnected } from '../config/db';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'Forma Commercial AI Creative Studio API',
    database: isMongoConnected ? 'MongoDB (Mongoose Connected)' : 'Resilient Local Storage (Zero-config Persistent)',
    aiEngine: {
      zeroCostPolicy: 'Strict Zero-Cost Enforced (0 USD)',
      imageEngines: [
        'Free Community Engine (FLUX.1 Schnell) · Zero-Cost Verified',
        'Google Gemini 3.1 Flash Image · Free-tier quota guarded',
      ],
      videoEngine: 'Google Gemini Omni Flash 1.2 · Free-tier quota guarded',
      activeProviders: ['Google Gemini API', 'Zero-Cost Community Engine'],
      costGuarantees: 'Zero automatic upgrades, zero credit deduction on failed/quota requests',
    },
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

router.use('/auth', authRoutes);
router.use('/generate', generationRoutes);
router.use('/gallery', galleryRoutes);
router.use('/creations', galleryRoutes); // Aliased for maximum frontend compatibility
router.use('/dashboard', dashboardRoutes);
router.use('/upload', uploadRoutes);
router.use('/credits', creditsRoutes);
router.use('/collections', collectionsRoutes);

export default router;

