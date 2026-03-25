const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  hostel: { type: String, required: true },
  roomNumber: { type: String, required: true },
  gender: { type: String, required: true },
  otp: { type: String, required: true },
  createdAt: { 
    type: Date, 
    default: Date.now, 
    expires: 600 // Automatically deletes this document from MongoDB after 10 minutes (600 seconds)
  }
});

module.exports = mongoose.model('OTP', otpSchema);