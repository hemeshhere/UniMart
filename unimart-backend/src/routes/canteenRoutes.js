const express = require('express');
const router = express.Router();
const { getAllCanteens, getCanteenMenu } = require('../controllers/canteenController');
const requireAuth = require('../middleware/requireAuth'); // JWT Bouncer

// Strictly require authentication for all canteen routes
router.use(requireAuth);

// GET http://localhost:5000/api/canteens (Supports query params)
router.get('/', getAllCanteens);

// GET http://localhost:5000/api/canteens/64a7b8... (Fetches full menu)
router.get('/:id', getCanteenMenu);

module.exports = router;