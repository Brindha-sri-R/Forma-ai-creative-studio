import mongoose, { Schema, Document } from 'mongoose';

export interface ICollection extends Document {
  id: string;
  userId: string;
  name: string;
  createdAt: Date;
}

const CollectionSchema = new Schema<ICollection>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
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

CollectionSchema.index({ userId: 1, name: 1 }, { unique: true });

export const CollectionModel =
  mongoose.models.Collection || mongoose.model<ICollection>('Collection', CollectionSchema);

