const express = require('express');
const router = express.Router();
const { createRazorpayOrder, paymentWebhook } = require('../controllers/paymentController');
const requireAuth = require('../middlewares/requireAuth');

// The buyer needs to be logged in to initialize a payment
router.post('/create-razorpay-order', requireAuth, createRazorpayOrder);

// WARNING: The webhook must be completely public so Razorpay's servers can hit it.
// Do NOT put requireAuth here.
router.post('/webhook', paymentWebhook);

module.exports = router;