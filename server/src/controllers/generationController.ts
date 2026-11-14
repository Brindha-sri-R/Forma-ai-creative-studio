import type { Request, Response } from 'express';
import { dbRepository } from '../services/dbRepository';
import { imageGenerationService, videoGenerationService } from '../services/ai';
import { enhancePromptWithAI } from '../services/ai/promptEnhanceService';
import { QuotaExceededError, AuthenticationError, ModelUnavailableError, GenerationFailedError } from '../services/ai/errors';
import { sendSuccess, sendError } from '../utils/response';

function deriveCreationTitle(prompt: string, mode: 'image' | 'video'): string {
  const cleaned = (prompt || '').trim().replace(/\s+/g, ' ');
  if (!cleaned) return mode === 'image' ? 'Untitled Still' : 'Untitled Sequence';
  const words = cleaned.split(' ').slice(0, 5).join(' ');
  return words.length < cleaned.length ? `${words}…` : words;
}

export const generationController = {
  async generate(req: Request, res: Response) {
    if (!req.user) return sendError(res, 'Authentication required', 401);

    try {
      const user = req.user;
      const {
        mode = 'image',
        prompt = '',
        negativePrompt = '',
        model = 'gemini-3.1-flash-image',
        aspectRatio = '1:1',
        resolution = '1K',
        style = 'Editorial',
        variations = 1,
        duration = '4s',
        motion = 'Static',
        fps = '24 fps',
        referenceAssetUrl = null,
        referenceAssetName = null,
        referenceMediaKind = null,
      } = req.body;

      if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        return sendError(res, 'A descriptive prompt is required for generation', 400);
      }

      const isVideo = mode === 'video';
      const baseCost = isVideo ? 4 : 1;
      const variationMultiplier = isVideo ? 1 : Math.max(1, Number(variations) || 1);
      const creditsCost = baseCost * variationMultiplier;

      // 1. Credit Pre-check (Fail early if insufficient credits, but DO NOT deduct yet)
      if (user.credits < creditsCost) {
        return sendError(res, 'Insufficient credits', 402, {
          required: creditsCost,
          balance: user.credits,
        });
      }

      const videoType: 'text-to-video' | 'image-to-video' = referenceAssetUrl ? 'image-to-video' : 'text-to-video';
      const generationType = isVideo ? videoType : 'text-to-image';

      // 2. Dispatch to Real AI Generation Service
      let aiResult;
      try {
        aiResult = isVideo
          ? await videoGenerationService.generateVideo({
              prompt,
              negativePrompt,
              generationType: videoType,
              aspectRatio,
              duration,
              motion,
              fps,
              model,
              referenceAssetUrl,
            })
          : await imageGenerationService.generateImage({
              prompt,
              negativePrompt,
              style,
              aspectRatio,
              resolution,
              variations: variationMultiplier,
              model,
              referenceAssetUrl,
            });
      } catch (genErr: any) {
        // Zero-Deduction Guarantee: Failed generations do NOT consume user credits
        console.error('[GenerationController] AI Service error during generation:', genErr.message);

        if (genErr instanceof QuotaExceededError) {
          return sendError(res, genErr.message, 429, {
            model: genErr.model,
            provider: genErr.provider,
            retryAfterSeconds: genErr.retryAfterSeconds,
            errorType: 'QUOTA_EXHAUSTED',
          });
        }

        if (genErr instanceof AuthenticationError) {
          return sendError(res, genErr.message, 401, {
            provider: genErr.provider,
            errorType: 'INVALID_CREDENTIALS',
          });
        }

        if (genErr instanceof ModelUnavailableError) {
          return sendError(res, genErr.message, 404, {
            model: genErr.model,
            errorType: 'MODEL_UNAVAILABLE',
          });
        }

        if (genErr instanceof GenerationFailedError) {
          return sendError(res, genErr.message, 502, {
            provider: genErr.provider,
            errorType: 'PROVIDER_ERROR',
          });
        }

        return sendError(res, `Generation failed: ${genErr.message}`, 500);
      }

      // 3. Generation Succeeded: Now safely deduct credits and log transaction
      const newBalance = user.credits - creditsCost;
      await dbRepository.users.update(user.id, { credits: newBalance });

      const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      await dbRepository.usageQuota.log({
        userId: user.id,
        label: `${isVideo ? 'Video render' : 'Image generation'} (${creditsCost} cr)`,
        mode,
        delta: -creditsCost,
        balanceAfter: newBalance,
        timestamp: timeString,
      });

      const title = deriveCreationTitle(prompt, mode);

      // 4. Persist Generation Record in Database
      const generation = await dbRepository.generations.create({
        userId: user.id,
        title,
        prompt,
        negativePrompt,
        mode,
        generationType,
        aspectRatio,
        resolution,
        style,
        model,
        variations: variationMultiplier,
        duration,
        motion,
        fps,
        seed: aiResult.seed,
        dimensions: aiResult.dimensions,
        creditsUsed: creditsCost,
        provider: aiResult.provider,
        mediaUrl: aiResult.mediaUrl,
        mediaKind: mode,
        status: 'completed',
        saved: false,
        collectionName: null,
        referenceAssetUrl,
        referenceAssetName,
        referenceMediaKind,
      });

      // 5. Return Complete Creation Response
      return sendSuccess(
        res,
        {
          id: generation.id,
          title: generation.title,
          createdAt: timeString,
          request: {
            mode: generation.mode,
            prompt: generation.prompt,
            negativePrompt: generation.negativePrompt,
            model: generation.model,
            aspectRatio: generation.aspectRatio,
            resolution: generation.resolution,
            style: generation.style,
            variations: generation.variations,
            duration: generation.duration,
            motion: generation.motion,
            fps: generation.fps,
            referenceAssetUrl: generation.referenceAssetUrl,
            referenceAssetName: generation.referenceAssetName,
            referenceMediaKind: generation.referenceMediaKind,
          },
          seed: generation.seed,
          dimensions: generation.dimensions,
          creditsUsed: generation.creditsUsed,
          provider: generation.provider,
          mediaUrl: generation.mediaUrl,
          mediaKind: generation.mediaKind,
          saved: generation.saved,
          isDemoMode: aiResult.isDemoMode,
          newBalance,
        },
        'Generation completed successfully',
        201
      );
    } catch (error: any) {
      console.error('[GenerationController.generate] Fatal error:', error);
      return sendError(res, 'Internal server error during generation: ' + error.message, 500);
    }
  },

  async getById(req: Request, res: Response) {
    if (!req.user) return sendError(res, 'Authentication required', 401);

    try {
      const id = String(req.params.id);
      const item = await dbRepository.generations.findById(id, req.user.id);
      if (!item) {
        return sendError(res, 'Generation not found or unauthorized', 404);
      }
      return sendSuccess(res, { generation: item });
    } catch (error: any) {
      console.error('[GenerationController.getById]', error);
      return sendError(res, 'Failed to fetch generation: ' + error.message, 500);
    }
  },

  async list(req: Request, res: Response) {
    if (!req.user) return sendError(res, 'Authentication required', 401);

    try {
      const { filter, collection, search } = req.query;
      const items = await dbRepository.generations.listByUser(
        req.user.id,
        filter as string | undefined,
        collection as string | undefined,
        search as string | undefined
      );

      const formatted = items.map((g: any) => ({
        id: g.id,
        title: g.title,
        createdAt: new Date(g.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        request: {
          mode: g.mode,
          prompt: g.prompt,
          negativePrompt: g.negativePrompt || '',
          model: g.model,
          aspectRatio: g.aspectRatio,
          resolution: g.resolution,
          style: g.style,
          variations: g.variations,
          duration: g.duration,
          motion: g.motion,
          fps: g.fps,
          referenceAssetUrl: g.referenceAssetUrl,
          referenceAssetName: g.referenceAssetName,
          referenceMediaKind: g.referenceMediaKind,
        },
        seed: g.seed,
        dimensions: g.dimensions,
        creditsUsed: g.creditsUsed,
        provider: g.provider,
        mediaUrl: g.mediaUrl,
        mediaKind: g.mediaKind,
        saved: g.saved,
        collection: g.collectionName || undefined,
      }));

      return sendSuccess(res, { creations: formatted });
    } catch (error: any) {
      console.error('[GenerationController.list]', error);
      return sendError(res, 'Failed to list creations: ' + error.message, 500);
    }
  },

  async update(req: Request, res: Response) {
    if (!req.user) return sendError(res, 'Authentication required', 401);
    try {
      const id = String(req.params.id);
      const { saved, collectionName, title } = req.body;
      const updates: Record<string, any> = {};
      if (saved !== undefined) updates.saved = Boolean(saved);
      if (collectionName !== undefined) updates.collectionName = collectionName;
      if (title !== undefined) updates.title = String(title);

      const item = await dbRepository.generations.update(id, req.user.id, updates);
      if (!item) return sendError(res, 'Generation not found or unauthorized', 404);
      return sendSuccess(res, { id: item.id, saved: item.saved, collectionName: item.collectionName, title: item.title });
    } catch (error: any) {
      console.error('[GenerationController.update]', error);
      return sendError(res, 'Failed to update generation: ' + error.message, 500);
    }
  },

  async delete(req: Request, res: Response) {
    if (!req.user) return sendError(res, 'Authentication required', 401);
    try {
      const id = String(req.params.id);
      const deleted = await dbRepository.generations.delete(id, req.user.id);
      if (!deleted) return sendError(res, 'Generation not found or unauthorized', 404);
      return sendSuccess(res, { deleted: true });
    } catch (error: any) {
      console.error('[GenerationController.delete]', error);
      return sendError(res, 'Failed to delete generation: ' + error.message, 500);
    }
  },

  async enhancePrompt(req: Request, res: Response) {
    try {
      const { prompt = '', style } = req.body;
      if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        return sendError(res, 'Prompt is required for enhancement', 400);
      }

      const result = await enhancePromptWithAI(prompt.trim(), style);
      return sendSuccess(res, {
        enhancedPrompt: result.enhancedPrompt,
        originalPrompt: prompt.trim(),
        provider: result.provider,
      });
    } catch (error: any) {
      console.error('[GenerationController.enhancePrompt]', error);
      return sendError(res, 'Prompt enhancement failed: ' + error.message, 500);
    }
  },
};
