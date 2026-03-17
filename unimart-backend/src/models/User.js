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
}, { timestamps: true });



userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);