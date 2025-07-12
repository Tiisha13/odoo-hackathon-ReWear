import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../src/models/User';
import { Item } from '../src/models/Item';
import { PointsTransaction } from '../src/models/PointsTransaction';
import { config } from '../src/config/env';

const users = [
  {
    name: 'Alice Johnson',
    email: 'alice@example.com',
    password: 'password123',
    location: 'New York',
    role: 'user',
    points: 150
  },
  {
    name: 'Bob Smith',
    email: 'bob@example.com',
    password: 'password123',
    location: 'Los Angeles',
    role: 'user',
    points: 200
  },
  {
    name: 'Carol Davis',
    email: 'carol@example.com',
    password: 'password123',
    location: 'Chicago',
    role: 'user',
    points: 75
  },
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'admin123',
    location: 'San Francisco',
    role: 'admin',
    points: 500
  }
];

const items = [
  {
    title: 'Vintage Levi\'s Denim Jacket',
    description: 'Classic vintage Levi\'s denim jacket in excellent condition. Perfect for layering.',
    category: 'Jackets',
    size: 'M',
    condition: 'excellent',
    brand: 'Levi\'s',
    isApproved: true
  },
  {
    title: 'Black Wool Sweater',
    description: 'Cozy black wool sweater, barely worn. Great for winter.',
    category: 'Sweaters',
    size: 'L',
    condition: 'good',
    brand: 'Uniqlo',
    isApproved: true
  },
  {
    title: 'Summer Floral Dress',
    description: 'Beautiful floral summer dress in mint condition.',
    category: 'Dresses',
    size: 'S',
    condition: 'excellent',
    brand: 'Zara',
    isApproved: false
  },
  {
    title: 'Nike Running Shoes',
    description: 'Comfortable Nike running shoes, lightly used.',
    category: 'Shoes',
    size: '9',
    condition: 'good',
    brand: 'Nike',
    isApproved: true
  },
  {
    title: 'Leather Handbag',
    description: 'Elegant brown leather handbag with multiple compartments.',
    category: 'Accessories',
    size: 'One Size',
    condition: 'excellent',
    brand: 'Coach',
    isApproved: false
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Item.deleteMany({});
    await PointsTransaction.deleteMany({});
    console.log('Cleared existing data');

    // Create users
    const createdUsers = [];
    for (const userData of users) {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      const user = new User({
        ...userData,
        password: hashedPassword
      });
      await user.save();
      createdUsers.push(user);
      console.log(`Created user: ${user.email}`);
    }

    // Create items
    for (let i = 0; i < items.length; i++) {
      const itemData = items[i];
      const randomOwner = createdUsers[Math.floor(Math.random() * (createdUsers.length - 1))]; // Exclude admin
      
      const item = new Item({
        ...itemData,
        owner: randomOwner._id
      });
      await item.save();
      console.log(`Created item: ${item.title}`);
    }

    // Create some point transactions
    for (const user of createdUsers.slice(0, 3)) { // Exclude admin
      // Item upload points
      const uploadTransaction = new PointsTransaction({
        userId: user._id,
        type: 'earn',
        points: 10,
        description: 'Points earned for uploading an item'
      });
      await uploadTransaction.save();

      // Profile completion points
      const profileTransaction = new PointsTransaction({
        userId: user._id,
        type: 'earn',
        points: 5,
        description: 'Points earned for completing profile'
      });
      await profileTransaction.save();

      console.log(`Created point transactions for user: ${user.email}`);
    }

    console.log('Database seeded successfully!');
    console.log(`
Seed Data Summary:
- ${createdUsers.length} users created
- ${items.length} items created
- Point transactions created for users

Test Accounts:
- Regular User: alice@example.com / password123
- Regular User: bob@example.com / password123
- Regular User: carol@example.com / password123
- Admin User: admin@example.com / admin123

You can now test the API with these accounts!
    `);

  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seeder
if (require.main === module) {
  seedDatabase();
}

export { seedDatabase };
