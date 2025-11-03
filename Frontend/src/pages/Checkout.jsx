import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { createOrder } from '../redux/slices/orderSlice';
import { clearCart } from '../redux/slices/cartSlice';
// ❌ REMOVED: getCategories import is no longer needed
// import { getCategories } from '../redux/slices/productSlice';
import { FaCheckCircle, FaMapMarkerAlt, FaCreditCard, FaShieldAlt, FaQrcode, FaSpinner } from 'react-icons/fa';
import toast from 'react-hot-toast';
import RazorpayPayment from '../components/payment/RazorpayPayment';

const Checkout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  const { selectedItems: stateItems, isBuyNow } = location.state || {};
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { loading: orderLoading } = useSelector((state) => state.orders);
  
  // ❌ REMOVED: Category state from Redux is no longer needed
  // const { categories = [], loading: categoriesLoading } = useSelector((state) => state.products || {});

  const [currentStep, setCurrentStep] = useState(isAuthenticated ? 2 : 1);
  const [selectedItems, setSelectedItems] = useState(stateItems || []);
  const [createdOrderId, setCreatedOrderId] = useState(null);
  const [createdOrderNumber, setCreatedOrderNumber] = useState(null);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);

  const [shippingAddress, setShippingAddress] = useState({
    fullName: user?.name || '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India'
  });

  // ❌ REMOVED: useEffect for loading categories is no longer needed
  // useEffect(() => {
  //   if (categories.length === 0 && !categoriesLoading) {
  //     dispatch(getCategories());
  //   }
  // }, [dispatch, categoriesLoading]);

  // Load buy now item from sessionStorage if available
  useEffect(() => {
    if (!selectedItems || selectedItems.length === 0) {
      const storedBuyNowItem = sessionStorage.getItem('buyNowItem');
      if (storedBuyNowItem) {
        try {
          const item = JSON.parse(storedBuyNowItem);
          setSelectedItems([item]);
        } catch (error) {
          console.error('Error parsing buy now item:', error);
        }
      }
    }
  }, [selectedItems]);

  // Redirect if no items after a short delay (to allow loading)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!selectedItems || selectedItems.length === 0) {
         const storedBuyNowItem = sessionStorage.getItem('buyNowItem');
         if (!storedBuyNowItem) {
            toast.error('Your cart is empty. Please add items to proceed.');
            navigate('/shop');
         }
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [selectedItems, navigate]);


  // Update user name when authenticated
  useEffect(() => {
    if (isAuthenticated && user?.name) {
      setShippingAddress(prev => ({ ...prev, fullName: user.name }));
    }
  }, [isAuthenticated, user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress({ ...shippingAddress, [name]: value });
  };

  const handleLoginClick = () => {
    sessionStorage.setItem('checkoutData', JSON.stringify({
      selectedItems,
      isBuyNow,
      shippingAddress
    }));

    toast('⚠️ Please login to complete your order', {
      icon: '🔒',
      duration: 3000,
    });

    navigate('/login', {
      state: {
        from: '/checkout',
        message: 'Please login to complete your order'
      }
    });
  };

  const handleAddressSubmit = (e) => {
    e.preventDefault();

    if (!shippingAddress.fullName?.trim()) { return toast.error('Please enter your full name'); }
    if (!shippingAddress.phone?.trim()) { return toast.error('Please enter your phone number'); }
    if (!/^[6-9]\d{9}$/.test(shippingAddress.phone)) { return toast.error('Please enter a valid 10-digit Indian phone number');}
    if (!shippingAddress.addressLine1?.trim()) { return toast.error('Please enter your address'); }
    if (!shippingAddress.city?.trim()) { return toast.error('Please enter your city'); }
    if (!shippingAddress.state?.trim()) { return toast.error('Please enter your state'); }
    if (!shippingAddress.zipCode?.trim()) { return toast.error('Please enter your zipcode'); }
    if (!/^\d{6}$/.test(shippingAddress.zipCode)) { return toast.error('Please enter a valid 6-digit zipcode'); }

    console.log('✅ Shipping address validated:', shippingAddress);
    setCurrentStep(3);
  };

  const handleProceedToPayment = async () => {
    if (!isAuthenticated) {
      toast.error('⚠️ Login Required for Payment', { icon: '🔒', duration: 4000, });
      handleLoginClick();
      return;
    }

    // ❌ REMOVED: Category loading checks are no longer needed
    // if (categoriesLoading) { ... }
    // if (categories.length === 0) { ... }

    let orderData;
    // ❌ REMOVED: hasInvalidCategory flag
    // let hasInvalidCategory = false;

    try {
        orderData = {
          items: selectedItems.map(item => {
            const productObject = item.product || item;
            
            if (!productObject?._id) {
                console.error("Invalid product object in selectedItems:", item);
                throw new Error("Invalid product data in cart.");
            }
            const productId = productObject._id;

            // ✅ FIX: Removed all category lookup logic.
            // The backend's orderController doesn't use this field,
            // and the Order.js model schema has category as `required: false`.
            // This was the source of the "Could not find ID" error.
            
            // ❌ REMOVED: const categoryName = ...
            // ❌ REMOVED: const category = ...
            // ❌ REMOVED: const categoryId = ...
            // ❌ REMOVED: if (!categoryId) { ... }
            
            return {
              product: productId,
              quantity: item.quantity || 1,
              size: item.selectedVariant?.size || item.size || '',
              color: item.selectedVariant?.color || item.color || '',
              // ❌ REMOVED: category: categoryId
            };
          }),
          shippingAddress: {
            fullName: shippingAddress.fullName.trim(),
            phone: shippingAddress.phone.trim(),
            addressLine1: shippingAddress.addressLine1.trim(),
            addressLine2: shippingAddress.addressLine2?.trim() || '',
            city: shippingAddress.city.trim(),
            state: shippingAddress.state.trim(),
            zipCode: shippingAddress.zipCode.trim(),
            country: shippingAddress.country || 'India'
          },
          paymentMethod: 'razorpay',
          paymentInfo: {}
        };

        // ❌ REMOVED: Check for hasInvalidCategory
        // if (hasInvalidCategory) { ... }

    } catch (mapError) {
        console.error("Error preparing order items:", mapError);
        toast.error(mapError.message || "Error processing cart items.");
        return;
    }


    console.log('📤 Sending order data:', JSON.stringify(orderData, null, 2));

    setIsProcessingOrder(true);
    const processingToast = toast.loading('⏳ Creating your order...', { duration: Infinity });

    try {
      const result = await dispatch(createOrder(orderData)).unwrap();
      toast.dismiss(processingToast);

      const order = result.data || result;
      
      if (!order?._id) {
          console.error("Order creation response missing order or _id:", result);
          throw new Error("Order creation failed unexpectedly.");
      }
      const orderNumber = order.orderNumber || order._id?.slice(-8).toUpperCase();

      toast.success(`🎉 Order Created Successfully!\nOrder #${orderNumber}`, { duration: 4000, style: { minWidth: '300px' } });
      setTimeout(() => toast.success('📧 Order confirmation email sent!', { icon: '✉️', duration: 3000 }), 1000);

      setCreatedOrderId(order._id);
      setCreatedOrderNumber(orderNumber);
      setCurrentStep(4);

    } catch (err) {
      toast.dismiss(processingToast);
      console.error('❌ Order creation error:', err);
      const errorMessage = typeof err === 'string' ? err : (err?.message || 'Failed to create order. Please try again.');
      toast.error(`❌ ${errorMessage}`, { duration: 5000 });
    } finally {
      setIsProcessingOrder(false);
    }
  };


  const handlePaymentSuccess = (orderResponse) => {
    toast.success('💳 Payment completed successfully!', {
      icon: '✅',
      duration: 4000,
      style: { background: '#10B981', color: '#fff' },
    });

    sessionStorage.removeItem('buyNowItem');
    sessionStorage.removeItem('checkoutData');

    if (!isBuyNow) {
      dispatch(clearCart());
    }

    setTimeout(() => {
      if (createdOrderId) {
          navigate(`/orders/${createdOrderId}`);
      } else {
          console.error("createdOrderId is missing after payment success. Navigating to orders list.");
          navigate('/orders');
      }
    }, 1000);
  };


  const handlePaymentFailure = (error) => {
    toast.error('❌ Payment failed. Please try again.', {
      duration: 4000,
      style: { background: '#EF4444', color: '#fff' },
    });
    setCreatedOrderId(null);
    setCurrentStep(3);
    console.error('Payment error:', error);
  };

  if ((!selectedItems || selectedItems.length === 0) && !sessionStorage.getItem('buyNowItem')) {
       if (!location.state) return null;
  }


  const subtotal = selectedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const shippingCharges = subtotal > 500 ? 0 : 50;
  const total = subtotal + shippingCharges;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <h1 className="text-3xl sm:text-4xl font-bold mb-8 uppercase tracking-tight">
          {isBuyNow ? 'Express Checkout' : 'Checkout'}
        </h1>

        {/* Step Indicator - 4 Steps */}
        <div className="mb-8 sm:mb-12">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            {/* Step 1: Login */}
            <div className="flex flex-col items-center flex-1">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border-2 mb-2 ${
                currentStep >= 1 ? 'bg-white text-black border-white' : 'border-gray-600 text-gray-600'
              }`}>
                {currentStep > 1 ? <FaCheckCircle className="text-xl" /> : '1'}
              </div>
              <span className="text-xs sm:text-sm font-medium text-center">Login</span>
            </div>

            <div className={`flex-1 h-0.5 mb-6 ${currentStep >= 2 ? 'bg-white' : 'bg-gray-600'}`}></div>

            {/* Step 2: Address */}
            <div className="flex flex-col items-center flex-1">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border-2 mb-2 ${
                currentStep >= 2 ? 'bg-white text-black border-white' : 'border-gray-600 text-gray-600'
              }`}>
                {currentStep > 2 ? <FaCheckCircle className="text-xl" /> : <FaMapMarkerAlt />}
              </div>
              <span className="text-xs sm:text-sm font-medium text-center">Address</span>
            </div>

            <div className={`flex-1 h-0.5 mb-6 ${currentStep >= 3 ? 'bg-white' : 'bg-gray-600'}`}></div>

            {/* Step 3: Review */}
            <div className="flex flex-col items-center flex-1">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border-2 mb-2 ${
                currentStep >= 3 ? 'bg-white text-black border-white' : 'border-gray-600 text-gray-600'
              }`}>
                {currentStep > 3 ? <FaCheckCircle className="text-xl" /> : <FaCreditCard />}
              </div>
              <span className="text-xs sm:text-sm font-medium text-center">Review</span>
            </div>

            <div className={`flex-1 h-0.5 mb-6 ${currentStep >= 4 ? 'bg-white' : 'bg-gray-600'}`}></div>

            {/* Step 4: Payment */}
            <div className="flex flex-col items-center flex-1">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border-2 mb-2 ${
                currentStep >= 4 ? 'bg-white text-black border-white' : 'border-gray-600 text-gray-600'
              }`}>
                <FaQrcode />
              </div>
              <span className="text-xs sm:text-sm font-medium text-center">Payment</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Step 1: Login */}
            {currentStep === 1 && (
              <div className="bg-gray-900 border-2 border-white p-6 sm:p-8">
                <h2 className="text-xl sm:text-2xl font-bold mb-4">Login Required</h2>
                <p className="text-gray-400 mb-6">
                  Please login or create an account to complete your purchase
                </p>
                <div className="space-y-4">
                  <button
                    onClick={handleLoginClick}
                    className="w-full bg-white text-black py-3 sm:py-4 font-bold hover:bg-gray-200 transition uppercase tracking-wide"
                  >
                    Login to Continue
                  </button>
                  <button
                    onClick={() => {
                      sessionStorage.setItem('checkoutData', JSON.stringify({
                        selectedItems,
                        isBuyNow,
                        shippingAddress
                      }));
                      navigate('/register', {
                        state: {
                          from: '/checkout',
                          message: 'Create an account to complete your order'
                        }
                      });
                    }}
                    className="w-full border-2 border-white text-white py-3 sm:py-4 font-bold hover:bg-white hover:text-black transition uppercase tracking-wide"
                  >
                    Create Account
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Shipping Address */}
            {currentStep === 2 && (
              <div className="bg-gray-900 border-2 border-white p-6 sm:p-8">
                <h2 className="text-xl sm:text-2xl font-bold mb-6 flex items-center gap-3">
                  <FaMapMarkerAlt /> Shipping Address
                </h2>
                {isAuthenticated && (
                  <div className="mb-4 p-3 bg-green-900/20 border border-green-600">
                    <p className="text-green-500 text-sm">✓ Logged in as {user?.email}</p>
                  </div>
                )}
                <form onSubmit={handleAddressSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      type="text"
                      name="fullName"
                      value={shippingAddress.fullName}
                      onChange={handleInputChange}
                      placeholder="Full Name *"
                      className="w-full p-3 bg-black border-2 border-gray-700 focus:border-white outline-none text-white"
                      required
                    />
                    <input
                      type="tel"
                      name="phone"
                      value={shippingAddress.phone}
                      onChange={handleInputChange}
                      placeholder="Phone Number (10 digits) *"
                      maxLength="10"
                      className="w-full p-3 bg-black border-2 border-gray-700 focus:border-white outline-none text-white"
                      required
                    />
                  </div>
                  <input
                    type="text"
                    name="addressLine1"
                    value={shippingAddress.addressLine1}
                    onChange={handleInputChange}
                    placeholder="Address Line 1 *"
                    className="w-full p-3 bg-black border-2 border-gray-700 focus:border-white outline-none text-white"
                    required
                  />
                  <input
                    type="text"
                    name="addressLine2"
                    value={shippingAddress.addressLine2}
                    onChange={handleInputChange}
                    placeholder="Address Line 2 (Optional)"
                    className="w-full p-3 bg-black border-2 border-gray-700 focus:border-white outline-none text-white"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <input
                      type="text"
                      name="city"
                      value={shippingAddress.city}
                      onChange={handleInputChange}
                      placeholder="City *"
                      className="w-full p-3 bg-black border-2 border-gray-700 focus:border-white outline-none text-white"
                      required
                    />
                    <input
                      type="text"
                      name="state"
                      value={shippingAddress.state}
                      onChange={handleInputChange}
                      placeholder="State *"
                      className="w-full p-3 bg-black border-2 border-gray-700 focus:border-white outline-none text-white"
                      required
                    />
                    <input
                      type="text"
                      name="zipCode"
                      value={shippingAddress.zipCode}
                      onChange={handleInputChange}
                      placeholder="Zipcode *"
                      maxLength="6"
                      pattern="\d{6}"
                      className="w-full p-3 bg-black border-2 border-gray-700 focus:border-white outline-none text-white"
                      required
                    />
                  </div>
                  <input
                    type="hidden"
                    name="country"
                    value={shippingAddress.country}
                  />
                  <div className="flex gap-4 pt-4">
                    {!isAuthenticated && (
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className="flex-1 border-2 border-white text-white py-3 sm:py-4 font-bold hover:bg-white hover:text-black transition uppercase tracking-wide"
                      >
                        Back
                      </button>
                    )}
                    <button
                      type="submit"
                      className="flex-1 bg-white text-black py-3 sm:py-4 font-bold hover:bg-gray-200 transition uppercase tracking-wide"
                    >
                      Continue to Review
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Step 3: Review Order */}
            {currentStep === 3 && (
              <div className="bg-gray-900 border-2 border-white p-6 sm:p-8">
                <h2 className="text-xl sm:text-2xl font-bold mb-6 flex items-center gap-3">
                  <FaCreditCard /> Review Your Order
                </h2>

                {!isAuthenticated && (
                  <div className="mb-6 p-4 bg-yellow-900/20 border-2 border-yellow-600">
                    <p className="text-yellow-500 text-sm mb-3 font-bold flex items-center gap-2">
                      ⚠️ Login Required for Payment
                    </p>
                    <button
                      onClick={handleLoginClick}
                      className="w-full bg-yellow-600 text-black py-2 font-bold hover:bg-yellow-500 transition"
                    >
                      🔒 Login Now
                    </button>
                  </div>
                )}

                {/* Shipping Details Review */}
                <div className="mb-6 p-4 bg-black border border-white/20">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-lg">Shipping Address</h3>
                    <button
                      onClick={() => setCurrentStep(2)}
                      className="text-sm text-gray-400 hover:text-white underline"
                    >
                      Edit
                    </button>
                  </div>
                  <p className="text-gray-300">{shippingAddress.fullName}</p>
                  <p className="text-gray-300">{shippingAddress.phone}</p>
                  <p className="text-gray-300">{shippingAddress.addressLine1}</p>
                  {shippingAddress.addressLine2 && (
                    <p className="text-gray-300">{shippingAddress.addressLine2}</p>
                  )}
                  <p className="text-gray-300">
                    {shippingAddress.city}, {shippingAddress.state} - {shippingAddress.zipCode}
                  </p>
                  <p className="text-gray-300">{shippingAddress.country}</p>
                </div>

                {/* Order Items Review */}
                <div className="mb-6 p-4 bg-black border border-white/20">
                  <h3 className="font-bold text-lg mb-4">Order Items ({selectedItems.length})</h3>
                  <div className="space-y-3">
                    {selectedItems.map((item, index) => (
                       item && item.product && (
                        <div key={item.product._id || index} className="flex gap-4 pb-3 border-b border-gray-700 last:border-0">
                          <img
                            src={item.image || item.product?.images?.[0]?.url || '/placeholder.jpg'}
                            alt={item.name || item.product?.name || 'Product'}
                            className="w-16 h-20 object-cover border border-gray-700"
                          />
                          <div className="flex-1">
                            <p className="font-bold text-sm">{item.name || item.product?.name}</p>
                            <p className="text-xs text-gray-400">Quantity: {item.quantity}</p>
                            <p className="font-semibold mt-1">₹{((item.price || item.product?.price || 0) * item.quantity).toLocaleString('en-IN')}</p>
                          </div>
                        </div>
                       )
                    ))}
                  </div>
                </div>


                {/* Payment Method Display */}
                <div className="mb-6 p-4 bg-white/5 border-2 border-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none">
                          <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#000" stroke="#000" strokeWidth="2"/>
                          <path d="M2 17L12 22L22 17" stroke="#000" strokeWidth="2" strokeLinecap="round"/>
                          <path d="M2 12L12 17L22 12" stroke="#000" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </div>
                      <div>
                        <p className="font-bold text-lg">Razorpay Payment</p>
                        <p className="text-sm text-gray-400">Secure payment gateway</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <img src="https://img.icons8.com/color/48/google-pay-india.png" alt="gpay" className="w-10 h-10" />
                      <img src="https://img.icons8.com/color/48/paytm.png" alt="paytm" className="w-10 h-10" />
                    </div>
                  </div>
                </div>

                {/* Security Info */}
                <div className="bg-black border border-white/20 p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <FaShieldAlt className="text-white text-xl mt-1" />
                    <div>
                      <p className="font-bold text-sm mb-1">100% Secure Payment</p>
                      <p className="text-gray-400 text-xs">
                        Encrypted transactions via Razorpay gateway. Your payment information is completely secure.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="flex-1 border-2 border-white text-white py-3 sm:py-4 font-bold hover:bg-white hover:text-black transition uppercase tracking-wide"
                  >
                    Back
                  </button>

                  <button
                    onClick={handleProceedToPayment}
                    // ✅ FIX: Removed categoriesLoading from disabled check
                    disabled={orderLoading || !isAuthenticated || isProcessingOrder}
                    className="flex-1 bg-white text-black py-3 sm:py-4 font-bold hover:bg-gray-200 transition uppercase tracking-wide disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isProcessingOrder ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        Processing...
                      </>
                    ) : orderLoading ? (
                      'Creating Order...'
                    ) : (
                      // ❌ REMOVED: categoriesLoading text
                      'Proceed to Payment'
                    )}
                  </button>
                </div>
              </div>
            )}


            {/* Step 4: Payment with Razorpay */}
            {currentStep === 4 && createdOrderId && (
              <div className="bg-gray-900 border-2 border-white p-6 sm:p-8">
                {/* Order Created Success Banner */}
                <div className="mb-6 p-4 bg-green-900/30 border-2 border-green-500 animate-pulse">
                  <div className="flex items-center gap-3">
                    <FaCheckCircle className="text-green-500 text-2xl" />
                    <div>
                      <p className="text-green-500 font-bold text-lg">✅ Order Created Successfully!</p>
                      <p className="text-green-400 text-sm">Order #{createdOrderNumber}</p>
                    </div>
                  </div>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold mb-6 flex items-center gap-3">
                  <FaQrcode /> Complete Payment
                </h2>

                <div className="text-center mb-8">
                  <div className="inline-block p-6 bg-white/5 border-2 border-white rounded-lg mb-4">
                    <FaQrcode className="text-6xl mx-auto mb-4" />
                    <p className="text-lg font-bold mb-2">Amount to Pay</p>
                    <p className="text-4xl font-bold text-white">₹{total.toLocaleString('en-IN')}</p>
                  </div>

                  <p className="text-gray-400 mb-6">
                    Click "Pay Now" button below to open Razorpay payment gateway
                  </p>

                  <div className="flex gap-4 justify-center items-center mb-6">
                    <img src="https://img.icons8.com/color/48/google-pay-india.png" alt="gpay" className="w-12 h-12" />
                    <img src="https://img.icons8.com/color/48/paytm.png" alt="paytm" className="w-12 h-12" />
                    <img src="https://img.icons8.com/color/48/phonepe.png" alt="phonepe" className="w-12 h-12" />
                  </div>
                </div>

                {/* Security Badge */}
                <div className="bg-green-900/20 border border-green-600 p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <FaShieldAlt className="text-green-500 text-2xl" />
                    <div>
                      <p className="text-green-500 font-bold">Secure Payment Gateway</p>
                      <p className="text-green-400 text-sm">Powered by Razorpay • SSL Encrypted</p>
                    </div>
                  </div>
                </div>

                {/* Payment Buttons */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <button
                    onClick={() => {
                      setCreatedOrderId(null);
                      setCreatedOrderNumber(null);
                      setCurrentStep(3);
                      toast('Payment cancelled', {
                        icon: 'ℹ️',
                        duration: 2000,
                      });
                    }}
                    className="w-full border-2 border-white text-white py-3 sm:py-4 font-bold hover:bg-white hover:text-black transition uppercase tracking-wide"
                  >
                    Cancel Payment
                  </button>

                  <RazorpayPayment
                    orderId={createdOrderId}
                    amount={total}
                    onSuccess={handlePaymentSuccess}
                    onFailure={handlePaymentFailure}
                  />
                </div>

                {/* Instructions */}
                <div className="p-4 bg-black border border-white/20">
                  <p className="text-sm text-gray-400 mb-2">
                    <strong className="text-white">Payment Instructions:</strong>
                  </p>
                  <ul className="text-xs text-gray-400 space-y-1 list-disc list-inside">
                    <li>Click "Pay Now" to open Razorpay payment gateway</li>
                    <li>Choose your preferred payment method (UPI, Card, Netbanking)</li>
                    <li>Complete the payment securely</li>
                    <li>You will be redirected to order details page</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900 border-2 border-white p-6 sticky top-24">
              <h2 className="text-xl sm:text-2xl font-bold mb-6">Order Summary</h2>

              {isBuyNow && (
                <div className="mb-4 p-3 bg-white/10 border border-white/20">
                  <p className="text-sm uppercase tracking-wide">⚡ Express Checkout</p>
                </div>
              )}

              <div className="space-y-4 mb-6 max-h-60 overflow-y-auto">
                 {selectedItems.map((item, index) => (
                    item && item.product && (
                    <div key={item.product._id || index} className="flex gap-4 pb-4 border-b border-gray-700">
                        <img
                        src={item.image || item.product?.images?.[0]?.url || '/placeholder.jpg'}
                        alt={item.name || item.product?.name || 'Product'}
                        className="w-16 h-20 object-cover border border-gray-700"
                        />
                        <div className="flex-1">
                        <p className="font-bold text-sm mb-1">{item.name || item.product?.name}</p>
                        <p className="text-xs text-gray-400">Qty: {item.quantity || 1}</p>
                        <p className="font-semibold mt-1">₹{((item.price || item.product?.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}</p>
                        </div>
                    </div>
                    )
                ))}
              </div>


              <div className="space-y-3 pt-4 border-t-2 border-gray-700">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Subtotal</span>
                  <span>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Shipping</span>
                  <span>{shippingCharges === 0 ? 'FREE' : `₹${shippingCharges.toLocaleString('en-IN')}`}</span>
                </div>
                <div className="flex justify-between text-xl font-bold pt-3 border-t border-gray-700">
                  <span>Total</span>
                  <span>₹{total.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {currentStep >= 3 && (
                <div className="mt-6 p-4 bg-green-900/20 border border-green-600">
                  <p className="text-green-500 text-xs font-bold">
                    🔒 Secure Payment - Your transaction is protected with SSL encryption
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

export default Checkout;