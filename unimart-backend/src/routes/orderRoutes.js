const express = require('express');
const router = express.Router();
const { 
  createOrder, 
  acceptOrder, 
  verifyDelivery,
  abortOrder,
  cancelOrderAsBuyer, 
  markAsPickedUp,    
  getCustomerDashboard,
  getRunnerDashboard,
  getAvailableTasks,
  getActiveRunnerMission
} = require('../controllers/orderController');
const requireAuth = require('../middleware/requireAuth'); // The bouncer

// All routes below this line require a valid JWT token
router.use(requireAuth);

// ==========================================
// 1. DASHBOARD DATA ROUTES
// ==========================================

// @route   GET /api/orders/customer
router.get('/customer', getCustomerDashboard);

// @route   GET /api/orders/runner
router.get('/runner', getRunnerDashboard);

// @route   GET /api/orders/available
router.get('/available', getAvailableTasks);

// @route   GET /api/orders/runner/active
router.get('/runner/active', getActiveRunnerMission);

// ==========================================
// 2. ACTION ROUTES 
// ==========================================

// @desc    Create a new errand (Zero Gateway)
// @route   POST /api/orders
router.post('/', createOrder);

// @desc    Buyer cancels their own order (Refunds Runner if accepted)
// @route   POST /api/orders/:id/cancel
router.post('/:id/cancel', cancelOrderAsBuyer);

// @desc    Runner accepts an errand (Deducts 5 UniCoins)
// @route   PUT /api/orders/:id/accept
router.put('/:id/accept', acceptOrder);

// @desc    Runner marks the food as picked up from the canteen
// @route   PUT /api/orders/:id/pickup
router.put('/:id/pickup', markAsPickedUp);

// @desc    Runner verifies the PIN at drop-off (Completes Order)
// @route   POST /api/orders/:id/verify
router.post('/:id/verify', verifyDelivery);

// @desc    Runner aborts the mission (Refunds 5 UniCoins)
// @route   POST /api/orders/:id/abort
router.post('/:id/abort', abortOrder);

module.exports = router;