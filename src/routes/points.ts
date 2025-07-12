import express from 'express';
import { body, query } from 'express-validator';
import { PointController } from '../controllers/pointController';
import { authenticateToken } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validation';

const router = express.Router();

// All points routes require authentication
router.use(authenticateToken);

// Validation rules
const transferPointsValidation = [
  body('recipientId')
    .isMongoId()
    .withMessage('Valid recipient ID is required'),
  body('amount')
    .isInt({ min: 1 })
    .withMessage('Amount must be a positive integer'),
  body('note')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Note cannot exceed 200 characters')
];

const getTransactionsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('type')
    .optional()
    .isIn(['earned', 'spent', 'transferred'])
    .withMessage('Type must be earned, spent, or transferred')
];

// Routes
router.get('/balance', PointController.getPointsBalance);
router.get('/transactions', validateRequest(getTransactionsValidation), PointController.getTransactionHistory);
router.post('/transfer', validateRequest(transferPointsValidation), PointController.transferPoints);
router.get('/leaderboard', PointController.getLeaderboard);
router.get('/statistics', PointController.getPointsStats);

export default router;
