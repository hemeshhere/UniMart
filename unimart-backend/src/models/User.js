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
  // --- FINTECH FIELDS ---
  razorpayAccountId: {
    type: String,
    default: null // Populated when the student completes Runner Onboarding (KYC)
  },
}, { timestamps: true });



userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);