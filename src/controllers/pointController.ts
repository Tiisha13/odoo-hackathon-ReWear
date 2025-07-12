import { Response } from 'express';
import { User } from '../models/User';
import { PointsTransaction } from '../models/PointsTransaction';
import { Notification } from '../models/Notification';
import { CacheHelper } from '../utils/cacheHelper';
import { PointsCalculator } from '../utils/pointsCalculator';
import { AuthRequest } from '../middlewares/auth';

export class PointController {
  static async getPointsBalance(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Try to get from cache first
      let points = await CacheHelper.getCachedUserPoints(req.user.userId);
      
      if (points === null) {
        // If not in cache, fetch from database
        const user = await User.findById(req.user._id).select('points');
        if (!user) {
          res.status(404).json({ message: 'User not found' });
          return;
        }
        
        points = user.points;
        // Cache the points
        await CacheHelper.cacheUserPoints(req.user.userId, points);
      }

      res.json({
        userId: req.user._id,
        points,
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error('Get points balance error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async getTransactionHistory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 20, type } = req.query;

      const query: any = { userId: req.user._id };
      if (type) {
        query.type = type;
      }

      const skip = (Number(page) - 1) * Number(limit);

      const transactions = await PointsTransaction.find(query)
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit))
        .populate('refId', 'title'); // Populate referenced item if exists

      const total = await PointsTransaction.countDocuments(query);

      res.json({
        transactions,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Get transaction history error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async transferPoints(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { recipientId, points, message } = req.body;

      if (points <= 0) {
        res.status(400).json({ message: 'Points must be greater than 0' });
        return;
      }

      if (recipientId === req.user.userId) {
        res.status(400).json({ message: 'Cannot transfer points to yourself' });
        return;
      }

      // Check if sender has enough points
      const sender = await User.findById(req.user._id);
      if (!sender) {
        res.status(404).json({ message: 'Sender not found' });
        return;
      }

      if (sender.points < points) {
        res.status(400).json({ 
          message: `Insufficient points. Available: ${sender.points}, Required: ${points}` 
        });
        return;
      }

      // Check if recipient exists
      const recipient = await User.findById(recipientId);
      if (!recipient) {
        res.status(404).json({ message: 'Recipient not found' });
        return;
      }

      // Perform the transfer
      sender.points -= points;
      recipient.points += points;

      await Promise.all([sender.save(), recipient.save()]);

      // Create transaction records
      const senderTransaction = new PointsTransaction({
        userId: sender._id,
        type: 'transfer',
        points: -points, // Negative for outgoing transfer
        refId: recipient._id,
        description: `Points transferred to ${recipient.name}${message ? `: ${message}` : ''}`
      });

      const recipientTransaction = new PointsTransaction({
        userId: recipient._id,
        type: 'transfer',
        points: points, // Positive for incoming transfer
        refId: sender._id,
        description: `Points received from ${sender.name}${message ? `: ${message}` : ''}`
      });

      await Promise.all([senderTransaction.save(), recipientTransaction.save()]);

      // Create notification for recipient
      const notification = new Notification({
        userId: recipient._id,
        type: 'points_transferred',
        message: `You received ${points} points from ${sender.name}${message ? `: ${message}` : ''}`
      });
      await notification.save();

      // Invalidate points cache for both users
      await Promise.all([
        CacheHelper.invalidateUserPoints(String(sender._id)),
        CacheHelper.invalidateUserPoints(String(recipient._id))
      ]);

      res.json({
        message: 'Points transferred successfully',
        transfer: {
          from: {
            id: sender._id,
            name: sender.name,
            newBalance: sender.points
          },
          to: {
            id: recipient._id,
            name: recipient.name,
            newBalance: recipient.points
          },
          points,
          message
        }
      });
    } catch (error) {
      console.error('Transfer points error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async earnPoints(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { type, refId, description } = req.body;

      let pointsToEarn = 0;

      // Calculate points based on type
      switch (type) {
        case 'upload':
          pointsToEarn = PointsCalculator.calculateUploadPoints();
          break;
        case 'swap':
          pointsToEarn = PointsCalculator.calculateSwapPoints();
          break;
        case 'referral':
          pointsToEarn = PointsCalculator.calculateReferralPoints();
          break;
        default:
          res.status(400).json({ message: 'Invalid point earning type' });
          return;
      }

      // Update user points
      const user = await User.findByIdAndUpdate(
        req.user._id,
        { $inc: { points: pointsToEarn } },
        { new: true }
      );

      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      // Create transaction record
      const transaction = new PointsTransaction({
        userId: user._id,
        type: 'earn',
        points: pointsToEarn,
        refId,
        description: description || `Points earned for ${type}`
      });
      await transaction.save();

      // Create notification
      const notification = new Notification({
        userId: user._id,
        type: 'points_earned',
        message: `You earned ${pointsToEarn} points for ${type}!`
      });
      await notification.save();

      // Invalidate points cache
      await CacheHelper.invalidateUserPoints(String(user._id));

      res.json({
        message: 'Points earned successfully',
        pointsEarned: pointsToEarn,
        newBalance: user.points,
        transaction
      });
    } catch (error) {
      console.error('Earn points error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async getLeaderboard(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { limit = 10 } = req.query;

      const topUsers = await User.find({ role: 'user' })
        .select('name avatar points location')
        .sort('-points')
        .limit(Number(limit));

      // Find current user's ranking
      const currentUserRank = await User.countDocuments({
        role: 'user',
        points: { $gt: req.user.points }
      }) + 1;

      res.json({
        leaderboard: topUsers.map((user, index) => ({
          rank: index + 1,
          id: user._id,
          name: user.name,
          avatar: user.avatar,
          points: user.points,
          location: user.location
        })),
        currentUser: {
          rank: currentUserRank,
          points: req.user.points
        }
      });
    } catch (error) {
      console.error('Get leaderboard error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async getPointsStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user._id;

      // Get total points earned and spent
      const earnedStats = await PointsTransaction.aggregate([
        {
          $match: {
            userId: userId,
            type: { $in: ['earn', 'transfer'] },
            points: { $gt: 0 }
          }
        },
        {
          $group: {
            _id: '$type',
            totalPoints: { $sum: '$points' },
            count: { $sum: 1 }
          }
        }
      ]);

      const spentStats = await PointsTransaction.aggregate([
        {
          $match: {
            userId: userId,
            $or: [
              { type: 'redeem' },
              { type: 'transfer', points: { $lt: 0 } }
            ]
          }
        },
        {
          $group: {
            _id: '$type',
            totalPoints: { $sum: { $abs: '$points' } },
            count: { $sum: 1 }
          }
        }
      ]);

      // Get monthly breakdown
      const monthlyStats = await PointsTransaction.aggregate([
        {
          $match: {
            userId: userId,
            createdAt: {
              $gte: new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1)
            }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            earned: {
              $sum: {
                $cond: [{ $gt: ['$points', 0] }, '$points', 0]
              }
            },
            spent: {
              $sum: {
                $cond: [{ $lt: ['$points', 0] }, { $abs: '$points' }, 0]
              }
            }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1 }
        }
      ]);

      res.json({
        currentBalance: req.user.points,
        earnedStats,
        spentStats,
        monthlyStats
      });
    } catch (error) {
      console.error('Get points stats error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}
