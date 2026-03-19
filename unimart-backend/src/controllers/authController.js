const User = require('../models/User');
const OTP = require('../models/OTP'); // FIX 1: Imported the OTP model!
const sendEmail = require('../utils/sendEmail');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const sendTokenResponse = (user, statusCode, res) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
  const isProd = process.env.NODE_ENV === 'production';
  const options = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: isProd, 
    sameSite: isProd ? 'none' : 'strict' 
  };
  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    data: { 
      _id: user._id, 
      name: user.name, 
      email: user.email, 
      walletBalance: user.walletBalance 
    }
  });
};

exports.registerUser = async (req, res, next) => {
  try {
    const { name, email, password, hostelBlock } = req.body;

    // 1. Check if they are ALREADY a fully registered user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists. Please log in.' });
    }

    // 2. Hash the password immediately
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Generate the 6-digit OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // 4. Check if they already have a pending OTP and delete it so we can send a fresh one
    await OTP.deleteMany({ email });

    // 5. Save them to the TEMPORARY waiting room (Not the User database!)
    await OTP.create({
      name,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      hostelBlock,
      otp: generatedOtp
    });

    // 6. Send the email (Uncomment when nodemailer is ready)
     await sendEmail({ email, subject: 'UniMart Verification', message: `Your OTP is: ${generatedOtp}` });
    res.status(200).json({ success: true, message: 'OTP sent to email. Please verify to complete registration.' });
  } catch (error) { 
    next(error); 
  }
};

exports.verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    // 0. Safety Check: Did the frontend actually send the data?
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Please provide both email and OTP.' });
    }
    
    // 1. Data Normalization: Prevent typo-based rejections
    const stringOtp = otp.toString().trim();
  
    // 2. Look for them in the temporary OTP database
    // Using sort({ createdAt: -1 }) guarantees we check the NEWEST OTP if they requested multiple
    const pendingRegistration = await OTP.findOne({ email: email }).sort({ createdAt: -1 });
    if (!pendingRegistration) {
      return res.status(400).json({ success: false, message: 'OTP expired or email not found. Please register again.' });
    }

    // 3. Check if the OTP matches
    if (pendingRegistration.otp !== stringOtp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    }

    // 4. SUCCESS! Move them to the permanent User database
    const newUser = await User.create({
      name: pendingRegistration.name,
      email: pendingRegistration.email,
      password: pendingRegistration.password, // Already hashed in the register step
      hostelBlock: pendingRegistration.hostelBlock
    });

    // 5. Clean up: Delete ALL temporary records for this email
    await OTP.deleteMany({ email: email });

    // 6. Send the secure cookie and log them in
    sendTokenResponse(newUser, 201, res);

  } catch (error) { 
    // 7. The Ultimate Safety Net: If they double-click the verify button, Mongoose might try to create them twice.
    // Error code 11000 means "Duplicate Key" (email already exists in User DB).
    if (error.code === 11000) {
      await OTP.deleteMany({ email: req.body.email }); // Clean up the waiting room
      return res.status(400).json({ success: false, message: 'User is already verified and registered. Please log in.' });
    }
    next(error); 
  }
};

exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // FIX 2: Removed the obsolete isVerified check here!

    sendTokenResponse(user, 200, res);
  } catch (error) { 
    next(error); 
  }
};

exports.logoutUser = (req, res) => {
  res.cookie('token', 'none', { expires: new Date(Date.now() + 10 * 1000), httpOnly: true });
  res.status(200).json({ success: true, message: 'Logged out' });
};

// @desc    Get current logged-in user profile (Wallet Sync)
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    // req.user is already securely populated by your requireAuth middleware!
    res.status(200).json({
      success: true,
      data: req.user 
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};