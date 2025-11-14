const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { isAuthenticated } = require('../middleware/auth');

router.get('/', isAuthenticated, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.session.userId })
      .populate('items.product');

    if (!cart || cart.items.length === 0) {
      return res.render('cart/index', {
        title: 'Shopping Cart',
        cart: null,
        items: []
      });
    }

    res.render('cart/index', {
      title: 'Shopping Cart',
      cart,
      items: cart.items
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

router.post('/add', isAuthenticated, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const product = await Product.findById(productId);

    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ success: false, message: 'Insufficient stock' });
    }

    let cart = await Cart.findOne({ user: req.session.userId });

    if (!cart) {
      cart = new Cart({
        user: req.session.userId,
        items: []
      });
    }

    const existingItemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );

    const price = product.salePrice || product.price;

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += parseInt(quantity);
      cart.items[existingItemIndex].price = price;
    } else {
      cart.items.push({
        product: productId,
        quantity: parseInt(quantity),
        price
      });
    }

    await cart.save();

    req.session.cartItemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    res.json({ success: true, message: 'Product added to cart', cartItemCount: req.session.cartItemCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/update', isAuthenticated, async (req, res) => {
  try {
    const { itemId, quantity } = req.body;
    const cart = await Cart.findOne({ user: req.session.userId });

    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    const product = await Product.findById(item.product);
    if (product.stock < quantity) {
      return res.status(400).json({ success: false, message: 'Insufficient stock' });
    }

    item.quantity = parseInt(quantity);
    await cart.save();

    req.session.cartItemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    res.json({
      success: true,
      message: 'Cart updated',
      subtotal: cart.subtotal,
      cartItemCount: req.session.cartItemCount
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.delete('/remove/:itemId', isAuthenticated, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.session.userId });

    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    cart.items.pull(req.params.itemId);
    await cart.save();

    req.session.cartItemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    res.json({
      success: true,
      message: 'Item removed',
      cartItemCount: req.session.cartItemCount
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.delete('/clear', isAuthenticated, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.session.userId });

    if (cart) {
      cart.items = [];
      await cart.save();
      req.session.cartItemCount = 0;
    }

    res.json({ success: true, message: 'Cart cleared' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;