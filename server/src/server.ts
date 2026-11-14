import dns from 'node:dns';
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}
import { app } from './app';
import { config } from './config/env';
import { connectDatabase } from './config/db';
import { dbRepository } from './services/dbRepository';
import { hashPassword } from './utils/password';

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

      console.log('[Seed] Default creator account initialized (creator@studio.in / password123)');
    }
  } catch (err) {
    console.warn('[Seed] Warning during data seeding:', err);
  }
}

async function startServer() {
  await connectDatabase();
  await seedInitialData();

  const server = app.listen(config.port, '127.0.0.1', () => {
    console.log(`\n======================================================`);
    console.log(`  ✨ Forma AI Creative Studio - Backend API Server`);
    console.log(`  🌐 Running on: http://localhost:${config.port}`);
    console.log(`  📁 Media Uploads: http://localhost:${config.port}/uploads`);
    console.log(`  🩺 Health Check: http://localhost:${config.port}/api/health`);
    console.log(`======================================================\n`);
  });

  const shutdown = () => {
    console.log('\n[Server] Shutting down gracefully...');
    server.close(() => {
      console.log('[Server] Closed remaining connections.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startServer().catch((error) => {
  console.error('[Server Startup Failure]', error);
  process.exit(1);
});

