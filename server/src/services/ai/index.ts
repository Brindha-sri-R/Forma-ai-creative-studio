import { ImageGenerationService } from './ImageGenerationService';
import { VideoGenerationService } from './VideoGenerationService';

export const imageGenerationService = new ImageGenerationService();
export const videoGenerationService = new VideoGenerationService();

export * from './IImageGenerationService';
export * from './IVideoGenerationService';

