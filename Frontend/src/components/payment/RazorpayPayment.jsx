// frontend/src/components/payment/RazorpayPayment.jsx

import { useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../../config/axios';
import toast from 'react-hot-toast';

const RazorpayPayment = ({ orderId, amount, onSuccess, onFailure }) => {
  const [loading, setLoading] = useState(false);
  const { user } = useSelector((state) => state.auth);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    setLoading(true);

    try {
      // Step 1: Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded) {
        toast.error('Failed to load payment gateway. Please check your internet connection.');
        setLoading(false);
        return;
      }

      // Step 2: Create Razorpay order on backend
      // 🔴🔴🔴 FIX HERE: Pass 'amount' along with 'orderId' 🔴🔴🔴
      const { data } = await api.post('/payment/create-order', { orderId, amount });
      // 🔴🔴🔴 END OF FIX 🔴🔴🔴

      if (!data.success) {
        throw new Error(data.message || 'Failed to create payment order');
      }

      // Step 3: Configure Razorpay options
      const options = {
        key: data.data.key, // Razorpay Key ID
        amount: data.data.amount, // Amount in paise
        currency: data.data.currency, // INR
        name: 'PocketMoney Store', // ✅ നിങ്ങൾക്ക് ഇത് നിങ്ങളുടെ സ്റ്റോറിന്റെ പേര് ആക്കാം
        description: 'Secure Online Payment',
        image: '/logo.png', // Your store logo
        order_id: data.data.orderId, // Razorpay Order ID
        
        // Payment success handler
        handler: async function (response) {
          try {
            setLoading(true);
            
            // Step 4: Verify payment signature on backend
            const verifyData = await api.post('/payment/verify', {
              orderId: orderId, // നിങ്ങളുടെ ഡാറ്റാബേസിലെ ഓർഡർ ഐഡി
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            if (verifyData.data.success) {
              toast.success('Payment successful! Order confirmed.');
              // ശ്രദ്ധിക്കുക: verifyData.data.order എന്ന് നിങ്ങൾ എഴുതിയിട്ടുണ്ട്, 
              // പക്ഷെ verify API ഓർഡർ തിരിച്ചു നൽകുന്നില്ല. 
              // നിങ്ങൾ onSuccess-ലേക്ക് response പാസ് ചെയ്യുന്നതാവും നല്ലത്
              onSuccess(response); 
            } else {
              throw new Error('Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            toast.error('Payment verification failed. Please contact support.');
            onFailure(error);
          } finally {
            setLoading(false);
          }
        },

        // Pre-fill customer details
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || '', // ഇത് user ഒബ്ജക്റ്റിൽ ഉണ്ടെങ്കിൽ ചേർക്കുക
        },

        // Additional notes
        notes: {
          orderId: orderId,
          customerEmail: user?.email,
        },

        // Theme customization
        theme: {
          color: '#000000',
          backdrop_color: '#000000',
        },

        // Payment modal settings
        modal: {
          // Handle modal close (user cancels payment)
          ondismiss: function () {
            toast.error('Payment cancelled by user');
            setLoading(false);
            onFailure({ message: 'Payment cancelled by user' });
          },
          
          // Escape key to close
          escape: true,
          
          // Show/hide close button
          confirm_close: true,
        },

        // Retry settings
        retry: {
          enabled: true,
          max_count: 3,
        },

        // Timeout in milliseconds (5 minutes)
        timeout: 300000, // 300 സെക്കൻഡ് (5 മിനിറ്റ്) ആണ് നല്ലത്, 300ms അല്ല

        // Read-only fields (prevent editing)
        readonly: {
          email: true,
          contact: true,
        },
      };

      // Step 5: Initialize Razorpay
      const razorpay = new window.Razorpay(options);

      // Handle payment failure
      razorpay.on('payment.failed', async function (response) {
        console.error('Payment failed:', response.error);
        
        const errorMessage = response.error.description || 
                            response.error.reason || 
                            'Payment failed. Please try again.';
        
        toast.error(errorMessage);
        setLoading(false);
        onFailure(response.error);
      });

      // Open Razorpay checkout
      razorpay.open();
      // setLoading(false); // ഇത് ഇവിടെ നിന്ന് മാറ്റണം, കാരണം open() അസിങ്ക് അല്ല
      
    } catch (error) {
      console.error('Payment initialization error:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Payment failed. Please try again.';
      
      toast.error(errorMessage);
      setLoading(false);
      onFailure(error);
    }
    // setLoading(true) ന് ശേഷം open() ആവുമ്പോൾ setLoading(false) ആകുന്നുണ്ട്, 
    // അത് ശരിയല്ല. അത് ondismiss-ലും handler-ലും ആണ് ആകേണ്ടത്. 
    // ഞാൻ അത് ശരിയാക്കിയിട്ടുണ്ട്.
  };

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      className="flex-1 bg-white text-black py-3 sm:py-4 font-bold hover:bg-gray-200 transition uppercase tracking-wide disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
    >
      {loading ? (
        <>
          <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          Processing...
        </>
      ) : (
        <>
          🔒 Pay ₹{amount.toLocaleString('en-IN')}
        </>
      )}
    </button>
  );
};

export default RazorpayPayment;