import express from 'express';
import crypto from 'node:crypto';
import { db } from '../db.js';
import { hashPassword, verifyPassword, generateToken, requireAuth } from '../auth.js';

const router = express.Router();
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Sign Up
router.post('/signup', (req, res) => {
  try {
    const { email, password, fullName } = req.body;
    const trimmedEmail = (email || '').trim().toLowerCase();
    const trimmedName = (fullName || '').trim() || trimmedEmail.split('@')[0];

    if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
      return res.status(400).json({ error: 'Valid email address is required' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(trimmedEmail);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const { hash, salt } = hashPassword(password);
    const userId = `usr-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO users (id, email, name, password_hash, salt, plan_id, credits, max_credits, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'free', 25, 25, ?, ?)
    `).run(userId, trimmedEmail, trimmedName, hash, salt, now, now);

    // Initial starter credit log
    db.prepare(`
      INSERT INTO credit_transactions (id, user_id, label, mode, delta, timestamp)
      VALUES (?, ?, ?, 'topup', 25, ?)
    `).run(`tx-${Date.now()}`, userId, 'Welcome Free Plan allocation', new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

    // Default starter folders
    for (const folder of ['Brand Kit', 'Campaigns']) {
      db.prepare(`
        INSERT INTO collections (id, user_id, name, created_at)
        VALUES (?, ?, ?, ?)
      `).run(`col-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`, userId, folder, now);
    }

    const token = generateToken({ userId, email: trimmedEmail });
    return res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: userId,
        email: trimmedEmail,
        name: trimmedName,
        planId: 'free',
        credits: 25,
        maxCredits: 25,
      },
    });
  } catch (error) {
    console.error('Sign up error:', error);
    return res.status(500).json({ error: 'Failed to create account' });
  }
});

// Sign In
router.post('/signin', (req, res) => {
  try {
    const { email, password } = req.body;
    const trimmedEmail = (email || '').trim().toLowerCase();

    if (!trimmedEmail || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(trimmedEmail);
    if (!user) {
      return res.status(401).json({ error: 'No account found with this email' });
    }

    const isValid = verifyPassword(password, user.password_hash, user.salt);
    if (!isValid) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    const token = generateToken({ userId: user.id, email: user.email });
    return res.json({
      message: 'Signed in successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        planId: user.plan_id,
        credits: user.credits,
        maxCredits: user.max_credits,
      },
    });
  } catch (error) {
    console.error('Sign in error:', error);
    return res.status(500).json({ error: 'Failed to sign in' });
  }
});

// Current User Profile & Balance
router.get('/me', requireAuth, (req, res) => {
  return res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      planId: req.user.plan_id,
      credits: req.user.credits,
      maxCredits: req.user.max_credits,
      createdAt: req.user.created_at,
    },
  });
});

// Mock OAuth for Google & Apple buttons
router.post('/oauth-mock', (req, res) => {
  try {
    const { provider } = req.body;
    const isGoogle = provider === 'google';
    const email = isGoogle ? 'creator@gmail.com' : 'creator@icloud.com';
    const name = isGoogle ? 'Google Creator' : 'Apple Creator';

    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    const now = new Date().toISOString();

    if (!user) {
      const { hash, salt } = hashPassword('oauth-demo-pwd');
      const userId = `usr-${provider}-${Date.now()}`;
      db.prepare(`
        INSERT INTO users (id, email, name, password_hash, salt, plan_id, credits, max_credits, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'free', 25, 25, ?, ?)
      `).run(userId, email, name, hash, salt, now, now);

      db.prepare(`
        INSERT INTO credit_transactions (id, user_id, label, mode, delta, timestamp)
        VALUES (?, ?, ?, 'topup', 25, ?)
      `).run(`tx-${Date.now()}`, userId, `${isGoogle ? 'Google' : 'Apple'} Sign-in Bonus`, new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

      user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    }

    const token = generateToken({ userId: user.id, email: user.email });
    return res.json({
      message: `Signed in via ${provider}`,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        planId: user.plan_id,
        credits: user.credits,
        maxCredits: user.max_credits,
      },
    });
  } catch (error) {
    console.error('OAuth error:', error);
    return res.status(500).json({ error: 'OAuth authentication failed' });
  }
});

// Forgot Password - Generate & Return verification code
router.post('/forgot-password', (req, res) => {
  try {
    const { email } = req.body;
    const trimmedEmail = (email || '').trim().toLowerCase();
    if (!trimmedEmail) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(trimmedEmail);
    if (!user) {
      // Return 200 with demo code anyway for privacy & seamless dev testing
      return res.json({ message: 'Reset code generated', code: '482910' });
    }

    const code = '482910'; // Deterministic demo code supported by frontend UI
    db.prepare('UPDATE users SET reset_code = ? WHERE id = ?').run(code, user.id);

    return res.json({
      message: 'Reset code sent to email',
      code,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ error: 'Failed to process request' });
  }
});

// Reset Password with Code
router.post('/reset-password', (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    const trimmedEmail = (email || '').trim().toLowerCase();

    if (!trimmedEmail || !code || !newPassword) {
      return res.status(400).json({ error: 'Email, code, and new password are required' });
    }
    if (code.trim() !== '482910') {
      return res.status(400).json({ error: 'Invalid verification code' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(trimmedEmail);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { hash, salt } = hashPassword(newPassword);
    db.prepare('UPDATE users SET password_hash = ?, salt = ?, reset_code = NULL, updated_at = ? WHERE id = ?')
      .run(hash, salt, new Date().toISOString(), user.id);

    return res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Update Profile
router.patch('/profile', requireAuth, (req, res) => {
  try {
    const { name, email } = req.body;
    const updates = [];
    const params = [];

    if (name && typeof name === 'string' && name.trim()) {
      updates.push('name = ?');
      params.push(name.trim());
    }

    if (email && typeof email === 'string' && EMAIL_REGEX.test(email.trim())) {
      const trimmedEmail = email.trim().toLowerCase();
      const existing = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(trimmedEmail, req.user.id);
      if (existing) {
        return res.status(409).json({ error: 'Email already in use by another account' });
      }
      updates.push('email = ?');
      params.push(trimmedEmail);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields provided for update' });
    }

    updates.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(req.user.id);

    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    const updatedUser = db.prepare('SELECT id, email, name, plan_id, credits, max_credits FROM users WHERE id = ?').get(req.user.id);
    return res.json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;

