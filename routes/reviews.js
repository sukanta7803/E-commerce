const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { isAuthenticated } = require('../middleware/auth');

router.post('/add', isAuthenticated, async (req, res) => {
  try {
    const { productId, rating, title, comment, orderId } = req.body;

    const existingReview = await Review.findOne({
      product: productId,
      user: req.session.userId
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product'
      });
    }

    let isVerifiedPurchase = false;
    if (orderId) {
      const order = await Order.findOne({
        _id: orderId,
        user: req.session.userId,
        'items.product': productId,
        status: 'delivered'
      });
      isVerifiedPurchase = !!order;
    }

    const review = new Review({
      product: productId,
      user: req.session.userId,
      order: orderId || undefined,
      rating: parseInt(rating),
      title,
      comment,
      isVerifiedPurchase
    });

    await review.save();

    const product = await Product.findById(productId);
    await product.recalculateRating();
    await product.save();

    res.json({
      success: true,
      message: 'Review added successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/:reviewId/helpful', isAuthenticated, async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    review.helpful += 1;
    await review.save();

    res.json({
      success: true,
      helpful: review.helpful
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;