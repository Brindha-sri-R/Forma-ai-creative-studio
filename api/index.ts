import { app } from '../server/src/app';
import { connectDatabase } from '../server/src/config/db';
import { dbRepository } from '../server/src/services/dbRepository';
import { hashPassword } from '../server/src/utils/password';

let isDbConnected = false;

async function seedInitialData() {
  try {
    const existing = await dbRepository.users.findByEmail('creator@studio.in');
    if (!existing) {
      const hashedPassword = await hashPassword('password123');
      const user = await dbRepository.users.create({
        email: 'creator@studio.in',
        name: 'Forma Studio Lead',
        password: hashedPassword,
        planId: 'free',
        credits: 25,
        maxCredits: 25,
      });

      await dbRepository.collections.create(user.id, 'Brand Kit');
      await dbRepository.collections.create(user.id, 'Campaigns');
      await dbRepository.collections.create(user.id, 'Motion Studies');

      await dbRepository.usageQuota.log({
        userId: user.id,
        label: 'Welcome Free Plan allocation',
        mode: 'topup',
        delta: 25,
        balanceAfter: 25,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    }
  } catch (err) {
    console.warn('[Vercel Seed] Warning during data seeding:', err);
  }
}

export default async function handler(req: any, res: any) {
  if (!isDbConnected) {
    try {
      await connectDatabase();
      await seedInitialData();
      isDbConnected = true;
    } catch (err) {
      console.warn('[Vercel Serverless] DB connection notice:', err);
    }
  }
  return new Promise((resolve) => {
    app(req, res);
    res.on('finish', resolve);
    res.on('close', resolve);
  });
}
