import express from 'express';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';

const router = express.Router();

// Get user collections
router.get('/', requireAuth, (req, res) => {
  try {
    const rows = db.prepare('SELECT name FROM collections WHERE user_id = ? ORDER BY name ASC').all(req.user.id);
    const names = rows.map((r) => r.name);
    return res.json({ collections: names });
  } catch (error) {
    console.error('Fetch collections error:', error);
    return res.status(500).json({ error: 'Failed to fetch collections' });
  }
});

// Create new collection
router.post('/', requireAuth, (req, res) => {
  try {
    const { name } = req.body;
    const trimmed = (name || '').trim();
    if (!trimmed) {
      return res.status(400).json({ error: 'Collection name is required' });
    }

    const existing = db.prepare('SELECT id FROM collections WHERE user_id = ? AND name = ?').get(req.user.id, trimmed);
    if (existing) {
      return res.json({ message: 'Collection already exists', name: trimmed });
    }

    const id = `col-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    db.prepare('INSERT INTO collections (id, user_id, name, created_at) VALUES (?, ?, ?, ?)')
      .run(id, req.user.id, trimmed, new Date().toISOString());

    return res.status(201).json({ message: 'Collection created', name: trimmed });
  } catch (error) {
    console.error('Create collection error:', error);
    return res.status(500).json({ error: 'Failed to create collection' });
  }
});

// Delete collection
router.delete('/:name', requireAuth, (req, res) => {
  try {
    const { name } = req.params;
    db.prepare('DELETE FROM collections WHERE user_id = ? AND name = ?').run(req.user.id, name);
    // Also remove collection tag from creations
    db.prepare('UPDATE creations SET collection = NULL WHERE user_id = ? AND collection = ?').run(req.user.id, name);

    return res.json({ message: 'Collection deleted', name });
  } catch (error) {
    console.error('Delete collection error:', error);
    return res.status(500).json({ error: 'Failed to delete collection' });
  }
});

export default router;

