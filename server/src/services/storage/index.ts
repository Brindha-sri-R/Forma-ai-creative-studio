import { config } from '../../config/env';
import type { IStorageService } from './IStorageService';
import { LocalStorageService } from './LocalStorageService';
import { CloudStorageService } from './CloudStorageService';
import { GridFSStorageService } from './GridFSStorageService';

export const gridFSStorage = new GridFSStorageService();

export const storageService: IStorageService =
  config.storageProvider === 'cloudinary' || config.storageProvider === 's3'
    ? new CloudStorageService()
    : gridFSStorage;

export * from './IStorageService';
export { GridFSStorageService } from './GridFSStorageService';
