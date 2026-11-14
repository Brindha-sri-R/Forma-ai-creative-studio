import express from 'express';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';

const router = express.Router();

function rowToCreationItem(row) {
  return {
    id: row.id,
    title: row.title,
    createdAt: new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    request: {
      mode: row.mode,
      prompt: row.prompt,
      negativePrompt: row.negative_prompt || '',
      model: row.model,
      aspectRatio: row.aspect_ratio,
      resolution: row.resolution,
      style: row.style,
      variations: row.variations,
      duration: row.duration,
      motion: row.motion,
      fps: row.fps,
      referenceAssetUrl: row.reference_asset_url,
      referenceAssetName: row.reference_asset_name,
      referenceMediaKind: row.reference_media_kind,
    },
    seed: row.seed,
    dimensions: row.dimensions,
    creditsUsed: row.credits_used,
    provider: row.provider,
    mediaUrl: row.media_url,
    mediaKind: row.media_kind,
    saved: Boolean(row.saved),
    collection: row.collection || undefined,
  };
}

// Get user creations with optional filters
router.get('/', requireAuth, (req, res) => {
  try {
    const { filter, collection, search } = req.query;
    let query = 'SELECT * FROM creations WHERE user_id = ?';
    const params = [req.user.id];

    if (filter === 'saved') {
      query += ' AND saved = 1';
    } else if (filter === 'image' || filter === 'video') {
      query += ' AND mode = ?';
      params.push(filter);
    } else if (filter === 'collections' && collection && collection !== 'all') {
      query += ' AND collection = ?';
      params.push(collection);
    }

    if (search && typeof search === 'string' && search.trim()) {
      query += ' AND (title LIKE ? OR prompt LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term);
    }

    query += ' ORDER BY datetime(created_at) DESC';

    const rows = db.prepare(query).all(...params);
    const items = rows.map(rowToCreationItem);

    return res.json({ creations: items });
  } catch (error) {
    console.error('Fetch creations error:', error);
    return res.status(500).json({ error: 'Failed to fetch creations' });
  }
});

// Update creation (rename, toggle save, set collection)
router.patch('/:id', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const { title, saved, collection } = req.body;

    const creation = db.prepare('SELECT * FROM creations WHERE id = ? AND user_id = ?').get(id, req.user.id);
    if (!creation) {
      return res.status(404).json({ error: 'Creation not found' });
    }

    const updates = [];
    const params = [];

    if (typeof title === 'string' && title.trim()) {
      updates.push('title = ?');
      params.push(title.trim());
    }

    if (typeof saved === 'boolean') {
      updates.push('saved = ?');
      params.push(saved ? 1 : 0);
    }

    if (typeof collection !== 'undefined') {
      updates.push('collection = ?');
      params.push(collection ? collection.trim() : null);
    }

    if (updates.length > 0) {
      params.push(id, req.user.id);
      db.prepare(`UPDATE creations SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`).run(...params);
    }

    const updated = db.prepare('SELECT * FROM creations WHERE id = ?').get(id);
    return res.json({ creation: rowToCreationItem(updated) });
  } catch (error) {
    console.error('Update creation error:', error);
    return res.status(500).json({ error: 'Failed to update creation' });
  }
});

// Delete creation
router.delete('/:id', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const creation = db.prepare('SELECT id FROM creations WHERE id = ? AND user_id = ?').get(id, req.user.id);
    if (!creation) {
      return res.status(404).json({ error: 'Creation not found' });
    }

    db.prepare('DELETE FROM creations WHERE id = ? AND user_id = ?').run(id, req.user.id);
    return res.json({ message: 'Creation deleted successfully', id });
  } catch (error) {
    console.error('Delete creation error:', error);
    return res.status(500).json({ error: 'Failed to delete creation' });
  }
});

// Duplicate creation
router.post('/:id/duplicate', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const original = db.prepare('SELECT * FROM creations WHERE id = ? AND user_id = ?').get(id, req.user.id);
    if (!original) {
      return res.status(404).json({ error: 'Creation not found' });
    }

    const newId = `crt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newTitle = `${original.title} (Copy)`;
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
        ?, ?, ?, ?, ?, ?
      )
    `).run(
      newId,
      req.user.id,
      newTitle,
      original.prompt,
      original.negative_prompt,
      original.mode,
      original.aspect_ratio,
      original.resolution,
      original.style,
      original.model,
      original.variations,
      original.duration,
      original.motion,
      original.fps,
      original.reference_asset_url,
      original.reference_asset_name,
      original.reference_media_kind,
      original.seed + 1,
      original.dimensions,
      0, // Duplicate doesn't charge credits
      original.provider,
      original.media_url,
      original.media_kind,
      original.saved,
      original.collection,
      now
    );

    const duplicated = db.prepare('SELECT * FROM creations WHERE id = ?').get(newId);
    return res.status(201).json({ creation: rowToCreationItem(duplicated) });
  } catch (error) {
    console.error('Duplicate creation error:', error);
    return res.status(500).json({ error: 'Failed to duplicate creation' });
  }
});

export default router;

