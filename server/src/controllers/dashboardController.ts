import type { Request, Response } from 'express';
import { dbRepository } from '../services/dbRepository';
import { sendSuccess, sendError } from '../utils/response';

export const dashboardController = {
  async getStats(req: Request, res: Response) {
    if (!req.user) return sendError(res, 'Authentication required', 401);

    try {
      const counts = await dbRepository.generations.countByUser(req.user.id);
      const collections = await dbRepository.collections.list(req.user.id);
      const recentItems = await dbRepository.generations.listByUser(req.user.id);
      const history = await dbRepository.usageQuota.listByUser(req.user.id);

      const totalSpent = history
        .filter((h: any) => h.delta < 0)
        .reduce((sum: number, h: any) => sum + Math.abs(h.delta), 0);

      const recentCreations = recentItems.slice(0, 6).map((g: any) => ({
        id: g.id,
        title: g.title,
        createdAt: new Date(g.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mode: g.mode,
        mediaUrl: g.mediaUrl,
        saved: g.saved,
        dimensions: g.dimensions,
      }));

      return sendSuccess(res, {
        stats: {
          user: {
            id: req.user.id,
            email: req.user.email,
            name: req.user.name,
            planId: req.user.planId,
            credits: req.user.credits,
            maxCredits: req.user.maxCredits,
          },
          totalCreations: counts.total,
          totalImages: counts.images,
          totalVideos: counts.videos,
          totalSaved: counts.saved,
          totalCollections: collections.length,
          totalCreditsSpent: totalSpent,
          recentCreations,
        },
      });
    } catch (error: any) {
      console.error('[DashboardController.getStats]', error);
      return sendError(res, 'Failed to retrieve dashboard stats: ' + error.message, 500);
    }
  },
};
