import type { Request, Response, NextFunction } from 'express';
import { verifyToken, type TokenPayload } from '../utils/jwt';
import { dbRepository, type UserDTO } from '../services/dbRepository';
import { sendError } from '../utils/response';

declare global {
  namespace Express {
    interface Request {
      user?: UserDTO;
      tokenPayload?: TokenPayload;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Authentication required', 401);
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload || !payload.userId) {
      return sendError(res, 'Invalid or expired authentication token', 401);
    }

    const user = await dbRepository.users.findById(payload.userId);
    if (!user) {
      return sendError(res, 'User session expired or user not found', 401);
    }

    req.user = user;
    req.tokenPayload = payload;
    next();
  } catch (error: any) {
    return sendError(res, 'Authentication error: ' + error.message, 401);
  }
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = verifyToken(token);
      if (payload && payload.userId) {
        const user = await dbRepository.users.findById(payload.userId);
        if (user) {
          req.user = user;
          req.tokenPayload = payload;
        }
      }
    }
  } catch {}
  next();
}

