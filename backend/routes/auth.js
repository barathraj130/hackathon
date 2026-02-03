// backend/routes/auth.js
const router = require('express').Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');

// Unified Login Endpoint
router.post('/login', async (req, res) => {
  const username = String(req.body.username || "").trim();
  const password = String(req.body.password || "").trim();
  const loginEmail = username.toLowerCase();

  console.log(`[Auth] Attempting login: ${username}`);

  // 0. EMERGENCY MASTER OVERRIDE - Absolute Priority
  if ((loginEmail === 'admin@institution.com' || loginEmail === 'admin') && password === 'HACK2026') {
      console.log(`[Auth] Master Admin login success (PRIORITY OVERRIDE): ${username}`);
      const token = jwt.sign(
        { id: 'MASTER_ADMIN_ID', role: 'ADMIN' }, 
        'INSTITUTIONAL_SYNTHESIS_SECRET_2026_MASTER', 
        { expiresIn: '24h' }
      );
      return res.json({ token, role: 'ADMIN' });
  }

  // 1. Try Team Login (Username = Team Name, Password = College Name)
  const targetTeam = await prisma.team.findFirst({
    where: { 
      teamName: {
        equals: username,
        mode: 'insensitive'
      }
    }
  });

  if (targetTeam) {
    // SECURITY: Use case-sensitive matching for college names (team passwords)
    if (targetTeam.collegeName === password) {
      console.log(`[Auth] Team login success: ${username}`);
      const token = jwt.sign(
        { id: targetTeam.id, role: 'TEAM', teamName: targetTeam.teamName }, 
        'INSTITUTIONAL_SYNTHESIS_SECRET_2026_MASTER', 
        { expiresIn: '24h' }
      );
      return res.json({ token, role: 'TEAM' });
    } else {
      console.log(`[Auth] Team login FAILED (Password Mismatch): ${username} (Expected: ${targetTeam.collegeName}, Got: ${password})`);
    }
  }

  const admin = await prisma.admin.findUnique({ where: { email: loginEmail } });
  if (admin) {
    const validPass = await bcrypt.compare(password, admin.password);
    if (validPass) {
      console.log(`[Auth] Admin login success: ${username}`);
      const token = jwt.sign(
        { id: admin.id, role: 'ADMIN' }, 
        'INSTITUTIONAL_SYNTHESIS_SECRET_2026_MASTER', 
        { expiresIn: '24h' }
      );
      return res.json({ token, role: 'ADMIN' });
    } else {
      console.log(`[Auth] Admin login FAILED (Invalid Password): ${username}`);
    }
  } else {
    console.log(`[Auth] Admin login FAILED (User Not Found): ${username}`);
  }

  res.status(401).json({ error: "Verification Failed" });
});

module.exports = router;