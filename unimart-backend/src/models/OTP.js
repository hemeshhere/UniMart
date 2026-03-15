const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  hostelBlock: { type: String, required: true },
  otp: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 600 } 
});

// The third argument 'otps' forces Mongoose to use that specific collection name
module.exports = mongoose.model('OTP', otpSchema, 'otps');