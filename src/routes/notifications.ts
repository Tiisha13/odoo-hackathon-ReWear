import express from 'express';
import { body, query } from 'express-validator';
import { NotificationController } from '../controllers/notificationController';
import { authenticateToken } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validation';

const router = express.Router();

// All notification routes require authentication
router.use(authenticateToken);

// Validation rules
const createNotificationValidation = [
  body('recipientId')
    .isMongoId()
    .withMessage('Valid recipient ID is required'),
  body('type')
    .isIn(['swap_request', 'swap_accepted', 'swap_rejected', 'swap_completed', 'item_approved', 'item_rejected', 'points_received', 'system'])
    .withMessage('Invalid notification type'),
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),
  body('message')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Message must be between 1 and 500 characters')
];

const getNotificationsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  query('type')
    .optional()
    .isIn(['swap_request', 'swap_accepted', 'swap_rejected', 'swap_completed', 'item_approved', 'item_rejected', 'points_received', 'system'])
    .withMessage('Invalid notification type filter'),
  query('unreadOnly')
    .optional()
    .isBoolean()
    .withMessage('unreadOnly must be a boolean')
];

// Routes
router.post('/', validateRequest(createNotificationValidation), NotificationController.createNotification);
router.get('/', validateRequest(getNotificationsValidation), NotificationController.getNotifications);
router.put('/:notificationId/read', NotificationController.markAsRead);
router.put('/mark-all-read', NotificationController.markAllAsRead);
router.delete('/:notificationId', NotificationController.deleteNotification);
router.get('/unread-count', NotificationController.getUnreadCount);

export default router;
