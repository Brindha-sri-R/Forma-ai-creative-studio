import express from 'express';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';
import { generateArtisticSvg } from '../imageGenerator.js';

const router = express.Router();

const ASPECT_RATIO_DIMENSIONS = {
  '1:1': { '1K': '1080 × 1080', '2K': '2048 × 2048', '4K': '4096 × 4096' },
  '4:5': { '1K': '1080 × 1350', '2K': '1638 × 2048', '4K': '3276 × 4096' },
  '16:9': { '1K': '1920 × 1080', '2K': '2560 × 1440', '4K': '3840 × 2160' },
  '9:16': { '1K': '1080 × 1920', '2K': '1440 × 2560', '4K': '2160 × 3840' },
};

function resolveDimensions(mode, ratio, resolution) {
  const table = ASPECT_RATIO_DIMENSIONS[ratio] || ASPECT_RATIO_DIMENSIONS['1:1'];
  return table[resolution] || '1080 × 1080';
}

function deriveCreationTitle(prompt, mode) {
  const cleaned = (prompt || '').trim().replace(/\s+/g, ' ');
  if (!cleaned) return mode === 'image' ? 'Untitled Still' : 'Untitled Sequence';
  const words = cleaned.split(' ').slice(0, 5).join(' ');
  return words.length < cleaned.length ? `${words}…` : words;
}

router.post('/', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const {
      mode = 'image',
      prompt = '',
      negativePrompt = '',
      model = 'Forma Diffusion v3',
      aspectRatio = '1:1',
      resolution = '1K',
      style = 'Editorial',
      variations = 1,
      duration = '4s',
      motion = 'Static',
      fps = '24 fps',
      referenceAssetUrl = null,
      referenceAssetName = null,
      referenceMediaKind = null,
    } = req.body;

    const baseCost = mode === 'image' ? 1 : 4;
    const variationMultiplier = mode === 'image' ? Math.max(1, Number(variations) || 1) : 1;
    const creditsUsed = baseCost * variationMultiplier;

    if (user.credits < creditsUsed) {
      return res.status(402).json({
        error: 'Insufficient credits',
        required: creditsUsed,
        balance: user.credits,
      });
    }

    // Deduct credits
    const newBalance = user.credits - creditsUsed;
    db.prepare('UPDATE users SET credits = ? WHERE id = ?').run(newBalance, user.id);

    // Record credit transaction
    const txId = `tx-${Date.now()}`;
    const txLabel = `${mode === 'image' ? 'Image generation' : 'Video render'} (${creditsUsed} cr)`;
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    db.prepare(`
      INSERT INTO credit_transactions (id, user_id, label, mode, delta, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(txId, user.id, txLabel, mode, -creditsUsed, timeString);

    const creationId = `crt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const seed = Math.floor(100000 + Math.random() * 899999);
    const dimensions = resolveDimensions(mode, aspectRatio, resolution);
    const title = deriveCreationTitle(prompt, mode);

    // Procedural generation of creative asset
    const { mediaUrl } = generateArtisticSvg({
      id: creationId,
      prompt,
      style,
      aspectRatio,
      mode,
      motion,
      seed,
    });

    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO creations (
        id, user_id, title, prompt, negative_prompt, mode, aspect_ratio, resolution,
        style, model, variations, duration, motion, fps, reference_asset_url,
        reference_asset_name, reference_media_kind, seed, dimensions, credits_used,
        provider, media_url, media_kind, saved, collection, created_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, 0, NULL, ?
      )
    `).run(
      creationId,
      user.id,
      title,
      prompt,
      negativePrompt,
      mode,
      aspectRatio,
      resolution,
      style,
      model,
      variations,
      duration,
      motion,
      fps,
      referenceAssetUrl,
      referenceAssetName,
      referenceMediaKind,
      seed,
      dimensions,
      creditsUsed,
      'forma-engine',
      mediaUrl,
      mode,
      now
    );

    const creationItem = {
      id: creationId,
      title,
      createdAt: timeString,
      request: {
        mode,
        prompt,
        negativePrompt,
        model,
        aspectRatio,
        resolution,
        style,
        variations,
        duration,
        motion,
        fps,
        referenceAssetUrl,
        referenceAssetName,
        referenceMediaKind,
      },
      seed,
      dimensions,
      creditsUsed,
      provider: 'custom-api',
      mediaUrl,
      mediaKind: mode,
      saved: false,
      newBalance,
    };

    return res.status(201).json(creationItem);
  } catch (error) {
    console.error('Generation error:', error);
    return res.status(500).json({ error: 'Generation failed: ' + error.message });
  }
});

export default router;

