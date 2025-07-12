import mongoose, { Document, Schema } from 'mongoose';

export interface ISwap extends Document {
  requester: mongoose.Types.ObjectId;
  receiver: mongoose.Types.ObjectId;
  item: mongoose.Types.ObjectId;
  type: 'direct' | 'points';
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  createdAt: Date;
}

const swapSchema = new Schema<ISwap>({
  requester: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  item: {
    type: Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  type: {
    type: String,
    enum: ['direct', 'points'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
swapSchema.index({ requester: 1, status: 1 });
swapSchema.index({ receiver: 1, status: 1 });
swapSchema.index({ item: 1 });
swapSchema.index({ createdAt: -1 });

export const Swap = mongoose.model<ISwap>('Swap', swapSchema);
