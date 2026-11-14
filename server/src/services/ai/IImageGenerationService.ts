export interface ImageGenerationOptions {
  prompt: string;
  negativePrompt?: string;
  style?: string;
  aspectRatio: string;
  resolution: string;
  variations?: number;
  seed?: number;
  model?: string;
  referenceAssetUrl?: string | null;
}

export interface GenerationResult {
  mediaUrl: string;
  seed: number;
  dimensions: string;
  creditsUsed: number;
  provider: string;
  isDemoMode: boolean;
  metadata?: Record<string, any>;
}

export interface IImageGenerationService {
  name: string;
  isConfigured(): boolean;
  generateImage(options: ImageGenerationOptions): Promise<GenerationResult>;
}

