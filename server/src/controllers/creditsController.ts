import type { Request, Response } from 'express';
import { dbRepository } from '../services/dbRepository';
import { sendSuccess, sendError } from '../utils/response';

const PLAN_CREDIT_MAP: Record<string, { credits: number; label: string }> = {
  free: { credits: 25, label: 'Switched to Free Plan' },
  pro: { credits: 500, label: 'Upgraded to Pro Plan (₹1,499/mo)' },
  studio: { credits: 2000, label: 'Upgraded to Studio Plan (₹3,999/mo)' },
};

export const creditsController = {
  async getHistory(req: Request, res: Response) {
    if (!req.user) return sendError(res, 'Authentication required', 401);

    try {
      const history = await dbRepository.usageQuota.listByUser(req.user.id);
      return sendSuccess(res, { history });
    } catch (error: any) {
      console.error('[CreditsController.getHistory]', error);
      return sendError(res, 'Failed to fetch history: ' + error.message, 500);
    }
  },

  async selectPlan(req: Request, res: Response) {
    if (!req.user) return sendError(res, 'Authentication required', 401);

    try {
      const { planId } = req.body;
      const plan = PLAN_CREDIT_MAP[planId];
      if (!plan) return sendError(res, 'Invalid plan id', 400);

      await dbRepository.users.update(req.user.id, {
        planId: planId as 'free' | 'pro' | 'studio',
        credits: plan.credits,
        maxCredits: plan.credits,
      });

      const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const transaction = await dbRepository.usageQuota.log({
        userId: req.user.id,
        label: plan.label,
        mode: 'topup',
        delta: plan.credits,
        balanceAfter: plan.credits,
        timestamp: timeString,
      });

      return sendSuccess(
        res,
        {
          planId,
          credits: plan.credits,
          maxCredits: plan.credits,
          transaction: {
            id: transaction.id,
            label: transaction.label,
            mode: transaction.mode,
            delta: transaction.delta,
            timestamp: transaction.timestamp,
          },
        },
        `Plan updated to ${planId}`
      );
    } catch (error: any) {
      console.error('[CreditsController.selectPlan]', error);
      return sendError(res, 'Failed to update plan: ' + error.message, 500);
    }
  },

  async topup(req: Request, res: Response) {
    if (!req.user) return sendError(res, 'Authentication required', 401);

    try {
      const { amount, label = 'Credit top-up' } = req.body;
      const numericAmount = Math.max(0, Math.floor(Number(amount) || 0));

      await dbRepository.users.update(req.user.id, { credits: numericAmount });

      const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const transaction = await dbRepository.usageQuota.log({
        userId: req.user.id,
        label,
        mode: 'topup',
        delta: numericAmount,
        balanceAfter: numericAmount,
        timestamp: timeString,
      });

      return sendSuccess(
        res,
        {
          credits: numericAmount,
          transaction: {
            id: transaction.id,
            label: transaction.label,
            mode: transaction.mode,
            delta: transaction.delta,
            timestamp: transaction.timestamp,
          },
        },
        'Credits updated'
      );
    } catch (error: any) {
      console.error('[CreditsController.topup]', error);
      return sendError(res, 'Failed to update credits: ' + error.message, 500);
    }
  },
};

