require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const path = require('path');

const connectDB = require('./config/database');

const app = express();

connectDB();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride('_method'));

app.use(session({
  name: 'sessionId',
  secret: process.env.SESSION_SECRET || 'fallback-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions',
    ttl: 24 * 60 * 60
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24
  }
}));

app.use((req, res, next) => {
  res.locals.user = req.session.userId ? {
    id: req.session.userId,
    name: req.session.userName,
    role: req.session.userRole,
    isAuthenticated: true
  } : {
    id: null,
    name: null,
    role: null,
    isAuthenticated: false
  };
  
  res.locals.success = req.session.success;
  res.locals.error = req.session.error;
  
  delete req.session.success;
  delete req.session.error;
  
  res.locals.cartItemCount = req.session.cartItemCount || 0;
  
  next();
});

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const userRoutes = require('./routes/user');
const reviewRoutes = require('./routes/reviews');
const sellerRoutes = require('./routes/seller');

app.use('/auth', authRoutes);
app.use('/products', productRoutes);
app.use('/cart', cartRoutes);
app.use('/orders', orderRoutes);
app.use('/user', userRoutes);
app.use('/reviews', reviewRoutes);
app.use('/seller', sellerRoutes);

app.get('/', async (req, res) => {
  try {
    const Product = require('./models/Product');
    const Category = require('./models/Category');

    let featuredProducts = [];
    let newArrivals = [];
    let bestSellers = [];
    let categories = [];

    try {
      featuredProducts = await Product.find({ 
        isActive: true,
        isFeatured: true 
      })
      .populate('seller')
      .populate('category')
      .limit(8)
      .exec();

      newArrivals = await Product.find({ 
        isActive: true 
      })
      .sort({ createdAt: -1 })
      .limit(8)
      .populate('seller')
      .populate('category')
      .exec();

      bestSellers = await Product.find({ 
        isActive: true 
      })
      .sort({ salesCount: -1 })
      .limit(8)
      .populate('seller')
      .populate('category')
      .exec();

      categories = await Category.find({ 
        isActive: true 
      })
      .limit(6)
      .exec();
    } catch (dbError) {
      console.error('Database error in homepage:', dbError);
    }

    // Ensure all products have safe category access
    const safeProducts = (products) => {
      if (!products || !Array.isArray(products)) return [];
      return products.map(product => ({
        ...product.toObject ? product.toObject() : product,
        category: product.category || { name: 'Uncategorized' }
      }));
    };

    res.render('home', {
      title: 'Home',
      featuredProducts: safeProducts(featuredProducts),
      newArrivals: safeProducts(newArrivals),
      bestSellers: safeProducts(bestSellers),
      categories: categories || []
    });
  } catch (error) {
    console.error('Homepage error:', error);
    res.status(500).render('error', {
      message: 'Unable to load homepage',
      title: 'Server Error',
      user: res.locals.user
    });
  }
});
app.use((req, res) => {
  res.status(404).render('error', {
    message: 'Page Not Found',
    error: { status: 404 },
    title: '404 Not Found',
    user: res.locals.user
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});