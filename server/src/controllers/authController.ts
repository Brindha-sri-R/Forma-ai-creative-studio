import type { Request, Response } from 'express';
import { dbRepository } from '../services/dbRepository';
import { hashPassword, comparePassword } from '../utils/password';
import { signToken } from '../utils/jwt';
import { sendSuccess, sendError } from '../utils/response';

export const authController = {
  async register(req: Request, res: Response) {
    try {
      const { email, password, name, fullName } = req.body || {};
      const targetName = (name || fullName || '').trim() || email.split('@')[0];

      const existing = await dbRepository.users.findByEmail(email);
      if (existing) {
        return sendError(res, 'An account with this email already exists', 409);
      }

      const hashedPassword = await hashPassword(password);
      const user = await dbRepository.users.create({
        email: email.trim().toLowerCase(),
        name: targetName,
        password: hashedPassword,
        planId: 'free',
        credits: 25,
        maxCredits: 25,
      });

      // Default starter collections
      await dbRepository.collections.create(user.id, 'Brand Kit');
      await dbRepository.collections.create(user.id, 'Campaigns');

      // Starter credit allocation
      await dbRepository.usageQuota.log({
        userId: user.id,
        label: 'Welcome Free Plan allocation',
        mode: 'topup',
        delta: 25,
        balanceAfter: 25,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });

      const token = signToken({ userId: user.id, email: user.email });

      return sendSuccess(
        res,
        {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            planId: user.planId,
            credits: user.credits,
            maxCredits: user.maxCredits,
          },
        },
        'Account created successfully',
        201
      );
    } catch (error: any) {
      console.error('[AuthController.register]', error);
      return sendError(res, 'Registration failed: ' + error.message, 500);
    }
  },

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body || {};

      const user = await dbRepository.users.findByEmail(email);
      if (!user || !user.password) {
        return sendError(res, 'No account found with this email', 401);
      }

      const isMatch = await comparePassword(password, user.password);
      if (!isMatch) {
        return sendError(res, 'Incorrect password', 401);
      }

      const token = signToken({ userId: user.id, email: user.email });

      return sendSuccess(
        res,
        {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            planId: user.planId,
            credits: user.credits,
            maxCredits: user.maxCredits,
          },
        },
        'Signed in successfully'
      );
    } catch (error: any) {
      console.error('[AuthController.login]', error);
      return sendError(res, 'Sign in failed: ' + error.message, 500);
    }
  },

  async getMe(req: Request, res: Response) {
    if (!req.user) {
      return sendError(res, 'Not authenticated', 401);
    }

    return sendSuccess(res, {
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        planId: req.user.planId,
        credits: req.user.credits,
        maxCredits: req.user.maxCredits,
        avatarUrl: req.user.avatarUrl,
        createdAt: req.user.createdAt,
      },
    });
  },

  async logout(_req: Request, res: Response) {
    return sendSuccess(res, {}, 'Logged out successfully');
  },

  async updateProfile(req: Request, res: Response) {
    if (!req.user) return sendError(res, 'Not authenticated', 401);

    try {
      const { name, email, avatarUrl } = req.body;
      const updates: any = {};

      if (name && typeof name === 'string' && name.trim()) {
        updates.name = name.trim();
      }

      if (email && typeof email === 'string' && email.trim()) {
        const cleanEmail = email.trim().toLowerCase();
        const existing = await dbRepository.users.findByEmail(cleanEmail);
        if (existing && existing.id !== req.user.id) {
          return sendError(res, 'Email already in use by another account', 409);
        }
        updates.email = cleanEmail;
      }

      if (avatarUrl && typeof avatarUrl === 'string') {
        updates.avatarUrl = avatarUrl;
      }

      const updated = await dbRepository.users.update(req.user.id, updates);
      return sendSuccess(res, { user: updated }, 'Profile updated successfully');
    } catch (error: any) {
      console.error('[AuthController.updateProfile]', error);
      return sendError(res, 'Failed to update profile: ' + error.message, 500);
    }
  },

  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;
      if (!email) return sendError(res, 'Email is required', 400);

      const code = '482910'; // Demo deterministic reset code matching frontend UI
      const user = await dbRepository.users.findByEmail(email);
      if (user) {
        await dbRepository.users.update(user.id, { resetCode: code });
      }

      return sendSuccess(res, { code }, 'Verification reset code generated');
    } catch (error: any) {
      console.error('[AuthController.forgotPassword]', error);
      return sendError(res, 'Failed to process forgot password: ' + error.message, 500);
    }
  },

  async resetPassword(req: Request, res: Response) {
    try {
      const { email, code, newPassword } = req.body;
      const user = await dbRepository.users.findByEmail(email);
      if (!user) {
        return sendError(res, 'Account not found', 404);
      }

      if (code.trim() !== '482910' && user.resetCode !== code.trim()) {
        return sendError(res, 'Invalid verification code', 400);
      }

      const hashedPassword = await hashPassword(newPassword);
      await dbRepository.users.update(user.id, {
        password: hashedPassword,
        resetCode: null,
      });

      return sendSuccess(res, {}, 'Password updated successfully');
    } catch (error: any) {
      console.error('[AuthController.resetPassword]', error);
      return sendError(res, 'Password reset failed: ' + error.message, 500);
    }
  },

  async oauthMock(req: Request, res: Response) {
    try {
      const { provider, email: customEmail, name: customName } = req.body || {};
      const isGoogle = provider === 'google';
      const cleanEmail = (customEmail && typeof customEmail === 'string' && customEmail.trim())
        ? customEmail.trim().toLowerCase()
        : (isGoogle ? 'creator@gmail.com' : 'creator@icloud.com');
      const cleanName = (customName && typeof customName === 'string' && customName.trim())
        ? customName.trim()
        : (cleanEmail.split('@')[0] || (isGoogle ? 'Google Creator' : 'Apple Creator'));

      let user = await dbRepository.users.findByEmail(cleanEmail);
      if (!user) {
        const hashedPassword = await hashPassword('oauth-demo-password');
        user = await dbRepository.users.create({
          email: cleanEmail,
          name: cleanName,
          password: hashedPassword,
          planId: 'free',
          credits: 25,
          maxCredits: 25,
        });

        await dbRepository.collections.create(user.id, 'Brand Kit');
        await dbRepository.collections.create(user.id, 'Campaigns');
        await dbRepository.usageQuota.log({
          userId: user.id,
          label: `${isGoogle ? 'Google' : 'Apple'} Sign-in Bonus`,
          mode: 'topup',
          delta: 25,
          balanceAfter: 25,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
      }

      const token = signToken({ userId: user.id, email: user.email });

      return sendSuccess(
        res,
        {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            planId: user.planId,
            credits: user.credits,
            maxCredits: user.maxCredits,
          },
        },
        `Authenticated via ${provider}`
      );
    } catch (error: any) {
      console.error('[AuthController.oauthMock]', error);
      return sendError(res, 'OAuth failed: ' + error.message, 500);
    }
  },
};

