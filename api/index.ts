import { app } from '../server/src/app';
import { connectDatabase } from '../server/src/config/db';

let isDbConnected = false;

export default async function handler(req: any, res: any) {
  if (!isDbConnected) {
    try {
      await connectDatabase();
      isDbConnected = true;
    } catch (err) {
      console.warn('[Vercel Serverless] DB connection notice:', err);
    }
  }
  return app(req, res);
}
