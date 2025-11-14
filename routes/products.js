const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category');
const Review = require('../models/Review');

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    const skip = (page - 1) * limit;

    let query = { isActive: true };
    let sort = {};

    // Handle category filter safely
    if (req.query.category) {
      try {
        const category = await Category.findOne({ slug: req.query.category });
        if (category) {
          query.category = category._id;
        }
      } catch (error) {
        console.error('Category lookup error:', error);
      }
    }

    // Search functionality
    if (req.query.search) {
      query.$or = [
        { name: new RegExp(req.query.search, 'i') },
        { description: new RegExp(req.query.search, 'i') },
        { brand: new RegExp(req.query.search, 'i') },
        { tags: new RegExp(req.query.search, 'i') }
      ];
    }

    // Price range filter
    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) query.price.$gte = parseFloat(req.query.minPrice);
      if (req.query.maxPrice) query.price.$lte = parseFloat(req.query.maxPrice);
    }

    // Brand filter
    if (req.query.brand) {
      query.brand = req.query.brand;
    }

    // Rating filter
    if (req.query.minRating) {
      query.averageRating = { $gte: parseFloat(req.query.minRating) };
    }

    // Sort options
    switch (req.query.sort) {
      case 'price-asc':
        sort.price = 1;
        break;
      case 'price-desc':
        sort.price = -1;
        break;
      case 'rating':
        sort.averageRating = -1;
        break;
      case 'newest':
        sort.createdAt = -1;
        break;
      case 'popular':
        sort.salesCount = -1;
        break;
      default:
        sort.createdAt = -1;
    }

    const products = await Product.find(query)
      .populate('seller')
      .populate('category')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limit);

    // Safely get categories and brands
    let categories = [];
    let brands = [];
    
    try {
      categories = await Category.find({ isActive: true });
      brands = await Product.distinct('brand', { isActive: true, brand: { $ne: null } });
    } catch (error) {
      console.error('Error fetching categories or brands:', error);
    }

    res.render('products/list', {
      title: 'Products',
      products,
      categories,
      brands,
      currentPage: page,
      totalPages,
      query: req.query
    });
  } catch (error) {
    console.error('Products list error:', error);
    res.status(500).render('error', {
      message: 'Unable to load products',
      error: { status: 500 },
      title: 'Server Error',
      user: res.locals.user
    });
  }
});

router.get('/:slug', async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, isActive: true })
      .populate('seller')
      .populate('category');

    if (!product) {
      return res.status(404).render('error', {
        message: 'Product not found',
        error: { status: 404 },
        user: res.locals.user
      });
    }

    // Increment views
    product.views += 1;
    await product.save();

    // Get reviews
    const reviews = await Review.find({ product: product._id })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    // Get related products (by same seller or similar tags)
    const relatedProducts = await Product.find({
      _id: { $ne: product._id },
      isActive: true,
      $or: [
        { seller: product.seller },
        { tags: { $in: product.tags } }
      ]
    })
    .limit(4)
    .populate('seller')
    .populate('category');

    // Get frequently bought together
    const frequentlyBought = await Product.find({
      _id: { $ne: product._id },
      isActive: true
    })
    .sort({ salesCount: -1 })
    .limit(3)
    .populate('seller')
    .populate('category');

    res.render('products/detail', {
      title: product.name,
      product,
      reviews,
      relatedProducts,
      frequentlyBought
    });
  } catch (error) {
    console.error('Product detail error:', error);
    res.status(500).render('error', {
      message: 'Unable to load product',
      error: { status: 500 },
      title: 'Server Error',
      user: res.locals.user
    });
  }
});

module.exports = router;