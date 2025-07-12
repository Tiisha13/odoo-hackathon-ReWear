import express from 'express';
import { FrontendAuthController } from '../controllers/frontendAuthController';
const router = express.Router();

// Apply session locals middleware to all routes
router.use(FrontendAuthController.setLocals);

// Authentication routes
router.get('/login', FrontendAuthController.showLogin);
router.get('/register', FrontendAuthController.showRegister);
router.post('/auth/login', FrontendAuthController.login);
router.post('/auth/register', FrontendAuthController.register);
router.post('/auth/logout', FrontendAuthController.logout);

// Protected routes
router.get('/dashboard', FrontendAuthController.requireAuth, FrontendAuthController.showDashboard);

// Profile routes
router.get('/profile', FrontendAuthController.requireAuth, async (req: any, res: any) => {
    try {
        res.render('profile/index', { 
            user: req.session.user,
            title: 'My Profile - ReWear',
            page: 'profile'
        });
    } catch (error) {
        console.error('Profile error:', error);
        req.flash('error', 'Error loading profile');
        res.redirect('/dashboard');
    }
});

router.post('/profile/update', FrontendAuthController.requireAuth, async (req: any, res: any) => {
    // Profile update logic would go here
    req.flash('success', 'Profile updated successfully');
    res.redirect('/profile');
});

router.post('/profile/change-password', FrontendAuthController.requireAuth, async (req: any, res: any) => {
    // Password change logic would go here
    req.flash('success', 'Password changed successfully');
    res.redirect('/profile');
});

// Items routes
router.get('/items/create', FrontendAuthController.requireAuth, async (req: any, res: any) => {
    try {
        res.render('items/create', { 
            user: req.session.user,
            title: 'Upload Item - ReWear',
            page: 'items'
        });
    } catch (error) {
        console.error('Items create error:', error);
        req.flash('error', 'Error loading upload form');
        res.redirect('/dashboard');
    }
});

router.post('/items/create', FrontendAuthController.requireAuth, async (req: any, res: any) => {
    // Item creation logic would go here
    req.flash('success', 'Item uploaded successfully');
    res.redirect('/dashboard');
});

// Points routes
router.get('/points/history', FrontendAuthController.requireAuth, async (req: any, res: any) => {
    try {
        const { PointsTransaction } = await import('../models/PointsTransaction');
        
        // Get user's points transactions
        const transactions = await PointsTransaction.find({ userId: req.session.user._id })
            .sort({ createdAt: -1 })
            .lean();

        // Calculate totals
        const totalEarned = transactions
            .filter(t => t.type === 'earn')
            .reduce((sum, t) => sum + t.points, 0);
        
        const totalSpent = transactions
            .filter(t => t.type === 'redeem')
            .reduce((sum, t) => sum + Math.abs(t.points), 0);

        res.render('points/history', { 
            user: req.session.user,
            title: 'Points History - ReWear',
            page: 'points',
            transactions,
            totalEarned,
            totalSpent
        });
    } catch (error) {
        console.error('Points history error:', error);
        req.flash('error', 'Error loading points history');
        res.redirect('/dashboard');
    }
});

// Swaps routes
router.get('/swaps', FrontendAuthController.requireAuth, async (req: any, res: any) => {
    try {
        const { Swap } = await import('../models/Swap');
        
        // Get user's swaps
        const swaps = await Swap.find({
            $or: [
                { requester: req.session.user._id },
                { 'targetItem.owner': req.session.user._id }
            ]
        })
        .populate('requester', 'name avatar')
        .populate('requestedItem', 'title images')
        .populate('targetItem', 'title images owner')
        .sort({ createdAt: -1 })
        .lean();

        res.render('swaps/index', { 
            user: req.session.user,
            title: 'My Swaps - ReWear',
            page: 'swaps',
            swaps
        });
    } catch (error) {
        console.error('Swaps error:', error);
        req.flash('error', 'Error loading swaps');
        res.redirect('/dashboard');
    }
});

// Notifications routes
router.get('/notifications', FrontendAuthController.requireAuth, async (req: any, res: any) => {
    try {
        const { Notification } = await import('../models/Notification');
        
        // Get user's notifications
        const notifications = await Notification.find({ user: req.session.user._id })
            .sort({ createdAt: -1 })
            .lean();

        res.render('notifications/index', { 
            user: req.session.user,
            title: 'Notifications - ReWear',
            page: 'notifications',
            notifications
        });
    } catch (error) {
        console.error('Notifications error:', error);
        req.flash('error', 'Error loading notifications');
        res.redirect('/dashboard');
    }
});

// Landing page
router.get('/', async (req: any, res: any) => {
    try {
        // Get dynamic stats and featured items
        const { Item } = await import('../models/Item');
        const { User } = await import('../models/User');
        const { Swap } = await import('../models/Swap');

        // Get statistics
        const [totalItems, totalUsers, totalSwaps, featuredItems] = await Promise.all([
            Item.countDocuments({ approved: true }),
            User.countDocuments(),
            Swap.countDocuments(),
            Item.find({ approved: true, available: true })
                .populate('owner', 'name')
                .sort({ createdAt: -1 })
                .limit(6)
                .lean()
        ]);

        res.render('index', { 
            user: req.session?.user || null,
            title: 'ReWear - Sustainable Fashion Exchange',
            page: 'home',
            stats: {
                items: totalItems,
                users: totalUsers,
                swaps: totalSwaps
            },
            featuredItems
        });
    } catch (error) {
        console.error('Homepage error:', error);
        res.render('index', { 
            user: req.session?.user || null,
            title: 'ReWear - Sustainable Fashion Exchange',
            page: 'home',
            stats: { items: 0, users: 0, swaps: 0 },
            featuredItems: []
        });
    }
});

// Auth routes
router.get('/login', (req: any, res: any) => {
    res.render('auth/login', { 
        user: req.session?.user || null,
        title: 'Login - ReWear',
        page: 'login'
    });
});

router.get('/register', (req: any, res: any) => {
    res.render('auth/register', { 
        user: req.session?.user || null,
        title: 'Register - ReWear',
        page: 'register'
    });
});

// Items routes
router.get('/browse', async (req: any, res: any) => {
    try {
        // Import ItemController
        const { ItemController } = await import('../controllers/itemController');
        
        // Create a mock response object to capture the data
        const mockRes = {
            json: (data: any) => data,
            status: (code: number) => ({ json: (data: any) => data })
        };
        
        // Call the controller method directly
        let itemsData;
        try {
            await ItemController.browseItems(req, mockRes as any);
            // The controller sets the response directly, so we need to call it differently
            // Let's use the Item model directly instead
            const { Item } = await import('../models/Item');
            
            const {
                search,
                category,
                size,
                condition,
                page = 1,
                limit = 12
            } = req.query;

            // Build filter object
            const filter: any = {
                available: true,
                approved: true
            };

            // Search filter
            if (search) {
                filter.$or = [
                    { title: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } },
                    { tags: { $in: [new RegExp(search as string, 'i')] } }
                ];
            }

            // Category filter
            if (category && category !== '') {
                filter.category = category;
            }

            // Size filter
            if (size && size !== '') {
                filter.size = size;
            }

            // Condition filter
            if (condition && condition !== '') {
                filter.condition = condition;
            }

            // Pagination
            const pageNum = parseInt(page as string) || 1;
            const limitNum = parseInt(limit as string) || 12;
            const skip = (pageNum - 1) * limitNum;

            // Get items with pagination
            const items = await Item.find(filter)
                .populate('owner', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean();

            // Get total count for pagination
            const totalItems = await Item.countDocuments(filter);
            const totalPages = Math.ceil(totalItems / limitNum);

            itemsData = {
                items,
                pagination: {
                    currentPage: pageNum,
                    totalPages,
                    totalItems,
                    limit: limitNum,
                    hasNextPage: pageNum < totalPages,
                    hasPrevPage: pageNum > 1
                }
            };
        } catch (controllerError) {
            console.error('Controller error:', controllerError);
            itemsData = { items: [], pagination: {} };
        }
        
        res.render('items/browse', { 
            user: req.session?.user || null,
            title: 'Browse Items - ReWear',
            page: 'browse',
            itemsData,
            query: req.query
        });
    } catch (error) {
        console.error('Browse items error:', error);
        res.render('items/browse', { 
            user: req.session?.user || null,
            title: 'Browse Items - ReWear',
            page: 'browse',
            itemsData: { items: [], pagination: {} },
            query: req.query,
            error: 'Failed to load items'
        });
    }
});

router.get('/items/create', (req: any, res: any) => {
    if (!req.session?.user) {
        return res.redirect('/login');
    }
    res.render('items/create', { 
        user: req.session.user,
        title: 'List an Item - ReWear',
        page: 'create'
    });
});

router.get('/items/:id', async (req: any, res: any) => {
    try {
        const { Item } = await import('../models/Item');
        
        const item = await Item.findById(req.params.id)
            .populate('owner', 'name email location')
            .lean();

        if (!item) {
            return res.status(404).render('errors/404', {
                user: req.session?.user || null,
                title: 'Item Not Found - ReWear',
                message: 'The item you are looking for could not be found.'
            });
        }

        // Get related items (same category, different owner)
        const relatedItems = await Item.find({
            category: item.category,
            _id: { $ne: item._id },
            owner: { $ne: item.owner._id },
            available: true,
            approved: true
        })
        .populate('owner', 'name')
        .limit(3)
        .lean();

        res.render('items/detail', { 
            user: req.session?.user || null,
            title: `${item.title} - ReWear`,
            page: 'item',
            item,
            relatedItems
        });
    } catch (error) {
        console.error('Item detail error:', error);
        res.status(500).render('errors/500', {
            user: req.session?.user || null,
            title: 'Error - ReWear',
            message: 'Failed to load item details.'
        });
    }
});

// Dashboard routes
router.get('/dashboard', (req: any, res: any) => {
    if (!req.session?.user) {
        return res.redirect('/login');
    }
    
    if (req.session.user.role === 'admin') {
        res.render('dashboard/admin', { 
            user: req.session.user,
            title: 'Admin Dashboard - ReWear',
            page: 'dashboard'
        });
    } else {
        res.render('dashboard/user', { 
            user: req.session.user,
            title: 'Dashboard - ReWear',
            page: 'dashboard'
        });
    }
});

// Swaps routes
router.get('/swaps', (req: any, res: any) => {
    if (!req.session?.user) {
        return res.redirect('/login');
    }
    res.render('swaps/list', { 
        user: req.session.user,
        title: 'My Swaps - ReWear',
        page: 'swaps'
    });
});

export default router;
