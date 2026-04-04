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

    // 💸 REFUND THE BUYER 💸
    // If you add online prepayments later, this logic ensures they get their platform coins back
    const buyer = await User.findById(order.buyerId);
    if (buyer) {
        buyer.uniCoins += order.pricing.deliveryFee || 0; 
        await buyer.save();
    }

    // 💸 REFUND THE RUNNER (If they accepted it and paid the tax)
    if (order.runnerId && order.status !== 'PENDING') {
        const runner = await User.findById(order.runnerId);
        if (runner) {
            runner.uniCoins += 5; // Refund the atomic lock tax
            await runner.save();
        }
    }

    // Live update the radar to clear it
    req.app.get('io').to('available_orders_radar').emit('order_removed_from_radar', order._id);

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
// 7. TOGGLE CANTEEN STATUS (The Switchboard)
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


module.exports = {
  getDashboardStats,
  toggleUserBan,
  adjustUniCoins,
  getAllUsers,
  getAllLiveOrders,
  cancelOrder,
  toggleCanteenStatus
};