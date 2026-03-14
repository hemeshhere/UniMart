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
    // Enforcing university email (e.g., ending in lpu.in)
    match: [/^[\w-\.]+@([\w-]+\.)?lpu\.in$/, 'Must be a valid university email address']
  },
  password: {
    type: String,
    required: true,
    select: false // Never return password in standard queries
  },
  hostelBlock: {
    type: String,
    required: true
  },
  walletBalance: {
    type: Number,
    default: 0 // Starts at 0, goes up as they complete runs
  },
  rating: {
    type: Number,
    default: 5.0
  },
  totalRuns: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);