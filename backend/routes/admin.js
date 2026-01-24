// backend/routes/admin.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { exec } = require('child_process');

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
 * 1. GET DASHBOARD STATS
 */
router.get('/dashboard', async (req, res) => {
    try {
        const totalTeams = await prisma.team.count();
        const submissions = await prisma.submission.findMany();
        const config = await prisma.hackathonConfig.findFirst();

        const stats = {
            total_candidates: totalTeams,
            statuses: {
                not_started: totalTeams - submissions.length,
                in_progress: submissions.filter(s => s.status === 'IN_PROGRESS').length,
                submitted: submissions.filter(s => s.status === 'SUBMITTED').length
            },
            test_config: config
        };

        res.json(stats);
    } catch (error) {
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
    const { teamName, collegeName, member1, member2, dept, year } = req.body;
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
        res.json({ success: true, team: newTeam });
    } catch (error) {
        res.status(400).json({ error: "Team name already exists" });
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
        res.status(500).json({ error: "Failed to create statement" });
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

module.exports = router;
/**
 * GET ALL SUBMISSIONS WITH DETAILS
 */
router.get('/submissions', async (req, res) => {
    try {
        const submissions = await prisma.submission.findMany({
            include: {
                team: {
                    select: {
                        id: true,
                        teamName: true,
                        collegeName: true,
                        member1: true,
                        member2: true
                    }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });

        res.json(submissions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch submissions" });
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
