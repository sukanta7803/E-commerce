const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');
const { isAuthenticated } = require('../middleware/auth');

router.get('/profile', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.redirect('/auth/login');
    }
    res.render('user/profile', {
      title: 'My Profile',
      user:' '
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

router.post('/profile/update', isAuthenticated, async (req, res) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findByIdAndUpdate(
      req.session.userId,
      { name, phone },
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

router.get('/addresses', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);

    res.render('user/addresses', {
      title: 'My Addresses',
      addresses: user.addresses || []
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

router.post('/addresses/add', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);

    if (req.body.isDefault === 'true') {
      user.addresses.forEach(addr => addr.isDefault = false);
    }
    user.addresses.push(req.body);
    await user.save();

    res.json({
      success: true,
      message: 'Address added successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.delete('/addresses/:addressId', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    user.addresses.pull(req.params.addressId);
    await user.save();

    res.json({
      success: true,
      message: 'Address deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/wishlist', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).populate('wishlist');
    res.render('user/wishlist', {
      title: 'My Wishlist',
      products: user.wishlist || []
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

router.post('/wishlist/add', isAuthenticated, async (req, res) => {
  try {
    const { productId } = req.body;
    const user = await User.findById(req.session.userId);
    if (!user.wishlist.includes(productId)) {
      user.wishlist.push(productId);
      await user.save();
    }
    res.json({
      success: true,
      message: 'Added to wishlist'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.delete('/wishlist/remove/:productId', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    user.wishlist.pull(req.params.productId);
    await user.save();
    res.json({
      success: true,
      message: 'Removed from wishlist'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;