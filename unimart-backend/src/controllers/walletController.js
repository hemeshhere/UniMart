const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/User');

// Initialize Razorpay
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @desc    Step 1: Create Razorpay Order for UniCoins
// @route   POST /api/wallet/topup
// @access  Private (Runner)
exports.createTopUpIntent = async (req, res) => {
  try {
    const { amountInINR } = req.body; // e.g., 50

    if (!amountInINR || amountInINR < 10) {
      return res.status(400).json({ success: false, message: 'Minimum top-up is ₹10.' });
    }

    const options = {
      amount: amountInINR * 100, // Razorpay requires paise (₹50 = 5000 paise)
      currency: "INR",
      receipt: `topup_${req.user._id}_${Date.now()}`,
    };

    const order = await razorpayInstance.orders.create(options);
    
    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Step 2: Verify Razorpay payment and add UniCoins
// @route   POST /api/wallet/verify
// @access  Private (Runner)
exports.verifyTopUpPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const runnerId = req.user._id;

    // 1. Verify the signature to prevent frontend tampering
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature. Scam detected.' });
    }

    // 2. THE REPLAY ATTACK FIX: Check if this receipt was already used
    const userWithPayment = await User.findOne({ successfulPayments: razorpay_payment_id });
    if (userWithPayment) {
      return res.status(400).json({ success: false, message: 'This payment receipt has already been used.' });
    }

    // 3. Fetch the absolute truth from Razorpay
    const paymentDocument = await razorpayInstance.payments.fetch(razorpay_payment_id);
    const trueAmountPaid = paymentDocument.amount / 100; // Divide paise by 100

    // 4. Give them the coins based on TRUE amount and LOCK the receipt
    const runner = await User.findById(runnerId);
    runner.uniCoins += trueAmountPaid;
    runner.successfulPayments.push(razorpay_payment_id); // Marks receipt as used
    await runner.save();

    res.status(200).json({ 
      success: true, 
      message: `Payment successful! ${trueAmountPaid} UniCoins added to your wallet.`,
      uniCoins: runner.uniCoins 
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};