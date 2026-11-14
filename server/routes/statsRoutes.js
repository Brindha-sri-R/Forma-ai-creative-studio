import express from 'express';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;

    const totalCreations = db.prepare('SELECT COUNT(*) as count FROM creations WHERE user_id = ?').get(userId).count;
    const totalImages = db.prepare('SELECT COUNT(*) as count FROM creations WHERE user_id = ? AND mode = "image"').get(userId).count;
    const totalVideos = db.prepare('SELECT COUNT(*) as count FROM creations WHERE user_id = ? AND mode = "video"').get(userId).count;
    const totalSaved = db.prepare('SELECT COUNT(*) as count FROM creations WHERE user_id = ? AND saved = 1').get(userId).count;
    const totalCollections = db.prepare('SELECT COUNT(*) as count FROM collections WHERE user_id = ?').get(userId).count;

    const spentRow = db.prepare('SELECT SUM(ABS(delta)) as spent FROM credit_transactions WHERE user_id = ? AND delta < 0').get(userId);
    const totalCreditsSpent = spentRow?.spent || 0;

    return res.json({
      stats: {
        totalCreations,
        totalImages,
        totalVideos,
        totalSaved,
        totalCollections,
        totalCreditsSpent,
        creditsRemaining: req.user.credits,
        maxCredits: req.user.max_credits,
        planId: req.user.plan_id,
      },
    });
  } catch (error) {
    console.error('Fetch stats error:', error);
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;

