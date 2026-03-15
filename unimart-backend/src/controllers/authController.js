const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const jwt = require('jsonwebtoken');

const sendTokenResponse = (user, statusCode, res) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
  const options = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };
  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    data: { _id: user._id, name: user.name, email: user.email, walletBalance: user.walletBalance }
  });
};

exports.registerUser = async (req, res, next) => {
  try {
    const { name, email, password, hostelBlock } = req.body;
    let user = await User.findOne({ email });

    if (user && user.isVerified) {
      return res.status(400).json({ success: false, message: 'User already verified. Please log in.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpire = new Date(Date.now() + 10 * 60 * 1000); 

    if (!user) {
      user = await User.create({ name, email, password, hostelBlock, verificationOTP: otp, verificationOTPExpire: otpExpire, isVerified: false });
    } else {
      user.verificationOTP = otp; user.verificationOTPExpire = otpExpire; await user.save();
    }

    await sendEmail({ email: user.email, subject: 'UniMart Verification', message: `Your OTP is: ${otp}` });
    res.status(200).json({ success: true, message: 'OTP sent to university email.' });
  } catch (error) { next(error); }
};

exports.verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email }).select('+verificationOTP +verificationOTPExpire');

    if (!user || user.isVerified || user.verificationOTP !== otp || user.verificationOTPExpire < Date.now()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    user.isVerified = true; user.verificationOTP = undefined; user.verificationOTPExpire = undefined;
    await user.save();
    sendTokenResponse(user, 200, res);
  } catch (error) { next(error); }
};

exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    if (!user.isVerified) {
      return res.status(401).json({ success: false, message: 'Please verify your email first.' });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) { next(error); }
};

exports.logoutUser = (req, res) => {
  res.cookie('token', 'none', { expires: new Date(Date.now() + 10 * 1000), httpOnly: true });
  res.status(200).json({ success: true, message: 'Logged out' });
};