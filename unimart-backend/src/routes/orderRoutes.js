const express = require('express');
const router = express.Router();
const { createOrder, acceptOrder, verifyDelivery, getCustomerDashboard, getRunnerDashboard, getAvailableTasks } = require('../controllers/orderController');
const requireAuth = require('../middleware/requireAuth'); // From middleware folder

router.use(requireAuth);

router.get('/customer', getCustomerDashboard);
router.get('/runner', getRunnerDashboard);
router.get('/available', getAvailableTasks);

router.post('/', createOrder);
router.put('/:id/accept', acceptOrder);
router.post('/:id/verify', verifyDelivery);

module.exports = router;