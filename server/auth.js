import crypto from 'node:crypto';
import { db } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'forma-creative-studio-super-secret-key-2026';

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

export function verifyPassword(password, hash, salt) {
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(derived, 'hex'), Buffer.from(hash, 'hex'));
}

function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

export function generateToken(payload, expiresInSeconds = 7 * 24 * 3600) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const fullPayload = { ...payload, exp };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function verifyToken(token) {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    if (signature !== expectedSignature) return null;

    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }
    return payload;
  } catch (err) {
    return null;
  }
}

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);
  if (!payload || !payload.userId) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const user = db.prepare('SELECT id, email, name, plan_id, credits, max_credits, created_at FROM users WHERE id = ?').get(payload.userId);
  if (!user) {
    return res.status(401).json({ error: 'User no longer exists' });
  }

  req.user = user;
  next();
}

// Seed default demo user if not present
export function ensureDemoUser() {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get('creator@studio.in');
  if (!existing) {
    const { hash, salt } = hashPassword('password123');
    const now = new Date().toISOString();
    const userId = 'usr-demo-001';
    db.prepare(`
      INSERT INTO users (id, email, name, password_hash, salt, plan_id, credits, max_credits, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userId, 'creator@studio.in', 'Studio Creator', hash, salt, 'free', 25, 25, now, now);

    // Initial starter credit transaction
    db.prepare(`
      INSERT INTO credit_transactions (id, user_id, label, mode, delta, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('tx-init-1', userId, 'Welcome Free Plan allocation', 'topup', 25, new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

    // Starter collections
    for (const name of ['Brand Kit', 'Campaigns', 'Motion Studies', 'Editorial']) {
      db.prepare(`
        INSERT INTO collections (id, user_id, name, created_at)
        VALUES (?, ?, ?, ?)
      `).run(`col-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`, userId, name, now);
    }

    console.log('[Auth] Default demo user seeded (creator@studio.in / password123)');
  }
}

