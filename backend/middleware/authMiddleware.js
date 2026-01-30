const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  let token = req.headers.authorization;

  if (token && token.startsWith('Bearer')) {
    try {
      token = token.split(' ')[1];
      const decoded = jwt.verify(token, 'INSTITUTIONAL_SYNTHESIS_SECRET_2026_MASTER');
      
      // Inject user data into the request object
      req.user = decoded; 
      next();
    } catch (error) {
      res.status(401).json({ error: "Institutional Authorization Failed." });
    }
  } else {
    res.status(401).json({ error: "Access Denied. No Security Token Found." });
  }
};

module.exports = { protect };