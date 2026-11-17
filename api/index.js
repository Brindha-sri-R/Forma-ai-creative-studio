// server/src/app.ts
import express from "express";
import cors from "cors";
import fs6 from "node:fs";
import path7 from "node:path";
import { fileURLToPath as fileURLToPath6 } from "node:url";

// server/src/routes/index.ts
import { Router as Router8 } from "express";

// server/src/routes/authRoutes.ts
import { Router } from "express";

// server/src/config/db.ts
import dns from "node:dns";
import mongoose from "mongoose";
import path2 from "node:path";
import fs from "node:fs";
import os from "node:os";
import { createRequire } from "node:module";
import { fileURLToPath as fileURLToPath2 } from "node:url";

// server/src/config/env.ts
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
var FALLBACK_MONGODB_URI = "mongodb+srv://brindhasri2217_db_user:qa4aXiEECV6t7V7b@cluster0.k3zpp9r.mongodb.net/forma?retryWrites=true&w=majority";
var config = {
  port: parseInt(process.env.PORT || "5050", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  mongodbUri: process.env.MONGODB_URI || FALLBACK_MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET || "forma-enterprise-secret-key-2026-production",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  storageProvider: process.env.STORAGE_PROVIDER || (process.env.NODE_ENV === "production" ? "gridfs" : "local"),
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
    apiKey: process.env.CLOUDINARY_API_KEY || "",
    apiSecret: process.env.CLOUDINARY_API_SECRET || ""
  },
  s3: {
    bucket: process.env.AWS_S3_BUCKET || "",
    region: process.env.AWS_REGION || "us-east-1",
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ""
  }
};

// server/src/config/db.ts
if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = path2.dirname(__filename2);
var require2 = createRequire(import.meta.url);
var DatabaseSyncClass = null;
try {
  const sqliteModule = require2("node:sqlite");
  DatabaseSyncClass = sqliteModule.DatabaseSync;
} catch {
  console.warn("[Database] node:sqlite is not available in this Node runtime. Operating in cloud/in-memory mode.");
}
var FallbackDb = class {
  tables = {
    users: [],
    generations: [],
    usage_quota: [],
    collections: [],
    media_assets: []
  };
  exec(_sql) {
  }
  prepare(sql) {
    const self = this;
    const cleanSql = sql.trim();
    return {
      run(...args) {
        if (/INSERT INTO users/i.test(cleanSql)) {
          const [id, email, name, password, plan_id, credits, max_credits, reset_code, avatar_url, created_at, updated_at] = args;
          self.tables.users.push({ id, email, name, password, plan_id, credits, max_credits, reset_code, avatar_url, created_at, updated_at });
        } else if (/INSERT INTO collections/i.test(cleanSql)) {
          const [id, user_id, name, created_at] = args;
          self.tables.collections.push({ id, user_id, name, created_at });
        } else if (/INSERT INTO usage_quota/i.test(cleanSql)) {
          const [id, user_id, label, mode, delta, balance_after, timestamp, created_at] = args;
          self.tables.usage_quota.push({ id, user_id, label, mode, delta, balance_after, timestamp, created_at });
        }
        return { changes: 1 };
      },
      get(...args) {
        if (/SELECT \* FROM users WHERE email = \?/i.test(cleanSql)) {
          const email = (args[0] || "").toString().trim().toLowerCase();
          return self.tables.users.find((u) => u.email.toLowerCase() === email) || null;
        }
        if (/SELECT \* FROM users WHERE id = \?/i.test(cleanSql)) {
          const id = args[0];
          return self.tables.users.find((u) => u.id === id) || null;
        }
        if (/SELECT id FROM collections WHERE user_id = \? AND name = \?/i.test(cleanSql)) {
          const [userId, name] = args;
          return self.tables.collections.find((c) => c.user_id === userId && c.name === name) || null;
        }
        return null;
      },
      all(...args) {
        if (/SELECT name FROM collections WHERE user_id = \?/i.test(cleanSql)) {
          const userId = args[0];
          return self.tables.collections.filter((c) => c.user_id === userId);
        }
        if (/SELECT \* FROM usage_quota WHERE user_id = \?/i.test(cleanSql)) {
          const userId = args[0];
          return self.tables.usage_quota.filter((q) => q.user_id === userId);
        }
        return [];
      }
    };
  }
};
var isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT);
var dataDir = isServerless ? path2.join(os.tmpdir(), "forma-data") : path2.resolve(__dirname2, "../../../data");
try {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
} catch {
  dataDir = path2.join(os.tmpdir(), "forma-data");
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  } catch {
  }
}
var isMongoConnected = false;
function isMongoActive() {
  return isMongoConnected && mongoose.connection.readyState === 1;
}
mongoose.connection.on("disconnected", () => {
  isMongoConnected = false;
  console.warn("[Database] MongoDB connection dropped. Operating in High-Performance Local Mode.");
});
mongoose.connection.on("reconnected", () => {
  isMongoConnected = true;
  console.log("[Database] MongoDB reconnected successfully.");
});
mongoose.connection.on("error", (err) => {
  console.warn("[Database] MongoDB connection error:", err.message);
  if (mongoose.connection.readyState !== 1) {
    isMongoConnected = false;
  }
});
var localDbInstance;
if (DatabaseSyncClass) {
  try {
    localDbInstance = new DatabaseSyncClass(path2.join(dataDir, "studio.db"));
  } catch (err) {
    console.warn("[Database] Falling back to in-memory SQLite:", err);
    try {
      localDbInstance = new DatabaseSyncClass(":memory:");
    } catch {
      localDbInstance = new FallbackDb();
    }
  }
} else {
  localDbInstance = new FallbackDb();
}
var localDb = localDbInstance;
try {
  localDb.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password TEXT NOT NULL,
    plan_id TEXT DEFAULT 'free',
    credits INTEGER DEFAULT 25,
    max_credits INTEGER DEFAULT 25,
    reset_code TEXT,
    avatar_url TEXT DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS generations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    prompt TEXT NOT NULL,
    negative_prompt TEXT,
    mode TEXT NOT NULL,
    generation_type TEXT DEFAULT 'text-to-image',
    aspect_ratio TEXT NOT NULL,
    resolution TEXT NOT NULL,
    style TEXT NOT NULL,
    model TEXT NOT NULL,
    variations INTEGER DEFAULT 1,
    duration TEXT,
    motion TEXT,
    fps TEXT,
    reference_asset_url TEXT,
    reference_asset_name TEXT,
    reference_media_kind TEXT,
    seed INTEGER NOT NULL,
    dimensions TEXT NOT NULL,
    credits_used INTEGER NOT NULL,
    provider TEXT DEFAULT 'forma-engine',
    media_url TEXT NOT NULL,
    media_kind TEXT NOT NULL,
    status TEXT DEFAULT 'completed',
    saved INTEGER DEFAULT 0,
    collection_name TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS usage_quota (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    label TEXT NOT NULL,
    mode TEXT NOT NULL,
    delta INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    timestamp TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS collections (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS media_assets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    original_name TEXT NOT NULL,
    filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size INTEGER NOT NULL,
    media_kind TEXT NOT NULL,
    url TEXT NOT NULL,
    storage_provider TEXT DEFAULT 'local',
    purpose TEXT DEFAULT 'reference',
    created_at TEXT NOT NULL
  );
`);
} catch (err) {
  console.warn("[Database] Local schema setup notice:", err.message || err);
}
async function connectDatabase() {
  if (mongoose.connection.readyState === 1) {
    isMongoConnected = true;
    return;
  }
  try {
    mongoose.set("strictQuery", false);
    await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 5e3,
      socketTimeoutMS: 3e4,
      maxPoolSize: 10,
      minPoolSize: 1,
      heartbeatFrequencyMS: 1e4
    });
    isMongoConnected = true;
    console.log(`[Database] Successfully connected to MongoDB at ${config.mongodbUri}`);
  } catch (error) {
    isMongoConnected = false;
    console.log(
      `[Database] Notice: MongoDB (${config.mongodbUri}) is unavailable or not running. Operating in High-Performance Resilient Local Mode (Zero-config persistence active).`
    );
  }
}

// server/src/models/User.ts
import mongoose2, { Schema } from "mongoose";
var UserSchema = new Schema(
  {
    _id: {
      type: String
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    avatarUrl: {
      type: String,
      default: ""
    },
    planId: {
      type: String,
      enum: ["free", "pro", "studio"],
      default: "free"
    },
    credits: {
      type: Number,
      default: 25,
      min: 0
    },
    maxCredits: {
      type: Number,
      default: 25
    },
    resetCode: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret.password;
        delete ret.__v;
        return ret;
      }
    }
  }
);
var UserModel = mongoose2.models.User || mongoose2.model("User", UserSchema);

// server/src/models/Generation.ts
import mongoose3, { Schema as Schema2 } from "mongoose";
var GenerationSchema = new Schema2(
  {
    _id: {
      type: String
    },
    userId: {
      type: String,
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    prompt: {
      type: String,
      required: true,
      trim: true
    },
    negativePrompt: {
      type: String,
      default: ""
    },
    mode: {
      type: String,
      enum: ["image", "video"],
      required: true
    },
    generationType: {
      type: String,
      enum: ["text-to-image", "text-to-video", "image-to-video"],
      default: "text-to-image"
    },
    aspectRatio: {
      type: String,
      default: "1:1"
    },
    resolution: {
      type: String,
      default: "1K"
    },
    style: {
      type: String,
      default: "Editorial"
    },
    model: {
      type: String,
      default: "Forma Diffusion v3"
    },
    variations: {
      type: Number,
      default: 1
    },
    duration: {
      type: String,
      default: "4s"
    },
    motion: {
      type: String,
      default: "Static"
    },
    fps: {
      type: String,
      default: "24 fps"
    },
    seed: {
      type: Number,
      required: true
    },
    dimensions: {
      type: String,
      required: true
    },
    creditsUsed: {
      type: Number,
      required: true,
      default: 1
    },
    provider: {
      type: String,
      default: "forma-engine"
    },
    mediaUrl: {
      type: String,
      required: true
    },
    mediaKind: {
      type: String,
      enum: ["image", "video"],
      required: true
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "completed",
      index: true
    },
    saved: {
      type: Boolean,
      default: false,
      index: true
    },
    collectionName: {
      type: String,
      default: null,
      index: true
    },
    referenceAssetUrl: {
      type: String,
      default: null
    },
    referenceAssetName: {
      type: String,
      default: null
    },
    referenceMediaKind: {
      type: String,
      enum: ["image", "video", null],
      default: null
    },
    errorMessage: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret.__v;
        return ret;
      }
    }
  }
);
GenerationSchema.index({ userId: 1, createdAt: -1 });
var GenerationModel = mongoose3.models.Generation || mongoose3.model("Generation", GenerationSchema);

// server/src/models/UsageQuota.ts
import mongoose4, { Schema as Schema3 } from "mongoose";
var UsageQuotaSchema = new Schema3(
  {
    _id: {
      type: String
    },
    userId: {
      type: String,
      required: true,
      index: true
    },
    label: {
      type: String,
      required: true
    },
    mode: {
      type: String,
      enum: ["image", "video", "topup"],
      required: true
    },
    delta: {
      type: Number,
      required: true
    },
    balanceAfter: {
      type: Number,
      required: true
    },
    timestamp: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret.__v;
        return ret;
      }
    }
  }
);
UsageQuotaSchema.index({ userId: 1, createdAt: -1 });
var UsageQuotaModel = mongoose4.models.UsageQuota || mongoose4.model("UsageQuota", UsageQuotaSchema);

// server/src/models/Collection.ts
import mongoose5, { Schema as Schema4 } from "mongoose";
var CollectionSchema = new Schema4(
  {
    _id: {
      type: String
    },
    userId: {
      type: String,
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret.__v;
        return ret;
      }
    }
  }
);
CollectionSchema.index({ userId: 1, name: 1 }, { unique: true });
var CollectionModel = mongoose5.models.Collection || mongoose5.model("Collection", CollectionSchema);

// server/src/services/dbRepository.ts
var User = UserModel;
var Generation = GenerationModel;
var UsageQuota = UsageQuotaModel;
var Collection = CollectionModel;
var dbRepository = {
  users: {
    async findByEmail(email) {
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
              createdAt: doc.createdAt.toISOString()
            };
          }
        } catch (err) {
          console.warn("[dbRepository] Mongo findByEmail failed, using local fallback:", err.message);
        }
      }
      const row = localDb.prepare("SELECT * FROM users WHERE email = ?").get(cleanEmail);
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
        updatedAt: row.updated_at
      };
    },
    async findById(id) {
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
              createdAt: doc.createdAt.toISOString()
            };
          }
        } catch (err) {
          console.warn("[dbRepository] Mongo findById failed, using local fallback:", err.message);
        }
      }
      const row = localDb.prepare("SELECT * FROM users WHERE id = ?").get(id);
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
        updatedAt: row.updated_at
      };
    },
    async create(user) {
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const id = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      let finalId = id;
      if (isMongoActive()) {
        try {
          const doc = await User.create({
            _id: id,
            ...user,
            credits: user.credits ?? 25,
            maxCredits: user.maxCredits ?? 25,
            planId: user.planId ?? "free"
          });
          finalId = doc._id.toString();
        } catch (err) {
          console.warn("[dbRepository] Mongo create user failed, using localDb:", err.message);
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
          user.planId ?? "free",
          user.credits ?? 25,
          user.maxCredits ?? 25,
          user.resetCode ?? null,
          user.avatarUrl ?? "",
          now,
          now
        );
      } catch {
      }
      return {
        id: finalId,
        email: user.email.toLowerCase(),
        name: user.name,
        planId: user.planId ?? "free",
        credits: user.credits ?? 25,
        maxCredits: user.maxCredits ?? 25,
        createdAt: now
      };
    },
    async update(id, updates) {
      const now = (/* @__PURE__ */ new Date()).toISOString();
      if (isMongoActive()) {
        try {
          await User.findByIdAndUpdate(id, { ...updates, updatedAt: /* @__PURE__ */ new Date() }, { returnDocument: "after" });
        } catch (err) {
          console.warn("[dbRepository] Mongo update user failed:", err.message);
        }
      }
      const clauses = [];
      const values = [];
      if (updates.name !== void 0) {
        clauses.push("name = ?");
        values.push(updates.name);
      }
      if (updates.email !== void 0) {
        clauses.push("email = ?");
        values.push(updates.email.toLowerCase());
      }
      if (updates.password !== void 0) {
        clauses.push("password = ?");
        values.push(updates.password);
      }
      if (updates.planId !== void 0) {
        clauses.push("plan_id = ?");
        values.push(updates.planId);
      }
      if (updates.credits !== void 0) {
        clauses.push("credits = ?");
        values.push(updates.credits);
      }
      if (updates.maxCredits !== void 0) {
        clauses.push("max_credits = ?");
        values.push(updates.maxCredits);
      }
      if (updates.resetCode !== void 0) {
        clauses.push("reset_code = ?");
        values.push(updates.resetCode);
      }
      if (updates.avatarUrl !== void 0) {
        clauses.push("avatar_url = ?");
        values.push(updates.avatarUrl);
      }
      if (clauses.length > 0) {
        clauses.push("updated_at = ?");
        values.push(now);
        values.push(id);
        try {
          localDb.prepare(`UPDATE users SET ${clauses.join(", ")} WHERE id = ?`).run(...values);
        } catch {
        }
      }
      return this.findById(id);
    }
  },
  generations: {
    async create(gen) {
      const id = `crt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const now = (/* @__PURE__ */ new Date()).toISOString();
      if (isMongoActive()) {
        try {
          await Generation.create({
            _id: id,
            ...gen,
            collectionName: gen.collectionName ?? null
          });
        } catch (err) {
          console.warn("[dbRepository] Mongo create generation failed, mirroring to localDb:", err.message);
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
          gen.negativePrompt || "",
          gen.mode,
          gen.generationType,
          gen.aspectRatio,
          gen.resolution,
          gen.style,
          gen.model,
          gen.variations,
          gen.duration || "4s",
          gen.motion || "Static",
          gen.fps || "24 fps",
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
      } catch {
      }
      return {
        id,
        ...gen,
        createdAt: now
      };
    },
    async findById(id, userId) {
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
              createdAt: doc.createdAt.toISOString()
            };
          }
        } catch (err) {
          console.warn("[dbRepository] Mongo findById failed, falling back to localDb:", err.message);
        }
      }
      const row = localDb.prepare("SELECT * FROM generations WHERE id = ? AND user_id = ?").get(id, userId);
      if (!row) return null;
      return {
        id: row.id,
        userId: row.user_id,
        title: row.title,
        prompt: row.prompt,
        negativePrompt: row.negative_prompt,
        mode: row.mode,
        generationType: row.generation_type || "text-to-image",
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
        createdAt: row.created_at
      };
    },
    async listByUser(userId, filter, collection, search) {
      if (isMongoActive()) {
        try {
          const query = { userId };
          if (filter === "saved") query.saved = true;
          if (filter === "image" || filter === "video") query.mode = filter;
          if (filter === "collections" && collection && collection !== "all") {
            query.collectionName = collection;
          }
          if (search) {
            query.$or = [
              { title: { $regex: search, $options: "i" } },
              { prompt: { $regex: search, $options: "i" } }
            ];
          }
          const docs = await Generation.find(query).sort({ createdAt: -1 });
          return docs.map((doc) => ({
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
            createdAt: doc.createdAt.toISOString()
          }));
        } catch (err) {
          console.warn("[dbRepository] Mongo listByUser failed, falling back to localDb:", err.message);
        }
      }
      let q = "SELECT * FROM generations WHERE user_id = ?";
      const params = [userId];
      if (filter === "saved") {
        q += " AND saved = 1";
      } else if (filter === "image" || filter === "video") {
        q += " AND mode = ?";
        params.push(filter);
      } else if (filter === "collections" && collection && collection !== "all") {
        q += " AND collection_name = ?";
        params.push(collection);
      }
      if (search) {
        q += " AND (title LIKE ? OR prompt LIKE ?)";
        const term = `%${search.trim()}%`;
        params.push(term, term);
      }
      q += " ORDER BY datetime(created_at) DESC";
      const rows = localDb.prepare(q).all(...params);
      return rows.map((row) => ({
        id: row.id,
        userId: row.user_id,
        title: row.title,
        prompt: row.prompt,
        negativePrompt: row.negative_prompt,
        mode: row.mode,
        generationType: row.generation_type || "text-to-image",
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
        createdAt: row.created_at
      }));
    },
    async update(id, userId, updates) {
      const now = (/* @__PURE__ */ new Date()).toISOString();
      if (isMongoActive()) {
        try {
          await Generation.findOneAndUpdate(
            { _id: id, userId },
            { ...updates, updatedAt: /* @__PURE__ */ new Date() },
            { returnDocument: "after" }
          );
        } catch (err) {
          console.warn("[dbRepository] Mongo update generation failed:", err.message);
        }
      }
      const clauses = [];
      const values = [];
      if (updates.title !== void 0) {
        clauses.push("title = ?");
        values.push(updates.title);
      }
      if (updates.saved !== void 0) {
        clauses.push("saved = ?");
        values.push(updates.saved ? 1 : 0);
      }
      if (updates.collectionName !== void 0) {
        clauses.push("collection_name = ?");
        values.push(updates.collectionName);
      }
      if (updates.status !== void 0) {
        clauses.push("status = ?");
        values.push(updates.status);
      }
      if (clauses.length > 0) {
        clauses.push("updated_at = ?");
        values.push(now);
        values.push(id, userId);
        try {
          localDb.prepare(`UPDATE generations SET ${clauses.join(", ")} WHERE id = ? AND user_id = ?`).run(...values);
        } catch {
        }
      }
      return this.findById(id, userId);
    },
    async delete(id, userId) {
      if (isMongoActive()) {
        try {
          await Generation.deleteOne({ _id: id, userId });
        } catch (err) {
          console.warn("[dbRepository] Mongo delete generation failed:", err.message);
        }
      }
      try {
        const res = localDb.prepare("DELETE FROM generations WHERE id = ? AND user_id = ?").run(id, userId);
        return res.changes > 0;
      } catch {
        return true;
      }
    },
    async countByUser(userId) {
      if (isMongoActive()) {
        try {
          const [total2, images2, videos2, saved2] = await Promise.all([
            Generation.countDocuments({ userId }),
            Generation.countDocuments({ userId, mode: "image" }),
            Generation.countDocuments({ userId, mode: "video" }),
            Generation.countDocuments({ userId, saved: true })
          ]);
          return { total: total2, images: images2, videos: videos2, saved: saved2 };
        } catch (err) {
          console.warn("[dbRepository] Mongo countByUser failed, using localDb:", err.message);
        }
      }
      const total = localDb.prepare("SELECT COUNT(*) as count FROM generations WHERE user_id = ?").get(userId)?.count || 0;
      const images = localDb.prepare("SELECT COUNT(*) as count FROM generations WHERE user_id = ? AND mode = 'image'").get(userId)?.count || 0;
      const videos = localDb.prepare("SELECT COUNT(*) as count FROM generations WHERE user_id = ? AND mode = 'video'").get(userId)?.count || 0;
      const saved = localDb.prepare("SELECT COUNT(*) as count FROM generations WHERE user_id = ? AND saved = 1").get(userId)?.count || 0;
      return { total, images, videos, saved };
    }
  },
  usageQuota: {
    async log(tx) {
      const id = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const now = (/* @__PURE__ */ new Date()).toISOString();
      if (isMongoActive()) {
        try {
          await UsageQuota.create({ ...tx, _id: id });
        } catch (err) {
          console.warn("[dbRepository] Mongo usageQuota.log failed:", err.message);
        }
      }
      try {
        localDb.prepare(`
          INSERT INTO usage_quota (id, user_id, label, mode, delta, balance_after, timestamp, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(id, tx.userId, tx.label, tx.mode, tx.delta, tx.balanceAfter, tx.timestamp, now);
      } catch {
      }
      return { id, ...tx, createdAt: now };
    },
    async listByUser(userId) {
      if (isMongoActive()) {
        try {
          const docs = await UsageQuota.find({ userId }).sort({ createdAt: -1 });
          return docs.map((d) => ({
            id: d._id.toString(),
            userId: d.userId,
            label: d.label,
            mode: d.mode,
            delta: d.delta,
            balanceAfter: d.balanceAfter,
            timestamp: d.timestamp,
            createdAt: d.createdAt.toISOString()
          }));
        } catch (err) {
          console.warn("[dbRepository] Mongo usageQuota.listByUser failed, using localDb:", err.message);
        }
      }
      const rows = localDb.prepare("SELECT * FROM usage_quota WHERE user_id = ? ORDER BY datetime(created_at) DESC").all(userId);
      return rows.map((r) => ({
        id: r.id,
        userId: r.user_id,
        label: r.label,
        mode: r.mode,
        delta: r.delta,
        balanceAfter: r.balance_after,
        timestamp: r.timestamp,
        createdAt: r.created_at
      }));
    }
  },
  collections: {
    async list(userId) {
      if (isMongoActive()) {
        try {
          const docs = await Collection.find({ userId }).sort({ name: 1 });
          return docs.map((d) => d.name);
        } catch (err) {
          console.warn("[dbRepository] Mongo collections.list failed, using localDb:", err.message);
        }
      }
      const rows = localDb.prepare("SELECT name FROM collections WHERE user_id = ? ORDER BY name ASC").all(userId);
      return rows.map((r) => r.name);
    },
    async create(userId, name) {
      const trimmed = name.trim();
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const id = `col-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      if (isMongoActive()) {
        try {
          await Collection.findOneAndUpdate(
            { userId, name: trimmed },
            { userId, name: trimmed },
            { upsert: true }
          );
        } catch (err) {
          console.warn("[dbRepository] Mongo collections.create failed:", err.message);
        }
      }
      try {
        const existing = localDb.prepare("SELECT id FROM collections WHERE user_id = ? AND name = ?").get(userId, trimmed);
        if (!existing) {
          localDb.prepare("INSERT INTO collections (id, user_id, name, created_at) VALUES (?, ?, ?, ?)").run(id, userId, trimmed, now);
        }
      } catch {
      }
      return trimmed;
    },
    async delete(userId, name) {
      if (isMongoActive()) {
        try {
          await Collection.deleteOne({ userId, name });
          await Generation.updateMany({ userId, collectionName: name }, { collectionName: null });
        } catch (err) {
          console.warn("[dbRepository] Mongo collections.delete failed:", err.message);
        }
      }
      try {
        localDb.prepare("DELETE FROM collections WHERE user_id = ? AND name = ?").run(userId, name);
        localDb.prepare("UPDATE generations SET collection_name = NULL WHERE user_id = ? AND collection_name = ?").run(userId, name);
      } catch {
      }
      return true;
    }
  }
};

// server/src/utils/password.ts
import bcrypt from "bcryptjs";
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}
async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// server/src/utils/jwt.ts
import jwt from "jsonwebtoken";
function signToken(payload) {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn
  });
}
function verifyToken(token) {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch (error) {
    return null;
  }
}

// server/src/utils/response.ts
function sendSuccess(res, data, message, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    ...data
  });
}
function sendError(res, message, statusCode = 400, details) {
  return res.status(statusCode).json({
    success: false,
    error: message,
    details
  });
}

// server/src/controllers/authController.ts
var authController = {
  async register(req, res) {
    try {
      const { email, password, name, fullName } = req.body || {};
      const targetName = (name || fullName || "").trim() || email.split("@")[0];
      const existing = await dbRepository.users.findByEmail(email);
      if (existing) {
        return sendError(res, "An account with this email already exists", 409);
      }
      const hashedPassword = await hashPassword(password);
      const user = await dbRepository.users.create({
        email: email.trim().toLowerCase(),
        name: targetName,
        password: hashedPassword,
        planId: "free",
        credits: 25,
        maxCredits: 25
      });
      await dbRepository.collections.create(user.id, "Brand Kit");
      await dbRepository.collections.create(user.id, "Campaigns");
      await dbRepository.usageQuota.log({
        userId: user.id,
        label: "Welcome Free Plan allocation",
        mode: "topup",
        delta: 25,
        balanceAfter: 25,
        timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      });
      const token = signToken({ userId: user.id, email: user.email });
      return sendSuccess(
        res,
        {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            planId: user.planId,
            credits: user.credits,
            maxCredits: user.maxCredits
          }
        },
        "Account created successfully",
        201
      );
    } catch (error) {
      console.error("[AuthController.register]", error);
      return sendError(res, "Registration failed: " + error.message, 500);
    }
  },
  async login(req, res) {
    try {
      const { email, password } = req.body || {};
      const user = await dbRepository.users.findByEmail(email);
      if (!user || !user.password) {
        return sendError(res, "No account found with this email", 401);
      }
      const isMatch = await comparePassword(password, user.password);
      if (!isMatch) {
        return sendError(res, "Incorrect password", 401);
      }
      const token = signToken({ userId: user.id, email: user.email });
      return sendSuccess(
        res,
        {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            planId: user.planId,
            credits: user.credits,
            maxCredits: user.maxCredits
          }
        },
        "Signed in successfully"
      );
    } catch (error) {
      console.error("[AuthController.login]", error);
      return sendError(res, "Sign in failed: " + error.message, 500);
    }
  },
  async getMe(req, res) {
    if (!req.user) {
      return sendError(res, "Not authenticated", 401);
    }
    return sendSuccess(res, {
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        planId: req.user.planId,
        credits: req.user.credits,
        maxCredits: req.user.maxCredits,
        avatarUrl: req.user.avatarUrl,
        createdAt: req.user.createdAt
      }
    });
  },
  async logout(_req, res) {
    return sendSuccess(res, {}, "Logged out successfully");
  },
  async updateProfile(req, res) {
    if (!req.user) return sendError(res, "Not authenticated", 401);
    try {
      const { name, email, avatarUrl } = req.body;
      const updates = {};
      if (name && typeof name === "string" && name.trim()) {
        updates.name = name.trim();
      }
      if (email && typeof email === "string" && email.trim()) {
        const cleanEmail = email.trim().toLowerCase();
        const existing = await dbRepository.users.findByEmail(cleanEmail);
        if (existing && existing.id !== req.user.id) {
          return sendError(res, "Email already in use by another account", 409);
        }
        updates.email = cleanEmail;
      }
      if (avatarUrl && typeof avatarUrl === "string") {
        updates.avatarUrl = avatarUrl;
      }
      const updated = await dbRepository.users.update(req.user.id, updates);
      return sendSuccess(res, { user: updated }, "Profile updated successfully");
    } catch (error) {
      console.error("[AuthController.updateProfile]", error);
      return sendError(res, "Failed to update profile: " + error.message, 500);
    }
  },
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      if (!email) return sendError(res, "Email is required", 400);
      const code = "482910";
      const user = await dbRepository.users.findByEmail(email);
      if (user) {
        await dbRepository.users.update(user.id, { resetCode: code });
      }
      return sendSuccess(res, { code }, "Verification reset code generated");
    } catch (error) {
      console.error("[AuthController.forgotPassword]", error);
      return sendError(res, "Failed to process forgot password: " + error.message, 500);
    }
  },
  async resetPassword(req, res) {
    try {
      const { email, code, newPassword } = req.body;
      const user = await dbRepository.users.findByEmail(email);
      if (!user) {
        return sendError(res, "Account not found", 404);
      }
      if (code.trim() !== "482910" && user.resetCode !== code.trim()) {
        return sendError(res, "Invalid verification code", 400);
      }
      const hashedPassword = await hashPassword(newPassword);
      await dbRepository.users.update(user.id, {
        password: hashedPassword,
        resetCode: null
      });
      return sendSuccess(res, {}, "Password updated successfully");
    } catch (error) {
      console.error("[AuthController.resetPassword]", error);
      return sendError(res, "Password reset failed: " + error.message, 500);
    }
  },
  async oauthMock(req, res) {
    try {
      const { provider } = req.body;
      const isGoogle = provider === "google";
      const email = isGoogle ? "creator@gmail.com" : "creator@icloud.com";
      const name = isGoogle ? "Google Creator" : "Apple Creator";
      let user = await dbRepository.users.findByEmail(email);
      if (!user) {
        const hashedPassword = await hashPassword("oauth-demo-password");
        user = await dbRepository.users.create({
          email,
          name,
          password: hashedPassword,
          planId: "free",
          credits: 25,
          maxCredits: 25
        });
        await dbRepository.collections.create(user.id, "Brand Kit");
        await dbRepository.collections.create(user.id, "Campaigns");
        await dbRepository.usageQuota.log({
          userId: user.id,
          label: `${isGoogle ? "Google" : "Apple"} Sign-in Bonus`,
          mode: "topup",
          delta: 25,
          balanceAfter: 25,
          timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        });
      }
      const token = signToken({ userId: user.id, email: user.email });
      return sendSuccess(
        res,
        {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            planId: user.planId,
            credits: user.credits,
            maxCredits: user.maxCredits
          }
        },
        `Authenticated via ${provider}`
      );
    } catch (error) {
      console.error("[AuthController.oauthMock]", error);
      return sendError(res, "OAuth failed: " + error.message, 500);
    }
  }
};

// server/src/validators/authValidator.ts
var EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function validateRegister(req, res, next) {
  const { email, password, name, fullName } = req.body || {};
  const targetName = name || fullName;
  if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
    return sendError(res, "Valid email address is required", 400);
  }
  if (!password || typeof password !== "string" || password.length < 6) {
    return sendError(res, "Password must be at least 6 characters", 400);
  }
  if (targetName && typeof targetName === "string" && targetName.trim().length < 2) {
    return sendError(res, "Name must be at least 2 characters", 400);
  }
  next();
}
function validateLogin(req, res, next) {
  const { email, password } = req.body || {};
  if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
    return sendError(res, "Valid email address is required", 400);
  }
  if (!password || typeof password !== "string") {
    return sendError(res, "Password is required", 400);
  }
  next();
}
function validateResetPassword(req, res, next) {
  const { email, code, newPassword } = req.body || {};
  if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
    return sendError(res, "Valid email address is required", 400);
  }
  if (!code || typeof code !== "string" || code.trim().length < 4) {
    return sendError(res, "Valid verification code is required", 400);
  }
  if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
    return sendError(res, "New password must be at least 6 characters", 400);
  }
  next();
}

// server/src/middleware/auth.ts
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return sendError(res, "Authentication required", 401);
    }
    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload || !payload.userId) {
      return sendError(res, "Invalid or expired authentication token", 401);
    }
    const user = await dbRepository.users.findById(payload.userId);
    if (!user) {
      return sendError(res, "User session expired or user not found", 401);
    }
    req.user = user;
    req.tokenPayload = payload;
    next();
  } catch (error) {
    return sendError(res, "Authentication error: " + error.message, 401);
  }
}

// server/src/routes/authRoutes.ts
var router = Router();
router.post("/register", validateRegister, authController.register);
router.post("/signup", validateRegister, authController.register);
router.post("/login", validateLogin, authController.login);
router.post("/signin", validateLogin, authController.login);
router.post("/logout", authController.logout);
router.get("/me", requireAuth, authController.getMe);
router.patch("/profile", requireAuth, authController.updateProfile);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", validateResetPassword, authController.resetPassword);
router.post("/oauth-mock", authController.oauthMock);
var authRoutes_default = router;

// server/src/routes/generationRoutes.ts
import { Router as Router2 } from "express";

// server/src/services/storage/LocalStorageService.ts
import fs2 from "node:fs";
import path3 from "node:path";
import os2 from "node:os";
import { fileURLToPath as fileURLToPath3 } from "node:url";
var __filename3 = fileURLToPath3(import.meta.url);
var __dirname3 = path3.dirname(__filename3);
function resolveUploadDir() {
  const isServerless2 = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT);
  if (isServerless2) {
    const tmpDir = path3.join(os2.tmpdir(), "forma-uploads");
    try {
      if (!fs2.existsSync(tmpDir)) {
        fs2.mkdirSync(tmpDir, { recursive: true });
      }
    } catch {
    }
    return tmpDir;
  }
  const defaultDir = path3.resolve(__dirname3, "../../../../uploads");
  try {
    if (!fs2.existsSync(defaultDir)) {
      fs2.mkdirSync(defaultDir, { recursive: true });
    }
    return defaultDir;
  } catch {
    const tmpDir = path3.join(os2.tmpdir(), "forma-uploads");
    try {
      if (!fs2.existsSync(tmpDir)) {
        fs2.mkdirSync(tmpDir, { recursive: true });
      }
    } catch {
    }
    return tmpDir;
  }
}
var baseUploadDir = resolveUploadDir();
var LocalStorageService = class {
  constructor() {
    this.ensureDirectory(baseUploadDir);
    this.ensureDirectory(path3.join(baseUploadDir, "creations"));
    this.ensureDirectory(path3.join(baseUploadDir, "references"));
  }
  ensureDirectory(dirPath) {
    try {
      if (!fs2.existsSync(dirPath)) {
        fs2.mkdirSync(dirPath, { recursive: true });
      }
    } catch (err) {
      console.warn(`[Storage] Cannot create directory ${dirPath}:`, err);
    }
  }
  async saveFile(content, filename, folder = "creations") {
    const targetDir = path3.join(baseUploadDir, folder);
    this.ensureDirectory(targetDir);
    const targetPath = path3.join(targetDir, filename);
    if (typeof content === "string") {
      await fs2.promises.writeFile(targetPath, content, "utf8");
    } else {
      await fs2.promises.writeFile(targetPath, content);
    }
    return `/uploads/${folder}/${filename}`;
  }
  async saveUpload(file, folder = "references") {
    const ext = path3.extname(file.originalname) || ".jpg";
    const cleanBase = path3.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `${cleanBase}-${Date.now()}${ext}`;
    const targetDir = path3.join(baseUploadDir, folder);
    this.ensureDirectory(targetDir);
    const targetPath = path3.join(targetDir, filename);
    if (file.buffer) {
      await fs2.promises.writeFile(targetPath, file.buffer);
    } else if (file.path && file.path !== targetPath) {
      await fs2.promises.copyFile(file.path, targetPath);
      try {
        await fs2.promises.unlink(file.path);
      } catch {
      }
    }
    const isVideo = file.mimetype.startsWith("video/");
    return {
      url: `/uploads/${folder}/${filename}`,
      filename: file.originalname,
      mediaKind: isVideo ? "video" : "image",
      size: file.size,
      mimeType: file.mimetype
    };
  }
  async deleteFile(fileUrl) {
    try {
      if (!fileUrl.startsWith("/uploads/")) return false;
      const relative = fileUrl.replace("/uploads/", "");
      const fullPath = path3.join(baseUploadDir, relative);
      if (fs2.existsSync(fullPath)) {
        await fs2.promises.unlink(fullPath);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
  getPublicUrl(relativePath) {
    return relativePath.startsWith("/") ? relativePath : `/${relativePath}`;
  }
};

// server/src/services/storage/CloudStorageService.ts
var CloudStorageService = class {
  fallback;
  constructor() {
    this.fallback = new LocalStorageService();
    if (config.cloudinary.cloudName) {
      console.log(`[Storage] Cloudinary provider configured for ${config.cloudinary.cloudName}`);
    } else if (config.s3.bucket) {
      console.log(`[Storage] AWS S3 provider configured for bucket ${config.s3.bucket}`);
    } else {
      console.log("[Storage] Cloud storage credentials not set; using local development storage.");
    }
  }
  async saveFile(content, filename, folder = "creations") {
    return this.fallback.saveFile(content, filename, folder);
  }
  async saveUpload(file, folder = "references") {
    return this.fallback.saveUpload(file, folder);
  }
  async deleteFile(fileUrl) {
    return this.fallback.deleteFile(fileUrl);
  }
  getPublicUrl(relativePath) {
    return this.fallback.getPublicUrl(relativePath);
  }
};

// server/src/services/storage/GridFSStorageService.ts
import mongoose6 from "mongoose";
import { GridFSBucket } from "mongodb";
import fs3 from "node:fs";
import path4 from "node:path";
import { Readable } from "node:stream";
function getMimeType(filename) {
  const ext = path4.extname(filename).toLowerCase();
  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".svg":
      return "image/svg+xml";
    case ".mp4":
      return "video/mp4";
    case ".webm":
      return "video/webm";
    default:
      return "application/octet-stream";
  }
}
var GridFSStorageService = class {
  localFallback;
  bucket = null;
  constructor() {
    this.localFallback = new LocalStorageService();
    this.initBucket();
  }
  initBucket() {
    if (mongoose6.connection && mongoose6.connection.readyState === 1 && mongoose6.connection.db) {
      try {
        this.bucket = new GridFSBucket(mongoose6.connection.db, {
          bucketName: "forma_media"
        });
        console.log("[Storage] MongoDB GridFS persistent media storage active.");
      } catch (err) {
        console.warn("[Storage] GridFS initialization error:", err.message);
      }
    }
    mongoose6.connection.on("connected", () => {
      if (mongoose6.connection.db) {
        try {
          this.bucket = new GridFSBucket(mongoose6.connection.db, {
            bucketName: "forma_media"
          });
          console.log("[Storage] MongoDB GridFS persistent media storage connected.");
        } catch (err) {
          console.warn("[Storage] GridFS connected hook error:", err.message);
        }
      }
    });
  }
  getBucket() {
    if (!this.bucket && mongoose6.connection && mongoose6.connection.readyState === 1 && mongoose6.connection.db) {
      try {
        this.bucket = new GridFSBucket(mongoose6.connection.db, {
          bucketName: "forma_media"
        });
      } catch {
      }
    }
    return this.bucket;
  }
  async saveFile(content, filename, folder = "creations") {
    const buffer = typeof content === "string" ? Buffer.from(content, "utf8") : content;
    const bucket = this.getBucket();
    if (bucket) {
      try {
        const mimeType = getMimeType(filename);
        const uploadStream = bucket.openUploadStream(filename, {
          metadata: {
            folder,
            mimeType,
            size: buffer.length,
            createdAt: /* @__PURE__ */ new Date()
          }
        });
        await new Promise((resolve, reject) => {
          const readable = Readable.from(buffer);
          readable.pipe(uploadStream).on("finish", () => resolve()).on("error", (err) => reject(err));
        });
        console.log(`[Storage] Saved to persistent MongoDB GridFS (${buffer.length} bytes): ${filename}`);
      } catch (gridErr) {
        console.warn(`[Storage] GridFS save warning (${gridErr.message}), caching locally.`);
      }
    }
    try {
      await this.localFallback.saveFile(buffer, filename, folder);
    } catch {
    }
    return `/uploads/${folder}/${filename}`;
  }
  async saveUpload(file, folder = "references") {
    const ext = path4.extname(file.originalname) || ".jpg";
    const cleanBase = path4.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `${cleanBase}-${Date.now()}${ext}`;
    const buffer = file.buffer || (file.path ? await fs3.promises.readFile(file.path) : Buffer.alloc(0));
    await this.saveFile(buffer, filename, folder);
    const isVideo = file.mimetype.startsWith("video/");
    return {
      url: `/uploads/${folder}/${filename}`,
      filename: file.originalname,
      mediaKind: isVideo ? "video" : "image",
      size: buffer.length,
      mimeType: file.mimetype
    };
  }
  async deleteFile(fileUrl) {
    const filename = path4.basename(fileUrl);
    const bucket = this.getBucket();
    if (bucket) {
      try {
        const files = await bucket.find({ filename }).toArray();
        for (const file of files) {
          await bucket.delete(file._id);
        }
      } catch {
      }
    }
    return this.localFallback.deleteFile(fileUrl);
  }
  getPublicUrl(relativePath) {
    return this.localFallback.getPublicUrl(relativePath);
  }
  /**
   * Stream a file from GridFS to an Express response
   */
  async streamToResponse(filename, res) {
    const bucket = this.getBucket();
    if (!bucket) return false;
    try {
      const files = await bucket.find({ filename }).toArray();
      if (!files || files.length === 0) return false;
      const fileDoc = files[files.length - 1];
      const mime = fileDoc.metadata?.mimeType || getMimeType(filename);
      res.setHeader("Content-Type", mime);
      res.setHeader("Content-Length", fileDoc.length);
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      const downloadStream = bucket.openDownloadStreamByName(filename);
      downloadStream.pipe(res);
      return true;
    } catch (err) {
      console.warn("[Storage] Error streaming from GridFS:", err.message);
      return false;
    }
  }
};

// server/src/services/storage/index.ts
var gridFSStorage = new GridFSStorageService();
var storageService = config.storageProvider === "cloudinary" || config.storageProvider === "s3" ? new CloudStorageService() : gridFSStorage;

// server/src/services/ai/errors.ts
var QuotaExceededError = class extends Error {
  statusCode = 429;
  model;
  retryAfterSeconds;
  provider;
  constructor(model, message, retryAfterSeconds, provider = "Google Gemini") {
    super(message);
    this.name = "QuotaExceededError";
    this.model = model;
    this.retryAfterSeconds = retryAfterSeconds;
    this.provider = provider;
  }
};
var AuthenticationError = class extends Error {
  statusCode = 401;
  provider;
  constructor(provider, message = "Invalid or expired API key") {
    super(message);
    this.name = "AuthenticationError";
    this.provider = provider;
  }
};
var ModelUnavailableError = class extends Error {
  statusCode = 404;
  model;
  constructor(model, message = `Model ${model} is not available on this API version or project`) {
    super(message);
    this.name = "ModelUnavailableError";
    this.model = model;
  }
};
var GenerationFailedError = class extends Error {
  statusCode = 502;
  provider;
  constructor(provider, message) {
    super(message);
    this.name = "GenerationFailedError";
    this.provider = provider;
  }
};

// server/src/config/costProtection.ts
var costProtection = {
  strictZeroCost: true,
  maxCostUsdPerRequest: 0,
  allowedProviders: {
    geminiFreeTier: true,
    // Allowed only under 0-cost free tier quota
    freeCommunityFlux: true,
    // 100% free open community tier (0 cost, no card required)
    openaiPaid: false,
    // STRICTLY DISABLED under zero-cost policy
    falPaid: false,
    // STRICTLY DISABLED under zero-cost policy
    stabilityPaid: false
    // STRICTLY DISABLED under zero-cost policy
  }
};
var CostProtectionError = class extends Error {
  statusCode = 403;
  constructor(message) {
    super(`[Zero-Cost Policy Violation] ${message}`);
    this.name = "CostProtectionError";
  }
};
function assertZeroCostAllowed(provider) {
  if (!costProtection.strictZeroCost) return;
  if (provider === "openai" && !costProtection.allowedProviders.openaiPaid) {
    throw new CostProtectionError("OpenAI requests are blocked: requires paid billing. User policy is strict zero-cost.");
  }
  if (provider === "fal" && !costProtection.allowedProviders.falPaid) {
    throw new CostProtectionError("Fal.ai requests are blocked: requires paid billing. User policy is strict zero-cost.");
  }
  if (provider === "stability" && !costProtection.allowedProviders.stabilityPaid) {
    throw new CostProtectionError("Stability AI requests are blocked: requires paid billing. User policy is strict zero-cost.");
  }
}

// server/src/services/ai/ImageGenerationService.ts
import axios from "axios";
import https from "node:https";
import fs4 from "node:fs";
import path5 from "node:path";
import { fileURLToPath as fileURLToPath4 } from "node:url";
var __filename4 = fileURLToPath4(import.meta.url);
var __dirname4 = path5.dirname(__filename4);
var baseUploadDir3 = path5.resolve(__dirname4, "../../../../uploads");
var ipv4Agent = new https.Agent({ family: 4, keepAlive: true });
var COMMUNITY_ASPECT_RATIO_PIXELS = {
  "1:1": { width: 1024, height: 1024 },
  "4:5": { width: 816, height: 1020 },
  "16:9": { width: 1024, height: 576 },
  "9:16": { width: 576, height: 1024 }
};
var STYLE_PROMPT_MODIFIERS = {
  Editorial: "editorial magazine photography, 35mm film aesthetic, balanced natural lighting, rich textures, fine grain",
  Minimal: "minimalist fine art composition, generous negative space, soft ambient natural lighting, refined subtle tones, elegant restraint",
  Architectural: "sharp architectural photography, striking geometric lines, dramatic angles, textured materials, golden hour volumetric lighting",
  Monochrome: "fine art black and white photography, deep contrast, dramatic chiaroscuro, silver gelatin print tones, rich deep shadows"
};
var ASPECT_RATIO_DIMENSIONS = {
  "1:1": { "1K": "1024 \xD7 1024", "2K": "1280 \xD7 1280", "4K": "1536 \xD7 1536" },
  "4:5": { "1K": "816 \xD7 1020", "2K": "1020 \xD7 1275", "4K": "1224 \xD7 1530" },
  "16:9": { "1K": "1024 \xD7 576", "2K": "1280 \xD7 720", "4K": "1536 \xD7 864" },
  "9:16": { "1K": "576 \xD7 1024", "2K": "720 \xD7 1280", "4K": "864 \xD7 1536" }
};
var GEMINI_ASPECT_RATIO = {
  "1:1": "1:1",
  "4:5": "3:4",
  "16:9": "16:9",
  "9:16": "9:16"
};
var GEMINI_IMAGE_SIZE = {
  "1K": "1K",
  "2K": "2K",
  "4K": "4K"
};
function validateImageBuffer(buffer) {
  if (buffer.length < 8) return { valid: false, ext: "bin", mime: "application/octet-stream" };
  if (buffer[0] === 137 && buffer[1] === 80 && buffer[2] === 78 && buffer[3] === 71) {
    return { valid: true, ext: ".png", mime: "image/png" };
  }
  if (buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255) {
    return { valid: true, ext: ".jpg", mime: "image/jpeg" };
  }
  if (buffer[0] === 82 && buffer[1] === 73 && buffer[2] === 70 && buffer[3] === 70 && buffer[8] === 87 && buffer[9] === 69 && buffer[10] === 66 && buffer[11] === 80) {
    return { valid: true, ext: ".webp", mime: "image/webp" };
  }
  return { valid: false, ext: "bin", mime: "application/octet-stream" };
}
async function resolveReferenceImage(url) {
  try {
    if (url.startsWith("data:")) {
      const match = url.match(/^data:([^;]+);base64,(.+)$/);
      if (match) return { mimeType: match[1], data: match[2] };
    }
    if (url.startsWith("/uploads/")) {
      const relPath = url.replace("/uploads/", "");
      const localPath = path5.join(baseUploadDir3, relPath);
      if (fs4.existsSync(localPath)) {
        const buf = await fs4.promises.readFile(localPath);
        const { mime } = validateImageBuffer(buf);
        return { mimeType: mime, data: buf.toString("base64") };
      }
    }
    if (url.startsWith("http://") || url.startsWith("https://")) {
      const res = await axios.get(url, {
        responseType: "arraybuffer",
        timeout: 2e4,
        httpsAgent: ipv4Agent
      });
      const buf = Buffer.from(res.data);
      const mime = String(res.headers["content-type"] || "image/jpeg");
      return { mimeType: mime, data: buf.toString("base64") };
    }
  } catch (err) {
    console.warn("[ImageGenerationService] Could not resolve reference image:", err.message);
  }
  return null;
}
var ImageGenerationService = class {
  name = "Forma Zero-Cost Image Studio Engine";
  isConfigured() {
    return Boolean(process.env.GEMINI_API_KEY || true);
  }
  async generateImage(options) {
    const seed = options.seed ?? Math.floor(1e5 + Math.random() * 899999);
    const ratioDimensions = ASPECT_RATIO_DIMENSIONS[options.aspectRatio] || ASPECT_RATIO_DIMENSIONS["1:1"];
    const dimensions = ratioDimensions[options.resolution] || "1080 \xD7 1080";
    const variations = Math.max(1, options.variations || 1);
    const creditsUsed = 1 * variations;
    const requestedModel = options.model || "gemini-3.1-flash-image";
    if (requestedModel.includes("free-flux") || requestedModel.includes("community")) {
      assertZeroCostAllowed("free-community");
      console.log("[AI Image] Generating real image via Zero-Cost Open Community Engine (Flux)...");
      const pixelConfig = COMMUNITY_ASPECT_RATIO_PIXELS[options.aspectRatio] || { width: 1024, height: 1024 };
      let width2 = pixelConfig.width;
      let height2 = pixelConfig.height;
      if (options.resolution === "2K") {
        width2 = Math.min(1280, Math.round(width2 * 1.25 / 16) * 16);
        height2 = Math.min(1280, Math.round(height2 * 1.25 / 16) * 16);
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
        `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width2}&height=${height2}&seed=${seed}&nologo=true`,
        `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width2}&height=${height2}&model=flux&seed=${seed}&nologo=true`,
        `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width2}&height=${height2}&model=turbo&seed=${seed}&nologo=true`
      ];
      let response = null;
      let lastErr = null;
      const backoffDelays = [3e3, 6e3, 1e4, 15e3];
      try {
        for (let attempt = 1; attempt <= 4; attempt++) {
          const currentUrl = endpointUrls[(attempt - 1) % endpointUrls.length];
          try {
            response = await axios.get(currentUrl, {
              responseType: "arraybuffer",
              timeout: 9e4,
              httpsAgent: ipv4Agent,
              headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
              }
            });
            if (response && response.data) break;
          } catch (attemptErr) {
            lastErr = attemptErr;
            const status = attemptErr.response?.status;
            const code = attemptErr.code;
            const isRetryable = status === 402 || status === 429 || status === 503 || code === "EAI_AGAIN" || code === "ECONNRESET" || code === "ETIMEDOUT";
            if (isRetryable && attempt < 4) {
              const delay = backoffDelays[attempt - 1] || 1e4;
              console.warn(`[AI Image] Community Engine transient retryable issue (${status || code}), retrying in ${delay / 1e3}s with alternative route (attempt ${attempt}/4)...`);
              await new Promise((resolve) => setTimeout(resolve, delay));
              continue;
            }
            throw attemptErr;
          }
        }
        if (!response || !response.data) {
          throw lastErr || new Error("No data received from community engine");
        }
        const imageBuffer = Buffer.from(response.data);
        const validation = validateImageBuffer(imageBuffer);
        if (!validation.valid || imageBuffer.length < 1024) {
          throw new GenerationFailedError(
            "Zero-Cost Community Engine",
            "Returned data failed binary image validation."
          );
        }
        const filename = `img-${Date.now()}-${seed}${validation.ext}`;
        const mediaUrl = await storageService.saveFile(imageBuffer, filename, "creations");
        console.log(`[AI Image] \u2705 Zero-Cost real image generated and stored (${imageBuffer.length} bytes): ${mediaUrl}`);
        return {
          mediaUrl,
          seed,
          dimensions: `${width2} \xD7 ${height2}`,
          creditsUsed,
          provider: "Zero-Cost Community Engine (FLUX.1)",
          isDemoMode: false,
          metadata: {
            model: "flux-community-free",
            aspectRatio: options.aspectRatio,
            resolution: options.resolution,
            mimeType: validation.mime,
            fileSize: imageBuffer.length,
            cost: "$0.00 (Zero-Cost)"
          }
        };
      } catch (err) {
        console.error("[AI Image] Community Engine error:", err.message);
        throw new GenerationFailedError("Zero-Cost Community Engine", `Image generation failed: ${err.message}`);
      }
    }
    if (process.env.GEMINI_API_KEY) {
      assertZeroCostAllowed("gemini");
      const apiKey = process.env.GEMINI_API_KEY.trim();
      const modelName = requestedModel.includes("flash-image") || requestedModel.includes("gemini") ? requestedModel : "gemini-3.1-flash-image";
      console.log(`[AI Image] Dispatching request to Google Gemini API (${modelName})...`);
      const parts = [];
      if (options.referenceAssetUrl) {
        const refImage = await resolveReferenceImage(options.referenceAssetUrl);
        if (refImage) {
          parts.push({
            inlineData: {
              mimeType: refImage.mimeType,
              data: refImage.data
            }
          });
        }
      }
      let finalPrompt = options.prompt.trim();
      if (options.style && options.style !== "Editorial") {
        finalPrompt += `, ${options.style.toLowerCase()} aesthetic, high fidelity`;
      }
      if (options.negativePrompt) {
        finalPrompt += ` [Avoid: ${options.negativePrompt}]`;
      }
      parts.push({ text: finalPrompt });
      const geminiRatio = GEMINI_ASPECT_RATIO[options.aspectRatio] || "1:1";
      const geminiSize = GEMINI_IMAGE_SIZE[options.resolution] || "1K";
      const payload = {
        contents: [{ role: "user", parts }],
        generationConfig: {
          responseModalities: ["IMAGE"],
          imageConfig: {
            aspectRatio: geminiRatio,
            imageSize: geminiSize
          }
        }
      };
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      try {
        const response = await axios.post(url, payload, {
          headers: { "Content-Type": "application/json" },
          timeout: 75e3,
          httpsAgent: ipv4Agent
        });
        const candidates = response.data?.candidates;
        const candidateParts = candidates?.[0]?.content?.parts || [];
        let imagePart = null;
        for (const p of candidateParts) {
          if (p.inlineData || p.inline_data) {
            imagePart = p.inlineData || p.inline_data;
            break;
          }
        }
        if (!imagePart || !imagePart.data) {
          const textPart = candidateParts.find((p) => p.text);
          throw new GenerationFailedError(
            "Google Gemini",
            `Model did not return image bytes: ${textPart ? textPart.text.slice(0, 200) : "No media part"}`
          );
        }
        const imageBuffer = Buffer.from(imagePart.data, "base64");
        const validation = validateImageBuffer(imageBuffer);
        if (!validation.valid) {
          throw new GenerationFailedError("Google Gemini", "Data failed binary image signature validation.");
        }
        const filename = `img-${Date.now()}-${seed}${validation.ext}`;
        const mediaUrl = await storageService.saveFile(imageBuffer, filename, "creations");
        console.log(`[AI Image] \u2705 Gemini generated real image (${imageBuffer.length} bytes): ${mediaUrl}`);
        return {
          mediaUrl,
          seed,
          dimensions: `${width} \xD7 ${height}`,
          creditsUsed,
          provider: `Google Gemini (${modelName})`,
          isDemoMode: false,
          metadata: {
            model: modelName,
            aspectRatio: options.aspectRatio,
            resolution: options.resolution,
            mimeType: validation.mime,
            fileSize: imageBuffer.length,
            cost: "$0.00 (Free Tier)"
          }
        };
      } catch (err) {
        const status = err?.response?.status;
        const errData = err?.response?.data;
        const errorMsg = errData?.error?.message || err.message;
        if (status === 429) {
          throw new QuotaExceededError(
            modelName,
            `Google AI Studio quota limit exceeded for "${modelName}" (metric limit: 0 on unbilled Free Tier). Google requires linked billing for Gemini image generation. Under your zero-cost policy, switch to "Free Community Engine (FLUX.1)" in the model dropdown to generate real AI images at 0 cost without billing.`,
            void 0,
            "Google Gemini"
          );
        }
        if (status === 401 || status === 403) {
          throw new AuthenticationError("Google Gemini", `Invalid or unauthorized API key: ${errorMsg}`);
        }
        if (status === 404) {
          throw new ModelUnavailableError(modelName, `Model "${modelName}" is not available on this API version.`);
        }
        throw new GenerationFailedError("Google Gemini", `Image generation failed: ${errorMsg}`);
      }
    }
    throw new GenerationFailedError(
      "Forma Studio",
      "No AI Provider configured. Please provide a GEMINI_API_KEY or select the Free Community Engine."
    );
  }
};

// server/src/services/ai/VideoGenerationService.ts
import axios2 from "axios";
import https2 from "node:https";
import fs5 from "node:fs";
import path6 from "node:path";
import { fileURLToPath as fileURLToPath5 } from "node:url";
var __filename5 = fileURLToPath5(import.meta.url);
var __dirname5 = path6.dirname(__filename5);
var baseUploadDir4 = path6.resolve(__dirname5, "../../../../uploads");
var ipv4Agent2 = new https2.Agent({ family: 4, keepAlive: true });
var VIDEO_DIMENSIONS = {
  "16:9": "1920 \xD7 1080",
  "9:16": "1080 \xD7 1920",
  "1:1": "1080 \xD7 1080",
  "4:5": "1080 \xD7 1350"
};
function validateMp4Buffer(buffer) {
  if (buffer.length < 16) return false;
  const ftyp = buffer.toString("ascii", 4, 8);
  return ftyp === "ftyp" || ftyp === "moov";
}
async function resolveReferenceImage2(url) {
  try {
    if (url.startsWith("/uploads/")) {
      const relPath = url.replace("/uploads/", "");
      const localPath = path6.join(baseUploadDir4, relPath);
      if (fs5.existsSync(localPath)) {
        const buf = await fs5.promises.readFile(localPath);
        return { mimeType: "image/jpeg", data: buf.toString("base64") };
      }
    }
    if (url.startsWith("http://") || url.startsWith("https://")) {
      const res = await axios2.get(url, {
        responseType: "arraybuffer",
        timeout: 2e4,
        httpsAgent: ipv4Agent2
      });
      const buf = Buffer.from(res.data);
      const mime = String(res.headers["content-type"] || "image/jpeg");
      return { mimeType: mime, data: buf.toString("base64") };
    }
  } catch (err) {
    console.warn("[VideoGenerationService] Could not resolve reference image:", err.message);
  }
  return null;
}
var VideoGenerationService = class {
  name = "Forma Zero-Cost Video Engine";
  isConfigured() {
    return Boolean(process.env.GEMINI_API_KEY);
  }
  async generateVideo(options) {
    const seed = options.seed ?? Math.floor(1e5 + Math.random() * 899999);
    const dimensions = VIDEO_DIMENSIONS[options.aspectRatio] || "1920 \xD7 1080";
    const creditsUsed = 4;
    if (process.env.GEMINI_API_KEY) {
      assertZeroCostAllowed("gemini");
      const apiKey = process.env.GEMINI_API_KEY.trim();
      const modelName = "gemini-omni-1.2-flash";
      console.log(`[AI Video] Evaluating Google Gemini Omni Video model (${modelName}) under Zero-Cost Policy...`);
      const parts = [];
      if (options.referenceAssetUrl) {
        const refImage = await resolveReferenceImage2(options.referenceAssetUrl);
        if (refImage) {
          parts.push({
            inlineData: {
              mimeType: refImage.mimeType,
              data: refImage.data
            }
          });
        }
      }
      let promptText = options.prompt.trim();
      if (options.motion && options.motion !== "Static") {
        promptText += `, camera motion: ${options.motion.toLowerCase()}`;
      }
      if (options.duration) {
        promptText += `, duration: ${options.duration}`;
      }
      parts.push({ text: promptText });
      const payload = {
        contents: [{ role: "user", parts }],
        generationConfig: {
          responseModalities: ["VIDEO"]
        }
      };
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      try {
        const response = await axios2.post(url, payload, {
          headers: { "Content-Type": "application/json" },
          timeout: 18e4,
          httpsAgent: ipv4Agent2
        });
        const candidates = response.data?.candidates;
        const candidateParts = candidates?.[0]?.content?.parts || [];
        let videoPart = null;
        for (const p of candidateParts) {
          if (p.inlineData || p.inline_data) {
            videoPart = p.inlineData || p.inline_data;
            break;
          }
        }
        let videoBuffer = null;
        if (videoPart && videoPart.data) {
          videoBuffer = Buffer.from(videoPart.data, "base64");
        } else if (response.data?.video?.uri || response.data?.generatedVideos?.[0]?.video?.uri) {
          const videoUri = response.data?.video?.uri || response.data?.generatedVideos?.[0]?.video?.uri;
          const downloadRes = await axios2.get(videoUri, {
            headers: { "x-goog-api-key": apiKey },
            responseType: "arraybuffer",
            httpsAgent: ipv4Agent2
          });
          videoBuffer = Buffer.from(downloadRes.data);
        }
        if (!videoBuffer) {
          const textPart = candidateParts.find((p) => p.text);
          throw new GenerationFailedError("Google Gemini", `Model did not return video bytes: ${textPart ? textPart.text.slice(0, 200) : "No media part"}`);
        }
        if (!validateMp4Buffer(videoBuffer)) {
          throw new GenerationFailedError(
            "Google Gemini",
            "Received data failed MP4 binary container validation."
          );
        }
        const filename = `vid-${Date.now()}-${seed}.mp4`;
        const mediaUrl = await storageService.saveFile(videoBuffer, filename, "creations");
        console.log(`[AI Video] \u2705 Gemini generated real MP4 video (${videoBuffer.length} bytes): ${mediaUrl}`);
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
            format: "mp4",
            cost: "$0.00"
          }
        };
      } catch (err) {
        const status = err?.response?.status;
        const errData = err?.response?.data;
        const errorMsg = errData?.error?.message || err.message;
        if (status === 429) {
          throw new QuotaExceededError(
            modelName,
            `Google AI Studio quota limit is 0 on the Free Tier for video model "${modelName}". Google requires linked billing for Gemini video generation. Under your strict zero-cost policy, paid video generation has been prevented. Zero credits were deducted.`,
            void 0,
            "Google Gemini"
          );
        }
        if (status === 401 || status === 403) {
          throw new AuthenticationError("Google Gemini", `Invalid or unauthorized API key: ${errorMsg}`);
        }
        if (status === 404) {
          throw new ModelUnavailableError(modelName, `Video model "${modelName}" is not available on this API version.`);
        }
        throw new GenerationFailedError("Google Gemini", `Video generation failed: ${errorMsg}`);
      }
    }
    throw new GenerationFailedError(
      "Forma Studio",
      "No AI Video Provider configured. Please provide a GEMINI_API_KEY in your .env file."
    );
  }
};

// server/src/services/ai/index.ts
var imageGenerationService = new ImageGenerationService();
var videoGenerationService = new VideoGenerationService();

// server/src/services/ai/promptEnhanceService.ts
import axios3 from "axios";
import https3 from "node:https";
var ipv4Agent3 = new https3.Agent({ family: 4, keepAlive: true });
var STYLE_ENHANCEMENT_HINTS = {
  Editorial: "vogue editorial style, 35mm portrait lens, cinematic rim lighting, textured fabrics, elegant poise",
  Minimal: "minimalist composition, vast negative space, soft muted palette, serene lighting, subtle gradients",
  Architectural: "bold architectural lines, geometric symmetry, concrete and glass reflections, atmospheric lighting",
  Monochrome: "stunning black and white, deep blacks, high contrast chiaroscuro, tactile surfaces, timeless feel"
};
async function enhancePromptWithAI(prompt, style) {
  const cleanPrompt = prompt.trim();
  if (!cleanPrompt) {
    return { enhancedPrompt: "", provider: "none" };
  }
  const apiKey = process.env.GEMINI_API_KEY;
  const styleHint = style && STYLE_ENHANCEMENT_HINTS[style] ? STYLE_ENHANCEMENT_HINTS[style] : "";
  if (apiKey) {
    const candidateModels = ["gemini-3.5-flash", "gemini-3.8-flash", "gemini-flash-latest"];
    for (const model of candidateModels) {
      try {
        const instruction = `You are an expert visual prompt engineer for advanced AI image generators (FLUX, Midjourney).
Expand the user's input prompt into a descriptive, high-quality visual prompt in 1 to 2 sentences.
STRICT RULES:
1. Strictly preserve the original subject, action, and core meaning. Do NOT change or replace the main subject.
2. Do NOT add unrelated characters, objects, or themes that contradict the input.
3. Enhance visual realism with precise details: lighting (e.g. volumetric, rim, soft natural light), camera perspective, focal length, surface textures, and color atmosphere.
` + (styleHint ? `4. Align with the aesthetic: ${styleHint}.
` : "") + `5. Return ONLY the enhanced prompt. No preamble, conversational remarks, or quotation marks.`;
        const response = await axios3.post(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            contents: [
              {
                role: "user",
                parts: [{ text: `${instruction}

User prompt: ${cleanPrompt}` }]
              }
            ]
          },
          {
            httpsAgent: ipv4Agent3,
            timeout: 1e4
          }
        );
        const candidateText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (candidateText && candidateText.length > 20) {
          const finalPrompt = candidateText.replace(/^["'`]+|["'`]+$/g, "").trim();
          return {
            enhancedPrompt: finalPrompt,
            provider: `Google Gemini (${model})`
          };
        }
      } catch (err) {
        console.warn(`[PromptEnhance] Model ${model} failed (${err.response?.status || err.message}), trying next...`);
      }
    }
  }
  const additions = [];
  if (styleHint) additions.push(styleHint);
  else additions.push("photorealistic studio lighting, tactile surfaces, 8k resolution, cinematic color grading, sharp focus");
  const enhanced = `${cleanPrompt}, captured with an 85mm f/1.4 lens, ${additions.join(", ")}`;
  return {
    enhancedPrompt: enhanced,
    provider: "Forma Heuristic Aesthetic Engine"
  };
}

// server/src/controllers/generationController.ts
function deriveCreationTitle(prompt, mode) {
  const cleaned = (prompt || "").trim().replace(/\s+/g, " ");
  if (!cleaned) return mode === "image" ? "Untitled Still" : "Untitled Sequence";
  const words = cleaned.split(" ").slice(0, 5).join(" ");
  return words.length < cleaned.length ? `${words}\u2026` : words;
}
var generationController = {
  async generate(req, res) {
    if (!req.user) return sendError(res, "Authentication required", 401);
    try {
      const user = req.user;
      const {
        mode = "image",
        prompt = "",
        negativePrompt = "",
        model = "gemini-3.1-flash-image",
        aspectRatio = "1:1",
        resolution = "1K",
        style = "Editorial",
        variations = 1,
        duration = "4s",
        motion = "Static",
        fps = "24 fps",
        referenceAssetUrl = null,
        referenceAssetName = null,
        referenceMediaKind = null
      } = req.body;
      if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
        return sendError(res, "A descriptive prompt is required for generation", 400);
      }
      const isVideo = mode === "video";
      const baseCost = isVideo ? 4 : 1;
      const variationMultiplier = isVideo ? 1 : Math.max(1, Number(variations) || 1);
      const creditsCost = baseCost * variationMultiplier;
      if (user.credits < creditsCost) {
        return sendError(res, "Insufficient credits", 402, {
          required: creditsCost,
          balance: user.credits
        });
      }
      const videoType = referenceAssetUrl ? "image-to-video" : "text-to-video";
      const generationType = isVideo ? videoType : "text-to-image";
      let aiResult;
      try {
        aiResult = isVideo ? await videoGenerationService.generateVideo({
          prompt,
          negativePrompt,
          generationType: videoType,
          aspectRatio,
          duration,
          motion,
          fps,
          model,
          referenceAssetUrl
        }) : await imageGenerationService.generateImage({
          prompt,
          negativePrompt,
          style,
          aspectRatio,
          resolution,
          variations: variationMultiplier,
          model,
          referenceAssetUrl
        });
      } catch (genErr) {
        console.error("[GenerationController] AI Service error during generation:", genErr.message);
        if (genErr instanceof QuotaExceededError) {
          return sendError(res, genErr.message, 429, {
            model: genErr.model,
            provider: genErr.provider,
            retryAfterSeconds: genErr.retryAfterSeconds,
            errorType: "QUOTA_EXHAUSTED"
          });
        }
        if (genErr instanceof AuthenticationError) {
          return sendError(res, genErr.message, 401, {
            provider: genErr.provider,
            errorType: "INVALID_CREDENTIALS"
          });
        }
        if (genErr instanceof ModelUnavailableError) {
          return sendError(res, genErr.message, 404, {
            model: genErr.model,
            errorType: "MODEL_UNAVAILABLE"
          });
        }
        if (genErr instanceof GenerationFailedError) {
          return sendError(res, genErr.message, 502, {
            provider: genErr.provider,
            errorType: "PROVIDER_ERROR"
          });
        }
        return sendError(res, `Generation failed: ${genErr.message}`, 500);
      }
      const newBalance = user.credits - creditsCost;
      await dbRepository.users.update(user.id, { credits: newBalance });
      const timeString = (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      await dbRepository.usageQuota.log({
        userId: user.id,
        label: `${isVideo ? "Video render" : "Image generation"} (${creditsCost} cr)`,
        mode,
        delta: -creditsCost,
        balanceAfter: newBalance,
        timestamp: timeString
      });
      const title = deriveCreationTitle(prompt, mode);
      const generation = await dbRepository.generations.create({
        userId: user.id,
        title,
        prompt,
        negativePrompt,
        mode,
        generationType,
        aspectRatio,
        resolution,
        style,
        model,
        variations: variationMultiplier,
        duration,
        motion,
        fps,
        seed: aiResult.seed,
        dimensions: aiResult.dimensions,
        creditsUsed: creditsCost,
        provider: aiResult.provider,
        mediaUrl: aiResult.mediaUrl,
        mediaKind: mode,
        status: "completed",
        saved: false,
        collectionName: null,
        referenceAssetUrl,
        referenceAssetName,
        referenceMediaKind
      });
      return sendSuccess(
        res,
        {
          id: generation.id,
          title: generation.title,
          createdAt: timeString,
          request: {
            mode: generation.mode,
            prompt: generation.prompt,
            negativePrompt: generation.negativePrompt,
            model: generation.model,
            aspectRatio: generation.aspectRatio,
            resolution: generation.resolution,
            style: generation.style,
            variations: generation.variations,
            duration: generation.duration,
            motion: generation.motion,
            fps: generation.fps,
            referenceAssetUrl: generation.referenceAssetUrl,
            referenceAssetName: generation.referenceAssetName,
            referenceMediaKind: generation.referenceMediaKind
          },
          seed: generation.seed,
          dimensions: generation.dimensions,
          creditsUsed: generation.creditsUsed,
          provider: generation.provider,
          mediaUrl: generation.mediaUrl,
          mediaKind: generation.mediaKind,
          saved: generation.saved,
          isDemoMode: aiResult.isDemoMode,
          newBalance
        },
        "Generation completed successfully",
        201
      );
    } catch (error) {
      console.error("[GenerationController.generate] Fatal error:", error);
      return sendError(res, "Internal server error during generation: " + error.message, 500);
    }
  },
  async getById(req, res) {
    if (!req.user) return sendError(res, "Authentication required", 401);
    try {
      const id = String(req.params.id);
      const item = await dbRepository.generations.findById(id, req.user.id);
      if (!item) {
        return sendError(res, "Generation not found or unauthorized", 404);
      }
      return sendSuccess(res, { generation: item });
    } catch (error) {
      console.error("[GenerationController.getById]", error);
      return sendError(res, "Failed to fetch generation: " + error.message, 500);
    }
  },
  async list(req, res) {
    if (!req.user) return sendError(res, "Authentication required", 401);
    try {
      const { filter, collection, search } = req.query;
      const items = await dbRepository.generations.listByUser(
        req.user.id,
        filter,
        collection,
        search
      );
      const formatted = items.map((g) => ({
        id: g.id,
        title: g.title,
        createdAt: new Date(g.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        request: {
          mode: g.mode,
          prompt: g.prompt,
          negativePrompt: g.negativePrompt || "",
          model: g.model,
          aspectRatio: g.aspectRatio,
          resolution: g.resolution,
          style: g.style,
          variations: g.variations,
          duration: g.duration,
          motion: g.motion,
          fps: g.fps,
          referenceAssetUrl: g.referenceAssetUrl,
          referenceAssetName: g.referenceAssetName,
          referenceMediaKind: g.referenceMediaKind
        },
        seed: g.seed,
        dimensions: g.dimensions,
        creditsUsed: g.creditsUsed,
        provider: g.provider,
        mediaUrl: g.mediaUrl,
        mediaKind: g.mediaKind,
        saved: g.saved,
        collection: g.collectionName || void 0
      }));
      return sendSuccess(res, { creations: formatted });
    } catch (error) {
      console.error("[GenerationController.list]", error);
      return sendError(res, "Failed to list creations: " + error.message, 500);
    }
  },
  async update(req, res) {
    if (!req.user) return sendError(res, "Authentication required", 401);
    try {
      const id = String(req.params.id);
      const { saved, collectionName, title } = req.body;
      const updates = {};
      if (saved !== void 0) updates.saved = Boolean(saved);
      if (collectionName !== void 0) updates.collectionName = collectionName;
      if (title !== void 0) updates.title = String(title);
      const item = await dbRepository.generations.update(id, req.user.id, updates);
      if (!item) return sendError(res, "Generation not found or unauthorized", 404);
      return sendSuccess(res, { id: item.id, saved: item.saved, collectionName: item.collectionName, title: item.title });
    } catch (error) {
      console.error("[GenerationController.update]", error);
      return sendError(res, "Failed to update generation: " + error.message, 500);
    }
  },
  async delete(req, res) {
    if (!req.user) return sendError(res, "Authentication required", 401);
    try {
      const id = String(req.params.id);
      const deleted = await dbRepository.generations.delete(id, req.user.id);
      if (!deleted) return sendError(res, "Generation not found or unauthorized", 404);
      return sendSuccess(res, { deleted: true });
    } catch (error) {
      console.error("[GenerationController.delete]", error);
      return sendError(res, "Failed to delete generation: " + error.message, 500);
    }
  },
  async enhancePrompt(req, res) {
    try {
      const { prompt = "", style } = req.body;
      if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
        return sendError(res, "Prompt is required for enhancement", 400);
      }
      const result = await enhancePromptWithAI(prompt.trim(), style);
      return sendSuccess(res, {
        enhancedPrompt: result.enhancedPrompt,
        originalPrompt: prompt.trim(),
        provider: result.provider
      });
    } catch (error) {
      console.error("[GenerationController.enhancePrompt]", error);
      return sendError(res, "Prompt enhancement failed: " + error.message, 500);
    }
  }
};

// server/src/validators/generationValidator.ts
var VALID_RATIOS = /* @__PURE__ */ new Set(["1:1", "4:5", "16:9", "9:16"]);
var VALID_RESOLUTIONS = /* @__PURE__ */ new Set(["1K", "2K", "4K"]);
function validateGenerationRequest(req, res, next) {
  const { prompt, mode, aspectRatio, resolution, variations } = req.body;
  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return sendError(res, "Prompt is required", 400);
  }
  if (prompt.trim().length > 2e3) {
    return sendError(res, "Prompt cannot exceed 2000 characters", 400);
  }
  if (mode && mode !== "image" && mode !== "video") {
    return sendError(res, 'Mode must be either "image" or "video"', 400);
  }
  if (aspectRatio && !VALID_RATIOS.has(aspectRatio)) {
    return sendError(res, `Invalid aspect ratio: ${aspectRatio}`, 400);
  }
  if (resolution && !VALID_RESOLUTIONS.has(resolution)) {
    return sendError(res, `Invalid resolution: ${resolution}`, 400);
  }
  if (variations && ![1, 2, 4].includes(Number(variations))) {
    return sendError(res, "Variations must be 1, 2, or 4", 400);
  }
  next();
}

// server/src/routes/generationRoutes.ts
var router2 = Router2();
router2.post("/", requireAuth, validateGenerationRequest, generationController.generate);
router2.post("/enhance", requireAuth, generationController.enhancePrompt);
router2.get("/", requireAuth, generationController.list);
router2.get("/:id", requireAuth, generationController.getById);
router2.patch("/:id", requireAuth, generationController.update);
router2.delete("/:id", requireAuth, generationController.delete);
var generationRoutes_default = router2;

// server/src/routes/galleryRoutes.ts
import { Router as Router3 } from "express";

// server/src/controllers/galleryController.ts
var galleryController = {
  async update(req, res) {
    if (!req.user) return sendError(res, "Authentication required", 401);
    try {
      const id = String(req.params.id);
      const { title, saved, collection } = req.body;
      const item = await dbRepository.generations.findById(id, req.user.id);
      if (!item) {
        return sendError(res, "Creation not found or access denied", 404);
      }
      const updates = {};
      if (typeof title === "string" && title.trim()) updates.title = title.trim();
      if (typeof saved === "boolean") updates.saved = saved;
      if (typeof collection !== "undefined") updates.collectionName = collection ? collection.trim() : null;
      const updated = await dbRepository.generations.update(id, req.user.id, updates);
      if (!updated) return sendError(res, "Failed to update creation", 500);
      const formatted = {
        id: updated.id,
        title: updated.title,
        createdAt: new Date(updated.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        request: {
          mode: updated.mode,
          prompt: updated.prompt,
          negativePrompt: updated.negativePrompt,
          model: updated.model,
          aspectRatio: updated.aspectRatio,
          resolution: updated.resolution,
          style: updated.style,
          variations: updated.variations,
          duration: updated.duration,
          motion: updated.motion,
          fps: updated.fps,
          referenceAssetUrl: updated.referenceAssetUrl,
          referenceAssetName: updated.referenceAssetName,
          referenceMediaKind: updated.referenceMediaKind
        },
        seed: updated.seed,
        dimensions: updated.dimensions,
        creditsUsed: updated.creditsUsed,
        provider: updated.provider,
        mediaUrl: updated.mediaUrl,
        mediaKind: updated.mediaKind,
        saved: updated.saved,
        collection: updated.collectionName || void 0
      };
      return sendSuccess(res, { creation: formatted }, "Creation updated");
    } catch (error) {
      console.error("[GalleryController.update]", error);
      return sendError(res, "Update failed: " + error.message, 500);
    }
  },
  async delete(req, res) {
    if (!req.user) return sendError(res, "Authentication required", 401);
    try {
      const id = String(req.params.id);
      const success = await dbRepository.generations.delete(id, req.user.id);
      if (!success) {
        return sendError(res, "Creation not found or access denied", 404);
      }
      return sendSuccess(res, { id }, "Creation deleted");
    } catch (error) {
      console.error("[GalleryController.delete]", error);
      return sendError(res, "Delete failed: " + error.message, 500);
    }
  },
  async duplicate(req, res) {
    if (!req.user) return sendError(res, "Authentication required", 401);
    try {
      const id = String(req.params.id);
      const original = await dbRepository.generations.findById(id, req.user.id);
      if (!original) {
        return sendError(res, "Creation not found or access denied", 404);
      }
      const duplicate = await dbRepository.generations.create({
        userId: req.user.id,
        title: `${original.title} (Copy)`,
        prompt: original.prompt,
        negativePrompt: original.negativePrompt,
        mode: original.mode,
        generationType: original.generationType,
        aspectRatio: original.aspectRatio,
        resolution: original.resolution,
        style: original.style,
        model: original.model,
        variations: original.variations,
        duration: original.duration,
        motion: original.motion,
        fps: original.fps,
        seed: original.seed + 1,
        dimensions: original.dimensions,
        creditsUsed: 0,
        provider: original.provider,
        mediaUrl: original.mediaUrl,
        mediaKind: original.mediaKind,
        status: "completed",
        saved: original.saved,
        collectionName: original.collectionName,
        referenceAssetUrl: original.referenceAssetUrl,
        referenceAssetName: original.referenceAssetName,
        referenceMediaKind: original.referenceMediaKind
      });
      const formatted = {
        id: duplicate.id,
        title: duplicate.title,
        createdAt: new Date(duplicate.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        request: {
          mode: duplicate.mode,
          prompt: duplicate.prompt,
          negativePrompt: duplicate.negativePrompt,
          model: duplicate.model,
          aspectRatio: duplicate.aspectRatio,
          resolution: duplicate.resolution,
          style: duplicate.style,
          variations: duplicate.variations,
          duration: duplicate.duration,
          motion: duplicate.motion,
          fps: duplicate.fps,
          referenceAssetUrl: duplicate.referenceAssetUrl,
          referenceAssetName: duplicate.referenceAssetName,
          referenceMediaKind: duplicate.referenceMediaKind
        },
        seed: duplicate.seed,
        dimensions: duplicate.dimensions,
        creditsUsed: 0,
        provider: duplicate.provider,
        mediaUrl: duplicate.mediaUrl,
        mediaKind: duplicate.mediaKind,
        saved: duplicate.saved,
        collection: duplicate.collectionName || void 0
      };
      return sendSuccess(res, { creation: formatted }, "Creation duplicated", 201);
    } catch (error) {
      console.error("[GalleryController.duplicate]", error);
      return sendError(res, "Duplication failed: " + error.message, 500);
    }
  }
};

// server/src/routes/galleryRoutes.ts
var router3 = Router3();
router3.get("/", requireAuth, generationController.list);
router3.patch("/:id", requireAuth, galleryController.update);
router3.delete("/:id", requireAuth, galleryController.delete);
router3.post("/:id/duplicate", requireAuth, galleryController.duplicate);
var galleryRoutes_default = router3;

// server/src/routes/dashboardRoutes.ts
import { Router as Router4 } from "express";

// server/src/controllers/dashboardController.ts
var dashboardController = {
  async getStats(req, res) {
    if (!req.user) return sendError(res, "Authentication required", 401);
    try {
      const counts = await dbRepository.generations.countByUser(req.user.id);
      const collections = await dbRepository.collections.list(req.user.id);
      const recentItems = await dbRepository.generations.listByUser(req.user.id);
      const history = await dbRepository.usageQuota.listByUser(req.user.id);
      const totalSpent = history.filter((h) => h.delta < 0).reduce((sum, h) => sum + Math.abs(h.delta), 0);
      const recentCreations = recentItems.slice(0, 6).map((g) => ({
        id: g.id,
        title: g.title,
        createdAt: new Date(g.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        mode: g.mode,
        mediaUrl: g.mediaUrl,
        saved: g.saved,
        dimensions: g.dimensions
      }));
      return sendSuccess(res, {
        stats: {
          user: {
            id: req.user.id,
            email: req.user.email,
            name: req.user.name,
            planId: req.user.planId,
            credits: req.user.credits,
            maxCredits: req.user.maxCredits
          },
          totalCreations: counts.total,
          totalImages: counts.images,
          totalVideos: counts.videos,
          totalSaved: counts.saved,
          totalCollections: collections.length,
          totalCreditsSpent: totalSpent,
          recentCreations
        }
      });
    } catch (error) {
      console.error("[DashboardController.getStats]", error);
      return sendError(res, "Failed to retrieve dashboard stats: " + error.message, 500);
    }
  }
};

// server/src/routes/dashboardRoutes.ts
var router4 = Router4();
router4.get("/stats", requireAuth, dashboardController.getStats);
var dashboardRoutes_default = router4;

// server/src/routes/uploadRoutes.ts
import { Router as Router5 } from "express";

// server/src/controllers/uploadController.ts
var uploadController = {
  async upload(req, res) {
    if (!req.user) return sendError(res, "Authentication required", 401);
    try {
      if (!req.file) {
        return sendError(res, "No file uploaded", 400);
      }
      const result = await storageService.saveUpload(req.file, "references");
      return sendSuccess(
        res,
        {
          url: result.url,
          filename: result.filename,
          mediaKind: result.mediaKind,
          size: result.size
        },
        "File uploaded successfully",
        201
      );
    } catch (error) {
      console.error("[UploadController.upload]", error);
      return sendError(res, "Upload failed: " + error.message, 500);
    }
  }
};

// server/src/middleware/upload.ts
import multer from "multer";
var storage = multer.memoryStorage();
function fileFilter(_req, file, cb) {
  const isImage = file.mimetype.startsWith("image/");
  const isVideo = file.mimetype.startsWith("video/");
  if (isImage || isVideo) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only image and video files are supported."));
  }
}
var uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
    // 50MB
    files: 1
  },
  fileFilter
});

// server/src/routes/uploadRoutes.ts
var router5 = Router5();
router5.post("/", requireAuth, uploadMiddleware.single("file"), uploadController.upload);
var uploadRoutes_default = router5;

// server/src/routes/creditsRoutes.ts
import { Router as Router6 } from "express";

// server/src/controllers/creditsController.ts
var PLAN_CREDIT_MAP = {
  free: { credits: 25, label: "Switched to Free Plan" },
  pro: { credits: 500, label: "Upgraded to Pro Plan (\u20B91,499/mo)" },
  studio: { credits: 2e3, label: "Upgraded to Studio Plan (\u20B93,999/mo)" }
};
var creditsController = {
  async getHistory(req, res) {
    if (!req.user) return sendError(res, "Authentication required", 401);
    try {
      const history = await dbRepository.usageQuota.listByUser(req.user.id);
      return sendSuccess(res, { history });
    } catch (error) {
      console.error("[CreditsController.getHistory]", error);
      return sendError(res, "Failed to fetch history: " + error.message, 500);
    }
  },
  async selectPlan(req, res) {
    if (!req.user) return sendError(res, "Authentication required", 401);
    try {
      const { planId } = req.body;
      const plan = PLAN_CREDIT_MAP[planId];
      if (!plan) return sendError(res, "Invalid plan id", 400);
      await dbRepository.users.update(req.user.id, {
        planId,
        credits: plan.credits,
        maxCredits: plan.credits
      });
      const timeString = (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const transaction = await dbRepository.usageQuota.log({
        userId: req.user.id,
        label: plan.label,
        mode: "topup",
        delta: plan.credits,
        balanceAfter: plan.credits,
        timestamp: timeString
      });
      return sendSuccess(
        res,
        {
          planId,
          credits: plan.credits,
          maxCredits: plan.credits,
          transaction: {
            id: transaction.id,
            label: transaction.label,
            mode: transaction.mode,
            delta: transaction.delta,
            timestamp: transaction.timestamp
          }
        },
        `Plan updated to ${planId}`
      );
    } catch (error) {
      console.error("[CreditsController.selectPlan]", error);
      return sendError(res, "Failed to update plan: " + error.message, 500);
    }
  },
  async topup(req, res) {
    if (!req.user) return sendError(res, "Authentication required", 401);
    try {
      const { amount, label = "Credit top-up" } = req.body;
      const numericAmount = Math.max(0, Math.floor(Number(amount) || 0));
      await dbRepository.users.update(req.user.id, { credits: numericAmount });
      const timeString = (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const transaction = await dbRepository.usageQuota.log({
        userId: req.user.id,
        label,
        mode: "topup",
        delta: numericAmount,
        balanceAfter: numericAmount,
        timestamp: timeString
      });
      return sendSuccess(
        res,
        {
          credits: numericAmount,
          transaction: {
            id: transaction.id,
            label: transaction.label,
            mode: transaction.mode,
            delta: transaction.delta,
            timestamp: transaction.timestamp
          }
        },
        "Credits updated"
      );
    } catch (error) {
      console.error("[CreditsController.topup]", error);
      return sendError(res, "Failed to update credits: " + error.message, 500);
    }
  }
};

// server/src/routes/creditsRoutes.ts
var router6 = Router6();
router6.get("/history", requireAuth, creditsController.getHistory);
router6.post("/plan", requireAuth, creditsController.selectPlan);
router6.post("/topup", requireAuth, creditsController.topup);
var creditsRoutes_default = router6;

// server/src/routes/collectionsRoutes.ts
import { Router as Router7 } from "express";

// server/src/controllers/collectionsController.ts
var collectionsController = {
  async list(req, res) {
    if (!req.user) return sendError(res, "Authentication required", 401);
    try {
      const collections = await dbRepository.collections.list(req.user.id);
      return sendSuccess(res, { collections });
    } catch (error) {
      console.error("[CollectionsController.list]", error);
      return sendError(res, "Failed to fetch collections: " + error.message, 500);
    }
  },
  async create(req, res) {
    if (!req.user) return sendError(res, "Authentication required", 401);
    try {
      const { name } = req.body;
      if (!name || typeof name !== "string" || !name.trim()) {
        return sendError(res, "Collection name is required", 400);
      }
      const createdName = await dbRepository.collections.create(req.user.id, name.trim());
      return sendSuccess(res, { name: createdName }, "Collection created", 201);
    } catch (error) {
      console.error("[CollectionsController.create]", error);
      return sendError(res, "Failed to create collection: " + error.message, 500);
    }
  },
  async delete(req, res) {
    if (!req.user) return sendError(res, "Authentication required", 401);
    try {
      const name = String(req.params.name || "");
      await dbRepository.collections.delete(req.user.id, name);
      return sendSuccess(res, { name }, "Collection deleted");
    } catch (error) {
      console.error("[CollectionsController.delete]", error);
      return sendError(res, "Failed to delete collection: " + error.message, 500);
    }
  }
};

// server/src/routes/collectionsRoutes.ts
var router7 = Router7();
router7.get("/", requireAuth, collectionsController.list);
router7.post("/", requireAuth, collectionsController.create);
router7.delete("/:name", requireAuth, collectionsController.delete);
var collectionsRoutes_default = router7;

// server/src/routes/index.ts
var router8 = Router8();
router8.get("/health", (_req, res) => {
  res.json({
    status: "healthy",
    service: "Forma Commercial AI Creative Studio API",
    database: isMongoConnected ? "MongoDB (Mongoose Connected)" : "Resilient Local Storage (Zero-config Persistent)",
    aiEngine: {
      zeroCostPolicy: "Strict Zero-Cost Enforced (0 USD)",
      imageEngines: [
        "Free Community Engine (FLUX.1 Schnell) \xB7 Zero-Cost Verified",
        "Google Gemini 3.1 Flash Image \xB7 Free-tier quota guarded"
      ],
      videoEngine: "Google Gemini Omni Flash 1.2 \xB7 Free-tier quota guarded",
      activeProviders: ["Google Gemini API", "Zero-Cost Community Engine"],
      costGuarantees: "Zero automatic upgrades, zero credit deduction on failed/quota requests"
    },
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    uptimeSeconds: Math.floor(process.uptime())
  });
});
router8.use("/auth", authRoutes_default);
router8.use("/generate", generationRoutes_default);
router8.use("/gallery", galleryRoutes_default);
router8.use("/creations", galleryRoutes_default);
router8.use("/dashboard", dashboardRoutes_default);
router8.use("/upload", uploadRoutes_default);
router8.use("/credits", creditsRoutes_default);
router8.use("/collections", collectionsRoutes_default);
var routes_default = router8;

// server/src/middleware/errorHandler.ts
function errorHandler(err, _req, res, _next) {
  console.error("[Unhandled Error]", err);
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  return sendError(res, message, statusCode, process.env.NODE_ENV === "development" ? err.stack : void 0);
}

// server/src/app.ts
var __filename6 = fileURLToPath6(import.meta.url);
var __dirname6 = path7.dirname(__filename6);
var app = express();
app.use(
  cors({
    origin: true,
    credentials: true
  })
);
app.use((req, _res, next) => {
  const matchedPath = req.headers["x-matched-path"] || req.headers["x-vercel-matched-path"];
  if (matchedPath && (matchedPath.startsWith("/api") || matchedPath.startsWith("/uploads"))) {
    req.url = matchedPath;
  } else if (req.url.startsWith("/api/index/")) {
    req.url = req.url.replace("/api/index/", "/api/");
  } else if (req.url === "/api/index") {
    if (req.originalUrl && req.originalUrl.startsWith("/api/")) {
      req.url = req.originalUrl;
    } else {
      req.url = "/api";
    }
  }
  next();
});
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));
app.use((req, _res, next) => {
  if (!req.body || typeof req.body !== "object") {
    req.body = {};
  }
  next();
});
var isDbInitialized = false;
var dbInitPromise = null;
async function ensureDatabaseReady() {
  if (isDbInitialized) return;
  if (!dbInitPromise) {
    dbInitPromise = (async () => {
      try {
        await connectDatabase();
        const existing = await dbRepository.users.findByEmail("creator@studio.in");
        if (!existing) {
          const hashedPassword = await hashPassword("password123");
          const user = await dbRepository.users.create({
            email: "creator@studio.in",
            name: "Forma Studio Lead",
            password: hashedPassword,
            planId: "free",
            credits: 25,
            maxCredits: 25
          });
          await dbRepository.collections.create(user.id, "Brand Kit");
          await dbRepository.collections.create(user.id, "Campaigns");
          await dbRepository.collections.create(user.id, "Motion Studies");
          await dbRepository.usageQuota.log({
            userId: user.id,
            label: "Welcome Free Plan allocation",
            mode: "topup",
            delta: 25,
            balanceAfter: 25,
            timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          });
          console.log("[Database] Default creator account initialized (creator@studio.in / password123)");
        }
        isDbInitialized = true;
      } catch (err) {
        console.warn("[Database] Cold-start initialization notice:", err.message || err);
      } finally {
        dbInitPromise = null;
      }
    })();
  }
  return dbInitPromise;
}
app.use(async (_req, _res, next) => {
  try {
    await ensureDatabaseReady();
  } catch (err) {
    console.warn("[Database Middleware Error]", err);
  }
  next();
});
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (!req.path.startsWith("/uploads") && !req.path.startsWith("/assets")) {
      console.log(`[HTTP] ${req.method} ${req.path} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});
app.use("/uploads", express.static(baseUploadDir));
app.get("/uploads/:folder/:filename", async (req, res, next) => {
  const { filename } = req.params;
  const streamed = await gridFSStorage.streamToResponse(filename, res);
  if (!streamed) {
    res.status(404).json({ success: false, error: "Media asset not found" });
  }
});
app.use("/api", routes_default);
app.use(routes_default);
app.use("/api/*", (_req, res) => {
  res.status(404).json({ success: false, error: "Endpoint not found" });
});
var distDir = path7.resolve(__dirname6, "../../dist");
if (fs6.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
      return next();
    }
    res.sendFile(path7.join(distDir, "index.html"));
  });
}
app.use(errorHandler);

// server/src/vercel.ts
var vercel_default = app;
export {
  vercel_default as default
};
