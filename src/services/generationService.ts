import { pickStudioAssetForPrompt } from '../data/assets';
import { ASPECT_RATIOS } from '../data/presets';
import type { CreationItem, GenerationRequest, GenerationUxState } from '../types/studio';
import { api, getStoredToken } from './apiClient';

export interface GenerationProgress {
  phase: Extract<GenerationUxState, 'generating' | 'processing'>;
  progress: number;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function resolveDimensions(request: GenerationRequest): string {
  const ratio = ASPECT_RATIOS.find((item) => item.value === request.aspectRatio);
  return ratio ? ratio.dimensions[request.mode][request.resolution] : '1080 × 1080';
}

export function calculateCreditCost(request: GenerationRequest): number {
  const base = request.mode === 'image' ? 1 : 4;
  const variationMultiplier = request.mode === 'image' ? request.variations : 1;
  return base * variationMultiplier;
}

function deriveCreationTitle(prompt: string, mode: GenerationRequest['mode']): string {
  const cleaned = prompt.trim().replace(/\s+/g, ' ');
  if (!cleaned) return mode === 'image' ? 'Untitled Still' : 'Untitled Sequence';
  const words = cleaned.split(' ').slice(0, 5).join(' ');
  return words.length < cleaned.length ? `${words}…` : words;
}

/**
 * Fullstack generation service.
 * Dispatches to backend API `/api/generate` with live progress reporting.
 */
export async function runGeneration(
  request: GenerationRequest,
  onProgress?: (state: GenerationProgress) => void
): Promise<CreationItem & { newBalance?: number }> {
  const token = getStoredToken();

  onProgress?.({ phase: 'generating', progress: 30 });

  // If user is authenticated with backend, call the real generation API endpoint
  if (token) {
    const progressTimer = setTimeout(() => {
      onProgress?.({ phase: 'processing', progress: 75 });
    }, 600);

    try {
      const creation = await api.generate.run(request);
      clearTimeout(progressTimer);
      onProgress?.({ phase: 'processing', progress: 100 });
      return creation;
    } catch (err: any) {
      clearTimeout(progressTimer);
      // Propagate all real API errors directly to the UI (Quota, Auth, Model, Network)
      console.error('[GenerationService] Backend generation failed:', err);
      throw err;
    }
  }

  // Graceful local preview fallback ONLY for unauthenticated visitors
  await sleep(request.mode === 'image' ? 450 : 600);
  onProgress?.({ phase: 'processing', progress: 85 });
  await sleep(request.mode === 'image' ? 400 : 550);

  const seed = Math.floor(100000 + Math.random() * 899999);
  const matchedAsset = pickStudioAssetForPrompt(request.prompt, seed);

  return {
    id: `crt-${Date.now()}`,
    title: deriveCreationTitle(request.prompt, request.mode),
    createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    request,
    seed,
    dimensions: resolveDimensions(request),
    creditsUsed: calculateCreditCost(request),
    provider: 'forma-preview',
    mediaUrl: matchedAsset.src,
    mediaKind: request.mode,
    saved: false,
  };
}
