export interface UploadResult {
  url: string;
  filename: string;
  mediaKind: 'image' | 'video';
  size: number;
  mimeType?: string;
}

export interface IStorageService {
  saveFile(buffer: Buffer | string, filename: string, folder?: string): Promise<string>;
  saveUpload(file: Express.Multer.File, folder?: string): Promise<UploadResult>;
  deleteFile(fileUrl: string): Promise<boolean>;
  getPublicUrl(relativePath: string): string;
}
