const express = require('express');
const router = express.Router();
const axios = require('axios');
const prisma = require('../utils/prisma');
const { exec } = require('child_process');

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

router.post('/toggle-halt', async (req, res) => {
    try {
        let config = await prisma.hackathonConfig.findUnique({ where: { id: 1 } });
        const newStatus = !config.isPaused;
        await prisma.hackathonConfig.update({ where: { id: 1 }, data: { isPaused: newStatus } });
        
        // Sync in-memory state
        const timerState = req.app.get('timerState');
        if (timerState) timerState.setTimerPaused(newStatus);

        const io = req.app.get('socketio');
        if (io) io.emit('timerUpdate', { 
            timerPaused: newStatus,
            timeRemaining: timerState ? timerState.getTimerState().timeRemaining : 0
        });
        res.json({ success: true, isPaused: newStatus });
    } catch (e) { res.status(500).json({ error: "Fail" }); }
});

router.post('/toggle-certificate-collection', async (req, res) => {
    try {
        const config = await prisma.hackathonConfig.findUnique({ where: { id: 1 } });
        const newState = !config.allowCertificateDetails;
        await prisma.hackathonConfig.update({ where: { id: 1 }, data: { allowCertificateDetails: newState } });
        res.json({ success: true, allowCertificateDetails: newState });
    } catch (e) { res.status(500).json({ error: "Fail" }); }
});

router.get('/dashboard', async (req, res) => {
    try {
        const totalTeams = await prisma.team.count();
        const submissions = await prisma.submission.findMany({ include: { certificates: true } });
        const config = await prisma.hackathonConfig.findUnique({ where: { id: 1 } });
        res.json({
            total_candidates: totalTeams,
            statuses: {
                in_progress: submissions.filter(s => s.status === 'IN_PROGRESS').length,
                submitted: submissions.filter(s => s.status === 'SUBMITTED').length
            },
            certificates: { collected: submissions.filter(s => s.certificates.length > 0).length },
            config
        });
    } catch (e) { res.status(500).json({ error: "Fail" }); }
});

router.get('/candidates', async (req, res) => {
    try {
        const teams = await prisma.team.findMany({ include: { submission: true } });
        const problems = await prisma.problemStatement.findMany();
        const formatted = teams.map(t => {
            const ps = problems.find(p => p.allottedTo === t.teamName);
            return { ...t, status: t.submission?.status || 'IDLE', allottedQuestion: ps ? `Q.${ps.questionNo}` : 'NONE' };
        });
        res.json({ candidates: formatted });
    } catch (error) { res.status(500).json({ error: "Fail" }); }
});

router.post('/create-team', async (req, res) => {
    const { teamName, collegeName, problemStatementId } = req.body;
    try {
        const team = await prisma.team.create({ data: { teamName, collegeName, member1: teamName, member2: 'Member', dept: 'N/A', year: 1 } });
        if (problemStatementId) await prisma.problemStatement.update({ where: { id: problemStatementId }, data: { allottedTo: teamName } });
        res.json({ success: true, team });
    } catch (error) { res.status(400).json({ error: "Conflict" }); }
});

router.post('/reallot-team', async (req, res) => {
    const { teamName, newProblemStatementId } = req.body;
    try {
        await prisma.problemStatement.updateMany({ where: { allottedTo: teamName }, data: { allottedTo: null } });
        if (newProblemStatementId) await prisma.problemStatement.update({ where: { id: newProblemStatementId }, data: { allottedTo: teamName } });
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
        const subs = await prisma.submission.findMany({ include: { team: true, certificates: true }, orderBy: { updatedAt: 'desc' } });
        const problems = await prisma.problemStatement.findMany();
        const enriched = subs.map(s => {
            const ps = problems.find(p => p.allottedTo === s.team.teamName);
            return { ...s, allottedQuestion: ps ? `Q.${ps.questionNo}` : 'NONE' };
        });
        res.json(enriched);
    } catch (e) { res.status(500).json({ error: "Fail" }); }
});

router.post('/update-certificates', async (req, res) => {
    try {
        const { teamId, participants } = req.body;
        const sub = await prisma.submission.findUnique({ where: { teamId }, include: { certificates: true } });
        if (!sub) return res.status(404).json({ error: "No submission" });
        
        for (const p of participants) {
            if (!p.name) continue;
            const existing = sub.certificates.find(c => c.role === p.role);
            if (existing) {
                await prisma.participantCertificate.update({ 
                    where: { id: existing.id }, 
                    data: { name: p.name, college: p.college, year: p.year, dept: p.dept } 
                });
            } else {
                await prisma.participantCertificate.create({ 
                    data: { ...p, submissionId: sub.id } 
                });
            }
        }
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "Fail" }); }
});

router.post('/generate-certificates', async (req, res) => {
    try {
        const { teamId } = req.body;
        const sub = await prisma.submission.findUnique({ where: { teamId }, include: { certificates: true } });
        const tryUrls = [process.env.PYTHON_SERVICE_URL, 'https://endearing-liberation-production.up.railway.app'].filter(Boolean);
        for (const p of sub.certificates) {
            for (const url of tryUrls) {
                try {
                    const r = await axios.post(`${url}/generate-certificate`, p);
                    if (r.data.success) {
                        const fileName = r.data.file_url.split('/').pop();
                        const publicUrl = mapInternalToPublic(`${url}/certs/${fileName}`);
                        await prisma.participantCertificate.update({ where: { id: p.id }, data: { certificateUrl: publicUrl } });
                        break;
                    }
                } catch (e) {}
            }
        }
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "Fail" }); }
});

router.post('/toggle-regenerate', async (req, res) => {
    try {
        await prisma.submission.update({ where: { teamId: req.body.teamId }, data: { canRegenerate: req.body.canRegenerate } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "Fail" }); }
});

router.post('/test-config', async (req, res) => {
    try {
        await prisma.hackathonConfig.upsert({ where: { id: 1 }, update: req.body, create: { id: 1, ...req.body } });
        
        // Institutional Sync: Update in-memory timer
        if (req.body.durationMinutes) {
            const timerState = req.app.get('timerState');
            if (timerState) timerState.setTimeRemaining(req.body.durationMinutes * 60);
        }

        res.json({ success: true });
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
