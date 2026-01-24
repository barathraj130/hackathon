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

    try {
        const team = await prisma.team.findUnique({
            where: { id: teamId },
            include: { submission: true }
        });

        if (!team.submission || !team.submission.content) {
            return res.status(400).json({ error: "Insufficient data for synthesis. Please populate all form modules." });
        }

        const content = team.submission.content;
        
        // Handle new slide format validation
        if (content.projectName || content.s2_problem) {
            // New High-Fidelity Schema detected - allow generation
            console.log("[SYNTHESIS] High-Fidelity schema detected. Proceeding.");
        } else if (content.slides && Array.isArray(content.slides)) {
            const incomplete = content.slides.filter(s => !s.content || s.content.trim().length < 10);
            if (incomplete.length > 5) { // Relax validation to encourage progress
                return res.status(400).json({ 
                    error: `Synthesis halted. Insufficient detail in ${incomplete.length} slides.` 
                });
            }
        } else {
            // Legacy/Basic validation
            if (Object.keys(content).length < 3) {
                return res.status(400).json({ error: "Insufficient data for synthesis." });
            }
        }

        // Internal call to ppt-service (Python)
        const pptServiceUrl = process.env.PYTHON_SERVICE_URL || 'https://hackathon-production-c6be.up.railway.app';
        console.log(`[SYNTHESIS] Routing request to: ${pptServiceUrl}`);
        const response = await axios.post(`${pptServiceUrl}/generate`, {
            team_name: team.teamName,
            college_name: team.collegeName,
            content: team.submission.content
        });

        await prisma.submission.update({
            where: { teamId: teamId },
            data: { 
                pptUrl: response.data.file_url, 
                status: 'SUBMITTED' 
            }
        });

        res.json({ 
            success: true, 
            message: "Document Synthesis Complete. Artifact available in repository." 
        });

    } catch (err) {
        const targetUrl = process.env.PYTHON_SERVICE_URL || 'https://hackathon-production-c6be.up.railway.app';
        console.error("Synthesis Service Error:", err.message, "Target Link:", targetUrl);
        res.status(500).json({ 
            error: `Synthesis Engine unreachable at ${targetUrl}. Ensure the Python service is active on Railway and PYTHON_SERVICE_URL is set correctly in backend variables.` 
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

    try {
        const team = await prisma.team.findUnique({
            where: { id: teamId }
        });

        const pptServiceUrl = process.env.PYTHON_SERVICE_URL || 'https://hackathon-production-c6be.up.railway.app';
        console.log(`[EXPERT SYNTHESIS] Initialization at: ${pptServiceUrl}`);
        const response = await axios.post(`${pptServiceUrl}/generate-expert-pitch`, {
            team_name: team.teamName,
            college_name: team.collegeName,
            project_data: projectData
        });

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
            }
        });

        res.json({ success: true, message: "Expert Pitch Deck Synthesis Complete." });
    } catch (err) {
        const targetUrl = process.env.PYTHON_SERVICE_URL || 'https://hackathon-production-c6be.up.railway.app';
        res.status(500).json({ error: `Expert Synthesis Engine unreachable at ${targetUrl}.` });
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