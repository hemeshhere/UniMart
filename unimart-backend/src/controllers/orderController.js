const Order = require('../models/Order');
const User = require('../models/User');

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
    // FIX: Using 'DELIVERED' to match the Order schema enum
    const myRuns = await Order.find({ runnerId: req.user._id, status: 'DELIVERED' })
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
    })
    .select('-deliveryPIN')
    .sort({ createdAt: 1 });

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
    .select('-deliveryPIN')
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

// @desc    Create a new errand 
// @route   POST /api/orders
// @access  Private (Buyer)
exports.createOrder = async (req, res) => {
  try {
    const { itemDetails, pricing, pickupCoordinates, dropoffCoordinates } = req.body;

    // Calculate total on backend to prevent frontend tampering
    const totalToPayAtDoor = pricing.canteenItemTotal + pricing.deliveryFee;

    const generatedPIN = Math.floor(1000 + Math.random() * 9000).toString();

    const newOrder = await Order.create({
      buyerId: req.user._id,
      itemDetails,
      pricing: {
        canteenItemTotal: pricing.canteenItemTotal,
        deliveryFee: pricing.deliveryFee,
        totalToPayAtDoor: totalToPayAtDoor
      },
      deliveryPIN: generatedPIN,
      pickupLocation: { type: 'Point', coordinates: pickupCoordinates },
      dropoffLocation: { type: 'Point', coordinates: dropoffCoordinates }
    });

    res.status(201).json({ success: true, data: newOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Buyer cancels their own order
// @route   POST /api/orders/:id/cancel
// @access  Private (Buyer)
exports.cancelOrderAsBuyer = async (req, res) => {
  try {
    const orderId = req.params.id;
    const buyerId = req.user._id;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.buyerId.toString() !== buyerId.toString()) return res.status(403).json({ success: false, message: 'Unauthorized' });

    // STRICT BLOCK: Runner already paid out-of-pocket at the canteen!
    if (order.status === 'PICKED_UP' || order.status === 'DELIVERED') {
      return res.status(400).json({ 
        success: false, 
        message: 'Too late to cancel! The Runner has already paid for your food at the canteen. You must pay them at the door.' 
      });
    }

    if (order.status === 'CANCELLED') {
      return res.status(400).json({ success: false, message: 'Order is already cancelled.' });
    }

    // IF A RUNNER WAS ALREADY ASSIGNED, REFUND THEIR UNICOINS
    if (order.status === 'ACCEPTED' && order.runnerId) {
      const runner = await User.findById(order.runnerId);
      if (runner) {
        runner.uniCoins += 5; // Give back the platform tax
        await runner.save();
      }
    }

    order.status = 'CANCELLED';
    await order.save();

    res.status(200).json({ success: true, message: 'Order cancelled successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Accept an open errand (The UniCoin Bouncer & Atomic Lock)
// @route   PUT /api/orders/:id/accept
// @access  Private (Runner)
exports.acceptOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const runnerId = req.user._id;

    // 1. THE BOUNCER: Atomically check >10 and deduct 5
    const updatedRunner = await User.findOneAndUpdate(
      { _id: runnerId, uniCoins: { $gte: 10 } },  //tweak this for MAB
      { $inc: { uniCoins: -5 } },               
      { new: true }
    );

    if (!updatedRunner) {
      return res.status(403).json({ success: false, message: 'Insufficient UniCoins. Top up required.' });
    }

    // 2. THE ATOMIC UPDATE: Try to grab the order
    const securedOrder = await Order.findOneAndUpdate(
      { _id: orderId, status: 'PENDING' }, 
      { status: 'ACCEPTED', runnerId: runnerId },
      { new: true } 
    ).populate('buyerId', 'name hostelBlock');

    // 3. THE ROLLBACK 
    if (!securedOrder) {
      // They lost the race! Give them their 5 coins back immediately.
      await User.updateOne(
        { _id: runnerId }, 
        { $inc: { uniCoins: 5 } }
      );
      
      return res.status(409).json({ success: false, message: 'Too late! Another runner grabbed this errand.' });
    }
    const safeOrder = securedOrder.toObject();
    delete safeOrder.deliveryPIN;
    res.status(200).json({ success: true, message: 'Mission accepted! 5 UniCoins deducted.', data: safeOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Runner marks the food as picked up from the canteen
// @route   PUT /api/orders/:id/pickup
// @access  Private (Runner)
exports.markAsPickedUp = async (req, res) => {
  try {
    const orderId = req.params.id;
    const runnerId = req.user._id;

    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    if (order.runnerId.toString() !== runnerId.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized. You are not assigned to this mission.' });
    }
    
    // Strict block: Order must be accepted first
    if (order.status !== 'ACCEPTED') {
      return res.status(400).json({ success: false, message: 'Order must be in ACCEPTED state to mark as picked up.' });
    }

    // Advance the state
    order.status = 'PICKED_UP';
    await order.save();

    const safeOrder = order.toObject();
    delete safeOrder.deliveryPIN;

    res.status(200).json({ 
      success: true, 
      message: 'Food picked up! Head to the drop-off location.', 
      data: safeOrder 
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify PIN & Complete Order
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
    
    // FIX: Verify should work if the order is PICKED_UP (or ACCEPTED, if they forgot to click pickup)
    if (order.status !== 'PICKED_UP' && order.status !== 'ACCEPTED') {
      return res.status(400).json({ success: false, message: 'Order is not in a verifiable state.' });
    }
    
    // Check the PIN
    if (order.deliveryPIN !== enteredPIN) return res.status(400).json({ success: false, message: 'Incorrect PIN.' });

    // FIX: Set to 'DELIVERED' to match the schema
    order.status = 'DELIVERED';
    await order.save();

    // Increment runner's stats
    const runner = await User.findById(runnerId);
    runner.totalRuns += 1;
    await runner.save();

    res.status(200).json({ success: true, message: 'Delivery verified! You can accept new missions.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Runner aborts the mission
// @route   POST /api/orders/:id/abort
// @access  Private (Runner)
exports.abortOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const runnerId = req.user._id;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.runnerId.toString() !== runnerId.toString()) return res.status(403).json({ success: false, message: 'Unauthorized' });
    
    // STRICT BLOCK: If they already bought the food, they cannot back out.
    if (order.status === 'PICKED_UP' || order.status === 'DELIVERED') {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot abort. You have already picked up the food. You must complete the delivery to get paid.' 
      });
    }

    if (order.status !== 'ACCEPTED') {
      return res.status(400).json({ success: false, message: 'Order is not in a valid state to abort.' });
    }

    // Cancel the order and unassign the runner
    order.status = 'CANCELLED';
    await order.save();

    // REFUND THE TAX: Give the runner back their 5 UniCoins
    const runner = await User.findById(runnerId);
    runner.uniCoins += 5;
    await runner.save();

    res.status(200).json({ success: true, message: 'Mission aborted. 5 UniCoins have been refunded to your wallet.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};