const express = require('express');
const router = express.Router();
const { createOrder, acceptOrder, verifyDelivery } = require('../controllers/orderController');
const requireAuth = require('../middlewares/requireAuth'); // The bouncer

// All routes below this line require a valid JWT token
router.use(requireAuth);

// Create a new errand
// POST http://localhost:5000/api/orders
router.post('/', createOrder);

// Runner accepts an errand
// PUT http://localhost:5000/api/orders/64a7b8.../accept
router.put('/:id/accept', acceptOrder);

// Runner verifies the PIN at drop-off
// POST http://localhost:5000/api/orders/64a7b8.../verify
router.post('/:id/verify', verifyDelivery);

module.exports = router;