const router = require('express').Router();
const prisma = require('../utils/prisma');
const { verifyToken } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// Middleware: Reviewer/Admin Clearance
const isReviewer = (req, res, next) => {
    if (req.user?.role !== 'REVIEWER' && req.user?.role !== 'ADMIN') {
        return res.status(403).json({ error: "Access Denied: Evaluation Clearance Required" });
    }
    next();
};

router.use(verifyToken);
router.use(isReviewer);

// 1. DASHBOARD
router.get('/dashboard', async (req, res) => {
    try {
        const teams = await prisma.team.findMany({
            include: {
                submission: {
                    include: {
                        scores: true 
                    }
                }
            },
            orderBy: { teamName: 'asc' }
        });
        
        // Transform for frontend
        const data = teams.map(t => {
            // Find score given by THIS user
            // Problem: If user is ADMIN, their 'reviewerId' in Score table is their ADMIN ID (shadow reviewer)
            // If user is Reviewer, it is their Reviewer ID.
            const userId = req.user.id;
            const myScore = t.submission?.scores?.find(s => s.reviewerId === userId);
            
            return {
                id: t.id,
                teamName: t.teamName,
                collegeName: t.collegeName,
                status: t.submission ? t.submission.status : 'NOT_STARTED', // Explicit Status
                pptUrl: t.submission?.pptUrl,
                prototypeUrl: t.submission?.prototypeUrl,
                hasSubmitted: !!t.submission,
                myScore: myScore || null,
                isEvaluated: !!myScore,
                totalScore: myScore?.total || 0
            };
        });
        
        res.json({ success: true, teams: data });
    } catch (e) {
        console.error("[Reviewer Dashboard]", e);
        res.status(500).json({ error: "Dashboard sync failed." });
    }
});

// 2. TEAM DETAIL
router.get('/team/:id', async (req, res) => {
    try {
        const team = await prisma.team.findUnique({
            where: { id: req.params.id },
            include: {
                submission: {
                    include: {
                        scores: true
                    }
                }
            }
        });
        
        if (!team) return res.status(404).json({ error: "Team not found" });
        
        const userId = req.user.id;
        const myScore = team.submission?.scores?.find(s => s.reviewerId === userId);
        
        res.json({ 
            success: true, 
            team: {
                id: team.id,
                teamName: team.teamName,
                collegeName: team.collegeName,
                submission: team.submission,
                myScore: myScore || null
            } 
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 3. SUBMIT SCORE
router.post('/score', async (req, res) => {
    try {
        const { teamId, innovation, feasibility, techStack, presentation, impact, comments } = req.body;
        
        const team = await prisma.team.findUnique({ 
            where: { id: teamId },
            include: { submission: true }
        });
        
        if (!team || !team.submission) {
            return res.status(400).json({ error: "Team has no submission to evaluate." });
        }
        
        const submissionId = team.submission.id;
        let reviewerId = req.user.id;
        
        // AUTO-SHADOW: Ensure Admins have a valid Reviewer Profile
        if (req.user.role === 'ADMIN') {
            const shadowEmail = `admin_shadow_${reviewerId}@system.local`;
            // Check if shadow reviewer exists using ID
            const r = await prisma.reviewer.findUnique({ where: { id: reviewerId } });
            
            if (!r) {
                 console.log(`[Reviewer] Creating Shadow Profile for Admin ${reviewerId}`);
                 await prisma.reviewer.create({
                     data: {
                         id: reviewerId, // Force same ID
                         email: shadowEmail,
                         password: 'shadow_admin_pass', 
                         name: 'Administrator (Shadow)',
                         domain: 'System Authority'
                     }
                 });
            }
        }
        
        // Calculate Total
        const total = (Number(innovation)||0) + (Number(feasibility)||0) + (Number(techStack)||0) + (Number(presentation)||0) + (Number(impact)||0);
        
        // Update/Insert Score
        const score = await prisma.score.upsert({
            where: {
                submissionId_reviewerId: {
                    submissionId,
                    reviewerId
                }
            },
            update: {
                innovation: Number(innovation)||0, 
                feasibility: Number(feasibility)||0, 
                techStack: Number(techStack)||0, 
                presentation: Number(presentation)||0, 
                impact: Number(impact)||0, 
                total, 
                comments,
                updatedAt: new Date()
            },
            create: {
                submissionId,
                reviewerId,
                innovation: Number(innovation)||0, 
                feasibility: Number(feasibility)||0, 
                techStack: Number(techStack)||0, 
                presentation: Number(presentation)||0, 
                impact: Number(impact)||0, 
                total, 
                comments
            }
        });
        
        res.json({ success: true, score });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to submit score: " + e.message });
    }
});

module.exports = router;
