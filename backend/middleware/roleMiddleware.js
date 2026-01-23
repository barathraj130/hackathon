// Ensure only Administrative access is allowed
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ error: "Restricted Access. Level 2 Authorization Required." });
  }
};

// Ensure Team-only endpoints aren't hit by mistake
const teamOnly = (req, res, next) => {
  if (req.user && req.user.role === 'TEAM') {
    next();
  } else {
    res.status(403).json({ error: "Access Denied. Only Active Teams allowed." });
  }
};

module.exports = { adminOnly, teamOnly };