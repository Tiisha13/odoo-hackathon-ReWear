import { createClient, RedisClientType } from 'redis';
import { config } from './env';

export class RedisClient {
  private static instance: RedisClient;
  private client: RedisClientType;

  private constructor() {
    const redisOptions: any = {
      socket: {
        host: config.redis.host,
        port: config.redis.port,
      },
      database: config.redis.db,
    };
    
    if (config.redis.password) {
      redisOptions.password = config.redis.password;
    }
    
    this.client = createClient(redisOptions);

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    this.client.on('connect', () => {
      console.log('Redis Client Connected');
    });
  }

  public static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  public async connect(): Promise<void> {
    if (!this.client.isOpen) {
      await this.client.connect();
    }
  }

  public async disconnect(): Promise<void> {
    if (this.client.isOpen) {
      await this.client.disconnect();
    }
  }

  public getClient(): RedisClientType {
    return this.client;
  }

  public async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.setEx(key, ttl, value);
    } else {
      await this.client.set(key, value);
    }
  }

  public async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  public async del(key: string): Promise<number> {
    return await this.client.del(key);
  }

  public async flushDb(): Promise<void> {
    await this.client.flushDb();
  }

  public async exists(key: string): Promise<number> {
    return await this.client.exists(key);
  }
}

export const redisClient = RedisClient.getInstance();
