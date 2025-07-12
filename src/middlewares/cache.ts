import { Request, Response, NextFunction } from 'express';
import { CacheHelper } from '../utils/cacheHelper';

export interface CacheRequest extends Request {
  cacheKey?: string;
  skipCache?: boolean;
}

export const cacheMiddleware = (prefix: string, ttl?: number) => {
  return async (req: CacheRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (req.method !== 'GET') {
        next();
        return;
      }

      const key = `${prefix}:${req.originalUrl}`;
      req.cacheKey = key;

      const cached = await CacheHelper.getCachedSearchResults(key);
      if (cached && !req.skipCache) {
        res.json(cached);
        return;
      }

      // Store original json method
      const originalJson = res.json;
      
      // Override json method to cache the response
      res.json = function(data: any) {
        if (res.statusCode === 200) {
          CacheHelper.cacheSearchResults(key, data).catch(console.error);
        }
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};
