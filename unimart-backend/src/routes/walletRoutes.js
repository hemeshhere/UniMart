const express = require('express');
const router = express.Router();

const { createTopUpIntent, verifyTopUpPayment } = require('../controllers/walletController');
const auth = require('../middleware/requireAuth'); // default export

router.post('/topup', auth, createTopUpIntent);
router.post('/verify', auth, verifyTopUpPayment);

module.exports = router;