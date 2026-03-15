// @desc    Verify PIN, Complete Delivery, and Update Wallet
// @route   POST /api/orders/:id/verify
// @access  Private (Runner)
exports.verifyDelivery = async (req, res) => {
  try {
    const orderId = req.params.id;
    const runnerId = req.user._id;
    const { enteredPIN } = req.body; // The 4 digits the runner typed in

    // 1. Find the active order
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // 2. Security Checks
    if (order.runnerId.toString() !== runnerId.toString()) {
      return res.status(403).json({ success: false, message: 'You are not the assigned runner for this errand' });
    }
    if (order.status !== 'ACCEPTED' && order.status !== 'PICKED_UP') {
      return res.status(400).json({ success: false, message: 'Order is not in a deliverable state' });
    }

    // 3. The Ultimate Check: Does the PIN match?
    if (order.deliveryPIN !== enteredPIN) {
      return res.status(400).json({ success: false, message: 'Incorrect PIN. Please ask the buyer again.' });
    }

    // 4. The Financial Transaction (Update Order & Wallet simultaneously)
    // We mark the order complete
    order.status = 'COMPLETED';
    await order.save();

    // We find the Runner and add the delivery fee to their digital wallet
    const User = require('../models/User'); // Bring in the User model
    const updatedRunner = await User.findByIdAndUpdate(
      runnerId,
      { 
        $inc: { walletBalance: order.deliveryFee, totalRuns: 1 } // $inc mathematically adds to the existing number
      },
      { new: true }
    );

    // 5. Success! The UI will now show the runner their new balance
    res.status(200).json({
      success: true,
      message: 'Delivery verified! Funds added to your wallet.',
      newBalance: updatedRunner.walletBalance
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};