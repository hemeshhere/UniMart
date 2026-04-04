const express = require('express');
const router = express.Router();

const requireAuth = require('../middleware/requireAuth');
const { isAdmin } = require('../middleware/adminMiddleware');
const {
  getDashboardStats,
  getAllUsers,
  toggleUserBan,
  adjustUniCoins,
  getAllLiveOrders,
  cancelOrder,
  toggleCanteenStatus
} = require('../controllers/adminController');

router.use(requireAuth, isAdmin); // Applies to all routes in this file automatically

// Pillar 1: Analytics
router.get('/stats', getDashboardStats);

// Pillar 2: User Control
router.get('/users', getAllUsers);
router.put('/users/:id/ban', toggleUserBan);
router.put('/users/:id/coins', adjustUniCoins);

// Pillar 3: Order Oversight
router.get('/orders/live', getAllLiveOrders);
router.put('/orders/:id/cancel', cancelOrder);

// Pillar 4: Canteen
router.put('/canteens/:id/toggle', toggleCanteenStatus);

module.exports = router;