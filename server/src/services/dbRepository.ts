import { isMongoConnected, isMongoActive, localDb } from '../config/db';
import { UserModel } from '../models/User';
import { GenerationModel } from '../models/Generation';
import { UsageQuotaModel } from '../models/UsageQuota';
import { CollectionModel } from '../models/Collection';
import { MediaAssetModel } from '../models/MediaAsset';

const User: any = UserModel;
const Generation: any = GenerationModel;
const UsageQuota: any = UsageQuotaModel;
const Collection: any = CollectionModel;

export interface UserDTO {
  id: string;
  email: string;
  name: string;
  password?: string;
  planId: 'free' | 'pro' | 'studio';
  credits: number;
  maxCredits: number;
  resetCode?: string | null;
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GenerationDTO {
  id: string;
  userId: string;
  title: string;
  prompt: string;
  negativePrompt?: string;
  mode: 'image' | 'video';
  generationType: 'text-to-image' | 'text-to-video' | 'image-to-video';
  aspectRatio: string;
  resolution: string;
  style: string;
  model: string;
  variations: number;
  duration?: string;
  motion?: string;
  fps?: string;
  seed: number;
  dimensions: string;
  creditsUsed: number;
  provider: string;
  mediaUrl: string;
  mediaKind: 'image' | 'video';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  saved: boolean;
  collectionName?: string | null;
  referenceAssetUrl?: string | null;
  referenceAssetName?: string | null;
  referenceMediaKind?: 'image' | 'video' | null;
  createdAt: string;
  updatedAt?: string;
}

export interface UsageQuotaDTO {
  id: string;
  userId: string;
  label: string;
  mode: 'image' | 'video' | 'topup';
  delta: number;
  balanceAfter: number;
  timestamp: string;
  createdAt: string;
}

export const dbRepository = {
  users: {
    async findByEmail(email: string): Promise<UserDTO | null> {
      const cleanEmail = email.trim().toLowerCase();
      if (isMongoActive()) {
        try {
          const doc = await User.findOne({ email: cleanEmail });
          if (doc) {
            return {
              id: doc._id.toString(),
              email: doc.email,
              name: doc.name,
              password: doc.password,
              planId: doc.planId,
              credits: doc.credits,
              maxCredits: doc.maxCredits,
              resetCode: doc.resetCode,
              avatarUrl: doc.avatarUrl,
              createdAt: doc.createdAt.toISOString(),
            };
          }
        } catch (err: any) {
          console.warn('[dbRepository] Mongo findByEmail failed, using local fallback:', err.message);
        }
      }
      const row: any = localDb.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);
      if (!row) return null;
      return {
        id: row.id,
        email: row.email,
        name: row.name,
        password: row.password,
        planId: row.plan_id,
        credits: row.credits,
        maxCredits: row.max_credits,
        resetCode: row.reset_code,
        avatarUrl: row.avatar_url,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    },

    async findById(id: string): Promise<UserDTO | null> {
      if (isMongoActive()) {
        try {
          const doc = await User.findById(id);
          if (doc) {
            return {
              id: doc._id.toString(),
              email: doc.email,
              name: doc.name,
              password: doc.password,
              planId: doc.planId,
              credits: doc.credits,
              maxCredits: doc.maxCredits,
              resetCode: doc.resetCode,
              avatarUrl: doc.avatarUrl,
              createdAt: doc.createdAt.toISOString(),
            };
          }
        } catch (err: any) {
          console.warn('[dbRepository] Mongo findById failed, using local fallback:', err.message);
        }
      }
      const row: any = localDb.prepare('SELECT * FROM users WHERE id = ?').get(id);
      if (!row) return null;
      return {
        id: row.id,
        email: row.email,
        name: row.name,
        password: row.password,
        planId: row.plan_id,
        credits: row.credits,
        maxCredits: row.max_credits,
        resetCode: row.reset_code,
        avatarUrl: row.avatar_url,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    },

    async create(user: Omit<UserDTO, 'id'> & { password: string }): Promise<UserDTO> {
      const now = new Date().toISOString();
      const id = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      let finalId = id;
      if (isMongoActive()) {
        try {
          const doc = await User.create({
            _id: id,
            ...user,
            credits: user.credits ?? 25,
            maxCredits: user.maxCredits ?? 25,
            planId: user.planId ?? 'free',
          });
          finalId = doc._id.toString();
        } catch (err: any) {
          console.warn('[dbRepository] Mongo create user failed, using localDb:', err.message);
        }
      }
      try {
        localDb.prepare(`
          INSERT OR REPLACE INTO users (id, email, name, password, plan_id, credits, max_credits, reset_code, avatar_url, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          finalId,
          user.email.toLowerCase(),
          user.name,
          user.password,
          user.planId ?? 'free',
          user.credits ?? 25,
          user.maxCredits ?? 25,
          user.resetCode ?? null,
          user.avatarUrl ?? '',
          now,
          now
        );
      } catch {}
      return {
        id: finalId,
        email: user.email.toLowerCase(),
        name: user.name,
        planId: user.planId ?? 'free',
        credits: user.credits ?? 25,
        maxCredits: user.maxCredits ?? 25,
        createdAt: now,
      };
    },

    async update(id: string, updates: Partial<UserDTO> & { password?: string }): Promise<UserDTO | null> {
      const now = new Date().toISOString();
      if (isMongoActive()) {
        try {
          await User.findByIdAndUpdate(id, { ...updates, updatedAt: new Date() }, { returnDocument: 'after' });
        } catch (err: any) {
          console.warn('[dbRepository] Mongo update user failed:', err.message);
        }
      }
      const clauses: string[] = [];
      const values: any[] = [];
      if (updates.name !== undefined) { clauses.push('name = ?'); values.push(updates.name); }
      if (updates.email !== undefined) { clauses.push('email = ?'); values.push(updates.email.toLowerCase()); }
      if (updates.password !== undefined) { clauses.push('password = ?'); values.push(updates.password); }
      if (updates.planId !== undefined) { clauses.push('plan_id = ?'); values.push(updates.planId); }
      if (updates.credits !== undefined) { clauses.push('credits = ?'); values.push(updates.credits); }
      if (updates.maxCredits !== undefined) { clauses.push('max_credits = ?'); values.push(updates.maxCredits); }
      if (updates.resetCode !== undefined) { clauses.push('reset_code = ?'); values.push(updates.resetCode); }
      if (updates.avatarUrl !== undefined) { clauses.push('avatar_url = ?'); values.push(updates.avatarUrl); }

      if (clauses.length > 0) {
        clauses.push('updated_at = ?');
        values.push(now);
        values.push(id);
        try {
          localDb.prepare(`UPDATE users SET ${clauses.join(', ')} WHERE id = ?`).run(...values);
        } catch {}
      }
      return this.findById(id);
    },
  },

  generations: {
    async create(gen: Omit<GenerationDTO, 'id' | 'createdAt'>): Promise<GenerationDTO> {
      const id = `crt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const now = new Date().toISOString();

      if (isMongoActive()) {
        try {
          await Generation.create({
            _id: id,
            ...gen,
            collectionName: gen.collectionName ?? null,
          });
        } catch (err: any) {
          console.warn('[dbRepository] Mongo create generation failed, mirroring to localDb:', err.message);
        }
      }

      try {
        localDb.prepare(`
          INSERT OR REPLACE INTO generations (
            id, user_id, title, prompt, negative_prompt, mode, generation_type, aspect_ratio,
            resolution, style, model, variations, duration, motion, fps, reference_asset_url,
            reference_asset_name, reference_media_kind, seed, dimensions, credits_used,
            provider, media_url, media_kind, status, saved, collection_name, created_at, updated_at
          ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?, ?
          )
        `).run(
          id,
          gen.userId,
          gen.title,
          gen.prompt,
          gen.negativePrompt || '',
          gen.mode,
          gen.generationType,
          gen.aspectRatio,
          gen.resolution,
          gen.style,
          gen.model,
          gen.variations,
          gen.duration || '4s',
          gen.motion || 'Static',
          gen.fps || '24 fps',
          gen.referenceAssetUrl || null,
          gen.referenceAssetName || null,
          gen.referenceMediaKind || null,
          gen.seed,
          gen.dimensions,
          gen.creditsUsed,
          gen.provider,
          gen.mediaUrl,
          gen.mediaKind,
          gen.status,
          gen.saved ? 1 : 0,
          gen.collectionName || null,
          now,
          now
        );
      } catch {}

      return {
        id,
        ...gen,
        createdAt: now,
      };
    },

    async findById(id: string, userId: string): Promise<GenerationDTO | null> {
      if (isMongoActive()) {
        try {
          const doc = await Generation.findOne({ _id: id, userId });
          if (doc) {
            return {
              id: doc._id.toString(),
              userId: doc.userId,
              title: doc.title,
              prompt: doc.prompt,
              negativePrompt: doc.negativePrompt,
              mode: doc.mode,
              generationType: doc.generationType,
              aspectRatio: doc.aspectRatio,
              resolution: doc.resolution,
              style: doc.style,
              model: doc.model,
              variations: doc.variations,
              duration: doc.duration,
              motion: doc.motion,
              fps: doc.fps,
              seed: doc.seed,
              dimensions: doc.dimensions,
              creditsUsed: doc.creditsUsed,
              provider: doc.provider,
              mediaUrl: doc.mediaUrl,
              mediaKind: doc.mediaKind,
              status: doc.status,
              saved: doc.saved,
              collectionName: doc.collectionName,
              referenceAssetUrl: doc.referenceAssetUrl,
              referenceAssetName: doc.referenceAssetName,
              referenceMediaKind: doc.referenceMediaKind,
              createdAt: doc.createdAt.toISOString(),
            };
          }
        } catch (err: any) {
          console.warn('[dbRepository] Mongo findById failed, falling back to localDb:', err.message);
        }
      }
      const row: any = localDb.prepare('SELECT * FROM generations WHERE id = ? AND user_id = ?').get(id, userId);
      if (!row) return null;
      return {
        id: row.id,
        userId: row.user_id,
        title: row.title,
        prompt: row.prompt,
        negativePrompt: row.negative_prompt,
        mode: row.mode,
        generationType: row.generation_type || 'text-to-image',
        aspectRatio: row.aspect_ratio,
        resolution: row.resolution,
        style: row.style,
        model: row.model,
        variations: row.variations,
        duration: row.duration,
        motion: row.motion,
        fps: row.fps,
        seed: row.seed,
        dimensions: row.dimensions,
        creditsUsed: row.credits_used,
        provider: row.provider,
        mediaUrl: row.media_url,
        mediaKind: row.media_kind,
        status: row.status,
        saved: Boolean(row.saved),
        collectionName: row.collection_name,
        referenceAssetUrl: row.reference_asset_url,
        referenceAssetName: row.reference_asset_name,
        referenceMediaKind: row.reference_media_kind,
        createdAt: row.created_at,
      };
    },

    async listByUser(
      userId: string,
      filter?: string,
      collection?: string,
      search?: string
    ): Promise<GenerationDTO[]> {
      if (isMongoActive()) {
        try {
          const query: any = { userId };
          if (filter === 'saved') query.saved = true;
          if (filter === 'image' || filter === 'video') query.mode = filter;
          if (filter === 'collections' && collection && collection !== 'all') {
            query.collectionName = collection;
          }
          if (search) {
            query.$or = [
              { title: { $regex: search, $options: 'i' } },
              { prompt: { $regex: search, $options: 'i' } },
            ];
          }
          const docs = await Generation.find(query).sort({ createdAt: -1 });
          return docs.map((doc: any) => ({
            id: doc._id.toString(),
            userId: doc.userId,
            title: doc.title,
            prompt: doc.prompt,
            negativePrompt: doc.negativePrompt,
            mode: doc.mode,
            generationType: doc.generationType,
            aspectRatio: doc.aspectRatio,
            resolution: doc.resolution,
            style: doc.style,
            model: doc.model,
            variations: doc.variations,
            duration: doc.duration,
            motion: doc.motion,
            fps: doc.fps,
            seed: doc.seed,
            dimensions: doc.dimensions,
            creditsUsed: doc.creditsUsed,
            provider: doc.provider,
            mediaUrl: doc.mediaUrl,
            mediaKind: doc.mediaKind,
            status: doc.status,
            saved: doc.saved,
            collectionName: doc.collectionName,
            referenceAssetUrl: doc.referenceAssetUrl,
            referenceAssetName: doc.referenceAssetName,
            referenceMediaKind: doc.referenceMediaKind,
            createdAt: doc.createdAt.toISOString(),
          }));
        } catch (err: any) {
          console.warn('[dbRepository] Mongo listByUser failed, falling back to localDb:', err.message);
        }
      }

      let q = 'SELECT * FROM generations WHERE user_id = ?';
      const params: any[] = [userId];

      if (filter === 'saved') {
        q += ' AND saved = 1';
      } else if (filter === 'image' || filter === 'video') {
        q += ' AND mode = ?';
        params.push(filter);
      } else if (filter === 'collections' && collection && collection !== 'all') {
        q += ' AND collection_name = ?';
        params.push(collection);
      }

      if (search) {
        q += ' AND (title LIKE ? OR prompt LIKE ?)';
        const term = `%${search.trim()}%`;
        params.push(term, term);
      }

      q += ' ORDER BY datetime(created_at) DESC';

      const rows: any[] = localDb.prepare(q).all(...params);
      return rows.map((row) => ({
        id: row.id,
        userId: row.user_id,
        title: row.title,
        prompt: row.prompt,
        negativePrompt: row.negative_prompt,
        mode: row.mode,
        generationType: row.generation_type || 'text-to-image',
        aspectRatio: row.aspect_ratio,
        resolution: row.resolution,
        style: row.style,
        model: row.model,
        variations: row.variations,
        duration: row.duration,
        motion: row.motion,
        fps: row.fps,
        seed: row.seed,
        dimensions: row.dimensions,
        creditsUsed: row.credits_used,
        provider: row.provider,
        mediaUrl: row.media_url,
        mediaKind: row.media_kind,
        status: row.status,
        saved: Boolean(row.saved),
        collectionName: row.collection_name,
        referenceAssetUrl: row.reference_asset_url,
        referenceAssetName: row.reference_asset_name,
        referenceMediaKind: row.reference_media_kind,
        createdAt: row.created_at,
      }));
    },

    async update(id: string, userId: string, updates: Partial<GenerationDTO>): Promise<GenerationDTO | null> {
      const now = new Date().toISOString();
      if (isMongoActive()) {
        try {
          await Generation.findOneAndUpdate(
            { _id: id, userId },
            { ...updates, updatedAt: new Date() },
            { returnDocument: 'after' }
          );
        } catch (err: any) {
          console.warn('[dbRepository] Mongo update generation failed:', err.message);
        }
      }

      const clauses: string[] = [];
      const values: any[] = [];
      if (updates.title !== undefined) { clauses.push('title = ?'); values.push(updates.title); }
      if (updates.saved !== undefined) { clauses.push('saved = ?'); values.push(updates.saved ? 1 : 0); }
      if (updates.collectionName !== undefined) { clauses.push('collection_name = ?'); values.push(updates.collectionName); }
      if (updates.status !== undefined) { clauses.push('status = ?'); values.push(updates.status); }

      if (clauses.length > 0) {
        clauses.push('updated_at = ?');
        values.push(now);
        values.push(id, userId);
        try {
          localDb.prepare(`UPDATE generations SET ${clauses.join(', ')} WHERE id = ? AND user_id = ?`).run(...values);
        } catch {}
      }
      return this.findById(id, userId);
    },

    async delete(id: string, userId: string): Promise<boolean> {
      if (isMongoActive()) {
        try {
          await Generation.deleteOne({ _id: id, userId });
        } catch (err: any) {
          console.warn('[dbRepository] Mongo delete generation failed:', err.message);
        }
      }
      try {
        const res = localDb.prepare('DELETE FROM generations WHERE id = ? AND user_id = ?').run(id, userId);
        return res.changes > 0;
      } catch {
        return true;
      }
    },

    async countByUser(userId: string): Promise<{ total: number; images: number; videos: number; saved: number }> {
      if (isMongoActive()) {
        try {
          const [total, images, videos, saved] = await Promise.all([
            Generation.countDocuments({ userId }),
            Generation.countDocuments({ userId, mode: 'image' }),
            Generation.countDocuments({ userId, mode: 'video' }),
            Generation.countDocuments({ userId, saved: true }),
          ]);
          return { total, images, videos, saved };
        } catch (err: any) {
          console.warn('[dbRepository] Mongo countByUser failed, using localDb:', err.message);
        }
      }

      const total = (localDb.prepare('SELECT COUNT(*) as count FROM generations WHERE user_id = ?').get(userId) as any)?.count || 0;
      const images = (localDb.prepare("SELECT COUNT(*) as count FROM generations WHERE user_id = ? AND mode = 'image'").get(userId) as any)?.count || 0;
      const videos = (localDb.prepare("SELECT COUNT(*) as count FROM generations WHERE user_id = ? AND mode = 'video'").get(userId) as any)?.count || 0;
      const saved = (localDb.prepare('SELECT COUNT(*) as count FROM generations WHERE user_id = ? AND saved = 1').get(userId) as any)?.count || 0;

      return { total, images, videos, saved };
    },
  },

  usageQuota: {
    async log(tx: Omit<UsageQuotaDTO, 'id' | 'createdAt'>): Promise<UsageQuotaDTO> {
      const id = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const now = new Date().toISOString();

      if (isMongoActive()) {
        try {
          await UsageQuota.create({ ...tx, _id: id });
        } catch (err: any) {
          console.warn('[dbRepository] Mongo usageQuota.log failed:', err.message);
        }
      }

      try {
        localDb.prepare(`
          INSERT INTO usage_quota (id, user_id, label, mode, delta, balance_after, timestamp, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(id, tx.userId, tx.label, tx.mode, tx.delta, tx.balanceAfter, tx.timestamp, now);
      } catch {}

      return { id, ...tx, createdAt: now };
    },

    async listByUser(userId: string): Promise<UsageQuotaDTO[]> {
      if (isMongoActive()) {
        try {
          const docs = await UsageQuota.find({ userId }).sort({ createdAt: -1 });
          return docs.map((d: any) => ({
            id: d._id.toString(),
            userId: d.userId,
            label: d.label,
            mode: d.mode,
            delta: d.delta,
            balanceAfter: d.balanceAfter,
            timestamp: d.timestamp,
            createdAt: d.createdAt.toISOString(),
          }));
        } catch (err: any) {
          console.warn('[dbRepository] Mongo usageQuota.listByUser failed, using localDb:', err.message);
        }
      }

      const rows: any[] = localDb.prepare('SELECT * FROM usage_quota WHERE user_id = ? ORDER BY datetime(created_at) DESC').all(userId);
      return rows.map((r: any) => ({
        id: r.id,
        userId: r.user_id,
        label: r.label,
        mode: r.mode,
        delta: r.delta,
        balanceAfter: r.balance_after,
        timestamp: r.timestamp,
        createdAt: r.created_at,
      }));
    },
  },

  collections: {
    async list(userId: string): Promise<string[]> {
      if (isMongoActive()) {
        try {
          const docs = await Collection.find({ userId }).sort({ name: 1 });
          return docs.map((d: any) => d.name);
        } catch (err: any) {
          console.warn('[dbRepository] Mongo collections.list failed, using localDb:', err.message);
        }
      }
      const rows: any[] = localDb.prepare('SELECT name FROM collections WHERE user_id = ? ORDER BY name ASC').all(userId);
      return rows.map((r: any) => r.name);
    },

    async create(userId: string, name: string): Promise<string> {
      const trimmed = name.trim();
      const now = new Date().toISOString();
      const id = `col-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

      if (isMongoActive()) {
        try {
          await Collection.findOneAndUpdate(
            { userId, name: trimmed },
            { userId, name: trimmed },
            { upsert: true }
          );
        } catch (err: any) {
          console.warn('[dbRepository] Mongo collections.create failed:', err.message);
        }
      }

      try {
        const existing = localDb.prepare('SELECT id FROM collections WHERE user_id = ? AND name = ?').get(userId, trimmed);
        if (!existing) {
          localDb.prepare('INSERT INTO collections (id, user_id, name, created_at) VALUES (?, ?, ?, ?)').run(id, userId, trimmed, now);
        }
      } catch {}
      return trimmed;
    },

    async delete(userId: string, name: string): Promise<boolean> {
      if (isMongoActive()) {
        try {
          await Collection.deleteOne({ userId, name });
          await Generation.updateMany({ userId, collectionName: name }, { collectionName: null });
        } catch (err: any) {
          console.warn('[dbRepository] Mongo collections.delete failed:', err.message);
        }
      }
      try {
        localDb.prepare('DELETE FROM collections WHERE user_id = ? AND name = ?').run(userId, name);
        localDb.prepare('UPDATE generations SET collection_name = NULL WHERE user_id = ? AND collection_name = ?').run(userId, name);
      } catch {}
      return true;
    },
  },
};

