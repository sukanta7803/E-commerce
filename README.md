# 🛍️ Shopfinity - E-Commerce Platform

A full-featured e-commerce website built with Node.js, Express, MongoDB, and EJS templating engine. ShopEase provides a complete online shopping experience for customers and a comprehensive management system for sellers.

## 🌟 Features

### 🛒 Customer Features
- **User Authentication** - Secure registration and login system
- **Product Browsing** - Search, filter, and categorize products
- **Shopping Cart** - Add, update, and remove items
- **Wishlist** - Save favorite products for later
- **Order Management** - Complete checkout process with order tracking
- **Product Reviews** - Rate and review purchased products
- **Address Management** - Multiple shipping addresses
- **Loyalty Points** - Earn rewards on purchases

### 🏪 Seller Features
- **Seller Dashboard** - Overview of sales and performance
- **Product Management** - Add, edit, and manage product listings
- **Inventory Management** - Track stock levels with low-stock alerts
- **Order Management** - Process and fulfill customer orders
- **Sales Analytics** - View sales reports and insights
- **Seller Profile** - Manage business information


## 🚀 Live Demo

**Live Website:** [https://shopease.onrender.com](https://e-commerce-wkby.onrender.com)

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **BCryptJS** - Password hashing
- **Express-Session** - Session management
- **Connect-Mongo** - Session storage

### Frontend
- **EJS** - Templating engine
- **CSS3** - Custom styling with CSS variables
- **JavaScript** - Client-side interactivity
- **Responsive Design** - Mobile-first approach

### Deployment
- **Render** - Hosting platform
- **MongoDB Atlas** - Cloud database

## 📦 Installation & Local Development

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Git


## 🗄️ Database Schema

### Core Models
- **Users** - Customer and seller accounts
- **Products** - Product listings with inventory
- **Categories** - Product categorization
- **Carts** - Shopping cart data
- **Orders** - Order information and status
- **Reviews** - Product ratings and reviews
- **Sessions** - User session storage

## 🎯 Usage Guide

### For Customers
1. **Register/Login** - Create an account or sign in
2. **Browse Products** - Use search and filters to find products
3. **Add to Cart** - Select products and quantities
4. **Checkout** - Complete purchase with secure payment
5. **Track Orders** - Monitor order status and delivery
6. **Leave Reviews** - Share feedback on purchased items

### For Sellers
1. **Seller Registration** - Create a seller account with business details
2. **Add Products** - Create product listings with images and details
3. **Manage Inventory** - Update stock levels and pricing
4. **Process Orders** - Fulfill and ship customer orders
5. **View Analytics** - Monitor sales performance and reports

## 🔧 API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `POST /auth/sellerRegister` - Seller registration

### Products
- `GET /products` - Browse all products
- `GET /products/:slug` - Product details
- `POST /seller/products` - Create product (seller)
- `PUT /seller/products/:id` - Update product (seller)

### Cart & Orders
- `GET /cart` - View cart
- `POST /cart/add` - Add to cart
- `PUT /cart/update` - Update cart item
- `POST /orders/place` - Create order
- `GET /orders` - Order history

### User Management
- `GET /user/profile` - User profile
- `PUT /user/profile` - Update profile
- `GET /user/wishlist` - Wishlist management


## 📱 Responsive Design

ShopEase is fully responsive and optimized for:
- 📱 Mobile devices
- 💻 Tablets
- 🖥️ Desktop computers
- 🖥️ Large screens

## 🔒 Security Features

- Password hashing with bcrypt
- Session-based authentication
- CSRF protection
- Input validation and sanitization
- Secure headers
- MongoDB injection prevention

