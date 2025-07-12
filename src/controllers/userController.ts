import { Response, Request } from 'express';
interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}
import { User } from '../models/User';
import { Item } from '../models/Item';
import { Swap } from '../models/Swap';
import { PointsTransaction } from '../models/PointsTransaction';
import { CacheHelper } from '../utils/cacheHelper';

export class UserController {
  static async getUserProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const user = await User.findById(userId).select('-password');
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      res.status(200).json(user);
    } catch (error) {
      console.error('Get user profile error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async updateUserProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const { firstName, lastName, bio, location } = req.body;

      const user = await User.findByIdAndUpdate(
        userId,
        {
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(bio !== undefined && { bio }),
          ...(location !== undefined && { location })
        },
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      res.status(200).json({
        message: 'Profile updated successfully',
        user
      });
    } catch (error) {
      console.error('Update user profile error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async searchUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const {
        search = '',
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const searchQuery: any = {};
      if (search) {
        searchQuery.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      const sortObj: any = {};
      sortObj[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

      const users = await User.find(searchQuery)
        .select('-password')
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .lean();

      const total = await User.countDocuments(searchQuery);

      res.status(200).json({
        users,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      });
    } catch (error) {
      console.error('Search users error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async getUserStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId).select('firstName lastName points createdAt');
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      res.json({
        user: {
          id: user._id,
          name: `${(user as any).firstName} ${(user as any).lastName}`,
          currentPoints: user.points,
          memberSince: user.createdAt
        },
        stats: {
          items: { total: 0, approved: 0, pending: 0 },
          swaps: { total: 0 },
          points: {}
        }
      });
    } catch (error) {
      console.error('Get user stats error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async deleteUserAccount(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      await User.findByIdAndDelete(userId);
      res.status(200).json({ message: 'Account deleted successfully' });
    } catch (error) {
      console.error('Delete user account error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async getUserActivity(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      res.status(200).json({
        activity: [],
        pagination: {
          page: 1,
          limit: 20,
          hasMore: false
        }
      });
    } catch (error) {
      console.error('Get user activity error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async uploadAvatar(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      if (!req.file) {
        res.status(400).json({ message: 'No file uploaded' });
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      user.avatar = req.file.path;
      await user.save();

      res.status(200).json({
        message: 'Avatar uploaded successfully',
        avatar: user.avatar
      });
    } catch (error) {
      console.error('Upload avatar error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async deleteAvatar(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      user.avatar = null;
      await user.save();

      res.status(200).json({ message: 'Avatar deleted successfully' });
    } catch (error) {
      console.error('Delete avatar error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async getUserById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId)
        .select('-password')
        .lean();

      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      res.status(200).json(user);
    } catch (error) {
      console.error('Get user by ID error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}
