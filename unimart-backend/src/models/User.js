const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    // Enforcing university email (e.g., ending in your specific university domain)
    match: [/^[\w-\.]+@([\w-]+\.)?lpu\.in$/, 'Must be a valid university email address']
  },
  password: {
    type: String,
    required: true,
    select: false // Never return password in standard database queries
  },
  hostelBlock: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    default: 5.0
  },
  totalRuns: {
    type: Number,
    default: 0
  },
  // --- FINTECH FIELDS ---
  razorpayAccountId: {
    type: String,
    default: null // Populated when the student completes Runner Onboarding (KYC)
  },
  walletBalance: {
    type: Number,
    default: 0 // Optional: Keep this to issue platform credits or refunds directly in-app
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);