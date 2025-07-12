import express from 'express';
import { body } from 'express-validator';
import { SwapController } from '../controllers/swapController';
import { authenticateToken } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validation';

const router = express.Router();

// All swap routes require authentication
router.use(authenticateToken);

// Validation rules
const createSwapValidation = [
  body('itemId')
    .isMongoId()
    .withMessage('Valid item ID is required'),
  body('type')
    .isIn(['direct', 'points'])
    .withMessage('Type must be either direct or points')
];

const rejectSwapValidation = [
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason cannot exceed 500 characters')
];

// Routes
router.post('/request', validateRequest(createSwapValidation), SwapController.createSwapRequest);
router.put('/:swapId/accept', SwapController.acceptSwapRequest);
router.put('/:swapId/reject', validateRequest(rejectSwapValidation), SwapController.rejectSwapRequest);
router.put('/:swapId/complete', SwapController.completeSwap);
router.put('/:swapId/cancel', SwapController.cancelSwapRequest);
router.get('/user/:userId', SwapController.getUserSwaps);
router.get('/item/:itemId/history', SwapController.getSwapHistory);

export default router;
