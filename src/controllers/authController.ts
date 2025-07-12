import { Response } from 'express';
import { User } from '../models/User';
import { HashHelper } from '../utils/hashHelper';
import { TokenGenerator } from '../utils/tokenGenerator';
import { CacheHelper } from '../utils/cacheHelper';
import { AuthRequest } from '../middlewares/auth';
import path from 'path';
import fs from 'fs';

export class AuthController {
  static async register(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { name, email, password, location } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        res.status(400).json({ message: 'User already exists with this email' });
        return;
      }

      // Hash password
      const hashedPassword = await HashHelper.hashPassword(password);

      // Create user
      const user = new User({
        name,
        email,
        password: hashedPassword,
        location,
        points: 100 // Starting bonus points
      });

      await user.save();

      // Generate token
      const token = TokenGenerator.generateToken({
        userId: String(req.user._id),
        email: user.email,
        role: user.role
      });

      // Cache user data
      const userWithoutPassword = { ...user.toObject() };
      delete (userWithoutPassword as any).password;
      await CacheHelper.cacheUser(String(req.user._id), userWithoutPassword);

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: userWithoutPassword
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async login(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        res.status(401).json({ message: 'Invalid credentials' });
        return;
      }

      // Check password
      const isPasswordValid = await HashHelper.comparePassword(password, user.password);
      if (!isPasswordValid) {
        res.status(401).json({ message: 'Invalid credentials' });
        return;
      }

      // Generate token
      const token = TokenGenerator.generateToken({
        userId: String(req.user._id),
        email: user.email,
        role: user.role
      });

      // Cache user data
      const userWithoutPassword = { ...user.toObject() };
      delete (userWithoutPassword as any).password;
      await CacheHelper.cacheUser(String(req.user._id), userWithoutPassword);

      res.json({
        message: 'Login successful',
        token,
        user: userWithoutPassword
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      res.json({
        user: req.user
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async logout(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (req.user) {
        // Invalidate user cache and session
        await CacheHelper.invalidateUser(req.user.userId);
        await CacheHelper.invalidateUserSession(req.user.userId);
      }

      res.json({ message: 'Logout successful' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async uploadAvatar(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ message: 'No file uploaded' });
        return;
      }

      const avatarPath = req.file.filename;
      
      await User.findByIdAndUpdate(req.user._id, { avatar: avatarPath });

      // Invalidate user cache
      await CacheHelper.invalidateUser(String(req.user._id));

      res.json({
        message: 'Avatar uploaded successfully',
        avatar: avatarPath
      });
    } catch (error) {
      console.error('Avatar upload error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async changePassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { currentPassword, newPassword } = req.body;

      // Get user with password
      const user = await User.findById(req.user._id);
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      // Verify current password
      const isCurrentPasswordValid = await HashHelper.comparePassword(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        res.status(400).json({ message: 'Current password is incorrect' });
        return;
      }

      // Hash new password
      const hashedNewPassword = await HashHelper.hashPassword(newPassword);

      // Update password
      await User.findByIdAndUpdate(req.user._id, { password: hashedNewPassword });

      // Invalidate user cache
      await CacheHelper.invalidateUser(String(req.user._id));

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}
