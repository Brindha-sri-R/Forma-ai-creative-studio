import mongoose, { Schema, Document } from 'mongoose';

export interface IFavorite extends Document {
  id: string;
  userId: string;
  generationId: string;
  createdAt: Date;
}

const FavoriteSchema = new Schema<IFavorite>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    generationId: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

FavoriteSchema.index({ userId: 1, generationId: 1 }, { unique: true });

export const FavoriteModel =
  mongoose.models.Favorite || mongoose.model<IFavorite>('Favorite', FavoriteSchema);

