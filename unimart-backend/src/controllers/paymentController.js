const razorpayInstance = require('../config/razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');

// @desc    Initialize a payment (Gets the Razorpay Order ID for the frontend)
// @route   POST /api/payments/create-razorpay-order
// @access  Private (Buyer)
exports.createRazorpayOrder = async (req, res) => {
  try {
    const { amount } = req.body; // Total amount = Item cost + Delivery Fee

    const options = {
      amount: amount * 100, // Razorpay expects amount in paise (multiply by 100)
      currency: "INR",
      receipt: `receipt_${Date.now()}`
    };

    const order = await razorpayInstance.orders.create(options);

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to initiate payment' });
  }
};

// @desc    Razorpay Webhook (Verifies payment behind the scenes)
// @route   POST /api/payments/webhook
// @access  Public (Razorpay Servers Only)
exports.paymentWebhook = async (req, res) => {
  try {
    // 1. Get the signature from Razorpay headers
    const signature = req.headers['x-razorpay-signature'];
    
    // 2. We must verify this request actually came from Razorpay using our secret
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(JSON.stringify(req.body)) // Requires raw body mapping in server.js
      .digest('hex');

    if (expectedSignature !== signature) {
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    // 3. If signature is valid, process the event
    const event = req.body.event;
    
    if (event === 'payment.captured') {
      const paymentEntity = req.body.payload.payment.entity;
      // Here, you would normally link the payment ID to the Order in your database
      // e.g., Update Order status from 'AWAITING_PAYMENT' to 'PENDING'
      console.log(`Payment successful for amount: ${paymentEntity.amount / 100} INR`);
    }

    // Always return a 200 OK so Razorpay knows you received the webhook
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Webhook Failed');
  }
};