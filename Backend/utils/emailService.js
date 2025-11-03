const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Send email
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `${process.env.EMAIL_FROM || 'PEPE E-Commerce'} <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      html: options.html
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
};

// Welcome email template
const sendWelcomeEmail = async (user) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Welcome to PEPE E-Commerce!</h2>
      <p>Hi ${user.name},</p>
      <p>Thank you for registering with us. We're excited to have you on board!</p>
      <p>Start exploring our amazing collection of products.</p>
      <p style="margin-top: 30px;">Best regards,<br>PEPE E-Commerce Team</p>
    </div>
  `;

  return await sendEmail({
    email: user.email,
    subject: 'Welcome to PEPE E-Commerce',
    html
  });
};

// Order confirmation email
const sendOrderConfirmationEmail = async (user, order) => {
  const itemsList = order.items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price}</td>
    </tr>
  `).join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Order Confirmation</h2>
      <p>Hi ${user.name},</p>
      <p>Thank you for your order! Your order has been confirmed.</p>
      
      <div style="background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
        <p style="margin: 5px 0;"><strong>Order Number:</strong> ${order.orderNumber}</p>
        <p style="margin: 5px 0;"><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
        <p style="margin: 5px 0;"><strong>Total Amount:</strong> ₹${order.totalPrice}</p>
      </div>

      <h3 style="color: #333;">Order Items</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #f0f0f0;">
            <th style="padding: 10px; text-align: left;">Product</th>
            <th style="padding: 10px; text-align: center;">Quantity</th>
            <th style="padding: 10px; text-align: right;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsList}
        </tbody>
      </table>

      <h3 style="color: #333; margin-top: 30px;">Shipping Address</h3>
      <p style="margin: 5px 0;">${order.shippingAddress.fullName}</p>
      <p style="margin: 5px 0;">${order.shippingAddress.addressLine1}</p>
      ${order.shippingAddress.addressLine2 ? `<p style="margin: 5px 0;">${order.shippingAddress.addressLine2}</p>` : ''}
      <p style="margin: 5px 0;">${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.zipCode}</p>

      <p style="margin-top: 30px;">We'll send you another email when your order ships.</p>
      <p style="margin-top: 30px;">Best regards,<br>PEPE E-Commerce Team</p>
    </div>
  `;

  return await sendEmail({
    email: user.email,
    subject: `Order Confirmation - ${order.orderNumber}`,
    html
  });
};

// Order status update email
const sendOrderStatusEmail = async (user, order, status) => {
  let statusMessage = '';
  
  switch(status) {
    case 'processing':
      statusMessage = 'Your order is being processed.';
      break;
    case 'shipped':
      statusMessage = 'Your order has been shipped!';
      break;
    case 'delivered':
      statusMessage = 'Your order has been delivered.';
      break;
    case 'cancelled':
      statusMessage = 'Your order has been cancelled.';
      break;
    default:
      statusMessage = 'Your order status has been updated.';
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Order Status Update</h2>
      <p>Hi ${user.name},</p>
      <p>${statusMessage}</p>
      
      <div style="background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
        <p style="margin: 5px 0;"><strong>Order Number:</strong> ${order.orderNumber}</p>
        <p style="margin: 5px 0;"><strong>Status:</strong> ${status.toUpperCase()}</p>
        ${order.trackingNumber ? `<p style="margin: 5px 0;"><strong>Tracking Number:</strong> ${order.trackingNumber}</p>` : ''}
      </div>

      <p style="margin-top: 30px;">Best regards,<br>PEPE E-Commerce Team</p>
    </div>
  `;

  return await sendEmail({
    email: user.email,
    subject: `Order Status Update - ${order.orderNumber}`,
    html
  });
};

// Password reset email
const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Password Reset Request</h2>
      <p>Hi ${user.name},</p>
      <p>You requested to reset your password. Click the button below to reset it:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
      </div>

      <p>If you didn't request this, please ignore this email.</p>
      <p style="color: #666; font-size: 12px;">This link will expire in 1 hour.</p>
      
      <p style="margin-top: 30px;">Best regards,<br>PEPE E-Commerce Team</p>
    </div>
  `;

  return await sendEmail({
    email: user.email,
    subject: 'Password Reset Request',
    html
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusEmail,
  sendPasswordResetEmail
};