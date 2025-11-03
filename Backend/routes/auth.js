const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  refreshToken,
  forgotPassword,
  resetPassword,
  updatePassword,
  logout
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/me', protect, getMe);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password/:resetToken', resetPassword);
router.put('/update-password', protect, updatePassword);
router.post('/logout', protect, logout);

module.exports = router;