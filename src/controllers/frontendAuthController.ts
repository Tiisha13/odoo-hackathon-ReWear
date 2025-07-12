import { Request, Response } from 'express';
import { User } from '../models/User';
import { HashHelper } from '../utils/hashHelper';

// Extend Request to include session typing
interface SessionRequest extends Request {
  session: any;
  flash: any;
}

export class FrontendAuthController {
  // Render login page
  static async showLogin(req: SessionRequest, res: Response): Promise<void> {
    try {
      // If user is already logged in, redirect to dashboard
      if (req.session.user) {
        res.redirect('/dashboard');
        return;
      }

      res.render('auth/login', {
        title: 'Login - ReWear',
        page: 'login',
        user: null,
        error_msg: req.flash('error'),
        success_msg: req.flash('success')
      });
    } catch (error) {
      console.error('Show login error:', error);
      res.status(500).render('error', { message: 'Internal server error' });
    }
  }

  // Render register page
  static async showRegister(req: SessionRequest, res: Response): Promise<void> {
    try {
      // If user is already logged in, redirect to dashboard
      if (req.session.user) {
        res.redirect('/dashboard');
        return;
      }

      res.render('auth/register', {
        title: 'Register - ReWear',
        page: 'register',
        user: null,
        error_msg: req.flash('error'),
        success_msg: req.flash('success')
      });
    } catch (error) {
      console.error('Show register error:', error);
      res.status(500).render('error', { message: 'Internal server error' });
    }
  }

  // Handle login form submission
  static async login(req: SessionRequest, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // Validation
      if (!email || !password) {
        req.flash('error', 'Email and password are required');
        res.redirect('/login');
        return;
      }

      // Find user
      const user = await User.findOne({ email }).lean();
      if (!user) {
        req.flash('error', 'Invalid email or password');
        res.redirect('/login');
        return;
      }

      // Check password
      const isPasswordValid = await HashHelper.comparePassword(password, user.password);
      if (!isPasswordValid) {
        req.flash('error', 'Invalid email or password');
        res.redirect('/login');
        return;
      }

      // Create session
      const userSession = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        points: user.points,
        location: user.location,
        avatar: user.avatar
      };

      req.session.user = userSession;
      req.session.userId = String(user._id);

      req.flash('success', `Welcome back, ${user.name}!`);
      
      // Redirect to intended page or dashboard
      const redirectTo = req.session.returnTo || '/dashboard';
      delete req.session.returnTo;
      res.redirect(redirectTo);

    } catch (error) {
      console.error('Login error:', error);
      req.flash('error', 'Something went wrong. Please try again.');
      res.redirect('/login');
    }
  }

  // Handle register form submission
  static async register(req: SessionRequest, res: Response): Promise<void> {
    try {
      const { name, email, password, confirmPassword, location } = req.body;

      // Validation
      if (!name || !email || !password || !confirmPassword) {
        req.flash('error', 'All fields are required');
        res.redirect('/register');
        return;
      }

      if (password !== confirmPassword) {
        req.flash('error', 'Passwords do not match');
        res.redirect('/register');
        return;
      }

      if (password.length < 6) {
        req.flash('error', 'Password must be at least 6 characters long');
        res.redirect('/register');
        return;
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        req.flash('error', 'User already exists with this email');
        res.redirect('/register');
        return;
      }

      // Hash password
      const hashedPassword = await HashHelper.hashPassword(password);

      // Create user
      const user = new User({
        name,
        email,
        password: hashedPassword,
        location: location || '',
        points: 100 // Starting bonus points
      });

      await user.save();

      // Create session
      const userSession = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        points: user.points,
        location: user.location,
        avatar: user.avatar
      };

      req.session.user = userSession;
      req.session.userId = String(user._id);

      req.flash('success', `Welcome to ReWear, ${user.name}! You've received 100 bonus points!`);
      res.redirect('/dashboard');

    } catch (error) {
      console.error('Registration error:', error);
      req.flash('error', 'Something went wrong. Please try again.');
      res.redirect('/register');
    }
  }

  // Handle logout
  static async logout(req: SessionRequest, res: Response): Promise<void> {
    try {
      const userName = req.session.user?.name;
      
      // Destroy session
      req.session.destroy((err: any) => {
        if (err) {
          console.error('Session destroy error:', err);
        }
      });

      req.flash('success', `Goodbye${userName ? `, ${userName}` : ''}! You have been logged out.`);
      res.redirect('/');
    } catch (error) {
      console.error('Logout error:', error);
      res.redirect('/');
    }
  }

  // Middleware to check if user is authenticated
  static requireAuth(req: SessionRequest, res: Response, next: any): void {
    if (req.session.user) {
      next();
    } else {
      req.session.returnTo = req.originalUrl;
      req.flash('error', 'Please log in to access this page');
      res.redirect('/login');
    }
  }

  // Middleware to pass user to all views
  static setLocals(req: SessionRequest, res: Response, next: any): void {
    res.locals.user = req.session.user || null;
    res.locals.success_msg = req.flash('success');
    res.locals.error_msg = req.flash('error');
    next();
  }

  // Middleware for admin only
  static requireAdmin(req: SessionRequest, res: Response, next: any): void {
    if (req.session.user && req.session.user.role === 'admin') {
      next();
    } else {
      req.flash('error', 'Access denied. Admin privileges required.');
      res.redirect('/');
    }
  }

  // Show dashboard
  static async showDashboard(req: SessionRequest, res: Response): Promise<void> {
    try {
      const { User } = await import('../models/User');
      const { Item } = await import('../models/Item');
      const { Swap } = await import('../models/Swap');

      const userId = req.session.userId;

      // Get user's statistics
      const [userItems, userSwaps, totalPoints] = await Promise.all([
        Item.find({ owner: userId }).lean(),
        Swap.find({ 
          $or: [
            { requester: userId },
            { owner: userId }
          ]
        }).lean(),
        User.findById(userId).select('points').lean()
      ]);

      const stats = {
        totalItems: userItems.length,
        availableItems: userItems.filter(item => item.available).length,
        totalSwaps: userSwaps.length,
        completedSwaps: userSwaps.filter(swap => swap.status === 'completed').length,
        pendingSwaps: userSwaps.filter(swap => swap.status === 'pending').length,
        points: totalPoints?.points || 0
      };

      res.render('dashboard/index', {
        title: 'Dashboard - ReWear',
        page: 'dashboard',
        user: req.session.user,
        stats,
        recentItems: userItems.slice(0, 5),
        recentSwaps: userSwaps.slice(0, 5)
      });
    } catch (error) {
      console.error('Dashboard error:', error);
      req.flash('error', 'Error loading dashboard');
      res.redirect('/');
    }
  }
}
