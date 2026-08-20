# API Documentation

Base URL: `http://localhost:5000`

## Authentication Endpoints

### Register User
```
POST /auth/register

Body:
{
  "email": "user@school.com",
  "password": "password123",
  "name": "John Doe",
  "role": "student" | "teacher" | "parent" | "admin"
}

Response:
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@school.com",
    "name": "John Doe",
    "role": "student"
  }
}
```

### Login
```
POST /auth/login

Body:
{
  "email": "user@school.com",
  "password": "password123"
}

Response:
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@school.com",
    "name": "John Doe",
    "role": "student",
    "profilePhoto": "url_or_null"
  }
}
```

## Student Endpoints

All student endpoints require Authorization header: `Bearer {token}`

### Get Student Dashboard
```
GET /student/dashboard

Response:
{
  "grades": [...],
  "attendance": [...],
  "assignments": [...],
  "gpa": 3.8,
  "attendancePercentage": 95
}
```

### Get Grades
```
GET /student/grades

Response:
[
  {
    "_id": "grade_id",
    "studentId": "student_id",
    "subject": "Mathematics",
    "score": 85,
    "maxScore": 100,
    "gradeType": "midterm",
    "date": "2024-06-16"
  }
]
```

### Get Attendance
```
GET /student/attendance

Response:
[
  {
    "_id": "attendance_id",
    "studentId": "student_id",
    "date": "2024-06-16",
    "status": "present",
    "subject": "Mathematics"
  }
]
```

### Get Assignments
```
GET /student/assignments

Response:
[
  {
    "_id": "assignment_id",
    "title": "Math Assignment 1",
    "description": "Chapter 5-6",
    "subject": "Mathematics",
    "dueDate": "2024-06-20",
    "maxScore": 100
  }
]
```

## Teacher Endpoints

All teacher endpoints require Authorization header: `Bearer {token}`

### Get Teacher Dashboard
```
GET /teacher/dashboard

Response:
{
  "totalStudents": 120,
  "totalClasses": 6,
  "assignments": [...],
  "message": "Teacher dashboard loaded successfully"
}
```

### Create Assignment
```
POST /teacher/assignment

Body:
{
  "title": "Math Assignment",
  "description": "Chapter 5",
  "subject": "Mathematics",
  "grade": "10A",
  "dueDate": "2024-06-20",
  "maxScore": 100
}

Response:
{
  "_id": "assignment_id",
  "teacherId": "teacher_id",
  "title": "Math Assignment",
  ...
}
```

### Submit Grade
```
POST /teacher/grade

Body:
{
  "studentId": "student_id",
  "subject": "Mathematics",
  "score": 85,
  "gradeType": "midterm"
}

Response:
{
  "_id": "grade_id",
  "teacherId": "teacher_id",
  "studentId": "student_id",
  ...
}
```

## Admin Endpoints

All admin endpoints require Authorization header: `Bearer {token}` and admin role

### Get Admin Dashboard
```
GET /admin/dashboard

Response:
{
  "totalStudents": 345,
  "totalUsers": 450,
  "totalClasses": 15,
  "avgAttendance": 92,
  "message": "Admin dashboard loaded successfully"
}
```

### List Students
```
GET /admin/students

Response:
[
  {
    "_id": "student_id",
    "userId": {
      "email": "student@school.com",
      "name": "John Doe"
    },
    "enrollmentNumber": "STU001",
    "grade": "10A",
    "gpa": 3.8,
    "attendance": 95
  }
]
```

### List Users
```
GET /admin/users

Response:
[
  {
    "_id": "user_id",
    "email": "user@school.com",
    "name": "User Name",
    "role": "student"
  }
]
```

### Delete User
```
DELETE /admin/user/:id

Response:
{
  "message": "User deleted successfully"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "message": "Missing required fields"
}
```

### 401 Unauthorized
```json
{
  "message": "Invalid credentials" or "No token provided" or "Invalid token"
}
```

### 403 Forbidden
```json
{
  "message": "Access denied"
}
```

### 500 Server Error
```json
{
  "message": "Error message",
  "error": "detailed error"
}
```

## Request Headers

```
Content-Type: application/json
Authorization: Bearer {jwt_token}
```

## Data Models

### User
```javascript
{
  _id: ObjectId,
  email: String,
  password: String (hashed),
  name: String,
  role: String,
  profilePhoto: String,
  phone: String,
  isEmailVerified: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Student
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  enrollmentNumber: String,
  grade: String,
  section: String,
  rollNumber: Number,
  dateOfBirth: Date,
  guardianName: String,
  guardianPhone: String,
  address: String,
  gpa: Number,
  attendance: Number,
  createdAt: Date
}
```

### Grade
```javascript
{
  _id: ObjectId,
  studentId: ObjectId,
  teacherId: ObjectId,
  subject: String,
  score: Number,
  maxScore: Number,
  gradeType: String (quiz|midterm|final|assignment),
  date: Date,
  createdAt: Date
}
```

### Attendance
```javascript
{
  _id: ObjectId,
  studentId: ObjectId,
  date: Date,
  status: String (present|absent|late|excused),
  subject: String,
  remarks: String,
  createdAt: Date
}
```

### Assignment
```javascript
{
  _id: ObjectId,
  teacherId: ObjectId,
  title: String,
  description: String,
  subject: String,
  grade: String,
  dueDate: Date,
  maxScore: Number,
  attachments: [String],
  createdAt: Date
}
```

## Roles & Permissions

### Student
- View own grades, attendance, assignments
- Submit assignments
- View school announcements

### Teacher
- Create and manage assignments
- Submit grades
- View class performance
- Communicate with parents

### Parent
- View child's grades and attendance
- Communicate with teachers
- View fees status

### Admin
- Manage all students and teachers
- Create classes and timetables
- Generate reports
- Manage system settings

### Super Admin
- Multi-school management
- Manage all admins
- System settings and security
- View audit logs

## Rate Limiting

Not currently implemented but recommended for production:
- 100 requests per 15 minutes per IP
- 1000 requests per hour per user

## Pagination

Add to queries for pagination:
```
GET /student/grades?page=1&limit=10

Response includes:
{
  data: [...],
  total: 100,
  page: 1,
  pages: 10
}
```

## Filtering & Sorting

```
GET /admin/students?grade=10A&sort=name&order=asc
```

## Webhooks

Future implementation for:
- Grade submitted
- Attendance marked
- Assignment due
- Fee payment received

---

Last Updated: June 2024
For updates, check the GitHub repository.
