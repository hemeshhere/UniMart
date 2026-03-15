const express = require('express');
const router = express.Router();
const { registerUser, verifyOTP, loginUser, logoutUser } = require('../controllers/authController');
const { loginLimiter } = require('../middleware/rateLimiter'); // From middleware folder

router.post('/register', registerUser);
router.post('/verify-otp', verifyOTP);
router.post('/login', loginLimiter, loginUser);
router.get('/logout', logoutUser);

module.exports = router;