import express from 'express';
import { body, query } from 'express-validator';
import { UserController } from '../controllers/userController';
import { authenticateToken } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validation';
import { uploadAvatar } from '../middlewares/upload';

const router = express.Router();

// All user routes require authentication
router.use(authenticateToken);

// Validation rules
const updateProfileValidation = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location cannot exceed 100 characters')
];

const getUsersValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Search term cannot be empty'),
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'firstName', 'points'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

// Routes
router.get('/profile', UserController.getUserProfile);
router.put('/profile', validateRequest(updateProfileValidation), UserController.updateUserProfile);
router.post('/avatar', uploadAvatar, UserController.uploadAvatar);
router.delete('/avatar', UserController.deleteAvatar);
router.get('/', validateRequest(getUsersValidation), UserController.searchUsers);
router.get('/:userId', UserController.getUserById);
router.get('/:userId/statistics', UserController.getUserStats);
router.get('/:userId/activity', UserController.getUserActivity);
router.delete('/account', UserController.deleteUserAccount);

export default router;
