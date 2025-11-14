const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');
const { isAuthenticated } = require('../middleware/auth');

router.get('/checkout', isAuthenticated, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.session.userId })
      .populate('items.product');

    if (!cart || cart.items.length === 0) {
      return res.redirect('/cart');
    }
    const user = await User.findById(req.session.userId);
    const shippingCost = 10;
    const taxRate = 0.08;
    const tax = cart.subtotal * taxRate;
    const total = cart.subtotal + shippingCost + tax;
    res.render('orders/checkout', {
      title: 'Checkout',
      cart,
      user,
      shippingCost,
      tax,
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

router.post('/place', isAuthenticated, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.session.userId })
      .populate('items.product');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }
    const { shippingAddress, paymentMethod } = req.body;
    for (const item of cart.items) {
      if (item.product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${item.product.name}`
        });
      }
    }
    const orderNumber = 'ORD' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();
    const shippingCost = 10;
    const taxRate = 0.08;
    const tax = cart.subtotal * taxRate;
    const total = cart.subtotal + shippingCost + tax;
    const order = new Order({
      orderNumber,
      user: req.session.userId,
      items: cart.items.map(item => ({
        product: item.product._id,
        name: item.product.name,
        quantity: item.quantity,
        price: item.price,
        selectedVariants: item.selectedVariants
      })),
      shippingAddress: JSON.parse(shippingAddress),
      paymentMethod,
      subtotal: cart.subtotal,
      shippingCost,
      tax,
      total,
      statusHistory: [{
        status: 'pending',
        timestamp: new Date(),
        note: 'Order placed'
      }]
    });
    await order.save();
    for (const item of cart.items) {
      const product = await Product.findById(item.product._id);
      product.stock -= item.quantity;
      product.salesCount += item.quantity;
      await product.save();
    }

    const user = await User.findById(req.session.userId);
    user.loyaltyPoints += Math.floor(total / 10);
    await user.save();
    cart.items = [];
    await cart.save();
    req.session.cartItemCount = 0;
    res.json({
      success: true,
      message: 'Order placed successfully',
      orderId: order._id
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/confirmation/:orderId', isAuthenticated, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      user: req.session.userId
    }).populate('items.product');
    if (!order) {
      return res.status(404).render('error', {
        message: 'Order not found',
        error: { status: 404 },
        user: res.locals.user
      });
    }
    res.render('orders/confirmation', {
      title: 'Order Confirmation',
      order
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.session.userId })
      .sort({ createdAt: -1 })
      .populate('items.product');

    res.render('orders/list', {
      title: 'My Orders',
      orders
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});
router.get('/:orderId', isAuthenticated, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      user: req.session.userId
    }).populate('items.product');
    if (!order) {
      return res.status(404).render('error', {
        message: 'Order not found',
        error: { status: 404 },
        user: res.locals.user
      });
    }
    res.render('orders/detail', {
      title: 'Order Details',
      order
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});
module.exports = router;