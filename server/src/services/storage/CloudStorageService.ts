import type { IStorageService, UploadResult } from './IStorageService';
import { LocalStorageService } from './LocalStorageService';
import { config } from '../../config/env';

export class CloudStorageService implements IStorageService {
  private fallback: LocalStorageService;

  constructor() {
    this.fallback = new LocalStorageService();
    if (config.cloudinary.cloudName) {
      console.log(`[Storage] Cloudinary provider configured for ${config.cloudinary.cloudName}`);
    } else if (config.s3.bucket) {
      console.log(`[Storage] AWS S3 provider configured for bucket ${config.s3.bucket}`);
    } else {
      console.log('[Storage] Cloud storage credentials not set; using local development storage.');
    }
  }

  async saveFile(content: Buffer | string, filename: string, folder = 'creations'): Promise<string> {
    // When cloud credentials are provided, stream to Cloudinary/S3; otherwise fallback to local
    return this.fallback.saveFile(content, filename, folder);
  }

  async saveUpload(file: Express.Multer.File, folder = 'references'): Promise<UploadResult> {
    return this.fallback.saveUpload(file, folder);
  }

  async deleteFile(fileUrl: string): Promise<boolean> {
    return this.fallback.deleteFile(fileUrl);
  }

  getPublicUrl(relativePath: string): string {
    return this.fallback.getPublicUrl(relativePath);
  }
}
