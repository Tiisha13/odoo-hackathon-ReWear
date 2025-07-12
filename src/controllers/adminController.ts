import { Request, Response } from 'express';
import { Item } from '../models/Item';
import { User } from '../models/User';
import { Swap } from '../models/Swap';
import { Notification } from '../models/Notification';
import { PointsTransaction } from '../models/PointsTransaction';
import { CacheHelper } from '../utils/cacheHelper';
import { PointsCalculator } from '../utils/pointsCalculator';
import { AuthRequest } from '../middlewares/auth';

export class AdminController {
  static async getAllUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 20, search, role } = req.query;

      const query: any = {};
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }
      if (role) {
        query.role = role;
      }

      const skip = (Number(page) - 1) * Number(limit);

      const users = await User.find(query)
        .select('-password')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit));

      const total = await User.countDocuments(query);

      res.json({
        users,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async getAllItems(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 20, approved, category, owner } = req.query;

      const query: any = {};
      if (approved !== undefined) {
        query.approved = approved === 'true';
      }
      if (category) {
        query.category = category;
      }
      if (owner) {
        query.owner = owner;
      }

      const skip = (Number(page) - 1) * Number(limit);

      const items = await Item.find(query)
        .populate('owner', 'name email')
        .populate('approvedBy', 'name')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit));

      const total = await Item.countDocuments(query);

      res.json({
        items,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Get all items error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async getPendingItems(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 20 } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      const items = await Item.find({ approved: false })
        .populate('owner', 'name email location')
        .sort('createdAt') // Oldest first for review
        .skip(skip)
        .limit(Number(limit));

      const total = await Item.countDocuments({ approved: false });

      res.json({
        items,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Get pending items error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async approveItem(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const item = await Item.findById(id).populate('owner');
      if (!item) {
        res.status(404).json({ message: 'Item not found' });
        return;
      }

      if (item.approved) {
        res.status(400).json({ message: 'Item is already approved' });
        return;
      }

      // Approve the item
      item.approved = true;
      item.approvedBy = req.user._id;
      item.approvedAt = new Date();
      await item.save();

      // Award points to the item owner
      const owner = await User.findById(item.owner);
      if (owner) {
        const pointsEarned = PointsCalculator.calculateUploadPoints();
        owner.points += pointsEarned;
        await owner.save();

        // Create points transaction
        const transaction = new PointsTransaction({
          userId: owner._id,
          type: 'earn',
          points: pointsEarned,
          refId: item._id,
          description: `Points earned for approved item: ${item.title}`
        });
        await transaction.save();

        // Create notification
        const notification = new Notification({
          userId: owner._id,
          type: 'item_approved',
          message: `Your item "${item.title}" has been approved and you earned ${pointsEarned} points!`
        });
        await notification.save();

        // Invalidate caches
        await CacheHelper.invalidateUser(String(owner._id));
        await CacheHelper.invalidateUserPoints(String(owner._id));
      }

      // Invalidate items cache
      await CacheHelper.invalidateItemsCache();

      res.json({
        message: 'Item approved successfully',
        item
      });
    } catch (error) {
      console.error('Approve item error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async rejectItem(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const item = await Item.findById(id).populate('owner');
      if (!item) {
        res.status(404).json({ message: 'Item not found' });
        return;
      }

      if (item.approved) {
        res.status(400).json({ message: 'Cannot reject an approved item' });
        return;
      }

      // Create notification for owner
      const notification = new Notification({
        userId: item.owner._id,
        type: 'item_rejected',
        message: `Your item "${item.title}" was rejected. ${reason ? `Reason: ${reason}` : ''}`
      });
      await notification.save();

      // Delete the item
      await Item.findByIdAndDelete(id);

      // Invalidate items cache
      await CacheHelper.invalidateItemsCache();

      res.json({ message: 'Item rejected and removed successfully' });
    } catch (error) {
      console.error('Reject item error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async getAllSwaps(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 20, status, type } = req.query;

      const query: any = {};
      if (status) {
        query.status = status;
      }
      if (type) {
        query.type = type;
      }

      const skip = (Number(page) - 1) * Number(limit);

      const swaps = await Swap.find(query)
        .populate('requester', 'name email')
        .populate('receiver', 'name email')
        .populate('item', 'title category')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit));

      const total = await Swap.countDocuments(query);

      res.json({
        swaps,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Get all swaps error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async banUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (id === req.user._id.toString()) {
        res.status(400).json({ message: 'Cannot ban yourself' });
        return;
      }

      const user = await User.findById(id);
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      if (user.role === 'admin') {
        res.status(400).json({ message: 'Cannot ban an admin user' });
        return;
      }

      // Delete user and their items
      await Item.deleteMany({ owner: id });
      await User.findByIdAndDelete(id);

      // Invalidate caches
      await CacheHelper.invalidateUser(id);
      await CacheHelper.invalidateItemsCache();

      res.json({ message: 'User banned and removed successfully' });
    } catch (error) {
      console.error('Ban user error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async adjustUserPoints(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { points, reason } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      const oldPoints = user.points;
      user.points = Math.max(0, user.points + points); // Ensure points don't go negative
      await user.save();

      // Create transaction record
      const transaction = new PointsTransaction({
        userId: user._id,
        type: points > 0 ? 'earn' : 'redeem',
        points: Math.abs(points),
        description: reason || `Admin adjustment: ${points > 0 ? 'added' : 'removed'} ${Math.abs(points)} points`
      });
      await transaction.save();

      // Create notification
      const notification = new Notification({
        userId: user._id,
        type: 'points_earned',
        message: `Admin adjusted your points: ${points > 0 ? '+' : ''}${points} points. ${reason || ''}`
      });
      await notification.save();

      // Invalidate caches
      await CacheHelper.invalidateUser(userId);
      await CacheHelper.invalidateUserPoints(userId);

      res.json({
        message: 'Points adjusted successfully',
        oldPoints,
        newPoints: user.points,
        adjustment: points
      });
    } catch (error) {
      console.error('Adjust user points error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async getDashboardStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const stats = await Promise.all([
        User.countDocuments(),
        Item.countDocuments(),
        Item.countDocuments({ approved: true }),
        Item.countDocuments({ approved: false }),
        Swap.countDocuments(),
        Swap.countDocuments({ status: 'pending' }),
        Swap.countDocuments({ status: 'completed' })
      ]);

      res.json({
        totalUsers: stats[0],
        totalItems: stats[1],
        approvedItems: stats[2],
        pendingItems: stats[3],
        totalSwaps: stats[4],
        pendingSwaps: stats[5],
        completedSwaps: stats[6]
      });
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}
