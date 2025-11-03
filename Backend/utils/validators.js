const validator = require('validator');

// Validate email
const validateEmail = (email) => {
  return validator.isEmail(email);
};

// Validate password strength
const validatePassword = (password) => {
  // At least 6 characters
  if (password.length < 6) {
    return {
      isValid: false,
      message: 'Password must be at least 6 characters long'
    };
  }
  return { isValid: true };
};

// Validate phone number (Indian format)
const validatePhone = (phone) => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
};

// Validate pincode (Indian format)
const validatePincode = (pincode) => {
  const pincodeRegex = /^[1-9][0-9]{5}$/;
  return pincodeRegex.test(pincode);
};

// Sanitize input
const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return validator.escape(input.trim());
  }
  return input;
};

// Validate MongoDB ObjectId
const validateObjectId = (id) => {
  return validator.isMongoId(id);
};

// Validate product data
const validateProductData = (data) => {
  const errors = [];

  if (!data.name || data.name.trim().length === 0) {
    errors.push('Product name is required');
  }

  if (!data.description || data.description.trim().length === 0) {
    errors.push('Product description is required');
  }

  if (!data.price || data.price <= 0) {
    errors.push('Valid product price is required');
  }

  if (!data.category) {
    errors.push('Product category is required');
  }

  if (data.stock === undefined || data.stock < 0) {
    errors.push('Valid stock quantity is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validate order data
const validateOrderData = (data) => {
  const errors = [];

  if (!data.items || data.items.length === 0) {
    errors.push('Order must contain at least one item');
  }

  if (!data.shippingAddress) {
    errors.push('Shipping address is required');
  } else {
    const addr = data.shippingAddress;
    if (!addr.fullName) errors.push('Full name is required');
    if (!addr.phone) errors.push('Phone number is required');
    if (!addr.addressLine1) errors.push('Address line 1 is required');
    if (!addr.city) errors.push('City is required');
    if (!addr.state) errors.push('State is required');
    if (!addr.zipCode) errors.push('Zip code is required');
  }

  if (!data.paymentMethod) {
    errors.push('Payment method is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  validateEmail,
  validatePassword,
  validatePhone,
  validatePincode,
  sanitizeInput,
  validateObjectId,
  validateProductData,
  validateOrderData
};