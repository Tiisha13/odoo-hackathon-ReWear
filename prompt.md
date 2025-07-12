# 🧵 ReWear – Community Clothing Exchange Backend

A scalable RESTful backend built with TypeScript, Node.js, Express, and MongoDB for a community clothing exchange platform featuring point-based and direct swap systems.

## 🚀 Tech Stack

- **Runtime**: Node.js + Express
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT with bcrypt password hashing
- **File Upload**: Multer for local storage
- **Language**: TypeScript
- **Package Manager**: pnpm
- **Caching**: Redis for performance optimization

## 📋 Features Overview

### 👤 User Management
- User registration and JWT-based authentication
- Profile management with avatar, location, and points system
- Role-based access control (user/admin)
- Password hashing and security

### 👚 Item Listings
- Full CRUD operations for clothing items
- Image upload and management
- Advanced search and filtering (category, size, condition, tags)
- Item availability tracking
- **Admin approval system for new items**

### 🔁 Swapping System
- Direct item swaps between users
- Point-based item redemption
- Swap request management (pending, accepted, rejected, completed, cancelled)
- Automatic point deduction and crediting

### 🎯 Point Economy
- Users earn points through:
    - Item uploads (+10 points)
    - Completed swaps (+20 points)
    - User referrals (+30 points)
- Point redemption for items
- Point transfers between users
- Complete transaction history

### 📬 Notifications
- Real-time notifications for:
    - Swap requests received
    - Swap status updates
    - Item redemptions
    - **Item approval/rejection notifications**
- Read/unread status tracking

### 🛡️ Admin Panel
- User and item moderation
- **Item approval/rejection workflow**
- Swap activity monitoring
- Manual point adjustments
- Content removal capabilities

### ⚡ Caching Strategy
- **User session caching** for improved authentication performance
- **Item listings cache** with category-based invalidation
- **Popular items cache** for trending content
- **Search results caching** for common queries
- **User profile caching** for frequent profile lookups
- **Points balance caching** for real-time point tracking

## 📁 Project Structure

```
src/
├── controllers/         # Business logic handlers
│   ├── authController.ts
│   ├── userController.ts
│   ├── itemController.ts
│   ├── swapController.ts
│   ├── pointController.ts
│   ├── notificationController.ts
│   └── adminController.ts
├── routes/              # Express route modules
│   ├── auth.ts
│   ├── users.ts
│   ├── items.ts
│   ├── swaps.ts
│   ├── points.ts
│   ├── notifications.ts
│   └── admin.ts
├── models/              # Mongoose schemas
│   ├── User.ts
│   ├── Item.ts
│   ├── Swap.ts
│   ├── PointsTransaction.ts
│   └── Notification.ts
├── middlewares/         # Express middlewares
│   ├── auth.ts
│   ├── roleCheck.ts
│   ├── validation.ts
│   ├── upload.ts
│   ├── cache.ts
│   └── errorHandler.ts
├── utils/               # Helper functions
│   ├── tokenGenerator.ts
│   ├── hashHelper.ts
│   ├── pointsCalculator.ts
│   ├── fileUploader.ts
│   └── cacheHelper.ts
├── config/              # Configuration files
│   ├── database.ts
│   ├── redis.ts
│   └── env.ts
├── uploads/             # Local file storage
│   ├── avatars/
│   └── items/
└── server.ts            # Application entry point
```

## 🗃️ Data Models

### User
```typescript
{
    name: string
    email: string
    password: string
    location: string
    avatar?: string
    role: 'user' | 'admin'
    points: number
    createdAt: Date
}
```

### Item
```typescript
{
    title: string
    description: string
    images: string[]
    category: string
    size: string
    condition: 'new' | 'like-new' | 'good' | 'fair'
    tags: string[]
    available: boolean
    approved: boolean
    approvedBy?: ObjectId
    approvedAt?: Date
    owner: ObjectId
    createdAt: Date
}
```

### Swap
```typescript
{
    requester: ObjectId
    receiver: ObjectId
    item: ObjectId
    type: 'direct' | 'points'
    status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled'
    createdAt: Date
}
```

### PointsTransaction
```typescript
{
    userId: ObjectId
    type: 'earn' | 'redeem' | 'transfer'
    points: number
    refId?: ObjectId
    description: string
    createdAt: Date
}
```

### Notification
```typescript
{
    userId: ObjectId
    type: string
    message: string
    read: boolean
    createdAt: Date
}
```

## 🛣️ API Routes

### Authentication (`/api/auth`)
- `POST /register` - User registration
- `POST /login` - User login
- `GET /me` - Get current user profile
- `POST /logout` - User logout
- `PUT /avatar` - Upload user avatar
- `PUT /password` - Change password
- `POST /forgot-password` - Request password reset
- `POST /reset-password` - Reset password

### Users (`/api/users`)
- `GET /:id` - Get user by ID
- `PUT /profile` - Update user profile
- `DELETE /:id` - Delete user account
- `GET /search` - Search users

### Items (`/api/items`)
- `POST /` - Create new item (pending approval)
- `GET /:id` - Get item by ID
- `PUT /:id` - Update item
- `DELETE /:id` - Delete item
- `GET /` - Search and filter approved items
- `GET /user/:userId` - Get user's listings
- `POST /:id/images` - Upload item images
- `DELETE /:id/images/:imageId` - Delete item image

### Swaps (`/api/swaps`)
- `POST /request` - Request a swap
- `PUT /:id/accept` - Accept swap request
- `PUT /:id/reject` - Reject swap request
- `GET /user/:userId` - Get user's swaps
- `GET /item/:itemId` - Get item's swap history

### Points (`/api/points`)
- `GET /balance` - Get user point balance
- `POST /earn` - Earn points
- `POST /redeem` - Redeem points for item
- `POST /transfer` - Transfer points to another user
- `GET /transactions` - Get transaction history

### Notifications (`/api/notifications`)
- `GET /` - Get user notifications
- `PUT /:id/read` - Mark notification as read
- `PUT /read-all` - Mark all notifications as read

### Admin (`/api/admin`)
- `GET /users` - View all users
- `GET /items` - View all items
- `GET /items/pending` - View pending items for approval
- `PUT /items/:id/approve` - Approve item
- `PUT /items/:id/reject` - Reject item
- `GET /swaps` - View all swaps
- `DELETE /users/:id` - Ban/delete user
- `DELETE /items/:id` - Remove item
- `PUT /swaps/:id` - Update swap status
- `POST /points/adjust` - Manually adjust user points

## ⚙️ Environment Configuration

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=4000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/rewear

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Cache Settings
CACHE_TTL_USER=3600
CACHE_TTL_ITEM=1800
CACHE_TTL_SEARCH=600
CACHE_TTL_POINTS=300

# Authentication
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d

# File Upload
UPLOAD_PATH=uploads/
MAX_FILE_SIZE=5242880
ALLOWED_FORMATS=image/jpeg,image/png,image/webp

# Email (Optional - for password reset)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

## 📦 Package.json Scripts

```json
{
    "scripts": {
        "dev": "nodemon src/server.ts",
        "build": "tsc",
        "start": "node dist/server.js",
        "test": "jest",
        "lint": "eslint src/**/*.ts",
        "lint:fix": "eslint src/**/*.ts --fix",
        "cache:clear": "redis-cli FLUSHDB"
    }
}
```

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Input validation with express-validator
- File upload security with Multer
- CORS protection
- Rate limiting
- XSS protection

## 📝 Additional Notes

- All routes are protected with proper authentication middleware
- Input validation is implemented using express-validator
- TypeScript interfaces and enums are used throughout
- Modular architecture for easy maintenance and scaling
- Comprehensive error handling and logging
- RESTful API design principles followed
- Images are stored locally in the uploads folder
- Static file serving enabled for uploaded images
- **Items require admin approval before becoming publicly visible**
- **Users receive notifications for item approval/rejection status**
- **Redis caching implemented for improved performance and reduced database load**
- **Cache invalidation strategies ensure data consistency**
- **Configurable TTL values for different cache types**

