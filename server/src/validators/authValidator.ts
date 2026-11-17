import type { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegister(req: Request, res: Response, next: NextFunction) {
  const { email, password, name, fullName } = req.body || {};
  const targetName = name || fullName;

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return sendError(res, 'Valid email address is required', 400);
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    return sendError(res, 'Password must be at least 6 characters', 400);
  }

  if (targetName && typeof targetName === 'string' && targetName.trim().length < 2) {
    return sendError(res, 'Name must be at least 2 characters', 400);
  }

  next();
}

export function validateLogin(req: Request, res: Response, next: NextFunction) {
  const { email, password } = req.body || {};

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return sendError(res, 'Valid email address is required', 400);
  }

  if (!password || typeof password !== 'string') {
    return sendError(res, 'Password is required', 400);
  }

  next();
}

export function validateResetPassword(req: Request, res: Response, next: NextFunction) {
  const { email, code, newPassword } = req.body || {};

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return sendError(res, 'Valid email address is required', 400);
  }

  if (!code || typeof code !== 'string' || code.trim().length < 4) {
    return sendError(res, 'Valid verification code is required', 400);
  }

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    return sendError(res, 'New password must be at least 6 characters', 400);
  }

  next();
}

