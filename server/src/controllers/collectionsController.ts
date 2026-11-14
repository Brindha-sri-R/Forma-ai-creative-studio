import type { Request, Response } from 'express';
import { dbRepository } from '../services/dbRepository';
import { sendSuccess, sendError } from '../utils/response';

export const collectionsController = {
  async list(req: Request, res: Response) {
    if (!req.user) return sendError(res, 'Authentication required', 401);

    try {
      const collections = await dbRepository.collections.list(req.user.id);
      return sendSuccess(res, { collections });
    } catch (error: any) {
      console.error('[CollectionsController.list]', error);
      return sendError(res, 'Failed to fetch collections: ' + error.message, 500);
    }
  },

  async create(req: Request, res: Response) {
    if (!req.user) return sendError(res, 'Authentication required', 401);

    try {
      const { name } = req.body;
      if (!name || typeof name !== 'string' || !name.trim()) {
        return sendError(res, 'Collection name is required', 400);
      }

      const createdName = await dbRepository.collections.create(req.user.id, name.trim());
      return sendSuccess(res, { name: createdName }, 'Collection created', 201);
    } catch (error: any) {
      console.error('[CollectionsController.create]', error);
      return sendError(res, 'Failed to create collection: ' + error.message, 500);
    }
  },

  async delete(req: Request, res: Response) {
    if (!req.user) return sendError(res, 'Authentication required', 401);

    try {
      const name = String(req.params.name || '');
      await dbRepository.collections.delete(req.user.id, name);
      return sendSuccess(res, { name }, 'Collection deleted');
    } catch (error: any) {
      console.error('[CollectionsController.delete]', error);
      return sendError(res, 'Failed to delete collection: ' + error.message, 500);
    }
  },
};
