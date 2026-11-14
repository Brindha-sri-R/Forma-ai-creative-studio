import type { GenerationResult } from './IImageGenerationService';

export interface VideoGenerationOptions {
  prompt: string;
  negativePrompt?: string;
  generationType: 'text-to-video' | 'image-to-video';
  aspectRatio: string;
  duration: string;
  motion: string;
  fps: string;
  seed?: number;
  model?: string;
  referenceAssetUrl?: string | null;
}

export interface IVideoGenerationService {
  name: string;
  isConfigured(): boolean;
  generateVideo(options: VideoGenerationOptions): Promise<GenerationResult>;
}

