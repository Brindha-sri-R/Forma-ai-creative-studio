import type { Request, Response } from 'express';
import { storageService } from '../services/storage';
import { dbRepository } from '../services/dbRepository';
import { sendSuccess, sendError } from '../utils/response';

export const uploadController = {
  async upload(req: Request, res: Response) {
    if (!req.user) return sendError(res, 'Authentication required', 401);

    try {
      if (!req.file) {
        return sendError(res, 'No file uploaded', 400);
      }

      const result = await storageService.saveUpload(req.file, 'references');

      return sendSuccess(
        res,
        {
          url: result.url,
          filename: result.filename,
          mediaKind: result.mediaKind,
          size: result.size,
        },
        'File uploaded successfully',
        201
      );
    } catch (error: any) {
      console.error('[UploadController.upload]', error);
      return sendError(res, 'Upload failed: ' + error.message, 500);
    }
  },
};

