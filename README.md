# 🎓 Smart SMS - School Management System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Production Ready](https://img.shields.io/badge/Production-Ready-brightgreen.svg)](AUDIT_EXECUTIVE_SUMMARY.md)
[![Security Hardened](https://img.shields.io/badge/Security-Hardened_95%2F100-success.svg)](PRODUCTION_HARDENING_REPORT.md)
[![Audit Score](https://img.shields.io/badge/Audit_Score-98%2F100-success.svg)](TECHNICAL_AUDIT_REPORT.md)
[![Node.js](https://img.shields.io/badge/Node.js-16.x-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4.4+-brightgreen.svg)](https://www.mongodb.com/)
[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)

**Smart SMS** is a complete, production-ready School Management System with role-based access control for Admin, Teacher, Student, and Parent portals. Built with **React**, **Node.js**, **Express**, and **MongoDB**.

> 🎉 **Status:** ✅ **PRODUCTION HARDENED** (95/100 Security Score)  
> 🔒 **Security:** Multi-layered protection with audit logging  
> 💾 **Backup:** Comprehensive disaster recovery procedures  
> 📊 **Audit:** 98/100 system audit, 0 critical issues  
> 
> [View Security Report](PRODUCTION_HARDENING_REPORT.md) | [View System Audit](AUDIT_EXECUTIVE_SUMMARY.md)

---

## ✨ Features

### 🔐 Four Role-Based Portals

#### 👨‍💼 Admin Portal
- Complete user management (Students, Teachers, Parents)
- Teacher-to-class and teacher-to-subject assignments
- View all attendance and grades
- Create announcements
- System analytics and reports

#### 👨‍🏫 Teacher Portal
- View assigned students only
- Mark and manage attendance
- Add and edit grades
- Create and manage assignments
- Grade student submissions

#### 👨‍🎓 Student Portal
- View own profile and academic records
- Check attendance history
- View grades and results
- Submit assignments
- View class timetable

#### 👨‍👩‍👧‍👦 Parent Portal
- Monitor linked children
- Switch between multiple children
- View attendance records
- Check grades and progress
- View assignments and fees

### 🌟 Key Capabilities

- ✅ **ONE Unified System** - All portals use the same database
- ✅ **Real-Time Sync** - Changes reflect immediately across all portals
- ✅ **Secure Authentication** - JWT-based with role validation
- ✅ **Relationship-Based Access** - Teachers see only assigned students
- ✅ **Bilingual Support** - English and Amharic (አማርኛ)
- ✅ **Responsive Design** - Works on desktop, tablet, and mobile
- ✅ **Complete Documentation** - Setup guides and API docs included

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v16 or higher)
- **MongoDB** (v4.4 or higher) - Local or MongoDB Atlas
- **Git**

### Installation

```bash
# Clone the repository
git clone https://github.com/ERMIYASZEWDU/smart-sms-school-management.git
cd smart-sms-school-management

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ..
npm install
```

### Configuration

```bash
# Create backend environment file
cd server
cp .env.example .env

# Edit .env and update:
# - MONGODB_URI (your MongoDB connection string)
# - JWT_SECRET (a strong random key)
# - PORT (default: 5000)
```

### Database Setup

```bash
# Run the seed script to create initial data
cd server
npm run seed
```

This creates:
- 1 Admin account
- 2 Teacher accounts (with class assignments)
- 5 Student accounts
- 2 Parent accounts (linked to students)
- Classes and subjects

### Start the Application

**Option 1: Using the start script (Windows)**
```powershell
.\start.ps1
```

**Option 2: Manual start (2 terminals)**

Terminal 1 - Backend:
```bash
cd server
npm start
```

Terminal 2 - Frontend:
```bash
npm run dev
```

### Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

---

## 📚 Documentation

### 🚀 Quick Start
- **[START HERE](START_HERE.md)** - 5-minute quick start guide

### 🔒 Production Security & Hardening (NEW!)
- **[Production Hardening Report](PRODUCTION_HARDENING_REPORT.md)** - Security assessment (95/100) & deployment checklist
- **[Production Security Guide](PRODUCTION_SECURITY_GUIDE.md)** - Environment config, JWT security, incident response
- **[Production Testing Guide](PRODUCTION_TESTING_GUIDE.md)** - 45 comprehensive test scenarios
- **[Database Backup & Recovery](DATABASE_BACKUP_RECOVERY.md)** - Backup strategies & disaster recovery

### ✅ Audit & Quality
- **[Audit Executive Summary](AUDIT_EXECUTIVE_SUMMARY.md)** - System audit results (98/100 - Production Ready)
- **[Technical Audit Report](TECHNICAL_AUDIT_REPORT.md)** - Comprehensive 17-section technical audit

### 📖 Setup & Integration
- **[Installation Guide](INSTALLATION_GUIDE.md)** - Detailed setup with 51 test scenarios
- **[Production Ready Summary](PRODUCTION_READY_SUMMARY.md)** - All features and security explained
- **[Production Ready Final Report](PRODUCTION_READY_FINAL_REPORT.md)** - Complete system report
- **[Integration Report](SMART_SMS_INTEGRATION_COMPLETE.md)** - Complete system documentation

---

## 🏗️ Architecture

```
                    SMART SMS
                        |
                     LOGIN (JWT)
                        |
                  Role Detection
                        |
        +---------------+---------------+
        |               |               |
      ADMIN          TEACHER         STUDENT
        |               |               |
        +---------------+---------------+
                        |
                      PARENT
                        |
                    API Layer
                        |
                     MongoDB
```

**Key Principle**: All roles use the SAME database with role-based filtering.

---

## 🛠️ Technology Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Framer Motion** - Animations
- **React Router** - Navigation
- **Axios** - HTTP client
- **React i18next** - Internationalization
- **Recharts** - Data visualization

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Bcrypt** - Password hashing

---

## 📁 Project Structure

```
smart-sms-school-management/
├── server/                     # Backend (Express + MongoDB)
│   ├── models/                # Database models
│   │   ├── User.js           # Authentication
│   │   ├── Student.js        # Student profiles
│   │   ├── Teacher.js        # Teacher profiles
│   │   ├── Parent.js         # Parent profiles
│   │   ├── Class.js          # Classes
│   │   ├── Subject.js        # Subjects
│   │   ├── Grade.js          # Grades/Results
│   │   ├── Attendance.js     # Attendance records
│   │   ├── Assignment.js     # Assignments
│   │   └── Announcement.js   # Announcements
│   ├── routes/               # API endpoints
│   │   ├── auth.js          # Authentication
│   │   ├── admin.js         # Admin APIs
│   │   ├── teacher.js       # Teacher APIs
│   │   ├── student.js       # Student APIs
│   │   └── parent.js        # Parent APIs
│   ├── middleware/          # Auth middleware
│   ├── seed.js              # Database seeding
│   └── index.js             # Server entry point
│
├── src/                      # Frontend (React + Vite)
│   ├── pages/
│   │   ├── dashboards/      # Role dashboards
│   │   ├── AdminPages/      # Admin pages
│   │   ├── TeacherPages/    # Teacher pages
│   │   ├── StudentPages/    # Student pages
│   │   └── ParentPages/     # Parent pages
│   ├── services/            # API services
│   ├── components/          # Reusable components
│   └── utils/               # Utility functions
│
├── docs/                     # Documentation
└── README.md                 # This file
```

---

## 🔒 Security Features

- ✅ **JWT Authentication** - Secure token-based auth
- ✅ **Password Hashing** - Bcrypt encryption
- ✅ **Role-Based Access Control** - Backend validation
- ✅ **Rate Limiting** - Brute force protection (5 attempts/15min)
- ✅ **Helmet Security Headers** - XSS, clickjacking protection
- ✅ **CORS Protection** - Origin validation
- ✅ **Input Validation** - Comprehensive backend validation
- ✅ **Audit Logging** - Track all critical actions (NEW!)
- ✅ **Health Monitoring** - System health checks (NEW!)
- ✅ **Error Sanitization** - No sensitive data in production errors (NEW!)
- ✅ **Database Indexes** - Optimized query performance (NEW!)
- ✅ **Backup Strategy** - Comprehensive disaster recovery (NEW!)

**Security Score:** 95/100 | [View Security Report](PRODUCTION_HARDENING_REPORT.md)

---

## 🔒 Security Features

- ✅ **JWT Authentication** - Secure token-based auth
- ✅ **Password Hashing** - Bcrypt encryption
- ✅ **Role-Based Access Control** - Backend validation
- ✅ **Relationship Verification** - Teachers access only assigned students
- ✅ **Parent-Child Linking** - Parents see only linked children
- ✅ **No Password Exposure** - Never returned in API responses

---

## 🌍 Internationalization

Supports **English** and **Amharic (አማርኛ)** with:
- Complete UI translation
- Persistent language selection
- Cultural considerations for Ethiopian schools

---

## 🧪 Testing

### Quick Integration Test

1. Login as Teacher: `teacher1@smartsms.et`
2. Navigate to Students page
3. Verify students appear (should see 3 students)
4. Go to Grades → Add Grade
5. Verify student dropdown is populated ✅

### Full Test Scenarios

See [Quick Start Guide](QUICK_START_GUIDE_INTEGRATED.md) for complete test scenarios.

---

## 🚀 Live Demo

**Frontend (Vercel):** https://school-management-ebon-five.vercel.app  
**Backend (Render):** https://smart-sms-backend.onrender.com  
**Keep-Alive Tool:** https://school-management-ebon-five.vercel.app/keep-alive.html


### ⚡ Note About Backend (Render Free Tier)
The backend may take 30-60 seconds to wake up on first request after inactivity. Use the [Keep-Alive Tool](https://school-management-ebon-five.vercel.app/keep-alive.html) to keep it awake for instant responses.

---

## 🚀 Deployment

### Backend Deployment (Render/Railway/Heroku)

1. Push to GitHub
2. Connect repository to hosting service
3. Set environment variables:
   - `MONGODB_URI` (MongoDB Atlas connection string)
   - `JWT_SECRET` (strong random key)
   - `PORT` (optional, defaults to 5000)

**Current Production Backend:** https://smart-sms-backend.onrender.com

### Frontend Deployment (Vercel/Netlify)

1. Connect GitHub repository
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Set environment variable:
   - `VITE_API_URL` (your backend URL)

**Current Production Frontend:** https://school-management-ebon-five.vercel.app

### Keep Backend Awake (Render Free Tier)

Render's free tier spins down after 15 minutes of inactivity. Use the built-in keep-alive tool:

**Keep-Alive Tool:** https://school-management-ebon-five.vercel.app/keep-alive.html

Features:
- ✅ Auto-pings backend every 10 minutes
- ✅ Prevents cold starts (30-60s delay)
- ✅ Shows live status and activity log
- ✅ Start/Stop controls
- ✅ Beautiful UI with real-time monitoring

> ⚠️ The keep-alive tool only pings while a browser tab is open. For 24/7 wake-ups
> without keeping a tab open (recommended), create a free monitor at
> [cron-job.org](https://cron-job.org) or [UptimeRobot](https://uptimerobot.com)
> that hits `https://smart-sms-backend.onrender.com/api/health` every 5-10 minutes.
> A monitoring tool can also notify you when the backend goes down.

**Usage:** Keep the page open in a browser tab (can minimize). Backend stays awake automatically!

---

## 📊 Key Features Highlight

### Teacher-Student Relationship
- **Problem Solved**: Teachers can now see their assigned students
- **Grade Dropdown Fixed**: No more empty dropdowns!
- **Proper Filtering**: Teachers see only students in assigned classes

### Data Synchronization
- **Real-Time Updates**: Changes reflect across all portals immediately
- **Single Source of Truth**: All roles use the same database
- **No Duplicate Data**: One attendance record, one grade record

### Attendance Flow
```
Teacher marks attendance → Database → Admin/Student/Parent see it
```

### Grade Flow
```
Teacher adds grade → Database → Admin/Student/Parent see it
```

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/YourFeature`
3. Commit changes: `git commit -m 'Add YourFeature'`
4. Push to branch: `git push origin feature/YourFeature`
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👨‍💻 Author

**Ermiyas Zewdu**
- GitHub: [@ERMIYASZEWDU](https://github.com/ERMIYASZEWDU)

---

## 🙏 Acknowledgments

- Ethiopian Education System for inspiration
- All contributors and testers
- Open source community

---

## 📞 Support

For issues, questions, or suggestions:
1. Check the [documentation](SMART_SMS_INTEGRATION_COMPLETE.md)
2. Open an [issue](https://github.com/ERMIYASZEWDU/smart-sms-school-management/issues)
3. Review the [Quick Start Guide](QUICK_START_GUIDE_INTEGRATED.md)

---

## ✨ What's Special About This System?

### The Golden Rule (Enforced!)
```
ADMIN creates data → DATABASE → Available to authorized users
TEACHER uses data → For assigned classes ONLY
STUDENT sees data → Own data ONLY  
PARENT sees data → Linked children ONLY

EVERYONE USES THE SAME DATABASE ✅
```

No mock data. No separate databases. One unified system.

---

## 🎯 Roadmap

- [ ] Mobile app (React Native)
- [ ] Fee management enhancements
- [ ] Real-time notifications (WebSocket)
- [ ] Report card generation (PDF)
- [ ] Exam schedule management
- [ ] Library management module
- [ ] Transport management
- [ ] Hostel management

---

**⭐ If you find this project helpful, please give it a star!**

**🚀 Ready to revolutionize school management in Ethiopia!**
