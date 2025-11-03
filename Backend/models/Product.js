const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative']
  },
  originalPrice: {
    type: Number,
    default: function() {
      // Ensure originalPrice defaults to price only if it's not explicitly set
      return this.price;
    }
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative'],
    max: [100, 'Discount cannot exceed 100%']
  },
  category: {
    type: String,
    required: [true, 'Product category is required'],
    trim: true, // Added trim to clean up potential whitespace
    lowercase: true, // Added lowercase to ensure consistency
    enum: {
      values: [
        'clothing',
        'mens-clothing',
        'womens-clothing',
        'kids-clothing',
        'accessories',
        'footwear',
        'electronics',
        'home',
        'sports',
        'beauty',
        'books',
        'toys',
        'jewelry',
        'watches',
        'bags',
        'perfumes', // ✅ FIXED: Added "perfumes" here
        'other'
      ],
      // Improved error message for clarity
      message: '"{VALUE}" is not a valid category. Please choose from the allowed categories.'
    }
  },
  subCategory: {
    type: String,
    trim: true,
    default: ''
  },
  brand: {
    type: String,
    trim: true,
    default: ''
  },
  images: [{
    url: {
      type: String,
      required: [true, 'Image URL is required']
    },
    publicId: {
      type: String,
      required: false // Keep optional
    },
    altText: {
      type: String,
      default: ''
    }
  }],
  stock: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  sizes: [{
    type: String,
    trim: true
  }],
  colors: [{
    type: String,
    trim: true
  }],
  specifications: {
    type: Map,
    of: String,
    default: {}
  },
  tags: [{
    type: String,
    trim: true
  }],
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  numReviews: {
    type: Number,
    default: 0
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Keep optional unless you have specific logic for it
  },
  views: {
    type: Number,
    default: 0
  },
  soldCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for reviews
productSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'product'
});

// Indexes for better query performance
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ isFeatured: 1, isActive: 1 });
productSchema.index({ name: 'text', description: 'text', tags: 'text' }); // For text search

// Method to update averageRating and numReviews based on reviews
productSchema.methods.updateRating = async function() {
  // Use try-catch for robustness
  try {
    // Ensure Review model is registered before calling aggregate
    const Review = mongoose.model('Review');

    const stats = await Review.aggregate([
      { $match: { product: this._id } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          numReviews: { $sum: 1 }
        }
      }
    ]);

    let needsSave = false;
    if (stats.length > 0) {
      const newAvgRating = Math.round(stats[0].averageRating * 10) / 10;
      const newNumReviews = stats[0].numReviews;
      // Check if values actually changed to prevent unnecessary saves
      if (this.averageRating !== newAvgRating || this.numReviews !== newNumReviews) {
        this.averageRating = newAvgRating;
        this.numReviews = newNumReviews;
        needsSave = true;
      }
    } else if (this.averageRating !== 0 || this.numReviews !== 0) {
      // Reset if no reviews found but current values are not 0
      this.averageRating = 0;
      this.numReviews = 0;
      needsSave = true;
    }

    // Save only if changes occurred, skip validation during this save
    if (needsSave) {
      await this.save({ validateBeforeSave: false });
    }
  } catch (error) {
    console.error(`Error updating rating for product ${this._id}:`, error);
  }
};

// Method to increment view count
productSchema.methods.incrementViews = async function() {
  try {
    this.views = (this.views || 0) + 1; // Ensure views is a number
    // Skip validation as only views is changed
    await this.save({ validateBeforeSave: false });
  } catch (error) {
    console.error(`Error incrementing views for product ${this._id}:`, error);
  }
};

// Pre-save middleware to calculate discount based on price and originalPrice
productSchema.pre('save', function(next) {
  // Only calculate if price or originalPrice is modified or if it's a new document
  if (this.isModified('price') || this.isModified('originalPrice') || this.isNew) {
      if (this.originalPrice && this.price && this.originalPrice > 0 && this.originalPrice >= this.price) {
          // Calculate percentage discount
          this.discount = Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
      } else {
          // If originalPrice is missing, 0, or less than price, set discount to 0
          this.discount = 0;
          // Optionally, ensure originalPrice is at least equal to price if not set correctly
          if (!this.originalPrice || this.originalPrice < this.price) {
            this.originalPrice = this.price;
          }
      }
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);