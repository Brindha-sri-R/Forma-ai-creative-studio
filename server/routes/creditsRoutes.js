import express from 'express';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';

const router = express.Router();

const PLAN_CREDIT_MAP = {
  free: { credits: 25, label: 'Switched to Free Plan' },
  pro: { credits: 500, label: 'Upgraded to Pro Plan (₹1,499/mo)' },
  studio: { credits: 2000, label: 'Upgraded to Studio Plan (₹3,999/mo)' },
};

// Get credit history
router.get('/history', requireAuth, (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT id, label, mode, delta, timestamp
      FROM credit_transactions
      WHERE user_id = ?
      ORDER BY rowid DESC
    `).all(req.user.id);

    return res.json({ history: rows });
  } catch (error) {
    console.error('Fetch credit history error:', error);
    return res.status(500).json({ error: 'Failed to fetch credit history' });
  }
});

// Switch/Upgrade Plan
router.post('/plan', requireAuth, (req, res) => {
  try {
    const { planId } = req.body;
    const plan = PLAN_CREDIT_MAP[planId];
    if (!plan) {
      return res.status(400).json({ error: 'Invalid plan id' });
    }

    db.prepare(`
      UPDATE users
      SET plan_id = ?, credits = ?, max_credits = ?, updated_at = ?
      WHERE id = ?
    `).run(planId, plan.credits, plan.credits, new Date().toISOString(), req.user.id);

    const txId = `tx-${Date.now()}`;
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    db.prepare(`
      INSERT INTO credit_transactions (id, user_id, label, mode, delta, timestamp)
      VALUES (?, ?, ?, 'topup', ?, ?)
    `).run(txId, req.user.id, plan.label, plan.credits, timeString);

    return res.json({
      message: `Plan updated to ${planId}`,
      planId,
      credits: plan.credits,
      maxCredits: plan.credits,
      transaction: {
        id: txId,
        label: plan.label,
        mode: 'topup',
        delta: plan.credits,
        timestamp: timeString,
      },
    });
  } catch (error) {
    console.error('Update plan error:', error);
    return res.status(500).json({ error: 'Failed to update plan' });
  }
});

// Top up / Adjust credits (used in Settings / testing or top-up)
router.post('/topup', requireAuth, (req, res) => {
  try {
    const { amount, label = 'Credit adjustment' } = req.body;
    const numericAmount = Math.max(0, Math.floor(Number(amount) || 0));

    db.prepare('UPDATE users SET credits = ?, updated_at = ? WHERE id = ?')
      .run(numericAmount, new Date().toISOString(), req.user.id);

    const txId = `tx-${Date.now()}`;
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    db.prepare(`
      INSERT INTO credit_transactions (id, user_id, label, mode, delta, timestamp)
      VALUES (?, ?, ?, 'topup', ?, ?)
    `).run(txId, req.user.id, label, numericAmount, timeString);

    return res.json({
      message: 'Credits updated',
      credits: numericAmount,
      transaction: {
        id: txId,
        label,
        mode: 'topup',
        delta: numericAmount,
        timestamp: timeString,
      },
    });
  } catch (error) {
    console.error('Topup error:', error);
    return res.status(500).json({ error: 'Failed to adjust credits' });
  }
});

export default router;

