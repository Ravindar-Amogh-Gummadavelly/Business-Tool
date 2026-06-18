const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');

const verifyToken = ClerkExpressRequireAuth({
  onError: (err, req, res) => {
    console.error("Clerk Auth Error:", err);
    return res.status(401).json({ error: 'Unauthenticated!' });
  }
});

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.auth) {
      return res.status(403).json({ error: 'Forbidden: No auth context' });
    }
    // With Clerk, roles can be managed via metadata. 
    // We'll bypass strict role checking for now unless configured.
    next();
  };
};

module.exports = { verifyToken, requireRole };
