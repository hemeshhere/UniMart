const razorpayInstance = require('../config/razorpay');
const crypto = require('crypto');

exports.createRazorpayOrder = async (req, res, next) => {
  try {
    const options = { amount: req.body.amount * 100, currency: "INR", receipt: `rcpt_${Date.now()}` };
    const order = await razorpayInstance.orders.create(options);
    res.status(200).json({ success: true, data: order });
  } catch (error) { next(error); }
};

exports.paymentWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(JSON.stringify(req.body)).digest('hex'); // Assumes raw body mapped in server.js

    if (expectedSignature !== signature) return res.status(400).json({ success: false, message: 'Invalid sig' });

    if (req.body.event === 'payment.captured') {
      console.log(`Payment success: ${req.body.payload.payment.entity.amount / 100} INR`);
    }
    res.status(200).json({ success: true });
  } catch (error) { res.status(500).send('Webhook error'); }
};