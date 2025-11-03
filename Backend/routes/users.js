const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  changePassword,
  getUserProfile,
  updateUserProfile,
  addAddress,
  updateAddress,
  deleteAddress
} = require('../controllers/userController');

// Profile routes
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);

// Password route
router.put('/change-password', protect, changePassword);

// Address routes
router.post('/addresses', protect, addAddress);
router.put('/addresses/:addressId', protect, updateAddress);
router.delete('/addresses/:addressId', protect, deleteAddress);

module.exports = router;