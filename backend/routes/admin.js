const express = require('express');
const router = express.Router();
const axios = require('axios');
const prisma = require('../utils/prisma');

const mapInternalToPublic = (url) => {
    if (!url) return url;
    return url
        .replace(/([a-zA-Z0-9-]+\.)+railway\.internal(:\d+)?/, (match) => {
            if (match.includes('python') || match.includes('liberation')) 
                return 'endearing-liberation-production.up.railway.app';
            return 'hackathon-production-c6be.up.railway.app';
        })
        .replace('http://', 'https://'); 
};

const { verifyToken, isAdmin } = require('../middleware/auth');
router.use(verifyToken);
router.use(isAdmin);

/**
 * INSTITUTIONAL AUTHORITY: MISSION HALT/RESUME
 */
router.post('/toggle-halt', async (req, res) => {
    try {
        let config = await prisma.hackathonConfig.findUnique({ where: { id: 1 } });
        const newStatus = !config.isPaused;
        await prisma.hackathonConfig.update({ where: { id: 1 }, data: { isPaused: newStatus } });
        
        const timerState = req.app.get('timerState');
        if (timerState) timerState.setTimerPaused(newStatus);

        const io = req.app.get('socketio');
        if (io) {
            const state = timerState ? timerState.getTimerState() : { timeRemaining: 0 };
            io.emit('timerUpdate', { timerPaused: newStatus, timeRemaining: state.timeRemaining });
        }
        res.json({ success: true, isPaused: newStatus });
    } catch (e) { res.status(500).json({ error: "Fail" }); }
});

router.post('/test-config', async (req, res) => {
    try {
        await prisma.hackathonConfig.upsert({ where: { id: 1 }, update: req.body, create: { id: 1, ...req.body } });
        if (req.body.durationMinutes) {
            const timerState = req.app.get('timerState');
            if (timerState) timerState.setTimeRemaining(req.body.durationMinutes * 60);
        }
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "Fail" }); }
});

/**
 * TEMPORAL RESET PROTOCOL
 * Resets the hackathon timer to 24 hours
 */
router.post('/reset-timer', async (req, res) => {
    try {
        const TWENTY_FOUR_HOURS = 1440; // 24 hours in minutes
        
        // Update database configuration
        await prisma.hackathonConfig.update({ 
            where: { id: 1 }, 
            data: { durationMinutes: TWENTY_FOUR_HOURS, isPaused: true } 
        });
        
        // Update in-memory timer state
        const timerState = req.app.get('timerState');
        if (timerState) {
            timerState.setTimeRemaining(TWENTY_FOUR_HOURS * 60); // Convert to seconds
            timerState.setTimerPaused(true);
        }

        // Broadcast timer update to all connected clients
        const io = req.app.get('socketio');
        if (io) {
            const formatDuration = (seconds) => {
                const h = Math.floor(seconds / 3600);
                const m = Math.floor((seconds % 3600) / 60);
                const s = seconds % 60;
                return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
            };
            
            io.emit('timerUpdate', { 
                timeRemaining: TWENTY_FOUR_HOURS * 60, 
                timerPaused: true,
                formattedTime: formatDuration(TWENTY_FOUR_HOURS * 60)
            });
        }
        
        res.json({ success: true, message: "Timer reset to 24 hours" });
    } catch (e) { 
        console.error("Timer reset error:", e);
        res.status(500).json({ error: "Timer reset failed" }); 
    }
});

/**
 * MISSION ARTIFACT RECONSTRUCTION
 * Institutional Manual Override for High-Fidelity Deliverables
 */
router.post('/force-regenerate', async (req, res) => {
    const { teamId } = req.body;
    try {
        const sub = await prisma.submission.findUnique({ where: { teamId }, include: { team: true } });
        if (!sub) return res.status(404).json({ error: "No artifact found." });

        if (!sub.content || JSON.stringify(sub.content) === "{}" || JSON.stringify(sub.content) === "[]") {
            return res.status(400).json({ error: "Insufficient payload for reconstruction." });
        }

        const tryUrls = [
            process.env.PYTHON_SERVICE_URL,
            'http://ppt-service:8000',
            'http://ppt-service.railway.internal:8000',
            'http://endearing-liberation.railway.internal:8000',
            'https://endearing-liberation-production.up.railway.app'
        ].filter(Boolean);
        
        let payload = sub.content;
        const isExpert = (payload.projectName || (typeof payload === 'string' && payload.includes('projectName')));

        for (const pyUrl of tryUrls) {
            try {
                const endpoint = isExpert ? '/generate-expert-pitch' : '/generate-artifact';
                const r = await axios.post(`${pyUrl.replace(/\/$/, "")}${endpoint}`, {
                    team_name: payload.teamName || sub.team.teamName,
                    college_name: payload.institutionName || sub.team.collegeName,
                    content: payload,
                    project_data: payload 
                }, { timeout: 180000 });

                if (r.data.success) {
                    const publicUrl = mapInternalToPublic(`${pyUrl.replace(/\/$/, "")}/outputs/${r.data.file_url}`);
                    await prisma.submission.update({ where: { teamId }, data: { pptUrl: publicUrl, status: 'SUBMITTED' } });
                    return res.json({ success: true, message: "Reconstructed ✓" });
                }
            } catch (e) {
                console.warn(`Node ${pyUrl} failed reconstruction attempt: ${e.message}`);
            }
        }
        res.status(500).json({ error: "Synthesis cluster failure. Verify node connectivity." });
    } catch (e) { res.status(500).json({ error: "Critical failure during reconstruction." }); }
});

/**
 * MISSION UNLOCK PROTOCOL
 * Allows teams to edit their mission data after submission.
 */
router.post('/unlock-team', async (req, res) => {
    const { teamId } = req.body;
    console.log('[UNLOCK] Request received:', { teamId, user: req.user });
    
    if (!teamId) {
        console.error('[UNLOCK] Missing teamId in request body');
        return res.status(400).json({ error: "Team ID is required" });
    }
    
    try {
        // Check if submission exists
        const existingSubmission = await prisma.submission.findUnique({ where: { teamId } });
        
        if (!existingSubmission) {
            console.error(`[UNLOCK] No submission found for teamId: ${teamId}`);
            return res.status(404).json({ error: "No submission found for this team" });
        }
        
        console.log(`[UNLOCK] Found submission for team ${teamId}, current status: ${existingSubmission.status}`);
        
        await prisma.submission.update({ 
            where: { teamId }, 
            data: { 
                status: 'IN_PROGRESS',
                pptUrl: null, // Revoke artifact to force regeneration
                canRegenerate: true
            } 
        });
        
        console.log(`[UNLOCK] Successfully unlocked team ${teamId}`);
        res.json({ success: true, message: "Team mission unlocked." });
    } catch (e) { 
        console.error('[UNLOCK] Error:', e);
        res.status(500).json({ error: "Unlock failed: " + e.message }); 
    }
});

/**
 * CREDENTIAL SYNTHESIS HUB
 */
const handleGenerateCertificates = async (req, res) => {
    try {
        const { teamId } = req.body;
        console.log(`[AdminGenerateCerts] Resolving team: ${teamId}`);
        
        let team = await prisma.team.findUnique({ where: { id: teamId } });
        if (!team) team = await prisma.team.findUnique({ where: { teamName: teamId } });
        
        const finalTeamId = team ? team.id : teamId;

        const sub = await prisma.submission.findUnique({ 
            where: { teamId: finalTeamId }, 
            include: { certificates: true } 
        });

        if (!sub) return res.status(404).json({ error: "No submission context found for this team." });
        if (!sub.certificates || sub.certificates.length === 0) {
            return res.status(400).json({ error: "No participant names found. Save names first." });
        }

        const tryUrls = [
            process.env.PYTHON_SERVICE_URL,
            'http://ppt-service:8000',
            'http://ppt-service.railway.internal:8000',
            'http://endearing-liberation.railway.internal:8000',
            'https://endearing-liberation-production.up.railway.app'
        ].filter(Boolean);

        const dateStr = sub.submittedAt 
            ? new Date(sub.submittedAt).toLocaleDateString('en-GB').split('/').join('-') 
            : '[Submission Date]';

        let successCount = 0;
        for (const p of sub.certificates) {
            let processed = false;
            for (const url of tryUrls) {
                try {
                    console.log(`[AdminGenerateCerts] Probing ${url} for ${p.name}`);
                    const r = await axios.post(`${url.replace(/\/$/, "")}/generate-certificate`, {
                        ...p,
                        submission_date: dateStr
                    }, { timeout: 30000 });
                    if (r.data.success) {
                        const certPublicUrl = mapInternalToPublic(`${url.replace(/\/$/, "")}/certs/${r.data.file_url}`);
                        await prisma.participantCertificate.update({ 
                            where: { id: p.id }, 
                            data: { certificateUrl: certPublicUrl } 
                        });
                        processed = true;
                        successCount++;
                        console.log(`✅ [AdminGenerateCerts] Success for ${p.name}`);
                        break;
                    }
                } catch (e) {
                    console.warn(`[AdminGenerateCerts] Node ${url} unreachable for certificate.`);
                }
            }
        }

        if (successCount === 0) {
            return res.status(500).json({ error: "Synthesis cluster unreachable or failed to generate any certificates." });
        }

        res.json({ success: true, message: `Successfully generated ${successCount} certificates.` });
    } catch (e) { 
        console.error("[AdminGenerateCerts] CRITICAL ERROR:", e);
        res.status(500).json({ error: "Internal server error during certificate synthesis." }); 
    }
};

router.post('/generate-certificates', handleGenerateCertificates);
router.post('/generate-team-certificates', handleGenerateCertificates);

router.post('/update-certificates', async (req, res) => {
    try {
        const { teamId, participants } = req.body;
        let sub = await prisma.submission.findUnique({ where: { teamId }, include: { certificates: true } });
        if (!sub) {
            const team = await prisma.team.findUnique({ where: { id: teamId } });
            sub = await prisma.submission.create({ data: { teamId, content: {}, status: 'SUBMITTED' }, include: { certificates: true } });
        }
        for (const p of participants) {
            if (!p.name) continue;
            const existing = sub.certificates.find(c => c.role === p.role);
            if (existing) {
                await prisma.participantCertificate.update({ where: { id: existing.id }, data: { name: p.name, college: p.college, year: p.year, dept: p.dept } });
            } else {
                await prisma.participantCertificate.create({ data: { ...p, submissionId: sub.id } });
            }
        }
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "Metadata sync failed." }); }
});

router.get('/dashboard', async (req, res) => {
    try {
        const teams = await prisma.team.findMany({ include: { submission: { include: { certificates: true } } } });
        const problems = await prisma.problemStatement.findMany();
        const config = await prisma.hackathonConfig.findUnique({ where: { id: 1 } });
        
        const submissions = teams.map(t => t.submission).filter(Boolean);
        
        const pendingSelection = teams.filter(t => {
            const psArray = problems.filter(p => p.allottedTo === t.teamName);
            return psArray.length > 0 && !t.selectedProblemId;
        }).length;

        res.json({
            total_candidates: teams.length,
            statuses: { 
                in_progress: submissions.filter(s => s.status === 'IN_PROGRESS').length, 
                submitted: submissions.filter(s => s.status === 'SUBMITTED' || s.status === 'LOCKED').length,
                pending_selection: pendingSelection
            },
            certificates: { 
                collected: submissions.filter(s => s.certificates.some(c => c.certificateUrl)).length,
                names_entered: submissions.filter(s => s.certificates.length > 0 && s.certificates.every(c => c.name)).length
            },
            config
        });
    } catch (e) { 
        console.error("[AdminDashboard] Error:", e);
        res.status(500).json({ error: "Fail" }); 
    }
});

router.get('/candidates', async (req, res) => {
    try {
        const teams = await prisma.team.findMany({ include: { submission: true } });
        const problems = await prisma.problemStatement.findMany();
        const formatted = teams.map(t => {
            const psArray = problems.filter(p => p.allottedTo === t.teamName);
            const selectedPs = problems.find(p => p.id === t.selectedProblemId);
            const allottedQuestion = psArray.length > 0 ? psArray.map(p => `Q.${p.questionNo}${p.subDivisions ? ` (${p.subDivisions})` : ''}`).join(', ') : 'NONE';
            return { 
                ...t, 
                status: t.submission?.status || 'IDLE', 
                allottedQuestion, 
                allottedIds: psArray.map(p => p.id),
                selectedQuestion: selectedPs ? `Q.${selectedPs.questionNo}` : null
            };
        });
        res.json({ candidates: formatted });
    } catch (error) { res.status(500).json({ error: "Fail" }); }
});

router.post('/create-team', async (req, res) => {
    const { teamName, collegeName, problemStatementIds } = req.body;
    try {
        const team = await prisma.team.create({ data: { teamName, collegeName, member1: teamName, member2: 'Member', dept: 'N/A', year: 1 } });
        if (problemStatementIds && Array.isArray(problemStatementIds)) {
            for (const id of problemStatementIds) {
                if (id) await prisma.problemStatement.update({ where: { id }, data: { allottedTo: teamName } });
            }
        } else if (req.body.problemStatementId) {
            await prisma.problemStatement.update({ where: { id: req.body.problemStatementId }, data: { allottedTo: teamName } });
        }
        res.json({ success: true, team });
    } catch (error) { res.status(400).json({ error: "Conflict" }); }
});

router.post('/reallot-team', async (req, res) => {
    const { teamName, newProblemStatementIds } = req.body; // Expecting an array [id1, id2]
    try {
        await prisma.problemStatement.updateMany({ where: { allottedTo: teamName }, data: { allottedTo: null } });
        if (newProblemStatementIds && Array.isArray(newProblemStatementIds)) {
            for (const id of newProblemStatementIds) {
                if (id) await prisma.problemStatement.update({ where: { id }, data: { allottedTo: teamName } });
            }
        } else if (newProblemStatementIds) {
            await prisma.problemStatement.update({ where: { id: newProblemStatementIds }, data: { allottedTo: teamName } });
        }
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "Fail" }); }
});

router.delete('/teams/:id', async (req, res) => {
    try {
        await prisma.submission.deleteMany({ where: { teamId: req.params.id } });
        await prisma.team.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "Fail" }); }
});

router.get('/problem-statements', async (req, res) => {
    try {
        const ps = await prisma.problemStatement.findMany({ orderBy: { questionNo: 'asc' } });
        res.json(ps);
    } catch (e) { res.status(500).json({ error: "Fail" }); }
});

router.get('/submissions', async (req, res) => {
    try {
        const teams = await prisma.team.findMany({ include: { submission: { include: { certificates: true } } } });
        const problems = await prisma.problemStatement.findMany();
        
        const submissions = teams.map(t => {
            const psArray = problems.filter(p => p.allottedTo === t.teamName);
            const selectedPs = problems.find(p => p.id === t.selectedProblemId);
            const isPicked = !!t.selectedProblemId;
            const allottedQuestion = selectedPs 
                ? `Q.${selectedPs.questionNo}${selectedPs.subDivisions ? ` - ${selectedPs.subDivisions}` : ''}` 
                : (psArray.length > 0 ? psArray.map(p => `Q.${p.questionNo}${p.subDivisions ? ` (${p.subDivisions})` : ''}`).join(', ') : 'NONE');
            
            return {
                id: t.submission?.id || `virtual-${t.id}`,
                teamId: t.id,
                team: t,
                status: t.submission?.status || 'PENDING',
                pptUrl: t.submission?.pptUrl || null,
                allottedQuestion: allottedQuestion,
                isPicked: isPicked,
                certificates: t.submission?.certificates || [],
                submittedAt: t.submission?.submittedAt || null,
                canRegenerate: t.submission?.canRegenerate ?? true
            };
        });
        
        submissions.sort((a, b) => {
            const order = { 'SUBMITTED': 0, 'LOCKED': 0, 'IN_PROGRESS': 1, 'PENDING': 2 };
            return (order[a.status] ?? 3) - (order[b.status] ?? 3);
        });

        res.json(submissions);
    } catch (e) { 
        console.error("[AdminSubmissions] Error:", e);
        res.status(500).json({ error: "Fail" }); 
    }
});

router.post('/toggle-certificate-collection', async (req, res) => {
    try {
        const config = await prisma.hackathonConfig.findUnique({ where: { id: 1 } });
        const newState = !config.allowCertificateDetails;
        await prisma.hackathonConfig.update({ where: { id: 1 }, data: { allowCertificateDetails: newState } });
        res.json({ success: true, allowCertificateDetails: newState });
    } catch (e) { res.status(500).json({ error: "Fail" }); }
});

router.post('/problem-statements', async (req, res) => {
    try {
        const ps = await prisma.problemStatement.create({ data: req.body });
        res.json({ success: true, statement: ps });
    } catch (e) { res.status(500).json({ error: "Fail" }); }
});

router.delete('/problem-statements/:id', async (req, res) => {
    try {
        await prisma.problemStatement.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "Fail" }); }
});

module.exports = router;
