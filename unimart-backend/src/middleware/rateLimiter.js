const rateLimit = require('express-rate-limit');

exports.loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 5 attempts per IP
  message: { success: false, message: 'Too many login attempts, please try again later.' }
});