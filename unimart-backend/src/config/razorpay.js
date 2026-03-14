const Razorpay = require('razorpay');

// Ensure you have RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env file
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

module.exports = razorpayInstance;