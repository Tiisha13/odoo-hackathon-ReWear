import { Response } from 'express';
import { Swap } from '../models/Swap';
import { Item } from '../models/Item';
import { User } from '../models/User';
import { Notification } from '../models/Notification';
import { PointsTransaction } from '../models/PointsTransaction';
import { CacheHelper } from '../utils/cacheHelper';
import { PointsCalculator } from '../utils/pointsCalculator';
import { AuthRequest } from '../middlewares/auth';

export class SwapController {
  static async createSwapRequest(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { itemId, type } = req.body; // type: 'direct' or 'points'

      const item = await Item.findById(itemId).populate('owner');
      if (!item) {
        res.status(404).json({ message: 'Item not found' });
        return;
      }

      if (!item.approved || !item.available) {
        res.status(400).json({ message: 'Item is not available for swap' });
        return;
      }

      if (item.owner._id.toString() === req.user._id.toString()) {
        res.status(400).json({ message: 'You cannot swap your own item' });
        return;
      }

      // Check if user has enough points for point-based swap
      if (type === 'points') {
        const requiredPoints = PointsCalculator.calculateItemRedemptionCost(item.condition);
        if (req.user.points < requiredPoints) {
          res.status(400).json({ 
            message: `Insufficient points. Required: ${requiredPoints}, Available: ${req.user.points}` 
          });
          return;
        }
      }

      // Check if there's already a pending request
      const existingSwap = await Swap.findOne({
        requester: req.user._id,
        item: itemId,
        status: 'pending'
      });

      if (existingSwap) {
        res.status(400).json({ message: 'You already have a pending request for this item' });
        return;
      }

      // Create swap request
      const swap = new Swap({
        requester: req.user._id,
        receiver: item.owner._id,
        item: itemId,
        type,
        status: 'pending'
      });

      await swap.save();

      // Create notification for item owner
      const notification = new Notification({
        userId: item.owner._id,
        type: 'swap_request',
        message: `${req.user.name} requested to swap your item "${item.title}"`
      });
      await notification.save();

      res.status(201).json({
        message: 'Swap request created successfully',
        swap
      });
    } catch (error) {
      console.error('Create swap request error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async acceptSwapRequest(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { swapId } = req.params;

      const swap = await Swap.findById(swapId)
        .populate('requester', 'name email points')
        .populate('receiver', 'name email')
        .populate('item', 'title condition');

      if (!swap) {
        res.status(404).json({ message: 'Swap request not found' });
        return;
      }

      if (swap.receiver._id.toString() !== req.user._id.toString()) {
        res.status(403).json({ message: 'Not authorized to accept this swap' });
        return;
      }

      if (swap.status !== 'pending') {
        res.status(400).json({ message: 'Swap request is not pending' });
        return;
      }

      // Handle point-based swap
      if (swap.type === 'points') {
        const requiredPoints = PointsCalculator.calculateItemRedemptionCost((swap.item as any).condition);
        
        if ((swap.requester as any).points < requiredPoints) {
          res.status(400).json({ message: 'Requester has insufficient points' });
          return;
        }

        // Deduct points from requester
        await User.findByIdAndUpdate(swap.requester._id, {
          $inc: { points: -requiredPoints }
        });

        // Add points to receiver
        await User.findByIdAndUpdate(swap.receiver._id, {
          $inc: { points: requiredPoints }
        });

        // Create point transactions
        const deductTransaction = new PointsTransaction({
          userId: swap.requester._id,
          type: 'redeem',
          points: requiredPoints,
          refId: swap.item._id,
          description: `Points redeemed for item: ${(swap.item as any).title}`
        });

        const earnTransaction = new PointsTransaction({
          userId: swap.receiver._id,
          type: 'earn',
          points: requiredPoints,
          refId: swap.item._id,
          description: `Points earned from item swap: ${(swap.item as any).title}`
        });

        await Promise.all([deductTransaction.save(), earnTransaction.save()]);

        // Invalidate points cache
        await Promise.all([
          CacheHelper.invalidateUserPoints(swap.requester._id.toString()),
          CacheHelper.invalidateUserPoints(swap.receiver._id.toString())
        ]);
      }

      // Award swap completion points to both users
      const swapPoints = PointsCalculator.calculateSwapPoints();
      await Promise.all([
        User.findByIdAndUpdate(swap.requester._id, { $inc: { points: swapPoints } }),
        User.findByIdAndUpdate(swap.receiver._id, { $inc: { points: swapPoints } })
      ]);

      // Create point transactions for swap completion
      const requesterSwapTransaction = new PointsTransaction({
        userId: swap.requester._id,
        type: 'earn',
        points: swapPoints,
        refId: swap._id,
        description: `Points earned for completing swap: ${(swap.item as any).title}`
      });

      const receiverSwapTransaction = new PointsTransaction({
        userId: swap.receiver._id,
        type: 'earn',
        points: swapPoints,
        refId: swap._id,
        description: `Points earned for completing swap: ${(swap.item as any).title}`
      });

      await Promise.all([
        requesterSwapTransaction.save(),
        receiverSwapTransaction.save()
      ]);

      // Update swap status
      swap.status = 'accepted';
      await swap.save();

      // Mark item as unavailable
      await Item.findByIdAndUpdate(swap.item._id, { available: false });

      // Create notifications
      const requesterNotification = new Notification({
        userId: swap.requester._id,
        type: 'swap_accepted',
        message: `Your swap request for "${(swap.item as any).title}" has been accepted!`
      });

      const receiverNotification = new Notification({
        userId: swap.receiver._id,
        type: 'swap_completed',
        message: `Swap completed for "${(swap.item as any).title}". You earned ${swapPoints} points!`
      });

      await Promise.all([requesterNotification.save(), receiverNotification.save()]);

      // Invalidate caches
      await Promise.all([
        CacheHelper.invalidateItemsCache(),
        CacheHelper.invalidateUserPoints(swap.requester._id.toString()),
        CacheHelper.invalidateUserPoints(swap.receiver._id.toString())
      ]);

      res.json({
        message: 'Swap request accepted successfully',
        swap
      });
    } catch (error) {
      console.error('Accept swap request error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async rejectSwapRequest(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { swapId } = req.params;
      const { reason } = req.body;

      const swap = await Swap.findById(swapId)
        .populate('requester', 'name email')
        .populate('receiver', 'name email')
        .populate('item', 'title');

      if (!swap) {
        res.status(404).json({ message: 'Swap request not found' });
        return;
      }

      if (swap.receiver._id.toString() !== req.user._id.toString()) {
        res.status(403).json({ message: 'Not authorized to reject this swap' });
        return;
      }

      if (swap.status !== 'pending') {
        res.status(400).json({ message: 'Swap request is not pending' });
        return;
      }

      // Update swap status
      swap.status = 'rejected';
      await swap.save();

      // Create notification for requester
      const notification = new Notification({
        userId: swap.requester._id,
        type: 'swap_rejected',
        message: `Your swap request for "${(swap.item as any).title}" has been rejected. ${reason ? `Reason: ${reason}` : ''}`
      });
      await notification.save();

      res.json({
        message: 'Swap request rejected successfully',
        swap
      });
    } catch (error) {
      console.error('Reject swap request error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async getUserSwaps(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { status, type, page = 1, limit = 20 } = req.query;

      // Check if user can view these swaps
      const isOwnSwaps = userId === req.user._id.toString();
      const isAdmin = req.user.role === 'admin';

      if (!isOwnSwaps && !isAdmin) {
        res.status(403).json({ message: 'Not authorized to view these swaps' });
        return;
      }

      const query: any = {
        $or: [
          { requester: userId },
          { receiver: userId }
        ]
      };

      if (status) query.status = status;
      if (type) query.type = type;

      const skip = (Number(page) - 1) * Number(limit);

      const swaps = await Swap.find(query)
        .populate('requester', 'name email avatar')
        .populate('receiver', 'name email avatar')
        .populate('item', 'title description images category condition')
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
      console.error('Get user swaps error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async completeSwap(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { swapId } = req.params;

      const swap = await Swap.findById(swapId)
        .populate('requester', 'name email')
        .populate('receiver', 'name email')
        .populate('item', 'title');

      if (!swap) {
        res.status(404).json({ message: 'Swap not found' });
        return;
      }

      // Only the requester can mark as completed
      if (swap.requester._id.toString() !== req.user._id.toString()) {
        res.status(403).json({ message: 'Not authorized to complete this swap' });
        return;
      }

      if (swap.status !== 'accepted') {
        res.status(400).json({ message: 'Swap must be accepted first' });
        return;
      }

      // Update swap status
      swap.status = 'completed';
      await swap.save();

      // Create completion notification
      const notification = new Notification({
        userId: swap.receiver._id,
        type: 'swap_completed',
        message: `Swap for "${(swap.item as any).title}" has been marked as completed by ${(swap.requester as any).name}`
      });
      await notification.save();

      res.json({
        message: 'Swap marked as completed successfully',
        swap
      });
    } catch (error) {
      console.error('Complete swap error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async cancelSwapRequest(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { swapId } = req.params;

      const swap = await Swap.findById(swapId)
        .populate('requester', 'name email')
        .populate('receiver', 'name email')
        .populate('item', 'title');

      if (!swap) {
        res.status(404).json({ message: 'Swap request not found' });
        return;
      }

      // Only the requester can cancel
      if (swap.requester._id.toString() !== req.user._id.toString()) {
        res.status(403).json({ message: 'Not authorized to cancel this swap' });
        return;
      }

      if (swap.status !== 'pending') {
        res.status(400).json({ message: 'Only pending swaps can be cancelled' });
        return;
      }

      // Update swap status
      swap.status = 'cancelled';
      await swap.save();

      // Create notification for receiver
      const notification = new Notification({
        userId: swap.receiver._id,
        type: 'swap_cancelled',
        message: `Swap request for "${(swap.item as any).title}" has been cancelled by ${(swap.requester as any).name}`
      });
      await notification.save();

      res.json({
        message: 'Swap request cancelled successfully',
        swap
      });
    } catch (error) {
      console.error('Cancel swap request error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async getSwapHistory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { itemId } = req.params;

      const swaps = await Swap.find({ item: itemId })
        .populate('requester', 'name email')
        .populate('receiver', 'name email')
        .sort('-createdAt');

      res.json({ swaps });
    } catch (error) {
      console.error('Get swap history error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}
