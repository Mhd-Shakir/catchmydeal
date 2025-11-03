const razorpay = require('../config/razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');

// @desc    Create Razorpay order
// @route   POST /api/payment/create-order
// @access  Private
exports.createRazorpayOrder = async (req, res, next) => {
  try {
    const { amount, currency = 'INR' } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
    }

    const options = {
      amount: Math.round(amount * 100), // Razorpay expects amount in paise
      currency,
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID
      }
    });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    next(error);
  }
};

// @desc    Verify Razorpay payment
// @route   POST /api/payment/verify
// @access  Private
exports.verifyRazorpayPayment = async (req, res, next) => {
  try {
    const { 
      razorpayOrderId, 
      razorpayPaymentId, 
      razorpaySignature,
      orderId 
    } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: 'Missing payment verification data'
      });
    }

    // Verify signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (generatedSignature !== razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }

    // Update order if orderId is provided
    if (orderId) {
      const order = await Order.findById(orderId);
      
      if (order) {
        order.paymentStatus = 'paid';
        order.isPaid = true;
        order.paidAt = Date.now();
        order.paymentInfo = {
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature
        };
        order.statusHistory.push({
          status: 'paid',
          note: 'Payment successful'
        });
        
        await order.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully'
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    next(error);
  }
};

// @desc    Get payment status
// @route   GET /api/payment/:paymentId
// @access  Private
exports.getPaymentStatus = async (req, res, next) => {
  try {
    const { paymentId } = req.params;

    const payment = await razorpay.payments.fetch(paymentId);

    res.status(200).json({
      success: true,
      data: {
        id: payment.id,
        amount: payment.amount / 100,
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        createdAt: payment.created_at
      }
    });
  } catch (error) {
    console.error('Payment status error:', error);
    next(error);
  }
};

// @desc    Refund payment
// @route   POST /api/payment/refund
// @access  Private/Admin
exports.refundPayment = async (req, res, next) => {
  try {
    const { paymentId, amount, orderId } = req.body;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID is required'
      });
    }

    const refundData = {
      payment_id: paymentId
    };

    if (amount) {
      refundData.amount = Math.round(amount * 100);
    }

    const refund = await razorpay.payments.refund(paymentId, refundData);

    // Update order if orderId is provided
    if (orderId) {
      const order = await Order.findById(orderId);
      
      if (order) {
        order.paymentStatus = 'refunded';
        order.orderStatus = 'refunded';
        order.statusHistory.push({
          status: 'refunded',
          note: 'Payment refunded'
        });
        
        await order.save();
      }
    }

    res.status(200).json({
      success: true,
      data: {
        refundId: refund.id,
        amount: refund.amount / 100,
        status: refund.status
      }
    });
  } catch (error) {
    console.error('Refund error:', error);
    next(error);
  }
};