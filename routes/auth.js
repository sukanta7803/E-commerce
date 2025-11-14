const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { isGuest } = require('../middleware/auth');
const handleRegistration = async (req, res, role, templatePath, successRedirect = '/') => {
  try {
    const { name, email, password, confirmPassword, phone, businessName, 
            businessAddressLine1, businessAddressLine2, businessCity, 
            businessState, businessZipCode, businessCountry } = req.body;
    if (password !== confirmPassword) {
      return res.render(templatePath, {
        title: 'Register',
        error: 'Passwords do not match',
        formData: { name, email, phone, businessName, businessAddressLine1, businessAddressLine2, businessCity, businessState, businessZipCode, businessCountry }
      });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render(templatePath, {
        title: 'Register',
        error: 'Email already registered',
        formData: { name, email, phone, businessName, businessAddressLine1, businessAddressLine2, businessCity, businessState, businessZipCode, businessCountry }
      });
    }
    // For sellers, require business name
    if (role === 'seller' && !businessName) {
      return res.render(templatePath, {
        title: 'Register',
        error: 'Business name is required for sellers',
        formData: { name, email, phone, businessName, businessAddressLine1, businessAddressLine2, businessCity, businessState, businessZipCode, businessCountry }
      });
    }
    // Create business address object if provided
    let businessAddress = null;
    if (businessAddressLine1 && businessCity && businessState && businessZipCode) {
      businessAddress = {
        addressLine1: businessAddressLine1,
        addressLine2: businessAddressLine2 || '',
        city: businessCity,
        state: businessState,
        zipCode: businessZipCode,
        country: businessCountry || 'USA'
      };
    }
    const newUser = new User({ 
      name, 
      email, 
      password, 
      phone, 
      role,
      ...(role === 'seller' && { 
        businessName,
        businessAddress 
      })
    });
    await newUser.save();
    req.session.userId = newUser._id.toString();
    req.session.userName = newUser.name;
    req.session.userRole = newUser.role;
    req.session.isAuthenticated = true;
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.render(templatePath, {
          title: 'Register',
          error: 'Registration successful but session failed. Please login.',
          formData: {}
        });
      }
      res.redirect(successRedirect);
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.render(templatePath, {
      title: 'Register',
      error: 'Registration failed. Please try again.',
      formData: req.body
    });
  }
};
const handleLogin = async (req, res, role, templatePath, successRedirect = '/') => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, role });
    if (!user) {
      return res.render(templatePath, {
        title: 'Login',
        error: 'Invalid email or password',
        formData: { email }
      });
    }
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.render(templatePath, {
        title: 'Login',
        error: 'Invalid email or password',
        formData: { email }
      });
    }
    req.session.userId = user._id.toString();
    req.session.userName = user.name;
    req.session.userRole = user.role;
    req.session.isAuthenticated = true;
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.render(templatePath, {
          title: 'Login',
          error: 'Login successful but session failed. Please try again.',
          formData: { email }
        });
      }
      const returnTo = req.session.returnTo || successRedirect;
      delete req.session.returnTo;
      res.redirect(returnTo);
    });  
  } catch (error) {
    console.error('Login error:', error);
    res.render(templatePath, {
      title: 'Login',
      error: 'Login failed. Please try again.',
      formData: { email: req.body.email }
    });
  }
};
// User Registration
router.get('/register', isGuest, (req, res) => {
  res.render('auth/user-register', { 
    title: 'User Registration',
    error: null,
    formData: {}
  });
});
router.get('/sellerRegister', isGuest, (req, res) => {
  res.render('auth/seller-register', { 
    title: 'Seller Registration',
    error: null,
    formData: {}
  });
});
router.post('/register', isGuest, async (req, res) => {
  await handleRegistration(req, res, 'customer', 'auth/user-register');
});
router.post('/sellerRegister', isGuest, async (req, res) => {
  await handleRegistration(req, res, 'seller', 'auth/seller-register', '/seller/dashboard');
});
// User Login
router.get('/login', isGuest, (req, res) => {
  res.render('auth/user-login', { 
    title: 'User Login',
    error: null,
    formData: {}
  });
});
router.get('/login-seller', isGuest, (req, res) => {
  res.render('auth/seller-login', { 
    title: 'Seller Login',
    error: null,
    formData: {}
  });
});
router.post('/login', isGuest, async (req, res) => {
  await handleLogin(req, res, 'customer', 'auth/user-login');
});
router.post('/login-seller', isGuest, async (req, res) => {
  await handleLogin(req, res, 'seller', 'auth/seller-login', '/seller/dashboard');
});
// Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destruction error:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
});
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
});
module.exports = router;