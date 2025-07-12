import { Response } from 'express';
import { Notification } from '../models/Notification';
import { AuthRequest } from '../middlewares/auth';

export class NotificationController {
  static async getNotifications(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 20, unreadOnly = false } = req.query;

      const query: any = { userId: req.user._id };
      if (unreadOnly === 'true') {
        query.read = false;
      }

      const skip = (Number(page) - 1) * Number(limit);

      const notifications = await Notification.find(query)
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit));

      const total = await Notification.countDocuments(query);
      const unreadCount = await Notification.countDocuments({
        userId: req.user._id,
        read: false
      });

      res.json({
        notifications,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        },
        unreadCount
      });
    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async markAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { notificationId } = req.params;

      const notification = await Notification.findOne({
        _id: notificationId,
        userId: req.user._id
      });

      if (!notification) {
        res.status(404).json({ message: 'Notification not found' });
        return;
      }

      if (notification.read) {
        res.status(400).json({ message: 'Notification is already read' });
        return;
      }

      notification.read = true;
      await notification.save();

      res.json({
        message: 'Notification marked as read',
        notification
      });
    } catch (error) {
      console.error('Mark notification as read error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async markAllAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await Notification.updateMany(
        { userId: req.user._id, read: false },
        { read: true }
      );

      res.json({
        message: 'All notifications marked as read',
        updatedCount: result.modifiedCount
      });
    } catch (error) {
      console.error('Mark all notifications as read error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async deleteNotification(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { notificationId } = req.params;

      const notification = await Notification.findOneAndDelete({
        _id: notificationId,
        userId: req.user._id
      });

      if (!notification) {
        res.status(404).json({ message: 'Notification not found' });
        return;
      }

      res.json({
        message: 'Notification deleted successfully'
      });
    } catch (error) {
      console.error('Delete notification error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async getUnreadCount(req: AuthRequest, res: Response): Promise<void> {
    try {
      const unreadCount = await Notification.countDocuments({
        userId: req.user._id,
        read: false
      });

      res.json({
        unreadCount
      });
    } catch (error) {
      console.error('Get unread count error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async getNotificationsByType(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { type } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const validTypes = [
        'swap_request',
        'swap_accepted',
        'swap_rejected',
        'swap_completed',
        'item_redeemed',
        'item_approved',
        'item_rejected',
        'points_earned',
        'points_transferred'
      ];

      if (!validTypes.includes(type)) {
        res.status(400).json({ message: 'Invalid notification type' });
        return;
      }

      const skip = (Number(page) - 1) * Number(limit);

      const notifications = await Notification.find({
        userId: req.user._id,
        type
      })
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit));

      const total = await Notification.countDocuments({
        userId: req.user._id,
        type
      });

      res.json({
        notifications,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Get notifications by type error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async createNotification(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId, type, message } = req.body;

      // Only admins can create notifications for other users
      if (req.user.role !== 'admin' && userId !== req.user._id.toString()) {
        res.status(403).json({ message: 'Not authorized to create notifications for other users' });
        return;
      }

      const notification = new Notification({
        userId,
        type,
        message,
        read: false
      });

      await notification.save();

      res.status(201).json({
        message: 'Notification created successfully',
        notification
      });
    } catch (error) {
      console.error('Create notification error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async deleteAllRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await Notification.deleteMany({
        userId: req.user._id,
        read: true
      });

      res.json({
        message: 'All read notifications deleted',
        deletedCount: result.deletedCount
      });
    } catch (error) {
      console.error('Delete all read notifications error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async getNotificationSettings(req: AuthRequest, res: Response): Promise<void> {
    try {
      // This could be extended to include user notification preferences
      // For now, return default settings
      const settings = {
        emailNotifications: true,
        pushNotifications: true,
        types: {
          swap_request: true,
          swap_accepted: true,
          swap_rejected: true,
          swap_completed: true,
          item_approved: true,
          item_rejected: true,
          points_earned: true,
          points_transferred: true
        }
      };

      res.json({ settings });
    } catch (error) {
      console.error('Get notification settings error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}
