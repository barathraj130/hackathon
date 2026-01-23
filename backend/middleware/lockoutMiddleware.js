const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const checkSystemStatus = async (req, res, next) => {
  // Always allow Admins to bypass the lock
  if (req.user.role === 'ADMIN') return next();

  // Check the global hackathon config in the database
  const config = await prisma.hackathonConfig.findFirst();

  if (config && config.isPaused) {
    return res.status(423).json({ 
      error: "System Halted by Administration. Data Input Disabled." 
    });
  }

  next();
};

module.exports = { checkSystemStatus };