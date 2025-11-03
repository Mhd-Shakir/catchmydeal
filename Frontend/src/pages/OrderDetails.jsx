// frontend/src/pages/OrderDetails.jsx
import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getOrderById } from '../redux/slices/orderSlice';
import { motion } from 'framer-motion';
import { Package, Truck, CheckCircle, XCircle, Clock, ArrowLeft, MapPin, CreditCard, Calendar } from 'lucide-react';

const OrderDetails = () => {
  const { id } = useParams(); // Changed from orderId to id to match route
  const dispatch = useDispatch();
  const { currentOrder: order, loading, error } = useSelector((state) => state.orders);
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (id && isAuthenticated) {
      dispatch(getOrderById(id));
    }
  }, [dispatch, id, isAuthenticated]);

  // Auto-refresh every 10 seconds when viewing order details
  useEffect(() => {
    if (!id || !isAuthenticated) return;
    
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing order details...');
      dispatch(getOrderById(id));
    }, 10000); // 10 seconds - faster refresh for details page
    
    return () => clearInterval(interval);
  }, [dispatch, id, isAuthenticated]);

  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-400/10',
        borderColor: 'border-yellow-400',
        icon: Clock,
        label: 'Pending'
      },
      confirmed: {
        color: 'text-blue-400',
        bgColor: 'bg-blue-400/10',
        borderColor: 'border-blue-400',
        icon: CheckCircle,
        label: 'Confirmed'
      },
      processing: {
        color: 'text-purple-400',
        bgColor: 'bg-purple-400/10',
        borderColor: 'border-purple-400',
        icon: Package,
        label: 'Processing'
      },
      shipped: {
        color: 'text-indigo-400',
        bgColor: 'bg-indigo-400/10',
        borderColor: 'border-indigo-400',
        icon: Truck,
        label: 'Shipped'
      },
      delivered: {
        color: 'text-green-400',
        bgColor: 'bg-green-400/10',
        borderColor: 'border-green-400',
        icon: CheckCircle,
        label: 'Delivered'
      },
      cancelled: {
        color: 'text-red-400',
        bgColor: 'bg-red-400/10',
        borderColor: 'border-red-400',
        icon: XCircle,
        label: 'Cancelled'
      },
    };
    return configs[status] || configs.pending;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please Login</h2>
          <p className="text-gray-400 mb-6">You need to login to view order details.</p>
          <Link
            to="/login"
            className="inline-block bg-white text-black px-6 py-3 font-bold hover:bg-gray-200 transition-colors uppercase"
          >
            Login
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black">
        <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Error Loading Order</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <Link
            to="/orders"
            className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 font-bold hover:bg-gray-200 transition-colors uppercase"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Order Not Found</h2>
          <Link
            to="/orders"
            className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 font-bold hover:bg-gray-200 transition-colors uppercase"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(order.orderStatus);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Back Button */}
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="uppercase tracking-wide text-sm">Back to Orders</span>
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold uppercase tracking-tight mb-2">
                Order #{order.orderNumber || order._id.slice(-8).toUpperCase()}
              </h1>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Calendar className="w-4 h-4" />
                <span>
                  Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>

            {/* Status Badge */}
            <div className={`inline-flex items-center gap-3 px-6 py-3 border-2 ${statusConfig.borderColor} ${statusConfig.bgColor}`}>
              <StatusIcon className={`w-5 h-5 ${statusConfig.color}`} />
              <span className={`font-bold uppercase tracking-wider ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
            </div>
          </div>
          <div className="w-full h-px bg-gray-800"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Order Items */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border-2 border-white"
            >
              <div className="bg-white text-black px-6 py-4">
                <h2 className="text-xl font-bold uppercase tracking-wide">Order Items</h2>
              </div>
              <div className="p-6 space-y-4">
                {order.items?.map((item, index) => (
                  <div
                    key={item._id || index}
                    className="flex gap-4 pb-4 border-b-2 border-gray-800 last:border-0"
                  >
                    <div className="w-24 h-24 border-2 border-white bg-gray-900 flex-shrink-0 overflow-hidden">
                      <img
                        src={item.image || item.product?.images?.[0]?.url || '/placeholder.jpg'}
                        alt={item.name || 'Product'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1">{item.name || item.product?.name}</h3>
                      <p className="text-sm text-gray-400 mb-2">Quantity: {item.quantity}</p>
                      <p className="font-bold text-lg">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Shipping Address */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="border-2 border-white"
            >
              <div className="bg-white text-black px-6 py-4 flex items-center gap-3">
                <MapPin className="w-5 h-5" />
                <h2 className="text-xl font-bold uppercase tracking-wide">Shipping Address</h2>
              </div>
              <div className="p-6">
                <p className="text-lg font-bold mb-2">{order.shippingAddress?.fullName}</p>
                <p className="text-gray-400 leading-relaxed">
                  {order.shippingAddress?.phone}<br />
                  {order.shippingAddress?.addressLine1}<br />
                  {order.shippingAddress?.addressLine2 && (
                    <>{order.shippingAddress.addressLine2}<br /></>
                  )}
                  {order.shippingAddress?.city}, {order.shippingAddress?.state}<br />
                  {order.shippingAddress?.pincode}
                </p>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="border-2 border-white bg-gray-950"
            >
              <div className="bg-white text-black px-6 py-4">
                <h2 className="text-xl font-bold uppercase tracking-wide">Order Summary</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="font-semibold">
                    ₹{(order.pricing?.subtotal || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Shipping</span>
                  <span className="font-semibold">
                    {order.pricing?.shipping === 0 || order.pricing?.shippingCharges === 0
                      ? 'FREE' 
                      : `₹${(order.pricing?.shipping || order.pricing?.shippingCharges || 0).toLocaleString('en-IN')}`
                    }
                  </span>
                </div>
                {order.pricing?.tax > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tax</span>
                    <span className="font-semibold">
                      ₹{(order.pricing?.tax || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
                <div className="border-t-2 border-gray-800 pt-4">
                  <div className="flex justify-between text-xl">
                    <span className="font-bold">Total</span>
                    <span className="font-bold">
                      ₹{(order.pricing?.total || order.totalAmount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Payment Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="border-2 border-white"
            >
              <div className="bg-white text-black px-6 py-4 flex items-center gap-3">
                <CreditCard className="w-5 h-5" />
                <h2 className="text-xl font-bold uppercase tracking-wide">Payment</h2>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-400 mb-2 uppercase tracking-wide">Payment Method</p>
                <p className="text-lg font-bold uppercase">
                  {order.paymentInfo?.method === 'cod' ? 'Cash on Delivery' : order.paymentInfo?.method}
                </p>
                <p className="text-sm text-gray-400 mt-4 uppercase tracking-wide">Payment Status</p>
                <p className={`text-lg font-bold uppercase ${
                  order.paymentInfo?.status === 'paid' || order.paymentInfo?.paymentStatus === 'completed'
                    ? 'text-green-400' 
                    : 'text-yellow-400'
                }`}>
                  {order.paymentInfo?.status || order.paymentInfo?.paymentStatus || 'Pending'}
                </p>
              </div>
            </motion.div>

            {/* Order Timeline */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="border-2 border-white"
            >
              <div className="bg-white text-black px-6 py-4">
                <h2 className="text-xl font-bold uppercase tracking-wide">Order Timeline</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full border-2 ${statusConfig.borderColor} ${statusConfig.bgColor} flex items-center justify-center flex-shrink-0`}>
                    <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
                  </div>
                  <div>
                    <p className="font-bold">{statusConfig.label}</p>
                    <p className="text-sm text-gray-400">
                      {new Date(order.updatedAt).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;