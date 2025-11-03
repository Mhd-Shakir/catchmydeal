// backend/routes/products.js
const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  getFeaturedProducts,
  getSimilarProducts
} = require('../controllers/productController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');

// --- START OF FIX ---
// Import the new upload middleware
const upload = require('../middleware/upload');
// --- END OF FIX ---

// IMPORTANT: Specific routes MUST come before parameterized routes (:id)
// Otherwise Express will treat 'categories' and 'featured' as IDs

// Specific routes first
router.get('/categories', getCategories);
router.get('/featured', getFeaturedProducts);

// General routes
router.route('/')
  .get(getProducts)
  // Apply upload middleware for creating products. 
  // 'images' is the field name from AddProduct.jsx
  .post(protect, adminOnly, upload.array('images', 10), createProduct);

// Similar products route (MUST be before /:id to avoid conflict)
router.get('/:id/similar', getSimilarProducts);

// Parameterized routes last (so they don't catch specific routes)
router.route('/:id')
  .get(getProduct)
  // Apply upload middleware for updating products.
  // 'newImages' is the field name from AddProduct.jsx
  .put(protect, adminOnly, upload.array('newImages', 10), updateProduct)
  .delete(protect, adminOnly, deleteProduct);

module.exports = router;