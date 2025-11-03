const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');
const { validateOrderData } = require('../utils/validators');
const { sendOrderConfirmationEmail, sendOrderStatusEmail } = require('../utils/emailService');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res, next) => {
  try {
    console.log('🔥 Order creation request:', {
      userId: req.user.id,
      itemsCount: req.body.items?.length,
      paymentMethod: req.body.paymentMethod,
      items: JSON.stringify(req.body.items, null, 2)
    });

    const { items, shippingAddress, paymentMethod, paymentInfo } = req.body;

    // Basic validation
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one item'
      });
    }

    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        message: 'Shipping address is required'
      });
    }

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Payment method is required'
      });
    }

    // Validate order data using validator
    const validation = validateOrderData(req.body);
    if (!validation.isValid) {
      console.error('❌ Validation error:', validation.errors);
      return res.status(400).json({
        success: false,
        message: validation.errors[0]
      });
    }

    // Verify stock and build order items
    let itemsPrice = 0;
    const orderItems = [];

    for (const item of items) {
      console.log('🔍 Processing item:', JSON.stringify(item, null, 2));

      const product = await Product.findById(item.product);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.product}`
        });
      }

      if (!product.isActive) {
        return res.status(400).json({
          success: false,
          message: `Product "${product.name}" is not available`
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}`
        });
      }

      // ✅ FIX: Build order item with image as STRING (just URL)
      // The Order model expects image to be a String, not an object
      let imageUrl = '';
      if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        // Get the URL from the first image
        imageUrl = product.images[0].url || '';
      }

      const orderItem = {
        product: product._id,
        name: product.name,
        image: imageUrl, // ✅ Just the URL string
        price: product.price,
        quantity: item.quantity,
        size: item.size || '',
        color: item.color || ''
      };

      console.log('✅ Order item built:', JSON.stringify(orderItem, null, 2));

      orderItems.push(orderItem);
      itemsPrice += product.price * item.quantity;

      // Reduce product stock
      product.stock -= item.quantity;
      await product.save();

      console.log('✅ Item processed:', {
        name: product.name,
        quantity: item.quantity,
        newStock: product.stock
      });
    }

    // Calculate prices
    const taxPrice = Math.round(itemsPrice * 0.18); // 18% GST
    const shippingPrice = itemsPrice > 500 ? 0 : 50;
    const totalPrice = itemsPrice + taxPrice + shippingPrice;

    console.log('💰 Price calculation:', {
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice
    });

    // Validate and clean shipping address
    const validatedAddress = {
      fullName: shippingAddress.fullName?.trim() || '',
      phone: shippingAddress.phone?.trim() || '',
      addressLine1: shippingAddress.addressLine1?.trim() || '',
      addressLine2: shippingAddress.addressLine2?.trim() || '',
      city: shippingAddress.city?.trim() || '',
      state: shippingAddress.state?.trim() || '',
      zipCode: shippingAddress.zipCode?.trim() || '',
      country: shippingAddress.country?.trim() || 'India'
    };

    console.log('📦 Creating order with data:', {
      user: req.user.id,
      itemsCount: orderItems.length,
      shippingAddress: validatedAddress,
      paymentMethod,
      totalPrice
    });

    // Create order
    const order = await Order.create({
      user: req.user.id,
      items: orderItems,
      shippingAddress: validatedAddress,
      paymentMethod,
      paymentInfo: paymentInfo || {},
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
      isPaid: false,
      orderStatus: 'pending',
      statusHistory: [{
        status: 'pending',
        note: 'Order created successfully',
        timestamp: new Date()
      }]
    });

    console.log('✅ Order created:', {
      orderId: order._id,
      orderNumber: order.orderNumber
    });

    // Populate order with user details
    await order.populate('user', 'name email phone');

    // Send confirmation email (non-blocking)
    try {
      const user = await User.findById(req.user.id);
      if (user && user.email) {
        sendOrderConfirmationEmail(user, order).catch(err => 
          console.error('📧 Order confirmation email error:', err.message)
        );
      }
    } catch (emailError) {
      console.error('📧 Email error:', emailError.message);
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });

  } catch (error) {
    console.error('❌ Order creation error:', error);
    console.error('❌ Error stack:', error.stack);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    // Handle duplicate order number
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Order creation failed. Please try again.'
      });
    }

    next(error);
  }
};

// @desc    Get user orders
// @route   GET /api/orders
// @access  Private
const getMyOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query = { user: req.user.id };
    if (status) {
      query.orderStatus = status;
    }

    const orders = await Order.find(query)
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('items.product', 'name images')
      .lean();

    const count = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(count / limit),
        totalOrders: count
      }
    });
  } catch (error) {
    console.error('❌ Get orders error:', error);
    next(error);
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
const getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('items.product', 'name images');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user owns the order or is admin
    if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this order'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('❌ Get order error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    next(error);
  }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user owns the order
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order'
      });
    }

    // Check if order can be cancelled
    if (['delivered', 'cancelled', 'refunded'].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled. Current status: ${order.orderStatus}`
      });
    }

    // Restore product stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: item.quantity } },
        { new: true }
      );
    }

    order.orderStatus = 'cancelled';
    order.cancelledAt = Date.now();
    order.cancellationReason = reason || 'Cancelled by user';
    order.statusHistory.push({
      status: 'cancelled',
      note: reason || 'Cancelled by user',
      timestamp: new Date()
    });

    await order.save();

    console.log('✅ Order cancelled:', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      reason
    });

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });
  } catch (error) {
    console.error('❌ Cancel order error:', error);
    next(error);
  }
};

// @desc    Get user order statistics
// @route   GET /api/orders/user-stats
// @access  Private
const getUserOrderStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get all orders for the user
    const orders = await Order.find({ user: userId });

    // Calculate statistics
    const stats = {
      totalOrders: orders.length,
      pendingOrders: orders.filter(order => 
        ['pending', 'processing', 'shipped'].includes(order.orderStatus)
      ).length,
      completedOrders: orders.filter(order => 
        order.orderStatus === 'delivered'
      ).length,
      totalSpent: orders.reduce((sum, order) => 
        order.orderStatus !== 'cancelled' ? sum + order.totalPrice : sum, 
        0
      )
    };

    res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('❌ Get user order stats error:', error);
    next(error);
  }
};

// @desc    Update order status (Admin only)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, note, trackingNumber, courierService } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.orderStatus = status;
    
    if (status === 'delivered') {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
      order.isPaid = true;
      order.paidAt = order.paidAt || Date.now();
      order.paymentStatus = 'paid';
    }

    if (status === 'shipped' && trackingNumber) {
      order.trackingNumber = trackingNumber;
      if (courierService) {
        order.courierService = courierService;
      }
    }

    order.statusHistory.push({
      status,
      note: note || `Order ${status}`,
      timestamp: new Date()
    });

    await order.save();

    console.log('✅ Order status updated:', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      newStatus: status
    });

    // Send status update email
    try {
      const user = await User.findById(order.user);
      if (user && user.email) {
        sendOrderStatusEmail(user, order).catch(err =>
          console.error('📧 Status email error:', err.message)
        );
      }
    } catch (emailError) {
      console.error('📧 Email error:', emailError.message);
    }

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });
  } catch (error) {
    console.error('❌ Update status error:', error);
    next(error);
  }
};

// @desc    Update payment status
// @route   PUT /api/orders/:id/payment
// @access  Private
const updatePaymentStatus = async (req, res, next) => {
  try {
    const { 
      razorpayOrderId, 
      razorpayPaymentId, 
      razorpaySignature,
      transactionId 
    } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user owns the order
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this order'
      });
    }

    // Update payment info
    order.paymentInfo = {
      razorpayOrderId: razorpayOrderId || order.paymentInfo?.razorpayOrderId,
      razorpayPaymentId: razorpayPaymentId || order.paymentInfo?.razorpayPaymentId,
      razorpaySignature: razorpaySignature || order.paymentInfo?.razorpaySignature,
      transactionId: transactionId || order.paymentInfo?.transactionId
    };

    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentStatus = 'paid';
    order.orderStatus = 'processing';

    order.statusHistory.push({
      status: 'processing',
      note: 'Payment received, order is being processed',
      timestamp: new Date()
    });

    await order.save();

    console.log('✅ Payment updated:', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      paymentId: razorpayPaymentId
    });

    res.status(200).json({
      success: true,
      message: 'Payment status updated successfully',
      data: order
    });
  } catch (error) {
    console.error('❌ Update payment error:', error);
    next(error);
  }
};

// @desc    Get all orders (Admin only)
// @route   GET /api/admin/orders
// @access  Private/Admin
const getAllOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, startDate, endDate } = req.query;

    const query = {};
    
    if (status) {
      query.orderStatus = status;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const orders = await Order.find(query)
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('user', 'name email phone')
      .populate('items.product', 'name images')
      .lean();

    const count = await Order.countDocuments(query);

    // Calculate statistics
    const stats = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalPrice' },
          totalOrders: { $sum: 1 },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ['$orderStatus', 'pending'] }, 1, 0] }
          },
          processingOrders: {
            $sum: { $cond: [{ $eq: ['$orderStatus', 'processing'] }, 1, 0] }
          },
          shippedOrders: {
            $sum: { $cond: [{ $eq: ['$orderStatus', 'shipped'] }, 1, 0] }
          },
          deliveredOrders: {
            $sum: { $cond: [{ $eq: ['$orderStatus', 'delivered'] }, 1, 0] }
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ['$orderStatus', 'cancelled'] }, 1, 0] }
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(count / limit),
        totalOrders: count
      },
      statistics: stats.length > 0 ? stats[0] : {
        totalRevenue: 0,
        totalOrders: 0,
        pendingOrders: 0,
        processingOrders: 0,
        shippedOrders: 0,
        deliveredOrders: 0,
        cancelledOrders: 0
      }
    });
  } catch (error) {
    console.error('❌ Get all orders error:', error);
    next(error);
  }
};

// @desc    Get order statistics (Admin only)
// @route   GET /api/admin/orders/stats
// @access  Private/Admin
const getOrderStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

    const [todayStats, monthStats, lastMonthStats, totalStats] = await Promise.all([
      // Today's stats
      Order.aggregate([
        { $match: { createdAt: { $gte: today } } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            revenue: { $sum: '$totalPrice' }
          }
        }
      ]),
      // This month's stats
      Order.aggregate([
        { $match: { createdAt: { $gte: thisMonth } } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            revenue: { $sum: '$totalPrice' }
          }
        }
      ]),
      // Last month's stats
      Order.aggregate([
        { 
          $match: { 
            createdAt: { 
              $gte: lastMonth,
              $lt: thisMonth
            } 
          } 
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            revenue: { $sum: '$totalPrice' }
          }
        }
      ]),
      // Total stats
      Order.aggregate([
        {
          $group: {
            _id: '$orderStatus',
            count: { $sum: 1 },
            revenue: { $sum: '$totalPrice' }
          }
        }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        today: todayStats[0] || { count: 0, revenue: 0 },
        thisMonth: monthStats[0] || { count: 0, revenue: 0 },
        lastMonth: lastMonthStats[0] || { count: 0, revenue: 0 },
        byStatus: totalStats
      }
    });
  } catch (error) {
    console.error('❌ Get order stats error:', error);
    next(error);
  }
};

// Export all functions properly
module.exports = {
  createOrder,
  getMyOrders,
  getOrder,
  cancelOrder,
  getUserOrderStats,
  updateOrderStatus,
  updatePaymentStatus,
  getAllOrders,
  getOrderStats
};