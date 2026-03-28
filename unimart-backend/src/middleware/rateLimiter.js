const rateLimit = require('express-rate-limit');

exports.loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // 5 attempts per IP
  message: { success: false, message: 'Too many login attempts, please try again later.' }
});