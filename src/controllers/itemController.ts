import { Request, Response } from 'express';
import { Item } from '../models/Item';
import { User } from '../models/User';
import { Notification } from '../models/Notification';
import { CacheHelper } from '../utils/cacheHelper';
import { PointsCalculator } from '../utils/pointsCalculator';
import { AuthRequest } from '../middlewares/auth';

export class ItemController {
  static async createItem(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { title, description, category, size, condition, tags } = req.body;
      
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        res.status(400).json({ message: 'At least one image is required' });
        return;
      }

      const images = req.files.map((file: any) => file.filename);

      const item = new Item({
        title,
        description,
        images,
        category,
        size,
        condition,
        tags: tags || [],
        owner: req.user._id,
        approved: false // Items need admin approval
      });

      await item.save();

      // Invalidate items cache
      await CacheHelper.invalidateItemsCache();

      res.status(201).json({
        message: 'Item created successfully. Pending admin approval.',
        item
      });
    } catch (error) {
      console.error('Create item error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async getItem(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const item = await Item.findById(id)
        .populate('owner', 'name location avatar')
        .populate('approvedBy', 'name');

      if (!item) {
        res.status(404).json({ message: 'Item not found' });
        return;
      }

      // Only show approved items to non-owners
      const isOwner = (req as AuthRequest).user && (req as AuthRequest).user._id.toString() === item.owner._id.toString();
      const isAdmin = (req as AuthRequest).user && (req as AuthRequest).user.role === 'admin';

      if (!item.approved && !isOwner && !isAdmin) {
        res.status(404).json({ message: 'Item not found' });
        return;
      }

      res.json({ item });
    } catch (error) {
      console.error('Get item error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async updateItem(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;

      const item = await Item.findById(id);
      if (!item) {
        res.status(404).json({ message: 'Item not found' });
        return;
      }

      // Check ownership or admin role
      const isOwner = item.owner.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'admin';

      if (!isOwner && !isAdmin) {
        res.status(403).json({ message: 'Not authorized to update this item' });
        return;
      }

      // If item was approved and user updates it, reset approval status
      if (item.approved && isOwner && !isAdmin) {
        updates.approved = false;
        updates.approvedBy = null;
        updates.approvedAt = null;
      }

      const updatedItem = await Item.findByIdAndUpdate(id, updates, { new: true });

      // Invalidate caches
      await CacheHelper.invalidateItemsCache();

      res.json({
        message: 'Item updated successfully',
        item: updatedItem
      });
    } catch (error) {
      console.error('Update item error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async deleteItem(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const item = await Item.findById(id);
      if (!item) {
        res.status(404).json({ message: 'Item not found' });
        return;
      }

      // Check ownership or admin role
      const isOwner = item.owner.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'admin';

      if (!isOwner && !isAdmin) {
        res.status(403).json({ message: 'Not authorized to delete this item' });
        return;
      }

      await Item.findByIdAndDelete(id);

      // Invalidate caches
      await CacheHelper.invalidateItemsCache();

      res.json({ message: 'Item deleted successfully' });
    } catch (error) {
      console.error('Delete item error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async searchItems(req: Request, res: Response): Promise<void> {
    try {
      const {
        category,
        size,
        condition,
        tags,
        search,
        minPoints,
        maxPoints,
        page = 1,
        limit = 20,
        sort = '-createdAt'
      } = req.query;

      // Build query for approved items only
      const query: any = { approved: true, available: true };

      if (category) query.category = category;
      if (size) query.size = size;
      if (condition) query.condition = condition;
      if (tags) {
        const tagArray = Array.isArray(tags) ? tags : [tags];
        query.tags = { $in: tagArray };
      }
      if (search) {
        query.$text = { $search: search as string };
      }

      // Try to get from cache first
      const cacheKey = JSON.stringify({ query, page, limit, sort });
      let cachedResults = await CacheHelper.getCachedSearchResults(cacheKey);
      
      if (cachedResults) {
        res.json(cachedResults);
        return;
      }

      const skip = (Number(page) - 1) * Number(limit);

      const items = await Item.find(query)
        .populate('owner', 'name location avatar')
        .sort(sort as string)
        .skip(skip)
        .limit(Number(limit));

      const total = await Item.countDocuments(query);

      const result = {
        items,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      };

      // Cache the results
      await CacheHelper.cacheSearchResults(cacheKey, result.items);

      res.json(result);
    } catch (error) {
      console.error('Search items error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async getUserItems(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { includeUnapproved = false } = req.query;

      // Check if requester can see unapproved items
      const isOwner = (req as AuthRequest).user && (req as AuthRequest).user._id.toString() === userId;
      const isAdmin = (req as AuthRequest).user && (req as AuthRequest).user.role === 'admin';

      const query: any = { owner: userId };
      
      // If not owner or admin, only show approved items
      if (!isOwner && !isAdmin) {
        query.approved = true;
      } else if (includeUnapproved === 'false') {
        query.approved = true;
      }

      const items = await Item.find(query)
        .populate('owner', 'name location avatar')
        .sort('-createdAt');

      res.json({ items });
    } catch (error) {
      console.error('Get user items error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async getPopularItems(req: Request, res: Response): Promise<void> {
    try {
      // Try to get from cache first
      let popularItems = await CacheHelper.getCachedPopularItems();
      
      if (!popularItems) {
        // Get items with most swaps/views (simplified - just recent items for now)
        popularItems = await Item.find({ approved: true, available: true })
          .populate('owner', 'name location avatar')
          .sort('-createdAt')
          .limit(10);

        await CacheHelper.cachePopularItems(popularItems);
      }

      res.json({ items: popularItems });
    } catch (error) {
      console.error('Get popular items error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}
