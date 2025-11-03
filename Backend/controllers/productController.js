// backend/controllers/productController.js
const Product = require('../models/Product');
// --- START OF FIX ---
// Import Cloudinary helpers
const { uploadImage, deleteImage } = require('../config/cloudinary');
// --- END OF FIX ---

// @desc    Get all products with filtering, sorting, and pagination
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      subCategory,
      minPrice,
      maxPrice,
      brand,
      search,
      sort,
      inStock,
      isFeatured
    } = req.query;

    // Build query
    const query = { isActive: true };

    // Category filter
    if (category) {
      query.category = category;
    }

    // SubCategory filter
    if (subCategory) {
      query.subCategory = subCategory;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Brand filter
    if (brand) {
      query.brand = brand;
    }

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Stock filter
    if (inStock === 'true') {
      query.stock = { $gt: 0 };
    }

    // Featured filter
    if (isFeatured === 'true') {
      query.isFeatured = true;
    }

    // Build sort
    let sortOption = {};
    if (sort) {
      switch (sort) {
        case 'price-asc':
          sortOption = { price: 1 };
          break;
        case 'price-desc':
          sortOption = { price: -1 };
          break;
        case 'name-asc':
          sortOption = { name: 1 };
          break;
        case 'name-desc':
          sortOption = { name: -1 };
          break;
        case 'newest':
          sortOption = { createdAt: -1 };
          break;
        case 'oldest':
          sortOption = { createdAt: 1 };
          break;
        case 'rating':
          sortOption = { averageRating: -1 };
          break;
        default:
          sortOption = { createdAt: -1 };
      }
    } else {
      sortOption = { createdAt: -1 };
    }

    // Execute query with pagination
    const products = await Product.find(query)
      .sort(sortOption)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Get total count for pagination
    const count = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(count / limit),
        totalProducts: count,
        hasMore: page * limit < count
      }
    });
  } catch (error) {
    console.error('❌ Get products error:', error);
    next(error);
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('reviews')
      .lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Don't show inactive products to non-admin users
    if (!product.isActive && (!req.user || req.user.role !== 'admin')) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('❌ Get product error:', error);

    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    next(error);
  }
};

// --- START OF FIXED createProduct ---

// @desc    Create new product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res, next) => {
  try {
    // Get text fields from req.body
    const {
      name,
      description,
      shortDescription,
      price,
      originalPrice,
      category,
      subcategory,
      brand,
      stock,
      featured,
    } = req.body;
    
    // Get image files from req.files (thanks to multer)
    const files = req.files;

    // --- 1. Validation ---
    if (!name || !description || !price || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, description, price, category'
      });
    }

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one product image'
      });
    }

    // --- 2. Parse JSON fields from FormData ---
    const tags = JSON.parse(req.body.tags || '[]');
    const sizes = JSON.parse(req.body.sizes || '[]');
    const colors = JSON.parse(req.body.colors || '[]');
    const specifications = JSON.parse(req.body.specifications || '{}');
    const isFeatured = featured === 'true'; // Convert string 'true' to boolean

    // --- 3. Upload Images to Cloudinary ---
    const imageUploadPromises = files.map(file => {
      // Convert buffer to data URI to send to Cloudinary
      const dataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      return uploadImage(dataUri, 'products');
    });

    const uploadedImages = await Promise.all(imageUploadPromises);
    
    // --- 4. Create Product in DB ---
    const product = await Product.create({
      name: name.trim(),
      description: description.trim(),
      shortDescription: shortDescription?.trim() || '',
      price: Number(price),
      originalPrice: Number(originalPrice) || Number(price),
      category,
      subCategory: subcategory?.trim() || '',
      brand: brand?.trim() || '',
      images: uploadedImages, // Use the array from Cloudinary
      stock: Number(stock) || 0,
      sizes,
      colors,
      specifications,
      tags,
      isFeatured,
      createdBy: req.user.id,
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });

  } catch (error) {
    console.error('❌ Product creation error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    next(error);
  }
};
// --- END OF FIXED createProduct ---


// --- START OF FIXED updateProduct ---

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Get new files from req.files
    const newFiles = req.files || [];
    
    // Get text fields and stringified JSON from req.body
    const {
      name,
      description,
      shortDescription,
      price,
      originalPrice,
      category,
      subcategory,
      brand,
      stock,
      featured,
      tags,
      sizes,
      colors,
      specifications,
      existingImages // This is a JSON string of images to keep
    } = req.body;

    // --- 1. Parse Data ---
    const imagesToKeep = JSON.parse(existingImages || '[]');
    const updateData = {};

    // Only add fields to updateData if they were provided
    if (name) updateData.name = name.trim();
    if (description) updateData.description = description.trim();
    if (shortDescription) updateData.shortDescription = shortDescription.trim();
    if (price) updateData.price = Number(price);
    if (originalPrice) updateData.originalPrice = Number(originalPrice);
    if (category) updateData.category = category;
    if (subcategory) updateData.subCategory = subcategory.trim();
    if (brand) updateData.brand = brand.trim();
    if (stock) updateData.stock = Number(stock);
    if (featured) updateData.isFeatured = featured === 'true'; // Note: isFeatured in model
    
    // Parse JSON fields
    if (tags) updateData.tags = JSON.parse(tags);
    if (sizes) updateData.sizes = JSON.parse(sizes);
    if (colors) updateData.colors = JSON.parse(colors);
    if (specifications) updateData.specifications = JSON.parse(specifications);

    // --- 2. Validate Images ---
    if (imagesToKeep.length === 0 && newFiles.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Product must have at least one image'
      });
    }

    // --- 3. Handle Image Deletions from Cloudinary ---
    const imagesToDelete = product.images.filter(
      oldImage => !imagesToKeep.some(keepImage => keepImage.publicId === oldImage.publicId)
    );
    
    if (imagesToDelete.length > 0) {
      await Promise.all(
        imagesToDelete.map(image => deleteImage(image.publicId))
      );
    }

    // --- 4. Handle Image Uploads to Cloudinary ---
    let newUploadedImages = [];
    if (newFiles.length > 0) {
      const uploadPromises = newFiles.map(file => {
        const dataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
        return uploadImage(dataUri, 'products');
      });
      newUploadedImages = await Promise.all(uploadPromises);
    }

    // --- 5. Combine image arrays ---
    updateData.images = [...imagesToKeep, ...newUploadedImages];
    
    // --- 6. Update Product in DB ---
    product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });

  } catch (error) {
    console.error('❌ Product update error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    next(error);
  }
};
// --- END OF FIXED updateProduct ---

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // --- START OF FIX ---
    // Also delete images from Cloudinary
    if (product.images && product.images.length > 0) {
      await Promise.all(
        product.images.map(image => deleteImage(image.publicId))
      );
    }
    // --- END OF FIX ---

    // Soft delete - just mark as inactive
    product.isActive = false;
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete product error:', error);

    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    next(error);
  }
};

// @desc    Get all categories
// @route   GET /api/products/categories
// @access  Public
const getCategories = async (req, res, next) => {
  try {
    const categories = await Product.distinct('category', { isActive: true });
    
    const categoryData = await Promise.all(
      categories.map(async (category) => {
        const count = await Product.countDocuments({
          category,
          isActive: true
        });
        return {
          name: category,
          count
        };
      })
    );

    res.status(200).json({
      success: true,
      data: categoryData
    });
  } catch (error) {
    console.error('❌ Get categories error:', error);
    next(error);
  }
};

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
const getFeaturedProducts = async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 8;

    const products = await Product.find({
      isFeatured: true,
      isActive: true
    })
      .sort('-createdAt')
      .limit(limit)
      .lean();

    res.status(200).json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('❌ Get featured products error:', error);
    next(error);
  }
};

// @desc    Get similar products
// @route   GET /api/products/:id/similar
// @access  Public
const getSimilarProducts = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const limit = Number(req.query.limit) || 4;

    // Find similar products based on category and tags
    const similarProducts = await Product.find({
      _id: { $ne: product._id },
      isActive: true,
      $or: [
        { category: product.category },
        { tags: { $in: product.tags } }
      ]
    })
      .limit(limit)
      .lean();

    res.status(200).json({
      success: true,
      data: similarProducts
    });
  } catch (error) {
    console.error('❌ Get similar products error:', error);

    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    next(error);
  }
};

// Helper function to validate image upload from Cloudinary
const validateCloudinaryImage = (imageData) => {
  if (!imageData || typeof imageData !== 'object') {
    return {
      isValid: false,
      error: 'Invalid image data'
    };
  }

  if (!imageData.secure_url && !imageData.url) {
    return {
      isValid: false,
      error: 'Image URL is required'
    };
  }

  if (!imageData.public_id) {
    return {
      isValid: false,
      error: 'Image public_id is required'
    };
  }

  return {
    isValid: true,
    image: {
      url: imageData.secure_url || imageData.url,
      publicId: imageData.public_id
    }
  };
};

// Export all functions properly
module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  getFeaturedProducts,
  getSimilarProducts,
  validateCloudinaryImage
};