require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());

// State (In-memory for active timer, but will persist in DB via Admin controls)
let timeRemaining = 1440 * 60; // 24 Hours in seconds
let timerPaused = true;

// Initialize Timer from Database on start
async function initEngine() {
  try {
    const config = await prisma.hackathonConfig.findUnique({ where: { id: 1 } });
    if (config) {
      timeRemaining = config.durationMinutes * 60;
      timerPaused = config.isPaused;
      console.log('✅ System configuration loaded from database.');
    } else {
      console.log('⚠️ No system configuration found. Run /setup-db to initialize.');
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}
initEngine();

// Emergency Database Setup Route
app.get('/setup-db', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const email = 'admin@institution.com';
    const password = 'admin_portal_2026';
    const hash = await bcrypt.hash(password, 10);

    // 1. Create Admin
    await prisma.administrator.upsert({
      where: { email },
      update: { passwordHash: hash },
      create: { email, passwordHash: hash }
    });

    // 2. Create Config
    await prisma.hackathonConfig.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, durationMinutes: 1440, isPaused: true }
    });

    res.send(`
      <div style="font-family: sans-serif; padding: 50px; text-align: center;">
        <h1 style="color: #10b981;">✅ Database Synchronized</h1>
        <p>Admin account and system configuration have been initialized.</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 10px; display: inline-block; text-align: left;">
          <strong>Email:</strong> admin@institution.com<br>
          <strong>Password:</strong> admin_portal_2026
        </div>
        <br><br>
        <a href="${process.env.FRONTEND_URL || '#'}" style="color: #3b82f6; text-decoration: none;">Return to Login →</a>
      </div>
    `);
  } catch (error) {
    res.status(500).send(`❌ Setup failed: ${error.message}`);
  }
});

// Master Clock Loop
setInterval(async () => {
  if (!timerPaused && timeRemaining > 0) {
    timeRemaining--;
    io.emit('timerUpdate', { 
      timeRemaining, 
      timerPaused,
      formattedTime: formatDuration(timeRemaining)
    });
    
    // Auto-submission at end of 24 hours
    if (timeRemaining === 0) {
      timerPaused = true;
      io.emit('test_ended');
      // Potential logic to lock all submissions in DB
    }
  }
}, 1000);

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
}

// WebSocket Event Handling
io.on('connection', (socket) => {
  socket.emit('timerUpdate', { timeRemaining, timerPaused, formattedTime: formatDuration(timeRemaining) });

  socket.on('adminCommand', async (data) => {
    if (data.action === 'start') timerPaused = false;
    if (data.action === 'pause') timerPaused = true;
    
    // Sync to DB
    await prisma.hackathonConfig.update({
      where: { id: 1 },
      data: { isPaused: timerPaused }
    });

    io.emit('timerUpdate', { timeRemaining, timerPaused, formattedTime: formatDuration(timeRemaining) });
  });
});

// Routes
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    system: 'Synthesis Engine',
    initialized: timeRemaining !== (1440 * 60) || !timerPaused
  });
});

app.use('/v1/auth', require('./routes/auth'));
app.use('/v1/admin', require('./routes/admin'));
app.use('/v1/team', require('./routes/team'));
app.use('/v1/candidate', require('./routes/team')); // Alias for safety

// Export io for use in routes if needed
app.set('socketio', io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 SYSTEM SYNTHESIS ENGINE ONLINE`);
  console.log(`📡 Interface: http://localhost:${PORT}`);
  console.log(`⚡ WebSocket: Synchronized\n`);
});