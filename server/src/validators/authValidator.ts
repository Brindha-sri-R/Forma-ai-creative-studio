import type { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegister(req: Request, res: Response, next: NextFunction) {
  const { email, password, name, fullName } = req.body || {};
  const targetName = (name || fullName || '').toString().trim();
  const trimmedEmail = (email || '').toString().trim();

  if (!trimmedEmail) {
    return sendError(res, 'Please enter your email address', 400);
  }

  if (!EMAIL_REGEX.test(trimmedEmail)) {
    return sendError(res, 'Please enter a valid email address (e.g. name@studio.in)', 400);
  }

  if (!password || typeof password !== 'string') {
    return sendError(res, 'Password is required', 400);
  }

  if (password.length < 6) {
    return sendError(res, 'Password must be at least 6 characters', 400);
  }

  if (targetName && targetName.length < 2) {
    return sendError(res, 'Please enter at least 2 characters for your name', 400);
  }

  next();
}

export function validateLogin(req: Request, res: Response, next: NextFunction) {
  const { email, password } = req.body || {};
  const trimmedEmail = (email || '').toString().trim();

  if (!trimmedEmail) {
    return sendError(res, 'Please enter your email address', 400);
  }

  if (!EMAIL_REGEX.test(trimmedEmail)) {
    return sendError(res, 'Please enter a valid email address', 400);
  }

  if (!password || typeof password !== 'string' || !password.trim()) {
    return sendError(res, 'Password is required', 400);
  }

  next();
}

export function validateResetPassword(req: Request, res: Response, next: NextFunction) {
  const { email, code, newPassword } = req.body || {};
  const trimmedEmail = (email || '').toString().trim();
  const trimmedCode = (code || '').toString().trim();

  if (!trimmedEmail) {
    return sendError(res, 'Please enter your email address', 400);
  }

  if (!EMAIL_REGEX.test(trimmedEmail)) {
    return sendError(res, 'Please enter a valid email address', 400);
  }

  if (!trimmedCode || trimmedCode.length < 4) {
    return sendError(res, 'Please enter the verification code', 400);
  }

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    return sendError(res, 'New password must be at least 6 characters', 400);
  }

  next();
}

