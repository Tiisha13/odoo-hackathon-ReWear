import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'swap_request',
      'swap_accepted',
      'swap_rejected',
      'swap_completed',
      'item_redeemed',
      'item_approved',
      'item_rejected',
      'points_earned',
      'points_transferred'
    ]
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better query performance
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ type: 1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
