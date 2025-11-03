import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getCart, updateCartItem, removeFromCart, syncCart } from '../redux/slices/cartSlice';
import { FaTrash, FaMinus, FaPlus, FaShoppingCart, FaArrowRight } from 'react-icons/fa';
import toast from 'react-hot-toast';

const Cart = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items: serverItems, totalPrice: serverTotal, loading } = useSelector((state) => state.cart);
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  const [guestCart, setGuestCart] = useState([]);

  // Load guest cart from localStorage
  useEffect(() => {
    if (!isAuthenticated) {
      const stored = JSON.parse(localStorage.getItem('guestCart') || '[]');
      setGuestCart(stored);
    }
  }, [isAuthenticated]);

  // Fetch server cart for authenticated users
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(getCart());
      
      // Sync guest cart if exists
      const guestCartData = JSON.parse(localStorage.getItem('guestCart') || '[]');
      if (guestCartData.length > 0) {
        dispatch(syncCart({ 
          guestCartItems: guestCartData.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            selectedVariant: item.selectedVariant
          }))
        }));
        localStorage.removeItem('guestCart');
        
        // Show sync notification
        toast.success(
          <div>
            <strong>🔄 Cart Synced!</strong>
            <br />
            <span style={{ fontSize: '14px' }}>Your items have been merged</span>
          </div>,
          { duration: 3000 }
        );
      }
    }
  }, [dispatch, isAuthenticated]);

  // Use guest cart or server cart
  const items = isAuthenticated ? serverItems : guestCart;

  // Remove duplicate cart items
  const uniqueItems = items.reduce((acc, item) => {
    const productId = item.product?._id || item.productId;
    const existingIndex = acc.findIndex(i => (i.product?._id || i.productId) === productId);
    
    if (existingIndex === -1) {
      acc.push({ ...item });
    } else {
      const existingItem = acc[existingIndex];
      acc[existingIndex] = {
        ...existingItem,
        quantity: (existingItem.quantity || 1) + (item.quantity || 1)
      };
    }
    
    return acc;
  }, []);

  const displayItems = uniqueItems.length > 0 ? uniqueItems : items;

  const handleUpdateQuantity = (itemId, productId, newQuantity, productName, maxStock) => {
    if (newQuantity < 1) return;

    // Check if exceeding stock
    if (newQuantity > maxStock) {
      toast.error(
        <div>
          <strong>⚠️ Stock Limit Reached</strong>
          <br />
          <span style={{ fontSize: '14px' }}>
            Only {maxStock} items available for {productName}
          </span>
        </div>,
        { duration: 4000 }
      );
      return;
    }

    if (isAuthenticated) {
      dispatch(updateCartItem({ itemId, quantity: newQuantity }));
      toast.success('Quantity updated', { duration: 2000 });
    } else {
      // Update guest cart
      const updated = guestCart.map(item => 
        (item.productId === productId) ? { ...item, quantity: newQuantity } : item
      );
      setGuestCart(updated);
      localStorage.setItem('guestCart', JSON.stringify(updated));
      toast.success('Quantity updated', { duration: 2000 });
    }
  };

  const handleRemove = (itemId, productId, productName) => {
    if (isAuthenticated) {
      dispatch(removeFromCart(itemId));
      toast.success(
        <div>
          <strong>🗑️ Removed from Cart</strong>
          <br />
          <span style={{ fontSize: '14px' }}>{productName}</span>
        </div>,
        { duration: 3000 }
      );
    } else {
      // Remove from guest cart
      const updated = guestCart.filter(item => item.productId !== productId);
      setGuestCart(updated);
      localStorage.setItem('guestCart', JSON.stringify(updated));
      toast.success(
        <div>
          <strong>🗑️ Removed from Cart</strong>
          <br />
          <span style={{ fontSize: '14px' }}>{productName}</span>
        </div>,
        { duration: 3000 }
      );
    }
  };

  const handleCheckout = () => {
    if (displayItems.length === 0) {
      toast.error('Cart is empty. Add items to proceed!');
      return;
    }
    
    if (!isAuthenticated) {
      // Store cart for after login
      sessionStorage.setItem('checkoutData', JSON.stringify({
        selectedItems: displayItems.map(item => ({
          _id: item._id || `guest-${item.productId}`,
          product: item.product,
          price: item.price,
          quantity: item.quantity,
          name: item.product?.name,
          image: item.product?.images?.[0]?.url
        })),
        isBuyNow: false
      }));
      
      toast.loading('Redirecting to checkout...', { duration: 1000 });
      
      setTimeout(() => {
        navigate('/checkout', {
          state: {
            selectedItems: displayItems.map(item => ({
              _id: item._id || `guest-${item.productId}`,
              product: item.product,
              price: item.price,
              quantity: item.quantity,
              name: item.product?.name,
              image: item.product?.images?.[0]?.url
            })),
            isBuyNow: false
          }
        });
      }, 1000);
      return;
    }
    
    // Show loading toast
    toast.loading('Preparing checkout...', { duration: 1000 });
    
    // Navigate to checkout with ALL cart items properly formatted
    setTimeout(() => {
      navigate('/checkout', {
        state: {
          selectedItems: displayItems.map(item => ({
            _id: item._id,
            product: item.product,
            price: item.price,
            quantity: item.quantity,
            name: item.product?.name,
            image: item.product?.images?.[0]?.url
          })),
          isBuyNow: false
        }
      });
    }, 1000);
  };

  // Calculate totals
  const totalPrice = displayItems.reduce((sum, item) => {
    const price = item.price || item.product?.price || 0;
    return sum + (price * item.quantity);
  }, 0);

  const shippingCost = totalPrice > 500 ? 0 : 50;
  const discount = Math.round(totalPrice * 0.1);
  const finalTotal = totalPrice + shippingCost - discount;

  if (loading && isAuthenticated) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black">
        <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (displayItems.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full text-center">
          <FaShoppingCart className="w-24 h-24 mx-auto text-gray-700 mb-6" />
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">Your cart is empty</h2>
          <p className="text-gray-400 mb-8 text-base sm:text-lg">Start shopping to add items to your cart</p>
          {!isAuthenticated && (
            <p className="text-gray-500 mb-6 text-sm">
              💡 Tip: Login to sync your cart across devices
            </p>
          )}
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 bg-white text-black px-8 py-4 font-bold hover:bg-gray-200 transition-colors uppercase tracking-wide"
          >
            Start Shopping
            <FaArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-2 uppercase tracking-tight">
            Your Cart
          </h1>
          <div className="flex items-center justify-between">
            <p className="text-gray-400 text-sm sm:text-base">
              {displayItems.length} {displayItems.length === 1 ? 'item' : 'items'} in your cart
            </p>
            {!isAuthenticated && (
              <Link 
                to="/login"
                state={{ from: '/cart', message: 'Login to save your cart' }}
                className="text-sm text-gray-400 hover:text-white underline"
              >
                Login to save cart
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Cart Items Table */}
          <div className="lg:col-span-8">
            {/* Desktop Table Header */}
            <div className="hidden md:grid md:grid-cols-12 gap-4 pb-4 border-b-2 border-white mb-6">
              <div className="col-span-6 text-left">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">Product</h3>
              </div>
              <div className="col-span-3 text-center">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">Quantity</h3>
              </div>
              <div className="col-span-3 text-right">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">Total</h3>
              </div>
            </div>

            {/* Cart Items */}
            <div className="space-y-6">
              {displayItems.map((item, index) => {
                const product = item.product;
                const itemId = item._id;
                const productId = product?._id || item.productId;
                const price = item.price || product?.price || 0;
                const productName = product?.name || 'Product';
                const maxStock = product?.stock || 10;
                
                return (
                  <div
                    key={itemId || productId}
                    className={`${index !== displayItems.length - 1 ? 'pb-6 border-b border-gray-800' : ''}`}
                  >
                    {/* Mobile Layout */}
                    <div className="md:hidden space-y-4">
                      <div className="flex gap-4">
                        <Link 
                          to={`/products/${productId}`}
                          className="flex-shrink-0 w-24 h-32 sm:w-32 sm:h-40 bg-gray-900 overflow-hidden"
                        >
                          <img
                            src={product?.images?.[0]?.url || '/placeholder.jpg'}
                            alt={productName}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </Link>
                        
                        <div className="flex-1 min-w-0">
                          <Link
                            to={`/products/${productId}`}
                            className="font-bold text-base sm:text-lg text-white hover:underline block mb-1"
                          >
                            {productName}
                          </Link>
                          
                          <p className="text-sm text-gray-400 mb-2">
                            {product?.category} / {product?.size || 'M'}
                          </p>

                          <p className="text-base font-semibold text-white mb-2">
                            Rs. {price.toLocaleString('en-IN')}.00
                          </p>

                          <button
                            onClick={() => handleRemove(itemId, productId, productName)}
                            className="text-sm text-gray-400 hover:text-white font-medium underline"
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center border-2 border-white">
                          <button
                            onClick={() => handleUpdateQuantity(itemId, productId, item.quantity - 1, productName, maxStock)}
                            disabled={item.quantity <= 1}
                            className="w-10 h-10 flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors disabled:opacity-30 outline-none focus:outline-none"
                          >
                            <FaMinus className="w-3 h-3" />
                          </button>
                          <span className="w-12 text-center font-bold text-base text-white h-10 flex items-center justify-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQuantity(itemId, productId, item.quantity + 1, productName, maxStock)}
                            disabled={item.quantity >= maxStock}
                            className="w-10 h-10 flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors disabled:opacity-30 outline-none focus:outline-none"
                          >
                            <FaPlus className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="text-right">
                          <p className="text-xl sm:text-2xl font-bold text-white">
                            Rs. {(price * item.quantity).toLocaleString('en-IN')}.00
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden md:grid md:grid-cols-12 gap-4 items-center">
                      {/* Product Info */}
                      <div className="col-span-6 flex gap-4 items-center">
                        <Link 
                          to={`/products/${productId}`}
                          className="flex-shrink-0 w-24 h-32 lg:w-32 lg:h-40 bg-gray-900 overflow-hidden"
                        >
                          <img
                            src={product?.images?.[0]?.url || '/placeholder.jpg'}
                            alt={productName}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </Link>
                        
                        <div className="flex-1 min-w-0">
                          <Link
                            to={`/products/${productId}`}
                            className="font-bold text-lg lg:text-xl text-white hover:underline block mb-2"
                          >
                            {productName}
                          </Link>
                          
                          <p className="text-sm text-gray-400 mb-2">
                            {product?.category} / {product?.size || 'M'}
                          </p>

                          <p className="text-base font-semibold text-white mb-3">
                            Rs. {price.toLocaleString('en-IN')}.00 each
                          </p>

                          <button
                            onClick={() => handleRemove(itemId, productId, productName)}
                            className="text-sm text-gray-400 hover:text-white font-medium underline"
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      {/* Quantity */}
                      <div className="col-span-3 flex justify-center">
                        <div className="flex items-center border-2 border-white">
                          <button
                            onClick={() => handleUpdateQuantity(itemId, productId, item.quantity - 1, productName, maxStock)}
                            disabled={item.quantity <= 1}
                            className="w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors disabled:opacity-30 outline-none focus:outline-none"
                          >
                            <FaMinus className="w-3 h-3" />
                          </button>
                          <span className="w-12 lg:w-16 text-center font-bold text-base text-white lg:text-lg h-10 lg:h-12 flex items-center justify-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQuantity(itemId, productId, item.quantity + 1, productName, maxStock)}
                            disabled={item.quantity >= maxStock}
                            className="w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors disabled:opacity-30 outline-none focus:outline-none"
                          >
                            <FaPlus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Total */}
                      <div className="col-span-3 text-right">
                        <p className="text-xl lg:text-2xl font-bold text-white">
                          Rs. {(price * item.quantity).toLocaleString('en-IN')}.00
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-4">
            <div className="bg-gray-950 border-2 border-white p-6 lg:p-8 lg:sticky lg:top-8">
              <h2 className="text-2xl lg:text-3xl font-bold mb-6 text-white uppercase">
                Summary
              </h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-base lg:text-lg">
                  <span className="text-gray-300">Subtotal</span>
                  <span className="font-bold text-white">Rs. {totalPrice.toLocaleString('en-IN')}.00</span>
                </div>

                <div className="flex justify-between text-base lg:text-lg">
                  <span className="text-gray-300">Discount (10%)</span>
                  <span className="font-bold text-green-400">- Rs. {discount.toLocaleString('en-IN')}.00</span>
                </div>

                <div className="flex justify-between text-base lg:text-lg">
                  <span className="text-gray-300">Delivery</span>
                  <span className="font-bold text-white">
                    {shippingCost === 0 ? (
                      <span className="text-green-400">FREE</span>
                    ) : (
                      `Rs. ${shippingCost}.00`
                    )}
                  </span>
                </div>

                <div className="border-t-2 border-white pt-4 flex justify-between items-center">
                  <span className="text-xl lg:text-2xl font-bold text-white uppercase">Total</span>
                  <span className="text-2xl lg:text-3xl font-bold text-white">
                    Rs. {finalTotal.toLocaleString('en-IN')}.00
                  </span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full bg-white text-black py-4 font-bold text-lg hover:bg-gray-200 transition-colors mb-4 uppercase tracking-wide outline-none focus:outline-none"
              >
                Proceed to Checkout
              </button>

              <Link
                to="/shop"
                className="block text-center text-white hover:underline font-semibold text-base uppercase tracking-wide"
              >
                Continue Shopping
              </Link>

              {shippingCost > 0 && totalPrice < 500 && (
                <div className="mt-6 pt-6 border-t-2 border-gray-700">
                  <p className="text-sm text-gray-300 font-medium">
                    Add <span className="font-bold text-white">Rs. {(500 - totalPrice).toFixed(0)}.00</span> more to get FREE shipping!
                  </p>
                </div>
              )}
              
              {!isAuthenticated && (
                <div className="mt-6 pt-6 border-t-2 border-gray-700">
                  <p className="text-xs text-gray-400 text-center">
                    🔐 Login required to complete checkout
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;