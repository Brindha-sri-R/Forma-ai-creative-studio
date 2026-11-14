import type { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

const VALID_RATIOS = new Set(['1:1', '4:5', '16:9', '9:16']);
const VALID_RESOLUTIONS = new Set(['1K', '2K', '4K']);

export function validateGenerationRequest(req: Request, res: Response, next: NextFunction) {
  const { prompt, mode, aspectRatio, resolution, variations } = req.body;

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return sendError(res, 'Prompt is required', 400);
  }

  if (prompt.trim().length > 2000) {
    return sendError(res, 'Prompt cannot exceed 2000 characters', 400);
  }

  if (mode && mode !== 'image' && mode !== 'video') {
    return sendError(res, 'Mode must be either "image" or "video"', 400);
  }

  if (aspectRatio && !VALID_RATIOS.has(aspectRatio)) {
    return sendError(res, `Invalid aspect ratio: ${aspectRatio}`, 400);
  }

  if (resolution && !VALID_RESOLUTIONS.has(resolution)) {
    return sendError(res, `Invalid resolution: ${resolution}`, 400);
  }

  if (variations && ![1, 2, 4].includes(Number(variations))) {
    return sendError(res, 'Variations must be 1, 2, or 4', 400);
  }

  next();
}

