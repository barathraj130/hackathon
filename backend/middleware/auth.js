const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) return res.status(403).json({ message: "No token provided" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hackathon_secret_2026_synthesis');
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Unauthorized" });
    }
};

const isAdmin = (req, res, next) => {
    // SYSTEM LOG: Access validation for critical endpoint
    console.log(`[AUTH-SENTINEL] Validating admin authority for user ${req.user?.id} (${req.user?.role})`);
    
    if (!req.user) {
        console.error('[AUTH-SENTINEL] ACCESS DENY: Missing authentication payload in request context');
        return res.status(403).json({ error: "Institutional verification required. Please re-login." });
    }
    
    // CASE-INSENSITIVE CHECK for mission stability
    const role = String(req.user.role || "").toUpperCase();
    if (role !== 'ADMIN') {
        console.error(`[AUTH-SENTINEL] ACCESS DENY: Insufficient Clearance. Role: ${role}, Expected: ADMIN`);
        return res.status(403).json({ error: "Access Denied: High-level Administrative clearance required.", currentRole: role });
    }
    
    console.log('[AUTH-SENTINEL] ACCESS GRANTED: Institutional authority confirmed.');
    next();
};

module.exports = { verifyToken, isAdmin };