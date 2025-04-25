// restaurant-service/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const verifyToken = (roles = []) => {
  return async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    try {
      // Verify token directly (no API call needed)
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Attach user info from token
      req.user = {
        id: decoded.id,
        role: decoded.role
      };

      // Check if user has required role
      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }

      next();
    } catch (err) {
      console.error('Token verification error:', err);
      return res.status(401).json({ message: 'Invalid token' });
    }
  };
};

module.exports = verifyToken;