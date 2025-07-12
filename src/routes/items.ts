import express from 'express';
import { body } from 'express-validator';
import { ItemController } from '../controllers/itemController';
import { authenticateToken, optionalAuth } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validation';
import { uploadItemImages } from '../middlewares/upload';
import { cacheMiddleware } from '../middlewares/cache';

const router = express.Router();

// Validation rules
const createItemValidation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('category')
    .isIn(['shirts', 'pants', 'dresses', 'skirts', 'shorts', 'jackets', 'coats', 'sweaters', 'hoodies', 'activewear', 'shoes', 'accessories', 'other'])
    .withMessage('Invalid category'),
  body('size')
    .isIn(['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'One Size'])
    .withMessage('Invalid size'),
  body('condition')
    .isIn(['new', 'like-new', 'good', 'fair'])
    .withMessage('Invalid condition'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
];

// Routes
router.post('/', authenticateToken, uploadItemImages, validateRequest(createItemValidation), ItemController.createItem);
router.get('/popular', cacheMiddleware('popular', 1800), ItemController.getPopularItems);
router.get('/search', optionalAuth, cacheMiddleware('search', 600), ItemController.searchItems);
router.get('/user/:userId', optionalAuth, ItemController.getUserItems);
router.get('/:id', optionalAuth, ItemController.getItem);
router.put('/:id', authenticateToken, ItemController.updateItem);
router.delete('/:id', authenticateToken, ItemController.deleteItem);

export default router;
