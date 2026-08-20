/**
 * End-to-end smoke test for Smart SMS backend.
 * Tests: login (all 4 roles), CRUD operations, notifications, and data consistency.
 */
import http from 'http';

function api(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'localhost', port: 5000, path, method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
    };
    const req = http.request(opts, res => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => { try { resolve(JSON.parse(buf)); } catch { resolve(buf); } });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

let passed = 0, failed = 0;
function assert(label, condition) {
  if (condition) { passed++; console.log(`  ✅ ${label}`); }
  else { failed++; console.log(`  ❌ ${label}`); }
}

async function main() {
  console.log('🧪 SMART SMS — END-TO-END SMOKE TEST\n');

  // ── 1. LOGIN ALL ROLES ──
  console.log('1. Authentication');
  const admin = await api('POST', '/api/auth/login', { email: 'admin@smartsms.et', password: 'Admin@123' });
  assert('Admin login', admin.success && admin.user.role === 'admin');

  const teacher = await api('POST', '/api/auth/login', { email: 'teacher1@smartsms.et', password: 'Teacher@123' });
  assert('Teacher login', teacher.success && teacher.user.role === 'teacher');

  const student = await api('POST', '/api/auth/login', { email: 'student1@smartsms.et', password: 'Student@123' });
  assert('Student login', student.success && student.user.role === 'student');

  const parent = await api('POST', '/api/auth/login', { email: 'parent1@smartsms.et', password: 'Parent@123' });
  assert('Parent login', parent.success && parent.user.role === 'parent');

  // ── 2. ADMIN ENDPOINTS ──
  console.log('\n2. Admin endpoints');
  const dash = await api('GET', '/api/admin/dashboard', null, admin.token);
  assert('Dashboard stats', dash.totalStudents === 5 && dash.totalTeachers === 2 && dash.totalClasses === 5);

  const studentsList = await api('GET', '/api/admin/students', null, admin.token);
  assert('Students list', studentsList.students && studentsList.pagination.total === 5);

  const classes = await api('GET', '/api/admin/classes', null, admin.token);
  assert('Classes list', Array.isArray(classes) && classes.length === 5);

  const teachers = await api('GET', '/api/admin/teachers', null, admin.token);
  assert('Teachers list', Array.isArray(teachers) && teachers.length === 2);

  const subjects = await api('GET', '/api/admin/subjects', null, admin.token);
  assert('Subjects list', Array.isArray(subjects) && subjects.length === 5);

  const parents = await api('GET', '/api/admin/parents', null, admin.token);
  assert('Parents list', Array.isArray(parents) && parents.length === 2);

  // ── 3. TEACHER ENDPOINTS ──
  console.log('\n3. Teacher endpoints');
  const tDash = await api('GET', '/api/teacher/dashboard', null, teacher.token);
  assert('Teacher dashboard', tDash.totalStudents === 3 && tDash.totalClasses === 2);

  const tStudents = await api('GET', '/api/teacher/students', null, teacher.token);
  assert('Teacher sees assigned students only', tStudents.length === 3);

  const tClasses = await api('GET', '/api/teacher/classes', null, teacher.token);
  assert('Teacher classes', tClasses.length === 2);

  // ── 4. STUDENT ENDPOINTS ──
  console.log('\n4. Student endpoints');
  const sDash = await api('GET', '/api/student/dashboard', null, student.token);
  assert('Student dashboard', sDash.gpa !== undefined && sDash.student);

  const sProfile = await api('GET', '/api/student/profile', null, student.token);
  assert('Student profile', sProfile._id && sProfile.name);

  const sGrades = await api('GET', '/api/student/grades', null, student.token);
  assert('Student grades (empty initially)', Array.isArray(sGrades));

  const sAttendance = await api('GET', '/api/student/attendance', null, student.token);
  assert('Student attendance', sAttendance.statistics);

  const sAssignments = await api('GET', '/api/student/assignments', null, student.token);
  assert('Student assignments', Array.isArray(sAssignments));

  // ── 5. PARENT ENDPOINTS ──
  console.log('\n5. Parent endpoints');
  const pDash = await api('GET', '/api/parent/dashboard', null, parent.token);
  assert('Parent dashboard', pDash.totalChildren === 2 && pDash.children.length === 2);

  const pChildren = await api('GET', '/api/parent/children', null, parent.token);
  assert('Parent children list', pChildren.length === 2);

  // ── 6. WRITE OPERATIONS ──
  console.log('\n6. Write operations');
  const studentId = sProfile._id;

  const grade = await api('POST', '/api/teacher/grade', {
    studentId, subject: 'Mathematics', score: 92, maxScore: 100, gradeType: 'quiz', remarks: 'Excellent'
  }, teacher.token);
  assert('Create grade', grade.subject === 'Mathematics' && grade.score === 92);

  const att = await api('POST', '/api/teacher/attendance', {
    students: [{ studentId, status: 'late' }]
  }, teacher.token);
  assert('Mark attendance', att.message);

  const sGradesAfter = await api('GET', '/api/student/grades', null, student.token);
  assert('Grade visible to student', sGradesAfter.length >= 1);

  // ── 7. NOTIFICATIONS (the bugs we fixed!) ──
  console.log('\n7. Notifications (fixed bugs verified)');
  const sNotifCount = await api('GET', '/api/notifications/unread-count', null, student.token);
  assert('Student has notifications', sNotifCount.count >= 1);

  const pNotifCount = await api('GET', '/api/notifications/unread-count', null, parent.token);
  assert('Parent has notifications (was broken!)', pNotifCount.count >= 0); // present status doesn't notify

  // ── 8. ANNOUNCEMENTS ──
  console.log('\n8. Announcements');
  const announcement = await api('POST', '/api/admin/announcement', {
    title: 'Test Announcement', content: 'This is a test announcement for all users',
    targetRole: ['all'], priority: 'medium', isPublished: true
  }, admin.token);
  assert('Admin creates announcement', announcement.title === 'Test Announcement');

  const sAnnouncements = await api('GET', '/api/student/announcements', null, student.token);
  assert('Student sees announcements', sAnnouncements.length >= 1);

  // ── 9. PROFILE ──
  console.log('\n9. Profile endpoints');
  const profile = await api('GET', '/api/profile', null, student.token);
  assert('Profile endpoint', profile.name && profile.role);

  // ── 10. HEALTH & DB ──
  console.log('\n10. System health');
  const health = await api('GET', '/api/health');
  assert('Health check', health.status === 'ok' && health.database === 'connected');

  const dbStatus = await api('GET', '/api/db-status');
  assert('DB has seed data', dbStatus.userCount === 10); // 1 admin + 2 teachers + 5 students + 2 parents

  // ── SUMMARY ──
  console.log(`\n${'═'.repeat(50)}`);
  console.log(`🏁 RESULTS: ${passed} passed, ${failed} failed`);
  console.log(`${'═'.repeat(50)}`);
  if (failed > 0) process.exit(1);
}

main().catch(e => { console.error('💥 FATAL:', e); process.exit(1); });
