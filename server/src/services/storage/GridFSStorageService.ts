import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';
import type { IStorageService, UploadResult } from './IStorageService';
import { LocalStorageService } from './LocalStorageService';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseUploadDir = path.resolve(__dirname, '../../../../uploads');

function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    case '.svg':
      return 'image/svg+xml';
    case '.mp4':
      return 'video/mp4';
    case '.webm':
      return 'video/webm';
    default:
      return 'application/octet-stream';
  }
}

export class GridFSStorageService implements IStorageService {
  private localFallback: LocalStorageService;
  private bucket: GridFSBucket | null = null;

  constructor() {
    this.localFallback = new LocalStorageService();
    this.initBucket();
  }

  private initBucket() {
    if (mongoose.connection && mongoose.connection.readyState === 1 && mongoose.connection.db) {
      try {
        this.bucket = new GridFSBucket(mongoose.connection.db, {
          bucketName: 'forma_media',
        });
        console.log('[Storage] MongoDB GridFS persistent media storage active.');
      } catch (err: any) {
        console.warn('[Storage] GridFS initialization error:', err.message);
      }
    }

    mongoose.connection.on('connected', () => {
      if (mongoose.connection.db) {
        try {
          this.bucket = new GridFSBucket(mongoose.connection.db, {
            bucketName: 'forma_media',
          });
          console.log('[Storage] MongoDB GridFS persistent media storage connected.');
        } catch (err: any) {
          console.warn('[Storage] GridFS connected hook error:', err.message);
        }
      }
    });
  }

  private getBucket(): GridFSBucket | null {
    if (!this.bucket && mongoose.connection && mongoose.connection.readyState === 1 && mongoose.connection.db) {
      try {
        this.bucket = new GridFSBucket(mongoose.connection.db, {
          bucketName: 'forma_media',
        });
      } catch {}
    }
    return this.bucket;
  }

  async saveFile(content: Buffer | string, filename: string, folder = 'creations'): Promise<string> {
    const buffer = typeof content === 'string' ? Buffer.from(content, 'utf8') : content;
    const bucket = this.getBucket();

    // 1. Persist to MongoDB GridFS for permanent zero-cost durability across ephemeral cloud containers
    if (bucket) {
      try {
        const mimeType = getMimeType(filename);
        const uploadStream = bucket.openUploadStream(filename, {
          metadata: {
            folder,
            mimeType,
            size: buffer.length,
            createdAt: new Date(),
          },
        });

        await new Promise<void>((resolve, reject) => {
          const readable = Readable.from(buffer);
          readable
            .pipe(uploadStream)
            .on('finish', () => resolve())
            .on('error', (err) => reject(err));
        });

        console.log(`[Storage] Saved to persistent MongoDB GridFS (${buffer.length} bytes): ${filename}`);
      } catch (gridErr: any) {
        console.warn(`[Storage] GridFS save warning (${gridErr.message}), caching locally.`);
      }
    }

    // 2. Also cache to local filesystem for fast local serving
    try {
      await this.localFallback.saveFile(buffer, filename, folder);
    } catch {}

    return `/uploads/${folder}/${filename}`;
  }

  async saveUpload(file: Express.Multer.File, folder = 'references'): Promise<UploadResult> {
    const ext = path.extname(file.originalname) || '.jpg';
    const cleanBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${cleanBase}-${Date.now()}${ext}`;

    const buffer = file.buffer || (file.path ? await fs.promises.readFile(file.path) : Buffer.alloc(0));
    await this.saveFile(buffer, filename, folder);

    const isVideo = file.mimetype.startsWith('video/');

    return {
      url: `/uploads/${folder}/${filename}`,
      filename: file.originalname,
      mediaKind: isVideo ? 'video' : 'image',
      size: buffer.length,
      mimeType: file.mimetype,
    };
  }

  async deleteFile(fileUrl: string): Promise<boolean> {
    const filename = path.basename(fileUrl);
    const bucket = this.getBucket();

    if (bucket) {
      try {
        const files = await bucket.find({ filename }).toArray();
        for (const file of files) {
          await bucket.delete(file._id);
        }
      } catch {}
    }

    return this.localFallback.deleteFile(fileUrl);
  }

  getPublicUrl(relativePath: string): string {
    return this.localFallback.getPublicUrl(relativePath);
  }

  /**
   * Stream a file from GridFS to an Express response
   */
  async streamToResponse(filename: string, res: any): Promise<boolean> {
    const bucket = this.getBucket();
    if (!bucket) return false;

    try {
      const files = await bucket.find({ filename }).toArray();
      if (!files || files.length === 0) return false;

      const fileDoc = files[files.length - 1]; // Latest version
      const mime = fileDoc.metadata?.mimeType || getMimeType(filename);

      res.setHeader('Content-Type', mime);
      res.setHeader('Content-Length', fileDoc.length);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

      const downloadStream = bucket.openDownloadStreamByName(filename);
      downloadStream.pipe(res);
      return true;
    } catch (err: any) {
      console.warn('[Storage] Error streaming from GridFS:', err.message);
      return false;
    }
  }
}
