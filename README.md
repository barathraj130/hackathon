# 🎓 Hackathon PPT Generation Platform

## Smart-Engine Presentation Platform for College Hackathons

A complete web-based system for managing hackathons with automatic PPT generation, real-time timer synchronization, and certificate generation.

---

## ✨ Features

### 👨‍💼 Admin Features
- ✅ Secure admin authentication
- ✅ Real-time dashboard with team statistics
- ✅ Configure test timings and PPT templates
- ✅ Pause/Resume test controls
- ✅ View team progress in real-time
- ✅ Approve/Reject submissions
- ✅ Auto-generate certificates (PDF)
- ✅ Download reports

### 👨‍🎓 Team Features
- ✅ User registration and login
- ✅ Real-time synchronized countdown timer
- ✅ Auto-save every 30 seconds
- ✅ Multi-step submission form
- ✅ System-powered PPT generation (ready for integration)
- ✅ Download generated PPT and certificates
- ✅ Responsive design

### 🎨 Design Highlights
- 🌈 Modern gradient backgrounds
- 🔮 Glass morphism effects
- ✨ Smooth animations and transitions
- 📱 Fully responsive
- 🎯 Premium UI/UX
- ⚡ Real-time WebSocket updates

---

## 🚀 Quick Start

### Prerequisites
```bash
Node.js 18+
npm or yarn
```

### Installation

1. **Clone and navigate:**
```bash
cd /Users/barathraj/Desktop/HACKATHON
```

2. **Backend Setup:**
```bash
cd backend
npm install
npm run dev
# Server runs on http://localhost:5000
```

3. **Frontend Setup (new terminal):**
```bash
cd frontend
npm install
npm run dev
# App runs on http://localhost:3000
```

4. **Access the Platform:**
- Homepage: http://localhost:3000
- Admin Login: http://localhost:3000/admin/login
- Team Login: http://localhost:3000/login

---

## 📁 Project Structure

```
HACKATHON/
├── backend/
│   ├── server.js              # Express + Socket.io server
│   ├── routes/
│   │   ├── auth.js            # Authentication routes
│   │   ├── admin.js           # Admin dashboard & controls
│   │   └── team.js       # Team submission routes
│   ├── .env                   # Environment variables
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   └── app/
│   │       ├── page.js                    # Landing page
│   │       ├── login/page.js              # Team login
│   │       ├── register/page.js           # Registration
│   │       ├── admin/
│   │       │   ├── login/page.js          # Admin login
│   │       │   └── dashboard/page.js      # Admin dashboard
│   │       └── team/
│   │           └── dashboard/page.js      # Team form & timer
│   ├── .env.local
│   └── package.json
│
└── Documentation/
    ├── SYSTEM_DESIGN.md
    ├── API_DESIGN.md
    ├── System_PROMPT_LOGIC.md
    └── IMPLEMENTATION_ROADMAP.md
```

---

## 🔑 Default Test Credentials

### Create Admin User (First Time)
Since this is a demo with in-memory database, you need to create an admin user first:

1. Enroll a regular team account
2. In the backend, modify `global.db.users` to change the user's role to 'ADMIN'
3. Or modify the registration route to create an admin when using a specific email

**Recommended for testing:**
- Email: `admin@test.com`
- Password: `admin123`
- Modify the code to create this admin automatically

### Regular Team
- Enroll normally through `/register`

---

## 🛠️ Tech Stack

### Backend
- **Framework:** Node.js + Express
- **Real-time:** Socket.io
- **Auth:** JWT + bcrypt
- **Database:** In-memory (ready for PostgreSQL)

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Real-time:** Socket.io-client
- **HTTP:** Axios

---

## 🌐 API Endpoints

### Authentication
- `POST /v1/auth/register` - Enroll team
- `POST /v1/auth/login` - Login (admin/team)

### Admin
- `GET /v1/admin/dashboard` - Dashboard stats
- `GET /v1/admin/teams` - Get all teams
- `POST /v1/admin/test-config` - Configure test
- `PUT /v1/admin/submissions/:id/approve` - Approve submission
- `PUT /v1/admin/submissions/:id/reject` - Reject submission

### Team
- `GET /v1/team/profile` - Get profile
- `GET /v1/team/test-status` - Get test timing status
- `POST /v1/team/submission` - Save/auto-save submission
- `POST /v1/team/submission/:id/submit` - Final submit
- `GET /v1/team/certificate` - Get certificate

### WebSocket Events
- `admin_start_test` - Start test
- `admin_pause_test` - Pause test
- `admin_resume_test` - Resume test
- `timer_update` - Real-time timer sync (1s interval)
- `test_ended` - Auto-submit trigger

---

## 🔮 Future Enhancements

### Phase 2 (Production Ready)
- [ ] PostgreSQL database integration
- [ ] Redis for caching and sessions
- [ ] OpenSystem/ API for PPT generation
- [ ] python-pptx for .pptx file creation
- [ ] PDFKit for certificate generation
- [ ] AWS S3 for file storage
- [ ] Docker containerization
- [ ] CI/CD pipeline
- [ ] Email notifications
- [ ] Analytics dashboard

### Phase 3 (Advanced)
- [ ] Multi-language support
- [ ] Multiple hackathon management
- [ ] Live judging interface
- [ ] Plagiarism detection
- [ ] Mobile app
- [ ] Export to Google Slides/PDF

---

## 📊 Real-Time Features

1. **Timer Synchronization:** Server broadcasts time every second to all connected teams
2. **Admin Controls:** Pause/Resume propagates instantly to all users
3. **Progress Tracking:** Admin sees real-time team progress
4. **Auto-Submit:** When time ends, all teams auto-submit
5. **Auto-Save:** Team work saved every 30 seconds

---

## 🎨 UI/UX Highlights

- **Inter Font Family** - Professional typography
- **Gradient Backgrounds** - Eye-catching purple/blue/pink gradients
- **Glass Morphism** - Modern frosted glass effect cards
- **Smooth Animations** - Hover effects, floating orbs, transitions
- **Responsive Design** - Mobile, tablet, desktop optimized
- **Dark Mode Ready** - Admin portal uses dark theme
- **Progress Indicators** - Visual progress bars and badges
- **Real-Time Feedback** - Loading states, success/error messages

---

## 🔐 Security Features

- ✅ JWT token authentication
- ✅ Password hashing with bcrypt
- ✅ Role-based access control (RBAC)
- ✅ CORS protection
- ✅ Input validation
- ✅ Environment variable secrets
- ✅ HttpOnly cookies (production)
- ✅ Rate limiting ready

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### WebSocket Connection Issues
- Ensure backend is running first
- Check NEXT_PUBLIC_WS_URL in frontend/.env.local
- Clear browser cache and localStorage

### Auto-Save Not Working
- Check browser console for errors
- Ensure test is active and not paused
- Verify WebSocket connection

---

## 📝 License

MIT License - Feel free to use for your hackathons!

---

## 🙌 Credits

Built with ❤️ for college hackathons
- Design: Modern glassmorphism + gradients
- Icons: Emoji (universal support)
- Font: Inter (Google Fonts)

---

## 📧 Support

For issues or questions, please create an issue or contact the admin.

---

**Happy Hacking! 🚀**
