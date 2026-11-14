import type { IVideoGenerationService, VideoGenerationOptions } from './IVideoGenerationService';
import type { GenerationResult } from './IImageGenerationService';
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

const ipv4Agent = new https.Agent({ family: 4, keepAlive: true });

const VIDEO_DIMENSIONS: Record<string, string> = {
  '16:9': '1920 × 1080',
  '9:16': '1080 × 1920',
  '1:1':  '1080 × 1080',
  '4:5':  '1080 × 1350',
};

/**
 * Validates MP4 binary signature (ISO Base Media File Format: 'ftyp' at offset 4)
 */
export function validateMp4Buffer(buffer: Buffer): boolean {
  if (buffer.length < 16) return false;
  const ftyp = buffer.toString('ascii', 4, 8);
  return ftyp === 'ftyp' || ftyp === 'moov';
}

/**
 * Resolves local or remote reference image for Image-to-Video
 */
async function resolveReferenceImage(url: string): Promise<{ mimeType: string; data: string } | null> {
  try {
    if (url.startsWith('/uploads/')) {
      const relPath = url.replace('/uploads/', '');
      const localPath = path.join(baseUploadDir, relPath);
      if (fs.existsSync(localPath)) {
        const buf = await fs.promises.readFile(localPath);
        return { mimeType: 'image/jpeg', data: buf.toString('base64') };
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
    console.warn('[VideoGenerationService] Could not resolve reference image:', err.message);
  }
  return null;
}

export class VideoGenerationService implements IVideoGenerationService {
  name = 'Forma Zero-Cost Video Engine';

  isConfigured(): boolean {
    return Boolean(process.env.GEMINI_API_KEY);
  }

  async generateVideo(options: VideoGenerationOptions): Promise<GenerationResult> {
    const seed = options.seed ?? Math.floor(100000 + Math.random() * 899999);
    const dimensions = VIDEO_DIMENSIONS[options.aspectRatio] || '1920 × 1080';
    const creditsUsed = 4;

    // ── 1. Google Gemini Omni Flash Video Generation ───────────────
    if (process.env.GEMINI_API_KEY) {
      assertZeroCostAllowed('gemini');
      const apiKey = process.env.GEMINI_API_KEY.trim();
      const modelName = 'gemini-omni-1.2-flash';

      console.log(`[AI Video] Evaluating Google Gemini Omni Video model (${modelName}) under Zero-Cost Policy...`);

      const parts: any[] = [];

      // Support Image-to-Video if reference image exists
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

      let promptText = options.prompt.trim();
      if (options.motion && options.motion !== 'Static') {
        promptText += `, camera motion: ${options.motion.toLowerCase()}`;
      }
      if (options.duration) {
        promptText += `, duration: ${options.duration}`;
      }
      parts.push({ text: promptText });

      const payload = {
        contents: [{ role: 'user', parts }],
        generationConfig: {
          responseModalities: ['VIDEO'],
        },
      };

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

      try {
        const response = await axios.post(url, payload, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 180000,
          httpsAgent: ipv4Agent,
        });

        const candidates = response.data?.candidates;
        const candidateParts = candidates?.[0]?.content?.parts || [];
        let videoPart: any = null;

        for (const p of candidateParts) {
          if (p.inlineData || p.inline_data) {
            videoPart = p.inlineData || p.inline_data;
            break;
          }
        }

        let videoBuffer: Buffer | null = null;

        if (videoPart && videoPart.data) {
          videoBuffer = Buffer.from(videoPart.data, 'base64');
        } else if (response.data?.video?.uri || response.data?.generatedVideos?.[0]?.video?.uri) {
          const videoUri = response.data?.video?.uri || response.data?.generatedVideos?.[0]?.video?.uri;
          const downloadRes = await axios.get(videoUri, {
            headers: { 'x-goog-api-key': apiKey },
            responseType: 'arraybuffer',
            httpsAgent: ipv4Agent,
          });
          videoBuffer = Buffer.from(downloadRes.data);
        }

        if (!videoBuffer) {
          const textPart = candidateParts.find((p: any) => p.text);
          throw new GenerationFailedError('Google Gemini', `Model did not return video bytes: ${textPart ? textPart.text.slice(0, 200) : 'No media part'}`);
        }

        if (!validateMp4Buffer(videoBuffer)) {
          throw new GenerationFailedError(
            'Google Gemini',
            'Received data failed MP4 binary container validation.'
          );
        }

        const filename = `vid-${Date.now()}-${seed}.mp4`;
        const mediaUrl = await storageService.saveFile(videoBuffer, filename, 'creations');

        console.log(`[AI Video] ✅ Gemini generated real MP4 video (${videoBuffer.length} bytes): ${mediaUrl}`);

        return {
          mediaUrl,
          seed,
          dimensions,
          creditsUsed,
          provider: `Google Gemini (${modelName})`,
          isDemoMode: false,
          metadata: {
            model: modelName,
            aspectRatio: options.aspectRatio,
            duration: options.duration,
            motion: options.motion,
            fps: options.fps,
            fileSize: videoBuffer.length,
            format: 'mp4',
            cost: '$0.00',
          },
        };
      } catch (err: any) {
        const status = err?.response?.status;
        const errData = err?.response?.data;
        const errorMsg = errData?.error?.message || err.message;

        if (status === 429) {
          throw new QuotaExceededError(
            modelName,
            `Google AI Studio quota limit is 0 on the Free Tier for video model "${modelName}". Google requires linked billing for Gemini video generation. Under your strict zero-cost policy, paid video generation has been prevented. Zero credits were deducted.`,
            undefined,
            'Google Gemini'
          );
        }

        if (status === 401 || status === 403) {
          throw new AuthenticationError('Google Gemini', `Invalid or unauthorized API key: ${errorMsg}`);
        }

        if (status === 404) {
          throw new ModelUnavailableError(modelName, `Video model "${modelName}" is not available on this API version.`);
        }

        throw new GenerationFailedError('Google Gemini', `Video generation failed: ${errorMsg}`);
      }
    }

    throw new GenerationFailedError(
      'Forma Studio',
      'No AI Video Provider configured. Please provide a GEMINI_API_KEY in your .env file.'
    );
  }
}
