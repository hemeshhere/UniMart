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
      amount: amountInINR * 100, 
      currency: "INR",
      receipt: `${req.user._id.toString().slice(-10)}_${Date.now()}`,
      notes: {
        userId: req.user._id.toString()
      }
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

    // 2. THE RACE CONDITION FIX: Check if the webhook already handled this
    const userWithPayment = await User.findOne({ 
      _id: runnerId,
      successfulPayments: razorpay_payment_id 
    });
    
    if (userWithPayment) {
      return res.status(200).json({ 
        success: true, 
        message: 'Payment verified successfully by background system.',
        uniCoins: userWithPayment.uniCoins 
      });
    }

    // 3. Fetch the absolute truth from Razorpay
    const paymentDocument = await razorpayInstance.payments.fetch(razorpay_payment_id);
    if (paymentDocument.status !== 'captured') {
      return res.status(400).json({ success: false, message: 'Payment not captured. Status: ' + paymentDocument.status });
    }
    const trueAmountPaid = paymentDocument.amount / 100; // Divide paise by 100
    
    const updatedUser = await User.findOneAndUpdate(
      { 
        _id: runnerId, 
        successfulPayments: { $ne: razorpay_payment_id } // $ne means "Not Equal" / "Not in array"
      },
      { 
        $inc: { uniCoins: trueAmountPaid },
        $push: { successfulPayments: razorpay_payment_id } 
      },
      { new: true } // Return the updated document
    );

    if (!updatedUser) {
      const safeUser = await User.findById(runnerId);
      return res.status(200).json({ 
        success: true, 
        message: 'Payment verified successfully.',
        uniCoins: safeUser.uniCoins 
      });
    }
    
    res.status(200).json({ 
      success: true, 
      message: `Payment successful! ${trueAmountPaid} UniCoins added to your wallet.`,
      uniCoins: updatedUser.uniCoins 
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Step 3: Webhook from Razorpay (The Safety Net)
// @route   POST /api/payments/webhook
// @access  Public (Called by Razorpay, verified by signature)
exports.razorpayWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    // 1. Verify Signature using the RAW body (Crucial!)
    const shasum = crypto.createHmac('sha256', webhookSecret);
    shasum.update(req.body); 
    const digest = shasum.digest('hex');

    if (digest !== signature) {
      console.error("Webhook signature mismatch. Possible malicious attack.");
      return res.status(400).send('Invalid signature');
    }

    // 2. Signature verified! Safe to parse the payload
    const event = JSON.parse(req.body.toString());

    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      const paymentId = payment.id;
      const amountPaid = payment.amount / 100; // Convert paise back to INR
      
      // 3. Extract the userId we securely injected into the notes earlier
      const userId = payment.notes?.userId;

      if (!userId) {
        console.error(`Webhook Error: No userId found in notes for payment ${paymentId}`);
        // Return 200 so Razorpay stops retrying this broken payment
        return res.status(200).send('OK'); 
      }

      // 4. ATOMIC UPDATE: Credit user ONLY IF they haven't been credited yet
      const updatedUser = await User.findOneAndUpdate(
        { 
          _id: userId, 
          successfulPayments: { $ne: paymentId } // Prevent double crediting
        },
        { 
          $inc: { uniCoins: amountPaid },
          $push: { successfulPayments: paymentId } 
        },
        { new: true }
      );

      if (updatedUser) {
        console.log(`Webhook Success: Added ${amountPaid} UniCoins to user ${userId}.`);
      } else {
        console.log(`Webhook Ignored: Payment ${paymentId} was already processed by the frontend.`);
      }
    }
    res.status(200).send('OK');
  } catch (error) {
    console.error("Webhook Server Error:", error);
    res.status(500).send('Internal Server Error');
  }
};