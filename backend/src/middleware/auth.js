const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(403).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1]; // Format: "Bearer <token>"
  
  if (!token) {
    return res.status(403).json({ error: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Unauthorized: Invalid Token' });
    }
    req.user = decoded; // { id, role, email }
    next();
  });
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges' });
    }
    next();
  };
};

module.exports = { verifyToken, requireRole };
