import mongoose, { Schema, Document } from 'mongoose';

export interface IUsageQuota extends Document {
  id: string;
  userId: string;
  label: string;
  mode: 'image' | 'video' | 'topup';
  delta: number;
  balanceAfter: number;
  timestamp: string;
  createdAt: Date;
}

const UsageQuotaSchema = new Schema<IUsageQuota>(
  {
    _id: {
      type: String,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    label: {
      type: String,
      required: true,
    },
    mode: {
      type: String,
      enum: ['image', 'video', 'topup'],
      required: true,
    },
    delta: {
      type: Number,
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    timestamp: {
      type: String,
      required: true,
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

UsageQuotaSchema.index({ userId: 1, createdAt: -1 });

export const UsageQuotaModel =
  mongoose.models.UsageQuota || mongoose.model<IUsageQuota>('UsageQuota', UsageQuotaSchema);

