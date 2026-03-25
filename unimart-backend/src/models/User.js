const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    // Enforcing university email (e.g., ending in your specific university domain)
    match: [/^[\w-\.]+@([\w-]+\.)?lpu\.in$/, 'Must be a valid university email address']
  },
  password: {
    type: String,
    required: true,
    select: false // Never return password in standard database queries
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
  },
  hostel: {
    type: String,
    required: [true, 'Please select your hostel'],
    enum: ['BH-1', 'BH-2', 'BH-3', 'BH-4', 'BH-5', 'BH-6', 'BH-7', 'BS-8', 'BS-9', 'BS-10', 'GH-1', 'GH-2', 'GH-3', 'GH-4', 'GH-5', 'GH-6','GH-7'] 
  },
  roomNumber: {
    type: String,
    required: [true, 'Room number is required']
  },
  gender: {
    type: String,
    required: [true, 'Please select your gender'],
    enum: ['Male', 'Female', 'Other']
  },
  rating: {
    type: Number,
    default: 5.0
  },
  totalRuns: {
    type: Number,
    default: 0
  },
  successfulPayments: [{ type: String }],
  uniCoins: {
    type: Number,
    default: 0, 
    min: 0 // Prevents the wallet from going negative
  },
  strikeCount: {
    type: Number,
    default: 0 // 3 strikes (ghosting) = permanent LPU email ban
  },
  isBanned: {
    type: Boolean,
    default: false
  },
  resetPasswordOtp: String,
  resetPasswordOtpExpire: Date,
}, { timestamps: true });


userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);