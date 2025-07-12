import { redisClient } from '../config/redis';
import { config } from '../config/env';

export class CacheHelper {
  private static generateKey(prefix: string, identifier: string): string {
    return `${prefix}:${identifier}`;
  }

  // User caching
  static async cacheUser(userId: string, userData: any): Promise<void> {
    const key = this.generateKey('user', userId);
    await redisClient.set(key, JSON.stringify(userData), config.cache.ttlUser);
  }

  static async getCachedUser(userId: string): Promise<any | null> {
    const key = this.generateKey('user', userId);
    const cached = await redisClient.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  static async invalidateUser(userId: string): Promise<void> {
    const key = this.generateKey('user', userId);
    await redisClient.del(key);
  }

  // Item caching
  static async cacheItems(category: string, items: any[]): Promise<void> {
    const key = this.generateKey('items', category);
    await redisClient.set(key, JSON.stringify(items), config.cache.ttlItem);
  }

  static async getCachedItems(category: string): Promise<any[] | null> {
    const key = this.generateKey('items', category);
    const cached = await redisClient.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  static async invalidateItemsCache(category?: string): Promise<void> {
    if (category) {
      const key = this.generateKey('items', category);
      await redisClient.del(key);
    } else {
      // Invalidate all item caches - would need pattern matching in production
      await redisClient.flushDb();
    }
  }

  // Search results caching
  static async cacheSearchResults(query: string, results: any[]): Promise<void> {
    const key = this.generateKey('search', query);
    await redisClient.set(key, JSON.stringify(results), config.cache.ttlSearch);
  }

  static async getCachedSearchResults(query: string): Promise<any[] | null> {
    const key = this.generateKey('search', query);
    const cached = await redisClient.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  // Points caching
  static async cacheUserPoints(userId: string, points: number): Promise<void> {
    const key = this.generateKey('points', userId);
    await redisClient.set(key, points.toString(), config.cache.ttlPoints);
  }

  static async getCachedUserPoints(userId: string): Promise<number | null> {
    const key = this.generateKey('points', userId);
    const cached = await redisClient.get(key);
    return cached ? parseInt(cached) : null;
  }

  static async invalidateUserPoints(userId: string): Promise<void> {
    const key = this.generateKey('points', userId);
    await redisClient.del(key);
  }

  // Popular items caching
  static async cachePopularItems(items: any[]): Promise<void> {
    const key = 'popular:items';
    await redisClient.set(key, JSON.stringify(items), config.cache.ttlItem);
  }

  static async getCachedPopularItems(): Promise<any[] | null> {
    const key = 'popular:items';
    const cached = await redisClient.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  // Session caching
  static async cacheUserSession(userId: string, sessionData: any): Promise<void> {
    const key = this.generateKey('session', userId);
    await redisClient.set(key, JSON.stringify(sessionData), config.cache.ttlUser);
  }

  static async getCachedUserSession(userId: string): Promise<any | null> {
    const key = this.generateKey('session', userId);
    const cached = await redisClient.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  static async invalidateUserSession(userId: string): Promise<void> {
    const key = this.generateKey('session', userId);
    await redisClient.del(key);
  }
}
