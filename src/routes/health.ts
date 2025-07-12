import express from 'express';
import mongoose from 'mongoose';
import { redisClient } from '../config/redis';

const router = express.Router();

router.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: 'Unknown',
        redis: 'Unknown',
      },
    };

    // Check MongoDB connection
    try {
      if (mongoose.connection.readyState === 1) {
        health.services.database = 'Connected';
      } else {
        health.services.database = 'Disconnected';
        health.status = 'Degraded';
      }
    } catch (error) {
      health.services.database = 'Error';
      health.status = 'Degraded';
    }

    // Check Redis connection
    try {
      await redisClient.ping();
      health.services.redis = 'Connected';
    } catch (error) {
      health.services.redis = 'Disconnected';
      health.status = 'Degraded';
    }

    const statusCode = health.status === 'OK' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
