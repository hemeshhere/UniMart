const express = require('express');
const router = express.Router();

const { createTopUpIntent, verifyTopUpPayment } = require('../controllers/walletController');
const requireAuth = require('../middleware/requireAuth');

router.post('/topup', requireAuth, createTopUpIntent);
router.post('/verify', requireAuth, verifyTopUpPayment);

module.exports = router;