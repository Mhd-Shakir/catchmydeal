const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getOrder,
  cancelOrder,
  getUserOrderStats
} = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

// User order routes
router.route('/')
  .post(protect, createOrder)
  .get(protect, getMyOrders);

// @desc    Get order statistics for the logged-in user
// @route   GET /api/orders/user-stats
// @access  Private
router.get('/user-stats', protect, getUserOrderStats);

// Single order routes
router.get('/:id', protect, getOrder);
router.put('/:id/cancel', protect, cancelOrder);

module.exports = router;