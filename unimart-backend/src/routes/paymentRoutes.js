const express = require('express');
const router = express.Router();
const { createRazorpayOrder, paymentWebhook } = require('../controllers/paymentController');
const requireAuth = require('../middleware/requireAuth'); // From middleware folder

router.post('/create-order', requireAuth, createRazorpayOrder);
// Webhook strictly public, handled raw in server.js
router.post('/webhook', paymentWebhook);

module.exports = router;