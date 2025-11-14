// require('dotenv').config();
// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');
// const User = require('./models/User');
// const Category = require('./models/Category');
// const Product = require('./models/Product');

// async function seedDatabase() {
//   try {
//     await mongoose.connect(process.env.MONGODB_URI, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true
//     });

//     console.log('Connected to MongoDB');

//     // Clear existing data
//     await User.deleteMany({});
//     await Category.deleteMany({});
//     await Product.deleteMany({});

//     console.log('Cleared existing data');

//     // Create users with different roles
//     const adminPassword = await bcrypt.hash('admin123', 10);
//     const userPassword = await bcrypt.hash('user123', 10);
//     const sellerPassword = await bcrypt.hash('seller123', 10);

//     const admin = await User.create({
//       name: 'Admin User',
//       email: 'admin@shop.com',
//       password: adminPassword,
//       role: 'admin',
//       phone: '555-0100'
//     });

//     const customer = await User.create({
//       name: 'John Doe',
//       email: 'john@example.com',
//       password: userPassword,
//       role: 'customer',
//       phone: '555-0101'
//     });

//     const seller = await User.create({
//       name: 'Seller User',
//       email: 'seller@shop.com',
//       password: sellerPassword,
//       role: 'seller',
//       phone: '555-0102',
//       businessName: 'Best Products Store'
//     });

//     console.log('Created users');

//     // Create categories
//     const categories = await Category.create([
//       {
//         name: 'Electronics',
//         slug: 'electronics',
//         description: 'Electronic devices and gadgets',
//         displayOrder: 1
//       },
//       {
//         name: 'Clothing',
//         slug: 'clothing',
//         description: 'Fashion and apparel',
//         displayOrder: 2
//       },
//       {
//         name: 'Books',
//         slug: 'books',
//         description: 'Books and publications',
//         displayOrder: 3
//       },
//       {
//         name: 'Home & Garden',
//         slug: 'home-garden',
//         description: 'Home improvement and garden supplies',
//         displayOrder: 4
//       },
//       {
//         name: 'Sports & Outdoors',
//         slug: 'sports-outdoors',
//         description: 'Sports equipment and outdoor gear',
//         displayOrder: 5
//       },
//       {
//         name: 'Toys & Games',
//         slug: 'toys-games',
//         description: 'Toys and games for all ages',
//         displayOrder: 6
//       }
//     ]);

//     console.log('Created categories');

//     // Create products
//     const products = [
//       {
//         name: 'Wireless Bluetooth Headphones',
//         slug: 'wireless-bluetooth-headphones',
//         description: 'Premium wireless headphones with active noise cancellation, 30-hour battery life, and superior sound quality.',
//         shortDescription: 'Premium wireless headphones with ANC',
//         price: 199.99,
//         salePrice: 149.99,
//         brand: 'AudioTech',
//         sku: 'ELEC-001',
//         stock: 50,
//         isFeatured: true,
//         seller: seller._id,
//         sellerName: seller.name,
//         tags: ['electronics', 'audio', 'wireless', 'headphones'],
//         images: [{ url: '/images/placeholder.jpg', alt: 'Wireless Headphones' }]
//       },
//       {
//         name: 'Smart Fitness Watch',
//         slug: 'smart-fitness-watch',
//         description: 'Track your fitness goals with this advanced smartwatch featuring heart rate monitoring, GPS, and 7-day battery life.',
//         shortDescription: 'Advanced fitness tracking smartwatch',
//         price: 299.99,
//         salePrice: 249.99,
//         brand: 'FitGear',
//         sku: 'ELEC-002',
//         stock: 75,
//         isFeatured: true,
//         seller: seller._id,
//         sellerName: seller.name,
//         tags: ['electronics', 'wearable', 'fitness', 'smartwatch'],
//         images: [{ url: '/images/placeholder.jpg', alt: 'Smart Watch' }]
//       },
//       {
//         name: 'Classic Cotton T-Shirt',
//         slug: 'classic-cotton-tshirt',
//         description: '100% organic cotton t-shirt. Comfortable, breathable, and available in multiple colors.',
//         shortDescription: '100% organic cotton comfort',
//         price: 29.99,
//         brand: 'ComfortWear',
//         sku: 'CLO-001',
//         stock: 200,
//         seller: seller._id,
//         sellerName: seller.name,
//         tags: ['clothing', 'casual', 'cotton', 'tshirt'],
//         images: [{ url: '/images/placeholder.jpg', alt: 'T-Shirt' }]
//       }
//     ];

//     await Product.insertMany(products);

//     console.log('Created products');
//     console.log('\nSeed data created successfully!');
//     console.log('\nLogin credentials:');
//     console.log('Admin - Email: admin@shop.com, Password: admin123');
//     console.log('Customer - Email: john@example.com, Password: user123');
//     console.log('Seller - Email: seller@shop.com, Password: seller123');

//     await mongoose.connection.close();
//     console.log('\nDatabase connection closed');
//   } catch (error) {
//     console.error('Error seeding database:', error);
//     process.exit(1);
//   }
// }

// // Only run if called directly
// if (require.main === module) {
//   seedDatabase();
// }

// module.exports = seedDatabase;