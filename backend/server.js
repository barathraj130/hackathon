require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const { Server } = require('socket.io');
const prisma = require('./utils/prisma');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Middleware
app.use(cors());
app.use(express.json());
// Ensure robust absolute path resolution for static assets
app.use(express.static(path.join(__dirname, 'public')));

// Specific handler for missing prototypes (post-restart)
app.get('/prototypes/:filename', (req, res) => {
    res.status(404).json({
        error: "Prototype Missing",
        detail: "The actual file was lost due to a server restart (ephemeral storage). Please ask the team to re-upload their prototype file."
    });
});

// Request Logging Middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] Incoming Request: ${req.method} ${req.url}`);
  next();
});

// State (In-memory for active timer, but will persist in DB via Admin controls)
let timeRemaining = 1440 * 60; // 24 Hours in seconds
let timerPaused = true;

// Export timer state management for admin routes
// SYSTEM VERSION: 2.1.0-restrict-fix
const getTimerState = () => ({ timeRemaining, timerPaused });
const setTimerPaused = (value) => { timerPaused = value; };
const setTimeRemaining = (value) => { timeRemaining = value; };

// System Authority Routes
app.get('/v1/sys/status', (req, res) => {
    res.json({
        status: 'online',
        version: '2.2.0-reviewer-beta',
        timestamp: new Date().toISOString()
    });
});

// Initialize Timer from Database on start
async function initEngine() {
  try {
    const config = await prisma.hackathonConfig.findUnique({ where: { id: 1 } });
    if (config) {
      timeRemaining = config.durationMinutes * 60;
      // Institutional Protocol: ALWAYS start paused on server boot to allow manual admin oversight
      timerPaused = true; 
      console.log('✅ System configuration loaded (Timer initialized to PAUSED).');
    } else {
      console.log('🚀 No system configuration found. Initializing Admin account...');
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('admin_portal_2026', 10);
      
      await prisma.admin.upsert({
        where: { email: 'admin' },
        update: { password: hash },
        create: { email: 'admin', password: hash }
      });

      await prisma.hackathonConfig.upsert({
        where: { id: 1 },
        update: {},
        create: { id: 1, durationMinutes: 1440, isPaused: true }
      });
      console.log('✅ Default Admin account created: admin');
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}
// Initialized later in background
// initEngine(); 

// Emergency Database Setup Route
app.get('/setup-db', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const email = 'admin';
    const password = 'admin_portal_2026';
    const hash = await bcrypt.hash(password, 10);

    // 1. Create Admin
    await prisma.admin.upsert({
      where: { email },
      update: { password: hash },
      create: { email, password: hash }
    });

    // 2. Create Config
    await prisma.hackathonConfig.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, durationMinutes: 1440, isPaused: true }
    });

    // 3. Create Reviewer Tables & Seed
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Reviewer" (
        "id" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "password" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "domain" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Reviewer_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "Reviewer_email_key" UNIQUE ("email")
      );
    `);
    
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Score" (
        "id" TEXT NOT NULL,
        "submissionId" TEXT NOT NULL,
        "reviewerId" TEXT NOT NULL,
        "innovation" INTEGER NOT NULL DEFAULT 0,
        "feasibility" INTEGER NOT NULL DEFAULT 0,
        "techStack" INTEGER NOT NULL DEFAULT 0,
        "presentation" INTEGER NOT NULL DEFAULT 0,
        "impact" INTEGER NOT NULL DEFAULT 0,
        "total" INTEGER NOT NULL DEFAULT 0,
        "comments" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Score_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "Score_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT "Score_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "Reviewer"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT "Score_submissionId_reviewerId_key" UNIQUE ("submissionId", "reviewerId")
      );
    `);

    const { v4: uuidv4 } = require('uuid');
    const rEmail = 'reviewer';
    const rPass = await bcrypt.hash('review2026', 10);
    const newReviewerId = uuidv4();
    
    await prisma.$executeRawUnsafe(`
      INSERT INTO "Reviewer" ("id", "email", "password", "name", "createdAt")
      VALUES ('${newReviewerId}', '${rEmail}', '${rPass}', 'Lead Reviewer', NOW())
      ON CONFLICT ("email") DO UPDATE SET "password" = '${rPass}';
    `);

    res.send(`
      <div style="font-family: sans-serif; padding: 50px; text-align: center;">
        <h1 style="color: #10b981;">✅ Database Synchronized</h1>
        <p>Admin and Reviewer accounts have been initialized with SIMPLIFIED Usernames.</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 10px; display: inline-block; text-align: left;">
          <strong>Admin Username:</strong> admin<br>
          <strong>Admin Password:</strong> admin_portal_2026<br>
          <hr style="opacity: 0.2; margin: 10px 0;">
          <strong>Reviewer Username:</strong> reviewer<br>
          <strong>Reviewer Password:</strong> review2026
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
app.get('/health', (req, res) => res.status(200).send('OK'));

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
app.use('/v1/team', require('./routes/submission-workflow')); // Prototype and certificate submission
app.use('/v1/candidate', require('./routes/team')); // Alias for safety
app.use('/v1/reviewer', require('./routes/reviewer')); // Reviewer Portal Routes

// Export io and timer state for use in routes
app.set('socketio', io);
app.set('timerState', { getTimerState, setTimerPaused, setTimeRemaining });

// Start Server Immediately
const PORT = process.env.PORT || 3000;
console.log(`[STARTUP] ENV PORT: ${process.env.PORT}`);
console.log(`[STARTUP] Resolved PORT: ${PORT}`);

server.listen(PORT, '0.0.0.0', async () => { // Changed to async to allow await inside
  console.log(`\n🚀 SYSTEM SYNTHESIS ENGINE ONLINE`);
  console.log(`📡 Listening on: http://0.0.0.0:${PORT}`);
  
  // EMERGENCY DB SYNC: Force columns using Native SQL to bypass migration issues
  try {
    console.log("🛠 Checking Database Integrity...");
    await prisma.$executeRawUnsafe(`ALTER TABLE "Submission" ADD COLUMN IF NOT EXISTS "canRegenerate" BOOLEAN DEFAULT true;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Submission" ADD COLUMN IF NOT EXISTS "prototypeUrl" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Submission" ADD COLUMN IF NOT EXISTS "certificateName" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Submission" ADD COLUMN IF NOT EXISTS "certificateCollege" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Submission" ADD COLUMN IF NOT EXISTS "certificateYear" INTEGER;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Submission" ADD COLUMN IF NOT EXISTS "submittedAt" TIMESTAMP WITH TIME ZONE;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Team" ADD COLUMN IF NOT EXISTS "selectedProblemId" TEXT;`);
    
    // EMERGENCY HACKATHON CONFIG UPGRADE
    await prisma.$executeRawUnsafe(`ALTER TABLE "HackathonConfig" ADD COLUMN IF NOT EXISTS "allowCertificateDetails" BOOLEAN DEFAULT false;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "HackathonConfig" ADD COLUMN IF NOT EXISTS "eventEnded" BOOLEAN DEFAULT false;`);

    // EMERGENCY TABLE RECOVERY: Ensure ParticipantCertificate exists
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "ParticipantCertificate" (
          "id" TEXT NOT NULL,
          "submissionId" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "college" TEXT NOT NULL,
          "year" TEXT NOT NULL,
          "dept" TEXT NOT NULL,
          "role" TEXT NOT NULL,
          "certificateUrl" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "ParticipantCertificate_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "ParticipantCertificate_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE
        );
      `);
      console.log("🏅 Certification Registry Verified.");
    } catch (certTblErr) {
      console.warn("⚠️ Certification Registry Warning:", certTblErr.message);
    }
    
    // EMERGENCY TABLE RECOVERY: Ensure ProblemStatement exists
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "ProblemStatement" (
          "id" TEXT NOT NULL,
          "questionNo" TEXT NOT NULL,
          "subDivisions" TEXT,
          "title" TEXT NOT NULL,
          "description" TEXT NOT NULL,
          "allottedTo" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "ProblemStatement_pkey" PRIMARY KEY ("id")
        );
      `);
      console.log("📑 Challenge Registry Verified.");
    } catch (tblErr) {
      console.warn("⚠️ Registry Sync Warning:", tblErr.message);
    }

    // EVALUATION PROTOCOLS: Reviewer & Score Tables
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Reviewer" (
          "id" TEXT NOT NULL,
          "email" TEXT NOT NULL,
          "password" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "domain" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Reviewer_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "Reviewer_email_key" UNIQUE ("email")
        );
      `);
      
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Score" (
          "id" TEXT NOT NULL,
          "submissionId" TEXT NOT NULL,
          "reviewerId" TEXT NOT NULL,
          "innovation" INTEGER NOT NULL DEFAULT 0,
          "feasibility" INTEGER NOT NULL DEFAULT 0,
          "techStack" INTEGER NOT NULL DEFAULT 0,
          "presentation" INTEGER NOT NULL DEFAULT 0,
          "impact" INTEGER NOT NULL DEFAULT 0,
          "total" INTEGER NOT NULL DEFAULT 0,
          "comments" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Score_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "Score_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
          CONSTRAINT "Score_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "Reviewer"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
          CONSTRAINT "Score_submissionId_reviewerId_key" UNIQUE ("submissionId", "reviewerId")
        );
      `);
      console.log("⚖️ Evaluation Matrix Deployed.");
    } catch (evalErr) {
      console.warn("⚠️ Evaluation Sync Warning:", evalErr.message);
    }
    
    // REPOSITORY RECALIBRATION: Fix legacy relative PPT links to absolute verified paths
    try {
      console.log("📂 Recalibrating Artifact Repository...");
      await prisma.$executeRawUnsafe(`
        UPDATE "Submission" 
        SET "pptUrl" = 'https://endearing-liberation-production.up.railway.app/outputs/' || LOWER(split_part("pptUrl", '/', 2))
        WHERE "pptUrl" LIKE 'ppt_outputs/%';
      `);
      console.log("✅ Relative URLs converted to absolute verified paths.");
    } catch (recalcErr) {
      console.warn("⚠️ Recalibration Warning:", recalcErr.message);
    }

    console.log("✅ Database Integrity Verified.");

    // AUTO-SEED ADMIN: Ensure admin exists
    try {
      const bcrypt = require('bcryptjs');
      const adminEmail = 'admin';
      const adminPassword = 'admin_portal_2026';
      const hash = await bcrypt.hash(adminPassword, 10);
      
      await prisma.admin.upsert({
        where: { email: adminEmail },
        update: { password: hash }, // Force update to ensure password matches env
        create: {
          email: adminEmail,
          password: hash
        }
      });
      console.log("👤 Administrative Profile Secured: admin");
    } catch (seedErr) {
      console.warn("⚠️ Admin Seed Warning:", seedErr.message);
    }

    // AUTO-SEED REVIEWER: reviewer / review2026
    try {
      const { v4: uuidv4 } = require('uuid');
      const bcrypt = require('bcryptjs');
      const rEmail = 'reviewer';
      const rPass = await bcrypt.hash('review2026', 10);
      const newReviewerId = uuidv4();
      
      // Check if exists because ON CONFLICT syntax varies or might be tricky with ID generation
      // Actually Postgres supports ON CONFLICT
      await prisma.$executeRawUnsafe(`
        INSERT INTO "Reviewer" ("id", "email", "password", "name", "createdAt")
        VALUES ('${newReviewerId}', '${rEmail}', '${rPass}', 'Lead Reviewer', NOW())
        ON CONFLICT ("email") DO UPDATE SET "password" = '${rPass}';
      `);
      console.log("🧐 Reviewer Access Granted: reviewer");
    } catch (rSeedErr) {
       console.warn("⚠️ Reviewer Seed Warning:", rSeedErr.message);
    }
  } catch (dbErr) {
    console.warn("⚠️ Native Sync Warning (Non-critical):", dbErr.message);
  }

  // Initialize Database in background after listening
  console.log('⏳ Connecting to database in background...');
  initEngine();
});

// Explicit Health Check for Railway
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});