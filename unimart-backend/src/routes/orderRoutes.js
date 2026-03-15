const express = require('express');
const router = express.Router();
const { createOrder, acceptOrder, verifyDelivery } = require('../controllers/orderController');
const requireAuth = require('../middlewares/requireAuth'); // The bouncer

router.use(requireAuth);

// GET http://localhost:5000/api/orders/customer
router.get('/customer', getCustomerDashboard);

// GET http://localhost:5000/api/orders/runner
router.get('/runner', getRunnerDashboard);

// GET http://localhost:5000/api/orders/available
router.get('/available', getAvailableTasks);

// GET http://localhost:5000/api/orders/runner/active
router.get('/runner/active', getActiveRunnerMission);

router.get('/customer', getCustomerDashboard);
router.get('/runner', getRunnerDashboard);
router.get('/available', getAvailableTasks);

router.post('/', createOrder);

// Runner accepts an errand
// PUT http://localhost:5000/api/orders/64a7b8.../accept
router.put('/:id/accept', acceptOrder);

// Runner verifies the PIN at drop-off
// POST http://localhost:5000/api/orders/64a7b8.../verify
router.post('/:id/verify', verifyDelivery);

// Runner aborts the mission (Triggers Escrow Refund)
// POST http://localhost:5000/api/orders/:id/abort
router.post('/:id/abort', abortOrder);

module.exports = router;