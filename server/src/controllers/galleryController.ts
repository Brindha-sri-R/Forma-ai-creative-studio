import type { Request, Response } from 'express';
import { dbRepository } from '../services/dbRepository';
import { sendSuccess, sendError } from '../utils/response';

export const galleryController = {
  async update(req: Request, res: Response) {
    if (!req.user) return sendError(res, 'Authentication required', 401);

    try {
      const id = String(req.params.id);
      const { title, saved, collection } = req.body;

      const item = await dbRepository.generations.findById(id, req.user.id);
      if (!item) {
        return sendError(res, 'Creation not found or access denied', 404);
      }

      const updates: any = {};
      if (typeof title === 'string' && title.trim()) updates.title = title.trim();
      if (typeof saved === 'boolean') updates.saved = saved;
      if (typeof collection !== 'undefined') updates.collectionName = collection ? collection.trim() : null;

      const updated = await dbRepository.generations.update(id, req.user.id, updates);
      if (!updated) return sendError(res, 'Failed to update creation', 500);

      const formatted = {
        id: updated.id,
        title: updated.title,
        createdAt: new Date(updated.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        request: {
          mode: updated.mode,
          prompt: updated.prompt,
          negativePrompt: updated.negativePrompt,
          model: updated.model,
          aspectRatio: updated.aspectRatio,
          resolution: updated.resolution,
          style: updated.style,
          variations: updated.variations,
          duration: updated.duration,
          motion: updated.motion,
          fps: updated.fps,
          referenceAssetUrl: updated.referenceAssetUrl,
          referenceAssetName: updated.referenceAssetName,
          referenceMediaKind: updated.referenceMediaKind,
        },
        seed: updated.seed,
        dimensions: updated.dimensions,
        creditsUsed: updated.creditsUsed,
        provider: updated.provider,
        mediaUrl: updated.mediaUrl,
        mediaKind: updated.mediaKind,
        saved: updated.saved,
        collection: updated.collectionName || undefined,
      };

      return sendSuccess(res, { creation: formatted }, 'Creation updated');
    } catch (error: any) {
      console.error('[GalleryController.update]', error);
      return sendError(res, 'Update failed: ' + error.message, 500);
    }
  },

  async delete(req: Request, res: Response) {
    if (!req.user) return sendError(res, 'Authentication required', 401);

    try {
      const id = String(req.params.id);
      const success = await dbRepository.generations.delete(id, req.user.id);
      if (!success) {
        return sendError(res, 'Creation not found or access denied', 404);
      }

      return sendSuccess(res, { id }, 'Creation deleted');
    } catch (error: any) {
      console.error('[GalleryController.delete]', error);
      return sendError(res, 'Delete failed: ' + error.message, 500);
    }
  },

  async duplicate(req: Request, res: Response) {
    if (!req.user) return sendError(res, 'Authentication required', 401);

    try {
      const id = String(req.params.id);
      const original = await dbRepository.generations.findById(id, req.user.id);
      if (!original) {
        return sendError(res, 'Creation not found or access denied', 404);
      }

      const duplicate = await dbRepository.generations.create({
        userId: req.user.id,
        title: `${original.title} (Copy)`,
        prompt: original.prompt,
        negativePrompt: original.negativePrompt,
        mode: original.mode,
        generationType: original.generationType,
        aspectRatio: original.aspectRatio,
        resolution: original.resolution,
        style: original.style,
        model: original.model,
        variations: original.variations,
        duration: original.duration,
        motion: original.motion,
        fps: original.fps,
        seed: original.seed + 1,
        dimensions: original.dimensions,
        creditsUsed: 0,
        provider: original.provider,
        mediaUrl: original.mediaUrl,
        mediaKind: original.mediaKind,
        status: 'completed',
        saved: original.saved,
        collectionName: original.collectionName,
        referenceAssetUrl: original.referenceAssetUrl,
        referenceAssetName: original.referenceAssetName,
        referenceMediaKind: original.referenceMediaKind,
      });

      const formatted = {
        id: duplicate.id,
        title: duplicate.title,
        createdAt: new Date(duplicate.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        request: {
          mode: duplicate.mode,
          prompt: duplicate.prompt,
          negativePrompt: duplicate.negativePrompt,
          model: duplicate.model,
          aspectRatio: duplicate.aspectRatio,
          resolution: duplicate.resolution,
          style: duplicate.style,
          variations: duplicate.variations,
          duration: duplicate.duration,
          motion: duplicate.motion,
          fps: duplicate.fps,
          referenceAssetUrl: duplicate.referenceAssetUrl,
          referenceAssetName: duplicate.referenceAssetName,
          referenceMediaKind: duplicate.referenceMediaKind,
        },
        seed: duplicate.seed,
        dimensions: duplicate.dimensions,
        creditsUsed: 0,
        provider: duplicate.provider,
        mediaUrl: duplicate.mediaUrl,
        mediaKind: duplicate.mediaKind,
        saved: duplicate.saved,
        collection: duplicate.collectionName || undefined,
      };

      return sendSuccess(res, { creation: formatted }, 'Creation duplicated', 201);
    } catch (error: any) {
      console.error('[GalleryController.duplicate]', error);
      return sendError(res, 'Duplication failed: ' + error.message, 500);
    }
  },
};
