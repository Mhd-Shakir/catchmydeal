const express = require('express');
const router = express.Router();
const {
  createRazorpayOrder,
  verifyRazorpayPayment,
  getPaymentStatus,
  refundPayment
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');
const { paymentLimiter } = require('../middleware/rateLimiter');

router.post('/create-order', protect, paymentLimiter, createRazorpayOrder);
router.post('/verify', protect, verifyRazorpayPayment);
router.get('/:paymentId', protect, getPaymentStatus);
router.post('/refund', protect, adminOnly, refundPayment);

module.exports = router;