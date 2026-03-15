const Order = require('../models/Order');
const User = require('../models/User');

exports.createOrder = async (req, res, next) => {
  try {
    const { itemDetails, deliveryFee, pickupCoordinates, dropoffCoordinates } = req.body;
    const generatedPIN = Math.floor(1000 + Math.random() * 9000).toString();

    const order = await Order.create({
      buyerId: req.user._id,
      itemDetails, deliveryFee, deliveryPIN: generatedPIN,
      pickupLocation: { type: 'Point', coordinates: pickupCoordinates },
      dropoffLocation: { type: 'Point', coordinates: dropoffCoordinates }
    });
    res.status(201).json({ success: true, data: order });
  } catch (error) { next(error); }
};

exports.acceptOrder = async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const orderCheck = await Order.findById(orderId);
    if (!orderCheck || orderCheck.buyerId.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot accept this order' });
    }

    const securedOrder = await Order.findOneAndUpdate(
      { _id: orderId, status: 'PENDING' },
      { status: 'ACCEPTED', runnerId: req.user._id },
      { new: true }
    );

    if (!securedOrder) return res.status(409).json({ success: false, message: 'Task no longer available' });
    res.status(200).json({ success: true, data: securedOrder });
  } catch (error) { next(error); }
};

exports.verifyDelivery = async (req, res, next) => {
  try {
    const { enteredPIN } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order || order.runnerId.toString() !== req.user._id.toString() || order.deliveryPIN !== enteredPIN) {
      return res.status(400).json({ success: false, message: 'Invalid PIN or Order' });
    }

    order.status = 'COMPLETED';
    await order.save();

    const updatedRunner = await User.findByIdAndUpdate(
      req.user._id, { $inc: { walletBalance: order.deliveryFee, totalRuns: 1 } }, { new: true }
    );

    res.status(200).json({ success: true, newBalance: updatedRunner.walletBalance });
  } catch (error) { next(error); }
};

exports.getCustomerDashboard = async (req, res, next) => {
  try {
    const orders = await Order.find({ buyerId: req.user._id }).sort({ createdAt: -1 }).populate('runnerId', 'name rating');
    res.status(200).json({ success: true, data: orders });
  } catch (error) { next(error); }
};

exports.getRunnerDashboard = async (req, res, next) => {
  try {
    const runs = await Order.find({ runnerId: req.user._id }).sort({ createdAt: -1 }).populate('buyerId', 'name hostelBlock');
    res.status(200).json({ success: true, data: runs });
  } catch (error) { next(error); }
};

exports.getAvailableTasks = async (req, res, next) => {
  try {
    const tasks = await Order.find({ status: 'PENDING', buyerId: { $ne: req.user._id } }).sort({ createdAt: 1 });
    res.status(200).json({ success: true, data: tasks });
  } catch (error) { next(error); }
};