const router = require('express').Router();
const prisma = require('../utils/prisma');
const axios = require('axios');
const { verifyToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * TECHNICAL OVERRIDE: Institutional Host Mapping
 * Converts restricted internal DNS routes to public production repositories.
 */
const mapInternalToPublic = (url) => {
    if (!url) return url;
    // REGEX OVERRIDE: Neutralize all internal DNS variants (Docker, Railway, etc.)
    return url
        .replace(/([a-zA-Z0-9-]+\.)+railway\.internal(:\d+)?/, (match) => {
            if (match.includes('python') || match.includes('liberation') || match.includes('ppt')) 
                return 'endearing-liberation-production.up.railway.app';
            return 'hackathon-production-c6be.up.railway.app';
        })
        .replace(/ppt-service:8000/, 'endearing-liberation-production.up.railway.app')
        .replace('http://', 'https://'); 
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
            include: { 
                submission: {
                    include: { certificates: true }
                }
            } 
        });
        
        if (!team) return res.status(404).json({ error: "Identity not found." });
        
        const config = await prisma.hackathonConfig.findUnique({ where: { id: 1 } });

        const problemStatements = await prisma.problemStatement.findMany({
            where: {
                OR: [
                    { allottedTo: team.teamName },
                    { allottedTo: teamId }
                ]
            }
        });
        
        let selectedProblem = null;
        if (team.selectedProblemId) {
            selectedProblem = problemStatements.find(p => p.id === team.selectedProblemId);
        }
        
        res.json({
            id: team.id,
            teamName: team.teamName,
            collegeName: team.collegeName,
            leaderName: team.member1, 
            member1: team.member2,    
            submission: team.submission,
            problemStatements: problemStatements,
            selectedProblem: selectedProblem,
            selectedProblemId: team.selectedProblemId,
            config: {
                allowCertificateDetails: config?.allowCertificateDetails || false,
                eventEnded: config?.eventEnded || false,
                isPaused: config?.isPaused || false
            },
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
        'http://ppt-service:8000',
        'http://ppt-service.railway.internal:8000',
        'http://endearing-liberation.railway.internal:8000',
        'https://endearing-liberation-production.up.railway.app'
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

        const endpoints = ['/generate-artifact', '/generate', '/api/generate-artifact']; 
        let successfulHost;
        let finalError = "No connection established to institutional synthesis cluster.";
        let response = null; // Initialize response

        outerLoop: for (const url of tryUrls) {
            const cleanHost = url.replace(/\/$/, "");
            for (const endpoint of endpoints) {
                try {
                    console.log(`[SYNTHESIS] Probing: ${cleanHost}${endpoint}`);
                    const res = await axios.post(`${cleanHost}${endpoint}`, {
                        team_name: team.teamName,
                        college_name: team.collegeName,
                        content: team.submission.content
                    }, { timeout: 60000 });
    
                    if (res.data && res.data.success) {
                        response = res;
                        successfulHost = cleanHost;
                        console.log(`✅ [SYNTHESIS] Success: ${cleanHost}${endpoint}`);
                        break outerLoop; 
                    } else {
                        const msg = res.data?.error || "Unknown Synthesis Detail";
                        console.warn(`[SYNTHESIS] Logic Fail: ${cleanHost}${endpoint} -> ${msg}`);
                        finalError = `Synthesis Logic Failure: ${msg} at ${cleanHost}${endpoint}`;
                    }
                } catch (e) {
                    const status = e.response ? `[Status ${e.response.status}]` : '[Network]';
                    const detail = e.response?.data?.detail || e.message;
                    console.warn(`[SYNTHESIS] Connect Fail: ${cleanHost}${endpoint} -> ${status} ${detail}`);
                    finalError = `${status} ${detail} at ${cleanHost}${endpoint}`;
                }
            }
        }

        if (!response || !response.data.success) throw new Error(`Synthesis Engine unreachable. Detail: ${finalError}`);

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
        console.error("❌ Synthesis Context Failure:", err.message);
        const details = err.response ? `[Status ${err.response.status}] ${JSON.stringify(err.response.data)}` : err.message;
        res.status(500).json({ 
            error: `Synthesis Engine Problem. Detail: ${details}` 
        });
    }
});

/**
 * @route   POST /v1/team/save-draft
 * @desc    Saves current form state without generating artifact.
 */
router.post('/save-draft', async (req, res) => {
    try {
        const teamId = req.user.id;
        const projectData = req.body;
        
        await prisma.submission.upsert({
            where: { teamId },
            update: { content: projectData },
            create: { 
                teamId, 
                content: projectData,
                status: 'IN_PROGRESS' 
            }
        });

        res.json({ success: true, message: "Draft Secured" });
    } catch (err) {
        console.error("Draft Save Fail:", err);
        res.status(500).json({ error: "Persistence Failure" });
    }
});

/**
 * @route   POST /v1/team/generate-pitch-deck
 * @desc    Triggers the Expert Pitch Synthesis Engine with graphs and diagrams.
 */
// --- EXPERT PITCH SYNTHESIS ---
router.post('/generate-pitch-deck', checkOperationalStatus, async (req, res) => {
    try {
        const teamId = req.user.id;
        const projectData = req.body;
        console.log("🔍 [EXPERT SYNTHESIS DEBUG] Team ID:", teamId);
        
        if (!teamId) return res.status(500).json({ error: "Authentication Context Failure: No Team ID." });

        const team = await prisma.team.findUnique({
            where: { id: teamId },
            include: { submission: true }
        });

        if (!team) return res.status(404).json({ error: "Team profile not found in institutional vault." });

        // Check if already submitted and regeneration is not allowed
        if (team.submission?.pptUrl && !team.submission.canRegenerate) {
            return res.status(403).json({ 
                error: "Submission locked. You have already generated your presentation. Contact admin for regeneration permission." 
            });
        }

        const tryUrls = [
            process.env.PYTHON_SERVICE_URL,
            'http://ppt-service:8000',
            'http://ppt-service.railway.internal:8000',
            'http://endearing-liberation.railway.internal:8000',
            'https://endearing-liberation-production.up.railway.app'
        ].filter(Boolean);

        const endpoints = ['/generate-artifact', '/generate-expert-pitch', '/api/generate-artifact']; 
        let successfulHost;
        let finalError = "No connection established to institutional expert synthesis cluster.";
        let response = null;

        outerLoop: for (const url of tryUrls) {
            const cleanHost = url.replace(/\/$/, "");
            for (const endpoint of endpoints) {
                try {
                    console.log(`[EXPERT] Probing: ${cleanHost}${endpoint}`);
                    const res = await axios.post(`${cleanHost}${endpoint}`, {
                        team_name: projectData.teamName || team.teamName,
                        college_name: projectData.institutionName || team.collegeName,
                        project_data: projectData
                    }, { timeout: 180000 });
                    
                    if (res.data && res.data.success) {
                        response = res;
                        successfulHost = cleanHost;
                        console.log(`✅ [EXPERT] Success: ${cleanHost}${endpoint}`);
                        break outerLoop;
                    } else {
                        const msg = res.data?.error || "Unknown Synthesis Detail";
                        finalError = `Expert Synthesis Logic Failure: ${msg} at ${cleanHost}${endpoint}`;
                    }
                } catch (e) {
                    const status = e.response ? `[Status ${e.response.status}]` : '[Network]';
                    const detail = e.response?.data?.detail || e.message;
                    finalError = `${status} ${detail} at ${cleanHost}${endpoint}`;
                }
            }
        }
        
        if (!response || !response.data.success) throw new Error(`Expert Synthesis Cluster Unreachable. Detail: ${finalError}`);

        console.log("🌟 [EXPERT SUCCESS] Response Data:", response.data);
        const rawFileName = response.data.file_url;
        if (!rawFileName) throw new Error("Expert artifact URL missing from engine response.");

        // Construct Absolute verified URL
        const finalExpertUrl = mapInternalToPublic(`${successfulHost}/outputs/${rawFileName.split('/').pop()}`);

        // Lock the submission after synthesis
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

        const finalSubmission = await prisma.submission.findUnique({
            where: { teamId: teamId }
        });

        res.json({ 
            success: true, 
            message: "Expert Pitch Deck Synthesis Complete.",
            submission: finalSubmission
        });

    } catch (err) {
        console.error("❌ Expert Synthesis Failure:", err.message);
        const details = err.response ? `[Status ${err.response.status}] ${JSON.stringify(err.response.data)}` : err.message;
        res.status(500).json({ 
            error: `Expert Synthesis Engine Problem. Detail: ${details}` 
        });
    }
});

/**
 * @route   POST /v1/team/certificate-details
 * @desc    Submit participant details for certificate generation.
 */
router.post('/certificate-details', async (req, res) => {
    try {
        const teamId = req.user.id;
        const { participants } = req.body; // Array of { name, college, year, dept, role }

        const config = await prisma.hackathonConfig.findUnique({ where: { id: 1 } });
        if (!config || !config.allowCertificateDetails) {
            return res.status(403).json({ error: "Certificate collection is not open yet." });
        }

        const submission = await prisma.submission.findUnique({ where: { teamId } });
        if (!submission) return res.status(404).json({ error: "Submission not found." });

        // Atomic Reset: Purge existing and rebuild
        await prisma.participantCertificate.deleteMany({
            where: { submissionId: submission.id }
        });

        await prisma.participantCertificate.createMany({
            data: participants.map(p => ({
                ...p,
                submissionId: submission.id
            }))
        });

        res.json({ success: true, message: "Credentials synchronized with internal vault." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Vault Error" });
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

/**
 * @route   POST /v1/team/select-question
 * @desc    Sets the selected problem for the team from their allotted options.
 */
router.post('/select-question', checkOperationalStatus, async (req, res) => {
    const { problemId } = req.body;
    const teamId = req.user.id;
    
    try {
        const team = await prisma.team.findUnique({ where: { id: teamId } });
        if (!team) return res.status(404).json({ error: "Team not found." });
        
        // Verify this problem is allotted to the team
        const ps = await prisma.problemStatement.findUnique({ where: { id: problemId } });
        if (!ps || (ps.allottedTo !== team.teamName && ps.allottedTo !== teamId)) {
            return res.status(403).json({ error: "This question is not allotted to your team." });
        }
        
        await prisma.team.update({
            where: { id: teamId },
            data: { selectedProblemId: problemId }
        });
        
        res.json({ success: true, message: "Question selected successfully." });
    } catch (e) { res.status(500).json({ error: "Selection failed." }); }
});

module.exports = router;