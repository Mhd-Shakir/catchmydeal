const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  size: String,
  color: String,
  // ✅ ADDED: Make category optional
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: false
  }
});

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderNumber: {
    type: String,
    unique: true,
    required: false
  },
  items: [orderItemSchema],
  shippingAddress: {
    fullName: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    addressLine1: {
      type: String,
      required: true
    },
    addressLine2: String,
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    zipCode: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true,
      default: 'India'
    }
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['razorpay', 'cod', 'card', 'upi']
  },
  paymentInfo: {
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    transactionId: String
  },
  itemsPrice: {
    type: Number,
    required: true,
    default: 0
  },
  taxPrice: {
    type: Number,
    required: true,
    default: 0
  },
  shippingPrice: {
    type: Number,
    required: true,
    default: 0
  },
  totalPrice: {
    type: Number,
    required: true,
    default: 0
  },
  orderStatus: {
    type: String,
    required: true,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    required: true,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  paidAt: Date,
  isDelivered: {
    type: Boolean,
    default: false
  },
  deliveredAt: Date,
  cancelledAt: Date,
  cancellationReason: String,
  trackingNumber: String,
  courierService: String,
  estimatedDelivery: Date,
  statusHistory: [{
    status: String,
    note: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// ✅ IMPROVED: Generate order number before saving
orderSchema.pre('save', async function(next) {
  // Only generate if it's a new document and orderNumber doesn't exist
  if (this.isNew && !this.orderNumber) {
    try {
      // Get count of all orders
      const count = await this.constructor.countDocuments();
      
      // Generate unique order number with timestamp and count
      const timestamp = Date.now();
      const orderCount = count + 1;
      
      // Format: ORD-TIMESTAMP-COUNT (e.g., ORD-1729753200000-1)
      this.orderNumber = `ORD-${timestamp}-${orderCount}`;
      
      console.log('✅ Generated order number:', this.orderNumber);
    } catch (error) {
      console.error('❌ Error generating order number:', error);
      // Fallback: use just timestamp if count fails
      this.orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    }
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);