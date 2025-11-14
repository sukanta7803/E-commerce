const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

function requireSeller(req, res, next) {
  if (req.session && req.session.userId && req.session.userRole === 'seller') {
    return next();
  }
  req.session.returnTo = req.originalUrl;
  return res.redirect('/auth/login-seller');
}

// Helper function to get base template variables
const getBaseTemplateVars = (req) => {
  return {
    user: req.session.userId ? {
      id: req.session.userId,
      name: req.session.userName,
      role: req.session.userRole,
      isAuthenticated: true
    } : null,
    userName: req.session.userName
  };
};

// Seller dashboard
router.get('/dashboard', requireSeller, async (req, res) => {
  try {
    const productCount = await Product.countDocuments({ seller: req.session.userId });
    
    const sellerProductIds = await Product.find({ seller: req.session.userId }).distinct('_id');
    
    const ordersWithSellerProducts = await Order.find({
      'items.product': { $in: sellerProductIds }
    });
    
    const salesCount = ordersWithSellerProducts.reduce((total, order) => {
      const sellerItems = order.items.filter(item => 
        item.product && sellerProductIds.includes(item.product.toString())
      );
      return total + sellerItems.reduce((sum, item) => sum + item.quantity, 0);
    }, 0);

    const recentOrders = await Order.find({
      'items.product': { $in: sellerProductIds }
    })
    .populate('user', 'name email')
    .populate('items.product')
    .sort({ createdAt: -1 })
    .limit(5);

    const lowStockProducts = await Product.find({
      seller: req.session.userId,
      stock: { $lte: 10 }
    }).limit(5);

    const templateVars = {
      ...getBaseTemplateVars(req),
      title: 'Seller Dashboard',
      productCount,
      salesCount,
      recentOrders,
      lowStockProducts,
      message: req.session.message || null
    };

    res.render('seller/dashboard', templateVars);
    
    delete req.session.message;
    
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).render('error', { 
      title: 'Error',
      error: 'Failed to load dashboard',
      ...getBaseTemplateVars(req)
    });
  }
});

// Root seller route
router.get('/', requireSeller, (req, res) => {
  res.redirect('/seller/dashboard');
});

// New product form
// New product form
router.get('/products/new', requireSeller, async (req, res) => {
  try {
    const templateVars = {
      ...getBaseTemplateVars(req),
      title: 'Add Product',
      product: {}, // Change from null to empty object
      message: req.session.message || null,
      error: null
    };

    res.render('seller/products/new', templateVars);
    
    delete req.session.message;
  } catch (err) {
    console.error('Error loading product form:', err);
    res.status(500).render('error', { 
      title: 'Error',
      error: 'Unable to load product form',
      ...getBaseTemplateVars(req)
    });
  }
});

// Create product
// Create product
router.post('/products', requireSeller, async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      shortDescription,
      price,
      salePrice,
      sku,
      stock,
      lowStockThreshold,
      brand,
      tags = [],
      images = [],
      isActive,
      isFeatured
    } = req.body;

    // Normalize images array from textarea (one URL per line)
    const normalizedImages = (typeof images === 'string' ? images.split('\n') : [])
      .map(s => s.trim())
      .filter(Boolean)
      .map(url => ({ url, alt: name }));

    if (normalizedImages.length < 1 || normalizedImages.length > 6) {
      throw new Error('Products must have between 1 and 6 images.');
    }

    // Safely handle tags - ensure it's always an array
    let normalizedTags = [];
    if (typeof tags === 'string') {
      normalizedTags = tags.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    } else if (Array.isArray(tags)) {
      normalizedTags = tags.map(tag => tag.trim().toLowerCase()).filter(Boolean);
    }

    const isActiveBool = isActive === 'on' || isActive === true;
    const isFeaturedBool = isFeatured === 'on' || isFeatured === true;

    const seller = await User.findById(req.session.userId);

    const product = new Product({
      name,
      slug: slug.toLowerCase().trim(),
      description,
      shortDescription,
      price: parseFloat(price),
      salePrice: salePrice ? parseFloat(salePrice) : undefined,
      sku: sku ? sku.trim() : undefined, // Make SKU optional
      stock: parseInt(stock),
      lowStockThreshold: lowStockThreshold ? parseInt(lowStockThreshold) : 10,
      brand: brand ? brand.trim() : undefined,
      tags: normalizedTags,
      images: normalizedImages,
      seller: req.session.userId,
      sellerName: seller.businessName || seller.name,
      isActive: isActiveBool,
      isFeatured: isFeaturedBool
    });

    await product.save();

    req.session.message = 'Product created successfully!';
    res.redirect('/seller/products');
  } catch (err) {
    console.error('Product creation error:', err);
    
    // Handle duplicate key error specifically
    let errorMessage = err.message;
    if (err.code === 11000) {
      if (err.keyPattern.sku) {
        errorMessage = 'SKU already exists. Please use a different SKU.';
      } else if (err.keyPattern.slug) {
        errorMessage = 'Slug already exists. Please use a different slug.';
      }
    }
    
    // ⬇️ UPDATED SECTION - Ensure product is never null ⬇️
    const templateVars = {
      ...getBaseTemplateVars(req),
      title: 'Add Product', 
      error: errorMessage,
      product: req.body || {} // This ensures product is always an object
    };
    
    res.status(400).render('seller/products/new', templateVars);
  }
});
// List all products for seller
router.get('/products', requireSeller, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const products = await Product.find({ seller: req.session.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalProducts = await Product.countDocuments({ seller: req.session.userId });
    const totalPages = Math.ceil(totalProducts / limit);

    const templateVars = {
      ...getBaseTemplateVars(req),
      title: 'My Products',
      products,
      currentPage: page,
      totalPages,
      totalProducts,
      message: req.session.message || null
    };

    res.render('seller/products/index', templateVars);

    delete req.session.message;
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).render('error', {
      title: 'Error',
      error: 'Unable to load products',
      ...getBaseTemplateVars(req)
    });
  }
});

// Edit product form
router.get('/products/:id/edit', requireSeller, async (req, res) => {
  try {
    const product = await Product.findOne({ 
      _id: req.params.id, 
      seller: req.session.userId 
    });

    if (!product) {
      req.session.message = 'Product not found!';
      return res.redirect('/seller/products');
    }

    const templateVars = {
      ...getBaseTemplateVars(req),
      title: 'Edit Product',
      product
    };

    res.render('seller/products/edit', templateVars);
  } catch (err) {
    console.error('Error loading edit form:', err);
    req.session.message = 'Error loading product for editing';
    res.redirect('/seller/products');
  }
});

// Update product
router.post('/products/:id', requireSeller, async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      shortDescription,
      price,
      salePrice,
      sku,
      stock,
      lowStockThreshold,
      brand,
      tags = [],
      images = [],
      isActive,
      isFeatured
    } = req.body;

    const normalizedImages = (typeof images === 'string' ? images.split('\n') : [])
      .map(s => s.trim())
      .filter(Boolean)
      .map(url => ({ url, alt: name }));

    if (normalizedImages.length < 1 || normalizedImages.length > 6) {
      throw new Error('Products must have between 1 and 6 images.');
    }

    // Safely handle tags - ensure it's always an array
    let normalizedTags = [];
    if (typeof tags === 'string') {
      normalizedTags = tags.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    } else if (Array.isArray(tags)) {
      normalizedTags = tags.map(tag => tag.trim().toLowerCase()).filter(Boolean);
    }

    const isActiveBool = isActive === 'on' || isActive === true;
    const isFeaturedBool = isFeatured === 'on' || isFeatured === true;

    const updatedProduct = await Product.findOneAndUpdate(
      { _id: req.params.id, seller: req.session.userId },
      {
        name,
        slug: slug.toLowerCase().trim(),
        description,
        shortDescription,
        price: parseFloat(price),
        salePrice: salePrice ? parseFloat(salePrice) : undefined,
        sku: sku ? sku.trim() : undefined,
        stock: parseInt(stock),
        lowStockThreshold: lowStockThreshold ? parseInt(lowStockThreshold) : 10,
        brand: brand ? brand.trim() : undefined,
        tags: normalizedTags,
        images: normalizedImages,
        isActive: isActiveBool,
        isFeatured: isFeaturedBool,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      throw new Error('Product not found or you do not have permission to edit it.');
    }

    req.session.message = 'Product updated successfully!';
    res.redirect('/seller/products');
  } catch (err) {
    console.error('Product update error:', err);
    
    // Handle duplicate key error specifically
    let errorMessage = err.message;
    if (err.code === 11000) {
      if (err.keyPattern.sku) {
        errorMessage = 'SKU already exists. Please use a different SKU.';
      } else if (err.keyPattern.slug) {
        errorMessage = 'Slug already exists. Please use a different slug.';
      }
    }
    
    const product = await Product.findOne({ 
      _id: req.params.id, 
      seller: req.session.userId 
    });
    
    const templateVars = {
      ...getBaseTemplateVars(req),
      title: 'Edit Product', 
      error: errorMessage,
      product: product || { ...req.body, _id: req.params.id }
    };
    
    res.status(400).render('seller/products/edit', templateVars);
  }
});

// Delete product
router.post('/products/:id/delete', requireSeller, async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ 
      _id: req.params.id, 
      seller: req.session.userId 
    });

    if (!product) {
      req.session.message = 'Product not found!';
    } else {
      req.session.message = 'Product deleted successfully!';
    }

    res.redirect('/seller/products');
  } catch (err) {
    console.error('Error deleting product:', err);
    req.session.message = 'Error deleting product';
    res.redirect('/seller/products');
  }
});

// Orders for seller's products
router.get('/orders', requireSeller, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const sellerProductIds = await Product.find({ seller: req.session.userId }).distinct('_id');

    const orders = await Order.find({
      'items.product': { $in: sellerProductIds }
    })
    .populate('user', 'name email')
    .populate('items.product')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    const totalOrders = await Order.countDocuments({
      'items.product': { $in: sellerProductIds }
    });
    const totalPages = Math.ceil(totalOrders / limit);

    const templateVars = {
      ...getBaseTemplateVars(req),
      title: 'My Orders',
      orders,
      currentPage: page,
      totalPages,
      totalOrders
    };

    res.render('seller/orders', templateVars);
  } catch (err) {
    console.error('Error loading orders:', err);
    res.status(500).render('error', {
      title: 'Error',
      error: 'Unable to load orders',
      ...getBaseTemplateVars(req)
    });
  }
});

// Order detail for seller
router.get('/orders/:id', requireSeller, async (req, res) => {
  try {
    const sellerProductIds = await Product.find({ seller: req.session.userId }).distinct('_id');

    const order = await Order.findOne({
      _id: req.params.id,
      'items.product': { $in: sellerProductIds }
    })
    .populate('user', 'name email phone')
    .populate('items.product');

    if (!order) {
      req.session.message = 'Order not found!';
      return res.redirect('/seller/orders');
    }

    order.items = order.items.filter(item => 
      item.product && sellerProductIds.includes(item.product._id.toString())
    );

    const templateVars = {
      ...getBaseTemplateVars(req),
      title: 'Order Details',
      order
    };

    res.render('seller/order-detail', templateVars);
  } catch (err) {
    console.error('Error loading order detail:', err);
    req.session.message = 'Error loading order';
    res.redirect('/seller/orders');
  }
});

// Reports
router.get('/reports', requireSeller, async (req, res) => {
  try {
    const sellerId = req.session.userId;
    const products = await Product.find({ seller: sellerId })
      .sort({ salesCount: -1, createdAt: -1 });
    
    const totalProducts = products.length;
    const totalSales = products.reduce((sum, product) => sum + (product.salesCount || 0), 0);
    const totalRevenue = products.reduce((sum, product) => {
      const price = product.salePrice || product.price;
      return sum + (price * (product.salesCount || 0));
    }, 0);
    
    const topProducts = products.slice(0, 5);
    const lowStockProducts = products.filter(product => 
      product.stock <= product.lowStockThreshold
    );

    const templateVars = {
      ...getBaseTemplateVars(req),
      title: 'Seller Reports',
      totalProducts,
      totalSales,
      totalRevenue: totalRevenue.toFixed(2),
      topProducts,
      lowStockProducts
    };

    res.render('seller/reports', templateVars);
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { 
      title: 'Seller Reports', 
      error: 'Server error',
      ...getBaseTemplateVars(req)
    });
  }
});

// Seller profile
router.get('/profile', requireSeller, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);

    if (!user) {
      return res.redirect('/auth/login-seller');
    }

    const templateVars = {
      ...getBaseTemplateVars(req),
      title: 'Seller Profile',
      user
    };

    res.render('seller/profile', templateVars);
  } catch (error) {
    console.error(error);
    res.status(500).render('error', {
      title: 'Error',
      error: 'Server Error',
      ...getBaseTemplateVars(req)
    });
  }
});

// Update seller profile
router.post('/profile/update', requireSeller, async (req, res) => {
  try {
    const { name, phone, businessName } = req.body;

    const user = await User.findByIdAndUpdate(
      req.session.userId,
      { 
        name, 
        phone,
        businessName
      },
      { new: true }
    );

    req.session.userName = user.name;

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;