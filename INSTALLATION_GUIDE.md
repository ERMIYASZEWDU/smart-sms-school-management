# Smart SMS Installation & Testing Guide

## 📋 Prerequisites

Before you begin, ensure you have:
- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas account)
- npm or yarn package manager
- Git (for version control)

---

## 🚀 Quick Start Installation

### Step 1: Install Dependencies

#### Install Server Dependencies
```powershell
cd server
npm install
```

**New dependencies added:**
- `helmet` - Security headers
- `express-validator` - Request validation
(These will be installed automatically)

#### Install Client Dependencies
```powershell
cd ..
npm install
```

### Step 2: Configure Environment Variables

Create `.env` file in the `server` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/school-management
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/school-management

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# CORS
CORS_ORIGIN=http://localhost:5173
```

**⚠️ Important:** Change `JWT_SECRET` to a strong random string in production!

### Step 3: Seed Database

```powershell
cd server
npm run seed
```

This will create:
- **Admin**: admin@smartsms.et / Admin@123
- **Teacher**: teacher1@smartsms.et / Teacher@123
- **Student**: student1@smartsms.et / Student@123
- **Parent**: parent1@smartsms.et / Parent@123
- Classes (Grade 10-A, Grade 11-A)
- Sample students, attendance, grades

### Step 4: Start the Application

#### Option A: Using PowerShell Script (Recommended)
```powershell
.\start.ps1
```

This will:
1. Check if MongoDB is running
2. Start the backend server (port 5000)
3. Start the frontend dev server (port 5173)

#### Option B: Manual Start

**Terminal 1 - Backend:**
```powershell
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```powershell
npm run dev
```

### Step 5: Access the Application

Open your browser and navigate to:
```
http://localhost:5173
```

---

## 🧪 COMPREHENSIVE TESTING GUIDE

### Test 1: Authentication & Security

#### 1.1 Login Flow
1. Go to `http://localhost:5173/login`
2. Try invalid credentials:
   - Email: `invalid@test.com`
   - Password: `wrong`
   - ✅ **Expected**: "Invalid credentials" error
   - ✅ **Check**: Error message displays properly

3. Try valid admin credentials:
   - Email: `admin@smartsms.et`
   - Password: `Admin@123`
   - ✅ **Expected**: Redirect to admin dashboard
   - ✅ **Check**: Token saved in localStorage

#### 1.2 Rate Limiting
1. Attempt to login 6 times with wrong password in 15 minutes
2. ✅ **Expected**: After 5 attempts, receive "Too many authentication attempts" error
3. ✅ **Check**: Must wait before trying again

#### 1.3 Session Persistence
1. Login as admin
2. Refresh the page
3. ✅ **Expected**: Still logged in
4. Close browser and reopen
5. ✅ **Expected**: Still logged in (token persisted)

#### 1.4 Token Expiration
1. Login and get token
2. Wait 7 days OR manually expire token
3. Try to access any page
4. ✅ **Expected**: Redirect to login page
5. ✅ **Check**: "Session expired" message

---

### Test 2: Admin Workflow

#### 2.1 Create Student
1. Login as admin
2. Navigate to "Students"
3. Click "Add Student"
4. Try submitting without filling required fields:
   - ✅ **Expected**: Validation errors for each field
   - ✅ **Check**: Red error messages below fields

5. Fill valid data:
   ```
   Name: Abebe Bekele
   Email: abebe.bekele@test.et
   Password: Student@123
   Enrollment: STU001
   Grade: Grade 10
   Section: A
   Roll Number: 25
   Date of Birth: 2008-01-15
   Guardian Name: Bekele Tesfa
   Guardian Phone: +251911123456
   Address: Addis Ababa, Ethiopia
   ```
6. Click "Save"
7. ✅ **Expected**: Success toast "Student created successfully"
8. ✅ **Check**: Student appears in list
9. ✅ **Check**: Can search by name "Abebe"

#### 2.2 Duplicate Student Check
1. Try creating another student with same email: `abebe.bekele@test.et`
2. ✅ **Expected**: Error "Email already registered"
3. Try same enrollment number: `STU001`
4. ✅ **Expected**: Error "Enrollment number already exists"

#### 2.3 Create Teacher
1. Navigate to "Teachers"
2. Click "Add Teacher"
3. Fill details:
   ```
   Name: Tigist Mamo
   Email: tigist.mamo@smartsms.et
   Password: Teacher@123
   Phone: +251922334455
   Employee ID: TEA002
   Department: Mathematics
   ```
4. ✅ **Expected**: Teacher created
5. ✅ **Check**: Appears in teachers list

#### 2.4 Assign Teacher to Class
1. Go to "Classes"
2. Select "Grade 10-A"
3. Click "Assign Teacher"
4. Select teacher from list
5. Assign subjects: "Mathematics"
6. ✅ **Expected**: Success message
7. ✅ **Check**: Teacher profile shows assigned classes

#### 2.5 Create Parent & Link Student
1. Navigate to "Parents"
2. Click "Add Parent"
3. Fill details:
   ```
   Name: Bekele Tesfa
   Email: bekele.tesfa@test.et
   Password: Parent@123
   Phone: +251911123456
   Relationship: Father
   ```
4. Select child: "Abebe Bekele"
5. ✅ **Expected**: Parent created
6. ✅ **Check**: Parent-student link established
7. ✅ **Check**: Student profile shows parent

---

### Test 3: Teacher Workflow

#### 3.1 Teacher Login & Access Control
1. Logout from admin
2. Login as teacher:
   - Email: `teacher1@smartsms.et`
   - Password: `Teacher@123`
3. ✅ **Expected**: Redirect to teacher dashboard
4. ✅ **Check**: Cannot access admin routes
5. Try navigating to `/admin/students`
6. ✅ **Expected**: Redirect to teacher dashboard OR "Access denied"

#### 3.2 View Assigned Students
1. Go to "Students"
2. ✅ **Expected**: Only students from assigned classes visible
3. ✅ **Check**: If no classes assigned, shows empty state
4. ✅ **Check**: Cannot see students from other classes

#### 3.3 Mark Attendance
1. Go to "Attendance"
2. Select class: "Grade 10-A"
3. Select date: Today
4. ✅ **Expected**: Students from Grade 10-A load
5. Mark attendance:
   - Student 1: Present
   - Student 2: Absent
   - Student 3: Late
6. Click "Save Attendance"
7. ✅ **Expected**: Success message
8. ✅ **Check**: Attendance saved to database

#### 3.4 Duplicate Attendance Prevention
1. Try marking attendance again for same students and date
2. ✅ **Expected**: Updates existing records (no duplicates)
3. ✅ **Check**: Database has only one record per student per date

#### 3.5 Add Grade
1. Go to "Grades"
2. Click "Add Grade"
3. Select:
   - Class: Grade 10-A
   - ✅ **Check**: Student dropdown populated with class students
4. Fill grade:
   ```
   Student: Abebe Bekele
   Subject: Mathematics
   Assessment Type: Midterm
   Score: 85
   Max Score: 100
   Remarks: Good performance
   ```
5. Click "Save"
6. ✅ **Expected**: Grade saved
7. ✅ **Check**: Notification sent to student
8. ✅ **Check**: Notification sent to parent

#### 3.6 Grade Validation
1. Try entering score: -10
2. ✅ **Expected**: Error "Score must be non-negative"
3. Try entering score: 150 (when max is 100)
4. ✅ **Expected**: Error or warning
5. Try leaving subject empty
6. ✅ **Expected**: Validation error

#### 3.7 Create Assignment
1. Go to "Assignments"
2. Click "Create Assignment"
3. Fill details:
   ```
   Title: Mathematics Homework 1
   Description: Solve problems from chapter 3
   Subject: Mathematics
   Class: Grade 10-A
   Due Date: [Future date]
   Max Score: 50
   ```
4. ✅ **Expected**: Assignment created
5. ✅ **Check**: Notifications sent to students

---

### Test 4: Student Workflow

#### 4.1 Student Login
1. Logout from teacher
2. Login as student:
   - Email: `student1@smartsms.et`
   - Password: `Student@123`
3. ✅ **Expected**: Redirect to student dashboard
4. ✅ **Check**: Dashboard shows:
   - Current class
   - Attendance percentage
   - Average score
   - Recent grades

#### 4.2 View Grades
1. Go to "Grades"
2. ✅ **Expected**: Only own grades visible
3. ✅ **Check**: Shows subject, score, date, teacher
4. ✅ **Check**: Cannot see other students' grades
5. Try accessing another student's grade via API
6. ✅ **Expected**: 403 Forbidden

#### 4.3 View Attendance
1. Go to "Attendance"
2. ✅ **Expected**: Own attendance records
3. ✅ **Check**: Shows date, status, remarks
4. ✅ **Check**: Calculates attendance percentage
5. ✅ **Check**: Filter by date range works

#### 4.4 View Assignments
1. Go to "Assignments"
2. ✅ **Expected**: Assignments for student's class
3. ✅ **Check**: Shows title, due date, status
4. ✅ **Check**: Can submit assignment
5. ✅ **Check**: Cannot see other classes' assignments

#### 4.5 Notifications
1. Go to Notifications (bell icon)
2. ✅ **Expected**: See notifications for:
   - New grade posted
   - Attendance marked (if absent)
   - New assignment
3. Click notification
4. ✅ **Expected**: Mark as read
5. ✅ **Check**: Unread count updates

---

### Test 5: Parent Workflow

#### 5.1 Parent Login
1. Logout from student
2. Login as parent:
   - Email: `parent1@smartsms.et`
   - Password: `Parent@123`
3. ✅ **Expected**: Redirect to parent dashboard

#### 5.2 View Children
1. Go to "Children"
2. ✅ **Expected**: Only linked children visible
3. ✅ **Check**: Shows child name, class, enrollment
4. Try accessing another parent's child via API
5. ✅ **Expected**: 403 Forbidden

#### 5.3 View Child Grades
1. Click on child
2. Go to "Grades"
3. ✅ **Expected**: Child's grades visible
4. ✅ **Check**: Shows all subjects, scores, dates
5. ✅ **Check**: Cannot edit grades

#### 5.4 View Child Attendance
1. Go to "Attendance"
2. ✅ **Expected**: Child's attendance records
3. ✅ **Check**: Shows dates, statuses
4. ✅ **Check**: Attendance percentage calculated

#### 5.5 Parent Notifications
1. Check notifications
2. ✅ **Expected**: Notifications for:
   - Child's new grade
   - Child absent
   - Child's assignments
3. ✅ **Check**: Notification shows child name

#### 5.6 Multiple Children
1. If parent has multiple children:
2. ✅ **Check**: Can switch between children
3. ✅ **Check**: Data updates for selected child
4. ✅ **Check**: Cannot access unlinked children

---

### Test 6: Cross-Role Access Control

#### 6.1 Student Cannot Access Teacher Routes
1. Login as student
2. Try accessing:
   - `/teacher` → ✅ Redirect to /student
   - `/teacher/students` → ✅ Redirect to /student
   - `/teacher/grades` → ✅ Redirect to /student

#### 6.2 Teacher Cannot Access Admin Routes
1. Login as teacher
2. Try accessing:
   - `/admin` → ✅ Redirect to /teacher
   - `/admin/students` → ✅ Redirect to /teacher
   - `/admin/settings` → ✅ Redirect to /teacher

#### 6.3 API Access Control
1. Login as student
2. Open browser console
3. Try API call:
   ```javascript
   fetch('http://localhost:5000/api/admin/dashboard', {
     headers: {
       'Authorization': 'Bearer ' + localStorage.getItem('token')
     }
   })
   ```
4. ✅ **Expected**: 403 Forbidden
5. ✅ **Check**: Error message: "Access denied"

---

### Test 7: Data Consistency

#### 7.1 Student-Parent Relationship
1. Admin creates student
2. Admin creates parent and links student
3. Login as parent
4. ✅ **Check**: Can view student's data
5. Admin unlinks student from parent
6. ✅ **Check**: Parent can no longer access student

#### 7.2 Teacher-Student Relationship
1. Admin assigns teacher to class
2. Login as teacher
3. ✅ **Check**: Can see students in that class
4. Admin unassigns teacher from class
5. Login as teacher again
6. ✅ **Check**: Cannot see those students anymore

#### 7.3 Grade Visibility
1. Teacher adds grade for student
2. Login as student
3. ✅ **Check**: Student sees grade
4. Login as student's parent
5. ✅ **Check**: Parent sees grade
6. Login as different student
7. ✅ **Check**: Cannot see the grade

---

### Test 8: Error Handling & UX

#### 8.1 Loading States
1. Navigate to Students page
2. ✅ **Check**: Loading spinner appears while fetching
3. ✅ **Check**: Spinner disappears when data loads

#### 8.2 Empty States
1. Login as new teacher (no assigned classes)
2. Go to Students
3. ✅ **Check**: Shows "No students yet" empty state
4. ✅ **Check**: Helpful message displayed
5. ✅ **Check**: Icon visible

#### 8.3 Error Messages
1. Disconnect from internet
2. Try loading data
3. ✅ **Check**: "Network error" message
4. ✅ **Check**: Retry button available
5. Reconnect and click retry
6. ✅ **Check**: Data loads successfully

#### 8.4 Validation Feedback
1. Try creating student with invalid email: "notanemail"
2. ✅ **Check**: Red error message below email field
3. ✅ **Check**: Message: "Valid email is required"
4. Fix email and leave password short: "123"
5. ✅ **Check**: Error: "Password must be at least 6 characters"

#### 8.5 Success Feedback
1. Successfully create student
2. ✅ **Check**: Green toast notification appears
3. ✅ **Check**: Message: "Student created successfully"
4. ✅ **Check**: Toast auto-dismisses after 5 seconds
5. ✅ **Check**: Can manually dismiss with X button

#### 8.6 Confirmation Dialogs
1. Try deleting a student
2. ✅ **Check**: Confirmation dialog appears
3. ✅ **Check**: Shows: "Are you sure you want to delete this student?"
4. ✅ **Check**: Has "Cancel" and "Delete" buttons
5. Click Cancel
6. ✅ **Check**: Dialog closes, student not deleted
7. Try again and click Delete
8. ✅ **Check**: Student deleted
9. ✅ **Check**: Success message shown

---

### Test 9: Pagination & Search

#### 9.1 Pagination
1. Go to Students page (ensure 20+ students exist)
2. ✅ **Check**: Shows "Showing 1 to 20 of X results"
3. ✅ **Check**: Page numbers displayed
4. Click page 2
5. ✅ **Check**: Shows students 21-40
6. ✅ **Check**: URL updates with ?page=2
7. Refresh page
8. ✅ **Check**: Still on page 2

#### 9.2 Search Functionality
1. Go to Students page
2. Enter student name in search: "Abebe"
3. ✅ **Check**: Results filter immediately
4. ✅ **Check**: Only matching students shown
5. Clear search
6. ✅ **Check**: All students shown again
7. Search by enrollment: "STU001"
8. ✅ **Check**: Finds student by enrollment number

#### 9.3 Filters
1. Filter by grade: "Grade 10"
2. ✅ **Check**: Only Grade 10 students shown
3. Filter by status: "Active"
4. ✅ **Check**: Only active students shown
5. Combine filters: Grade 10 + Active
6. ✅ **Check**: Both filters applied

---

### Test 10: Notifications System

#### 10.1 Grade Notification
1. Login as teacher
2. Add grade for student
3. Login as that student
4. ✅ **Check**: Notification badge shows count
5. Click notifications
6. ✅ **Check**: See "New Grade Posted" notification
7. ✅ **Check**: Shows subject and score
8. Click notification
9. ✅ **Check**: Marked as read
10. ✅ **Check**: Badge count decreases

#### 10.2 Attendance Notification
1. Login as teacher
2. Mark student as absent
3. Login as that student
4. ✅ **Check**: Notification: "You were marked absent"
5. Login as student's parent
6. ✅ **Check**: Notification: "[Child name] was marked absent"

#### 10.3 Assignment Notification
1. Login as teacher
2. Create assignment for class
3. Login as student in that class
4. ✅ **Check**: Notification: "New Assignment: [Title]"
5. ✅ **Check**: Shows due date

---

### Test 11: Mobile Responsiveness

#### 11.1 Responsive Layout
1. Resize browser to mobile size (375px width)
2. ✅ **Check**: Sidebar becomes hamburger menu
3. ✅ **Check**: Tables become scrollable or card layout
4. ✅ **Check**: Forms use single column
5. ✅ **Check**: Buttons are touch-friendly (44px min)

#### 11.2 Mobile Navigation
1. On mobile view
2. Click hamburger menu
3. ✅ **Check**: Menu opens
4. Click menu item
5. ✅ **Check**: Navigates correctly
6. ✅ **Check**: Menu closes after navigation

---

### Test 12: Performance

#### 12.1 Page Load Time
1. Open browser DevTools → Network tab
2. Navigate to Students page
3. ✅ **Check**: Initial load < 3 seconds
4. ✅ **Check**: API response < 1 second

#### 12.2 Search Performance
1. Go to Students (with 100+ students)
2. Type in search
3. ✅ **Check**: Results update smoothly
4. ✅ **Check**: No lag or freezing

---

## 🐛 Common Issues & Solutions

### Issue 1: Cannot connect to MongoDB
**Error:** `MongoDB connection error`

**Solution:**
1. Check if MongoDB is running:
   ```powershell
   # For Windows
   Get-Service MongoDB
   
   # Start if stopped
   Start-Service MongoDB
   ```
2. Verify connection string in `.env`
3. For MongoDB Atlas: Check network access and credentials

### Issue 2: Port already in use
**Error:** `Port 5000 is already in use`

**Solution:**
```powershell
# Find process using port
netstat -ano | findstr :5000

# Kill process (replace PID)
taskkill /PID [PID] /F

# OR change port in .env
PORT=5001
```

### Issue 3: JWT Secret Error
**Error:** `JWT secret not defined`

**Solution:**
Ensure `.env` file exists in `server` folder with:
```env
JWT_SECRET=your-secret-key
```

### Issue 4: Validation errors not showing
**Solution:**
1. Check browser console for errors
2. Verify API client is properly configured
3. Check that validation middleware is imported

### Issue 5: Notifications not appearing
**Solution:**
1. Verify `ToastContainer` is rendered in App.jsx
2. Check that notification routes are registered
3. Verify database has Notification collection

---

## ✅ Testing Completion Checklist

Copy and check off as you test:

### Authentication
- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Rate limiting works
- [ ] Session persistence
- [ ] Token expiration

### Admin
- [ ] Create student
- [ ] Create teacher
- [ ] Create parent
- [ ] Assign teacher to class
- [ ] Link parent to student
- [ ] View dashboard stats
- [ ] Duplicate prevention

### Teacher
- [ ] View assigned students only
- [ ] Mark attendance
- [ ] Add grades
- [ ] Create assignments
- [ ] Cannot access admin

### Student
- [ ] View own grades
- [ ] View own attendance
- [ ] View assignments
- [ ] Cannot see other students

### Parent
- [ ] View linked children
- [ ] View child grades
- [ ] View child attendance
- [ ] Cannot access other children

### Security
- [ ] Cross-role access blocked
- [ ] API authorization works
- [ ] Validation prevents bad data
- [ ] Rate limiting protects endpoints

### UX
- [ ] Loading states shown
- [ ] Empty states helpful
- [ ] Error messages clear
- [ ] Success feedback shown
- [ ] Confirmation dialogs work

### Features
- [ ] Pagination works
- [ ] Search works
- [ ] Filters work
- [ ] Notifications delivered
- [ ] Mobile responsive

---

## 📊 Test Results Template

Use this template to document your testing:

```
Date: _____________
Tester: _____________

Test Results:
✅ Authentication: PASSED
✅ Admin Workflow: PASSED
✅ Teacher Workflow: PASSED
✅ Student Workflow: PASSED
✅ Parent Workflow: PASSED
✅ Access Control: PASSED
✅ Data Consistency: PASSED
✅ Error Handling: PASSED
✅ Pagination/Search: PASSED
✅ Notifications: PASSED
✅ Mobile Responsive: PASSED

Issues Found: _____________

Overall Status: READY FOR PRODUCTION ✅
```

---

## 🎓 Next Steps After Testing

1. **Fix any issues found during testing**
2. **Update environment variables for production**
3. **Set strong JWT_SECRET**
4. **Configure MongoDB Atlas**
5. **Deploy backend to Render/Railway**
6. **Deploy frontend to Vercel/Netlify**
7. **Test production deployment**
8. **Set up monitoring**
9. **Create backups**
10. **Train users**

---

**Happy Testing! 🚀**
