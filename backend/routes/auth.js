// backend/routes/auth.js
const router = require('express').Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Unified Login Endpoint
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // 1. Try Team Login (Username = Team Name, Password = College Name)
  const team = await prisma.team.findFirst({
    where: { 
      teamName: username, 
      collegeName: password 
    }
  });

  if (team) {
    const token = jwt.sign(
      { id: team.id, role: 'TEAM' }, 
      process.env.JWT_SECRET, 
      { expiresIn: '24h' }
    );
    return res.json({ token, role: 'TEAM' });
  }

  // 2. Try Admin Login (Email/Password)
  const admin = await prisma.administrator.findUnique({ where: { email: username } });
  if (admin) {
    const validPass = await bcrypt.compare(password, admin.passwordHash);
    if (validPass) {
      const token = jwt.sign(
        { id: admin.id, role: 'ADMIN' }, 
        process.env.JWT_SECRET, 
        { expiresIn: '24h' }
      );
      return res.json({ token, role: 'ADMIN' });
    }
  }

  res.status(401).json({ error: "Verification Failed" });
});

module.exports = router;