import express from 'express';
import { body } from 'express-validator';
import { AuthController } from '../controllers/authController';
import { authenticateToken } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validation';
import { uploadAvatar } from '../middlewares/upload';

const router = express.Router();

// Validation rules
const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('location')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Location must be between 2 and 100 characters')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
];

// Routes
router.post('/register', validateRequest(registerValidation), AuthController.register);
router.post('/login', validateRequest(loginValidation), AuthController.login);
router.get('/me', authenticateToken, AuthController.getProfile);
router.post('/logout', authenticateToken, AuthController.logout);
router.put('/avatar', authenticateToken, uploadAvatar, AuthController.uploadAvatar);
router.put('/password', authenticateToken, validateRequest(changePasswordValidation), AuthController.changePassword);

export default router;
