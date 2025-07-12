import express from 'express';
import { body } from 'express-validator';
import { AdminController } from '../controllers/adminController';
import { authenticateToken } from '../middlewares/auth';
import { requireAdmin } from '../middlewares/roleCheck';
import { validateRequest } from '../middlewares/validation';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// Validation rules
const adjustPointsValidation = [
  body('points')
    .isInt()
    .withMessage('Points must be an integer'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Reason cannot exceed 200 characters')
];

const rejectItemValidation = [
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason cannot exceed 500 characters')
];

// Routes
router.get('/dashboard', AdminController.getDashboardStats);
router.get('/users', AdminController.getAllUsers);
router.get('/items', AdminController.getAllItems);
router.get('/items/pending', AdminController.getPendingItems);
router.get('/swaps', AdminController.getAllSwaps);

router.put('/items/:id/approve', AdminController.approveItem);
router.put('/items/:id/reject', validateRequest(rejectItemValidation), AdminController.rejectItem);
router.delete('/users/:id', AdminController.banUser);
router.put('/points/:userId/adjust', validateRequest(adjustPointsValidation), AdminController.adjustUserPoints);

export default router;
