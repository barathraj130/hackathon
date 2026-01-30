const router = require('express').Router();
const prisma = require('../utils/prisma');
const { verifyToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

router.use(verifyToken);

// Configure multer for prototype file uploads
const prototypeStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'public/prototypes';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'prototype-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const uploadPrototype = multer({ 
    storage: prototypeStorage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.zip', '.pdf', '.pptx', '.docx', '.rar', '.7z'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only ZIP, PDF, PPTX, DOCX, RAR, 7Z are allowed.'));
        }
    }
});

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
        console.error('[PrototypeLink] Error:', error);
        res.status(500).json({ error: "Failed to submit prototype link." });
    }
});

/**
 * @route   POST /v1/team/upload-prototype-file
 * @desc    Upload prototype file (ZIP, PDF, etc.)
 */
router.post('/upload-prototype-file', uploadPrototype.single('prototypeFile'), async (req, res) => {
    try {
        const teamId = req.user.id;

        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded." });
        }

        const submission = await prisma.submission.findUnique({
            where: { teamId }
        });

        if (!submission || !submission.pptUrl) {
            // Clean up uploaded file
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: "Please generate your presentation first." });
        }

        // Store file path in database
        const fileUrl = `/prototypes/${req.file.filename}`;
        
        await prisma.submission.update({
            where: { teamId },
            data: { 
                prototypeUrl: submission.prototypeUrl 
                    ? `${submission.prototypeUrl} | FILE: ${fileUrl}` 
                    : `FILE: ${fileUrl}`
            }
        });

        res.json({ 
            success: true, 
            message: "Prototype file uploaded successfully.",
            fileUrl: fileUrl,
            fileName: req.file.originalname
        });
    } catch (error) {
        console.error('[PrototypeUpload] Error:', error);
        // Clean up file if there was an error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: "Failed to upload prototype file." });
    }
});

/**
 * @route   POST /v1/team/update-certificates
 * @desc    Update certificate details for team participants
 */
router.post('/update-certificates', async (req, res) => {
    try {
        const teamId = req.user.id;
        const { participants } = req.body;

        if (!participants || !Array.isArray(participants) || participants.length === 0) {
            return res.status(400).json({ error: "Participant details are required." });
        }

        // Validate all participants have required fields
        for (const p of participants) {
            if (!p.name || !p.college || !p.dept || !p.year || !p.role) {
                return res.status(400).json({ error: "All participant fields are required." });
            }
        }

        const submission = await prisma.submission.findUnique({
            where: { teamId },
            include: { certificates: true }
        });

        if (!submission) {
            return res.status(400).json({ error: "No submission found. Please generate your presentation first." });
        }

        // Delete existing certificates
        await prisma.participantCertificate.deleteMany({
            where: { submissionId: submission.id }
        });

        // Create new certificates
        const certificatePromises = participants.map(p => 
            prisma.participantCertificate.create({
                data: {
                    submissionId: submission.id,
                    name: p.name.trim(),
                    college: p.college.trim(),
                    year: p.year.toString(),
                    dept: p.dept.trim(),
                    role: p.role.toUpperCase()
                }
            })
        );

        await Promise.all(certificatePromises);

        res.json({ 
            success: true, 
            message: "Certificate details saved successfully.",
            count: participants.length
        });
    } catch (error) {
        console.error('[CertificateUpdate] Error:', error);
        res.status(500).json({ error: "Failed to save certificate details." });
    }
});

/**
 * @route   POST /v1/team/finalize-submission
 * @desc    Lock the submission after all steps are complete
 */
router.post('/finalize-submission', async (req, res) => {
    try {
        const teamId = req.user.id;

        const submission = await prisma.submission.findUnique({
            where: { teamId },
            include: { certificates: true }
        });

        if (!submission) {
            return res.status(400).json({ error: "No submission found." });
        }

        if (!submission.pptUrl) {
            return res.status(400).json({ error: "Please generate your presentation first." });
        }

        if (!submission.prototypeUrl) {
            return res.status(400).json({ error: "Please submit your prototype first." });
        }

        if (!submission.certificates || submission.certificates.length === 0) {
            return res.status(400).json({ error: "Please provide certificate details first." });
        }

        // Final lock
        await prisma.submission.update({
            where: { teamId },
            data: { 
                status: 'SUBMITTED',
                canRegenerate: false,
                submittedAt: new Date()
            }
        });

        res.json({ 
            success: true, 
            message: "Submission finalized successfully. Your entry is now locked."
        });
    } catch (error) {
        console.error('[FinalizeSubmission] Error:', error);
        res.status(500).json({ error: "Failed to finalize submission." });
    }
});

module.exports = router;
