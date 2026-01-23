# PPT Generation Platform - Strict Admin-Controlled Design

## 🏗️ System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                             │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │  Admin Dashboard │         │ Candidate Portal │         │
│  │  (Full Control)  │         │  (Restricted)    │         │
│  └──────────────────┘         └──────────────────┘         │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    API GATEWAY LAYER                         │
│              - Authentication (JWT)                          │
│              - Role Validation (Strict)                      │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND SERVICES                           │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │   Auth     │  │   Admin    │  │ Candidate  │            │
│  │  Service   │  │  Service   │  │  Service   │            │
│  └────────────┘  └────────────┘  └────────────┘            │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │    PPT     │  │ Certificate│  │   Timer    │            │
│  │ Generator  │  │ Generator  │  │  Service   │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

## 🔐 User Roles & Permissions

### 1. Admin (Superuser)
- **Create Candidates**: Generate username/password manually.
- **Manage Access**: Enable/Disable login, Reset credentials.
- **Control Test**: Start/Pause/Resume/End test globally.
- **Preview & Lock**: View candidate progress, Lock submissions.
- **Certificates**: Approve and generate certificates.
- **Define Structure**: Enforce strict slide format.

### 2. Candidate (Restricted)
- **Login**: Use admin-provided credentials only.
- **Form Input**: Fill specific fields (Problem, Solution, etc.).
- **Read-Only Timers**: View global countdown.
- **No Formatting**: Cannot change fonts, colors, or slide order.
- **Limited Downloads**: Only downloadable if enabled by Admin.

---

## 📊 Database Schema

### Users Table
```sql
- id (PK)
- username (unique, assigned by admin)
- password_hash
- role (ADMIN | CANDIDATE)
- is_active (boolean) - for disabling access
- created_by (FK to Admin)
```

### Candidates Table
```sql
- id (PK)
- user_id (FK)
- full_name
- college_name
- department
- team_type (INDIVIDUAL | TEAM)
- team_members (JSON, optional)
- status (NOT_STARTED | IN_PROGRESS | SUBMITTED | LOCKED)
```

### Submissions Table
```sql
- id (PK)
- candidate_id (FK)
- title
- abstract
- problem_statement
- existing_system
- proposed_solution
- architecture_text
- tech_stack
- use_case
- conclusion
- is_locked (boolean)
- submitted_at
```

### Test_Config Table
```sql
- id (PK)
- start_time
- end_time
- is_paused
- slide_structure (JSON - Fixed 7 slides)
- theme_config (JSON - Admin defined)
```

---

## 🔄 Workflows

### Admin Workflow
1.  **Login**: Secure admin login.
2.  **Create Users**: Bulk import or manual creation of candidates (Username/Pass).
3.  **Distribute**: Share credentials with candidates off-platform or via email.
4.  **Configure Test**: Set strict 7-slide structure & Times.
5.  **Start Test**: Triggers timer for all logged-in candidates.
6.  **Monitor**: Real-time view of "In Progress" vs "Submitted".
7.  **Review**: Preview generated PPTs.
8.  **Approve**: Issue certificates (Winner/Participation).

### Candidate Workflow
1.  **Login**: Enter credentials provided by Admin.
2.  **Wait**: Dashboard shows "Test Starting In..." timer.
3.  **Start**: When admin starts, form becomes editable.
4.  **Input**: Fill text fields (Problem, Solution, etc.). Autosave is active.
5.  **Pause**: If admin pauses, form becomes read-only.
6.  **Submit**: Auto-submit at end time.
7.  **Wait**: "Evaluation in Progress" screen.
8.  **Download**: Get Certificate/PPT if approved.

---

## 🧠 AI Prompt Logic

### PPT Generation (Strict Structure)
```
You are a PPT Generator for a Hackathon.
Constraint: Follow this EXACT 7-slide structure. NO deviation.

Slide 1: Title
- Title: {candidate_title}
- Subtitle: {candidate_name} | {college_name}
- Footer: {admin_event_name}

Slide 2: Problem Statement
- Header: "Problem Statement"
- Content: transform({problem_statement}) into 3-4 bullet points.

Slide 3: Existing System
- Header: "Existing System"
- Content: transform({existing_system}) into "Current Limitations".

Slide 4: Proposed Solution
- Header: "Proposed Solution"
- Content: transform({proposed_solution}) into "Key Innovations".

Slide 5: System Architecture
- Header: "System Architecture"
- Content: Create a text-based block diagram from {architecture_text}.

Slide 6: Technology Stack
- Header: "Technology Stack"
- Content: Categorize {tech_stack} into Frontend/Backend/DB/AI.

Slide 7: Conclusion
- Header: "Conclusion & Impact"
- Content: transform({use_case}) into "Future Scope".
```

---

## 🛠️ Suggested Tech Stack

-   **Frontend**: Next.js (React) - Simple forms, Real-time updates.
-   **Backend**: Node.js (Express) - WebSocket for Timer/Locks.
-   **Database**: PostgreSQL (Relational integrity).
-   **AI**: OpenAI GPT-4 or Gemini Pro (Text transformation).
-   **PPT Engine**: `python-pptx` (Service) or `PptxGenJS`.
-   **PDF Engine**: `PDFKit` (Certificates).
