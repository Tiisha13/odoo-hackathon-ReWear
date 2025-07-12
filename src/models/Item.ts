import mongoose, { Document, Schema } from 'mongoose';

export interface IItem extends Document {
  title: string;
  description: string;
  images: string[];
  category: string;
  size: string;
  condition: 'new' | 'like-new' | 'good' | 'fair';
  tags: string[];
  available: boolean;
  approved: boolean;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  owner: mongoose.Types.ObjectId;
  createdAt: Date;
}

const itemSchema = new Schema<IItem>({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  images: [{
    type: String,
    required: true
  }],
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'shirts', 'pants', 'dresses', 'skirts', 'shorts', 'jackets', 'coats',
      'sweaters', 'hoodies', 'activewear', 'shoes', 'accessories', 'other'
    ]
  },
  size: {
    type: String,
    required: [true, 'Size is required'],
    enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'One Size']
  },
  condition: {
    type: String,
    required: [true, 'Condition is required'],
    enum: ['new', 'like-new', 'good', 'fair']
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  available: {
    type: Boolean,
    default: true
  },
  approved: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for better search performance
itemSchema.index({ category: 1, approved: 1, available: 1 });
itemSchema.index({ owner: 1 });
itemSchema.index({ approved: 1, createdAt: -1 });
itemSchema.index({ tags: 1 });
itemSchema.index({ title: 'text', description: 'text', tags: 'text' });

export const Item = mongoose.model<IItem>('Item', itemSchema);
