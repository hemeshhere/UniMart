const express = require('express');
const router = express.Router();
const { 
  createOrder, 
  acceptOrder, 
  verifyDelivery,
  abortOrder,
  getCustomerDashboard,
  getRunnerDashboard,
  getAvailableTasks,
  getActiveRunnerMission
} = require('../controllers/orderController');
const requireAuth = require('../middleware/requireAuth'); // The bouncer

// All routes below this line require a valid JWT token
router.use(requireAuth);

// ==========================================
// 1. DASHBOARD DATA ROUTES (Must be at the top)
// ==========================================

// GET http://localhost:5000/api/orders/customer
router.get('/customer', getCustomerDashboard);

// GET http://localhost:5000/api/orders/runner
router.get('/runner', getRunnerDashboard);

// GET http://localhost:5000/api/orders/available
router.get('/available', getAvailableTasks);

// GET http://localhost:5000/api/orders/runner/active
router.get('/runner/active', getActiveRunnerMission);

// ==========================================
// 2. ACTION ROUTES (Dynamic IDs must go at the bottom)
// ==========================================

// Create a new errand
// POST http://localhost:5000/api/orders
router.post('/', createOrder);

// Runner accepts an errand
// PUT http://localhost:5000/api/orders/:id/accept
router.put('/:id/accept', acceptOrder);

// Runner verifies the PIN at drop-off (Triggers Escrow Payout)
// POST http://localhost:5000/api/orders/:id/verify
router.post('/:id/verify', verifyDelivery);

// Runner aborts the mission (Triggers Escrow Refund)
// POST http://localhost:5000/api/orders/:id/abort
router.post('/:id/abort', abortOrder);

module.exports = router;