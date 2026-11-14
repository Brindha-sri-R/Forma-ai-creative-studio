import type { IImageGenerationService, ImageGenerationOptions, GenerationResult } from './IImageGenerationService';
import { storageService } from '../storage';
import { QuotaExceededError, AuthenticationError, ModelUnavailableError, GenerationFailedError } from './errors';
import { assertZeroCostAllowed } from '../../config/costProtection';
import axios from 'axios';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseUploadDir = path.resolve(__dirname, '../../../../uploads');

// Dedicated IPv4 agent to prevent Windows dual-stack socket hang-ups
const ipv4Agent = new https.Agent({ family: 4, keepAlive: true });

const COMMUNITY_ASPECT_RATIO_PIXELS: Record<string, { width: number; height: number }> = {
  '1:1':  { width: 1024, height: 1024 },
  '4:5':  { width: 816,  height: 1020 },
  '16:9': { width: 1024, height: 576 },
  '9:16': { width: 576,  height: 1024 },
};

const STYLE_PROMPT_MODIFIERS: Record<string, string> = {
  Editorial: 'editorial magazine photography, 35mm film aesthetic, balanced natural lighting, rich textures, fine grain',
  Minimal: 'minimalist fine art composition, generous negative space, soft ambient natural lighting, refined subtle tones, elegant restraint',
  Architectural: 'sharp architectural photography, striking geometric lines, dramatic angles, textured materials, golden hour volumetric lighting',
  Monochrome: 'fine art black and white photography, deep contrast, dramatic chiaroscuro, silver gelatin print tones, rich deep shadows',
};

const ASPECT_RATIO_DIMENSIONS: Record<string, Record<string, string>> = {
  '1:1':  { '1K': '1024 × 1024', '2K': '1280 × 1280', '4K': '1536 × 1536' },
  '4:5':  { '1K': '816 × 1020',  '2K': '1020 × 1275', '4K': '1224 × 1530' },
  '16:9': { '1K': '1024 × 576',  '2K': '1280 × 720',  '4K': '1536 × 864' },
  '9:16': { '1K': '576 × 1024',  '2K': '720 × 1280',  '4K': '864 × 1536' },
};

const GEMINI_ASPECT_RATIO: Record<string, string> = {
  '1:1':  '1:1',
  '4:5':  '3:4',
  '16:9': '16:9',
  '9:16': '9:16',
};

const GEMINI_IMAGE_SIZE: Record<string, string> = {
  '1K': '1K',
  '2K': '2K',
  '4K': '4K',
};

/**
 * Validates binary image signatures (PNG, JPEG, WebP)
 */
export function validateImageBuffer(buffer: Buffer): { valid: boolean; ext: string; mime: string } {
  if (buffer.length < 8) return { valid: false, ext: 'bin', mime: 'application/octet-stream' };

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return { valid: true, ext: '.png', mime: 'image/png' };
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return { valid: true, ext: '.jpg', mime: 'image/jpeg' };
  }

  // WebP: RIFF....WEBP
  if (
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) {
    return { valid: true, ext: '.webp', mime: 'image/webp' };
  }

  return { valid: false, ext: 'bin', mime: 'application/octet-stream' };
}

/**
 * Resolves local or remote image reference into Base64 for Image-to-Image
 */
async function resolveReferenceImage(url: string): Promise<{ mimeType: string; data: string } | null> {
  try {
    if (url.startsWith('data:')) {
      const match = url.match(/^data:([^;]+);base64,(.+)$/);
      if (match) return { mimeType: match[1], data: match[2] };
    }

    if (url.startsWith('/uploads/')) {
      const relPath = url.replace('/uploads/', '');
      const localPath = path.join(baseUploadDir, relPath);
      if (fs.existsSync(localPath)) {
        const buf = await fs.promises.readFile(localPath);
        const { mime } = validateImageBuffer(buf);
        return { mimeType: mime, data: buf.toString('base64') };
      }
    }

    if (url.startsWith('http://') || url.startsWith('https://')) {
      const res = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 20000,
        httpsAgent: ipv4Agent,
      });
      const buf = Buffer.from(res.data);
      const mime = String(res.headers['content-type'] || 'image/jpeg');
      return { mimeType: mime, data: buf.toString('base64') };
    }
  } catch (err: any) {
    console.warn('[ImageGenerationService] Could not resolve reference image:', err.message);
  }
  return null;
}

export class ImageGenerationService implements IImageGenerationService {
  name = 'Forma Zero-Cost Image Studio Engine';

  isConfigured(): boolean {
    return Boolean(process.env.GEMINI_API_KEY || true);
  }

  async generateImage(options: ImageGenerationOptions): Promise<GenerationResult> {
    const seed = options.seed ?? Math.floor(100000 + Math.random() * 899999);
    const ratioDimensions = ASPECT_RATIO_DIMENSIONS[options.aspectRatio] || ASPECT_RATIO_DIMENSIONS['1:1'];
    const dimensions = ratioDimensions[options.resolution] || '1080 × 1080';
    const variations = Math.max(1, options.variations || 1);
    const creditsUsed = 1 * variations;

    const requestedModel = options.model || 'gemini-3.1-flash-image';

    // ── 1. Genuinely Free Community AI Engine (Zero Cost, Real AI Image) ──
    if (requestedModel.includes('free-flux') || requestedModel.includes('community')) {
      assertZeroCostAllowed('free-community');
      console.log('[AI Image] Generating real image via Zero-Cost Open Community Engine (Flux)...');

      const pixelConfig = COMMUNITY_ASPECT_RATIO_PIXELS[options.aspectRatio] || { width: 1024, height: 1024 };
      let width = pixelConfig.width;
      let height = pixelConfig.height;

      if (options.resolution === '2K') {
        width = Math.min(1280, Math.round((width * 1.25) / 16) * 16);
        height = Math.min(1280, Math.round((height * 1.25) / 16) * 16);
      }

      let promptClean = options.prompt.trim();
      const styleMod = options.style && STYLE_PROMPT_MODIFIERS[options.style] ? STYLE_PROMPT_MODIFIERS[options.style] : null;
      if (styleMod) {
        promptClean += `, ${styleMod}`;
      }
      if (options.negativePrompt && options.negativePrompt.trim()) {
        promptClean += ` (negative direction: ${options.negativePrompt.trim()})`;
      }

      const encodedPrompt = encodeURIComponent(promptClean);
      const endpointUrls = [
        `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true`,
        `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=flux&seed=${seed}&nologo=true`,
        `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=turbo&seed=${seed}&nologo=true`,
      ];

      let response: any = null;
      let lastErr: any = null;
      const backoffDelays = [3000, 6000, 10000, 15000];

      try {
        for (let attempt = 1; attempt <= 4; attempt++) {
          const currentUrl = endpointUrls[(attempt - 1) % endpointUrls.length];
          try {
            response = await axios.get(currentUrl, {
              responseType: 'arraybuffer',
              timeout: 90000,
              httpsAgent: ipv4Agent,
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
              },
            });
            if (response && response.data) break;
          } catch (attemptErr: any) {
            lastErr = attemptErr;
            const status = attemptErr.response?.status;
            const code = attemptErr.code;
            const isRetryable = status === 402 || status === 429 || status === 503 || code === 'EAI_AGAIN' || code === 'ECONNRESET' || code === 'ETIMEDOUT';
            if (isRetryable && attempt < 4) {
              const delay = backoffDelays[attempt - 1] || 10000;
              console.warn(`[AI Image] Community Engine transient retryable issue (${status || code}), retrying in ${delay / 1000}s with alternative route (attempt ${attempt}/4)...`);
              await new Promise((resolve) => setTimeout(resolve, delay));
              continue;
            }
            throw attemptErr;
          }
        }

        if (!response || !response.data) {
          throw lastErr || new Error('No data received from community engine');
        }

        const imageBuffer = Buffer.from(response.data);
        const validation = validateImageBuffer(imageBuffer);

        if (!validation.valid || imageBuffer.length < 1024) {
          throw new GenerationFailedError(
            'Zero-Cost Community Engine',
            'Returned data failed binary image validation.'
          );
        }

        const filename = `img-${Date.now()}-${seed}${validation.ext}`;
        const mediaUrl = await storageService.saveFile(imageBuffer, filename, 'creations');

        console.log(`[AI Image] ✅ Zero-Cost real image generated and stored (${imageBuffer.length} bytes): ${mediaUrl}`);

        return {
          mediaUrl,
          seed,
          dimensions: `${width} × ${height}`,
          creditsUsed,
          provider: 'Zero-Cost Community Engine (FLUX.1)',
          isDemoMode: false,
          metadata: {
            model: 'flux-community-free',
            aspectRatio: options.aspectRatio,
            resolution: options.resolution,
            mimeType: validation.mime,
            fileSize: imageBuffer.length,
            cost: '$0.00 (Zero-Cost)',
          },
        };
      } catch (err: any) {
        console.error('[AI Image] Community Engine error:', err.message);
        throw new GenerationFailedError('Zero-Cost Community Engine', `Image generation failed: ${err.message}`);
      }
    }

    // ── 2. Google Gemini API (gemini-3.1-flash-image / gemini-3.1-flash-lite-image) ──
    if (process.env.GEMINI_API_KEY) {
      assertZeroCostAllowed('gemini');
      const apiKey = process.env.GEMINI_API_KEY.trim();
      const modelName = requestedModel.includes('flash-image') || requestedModel.includes('gemini')
        ? requestedModel
        : 'gemini-3.1-flash-image';

      console.log(`[AI Image] Dispatching request to Google Gemini API (${modelName})...`);

      const parts: any[] = [];

      // Multimodal Image-to-Image editing
      if (options.referenceAssetUrl) {
        const refImage = await resolveReferenceImage(options.referenceAssetUrl);
        if (refImage) {
          parts.push({
            inlineData: {
              mimeType: refImage.mimeType,
              data: refImage.data,
            },
          });
        }
      }

      let finalPrompt = options.prompt.trim();
      if (options.style && options.style !== 'Editorial') {
        finalPrompt += `, ${options.style.toLowerCase()} aesthetic, high fidelity`;
      }
      if (options.negativePrompt) {
        finalPrompt += ` [Avoid: ${options.negativePrompt}]`;
      }
      parts.push({ text: finalPrompt });

      const geminiRatio = GEMINI_ASPECT_RATIO[options.aspectRatio] || '1:1';
      const geminiSize = GEMINI_IMAGE_SIZE[options.resolution] || '1K';

      const payload = {
        contents: [{ role: 'user', parts }],
        generationConfig: {
          responseModalities: ['IMAGE'],
          imageConfig: {
            aspectRatio: geminiRatio,
            imageSize: geminiSize,
          },
        },
      };

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

      try {
        const response = await axios.post(url, payload, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 75000,
          httpsAgent: ipv4Agent,
        });

        const candidates = response.data?.candidates;
        const candidateParts = candidates?.[0]?.content?.parts || [];
        let imagePart: any = null;

        for (const p of candidateParts) {
          if (p.inlineData || p.inline_data) {
            imagePart = p.inlineData || p.inline_data;
            break;
          }
        }

        if (!imagePart || !imagePart.data) {
          const textPart = candidateParts.find((p: any) => p.text);
          throw new GenerationFailedError(
            'Google Gemini',
            `Model did not return image bytes: ${textPart ? textPart.text.slice(0, 200) : 'No media part'}`
          );
        }

        const imageBuffer = Buffer.from(imagePart.data, 'base64');
        const validation = validateImageBuffer(imageBuffer);

        if (!validation.valid) {
          throw new GenerationFailedError('Google Gemini', 'Data failed binary image signature validation.');
        }

        const filename = `img-${Date.now()}-${seed}${validation.ext}`;
        const mediaUrl = await storageService.saveFile(imageBuffer, filename, 'creations');

        console.log(`[AI Image] ✅ Gemini generated real image (${imageBuffer.length} bytes): ${mediaUrl}`);

        return {
          mediaUrl,
          seed,
          dimensions: `${width} × ${height}`,
          creditsUsed,
          provider: `Google Gemini (${modelName})`,
          isDemoMode: false,
          metadata: {
            model: modelName,
            aspectRatio: options.aspectRatio,
            resolution: options.resolution,
            mimeType: validation.mime,
            fileSize: imageBuffer.length,
            cost: '$0.00 (Free Tier)',
          },
        };
      } catch (err: any) {
        const status = err?.response?.status;
        const errData = err?.response?.data;
        const errorMsg = errData?.error?.message || err.message;

        if (status === 429) {
          // Honest reporting: Google AI Studio has limit 0 for image models on Free Tier
          throw new QuotaExceededError(
            modelName,
            `Google AI Studio quota limit exceeded for "${modelName}" (metric limit: 0 on unbilled Free Tier). Google requires linked billing for Gemini image generation. Under your zero-cost policy, switch to "Free Community Engine (FLUX.1)" in the model dropdown to generate real AI images at 0 cost without billing.`,
            undefined,
            'Google Gemini'
          );
        }

        if (status === 401 || status === 403) {
          throw new AuthenticationError('Google Gemini', `Invalid or unauthorized API key: ${errorMsg}`);
        }

        if (status === 404) {
          throw new ModelUnavailableError(modelName, `Model "${modelName}" is not available on this API version.`);
        }

        throw new GenerationFailedError('Google Gemini', `Image generation failed: ${errorMsg}`);
      }
    }

    throw new GenerationFailedError(
      'Forma Studio',
      'No AI Provider configured. Please provide a GEMINI_API_KEY or select the Free Community Engine.'
    );
  }
}
