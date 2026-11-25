import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const FALLBACK_MONGODB_URI = 'mongodb+srv://brindhasri2217_db_user:qa4aXiEECV6t7V7b@cluster0.k3zpp9r.mongodb.net/forma?retryWrites=true&w=majority';

export const config = {
  port: parseInt(process.env.PORT || '5050', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || FALLBACK_MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET || 'forma-enterprise-secret-key-2026-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  googleClientId: process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '107987269248-0e2g2qvqafpm8ojipicm1aretoumsodt.apps.googleusercontent.com',
  storageProvider: (process.env.STORAGE_PROVIDER || (process.env.NODE_ENV === 'production' ? 'gridfs' : 'local')) as 'gridfs' | 'local' | 'cloudinary' | 's3',
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
  s3: {
    bucket: process.env.AWS_S3_BUCKET || '',
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
};
