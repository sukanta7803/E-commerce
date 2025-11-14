const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  comment: { 
    type: String, 
    required: true, 
    trim: true 
  },
  rating: { 
    type: Number, 
    min: 1, 
    max: 5, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: true
  },
  shortDescription: String,
  price: {
    type: Number,
    required: true,
    min: 0
  },
  salePrice: {
    type: Number,
    min: 0
  },
  // Make SKU optional and remove unique constraint
  sku: {
    type: String
  },
  stock: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  lowStockThreshold: {
    type: Number,
    default: 10
  },
  brand: {
    type: String,
    trim: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  tags: {
    type: [String],
    index: true,
    default: []
  },
  images: {
    type: [{
      url: String,
      alt: String
    }],
    validate: {
      validator: function(arr) { 
        return Array.isArray(arr) && arr.length >= 1 && arr.length <= 6; 
      },
      message: 'Products must have between 1 and 6 images.'
    }
  },
  specifications: [{
    key: String,
    value: String
  }],
  seller: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    index: true 
  },
  sellerName: { 
    type: String, 
    required: true, 
    trim: true 
  },
  feedback: [feedbackSchema],
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  ratingCount: {
    type: Number,
    default: 0
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  salesCount: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

productSchema.index({ name: 'text', tags: 'text', description: 'text' });

productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Generate SKU if not provided
  if (!this.sku) {
    this.sku = 'SKU-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }
  
  // Ensure tags is always an array
  if (this.tags && !Array.isArray(this.tags)) {
    this.tags = [this.tags];
  }
  
  next();
});

productSchema.methods.recalculateRating = function() {
  if (!this.feedback || this.feedback.length === 0) {
    this.averageRating = 0;
    this.ratingCount = 0;
    this.reviewCount = 0;
    return;
  }
  
  const total = this.feedback.reduce((sum, f) => sum + (f.rating || 0), 0);
  this.ratingCount = this.feedback.length;
  this.reviewCount = this.feedback.length;
  this.averageRating = Math.round((total / this.ratingCount) * 10) / 10;
};

productSchema.statics.findByRating = function(minRating = 0, maxRating = 5) {
  return this.find({ 
    averageRating: { $gte: minRating, $lte: maxRating } 
  });
};

productSchema.virtual('isOnSale').get(function() {
  return this.salePrice && this.salePrice < this.price;
});

productSchema.virtual('stockStatus').get(function() {
  if (this.stock === 0) return 'out-of-stock';
  if (this.stock <= this.lowStockThreshold) return 'low-stock';
  return 'in-stock';
});

module.exports = mongoose.model('Product', productSchema);