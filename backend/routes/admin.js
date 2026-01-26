const express = require('express');
const router = express.Router();
const axios = require('axios');
const prisma = require('../utils/prisma');
const { exec } = require('child_process');

/**
 * TECHNICAL OVERRIDE: Institutional Host Mapping
 * Converts restricted internal DNS routes to public production repositories.
 */
const mapInternalToPublic = (url) => {
    if (!url) return url;
    // REGEX OVERRIDE: Neutralize all internal railway DNS variants
    return url
        .replace(/([a-zA-Z0-9-]+\.)+railway\.internal(:\d+)?/, (match) => {
            if (match.includes('python') || match.includes('liberation')) 
                return 'endearing-liberation-production.up.railway.app';
            return 'hackathon-production-c6be.up.railway.app';
        })
        .replace('http://', 'https://'); 
};

// Import the correct functions from your middleware folder
const { verifyToken, isAdmin } = require('../middleware/auth');

// Apply protection to all routes in this file
router.use(verifyToken);
router.use(isAdmin);

/**
 * MANUAL MIGRATION TRIGGER
 */
router.post('/run-migration', (req, res) => {
    console.log("⚠️ Starting Manual Migration...");
    exec('npx prisma migrate deploy', (error, stdout, stderr) => {
        if (error) {
            console.error(`Migration Error: ${error.message}`);
            return res.status(500).json({ error: error.message, stderr });
        }
        if (stderr) {
            console.error(`Migration Stderr: ${stderr}`);
        }
        console.log(`Migration Output: ${stdout}`);
        res.json({ success: true, stdout, stderr });
    });
});

/**
 * TOGGLE SYSTEM HALT (REST API)
 */
router.post('/toggle-halt', async (req, res) => {
    try {
        let config = await prisma.hackathonConfig.findUnique({ where: { id: 1 } });
        if (!config) {
            config = await prisma.hackathonConfig.create({
                data: { id: 1, durationMinutes: 1440, isPaused: true }
            });
        }
        const newStatus = !config.isPaused;
        
        await prisma.hackathonConfig.update({
            where: { id: 1 },
            data: { isPaused: newStatus }
        });

        const io = req.app.get('socketio');
        const timerState = req.app.get('timerState');
        
        let currentTimeRemaining = config.durationMinutes * 60;
        if (timerState) {
            timerState.setTimerPaused(newStatus);
            currentTimeRemaining = timerState.getTimerState().timeRemaining;
        }
        
        if (io) {
            const formatDuration = (seconds) => {
                const h = Math.floor(seconds / 3600);
                const m = Math.floor((seconds % 3600) / 60);
                const s = seconds % 60;
                return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
            };
            io.emit('timerUpdate', { 
                timerPaused: newStatus,
                timeRemaining: currentTimeRemaining,
                formattedTime: formatDuration(currentTimeRemaining)
            });
        }

        res.json({ success: true, isPaused: newStatus });
    } catch (error) {
        res.status(500).json({ error: "Failed to toggle system status." });
    }
});

/**
 * TOGGLE CERTIFICATE COLLECTION
 */
router.post('/toggle-certificate-collection', async (req, res) => {
    try {
        const config = await prisma.hackathonConfig.findUnique({ where: { id: 1 } });
        const newState = !config.allowCertificateDetails;
        await prisma.hackathonConfig.update({
            where: { id: 1 },
            data: { allowCertificateDetails: newState }
        });
        res.json({ success: true, allowCertificateDetails: newState });
    } catch (error) {
        res.status(500).json({ error: "Failed to update state." });
    }
});

/**
 * 1. GET DASHBOARD STATS
 */
router.get('/dashboard', async (req, res) => {
    try {
        const totalTeams = await prisma.team.count();
        const submissions = await prisma.submission.findMany({
            include: { certificates: true }
        });
        const config = await prisma.hackathonConfig.findUnique({ where: { id: 1 } });

        const stats = {
            total_candidates: totalTeams,
            statuses: {
                not_started: totalTeams - submissions.length,
                in_progress: submissions.filter(s => s.status === 'IN_PROGRESS').length,
                submitted: submissions.filter(s => s.status === 'SUBMITTED').length
            },
            certificates: {
                collected: submissions.filter(s => s.certificates.length > 0).length,
                pending: submissions.length - submissions.filter(s => s.certificates.length > 0).length
            },
            config: config
        };

        res.json(stats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch stats" });
    }
});

/**
 * 2. GET ALL TEAMS (CANDIDATES)
 */
router.get('/candidates', async (req, res) => {
    try {
        const teams = await prisma.team.findMany({
            include: { submission: true }
        });

        const formattedTeams = teams.map(t => ({
            id: t.id,
            teamName: t.teamName,
            collegeName: t.collegeName,
            member1: t.member1,
            member2: t.member2,
            status: t.submission?.status || 'NOT_STARTED',
            progressPercentage: calculateProgress(t.submission),
            lastSaved: t.submission?.updatedAt || null
        }));

        res.json({ candidates: formattedTeams });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch teams" });
    }
});

/**
 * 3. CREATE NEW TEAM
 */
router.post('/create-team', async (req, res) => {
    const { teamName, collegeName, member1, member2, dept, year, problemStatementId } = req.body;
    try {
        const newTeam = await prisma.team.create({
            data: {
                teamName,
                collegeName,
                member1,
                member2,
                dept,
                year: parseInt(year)
            }
        });

        // If a problem statement was selected, allot it immediately
        if (problemStatementId) {
            await prisma.problemStatement.update({
                where: { id: problemStatementId },
                data: { allottedTo: teamName }
            });
            console.log(`🎯 Challenge Q.${problemStatementId} allotted to ${teamName}`);
        }

        res.json({ success: true, team: newTeam });
    } catch (error) {
        console.error("Team Creation Error:", error);
        res.status(400).json({ error: "Team name already exists or system conflict" });
    }
});

/**
 * 4. SET HACKATHON CONFIG (Timer, PPT Structure, etc)
 */
router.post('/test-config', async (req, res) => {
    const { durationMinutes, pptConfig, footerText, collegeLogo, eventTheme } = req.body;
    try {
        const config = await prisma.hackathonConfig.upsert({
            where: { id: 1 },
            update: { 
                durationMinutes, 
                pptConfig, 
                footerText,
                collegeLogo,
                eventTheme
            },
            create: { 
                id: 1, 
                durationMinutes, 
                pptConfig, 
                footerText,
                collegeLogo,
                eventTheme
            }
        });
        res.json({ success: true, config });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to update infrastructure parameters." });
    }
});

/**
 * 5. DELETE TEAM (REVOKE CREDENTIALS)
 */
router.delete('/teams/:id', async (req, res) => {
    const teamId = req.params.id;
    try {
        // First delete any associated submissions
        await prisma.submission.deleteMany({ where: { teamId: teamId } });
        // Then delete the team
        await prisma.team.delete({ where: { id: teamId } });
        
        res.json({ success: true, message: "Credentials revoked and data purged." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Revocation process failed." });
    }
});

/**
 * 6. PROBLEM STATEMENTS
 */
router.get('/problem-statements', async (req, res) => {
    try {
        const statements = await prisma.problemStatement.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(statements);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch statements" });
    }
});

router.post('/problem-statements', async (req, res) => {
    const { questionNo, subDivisions, title, description, allottedTo } = req.body;
    try {
        const statement = await prisma.problemStatement.create({
            data: { questionNo, subDivisions, title, description, allottedTo }
        });
        res.json({ success: true, statement });
    } catch (error) {
        console.error("❌ Problem Statement Deployment Error:", error);
        res.status(500).json({ error: `Deployment Logic Error: ${error.message}` });
    }
});

router.delete('/problem-statements/:id', async (req, res) => {
    try {
        await prisma.problemStatement.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete statement" });
    }
});

/**
 * HELPER: Calculate progress based on 8 mandatory modules
 */
function calculateProgress(submission) {
    if (!submission || !submission.content) return 0;
    const content = submission.content;
    
    // Check for new Slides structure first
    if (content.slides && Array.isArray(content.slides)) {
        const filled = content.slides.filter(s => s.content && s.content.trim().length > 10).length;
        return Math.min(100, Math.round((filled / content.slides.length) * 100));
    }

    // Legacy fallback
    const fields = ['title', 'abstract', 'problem', 'solution', 'architecture', 'technologies', 'impact', 'outcome'];
    const filledCount = fields.filter(f => content[f] && content[f].length > 5).length;
    return Math.round((filledCount / fields.length) * 100);
}

/**
 * FORCE RE-GENERATION FOR A TEAM (Administrative Reconstruction)
 */
router.post('/force-regenerate', async (req, res) => {
    try {
        const { teamId } = req.body;
        const team = await prisma.team.findUnique({
            where: { id: teamId },
            include: { submission: true }
        });

        if (!team || !team.submission || !team.submission.content) {
            return res.status(404).json({ error: "Institutional vault empty for this team. No data to reconstruct." });
        }

        const tryUrls = [
            process.env.PYTHON_SERVICE_URL,
            'http://endearing-liberation.railway.internal:8000',
            'https://endearing-liberation-production.up.railway.app'
        ].filter(Boolean);

        let response = null;
        let successfulHost = null;
        let finalError = "No connection established to synthesis cluster.";

        console.log(`[FORCE RECON] Commencing rebuild for team: ${team.teamName}`);
        const content = team.submission.content;
        const endpoints = ['/generate-artifact', '/generate', '/api/generate-artifact']; 

        probeLoop: for (const url of tryUrls) {
            const cleanHost = url.replace(/\/$/, "");
            for (const endpoint of endpoints) {
                try {
                    console.log(`[FORCE] Probing: ${cleanHost}${endpoint}`);
                    const res = await axios.post(`${cleanHost}${endpoint}`, { 
                        team_name: team.teamName, 
                        college_name: team.collegeName, 
                        content: content 
                    }, { timeout: 60000 });

                    if (res.data && res.data.success) {
                        response = res;
                        successfulHost = cleanHost;
                        console.log(`✅ [FORCE] Success on Node: ${cleanHost}${endpoint}`);
                        break probeLoop;
                    } else {
                        // Logic Error (Node active but synthesis failed)
                        const msg = res.data?.error || "Unknown Synthesis Detail";
                        console.warn(`[FORCE] Node Logic Error: ${cleanHost}${endpoint} -> ${msg}`);
                        finalError = `Synthesis Logic Failure: ${msg} at ${cleanHost}${endpoint}`;
                    }
                } catch (e) {
                    const status = e.response ? `[Status ${e.response.status}]` : '[Network]';
                    const detail = e.response?.data?.detail || e.message;
                    console.warn(`[FORCE] Node Connect Fail: ${cleanHost}${endpoint} -> ${status} ${detail}`);
                    finalError = `${status} ${detail} at ${cleanHost}${endpoint}`;
                }
            }
        }

        if (!response || !response.data.success) {
            throw new Error(`Cloud Synthesis Cluster Unreachable. Detail: ${finalError}`);
        }

        // Construct absolute verified URL from filename
        const rawFile = response.data.file_url;
        const fileName = rawFile.split('/').pop();
        const finalPptUrl = mapInternalToPublic(`${successfulHost}/outputs/${fileName}`);

        // Persist to repository
        await prisma.submission.update({
            where: { teamId },
            data: { 
                pptUrl: finalPptUrl, 
                status: 'SUBMITTED',
                updatedAt: new Date()
            }
        });

        res.json({ 
            success: true, 
            message: `Artifact reconstructed on node: ${successfulHost}`, 
            pptUrl: finalPptUrl 
        });

    } catch (error) {
        console.error("❌ RECONSTRUCTION CRITICAL FAILURE:", error.message);
        res.status(500).json({ error: `System Reconstruction Failed: ${error.message}` });
    }
});

/**
 * BATCH GENERATE CERTIFICATES FOR A TEAM
 */
router.post('/generate-certificates', async (req, res) => {
    try {
        const { teamId } = req.body;
        const submission = await prisma.submission.findUnique({
            where: { teamId },
            include: { certificates: true, team: true }
        });

        if (!submission || submission.certificates.length === 0) {
            return res.status(404).json({ error: "No participant metadata found." });
        }

        const tryUrls = [
            process.env.PYTHON_SERVICE_URL,
            'http://endearing-liberation.railway.internal:8000',
            'https://endearing-liberation-production.up.railway.app'
        ].filter(Boolean);

        for (const part of submission.certificates) {
            let success = false;
            for (const url of tryUrls) {
                try {
                    const cleanHost = url.replace(/\/$/, "");
                    const response = await axios.post(`${cleanHost}/generate-certificate`, {
                        name: part.name,
                        college: part.college,
                        year: part.year,
                        dept: part.dept,
                        role: part.role
                    }, { timeout: 30000 });

                    if (response.data?.success) {
                        const fileName = response.data.file_url.split('/').pop();
                        const publicUrl = mapInternalToPublic(`${cleanHost}/certs/${fileName}`);
                        await prisma.participantCertificate.update({
                            where: { id: part.id },
                            data: { certificateUrl: publicUrl }
                        });
                        success = true;
                        break;
                    }
                } catch (e) { console.warn(`Cert fail: ${e.message}`); }
            }
        }
        res.json({ success: true, message: "Credential synthesis complete." });
    } catch (error) {
        res.status(500).json({ error: "Synthesis Engine unreachable." });
    }
});

/**
 * GET ALL SUBMISSIONS WITH DETAILS
 */
router.get('/submissions', async (req, res) => {
    try {
        const submissions = await prisma.submission.findMany({
            include: {
                team: true,
                certificates: true
            },
            orderBy: { updatedAt: 'desc' }
        });
        res.json(submissions);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch vault contents." });
    }
});

/**
 * TOGGLE REGENERATION PERMISSION
 */
router.post('/toggle-regenerate', async (req, res) => {
    try {
        const { teamId, canRegenerate } = req.body;

        if (!teamId || typeof canRegenerate !== 'boolean') {
            return res.status(400).json({ error: "Invalid request data" });
        }

        await prisma.submission.update({
            where: { teamId },
            data: { canRegenerate }
        });

        res.json({ success: true, message: `Regeneration ${canRegenerate ? 'enabled' : 'disabled'} for team` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to update permission" });
    }
});

module.exports = router;
