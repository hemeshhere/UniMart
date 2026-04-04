const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next(); // They are an admin, let them through
  } else {
    res.status(403).json({ message: 'Access denied. HQ Command clearance required.' });
  }
};

module.exports = { isAdmin };