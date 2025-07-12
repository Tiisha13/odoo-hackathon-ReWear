# ReWear Backend Deployment Guide

## 🚀 Production Deployment

### Prerequisites

1. **Node.js 18+** installed on your server
2. **MongoDB** database (local or cloud like MongoDB Atlas)
3. **Redis** instance (local or cloud like Redis Cloud)
4. **Domain name** and SSL certificate
5. **Reverse proxy** (Nginx recommended)

### Environment Setup

1. **Create production environment file:**

   ```bash
   cp .env.example .env.production
   ```

2. **Update production variables:**

   ```env
   NODE_ENV=production
   PORT=4000
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/rewear
   REDIS_HOST=your-redis-host
   REDIS_PASSWORD=your-redis-password
   JWT_SECRET=your-super-secure-random-jwt-secret
   ```

3. **Generate secure JWT secret:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

### Build and Deploy

1. **Install dependencies:**

   ```bash
   npm ci --only=production
   ```

2. **Build the application:**

   ```bash
   npm run build
   ```

3. **Start the application:**
   ```bash
   npm start
   ```

### Process Management (PM2)

1. **Install PM2:**

   ```bash
   npm install -g pm2
   ```

2. **Create PM2 configuration:**

   ```javascript
   // ecosystem.config.js
   module.exports = {
     apps: [
       {
         name: 'rewear-backend',
         script: 'dist/server.js',
         instances: 'max',
         exec_mode: 'cluster',
         env: {
           NODE_ENV: 'development',
         },
         env_production: {
           NODE_ENV: 'production',
           PORT: 4000,
         },
       },
     ],
   };
   ```

3. **Start with PM2:**
   ```bash
   pm2 start ecosystem.config.js --env production
   pm2 save
   pm2 startup
   ```

### Nginx Configuration

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    # Upload size limit
    client_max_body_size 10M;

    # API endpoints
    location /api/ {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files (uploads)
    location /uploads/ {
        alias /path/to/your/app/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check
    location /health {
        proxy_pass http://localhost:4000;
        access_log off;
    }
}
```

## 🐳 Docker Deployment

### Dockerfile

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/uploads ./uploads

EXPOSE 4000
USER node

CMD ["node", "dist/server.js"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - '4000:4000'
    environment:
      - NODE_ENV=production
    depends_on:
      - mongodb
      - redis
    volumes:
      - ./uploads:/app/uploads

  mongodb:
    image: mongo:6
    restart: always
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
    volumes:
      - mongodb_data:/data/db

  redis:
    image: redis:7-alpine
    restart: always
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

volumes:
  mongodb_data:
  redis_data:
```

## ☁️ Cloud Deployment Options

### 1. AWS Deployment

**Services needed:**

- EC2 instance or ECS/Fargate
- MongoDB Atlas or DocumentDB
- ElastiCache for Redis
- S3 for file storage
- CloudFront for CDN
- Application Load Balancer

### 2. DigitalOcean Deployment

**Services needed:**

- Droplet or App Platform
- MongoDB Atlas
- Redis Cloud
- Spaces for file storage

### 3. Heroku Deployment

1. **Create Heroku app:**

   ```bash
   heroku create your-app-name
   ```

2. **Add addons:**

   ```bash
   heroku addons:create mongolab
   heroku addons:create heroku-redis
   ```

3. **Deploy:**
   ```bash
   git push heroku main
   ```

## 🔧 Performance Optimization

### Database Optimization

1. **MongoDB Indexes:**

   ```javascript
   // In your deployment script
   db.users.createIndex({ email: 1 });
   db.items.createIndex({ category: 1, approved: 1, available: 1 });
   db.items.createIndex({ title: 'text', description: 'text', tags: 'text' });
   ```

2. **Connection Pooling:**
   ```javascript
   // In database.ts
   mongoose.connect(config.mongoUri, {
     maxPoolSize: 10,
     serverSelectionTimeoutMS: 5000,
     socketTimeoutMS: 45000,
   });
   ```

### Redis Optimization

1. **Memory optimization:**

   ```redis
   maxmemory 100mb
   maxmemory-policy allkeys-lru
   ```

2. **Persistence:**
   ```redis
   save 900 1
   save 300 10
   save 60 10000
   ```

## 📊 Monitoring and Logging

### Application Monitoring

1. **Add logging:**

   ```bash
   npm install winston
   ```

2. **Health checks:**
   ```javascript
   // Already included in server.ts
   app.get('/health', (req, res) => {
     res.json({ status: 'OK', uptime: process.uptime() });
   });
   ```

### Production Logging

```javascript
// config/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}
```

## 🔒 Security Hardening

### 1. Environment Security

```bash
# Set proper file permissions
chmod 600 .env
chmod 600 .env.production
```

### 2. Firewall Configuration

```bash
# UFW example
ufw allow ssh
ufw allow 80
ufw allow 443
ufw allow 4000  # Only if not behind reverse proxy
ufw enable
```

### 3. SSL/TLS Setup

```bash
# Using Certbot for Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 🚨 Backup Strategy

### Database Backup

```bash
# MongoDB backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --uri="your-mongo-uri" --out="/backups/mongo_$DATE"
tar -czf "/backups/mongo_$DATE.tar.gz" "/backups/mongo_$DATE"
rm -rf "/backups/mongo_$DATE"
```

### File Backup

```bash
# Upload files backup
rsync -av uploads/ /backups/uploads_$(date +%Y%m%d)/
```

## 📈 Scaling Considerations

### Horizontal Scaling

1. **Load balancer** with multiple app instances
2. **Database sharding** for large datasets
3. **CDN** for static file serving
4. **Microservices** architecture for complex features

### Vertical Scaling

1. **Increase server resources** (CPU, RAM)
2. **Optimize database queries**
3. **Implement caching strategies**
4. **Use connection pooling**
