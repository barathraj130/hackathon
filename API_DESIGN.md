# API Design & Endpoints

## 📡 RESTful API Structure

Base URL: `https://api.hackathon-ppt.com/v1`

---

## 🔐 Authentication Endpoints

### POST `/auth/register`
**Role**: Team
```json
Request:
{
  "email": "student@college.edu",
  "password": "SecurePass123",
  "name": "John Doe",
  "registration_number": "REG2024001",
  "college_name": "ABC College",
  "year": 3,
  "department": "Computer Science",
  "team_members": ["Jane Smith", "Bob Johnson"]
}

Response (201):
{
  "success": true,
  "user_id": "uuid",
  "token": "jwt_token"
}
```

### POST `/auth/login`
```json
Request:
{
  "email": "admin@college.edu",
  "password": "AdminPass123"
}

Response (200):
{
  "success": true,
  "token": "jwt_token",
  "role": "ADMIN",
  "user": {
    "id": "uuid",
    "name": "Admin"
  }
}
```

### POST `/auth/logout`
**Headers**: `Authorization: Bearer {token}`

---

## 👨💼 Admin Endpoints

### GET `/admin/dashboard`
**Role**: Admin
```json
Response (200):
{
  "total_teams": 150,
  "statuses": {
    "not_started": 45,
    "in_progress": 80,
    "submitted": 25
  },
  "test_config": {
    "start_time": "2026-01-22T14:00:00Z",
    "end_time": "2026-01-22T17:00:00Z",
    "is_active": true,
    "is_paused": false
  }
}
```

### GET `/admin/teams`
**Query Params**: `?page=1&limit=20&status=IN_PROGRESS&search=john`
```json
Response (200):
{
  "teams": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@college.edu",
      "registration_number": "REG2024001",
      "status": "IN_PROGRESS",
      "progress_percentage": 65,
      "last_saved": "2026-01-22T15:30:00Z",
      "team_members": ["Jane", "Bob"]
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "total_pages": 8
  }
}
```

### POST `/admin/test-config`
**Role**: Admin
```json
Request:
{
  "start_time": "2026-01-22T14:00:00Z",
  "end_time": "2026-01-22T17:00:00Z",
  "duration_minutes": 180,
  "ppt_template": {
    "slides": [
      {
        "type": "title",
        "required_fields": ["title", "team_name"]
      },
      {
        "type": "problem",
        "max_points": 5
      },
      {
        "type": "solution",
        "max_points": 6
      },
      {
        "type": "architecture",
        "max_points": 5
      },
      {
        "type": "tech_stack",
        "categories": ["Frontend", "Backend", "Database", "System/ML"]
      },
      {
        "type": "conclusion",
        "max_points": 4
      }
    ],
    "theme": {
      "primary_color": "#1e40af",
      "secondary_color": "#3b82f6",
      "font_family": "Arial",
      "title_font_size": 44,
      "content_font_size": 24
    },
    "logo_url": "https://storage.com/college-logo.png"
  }
}

Response (200):
{
  "success": true,
  "config_id": "uuid"
}
```

### PUT `/admin/test/pause`
**Role**: Admin
```json
Response (200):
{
  "success": true,
  "is_paused": true,
  "paused_at": "2026-01-22T15:30:00Z",
  "remaining_time_seconds": 3600
}
```

### PUT `/admin/test/resume`
**Role**: Admin

### GET `/admin/submissions/:submission_id`
```json
Response (200):
{
  "id": "uuid",
  "team": {
    "name": "John Doe",
    "registration_number": "REG2024001"
  },
  "title": "Smart-Engine Healthcare Solution",
  "content": {...},
  "ppt_preview_url": "https://storage.com/preview.png",
  "ppt_download_url": "https://storage.com/ppt.pptx",
  "submitted_at": "2026-01-22T17:00:00Z",
  "status": "SUBMITTED"
}
```

### PUT `/admin/submissions/:submission_id/approve`
```json
Request:
{
  "certificate_type": "WINNER",
  "feedback": "Excellent work!"
}

Response (200):
{
  "success": true,
  "status": "APPROVED",
  "certificate_url": "https://storage.com/cert.pdf"
}
```

### PUT `/admin/submissions/:submission_id/reject`
```json
Request:
{
  "reason": "Incomplete solution description"
}
```

### GET `/admin/reports/export`
**Query Params**: `?format=csv`
**Response**: Download CSV/Excel file

---

## 👨🎓 Team Endpoints

### GET `/team/profile`
**Role**: Team
```json
Response (200):
{
  "id": "uuid",
  "name": "John Doe",
  "email": "john@college.edu",
  "registration_number": "REG2024001",
  "status": "IN_PROGRESS",
  "team_members": ["Jane", "Bob"]
}
```

### GET `/team/test-status`
```json
Response (200):
{
  "is_active": true,
  "is_paused": false,
  "start_time": "2026-01-22T14:00:00Z",
  "end_time": "2026-01-22T17:00:00Z",
  "current_server_time": "2026-01-22T15:45:00Z",
  "remaining_seconds": 4500,
  "can_submit": true
}
```

### POST `/team/submission`
**Auto-save every 30 seconds**
```json
Request:
{
  "title": "Smart-Engine Healthcare Solution",
  "abstract": "Our solution uses System to...",
  "problem_statement": "Current healthcare systems face...",
  "solution": "We propose a system that...",
  "technologies": {
    "frontend": ["React", "Tailwind"],
    "backend": ["Node.js", "Express"],
    "database": ["PostgreSQL"],
    "ai_ml": ["TensorFlow", "OpenSystem API"]
  },
  "team_details": {
    "team_name": "Tech Innovators",
    "members": ["John Doe", "Jane Smith"]
  },
  "is_draft": true
}

Response (200):
{
  "success": true,
  "submission_id": "uuid",
  "last_saved": "2026-01-22T15:45:30Z"
}
```

### POST `/team/submission/:id/generate-ppt`
```json
Response (202):
{
  "job_id": "uuid",
  "message": "PPT generation started",
  "estimated_time_seconds": 30
}
```

### GET `/team/submission/:id/ppt-status`
```json
Response (200):
{
  "status": "COMPLETED",
  "preview_url": "https://storage.com/preview.png",
  "download_url": "https://storage.com/ppt.pptx",
  "generated_at": "2026-01-22T16:00:00Z"
}
```

### POST `/team/submission/:id/submit`
**Final submission (cannot be undone)**
```json
Response (200):
{
  "success": true,
  "submitted_at": "2026-01-22T16:30:00Z",
  "message": "Submission successful"
}
```

### GET `/team/certificate`
```json
Response (200):
{
  "available": true,
  "certificate_type": "PARTICIPATION",
  "download_url": "https://storage.com/cert.pdf",
  "issued_at": "2026-01-23T10:00:00Z"
}
```

---

## 🔄 WebSocket Events

### Connection
```javascript
// Client connects
socket.emit('join', { token: 'jwt_token', role: 'CANDIDATE' });

// Server acknowledges
socket.on('joined', { user_id: 'uuid', room: 'teams' });
```

### Timer Sync
```javascript
// Server broadcasts every second
socket.on('timer_update', {
  remaining_seconds: 4500,
  server_time: '2026-01-22T15:45:00Z',
  is_paused: false
});
```

### Admin Controls
```javascript
// Admin pauses test
socket.emit('admin_pause_test');

// All teams receive
socket.on('test_paused', {
  paused_at: '2026-01-22T15:30:00Z',
  remaining_time: 3600
});

// Admin resumes
socket.emit('admin_resume_test');
socket.on('test_resumed', { resumed_at: '...' });
```

### Auto-submit Trigger
```javascript
// When time ends
socket.on('test_ended', {
  message: 'Test time over. Submitting automatically...',
  force_submit: true
});
```

### Progress Updates
```javascript
// Team saves
socket.emit('progress_update', { submission_id: 'uuid', percentage: 65 });

// Admin sees in real-time
socket.on('team_progress', {
  team_id: 'uuid',
  percentage: 65
});
```

---

## 🛡️ Error Responses

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "You don't have permission to access this resource"
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Resource not found"
}
```

### 409 Conflict
```json
{
  "error": "Conflict",
  "message": "Test has already ended. Cannot submit."
}
```

### 429 Too Many Requests
```json
{
  "error": "Rate Limit Exceeded",
  "message": "Too many requests. Try again in 60 seconds.",
  "retry_after": 60
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "Something went wrong. Please try again."
}
```
