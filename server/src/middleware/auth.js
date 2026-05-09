const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ocs_iith_super_secret_key');
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) return res.status(401).json({ message: 'User not found' });
      if (!req.user.isActive) return res.status(403).json({ message: 'Account deactivated. Contact admin.' });
      return next();
    } catch (err) {
      return res.status(401).json({ message: 'Not authorized, token invalid' });
    }
  }
  return res.status(401).json({ message: 'Not authorized, no token' });
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ message: 'Admin access required' });
};

const canBook = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'core_member')) return next();
  return res.status(403).json({ message: 'Booking permission required' });
};

module.exports = { protect, adminOnly, canBook };
