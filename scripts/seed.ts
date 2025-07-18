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
    points: 150,
  },
  {
    name: 'Bob Smith',
    email: 'bob@example.com',
    password: 'password123',
    location: 'Los Angeles',
    role: 'user',
    points: 200,
  },
  {
    name: 'Carol Davis',
    email: 'carol@example.com',
    password: 'password123',
    location: 'Chicago',
    role: 'user',
    points: 75,
  },
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'admin123',
    location: 'San Francisco',
    role: 'admin',
    points: 500,
  },
];

const items = [
  {
    title: "Vintage Levi's Denim Jacket",
    description: "Classic vintage Levi's denim jacket in excellent condition. Perfect for layering and adding a timeless touch to any outfit.",
    category: 'jackets',
    size: 'M',
    condition: 'like-new',
    tags: ['vintage', 'denim', 'classic', 'levis'],
    images: ['vintage-denim-jacket.jpg'],
    available: true,
    approved: true,
  },
  {
    title: 'Black Wool Sweater',
    description: 'Cozy black wool sweater, barely worn. Great for winter and perfect for both casual and professional settings.',
    category: 'sweaters',
    size: 'L',
    condition: 'good',
    tags: ['wool', 'winter', 'warm', 'black'],
    images: ['black-wool-sweater.jpg'],
    available: true,
    approved: true,
  },
  {
    title: 'Summer Floral Dress',
    description: 'Beautiful floral summer dress in mint condition. Light and breezy, perfect for warm weather.',
    category: 'dresses',
    size: 'S',
    condition: 'new',
    tags: ['floral', 'summer', 'light', 'feminine'],
    images: ['summer-floral-dress.jpg'],
    available: true,
    approved: true,
  },
  {
    title: 'Nike Running Shoes',
    description: 'Comfortable Nike running shoes, lightly used. Great for workouts and daily wear.',
    category: 'shoes',
    size: 'L',
    condition: 'good',
    tags: ['nike', 'running', 'athletic', 'comfortable'],
    images: ['nike-running-shoes.jpg'],
    available: true,
    approved: true,
  },
  {
    title: 'Leather Handbag',
    description: 'Elegant brown leather handbag with multiple compartments. Perfect for work or special occasions.',
    category: 'accessories',
    size: 'One Size',
    condition: 'like-new',
    tags: ['leather', 'elegant', 'brown', 'work'],
    images: ['leather-handbag.jpg'],
    available: true,
    approved: true,
  },
  {
    title: 'Casual White T-Shirt',
    description: 'Simple white cotton t-shirt. Essential wardrobe piece, soft and comfortable.',
    category: 'shirts',
    size: 'M',
    condition: 'good',
    tags: ['basic', 'cotton', 'casual', 'white'],
    images: ['white-tshirt.jpg'],
    available: true,
    approved: true,
  },
  {
    title: 'Blue High-Waisted Jeans',
    description: 'Trendy high-waisted blue jeans with a flattering fit. Perfect for everyday wear.',
    category: 'pants',
    size: 'S',
    condition: 'like-new',
    tags: ['jeans', 'high-waisted', 'blue', 'trendy'],
    images: ['blue-high-waisted-jeans.jpg'],
    available: true,
    approved: true,
  },
  {
    title: 'Plaid Flannel Shirt',
    description: 'Cozy plaid flannel shirt in red and black. Great for layering or wearing on its own.',
    category: 'shirts',
    size: 'L',
    condition: 'good',
    tags: ['flannel', 'plaid', 'cozy', 'casual'],
    images: ['plaid-flannel-shirt.jpg'],
    available: true,
    approved: true,
  },
  {
    title: 'Black Mini Skirt',
    description: 'Chic black mini skirt with a sleek design. Perfect for nights out or dressy occasions.',
    category: 'skirts',
    size: 'M',
    condition: 'new',
    tags: ['black', 'mini', 'chic', 'dressy'],
    images: ['black-mini-skirt.jpg'],
    available: true,
    approved: true,
  },
  {
    title: 'Gray Hoodie',
    description: 'Comfortable gray hoodie with front pocket. Perfect for lounging or casual outings.',
    category: 'hoodies',
    size: 'XL',
    condition: 'good',
    tags: ['gray', 'comfortable', 'casual', 'pocket'],
    images: ['gray-hoodie.jpg'],
    available: true,
    approved: true,
  },
  {
    title: 'Black Blazer',
    description: 'Professional black blazer with a tailored fit. Essential piece for work wardrobe.',
    category: 'jackets',
    size: 'S',
    condition: 'like-new',
    tags: ['blazer', 'professional', 'tailored', 'work'],
    images: ['black-blazer.jpg'],
    available: true,
    approved: true,
  },
  {
    title: 'Denim Shorts',
    description: 'Classic denim shorts, perfect for summer. Comfortable fit with a vintage wash.',
    category: 'shorts',
    size: 'M',
    condition: 'good',
    tags: ['denim', 'summer', 'vintage', 'casual'],
    images: ['denim-shorts.jpg'],
    available: true,
    approved: true,
  },
  {
    title: 'Red Sundress',
    description: 'Bright red sundress with a flowy design. Perfect for summer events and vacations.',
    category: 'dresses',
    size: 'L',
    condition: 'new',
    tags: ['red', 'sundress', 'flowy', 'summer'],
    images: ['red-sundress.jpg'],
    available: true,
    approved: true,
  },
  {
    title: 'Athletic Leggings',
    description: 'High-performance athletic leggings with moisture-wicking fabric. Great for workouts.',
    category: 'activewear',
    size: 'M',
    condition: 'like-new',
    tags: ['athletic', 'leggings', 'workout', 'performance'],
    images: ['athletic-leggings.jpg'],
    available: true,
    approved: true,
  },
  {
    title: 'Winter Coat',
    description: 'Warm winter coat with faux fur trim. Excellent protection against cold weather.',
    category: 'coats',
    size: 'L',
    condition: 'good',
    tags: ['winter', 'warm', 'coat', 'fur-trim'],
    images: ['winter-coat.jpg'],
    available: true,
    approved: true,
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
    const createdUsers: any[] = [];
    for (const userData of users) {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      const user = new User({
        ...userData,
        password: hashedPassword,
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
        owner: randomOwner._id,
      });
      await item.save();
      console.log(`Created item: ${item.title}`);
    }

    // Create some point transactions
    for (const user of createdUsers.slice(0, 3)) {
      // Exclude admin
      // Item upload points
      const uploadTransaction = new PointsTransaction({
        userId: user._id,
        type: 'earn',
        points: 10,
        description: 'Points earned for uploading an item',
      });
      await uploadTransaction.save();

      // Profile completion points
      const profileTransaction = new PointsTransaction({
        userId: user._id,
        type: 'earn',
        points: 5,
        description: 'Points earned for completing profile',
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
