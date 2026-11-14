import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { IStorageService, UploadResult } from './IStorageService';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseUploadDir = path.resolve(__dirname, '../../../../uploads');

export class LocalStorageService implements IStorageService {
  constructor() {
    this.ensureDirectory(baseUploadDir);
    this.ensureDirectory(path.join(baseUploadDir, 'creations'));
    this.ensureDirectory(path.join(baseUploadDir, 'references'));
  }

  private ensureDirectory(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  async saveFile(content: Buffer | string, filename: string, folder = 'creations'): Promise<string> {
    const targetDir = path.join(baseUploadDir, folder);
    this.ensureDirectory(targetDir);
    const targetPath = path.join(targetDir, filename);

    if (typeof content === 'string') {
      await fs.promises.writeFile(targetPath, content, 'utf8');
    } else {
      await fs.promises.writeFile(targetPath, content);
    }

    return `/uploads/${folder}/${filename}`;
  }

  async saveUpload(file: Express.Multer.File, folder = 'references'): Promise<UploadResult> {
    const ext = path.extname(file.originalname) || '.jpg';
    const cleanBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${cleanBase}-${Date.now()}${ext}`;

    const targetDir = path.join(baseUploadDir, folder);
    this.ensureDirectory(targetDir);
    const targetPath = path.join(targetDir, filename);

    if (file.buffer) {
      await fs.promises.writeFile(targetPath, file.buffer);
    } else if (file.path && file.path !== targetPath) {
      await fs.promises.copyFile(file.path, targetPath);
      // Clean up temp file
      try {
        await fs.promises.unlink(file.path);
      } catch {}
    }

    const isVideo = file.mimetype.startsWith('video/');

    return {
      url: `/uploads/${folder}/${filename}`,
      filename: file.originalname,
      mediaKind: isVideo ? 'video' : 'image',
      size: file.size,
      mimeType: file.mimetype,
    };
  }

  async deleteFile(fileUrl: string): Promise<boolean> {
    try {
      if (!fileUrl.startsWith('/uploads/')) return false;
      const relative = fileUrl.replace('/uploads/', '');
      const fullPath = path.join(baseUploadDir, relative);
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  getPublicUrl(relativePath: string): string {
    return relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  }
}
