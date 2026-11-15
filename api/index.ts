import { app } from '../server/src/app';
import { connectDatabase } from '../server/src/config/db';
import { dbRepository } from '../server/src/services/dbRepository';
import { hashPassword } from '../server/src/utils/password';

let isDbConnected = false;

async function ensureDb() {
  if (!isDbConnected) {
    try {
      await connectDatabase();
      const existing = await dbRepository.users.findByEmail('creator@studio.in');
      if (!existing) {
        const hashedPassword = await hashPassword('password123');
        await dbRepository.users.create({
          email: 'creator@studio.in',
          name: 'Forma Studio Lead',
          password: hashedPassword,
          planId: 'free',
          credits: 25,
          maxCredits: 25,
        });

        await dbRepository.collections.create('usr-default', 'Brand Kit');
        await dbRepository.collections.create('usr-default', 'Campaigns');
        await dbRepository.collections.create('usr-default', 'Motion Studies');
      }
      isDbConnected = true;
    } catch (err) {
      console.warn('[Vercel DB Warning]', err);
    }
  }
}

export default async function handler(req: any, res: any) {
  try {
    await ensureDb();
  } catch (err: any) {
    console.error('[Vercel Handler DB Init Error]', err);
  }
  try {
    return app(req, res);
  } catch (err: any) {
    console.error('[Vercel App Error]', err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: 'Internal Server Error: ' + err.message });
    }
  }
}
