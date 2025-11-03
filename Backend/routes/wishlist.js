// ==========================================
// FILE 3: backend/routes/wishlist.js
// ==========================================
const express = require('express');
const router = express.Router();
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist
} = require('../controllers/wishlistController');
const { protect } = require('../middleware/auth');

router.route('/')
  .get(protect, getWishlist)
  .delete(protect, clearWishlist);

router.route('/:productId')
  .post(protect, addToWishlist)
  .delete(protect, removeFromWishlist);

module.exports = router;