const express = require('express');
const router = express.Router();
const { registerUser, verifyOTP, loginUser, logoutUser, getMe } = require('../controllers/authController');
const { loginLimiter } = require('../middleware/rateLimiter'); // From middleware folder
const requireAuth = require('../middleware/requireAuth');

router.post('/register', registerUser);
router.post('/verify-otp', verifyOTP);
router.post('/login', loginLimiter, loginUser);
router.get('/logout', logoutUser);
router.get('/me', requireAuth, getMe);
module.exports = router;