const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const prisma = new PrismaClient();
const { verifyToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer Setup for Assets
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'public/assets/uploads';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

/**
 * INTERNAL MIDDLEWARE: System Operational Check
 * Prevents teams from saving or generating if the Admin has halted the system.
 */
const checkOperationalStatus = async (req, res, next) => {
    const config = await prisma.hackathonConfig.findUnique({ where: { id: 1 } });
    if (config && config.isPaused) {
        return res.status(423).json({ 
            success: false, 
            message: "System Halted by Administration. Data entry currently disabled." 
        });
    }
    next();
};

// Authenticate all routes in this module
router.use(verifyToken);

/**
 * @route   GET /v1/team/profile
 * @desc    Retrieves current team profile and technical specifications.
 */
router.get('/profile', async (req, res) => {
    try {
        const teamId = req.user.id;
        if (!teamId) return res.status(400).json({ error: 'Invalid Token' });

        const team = await prisma.team.findUnique({ 
            where: { id: teamId },
            include: { submission: true } 
        });
        
        if (!team) return res.status(404).json({ error: "Identity not found." });
        
        // Find problem statement allotted to this team name or team ID
        const problemStatement = await prisma.problemStatement.findFirst({
            where: {
                OR: [
                    { allottedTo: team.teamName },
                    { allottedTo: teamId }
                ]
            }
        });
        
        res.json({ ...team, problemStatement });
    } catch (error) {
        res.status(500).json({ error: "Failed to sync with repository." });
    }
});

/**
 * @route   POST /v1/team/submission
 * @desc    Synchronizes the structured project form with the primary database.
 */
router.post('/submission', checkOperationalStatus, async (req, res) => {
    const { content } = req.body;
    const teamId = req.user.id;

    try {
        const currentStatus = await prisma.submission.findUnique({
            where: { teamId: teamId },
            select: { status: true }
        });

        if (currentStatus?.status === 'SUBMITTED' || currentStatus?.status === 'LOCKED') {
            return res.status(403).json({ 
                success: false, 
                message: "Synthesis Finalized. Manual overrides restricted." 
            });
        }

        await prisma.submission.upsert({
            where: { teamId: teamId },
            update: { content, updatedAt: new Date() },
            create: { 
                teamId: teamId, 
                content, 
                status: 'IN_PROGRESS' 
            }
        });

        res.json({ success: true, message: "System states synchronized." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Synchronization failed." });
    }
});

/**
 * @route   POST /v1/team/generate-ppt
 * @desc    Triggers the document synthesis engine (internal python service).
 */
router.post('/generate-ppt', checkOperationalStatus, async (req, res) => {
    const teamId = req.user.id;
    const tryUrls = [
        process.env.PYTHON_SERVICE_URL,
        'http://endearing-liberation.railway.internal:8000',
        'http://ppt-service.railway.internal:8000',
        'http://python-service.railway.internal:8000',
        'https://endearing-liberation-production.up.railway.app',
        'https://hackathon-production-c6be.up.railway.app'
    ].filter(Boolean);

    try {
        const team = await prisma.team.findUnique({
            where: { id: teamId },
            include: { submission: true }
        });

        if (!team.submission || !team.submission.content) {
            return res.status(400).json({ error: "Insufficient data for synthesis." });
        }

        // Check if already submitted and regeneration is not allowed
        if (team.submission.pptUrl && !team.submission.canRegenerate) {
            return res.status(403).json({ 
                error: "Submission locked. You have already generated your presentation. Contact admin for regeneration permission." 
            });
        }

        let response;
        let lastErr;

        for (const url of tryUrls) {
            try {
                console.log(`[SYNTHESIS] Attempting uplink: ${url}/generate`);
                response = await axios.post(`${url}/generate`, {
                    team_name: team.teamName,
                    college_name: team.collegeName,
                    content: team.submission.content
                }, { timeout: 15000 });

                if (response.data.success) break;
                else throw new Error(`Synthesis Logic Error: ${response.data.error}`);
            } catch (e) {
                lastErr = e;
                console.log(`[SYNTHESIS] Uplink failed at ${url}: ${e.message}`);
                if (e.message.startsWith('Synthesis Logic Error')) break;
            }
        }

        if (!response || !response.data.success) throw lastErr || new Error("All uplinks exhausted.");

        // Lock the submission after first generation
        await prisma.submission.update({
            where: { teamId: teamId },
            data: { 
                pptUrl: response.data.file_url, 
                status: 'SUBMITTED',
                canRegenerate: false, // Lock after first generation
                submittedAt: new Date()
            }
        });

        res.json({ success: true, message: "Document Synthesis Complete. Please submit your prototype link and certificate details to finalize." });

    } catch (err) {
        const tried = tryUrls.join(', ');
        const details = err.response ? `[Status ${err.response.status}] ${JSON.stringify(err.response.data)}` : err.message;
        res.status(500).json({ 
            error: err.message.startsWith('Synthesis Logic Error') ? err.message : `Synthesis Engine unreachable. Probed: ${tried}. Final Error: ${details}` 
        });
    }
});

/**
 * @route   POST /v1/team/generate-pitch-deck
 * @desc    Triggers the Expert Pitch Synthesis Engine with graphs and diagrams.
 */
// --- EXPERT PITCH SYNTHESIS ---
router.post('/generate-pitch-deck', checkOperationalStatus, async (req, res) => {
    const teamId = req.user.id;
    const projectData = req.body;
    console.log("🔍 [EXPERT SYNTHESIS DEBUG]");
    console.log("User Context:", req.user);
    console.log("Target Team ID:", teamId);
    
    if (!teamId) {
        return res.status(500).json({ error: "Authentication Context Failure: No Team ID." });
    }

    const tryUrls = [
        process.env.PYTHON_SERVICE_URL,
        'http://endearing-liberation.railway.internal:8000',
        'http://ppt-service.railway.internal:8000',
        'http://python-service.railway.internal:8000',
        'https://endearing-liberation-production.up.railway.app',
        'https://hackathon-production-c6be.up.railway.app'
    ].filter(Boolean);

    let response;
    let lastErr;

    try {
        // TEMPORARY FIX: Removed include submission to avoid schema mismatch error
        const team = await prisma.team.findUnique({
            where: { id: teamId }
        });

        /* 
        // TEMPORARY DISABLE: Schema migration pending
        if (team.submission?.pptUrl && !team.submission.canRegenerate) {
           return res.status(403).json({ error: "Submission locked..." });
        }
        */

        for (const url of tryUrls) {
            try {
                console.log(`[EXPERT SYNTHESIS] Attempting uplink: ${url}/generate-expert-pitch`);
                response = await axios.post(`${url}/generate-expert-pitch`, {
                    team_name: team.teamName,
                    college_name: team.collegeName,
                    project_data: projectData
                }, { timeout: 15000 });
                
                if (response.data.success) break;
                else {
                   // Engine reached but logic failed
                   throw new Error(`Synthesis Logic Error: ${response.data.error}`);
                }
            } catch (e) {
                lastErr = e;
                console.log(`[EXPERT SYNTHESIS] Uplink failed at ${url}: ${e.message}`);
                // If it was a logic error (we threw it above), don't try other URLs
                if (e.message.startsWith('Synthesis Logic Error')) break;
            }
        }

        if (!response || !response.data.success) throw lastErr || new Error("All expert uplinks exhausted.");

        // UPSERT WITHOUT NEW COLUMNS & STRICT SELECT
        await prisma.submission.upsert({
            where: { teamId: teamId },
            update: { 
                pptUrl: response.data.file_url, 
                status: 'SUBMITTED',
                content: projectData
            },
            create: {
                teamId: teamId,
                content: projectData,
                status: 'SUBMITTED',
                pptUrl: response.data.file_url
            },
            select: {
                id: true,
                pptUrl: true,
                status: true
            }
        });

        res.json({ success: true, message: "Expert Pitch Deck Synthesis Complete." });

    } catch (err) {
        const tried = tryUrls.join(', ');
        const details = err.response ? `[Status ${err.response.status}] ${JSON.stringify(err.response.data)}` : err.message;
        console.error("Expert Synthesis Error:", err.message);
        res.status(500).json({ 
            error: err.message.startsWith('Synthesis Logic Error') ? err.message : `Expert Synthesis Engine unreachable. Probed: ${tried}. Final Error: ${details}` 
        });
    }
});

/**
 * @route   POST /v1/team/upload-asset
 * @desc    Securely uploads binary evidence (images/screenshots) to the repository.
 */
router.post('/upload-asset', [checkOperationalStatus, upload.single('file')], async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No binary payload detected." });
        
        // Construct public URL
        const hostname = req.get('host');
        const protocol = req.protocol;
        const fileUrl = `${protocol}://${hostname}/assets/uploads/${req.file.filename}`;
        
        res.json({ success: true, fileUrl });
    } catch (error) {
        res.status(500).json({ error: "Asset persistent failure." });
    }
});

module.exports = router;