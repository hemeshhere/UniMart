const express = require('express');
const router = express.Router();

const requireAuth = require('../middleware/requireAuth');
const { isAdmin } = require('../middleware/adminMiddleware');
const {
  getDashboardStats,
  getAllUsers,
  getUserOrderHistory,
  toggleUserBan,
  adjustUniCoins,
  getAllLiveOrders,
  cancelOrder,
  getAllCanteensAdmin,
  toggleCanteenStatus,
  createCanteen
} = require('../controllers/adminController');

// All routes below require a valid JWT + admin role
router.use(requireAuth, isAdmin);

// ─── Pillar 1: Analytics Dashboard ───────────────────────────────────────────
// GET /api/admin/stats
// Returns: totalUsers, bannedUsers, totalCirculatingCoins, liveOrders
router.get('/stats', getDashboardStats);

// ─── Pillar 2: User Control ───────────────────────────────────────────────────
// GET  /api/admin/users          → paginated user list (supports ?page= &limit=)
// PUT  /api/admin/users/:id/ban  → toggle ban (no body needed)
// PUT  /api/admin/users/:id/coins → { action: 'add'|'deduct', amount: Number }
router.get('/users', getAllUsers);
router.get('/users/:id/orders', getUserOrderHistory);   // full order history per user
router.put('/users/:id/ban', toggleUserBan);
router.put('/users/:id/coins', adjustUniCoins);

// ─── Pillar 3: Live Order Oversight ──────────────────────────────────────────
// GET /api/admin/orders/live         → all PENDING, ACCEPTED, PICKED_UP orders
// PUT /api/admin/orders/:id/cancel   → cancel + refund (no body needed)
router.get('/orders/live', getAllLiveOrders);
router.put('/orders/:id/cancel', cancelOrder);

// ─── Pillar 4: Canteen Control ────────────────────────────────────────────────
// GET  /api/admin/canteens           → all canteens (supports ?search= &isOpen=)
// POST /api/admin/canteens           → create canteen { name, location, packingFee, menu[] }
// PUT  /api/admin/canteens/:id/toggle → flip isOpen status + broadcasts via Socket.IO
router.get('/canteens', getAllCanteensAdmin);
router.post('/canteens', createCanteen);
router.put('/canteens/:id/toggle', toggleCanteenStatus);

module.exports = router;