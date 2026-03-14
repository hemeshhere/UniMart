const jwt = require('jsonwebtoken');
const User = require('../models/User');

const requireAuth = async (req, res, next) => {
  let token;

  // Check if token exists in the headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }

  try {
    // Verify the token using your secret key from .env
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch the user from the database and attach it to the request object
    // We exclude the password for security
    req.user = await User.findById(decoded.id).select('-password');
    
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User no longer exists' });
    }

    next(); // Pass control to the next controller
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token is invalid or expired' });
  }
};

module.exports = requireAuth;