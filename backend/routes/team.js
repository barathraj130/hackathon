const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const prisma = new PrismaClient();
const { verifyToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * TECHNICAL OVERRIDE: Institutional Host Mapping
 * Converts restricted internal DNS routes to public production repositories.
 */
const mapInternalToPublic = (internalUrl) => {
    if (!internalUrl) return internalUrl;
    return internalUrl
        .replace('python-service.railway.internal:8000', 'endearing-liberation-production.up.railway.app')
        .replace('endearing-liberation.railway.internal:8000', 'endearing-liberation-production.up.railway.app')
        .replace('ppt-service.railway.internal:8000', 'hackathon-production-c6be.up.railway.app')
        .replace('http://', 'https://'); // Enforce high-security SSL
};

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
        
        console.log(`🔍 [PROFILE SYNC] Team: ${team.teamName}, Artifact: ${team.submission?.pptUrl || 'NONE'}`);
        
        // Return a flattened, clean object
        res.json({
            id: team.id,
            teamName: team.teamName,
            collegeName: team.collegeName,
            submission: team.submission, // Still nested but explicit
            problemStatement
        });
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
    ].filter(Boolean).map(u => u.replace(/\/$/, ""));

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
        let successfulHost;

        for (const url of tryUrls) {
            try {
                console.log(`[SYNTHESIS] Attempting uplink: ${url}/generate`);
                response = await axios.post(`${url}/generate`, {
                    team_name: team.teamName,
                    college_name: team.collegeName,
                    content: team.submission.content
                }, { timeout: 15000 });

                if (response.data.success) {
                    successfulHost = url;
                    break;
                }
                else throw new Error(`Synthesis Logic Error: ${response.data.error}`);
            } catch (e) {
                lastErr = e;
                console.log(`[SYNTHESIS] Uplink failed at ${url}: ${e.message}`);
                if (e.message.startsWith('Synthesis Logic Error')) break;
            }
        }

        if (!response || !response.data.success) throw lastErr || new Error("All uplinks exhausted.");

        console.log("📝 [SYNTHESIS SUCCESS] Response Data:", response.data);
        const rawPath = response.data.file_url;
        if (!rawPath) throw new Error("Artifact URL missing from engine response.");

        // Construct Absolute verified URL
        // If engine returns "ppt_outputs/name.pptx", we need to serve it via "/outputs/name.pptx"
        const fileName = rawPath.split('/').pop();
        const finalPptUrl = mapInternalToPublic(`${successfulHost}/outputs/${fileName}`);

        // Lock the submission after first generation with redundant verification
        try {
            await prisma.submission.update({
                where: { teamId: teamId },
                data: { 
                    pptUrl: finalPptUrl, 
                    status: 'SUBMITTED',
                    canRegenerate: false,
                    submittedAt: new Date()
                }
            });
            console.log(`✅ [REPOSITORY] Artifact persisted: ${finalPptUrl}`);
        } catch (dbSaveErr) {
            console.error("❌ [REPOSITORY ERROR] Failed to persist artifact:", dbSaveErr.message);
            throw new Error(`Technical vault persistence failure: ${dbSaveErr.message}`);
        }

        // Fetch the final state to return to frontend
        const finalSubmission = await prisma.submission.findUnique({
            where: { teamId: teamId }
        });

        res.json({ 
            success: true, 
            message: "Document Synthesis Complete.",
            submission: finalSubmission
        });

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
    ].filter(Boolean).map(u => u.replace(/\/$/, ""));

    let response;
    let lastErr;

    try {
        const team = await prisma.team.findUnique({
            where: { id: teamId },
            include: { submission: true }
        });

        // Check if already submitted and regeneration is not allowed
        if (team.submission?.pptUrl && !team.submission.canRegenerate) {
            return res.status(403).json({ 
                error: "Submission locked. You have already generated your presentation. Contact admin for regeneration permission." 
            });
        }

        let successfulHost;
        for (const url of tryUrls) {
            try {
                console.log(`[EXPERT SYNTHESIS] Attempting uplink: ${url}/generate-expert-pitch`);
                response = await axios.post(`${url}/generate-expert-pitch`, {
                    team_name: team.teamName,
                    college_name: team.collegeName,
                    project_data: projectData
                }, { timeout: 15000 });
                
                if (response.data.success) {
                    successfulHost = url;
                    break;
                }
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

        console.log("🌟 [EXPERT SUCCESS] Response Data:", response.data);
        const rawFileName = response.data.file_url;
        if (!rawFileName) throw new Error("Expert artifact URL missing from engine response.");

        // Construct Absolute verified URL
        const finalExpertUrl = mapInternalToPublic(`${successfulHost}/outputs/${rawFileName.split('/').pop()}`);

        // Lock the submission after first generation
        try {
            await prisma.submission.upsert({
                where: { teamId: teamId },
                update: { 
                    pptUrl: finalExpertUrl, 
                    status: 'SUBMITTED',
                    content: projectData,
                    canRegenerate: false,
                    submittedAt: new Date()
                },
                create: {
                    teamId: teamId,
                    content: projectData,
                    status: 'SUBMITTED',
                    pptUrl: finalExpertUrl,
                    canRegenerate: false,
                    submittedAt: new Date()
                }
            });
            console.log(`✅ [REPOSITORY] Expert Artifact persisted: ${finalExpertUrl}`);
        } catch (dbSaveErr) {
            console.error("❌ [REPOSITORY ERROR] Failed to persist expert artifact:", dbSaveErr.message);
            throw new Error(`Expert vaulted persistence failure: ${dbSaveErr.message}`);
        }

        // Fetch the final state to return to frontend
        const finalSubmission = await prisma.submission.findUnique({
            where: { teamId: teamId }
        });

        res.json({ 
            success: true, 
            message: "Expert Pitch Deck Synthesis Complete.",
            submission: finalSubmission
        });

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