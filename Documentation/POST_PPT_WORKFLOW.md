# Post-PPT Submission Workflow

## Overview
After teams generate their PPT, they must complete a 3-step workflow before final submission:

## Step 1: Prototype Submission
Teams can submit their prototype in two ways:
- **Link**: GitHub repo, Figma design, live demo URL, etc.
- **File Upload**: ZIP, PDF, PPTX, DOCX files (max 50MB)
- **Both**: Teams can provide both a link AND upload a file

### Accepted File Types
- `.zip` - Compressed project files
- `.pdf` - Documentation or design files
- `.pptx` - Additional presentations
- `.docx` - Documentation
- `.rar`, `.7z` - Alternative compression formats

## Step 2: Certificate Details
Teams must provide information for certificate generation:

### Required Fields (for each participant)
- **Full Name**: As it should appear on the certificate
- **Institution**: College/University name
- **Department**: e.g., Computer Science, IT, etc.
- **Year of Study**: 1st, 2nd, 3rd, 4th, or 5th year

### Participants
- **Leader** (Participant 01)
- **Member** (Participant 02)

## Step 3: Final Review & Lock
- Review all completed steps
- Final confirmation
- **Submission Lock**: Once submitted, no further edits are allowed

## Technical Implementation

### Frontend Component
`/frontend/src/components/SubmissionWorkflowModal.js`
- Multi-step modal with progress indicator
- File upload with progress tracking
- Form validation
- Error handling

### Backend Routes
`/backend/routes/submission-workflow.js`

#### Endpoints:
1. `POST /v1/team/submit-prototype`
   - Submit prototype link
   
2. `POST /v1/team/upload-prototype-file`
   - Upload prototype file with multer
   - Validates file type and size
   - Stores in `/public/prototypes/`

3. `POST /v1/team/update-certificates`
   - Save participant certificate details
   - Creates/updates ParticipantCertificate records
   
4. `POST /v1/team/finalize-submission`
   - Validates all steps completed
   - Locks submission (status: SUBMITTED, canRegenerate: false)
   - Sets submittedAt timestamp

### Database Schema

#### Submission Table
- `prototypeUrl`: TEXT - Stores link and/or file path
- `canRegenerate`: BOOLEAN - Controls edit access
- `status`: TEXT - IN_PROGRESS, SUBMITTED, LOCKED
- `submittedAt`: TIMESTAMP - Final submission time

#### ParticipantCertificate Table
- `id`: UUID
- `submissionId`: Foreign key to Submission
- `name`: TEXT
- `college`: TEXT
- `year`: TEXT
- `dept`: TEXT
- `role`: TEXT (LEADER or MEMBER)
- `certificateUrl`: TEXT (populated by admin)

## Workflow Trigger
The workflow modal opens automatically when:
1. Team clicks "Create Presentation" button
2. PPT generation completes successfully
3. Modal guides through all 3 steps

## Validation Rules
- **Step 1**: At least one of (link OR file) must be provided
- **Step 2**: All fields required for both participants
- **Step 3**: All previous steps must be completed
- **Final Lock**: Prevents any further changes to submission

## Admin Features
Admins can:
- View prototype links/files in the dashboard
- See certificate details for all teams
- Generate certificates using the stored participant information
- Download/access uploaded prototype files

## File Storage
- Prototype files stored in: `/backend/public/prototypes/`
- Naming convention: `prototype-{timestamp}-{random}.{ext}`
- Accessible via: `/prototypes/{filename}`

## Error Handling
- File size limit: 50MB
- Invalid file types rejected
- Missing required fields prevented
- Database transaction rollback on errors
- Uploaded files cleaned up on errors

## User Experience
- Clear progress indicators (3-step dots)
- Upload progress bar for files
- Success/error messages
- Cannot skip steps
- Back navigation allowed until final lock
- Warning before final submission
