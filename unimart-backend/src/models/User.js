const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    match: [/^[\w-\.]+@([\w-]+\.)?lpu\.in$/, 'Must be a valid university email']
  },
  password: { type: String, required: true, select: false },
  hostelBlock: { type: String, required: true },
  walletBalance: { type: Number, default: 0 },
  rating: { type: Number, default: 5.0 },
  totalRuns: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: false },
  verificationOTP: { type: String, select: false },
  verificationOTPExpire: { type: Date, select: false }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);