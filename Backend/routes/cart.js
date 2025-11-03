// backend/routes/cart.js (This file is correct, no changes needed)
const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

router.route('/')
  .get(protect, getCart)
  .delete(protect, clearCart);

// This is the route you are now correctly calling: /api/cart/items
router.post('/items', protect, addToCart);

// These routes match the other fixes I made in cartSlice.js
router.route('/items/:itemId')
  .put(protect, updateCartItem)
  .delete(protect, removeFromCart);

module.exports = router;