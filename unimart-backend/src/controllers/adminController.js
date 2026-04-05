const User = require('../models/User');
const Order = require('../models/Order');
const Canteen = require('../models/Canteen');
// ==========================================
// 1. DASHBOARD STATS (Optimized Aggregations)
// ==========================================
const getDashboardStats = async (req, res) => {
  try {
    // Run these concurrently to speed up response time
    const [totalUsers, bannedUsers, coinData, liveOrders] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isBanned: true }),
      User.aggregate([{ $group: { _id: null, totalCoins: { $sum: "$uniCoins" } } }]),
      Order.countDocuments({ status: { $in: ['PENDING', 'ACCEPTED', 'PICKED_UP'] } })
    ]);

    const totalCirculatingCoins = coinData[0] ? coinData[0].totalCoins : 0;

    res.status(200).json({
      success: true,
      data: { totalUsers, bannedUsers, totalCirculatingCoins, liveOrders }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error loading stats' });
  }
};

// ==========================================
// 2. TOGGLE USER BAN (The Ban Hammer)
// ==========================================
const toggleUserBan = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    user.isBanned = !user.isBanned;
    if (!user.isBanned) user.strikeCount = 0; // Be nice and reset strikes

    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.name} is now ${user.isBanned ? 'BANNED' : 'ACTIVE'}`,
      data: { id: user._id, isBanned: user.isBanned }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error updating ban status' });
  }
};

// ==========================================
// 3. ADJUST UNICOINS (The Bank)
// ==========================================
const adjustUniCoins = async (req, res) => {
  try {
    const { amount, action } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    if (action === 'add') {
      user.uniCoins += amount;
    } else if (action === 'deduct') {
      if (user.uniCoins - amount < 0) {
        return res.status(400).json({ success: false, error: 'Insufficient UniCoins to deduct' });
      }
      user.uniCoins -= amount;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: `${amount} coins ${action}ed. New balance: ${user.uniCoins}`,
      data: { id: user._id, uniCoins: user.uniCoins }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error adjusting coins' });
  }
};

// ==========================================
// 4. GET ALL USERS (Paginated & Lean)
// ==========================================
const getAllUsers = async (req, res) => {
  try {
    // Pagination defaults: page 1, 50 users per page
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const startIndex = (page - 1) * limit;

    const users = await User.find()
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit)
      .select('-password')
      .lean(); // Faster JSON parsing, less RAM

    const total = await User.countDocuments();

    res.status(200).json({
      success: true,
      count: users.length,
      pagination: { page, totalPages: Math.ceil(total / limit), totalUsers: total },
      data: users
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error fetching users' });
  }
};

// ==========================================
// 5. GET LIVE ORDERS (The Dispatch Radar)
// ==========================================
const getAllLiveOrders = async (req, res) => {
  try {
    const liveOrders = await Order.find({
      status: { $in: ['PENDING', 'ACCEPTED', 'PICKED_UP'] }
    })
      .sort({ createdAt: -1 })
      .populate('buyerId', 'name hostel roomNumber phoneNumber')
      .populate('runnerId', 'name phoneNumber')
      .lean(); // Faster JSON parsing

    res.status(200).json({
      success: true,
      count: liveOrders.length,
      data: liveOrders
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error fetching live orders' });
  }
};

// ==========================================
// 6. CANCEL ORDER & REFUND (Emergency Stop)
// ==========================================
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    if (order.status === 'DELIVERED' || order.status === 'CANCELLED') {
      return res.status(400).json({ success: false, error: 'Order is already delivered or cancelled' });
    }

    order.status = 'CANCELLED';
    await order.save();


    // 💸 REFUND THE RUNNER (If they accepted it and paid the tax)
    if (order.runnerId && order.status !== 'PENDING') {
      const runner = await User.findById(order.runnerId);
      if (runner) {
        runner.uniCoins += 5; // Refund the atomic lock tax
        await runner.save();
      }
    }

    const io = req.app.get('io');

    // 🔔 Notify the BUYER — their BuyerView listens for this and shows a toast + native push
    order.cancellationReason = 'Your order was cancelled by the UniMart admin team.';
    await order.save();
    io.to(order.buyerId.toString()).emit('order_status_update', order.toObject());

    // 🔔 Notify the RUNNER (if assigned) so their mission screen clears
    if (order.runnerId) {
      io.to(order.runnerId.toString()).emit('order_status_update', order.toObject());
    }

    // Clear the order from the live runner radar
    io.to('available_orders_radar').emit('order_removed_from_radar', order._id);

    res.status(200).json({
      success: true,
      message: 'Order cancelled by Admin. Refunds processed.',
      data: order
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error cancelling order' });
  }
};
// ==========================================
// 7. GET ALL CANTEENS – Admin View (with full menu)
// ==========================================
const getAllCanteensAdmin = async (req, res) => {
  try {
    // Admin gets full documents including menu for oversight
    // Optional ?search= and ?isOpen= query params
    const { search, isOpen } = req.query;
    let queryObj = {};

    if (search) {
      queryObj.name = { $regex: search, $options: 'i' };
    }
    if (isOpen !== undefined) {
      queryObj.isOpen = isOpen === 'true';
    }

    const canteens = await Canteen.find(queryObj)
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: canteens.length,
      data: canteens
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error fetching canteens' });
  }
};

// ==========================================
// 8. CREATE CANTEEN (Admin Only)
// ==========================================
const createCanteen = async (req, res) => {
  try {
    const { name, location, packingFee, menu } = req.body;
    if (!name || !location) {
      return res.status(400).json({ success: false, error: 'Name and location are required' });
    }

    const canteen = await Canteen.create({
      name,
      location,
      packingFee: packingFee || 0,
      isOpen: true,
      menu: menu || []
    });

    res.status(201).json({
      success: true,
      message: `Canteen "${canteen.name}" created successfully`,
      data: canteen
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error creating canteen' });
  }
};

// ==========================================
// 8. TOGGLE CANTEEN STATUS (The Switchboard)
// ==========================================
const toggleCanteenStatus = async (req, res) => {
  try {
    const canteen = await Canteen.findById(req.params.id);
    if (!canteen) {
      return res.status(404).json({ success: false, error: 'Canteen not found' });
    }

    // Flip the status (e.g., from true to false)
    canteen.isOpen = !canteen.isOpen;
    await canteen.save();

    // Broadcast to all connected users so the canteen grays out on their screen live!
    req.app.get('io').emit('canteen_status_changed', {
      canteenId: canteen._id,
      isOpen: canteen.isOpen
    });

    res.status(200).json({
      success: true,
      message: `${canteen.name} is now ${canteen.isOpen ? 'OPEN' : 'CLOSED'}`,
      data: { id: canteen._id, isOpen: canteen.isOpen }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error updating canteen' });
  }
};


// ==========================================
// 9. GET USER ORDER HISTORY (Admin View)
// ==========================================
const getUserOrderHistory = async (req, res) => {
  try {
    const userId = req.params.id;

    // Run both queries concurrently for speed
    const [ordersAsbuyer, ordersAsRunner] = await Promise.all([
      // All orders this user placed as a buyer
      Order.find({ buyerId: userId })
        .sort({ createdAt: -1 })
        .select('status itemDetails pricing createdAt')
        .lean(),

      // All orders this user completed as a runner
      Order.find({ runnerId: userId, status: 'DELIVERED' })
        .sort({ createdAt: -1 })
        .select('status itemDetails pricing createdAt buyerId')
        .populate('buyerId', 'name hostel')
        .lean()
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalOrdered:   ordersAsbuyer.length,
        totalDelivered: ordersAsRunner.length,
        ordersAsbuyer,
        ordersAsRunner
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error fetching user history' });
  }
};

module.exports = {
  getDashboardStats,
  toggleUserBan,
  adjustUniCoins,
  getAllUsers,
  getUserOrderHistory,
  getAllLiveOrders,
  cancelOrder,
  getAllCanteensAdmin,
  toggleCanteenStatus,
  createCanteen
};