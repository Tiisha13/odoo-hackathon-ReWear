import mongoose, { Document, Schema } from 'mongoose';

export interface IPointsTransaction extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'earn' | 'redeem' | 'transfer';
  points: number;
  refId?: mongoose.Types.ObjectId;
  description: string;
  createdAt: Date;
}

const pointsTransactionSchema = new Schema<IPointsTransaction>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['earn', 'redeem', 'transfer'],
    required: true
  },
  points: {
    type: Number,
    required: true
  },
  refId: {
    type: Schema.Types.ObjectId,
    default: null
  },
  description: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
pointsTransactionSchema.index({ userId: 1, createdAt: -1 });
pointsTransactionSchema.index({ type: 1 });
pointsTransactionSchema.index({ refId: 1 });

export const PointsTransaction = mongoose.model<IPointsTransaction>('PointsTransaction', pointsTransactionSchema);
