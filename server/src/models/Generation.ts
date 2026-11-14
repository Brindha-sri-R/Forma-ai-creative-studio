import mongoose, { Schema } from 'mongoose';

export type GenerationMode = 'image' | 'video';
export type GenerationType = 'text-to-image' | 'text-to-video' | 'image-to-video';
export type GenerationStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface IGeneration {
  id?: string;
  _id?: any;
  userId: string;
  title: string;
  prompt: string;
  negativePrompt?: string;
  mode: GenerationMode;
  generationType: GenerationType;
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
  mediaKind: GenerationMode;
  status: GenerationStatus;
  saved: boolean;
  collectionName?: string | null;
  referenceAssetUrl?: string | null;
  referenceAssetName?: string | null;
  referenceMediaKind?: GenerationMode | null;
  errorMessage?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const GenerationSchema = new Schema<IGeneration>(
  {
    _id: {
      type: String,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    prompt: {
      type: String,
      required: true,
      trim: true,
    },
    negativePrompt: {
      type: String,
      default: '',
    },
    mode: {
      type: String,
      enum: ['image', 'video'],
      required: true,
    },
    generationType: {
      type: String,
      enum: ['text-to-image', 'text-to-video', 'image-to-video'],
      default: 'text-to-image',
    },
    aspectRatio: {
      type: String,
      default: '1:1',
    },
    resolution: {
      type: String,
      default: '1K',
    },
    style: {
      type: String,
      default: 'Editorial',
    },
    model: {
      type: String,
      default: 'Forma Diffusion v3',
    },
    variations: {
      type: Number,
      default: 1,
    },
    duration: {
      type: String,
      default: '4s',
    },
    motion: {
      type: String,
      default: 'Static',
    },
    fps: {
      type: String,
      default: '24 fps',
    },
    seed: {
      type: Number,
      required: true,
    },
    dimensions: {
      type: String,
      required: true,
    },
    creditsUsed: {
      type: Number,
      required: true,
      default: 1,
    },
    provider: {
      type: String,
      default: 'forma-engine',
    },
    mediaUrl: {
      type: String,
      required: true,
    },
    mediaKind: {
      type: String,
      enum: ['image', 'video'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'completed',
      index: true,
    },
    saved: {
      type: Boolean,
      default: false,
      index: true,
    },
    collectionName: {
      type: String,
      default: null,
      index: true,
    },
    referenceAssetUrl: {
      type: String,
      default: null,
    },
    referenceAssetName: {
      type: String,
      default: null,
    },
    referenceMediaKind: {
      type: String,
      enum: ['image', 'video', null],
      default: null,
    },
    errorMessage: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: any) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

GenerationSchema.index({ userId: 1, createdAt: -1 });

export const GenerationModel =
  mongoose.models.Generation || mongoose.model<IGeneration>('Generation', GenerationSchema);
