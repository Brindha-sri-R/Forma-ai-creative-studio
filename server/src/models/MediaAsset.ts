import mongoose, { Schema, Document } from 'mongoose';

export interface IMediaAsset extends Document {
  id: string;
  userId: string;
  originalName: string;
  filename: string;
  mimeType: string;
  size: number;
  mediaKind: 'image' | 'video';
  url: string;
  storageProvider: 'local' | 'cloudinary' | 's3';
  purpose: 'reference' | 'generated' | 'avatar';
  createdAt: Date;
  updatedAt: Date;
}

const MediaAssetSchema = new Schema<IMediaAsset>(
  {
    _id: {
      type: String,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    filename: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    mediaKind: {
      type: String,
      enum: ['image', 'video'],
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    storageProvider: {
      type: String,
      enum: ['local', 'cloudinary', 's3'],
      default: 'local',
    },
    purpose: {
      type: String,
      enum: ['reference', 'generated', 'avatar'],
      default: 'reference',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

MediaAssetSchema.index({ userId: 1, createdAt: -1 });

export const MediaAssetModel =
  mongoose.models.MediaAsset || mongoose.model<IMediaAsset>('MediaAsset', MediaAssetSchema);

