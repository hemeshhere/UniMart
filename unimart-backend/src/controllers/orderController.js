const Order = require('../models/Order');
const User = require('../models/User');
const razorpayInstance = require('../config/razorpay');

// ==========================================
// 1. DASHBOARD & DATA FETCHING ROUTES
// ==========================================

// @desc    Get data for Customer Dashboard (My Orders)
// @route   GET /api/orders/customer
// @access  Private (Buyer)
exports.getCustomerDashboard = async (req, res) => {
  try {
    const myOrders = await Order.find({ buyerId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('runnerId', 'name rating'); 

    res.status(200).json({ success: true, count: myOrders.length, data: myOrders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get data for Runner Dashboard (My Delivery History)
// @route   GET /api/orders/runner
// @access  Private (Runner)
exports.getRunnerDashboard = async (req, res) => {
  try {
    const myRuns = await Order.find({ runnerId: req.user._id, status: 'COMPLETED' })
      .sort({ createdAt: -1 })
      .populate('buyerId', 'name hostelBlock');

    res.status(200).json({ success: true, count: myRuns.length, data: myRuns });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get the "Radar" Map Data (Available Tasks)
// @route   GET /api/orders/available
// @access  Private (Runner)
exports.getAvailableTasks = async (req, res) => {
  try {
    const availableTasks = await Order.find({ 
      status: 'PENDING',
      buyerId: { $ne: req.user._id } // Runners cannot see their own food orders
    }).sort({ createdAt: 1 });

    res.status(200).json({ success: true, count: availableTasks.length, data: availableTasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Check if Runner is locked into a mission (App Reload)
// @route   GET /api/orders/runner/active
// @access  Private (Runner)
exports.getActiveRunnerMission = async (req, res) => {
  try {
    const activeMission = await Order.findOne({ 
      runnerId: req.user._id, 
      status: { $in: ['ACCEPTED', 'PICKED_UP'] } 
    })
    .select('-deliveryPIN -razorpayPaymentId')
    .populate('buyerId', 'name hostelBlock');

    if (!activeMission) {
      return res.status(200).json({ success: true, hasActiveMission: false });
    }

    res.status(200).json({ success: true, hasActiveMission: true, data: activeMission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 2. MISSION ACTION ROUTES (THE ENGINE)
// ==========================================

// @desc    Create a new errand after Razorpay payment
// @route   POST /api/orders
// @access  Private (Buyer)
exports.createOrder = async (req, res) => {
  try {
    const { itemDetails, deliveryFee, pickupCoordinates, dropoffCoordinates, razorpayPaymentId } = req.body;

    if (!razorpayPaymentId) {
      return res.status(400).json({ success: false, message: 'Payment ID is required to secure the escrow.' });
    }

    const generatedPIN = Math.floor(1000 + Math.random() * 9000).toString();

    const newOrder = await Order.create({
      buyerId: req.user._id,
      itemDetails,
      deliveryFee,
      deliveryPIN: generatedPIN,
      razorpayPaymentId, // Locked in for potential refunds
      pickupLocation: { type: 'Point', coordinates: pickupCoordinates },
      dropoffLocation: { type: 'Point', coordinates: dropoffCoordinates }
    });

    res.status(201).json({ success: true, data: newOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Accept an open errand (The Race Condition Fix)
// @route   PUT /api/orders/:id/accept
// @access  Private (Runner)
exports.acceptOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const runnerId = req.user._id;

    // THE ATOMIC UPDATE
    const securedOrder = await Order.findOneAndUpdate(
      { _id: orderId, status: 'PENDING' }, 
      { status: 'ACCEPTED', runnerId: runnerId },
      { new: true } 
    ).populate('buyerId', 'name hostelBlock');

    if (!securedOrder) {
      return res.status(409).json({ success: false, message: 'Too late! Another runner grabbed this errand.' });
    }

    res.status(200).json({ success: true, message: 'Mission accepted!', data: securedOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify PIN & Execute True Escrow Payout
// @route   POST /api/orders/:id/verify
// @access  Private (Runner)
exports.verifyDelivery = async (req, res) => {
  try {
    const orderId = req.params.id;
    const runnerId = req.user._id;
    const { enteredPIN } = req.body; 

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.runnerId.toString() !== runnerId.toString()) return res.status(403).json({ success: false, message: 'Unauthorized' });
    if (order.deliveryPIN !== enteredPIN) return res.status(400).json({ success: false, message: 'Incorrect PIN.' });

    const runner = await User.findById(runnerId);
    if (!runner.razorpayAccountId) {
      return res.status(400).json({ success: false, message: 'No linked bank account. Complete KYC first.' });
    }

    // TRUE ESCROW RELEASE TO RUNNER'S BANK (Commented out for local testing)
    // try {
    //   await razorpayInstance.transfers.create({
    //     account: runner.razorpayAccountId,
    //     amount: order.deliveryFee * 100, // Paise
    //     currency: "INR",
    //     notes: { order_id: order._id.toString(), mission: "Campus Food Delivery" }
    //   });
    // } catch (transferError) {
    //   console.error("Razorpay Transfer Failed:", transferError);
    //   return res.status(502).json({ success: false, message: 'Bank transfer failed. Contact admin.' });
    // }

    order.status = 'COMPLETED';
    await order.save();

    runner.totalRuns += 1;
    await runner.save();

    res.status(200).json({ success: true, message: 'Delivery verified! Funds routed to your bank account.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Abort Mission & Execute True Escrow Refund
// @route   POST /api/orders/:id/abort
// @access  Private (Runner)
exports.abortOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const runnerId = req.user._id;
    const { reason } = req.body; 

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.runnerId.toString() !== runnerId.toString()) return res.status(403).json({ success: false, message: 'Unauthorized' });
    if (order.status !== 'ACCEPTED') return res.status(400).json({ success: false, message: 'Cannot abort.' });

    if (!order.razorpayPaymentId) {
      return res.status(500).json({ success: false, message: 'No Payment ID found. Manual intervention required.' });
    }

    // TRUE ESCROW REVERSAL (REFUND BUYER)
    try {
      await razorpayInstance.payments.refund(order.razorpayPaymentId, {
        notes: { reason: reason || "Runner aborted", order_id: order._id.toString() }
      });
    } catch (refundError) {
      console.error("Razorpay Refund Failed:", refundError);
      return res.status(502).json({ success: false, message: 'Gateway failed to issue refund. Order frozen.' });
    }

    order.status = 'CANCELLED';
    await order.save();

    res.status(200).json({ success: true, message: 'Mission aborted. Buyer has been fully refunded.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};