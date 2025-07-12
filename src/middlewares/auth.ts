import { Request, Response, NextFunction } from 'express';
import { TokenGenerator } from '../utils/tokenGenerator';
import { User } from '../models/User';
import { CacheHelper } from '../utils/cacheHelper';

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ message: 'Access token required' });
      return;
    }

    const decoded = TokenGenerator.verifyToken(token);
    if (!decoded) {
      res.status(403).json({ message: 'Invalid or expired token' });
      return;
    }

    // Try to get user from cache first
    let user = await CacheHelper.getCachedUser(decoded.userId);
    
    if (!user) {
      // If not in cache, fetch from database
      user = await User.findById(decoded.userId).select('-password');
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      
      // Cache the user data
      await CacheHelper.cacheUser(decoded.userId, user);
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = TokenGenerator.verifyToken(token);
      if (decoded) {
        let user = await CacheHelper.getCachedUser(decoded.userId);
        
        if (!user) {
          user = await User.findById(decoded.userId).select('-password');
          if (user) {
            await CacheHelper.cacheUser(decoded.userId, user);
          }
        }
        
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // In optional auth, we don't throw errors, just continue without user
    next();
  }
};
