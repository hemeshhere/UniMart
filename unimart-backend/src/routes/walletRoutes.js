const express = require('express');
const router = express.Router();

const { createTopUpIntent, verifyTopUpPayment, razorpayWebhook } = require('../controllers/walletController');
const requireAuth = require('../middleware/requireAuth');

router.post('/topup', requireAuth, createTopUpIntent);
router.post('/verify-payment', requireAuth, verifyTopUpPayment);
router.post('/webhook', razorpayWebhook);
module.exports = router;