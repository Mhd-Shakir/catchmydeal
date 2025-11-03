const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getAllOrders,
  updateOrderStatus,
  getAllProducts,
  getAllReviews,
  approveReview
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');

// Apply auth and admin middleware to all routes
router.use(protect, adminOnly);

// Dashboard Routes
// Support both /stats and /dashboard/stats for backward compatibility
router.get('/stats', getDashboardStats);
router.get('/dashboard/stats', getDashboardStats);

// User Management Routes
router.get('/users', getAllUsers);
router.route('/users/:id')
  .get(getUserById)
  .put(updateUser)
  .delete(deleteUser);

// Order Management Routes
router.get('/orders', getAllOrders);
router.put('/orders/:id/status', updateOrderStatus);

// Product Management Routes
router.get('/products', getAllProducts);

// Review Management Routes
router.get('/reviews', getAllReviews);
router.put('/reviews/:id/approve', approveReview);

module.exports = router;