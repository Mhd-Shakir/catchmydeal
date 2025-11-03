// frontend/src/utils/notificationService.js
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Configure default options
const defaultOptions = {
  position: "top-right",
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
};

// Order Success Notification
export const showOrderSuccessNotification = (orderId, orderNumber) => {
  toast.success(
    <div>
      <strong>🎉 Order Placed Successfully!</strong>
      <br />
      <span style={{ fontSize: '14px' }}>Order #{orderNumber}</span>
      <br />
      <span style={{ fontSize: '12px', color: '#666' }}>
        Check your email for confirmation
      </span>
    </div>,
    {
      ...defaultOptions,
      autoClose: 7000,
    }
  );
};

// Order Error Notification
export const showOrderErrorNotification = (message) => {
  toast.error(
    <div>
      <strong>❌ Order Failed</strong>
      <br />
      <span style={{ fontSize: '14px' }}>{message || 'Please try again'}</span>
    </div>,
    defaultOptions
  );
};

// Email Sent Notification
export const showEmailSentNotification = () => {
  toast.info(
    <div>
      <strong>📧 Confirmation Email Sent!</strong>
      <br />
      <span style={{ fontSize: '14px' }}>Check your inbox</span>
    </div>,
    {
      ...defaultOptions,
      position: "bottom-right",
      autoClose: 3000,
    }
  );
};

// Processing Order Notification
export const showProcessingNotification = () => {
  toast.loading('Processing your order...', {
    ...defaultOptions,
    autoClose: false,
    closeButton: false,
  });
};

// Add to Cart Notification
export const showAddToCartNotification = (productName) => {
  toast.success(
    <div>
      <strong>✅ Added to Cart!</strong>
      <br />
      <span style={{ fontSize: '14px' }}>{productName}</span>
    </div>,
    {
      ...defaultOptions,
      autoClose: 3000,
    }
  );
};

// Remove from Cart Notification
export const showRemoveFromCartNotification = () => {
  toast.info(
    <div>
      <strong>🗑️ Removed from Cart</strong>
    </div>,
    {
      ...defaultOptions,
      autoClose: 2000,
    }
  );
};

// Stock Warning Notification
export const showStockWarningNotification = (productName, availableStock) => {
  toast.warning(
    <div>
      <strong>⚠️ Low Stock!</strong>
      <br />
      <span style={{ fontSize: '14px' }}>
        Only {availableStock} left for {productName}
      </span>
    </div>,
    defaultOptions
  );
};

// Payment Success Notification
export const showPaymentSuccessNotification = () => {
  toast.success(
    <div>
      <strong>💳 Payment Successful!</strong>
      <br />
      <span style={{ fontSize: '14px' }}>Order confirmed</span>
    </div>,
    defaultOptions
  );
};

// Payment Failed Notification
export const showPaymentFailedNotification = (message) => {
  toast.error(
    <div>
      <strong>❌ Payment Failed</strong>
      <br />
      <span style={{ fontSize: '14px' }}>{message}</span>
    </div>,
    defaultOptions
  );
};

// Login Success Notification
export const showLoginSuccessNotification = (userName) => {
  toast.success(
    <div>
      <strong>👋 Welcome back!</strong>
      <br />
      <span style={{ fontSize: '14px' }}>Hi {userName}</span>
    </div>,
    {
      ...defaultOptions,
      autoClose: 3000,
    }
  );
};

// Logout Notification
export const showLogoutNotification = () => {
  toast.info(
    <div>
      <strong>👋 Logged Out</strong>
      <br />
      <span style={{ fontSize: '14px' }}>See you soon!</span>
    </div>,
    {
      ...defaultOptions,
      autoClose: 3000,
    }
  );
};

// Generic Success Notification
export const showSuccessNotification = (message) => {
  toast.success(message, defaultOptions);
};

// Generic Error Notification
export const showErrorNotification = (message) => {
  toast.error(message, defaultOptions);
};

// Generic Info Notification
export const showInfoNotification = (message) => {
  toast.info(message, defaultOptions);
};

// Generic Warning Notification
export const showWarningNotification = (message) => {
  toast.warning(message, defaultOptions);
};

// Dismiss all notifications
export const dismissAllNotifications = () => {
  toast.dismiss();
};