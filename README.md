# 🧵 ReWear Backend

A scalable RESTful backend for a community clothing exchange platform built with TypeScript, Node.js, Express, MongoDB, and Redis.

## ✨ Features

- **Complete Authentication System** with JWT tokens and secure password hashing
- **Item Management** with image uploads and admin approval workflow
- **Point-based Economy** with transactions and automatic point allocation
- **Swap System** for direct item exchanges and point redemptions
- **Admin Panel** for content moderation and user management
- **Redis Caching** for improved performance
- **Real-time Notifications** for user interactions
- **Role-based Access Control** (user/admin)
- **Comprehensive API** with validation and error handling

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB 4.4+
- Redis 6+
- pnpm (recommended) or npm

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Environment Setup**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your configuration:

   ```env
   PORT=4000
   NODE_ENV=development
   MONGO_URI=mongodb://localhost:27017/rewear
   REDIS_HOST=localhost
   REDIS_PORT=6379
   JWT_SECRET=your_super_secret_jwt_key
   ```

4. **Start the services**

   ```bash
   # Start MongoDB (if not running)
   mongod

   # Start Redis (if not running)
   redis-server
   ```

5. **Run the application**

   ```bash
   # Development mode with hot reload
   pnpm dev

   # Production mode
   pnpm build
   pnpm start
   ```

## 📋 API Documentation

### Base URL

```
http://localhost:4000/api
```

### Authentication Endpoints

| Method | Endpoint         | Description       | Auth Required |
| ------ | ---------------- | ----------------- | ------------- |
| POST   | `/auth/register` | User registration | No            |
| POST   | `/auth/login`    | User login        | No            |
| GET    | `/auth/me`       | Get current user  | Yes           |
| POST   | `/auth/logout`   | User logout       | Yes           |
| PUT    | `/auth/avatar`   | Upload avatar     | Yes           |
| PUT    | `/auth/password` | Change password   | Yes           |

### Item Endpoints

| Method | Endpoint              | Description       | Auth Required     |
| ------ | --------------------- | ----------------- | ----------------- |
| POST   | `/items`              | Create new item   | Yes               |
| GET    | `/items/search`       | Search items      | No                |
| GET    | `/items/popular`      | Get popular items | No                |
| GET    | `/items/:id`          | Get item details  | No                |
| PUT    | `/items/:id`          | Update item       | Yes (Owner/Admin) |
| DELETE | `/items/:id`          | Delete item       | Yes (Owner/Admin) |
| GET    | `/items/user/:userId` | Get user's items  | No                |

### Admin Endpoints

| Method | Endpoint                   | Description     | Auth Required |
| ------ | -------------------------- | --------------- | ------------- |
| GET    | `/admin/dashboard`         | Dashboard stats | Admin         |
| GET    | `/admin/users`             | List all users  | Admin         |
| GET    | `/admin/items`             | List all items  | Admin         |
| GET    | `/admin/items/pending`     | Pending items   | Admin         |
| PUT    | `/admin/items/:id/approve` | Approve item    | Admin         |
| PUT    | `/admin/items/:id/reject`  | Reject item     | Admin         |
| DELETE | `/admin/users/:id`         | Ban user        | Admin         |

### Request Examples

**Register a new user:**

```bash
curl -X POST http://localhost:4000/api/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "location": "New York, NY"
  }'
```

**Create a new item:**

```bash
curl -X POST http://localhost:4000/api/items \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -F "title=Vintage Denim Jacket" \\
  -F "description=Beautiful vintage denim jacket in excellent condition" \\
  -F "category=jackets" \\
  -F "size=M" \\
  -F "condition=good" \\
  -F "images=@jacket1.jpg" \\
  -F "images=@jacket2.jpg"
```

## 🏗️ Project Structure

```
src/
├── config/              # Configuration files
│   ├── database.ts      # MongoDB connection
│   ├── redis.ts         # Redis client setup
│   └── env.ts           # Environment variables
├── controllers/         # Business logic
│   ├── authController.ts
│   ├── itemController.ts
│   └── adminController.ts
├── models/             # Database schemas
│   ├── User.ts
│   ├── Item.ts
│   ├── Swap.ts
│   ├── PointsTransaction.ts
│   └── Notification.ts
├── routes/             # API routes
│   ├── auth.ts
│   ├── items.ts
│   └── admin.ts
├── middlewares/        # Express middlewares
│   ├── auth.ts         # Authentication
│   ├── validation.ts   # Input validation
│   ├── upload.ts       # File upload
│   ├── cache.ts        # Redis caching
│   └── errorHandler.ts # Error handling
├── utils/              # Helper functions
│   ├── tokenGenerator.ts
│   ├── hashHelper.ts
│   ├── pointsCalculator.ts
│   ├── fileUploader.ts
│   └── cacheHelper.ts
└── server.ts           # Application entry point
```

## 🔒 Security Features

- **JWT Authentication** with secure token generation
- **Password Hashing** using bcrypt with salt rounds
- **Input Validation** using express-validator
- **File Upload Security** with type and size restrictions
- **Rate Limiting** to prevent abuse
- **CORS Protection** for cross-origin requests
- **Helmet** for security headers
- **Role-based Access Control**

## ⚡ Caching Strategy

- **User Sessions** - 1 hour TTL
- **Item Listings** - 30 minutes TTL
- **Search Results** - 10 minutes TTL
- **Popular Items** - 30 minutes TTL
- **User Points** - 5 minutes TTL

## 🗃️ Database Schema

### User Schema

```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  location: String,
  avatar: String,
  role: "user" | "admin",
  points: Number,
  createdAt: Date
}
```

### Item Schema

```javascript
{
  title: String,
  description: String,
  images: [String],
  category: String,
  size: String,
  condition: "new" | "like-new" | "good" | "fair",
  tags: [String],
  available: Boolean,
  approved: Boolean,
  approvedBy: ObjectId,
  approvedAt: Date,
  owner: ObjectId,
  createdAt: Date
}
```

## 🚀 Deployment

### Environment Variables for Production

```env
NODE_ENV=production
PORT=4000
MONGO_URI=mongodb://your-production-mongodb-uri
REDIS_HOST=your-redis-host
JWT_SECRET=your-super-secure-jwt-secret
```

### Build and Start

```bash
pnpm build
pnpm start
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 4000
CMD ["node", "dist/server.js"]
```

## 🧪 Testing

```bash
# Run tests
pnpm test

# Run tests with coverage
pnpm test -- --coverage

# Run linting
pnpm lint

# Fix linting issues
pnpm lint:fix
```

## 📊 Available Scripts

- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm test` - Run tests
- `pnpm lint` - Run ESLint
- `pnpm lint:fix` - Fix ESLint issues
- `pnpm cache:clear` - Clear Redis cache

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔧 Troubleshooting

### Common Issues

**MongoDB Connection Error:**

```bash
# Make sure MongoDB is running
mongod
# Or check your MONGO_URI in .env
```

**Redis Connection Error:**

```bash
# Make sure Redis is running
redis-server
# Or check your Redis configuration in .env
```

**File Upload Issues:**

```bash
# Make sure uploads directory exists and has write permissions
mkdir -p uploads/avatars uploads/items
chmod 755 uploads
```

### Performance Optimization

- Enable Redis caching for better response times
- Use MongoDB indexes for optimized queries
- Implement pagination for large data sets
- Use CDN for static file serving in production

## 📞 Support

For support, email support@rewear.com or create an issue in the repository.
