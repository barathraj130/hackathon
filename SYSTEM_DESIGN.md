# PPT Generation Platform - System Design

## 🏗️ System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                             │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │  Admin Dashboard │         │ Team Portal │         │
│  │  - React/Next.js │         │  - React/Next.js │         │
│  └──────────────────┘         └──────────────────┘         │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    API GATEWAY LAYER                         │
│              - Authentication & Authorization                │
│              - Rate Limiting & Load Balancing                │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND SERVICES                           │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │   Auth     │  │   Admin    │  │ Team  │            │
│  │  Service   │  │  Service   │  │  Service   │            │
│  └────────────┘  └────────────┘  └────────────┘            │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │    PPT     │  │ Certificate│  │   Timer    │            │
│  │ Generator  │  │ Generator  │  │  Service   │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    System LAYER                                  │
│  ┌────────────┐  ┌────────────┐                             │
│  │  LLM API   │  │  Template  │                             │
│  │ (GPT-4/    │  │  Engine    │                             │
│  │  )   │  │            │                             │
│  └────────────┘  └────────────┘                             │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                   DATA LAYER                                 │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │ PostgreSQL │  │   Redis    │  │   S3/      │            │
│  │   (Main)   │  │  (Cache/   │  │  Storage   │            │
│  │            │  │   Queue)   │  │  (Files)   │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Database Schema

### Users Table
```sql
- id (PK)
- email (unique)
- password_hash
- role (ADMIN | CANDIDATE)
- name
- created_at
- updated_at
```

### Teams Table
```sql
- id (PK)
- user_id (FK)
- registration_number
- college_name
- year
- department
- team_members (JSON)
- status (NOT_STARTED | IN_PROGRESS | SUBMITTED)
- created_at
```

### PPT_Submissions Table
```sql
- id (PK)
- team_id (FK)
- title
- abstract
- problem_statement
- solution
- technologies (JSON)
- team_details (JSON)
- content (JSON - autosaved)
- file_url
- status (DRAFT | SUBMITTED | APPROVED | REJECTED)
- submitted_at
- approved_at
```

### Test_Config Table
```sql
- id (PK)
- start_time
- end_time
- duration_minutes
- is_paused
- ppt_template_config (JSON)
- created_by (FK to admin)
```

### Certificates Table
```sql
- id (PK)
- team_id (FK)
- certificate_type (PARTICIPATION | WINNER | MERIT)
- file_url
- issued_at
```

## 🎨 Tech Stack Recommendation

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand or React Context
- **Forms**: React Hook Form + Zod validation
- **Real-time**: Socket.io client

### Backend
- **Runtime**: Node.js (Express) or Python (FastAPI)
- **Database**: PostgreSQL 15
- **Cache/Queue**: Redis
- **Real-time**: Socket.io
- **Authentication**: JWT + bcrypt
- **File Storage**: AWS S3 / Cloudinary

### System & Document Generation
- **LLM**: OpenSystem GPT-4 / Google  API
- **PPT Generation**: python-pptx or officegen (Node.js)
- **PDF Generation**: PDFKit / Puppeteer / jsPDF
- **Template Engine**: Handlebars / EJS

### DevOps
- **Containerization**: Docker
- **Orchestration**: Docker Compose (dev) / Kubernetes (prod)
- **CI/CD**: GitHub Actions
- **Monitoring**: Sentry + LogRocket

## 🔄 System Workflows

### Admin Workflow
1. Login → Dashboard
2. Configure Test (time, PPT template, rules)
3. View Enrolled Teams
4. Start Test at scheduled time
5. Monitor Progress (real-time)
6. Pause/Resume Test (optional)
7. Auto-lock at end time
8. Review Submissions
9. Approve/Reject PPTs
10. Generate & Issue Certificates
11. Download Reports

### Team Workflow
1. Enroll → Login
2. Wait for Test Start
3. Test Starts → Fill Form
4. Auto-save Progress (every 30s)
5. View Timer Countdown
6. Generate PPT Preview
7. Submit (or Auto-submit at end)
8. View Status
9. Download Approved PPT & Certificate

## ⏱️ Real-time Features

### Timer Synchronization
- Server-side master clock
- WebSocket broadcast to all teams
- Client-side sync every 5 seconds
- Handle network disconnection gracefully

### Auto-save Strategy
- Save draft every 30 seconds
- Save on field blur
- Save on network reconnect
- Optimistic UI updates

### Admin Controls
- **Pause**: Freeze timer for all teams
- **Resume**: Continue from paused time
- **Extend**: Add extra time if needed
- **Force Submit**: End test immediately

## 🔐 Security Considerations

1. **Authentication**: JWT with httpOnly cookies
2. **Authorization**: Role-based access control (RBAC)
3. **Rate Limiting**: Prevent API abuse
4. **Input Validation**: Server + client side
5. **SQL Injection**: Parameterized queries
6. **XSS Protection**: Content sanitization
7. **CSRF Protection**: CSRF tokens
8. **File Upload**: Validate file types/sizes
9. **Encryption**: HTTPS, encrypted passwords

## 📈 Scalability Strategy

- **Horizontal Scaling**: Load balancer + multiple instances
- **Caching**: Redis for session, frequently accessed data
- **Queue System**: Bull/BullMQ for PPT generation jobs
- **CDN**: Serve static assets
- **Database**: Read replicas for reporting
- **Websocket**: Sticky sessions or Redis adapter
