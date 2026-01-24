const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const prisma = new PrismaClient();
const { verifyToken } = require('../middleware/auth');

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
        
        res.json(team);
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
        const requiredFields = ['title', 'abstract', 'problem', 'solution', 'architecture', 'technologies', 'impact', 'outcome'];
        const missing = requiredFields.filter(f => !content[f] || content[f].length < 2);

        if (missing.length > 0) {
            return res.status(400).json({ 
                error: `Synthesis halted. Incomplete modules: ${missing.join(', ')}. Please fill these out and sync before generating.` 
            });
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
router.post('/generate-pitch-deck', checkOperationalStatus, async (req, res) => {
    const teamId = req.user.id;
    const projectData = req.body;

    try {
        const team = await prisma.team.findUnique({
            where: { id: teamId }
        });

        // External call to ppt-service (Python) specialized endpoint
        const pptServiceUrl = process.env.PYTHON_SERVICE_URL || 'https://hackathon-production-c6be.up.railway.app';
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
                content: projectData // Store the full pitch data
            },
            create: {
                teamId: teamId,
                content: projectData,
                status: 'SUBMITTED',
                pptUrl: response.data.file_url
            }
        });

        res.json({ 
            success: true, 
            message: "Expert Pitch Deck Synthesis Complete." 
        });

    } catch (err) {
        const targetUrl = process.env.PYTHON_SERVICE_URL || 'https://hackathon-production-c6be.up.railway.app';
        console.error("Expert Synthesis Error:", err.message, "Target Link:", targetUrl);
        res.status(500).json({ 
            error: `Expert Synthesis Engine unreachable at ${targetUrl}. Ensure the Python service is active on Railway.` 
        });
    }
});

module.exports = router;