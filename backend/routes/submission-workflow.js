const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

/**
 * @route   POST /v1/team/submit-prototype
 * @desc    Submit prototype link after PPT generation
 */
router.post('/submit-prototype', async (req, res) => {
    try {
        const teamId = req.user.id;
        const { prototypeUrl } = req.body;

        if (!prototypeUrl || !prototypeUrl.trim()) {
            return res.status(400).json({ error: "Prototype URL is required." });
        }

        const submission = await prisma.submission.findUnique({
            where: { teamId }
        });

        if (!submission || !submission.pptUrl) {
            return res.status(400).json({ error: "Please generate your presentation first." });
        }

        await prisma.submission.update({
            where: { teamId },
            data: { prototypeUrl: prototypeUrl.trim() }
        });

        res.json({ success: true, message: "Prototype link submitted successfully." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to submit prototype link." });
    }
});

/**
 * @route   POST /v1/team/submit-certificate-info
 * @desc    Submit certificate details for final submission
 */
router.post('/submit-certificate-info', async (req, res) => {
    try {
        const teamId = req.user.id;
        const { certificateName, certificateCollege, certificateYear } = req.body;

        if (!certificateName || !certificateCollege || !certificateYear) {
            return res.status(400).json({ error: "All certificate fields are required." });
        }

        const submission = await prisma.submission.findUnique({
            where: { teamId }
        });

        if (!submission || !submission.pptUrl) {
            return res.status(400).json({ error: "Please generate your presentation first." });
        }

        if (!submission.prototypeUrl) {
            return res.status(400).json({ error: "Please submit your prototype link first." });
        }

        await prisma.submission.update({
            where: { teamId },
            data: { 
                certificateName: certificateName.trim(),
                certificateCollege: certificateCollege.trim(),
                certificateYear: parseInt(certificateYear),
                status: 'LOCKED' // Final lock after all submissions
            }
        });

        res.json({ success: true, message: "Certificate details submitted. Your submission is now complete and locked." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to submit certificate details." });
    }
});

module.exports = router;
