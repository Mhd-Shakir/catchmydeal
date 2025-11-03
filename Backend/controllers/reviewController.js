// backend/controllers/reviewController.js
const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { uploadImage, deleteImage } = require('../config/cloudinary');

// --- START OF FIX: Helper function must be defined as a const ---
// Helper function to update product rating
const updateProductRating = async (productId) => {
  try {
    // Only count APPROVED reviews for rating
    const reviews = await Review.find({ product: productId, isApproved: true });
  
    if (reviews.length === 0) {
      await Product.findByIdAndUpdate(productId, {
        averageRating: 0,
        numReviews: 0
      });
      return;
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const avgRating = totalRating / reviews.length;

    await Product.findByIdAndUpdate(productId, {
      averageRating: avgRating.toFixed(1),
      numReviews: reviews.length
    });
  } catch(error) {
    console.error("Error updating product rating:", error);
  }
};
// --- END OF FIX ---


// @desc    Get all reviews (Admin)
// @route   GET /api/reviews/admin/all
// @access  Private/Admin
// --- START OF FIX: Changed 'exports.getAllReviews' to 'const getAllReviews' ---
const getAllReviews = async (req, res, next) => {
// --- END OF FIX ---
  try {
    const { page = 1, limit = 20, sort = '-createdAt', status } = req.query;

    let query = {};
    if (status === 'pending') {
      query.isApproved = false;
    } else if (status === 'approved') {
      query.isApproved = true;
    }

    const reviews = await Review.find(query)
      .populate('user', 'name avatar')
      .populate('product', 'name images')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Review.countDocuments(query);

    res.status(200).json({
      success: true,
      data: reviews,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(count / limit),
        totalReviews: count
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get product reviews
// @route   GET /api/reviews/:productId
// @access  Public
// --- START OF FIX: Changed 'exports.getProductReviews' to 'const getProductReviews' ---
const getProductReviews = async (req, res, next) => {
// --- END OF FIX ---
  try {
    const { page = 1, limit = 10, sort = '-createdAt' } = req.query;

    const reviews = await Review.find({ 
      product: req.params.productId,
      isApproved: true 
    })
      .populate('user', 'name avatar')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Review.countDocuments({ 
      product: req.params.productId,
      isApproved: true 
    });

    res.status(200).json({
      success: true,
      data: reviews,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(count / limit),
        totalReviews: count
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create review
// @route   POST /api/reviews
// @access  Private
// --- START OF FIX: Changed 'exports.createReview' to 'const createReview' ---
const createReview = async (req, res, next) => {
// --- END OF FIX ---
  try {
    // Data now comes from FormData (req.body for text, req.files for images)
    const { product, rating, title, comment } = req.body;
    const files = req.files || [];

    if (!product || !rating || !title || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if product exists
    const productExists = await Product.findById(product);
    if (!productExists) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if user has purchased the product
    const hasPurchased = await Order.findOne({
      user: req.user.id,
      'items.product': product,
      orderStatus: 'delivered' // Check your app's status, 'delivered' is common
    });

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      product,
      user: req.user.id
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product'
      });
    }

    // Handle image uploads
    let uploadedImages = [];
    if (files.length > 0) {
      const uploadPromises = files.map(file => {
        const dataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
        return uploadImage(dataUri, 'reviews');
      });
      uploadedImages = await Promise.all(uploadPromises);
    }

    // Create review
    const review = await Review.create({
      product,
      user: req.user.id,
      rating: Number(rating),
      title,
      comment,
      images: uploadedImages,
      isVerifiedPurchase: !!hasPurchased,
      isApproved: true // Set to true by default, or false if you want moderation
    });

    // Update product rating
    await updateProductRating(product);

    await review.populate('user', 'name avatar');

    res.status(201).json({
      success: true,
      data: review
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private
// --- START OF FIX: Changed 'exports.updateReview' to 'const updateReview' ---
const updateReview = async (req, res, next) => {
// --- END OF FIX ---
  try {
    let review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Make sure user is review owner
    if (review.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this review'
      });
    }

    const { rating, title, comment, existingImages } = req.body;
    const newFiles = req.files || [];
    
    const imagesToKeep = JSON.parse(existingImages || '[]');
    const updateData = {};

    if (rating) updateData.rating = Number(rating);
    if (title) updateData.title = title;
    if (comment) updateData.comment = comment;

    // Handle Image Deletions
    const imagesToDelete = review.images.filter(
      oldImage => !imagesToKeep.some(keepImage => keepImage.publicId === oldImage.publicId)
    );
    if (imagesToDelete.length > 0) {
      await Promise.all(
        imagesToDelete.map(image => deleteImage(image.publicId))
      );
    }

    // Handle Image Uploads
    let newUploadedImages = [];
    if (newFiles.length > 0) {
      const uploadPromises = newFiles.map(file => {
        const dataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
        return uploadImage(dataUri, 'reviews');
      });
      newUploadedImages = await Promise.all(uploadPromises);
    }
    
    updateData.images = [...imagesToKeep, ...newUploadedImages];
    // When a review is edited, you might want to set it to unapproved
    updateData.isApproved = true; // Or false for re-moderation

    review = await Review.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    // Update product rating
    await updateProductRating(review.product);

    await review.populate('user', 'name avatar');

    res.status(200).json({
      success: true,
      data: review
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
// --- START OF FIX: Changed 'exports.deleteReview' to 'const deleteReview' ---
const deleteReview = async (req, res, next) => {
// --- END OF FIX ---
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Make sure user is review owner or admin
    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this review'
      });
    }

    const productId = review.product;
    
    // --- START OF FIX: Delete images from Cloudinary ---
    if (review.images && review.images.length > 0) {
      await Promise.all(
        review.images.map(image => deleteImage(image.publicId))
      );
    }
    // --- END OF FIX ---

    await review.deleteOne();

    // Update product rating
    await updateProductRating(productId);

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark review as helpful
// @route   PUT /api/reviews/:id/helpful
// @access  Private
// --- START OF FIX: Changed 'exports.markHelpful' to 'const markHelpful' ---
const markHelpful = async (req, res, next) => {
// --- END OF FIX ---
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user already marked this review as helpful
    const alreadyMarked = review.helpfulUsers.includes(req.user.id);

    if (alreadyMarked) {
      // Remove from helpful
      review.helpfulUsers = review.helpfulUsers.filter(
        userId => userId.toString() !== req.user.id
      );
      review.helpfulCount = review.helpfulUsers.length; // Safer way to count
    } else {
      // Add to helpful
      review.helpfulUsers.push(req.user.id);
      review.helpfulCount = review.helpfulUsers.length; // Safer way to count
    }

    await review.save();

    res.status(200).json({
      success: true,
      data: review
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's reviews
// @route   GET /api/reviews/my-reviews
// @access  Private
// --- START OF FIX: Changed 'exports.getMyReviews' to 'const getMyReviews' ---
const getMyReviews = async (req, res, next) => {
// --- END OF FIX ---
  try {
    const { page = 1, limit = 10 } = req.query;

    const reviews = await Review.find({ user: req.user.id })
      .populate('product', 'name images price')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Review.countDocuments({ user: req.user.id });

    res.status(200).json({
      success: true,
      data: reviews,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(count / limit),
        totalReviews: count
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve a review (Admin)
// @route   PUT /api/reviews/:id/approve
// @access  Private/Admin
// --- START OF FIX: Changed 'exports.approveReview' to 'const approveReview' ---
const approveReview = async (req, res, next) => {
// --- END OF FIX ---
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    review.isApproved = true;
    await review.save();

    // Recalculate product rating
    await updateProductRating(review.product);

    res.status(200).json({
      success: true,
      message: 'Review approved',
      data: review
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Disapprove a review (Admin)
// @route   PUT /api/reviews/:id/disapprove
// @access  Private/Admin
// --- START OF FIX: Changed 'exports.disapproveReview' to 'const disapproveReview' ---
const disapproveReview = async (req, res, next) => {
// --- END OF FIX ---
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    review.isApproved = false;
    await review.save();

    // Recalculate product rating
    await updateProductRating(review.product);

    res.status(200).json({
      success: true,
      message: 'Review set to pending',
      data: review
    });
  } catch (error) {
    next(error);
  }
};


// --- START OF FIX: This is the 'module.exports' block that was causing the error ---
// Now it correctly exports all the functions we defined as 'const'
module.exports = {
  getAllReviews,
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  markHelpful,
  getMyReviews,
  approveReview,
  disapproveReview
};
// --- END OF FIX ---