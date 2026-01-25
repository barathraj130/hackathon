const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { authMiddleware } = require('./auth');

const router = express.Router();

// Apply auth middleware
router.use(authMiddleware);

// Get candidate profile
router.get('/profile', (req, res) => {
  const candidate = global.db.candidates.find(c => c.userId === req.user.userId);
  const user = global.db.users.find(u => u.id === req.user.userId);

  if (!candidate) {
    return res.status(404).json({ error: 'Candidate not found' });
  }

  res.json({
    ...candidate,
    name: user.name,
    email: user.email
  });
});

// Get test status
router.get('/test-status', (req, res) => {
  const config = global.db.testConfig;
  
  if (!config) {
    return res.json({
      is_active: false,
      message: 'Test not configured yet'
    });
  }

  const now = new Date();
  const startTime = new Date(config.startTime);
  const endTime = new Date(config.endTime);
  
  const isActive = now >= startTime && now < endTime;
  const remainingSeconds = isActive ? Math.max(0, Math.floor((endTime - now) / 1000)) : 0;

  res.json({
    is_active: isActive,
    is_paused: config.isPaused || false,
    start_time: config.startTime,
    end_time: config.endTime,
    current_server_time: now.toISOString(),
    remaining_seconds: remainingSeconds,
    can_submit: isActive
  });
});

// Save submission (auto-save or final)
router.post('/submission', (req, res) => {
  try {
    const { title, abstract, problemStatement, solution, technologies, teamDetails, isDraft } = req.body;
    
    const candidate = global.db.candidates.find(c => c.userId === req.user.userId);
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    // Find or create submission
    let submission = global.db.submissions.find(s => s.candidateId === candidate.id);
    
    if (!submission) {
      submission = {
        id: uuidv4(),
        candidateId: candidate.id,
        status: 'DRAFT',
        createdAt: new Date().toISOString()
      };
      global.db.submissions.push(submission);
    }

    // Update content - Permissive for all high-fidelity fields
    submission.content = { ...req.body };
    delete submission.content.isDraft; // Don't save draft flag in content
    submission.updatedAt = new Date().toISOString();
    submission.isDraft = isDraft !== false;

    // Update candidate status
    if (candidate.status === 'NOT_STARTED') {
      candidate.status = 'IN_PROGRESS';
    }

    res.json({
      success: true,
      submission_id: submission.id,
      last_saved: submission.updatedAt
    });
  } catch (error) {
    console.error('Submission error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Final submit
router.post('/submission/:id/submit', (req, res) => {
  const submission = global.db.submissions.find(s => s.id === req.params.id);
  
  if (!submission) {
    return res.status(404).json({ error: 'Submission not found' });
  }

  const candidate = global.db.candidates.find(c => c.id === submission.candidateId);
  if (candidate.userId !== req.user.userId) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  // Check if test is still active
  const config = global.db.testConfig;
  const now = new Date();
  const endTime = new Date(config.endTime);
  
  if (now > endTime) {
    return res.status(409).json({ error: 'Test has ended' });
  }

  submission.status = 'SUBMITTED';
  submission.submittedAt = now.toISOString();
  submission.isDraft = false;

  candidate.status = 'SUBMITTED';

  res.json({
    success: true,
    submitted_at: submission.submittedAt,
    message: 'Submission successful'
  });
});

// Get my submission
router.get('/submission', (req, res) => {
  const candidate = global.db.candidates.find(c => c.userId === req.user.userId);
  if (!candidate) {
    return res.status(404).json({ error: 'Candidate not found' });
  }

  const submission = global.db.submissions.find(s => s.candidateId === candidate.id);
  
  if (!submission) {
    return res.json({ exists: false });
  }

  res.json({
    exists: true,
    ...submission
  });
});

// Get certificate
router.get('/certificate', (req, res) => {
  const candidate = global.db.candidates.find(c => c.userId === req.user.userId);
  if (!candidate) {
    return res.status(404).json({ error: 'Candidate not found' });
  }

  const certificate = global.db.certificates.find(c => c.candidateId === candidate.id);

  if (!certificate) {
    return res.json({
      available: false,
      message: 'Certificate not available yet'
    });
  }

  res.json({
    available: true,
    certificate_type: certificate.certificateType,
    download_url: certificate.fileUrl,
    issued_at: certificate.issuedAt
  });
});

module.exports = router;
