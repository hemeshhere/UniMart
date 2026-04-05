const User = require('../models/User');
const OTP = require('../models/OTP'); // FIX 1: Imported the OTP model!
const sendEmail = require('../utils/sendEmail');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const sendTokenResponse = (user, statusCode, res) => {
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' });
  const isProd = process.env.NODE_ENV === 'production';
  const options = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: isProd, 
    sameSite: isProd ? 'none' : 'strict' 
  };
  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    token: token,
    data: { 
      _id: user._id, 
      name: user.name, 
      email: user.email, 
      walletBalance: user.walletBalance,
      role: user.role
    }
  });
};

exports.registerUser = async (req, res, next) => {
  try {
    const { name, email, password, phoneNumber, hostel, roomNumber, gender } = req.body;
    if (!name || !email || !password || !phoneNumber || !hostel || !roomNumber || !gender) {
      return res.status(400).json({ success: false, message: 'Please fill in all required fields.' });
    }
    const normalizedEmail = email.toLowerCase().trim();
    // 1. Check if they are ALREADY a fully registered user
    const existingUser = await User.findOne({ 
      $or: [{ email: normalizedEmail }, { phoneNumber }] 
    }).lean();
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'User with this email or phone already exists. Please log in.' });
    }

    const recentOtp = await OTP.findOne({ email: normalizedEmail }).lean();
    if (recentOtp) {
      const timeSinceLastOtp = Date.now() - new Date(recentOtp.createdAt).getTime();
      // If requested less than 60 seconds ago, block it
      if (timeSinceLastOtp < 60000) {
        return res.status(429).json({ 
          success: false, 
          message: 'Please wait 60 seconds before requesting another OTP.' 
        });
      }
      // If it's been more than 60 seconds, clear the old one
      await OTP.deleteMany({ email: normalizedEmail });
    }

    // 2. Hash the password immediately
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Generate the 6-digit OTP
    const generatedOtp = crypto.randomInt(100000, 999999).toString();

    // 5. Save them to the TEMPORARY waiting room (Not the User database!)
    await OTP.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      phoneNumber,
      hostel,        // Fixed: Matches the destructured variable
      roomNumber,    // Added missing field
      gender,        // Added missing field
      otp: generatedOtp
    });

    // 6. Send the email (Uncomment when nodemailer is ready)
    await sendEmail({ 
      email: normalizedEmail, 
      subject: 'UniMart Verification Code', 
      message: `Your UniMart OTP is: ${generatedOtp}. This code is valid for 10 minutes.`,
      otp: generatedOtp 
    });
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
    const normalizedEmail = email.toLowerCase().trim();
  
    // 2. Look for them in the temporary OTP database
    // Using sort({ createdAt: -1 }) guarantees we check the NEWEST OTP if they requested multiple
    const pendingRegistration = await OTP.findOne({ email: normalizedEmail }).sort({ createdAt: -1 });
    
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
      password: pendingRegistration.password, 
      phoneNumber: pendingRegistration.phoneNumber,
      hostel: pendingRegistration.hostel,          
      roomNumber: pendingRegistration.roomNumber,  
      gender: pendingRegistration.gender           
    });

    // 5. Clean up: Delete ALL temporary records for this email
    await OTP.deleteMany({ email: normalizedEmail });

    // 6. Send the secure cookie and log them in
    sendTokenResponse(newUser, 201, res);

  } catch (error) { 
    // 7. The Ultimate Safety Net
    // Error code 11000 means "Duplicate Key" (email already exists in User DB).
    if (error.code === 11000) {
      await OTP.deleteMany({ email: req.body.email.toLowerCase().trim() }); // Clean up the waiting room
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

    // 🚫 BAN GATE: Block before issuing any token (admins are exempt)
    if (user.isBanned && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        code: 'USER_BANNED',
        message: 'Your account has been suspended by the UniMart admin team.'
      });
    }

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

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Please provide an email.' });

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    //ANTI-ENUMERATION: Always return success, even if the email isn't in the database.
    if (!user) {
      return res.status(200).json({ 
        success: true, 
        message: 'If an account matches that email, a recovery code has been sent.' 
      });
    }

    // Generate a secure 6-digit OTP
    const generatedOtp = crypto.randomInt(100000, 999999).toString();
    
    // Hash the OTP securely before saving it to the database
    const hashedOtp = crypto.createHash('sha256').update(generatedOtp).digest('hex');

    user.resetPasswordOtp = hashedOtp;
    user.resetPasswordOtpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // Send the email (ensure your sendEmail function is working!)
    await sendEmail({
      email: user.email,
      subject: 'UniMart Password Recovery Code',
      message: `Your password reset code is: ${generatedOtp}. This code expires in 10 minutes. If you did not request this, please ignore this email.`,
      otp: generatedOtp
    });

    res.status(200).json({ 
      success: true, 
      message: 'If an account matches that email, a recovery code has been sent.' 
    });

  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide email, OTP, and new password.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    
    // Hash the incoming OTP so we can compare it to the database
    const hashedOtp = crypto.createHash('sha256').update(otp.toString().trim()).digest('hex');

    // Find user with matching email, matching OTP, and check if it hasn't expired
    const user = await User.findOne({
      email: normalizedEmail,
      resetPasswordOtp: hashedOtp,
      resetPasswordOtpExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired recovery code.' });
    }

    // Hash the new password and save it
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    
    // Clear the reset fields so the OTP cannot be reused
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpire = undefined;
    
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successfully! You can now log in.' });

  } catch (error) {
    next(error);
  }
};