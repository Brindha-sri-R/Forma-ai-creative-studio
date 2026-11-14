import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  id: string;
  email: string;
  name: string;
  password: string;
  avatarUrl?: string;
  planId: 'free' | 'pro' | 'studio';
  credits: number;
  maxCredits: number;
  resetCode?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    avatarUrl: {
      type: String,
      default: '',
    },
    planId: {
      type: String,
      enum: ['free', 'pro', 'studio'],
      default: 'free',
    },
    credits: {
      type: Number,
      default: 25,
      min: 0,
    },
    maxCredits: {
      type: Number,
      default: 25,
    },
    resetCode: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
