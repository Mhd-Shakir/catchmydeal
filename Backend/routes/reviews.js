// backend/routes/reviews.js
const express = require('express');
const router = express.Router();
const {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  markHelpful,
  getAllReviews,
  approveReview,     // --- ADDED ---
  disapproveReview   // --- ADDED ---
} = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');
const upload = require('../middleware/upload');

// Admin route
router.get('/admin/all', protect, adminOnly, getAllReviews);

// --- START OF FIX: New admin routes for approval ---
router.put('/:id/approve', protect, adminOnly, approveReview);
router.put('/:id/disapprove', protect, adminOnly, disapproveReview);
// --- END OF FIX ---

// Get reviews for one product
router.get('/:productId', getProductReviews);

// Create a new review
router.route('/')
  .post(protect, upload.array('images', 5), createReview);

// Update/Delete a specific review
router.route('/:id')
  .put(protect, upload.array('images', 5), updateReview)
  .delete(protect, deleteReview);

// Mark as helpful
router.put('/:id/helpful', protect, markHelpful);

module.exports = router;