// frontend/src/pages/Orders.jsx
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getUserOrders } from '../redux/slices/orderSlice';
import { motion } from 'framer-motion';
import { Package, Truck, CheckCircle, XCircle, Clock, ShoppingBag, ArrowRight, Calendar } from 'lucide-react';

const Orders = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { orders, loading, error } = useSelector((state) => state.orders);
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(getUserOrders());
    }
  }, [dispatch, isAuthenticated]);

  // Auto-refresh orders every 30 seconds to see admin updates
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing orders...');
      dispatch(getUserOrders());
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, [dispatch, isAuthenticated]);

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
          <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold mb-4">Please Login</h2>
          <p className="text-gray-400 mb-6">You need to login to view your orders.</p>
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
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="text-center">
          <XCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h2 className="text-2xl font-bold mb-4">Error Loading Orders</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => dispatch(getUserOrders())}
            className="bg-white text-black px-6 py-3 font-bold hover:bg-gray-200 transition-colors uppercase"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold uppercase tracking-tight mb-2">
            My Orders
          </h1>
          <p className="text-gray-400">Track and manage your orders</p>
        </div>

        {/* Orders List */}
        {!orders || orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <ShoppingBag className="w-24 h-24 mx-auto mb-6 text-gray-600" />
            <h2 className="text-2xl font-bold mb-4">No Orders Yet</h2>
            <p className="text-gray-400 mb-8">Start shopping to see your orders here</p>
            <Link
              to="/shop"
              className="inline-block bg-white text-black px-8 py-3 font-bold hover:bg-gray-200 transition-colors uppercase"
            >
              Start Shopping
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {orders.map((order, index) => {
              const statusConfig = getStatusConfig(order.orderStatus);
              const StatusIcon = statusConfig.icon;

              return (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-2 border-white bg-black hover:bg-gray-950 transition-colors cursor-pointer"
                  onClick={() => navigate(`/orders/${order._id}`)}
                >
                  {/* Order Header */}
                  <div className="border-b-2 border-white p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="text-xl font-bold uppercase">
                            Order #{order.orderNumber || order._id.slice(-8).toUpperCase()}
                          </h3>
                          <div className={`inline-flex items-center gap-2 px-3 py-1 border ${statusConfig.borderColor} ${statusConfig.bgColor}`}>
                            <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
                            <span className={`text-sm font-bold uppercase ${statusConfig.color}`}>
                              {statusConfig.label}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(order.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-400 uppercase tracking-wide mb-1">Total Amount</p>
                        {/* HERE IS THE FIX:
                          Changed from (order.pricing?.total || order.totalAmount || 0) 
                          to (order.totalPrice || 0)
                        */}
                        <p className="text-2xl font-bold">
                          ₹{(order.totalPrice || 0).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  <div className="p-4 sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3 flex-wrap">
                          {order.items?.slice(0, 3).map((item, idx) => (
                            <div
                              key={idx}
                              className="w-16 h-16 border-2 border-white bg-gray-900 flex-shrink-0 overflow-hidden"
                            >
                              <img
                                src={item.image || item.product?.images?.[0]?.url || '/placeholder.jpg'}
                                alt={item.name || 'Product'}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                          {order.items?.length > 3 && (
                            <div className="w-16 h-16 border-2 border-white bg-gray-900 flex items-center justify-center">
                              <span className="text-sm font-bold">+{order.items.length - 3}</span>
                            </div>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm">
                          {order.items?.length} {order.items?.length === 1 ? 'item' : 'items'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                        <span className="text-sm font-bold uppercase">View Details</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;