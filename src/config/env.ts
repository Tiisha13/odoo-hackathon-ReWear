import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/rewear',
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0'),
  },
  
  cache: {
    ttlUser: parseInt(process.env.CACHE_TTL_USER || '3600'),
    ttlItem: parseInt(process.env.CACHE_TTL_ITEM || '1800'),
    ttlSearch: parseInt(process.env.CACHE_TTL_SEARCH || '600'),
    ttlPoints: parseInt(process.env.CACHE_TTL_POINTS || '300'),
  },
  
  upload: {
    path: process.env.UPLOAD_PATH || 'uploads/',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB
    allowedFormats: process.env.ALLOWED_FORMATS?.split(',') || ['image/jpeg', 'image/png', 'image/webp'],
  },
  
  email: {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
};
