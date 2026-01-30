const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) return res.status(403).json({ error: "No token provided" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hackathon_secret_2026_synthesis');
        req.user = decoded;
        next();
    } catch (err) {
        console.error(`[AUTH] Token Verification Failed: ${err.message}`);
        return res.status(401).json({ error: "Unauthorized / Session Expired" });
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
        console.error(`[AUTH-SENTINEL] ACCESS DENY: Role Mismatch. User: ${req.user.id}, Role: ${role}, Expected: ADMIN`);
        return res.status(403).json({ 
            error: `High-level Administrative clearance required. Your current session role is: [${role}]`,
            debugRole: role,
            userId: req.user.id 
        });
    }
    
    console.log('[AUTH-SENTINEL] ACCESS GRANTED: Institutional authority confirmed.');
    next();
};

module.exports = { verifyToken, isAdmin };