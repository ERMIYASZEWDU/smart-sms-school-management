/**
 * Admin CRUD Routes Tests
 *
 * Tests all CRUD endpoints under /api/admin with role-based access control:
 * - Students: GET/POST/PUT/DELETE /api/admin/students, /api/admin/student/:id
 * - Teachers: GET/POST/PUT/DELETE /api/admin/teachers, /api/admin/teacher/:id
 * - Parents:  GET/POST/PUT/DELETE /api/admin/parents, /api/admin/parent/:id
 * - Classes:  GET/POST/PUT      /api/admin/classes,  /api/admin/class/:id
 *
 * RBAC rules verified:
 *   admin   → 200/201
 *   teacher → 403
 *   student → 403
 *   (none)  → 401
 */
import { describe, it, before, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import crypto from 'crypto'

import {
  setupDb, teardownDb, clearDb,
  createUser, createStudent, createParent, createTeacher,
  buildTestApp
} from './setup.js'
import User from '../models/User.js'
import AcademicYear from '../models/AcademicYear.js'
import Class from '../models/Class.js'

/** Random string for unique test emails/enrollment numbers */
const uid = () => crypto.randomBytes(4).toString('hex')

let app
let adminToken, teacherToken, studentToken

// ─── Lifecycle ────────────────────────────────────────────────────────────────

before(async () => {
  await setupDb()
  process.env.JWT_SECRET = 'test-secret'
  app = await buildTestApp()
})

after(async () => { await teardownDb() })

beforeEach(async () => {
  await clearDb()
  // Create role-specific users and tokens for RBAC testing
  const admin = await createUser({ email: 'admin-rbac@test.com', password: 'pass123', role: 'admin', name: 'Admin RBAC' })
  const teacher = await createUser({ email: 'teacher-rbac@test.com', password: 'pass123', role: 'teacher', name: 'Teacher RBAC' })
  const student = await createUser({ email: 'student-rbac@test.com', password: 'pass123', role: 'student', name: 'Student RBAC' })

  const secret = process.env.JWT_SECRET
  adminToken = jwt.sign({ id: admin._id, email: admin.email, role: 'admin' }, secret, { expiresIn: '1h' })
  teacherToken = jwt.sign({ id: teacher._id, email: teacher.email, role: 'teacher' }, secret, { expiresIn: '1h' })
  studentToken = jwt.sign({ id: student._id, email: student.email, role: 'student' }, secret, { expiresIn: '1h' })
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Create an active Academic Year (required by class creation) */
async function createActiveYear() {
  return AcademicYear.create({
    name: '2026/2027',
    startDate: new Date('2026-09-01'),
    endDate: new Date('2027-06-30'),
    isActive: true,
  })
}

// ═══════════════════════════════════════════════════════════════════════════════
// RBAC — Shared access-control checks across all entity types
// ═══════════════════════════════════════════════════════════════════════════════

describe('RBAC — Access Control', () => {
  const endpoints = [
    { method: 'GET',  path: '/api/admin/students' },
    { method: 'GET',  path: '/api/admin/teachers' },
    { method: 'GET',  path: '/api/admin/parents' },
    { method: 'GET',  path: '/api/admin/classes' },
    { method: 'GET',  path: '/api/admin/dashboard' },
  ]

  for (const { method, path } of endpoints) {
    it(`${method} ${path} → 401 without token`, async () => {
      await request(app)[method.toLowerCase()](path).expect(401)
    })

    it(`${method} ${path} → 403 for teacher`, async () => {
      await request(app)[method.toLowerCase()](path)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(403)
    })

    it(`${method} ${path} → 403 for student`, async () => {
      await request(app)[method.toLowerCase()](path)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403)
    })

    it(`${method} ${path} → 200 for admin`, async () => {
      const res = await request(app)[method.toLowerCase()](path)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
      assert.ok(res.body !== undefined)
    })
  }
})

// ═══════════════════════════════════════════════════════════════════════════════
// STUDENTS CRUD
// ═══════════════════════════════════════════════════════════════════════════════

describe('Students CRUD', () => {
  describe('POST /api/admin/student', () => {
    it('creates a student with valid data (requires active academic year)', async () => {
      await createActiveYear()

      const res = await request(app)
        .post('/api/admin/student')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: `new-student-${uid()}@test.com`,
          password: 'pass123',
          name: 'New Student',
          enrollmentNumber: `ENR-${uid()}`,
          grade: 'Grade 10',
          section: 'A',
          rollNumber: 1,
          dateOfBirth: '2010-05-15',
          guardianName: 'Guardian Name',
          guardianPhone: '+251911111111',
          address: '123 Main St',
        })
        .expect(201)

      assert.ok(res.body._id)
      assert.equal(res.body.name, 'New Student')
      assert.equal(res.body.grade, 'Grade 10')

      // User account should also exist
      const user = await User.findById(res.body.userId)
      assert.ok(user)
      assert.equal(user.role, 'student')
    })

    it('rejects duplicate email', async () => {
      await createActiveYear()
      const email = `dup-${uid()}@test.com`
      await request(app)
        .post('/api/admin/student')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email, password: 'pass123', name: 'Dup',
          enrollmentNumber: `ENR-${uid()}`, grade: 'Grade 10', section: 'A',
          rollNumber: 1, dateOfBirth: '2010-01-01',
          guardianName: 'G', guardianPhone: '0911111111', address: 'Addr',
        })
        .expect(201)

      await request(app)
        .post('/api/admin/student')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email, password: 'pass123', name: 'Dup2',
          enrollmentNumber: `ENR-${uid()}`, grade: 'Grade 10', section: 'A',
          rollNumber: 2, dateOfBirth: '2010-01-01',
          guardianName: 'G', guardianPhone: '0911111111', address: 'Addr',
        })
        .expect(400)
    })

    it('rejects duplicate enrollment number', async () => {
      await createActiveYear()
      const enr = `ENR-DUP-${uid()}`
      await request(app)
        .post('/api/admin/student')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: `s1-${uid()}@test.com`, password: 'pass123', name: 'S1',
          enrollmentNumber: enr, grade: 'Grade 10', section: 'A',
          rollNumber: 1, dateOfBirth: '2010-01-01',
          guardianName: 'G', guardianPhone: '0911111111', address: 'Addr',
        })
        .expect(201)

      await request(app)
        .post('/api/admin/student')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: `s2-${uid()}@test.com`, password: 'pass123', name: 'S2',
          enrollmentNumber: enr, grade: 'Grade 10', section: 'B',
          rollNumber: 2, dateOfBirth: '2010-02-02',
          guardianName: 'G', guardianPhone: '0922222222', address: 'Addr2',
        })
        .expect(400)
    })

    it('rejects without required fields', async () => {
      await request(app)
        .post('/api/admin/student')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'x@test.com' })
        .expect(400)
    })

    it('403 for teacher role', async () => {
      await request(app)
        .post('/api/admin/student')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ email: 't@test.com', password: 'p', name: 'T' })
        .expect(403)
    })
  })

  describe('GET /api/admin/students', () => {
    it('returns paginated student list', async () => {
      await createActiveYear()
      const suffix = uid()
      for (let i = 0; i < 2; i++) {
        await request(app)
          .post('/api/admin/student')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            email: `list-${suffix}-${i}@test.com`, password: 'pass123', name: `List Student ${suffix}`,
            enrollmentNumber: `LIST-${suffix}-${i}`, grade: 'Grade 10', section: 'A',
            rollNumber: i + 1, dateOfBirth: '2010-01-01',
            guardianName: 'G', guardianPhone: '0911111111', address: 'Addr',
          })
      }

      const res = await request(app)
        .get('/api/admin/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      assert.ok(Array.isArray(res.body.students))
      assert.ok(res.body.students.length >= 2)
      assert.ok(res.body.pagination)
      assert.ok(res.body.pagination.total >= 2)
    })

    it('supports search query', async () => {
      await createActiveYear()
      const uniqueName = `Unique${uid()}`
      await request(app)
        .post('/api/admin/student')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: `search-${uid()}@test.com`, password: 'pass123', name: uniqueName,
          enrollmentNumber: `SEARCH-${uid()}`, grade: 'Grade 10', section: 'A',
          rollNumber: 1, dateOfBirth: '2010-01-01',
          guardianName: 'G', guardianPhone: '0911111111', address: 'Addr',
        })

      const res = await request(app)
        .get(`/api/admin/students?search=${uniqueName}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      assert.ok(res.body.students.some(s => s.name === uniqueName))
    })
  })

  describe('PUT /api/admin/student/:id', () => {
    it('updates an existing student', async () => {
      await createActiveYear()
      const createRes = await request(app)
        .post('/api/admin/student')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: `upd-${uid()}@test.com`, password: 'pass123', name: 'Orig Name',
          enrollmentNumber: `UPD-${uid()}`, grade: 'Grade 10', section: 'A',
          rollNumber: 1, dateOfBirth: '2010-01-01',
          guardianName: 'G', guardianPhone: '0911111111', address: 'Addr',
        })
        .expect(201)

      const studentId = createRes.body._id

      const res = await request(app)
        .put(`/api/admin/student/${studentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Name', grade: 'Grade 10', section: 'B',
          dateOfBirth: '2010-01-01', guardianName: 'G', guardianPhone: '0911111111', address: 'Addr' })
        .expect(200)

      assert.equal(res.body.name, 'Updated Name')
      assert.equal(res.body.section, 'B')
    })

    it('returns 404 for non-existent student', async () => {
      const fakeId = new mongoose.Types.ObjectId()
      await request(app)
        .put(`/api/admin/student/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Ghost', grade: 'Grade 10', section: 'A',
          dateOfBirth: '2010-01-01', guardianName: 'G', guardianPhone: '0911111111', address: 'Addr' })
        .expect(404)
    })
  })

  describe('DELETE /api/admin/student/:id', () => {
    it('deletes student and its user account', async () => {
      await createActiveYear()
      const createRes = await request(app)
        .post('/api/admin/student')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: `del-${uid()}@test.com`, password: 'pass123', name: 'To Delete',
          enrollmentNumber: `DEL-${uid()}`, grade: 'Grade 10', section: 'A',
          rollNumber: 1, dateOfBirth: '2010-01-01',
          guardianName: 'G', guardianPhone: '0911111111', address: 'Addr',
        })
        .expect(201)

      const studentId = createRes.body._id
      const userId = createRes.body.userId

      await request(app)
        .delete(`/api/admin/student/${studentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      // Verify both are gone
      const user = await User.findById(userId)
      assert.equal(user, null)
    })

    it('returns 404 for non-existent student', async () => {
      const fakeId = new mongoose.Types.ObjectId()
      await request(app)
        .delete(`/api/admin/student/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404)
    })
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TEACHERS CRUD
// ═══════════════════════════════════════════════════════════════════════════════

describe('Teachers CRUD', () => {
  describe('POST /api/admin/teacher', () => {
    it('creates a teacher with valid data', async () => {
      const res = await request(app)
        .post('/api/admin/teacher')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: `new-teacher-${Date.now()}@test.com`,
          password: 'pass123',
          name: 'New Teacher',
          phone: '+251933333333',
          employeeId: `EMP-${Date.now()}`,
          department: 'Mathematics',
        })
        .expect(201)

      assert.ok(res.body._id)
      assert.equal(res.body.name, 'New Teacher')
      assert.equal(res.body.role, 'teacher')
      assert.ok(res.body.profile) // Teacher profile should exist

      // Verify user account
      const user = await User.findById(res.body._id)
      assert.ok(user)
      assert.equal(user.role, 'teacher')
    })

    it('rejects duplicate email', async () => {
      await request(app)
        .post('/api/admin/teacher')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'dup-teacher@test.com', password: 'p', name: 'T1', phone: '0911111111' })
        .expect(201)

      await request(app)
        .post('/api/admin/teacher')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'dup-teacher@test.com', password: 'p', name: 'T2', phone: '0922222222' })
        .expect(400)
    })

    it('rejects duplicate employee ID', async () => {
      await request(app)
        .post('/api/admin/teacher')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'e1@test.com', password: 'p', name: 'T1', phone: '0911111111', employeeId: 'EMP-DUP' })
        .expect(201)

      await request(app)
        .post('/api/admin/teacher')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'e2@test.com', password: 'p', name: 'T2', phone: '0922222222', employeeId: 'EMP-DUP' })
        .expect(400)
    })

    it('403 for teacher role', async () => {
      await request(app)
        .post('/api/admin/teacher')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ email: 'x@test.com', password: 'p', name: 'X' })
        .expect(403)
    })
  })

  describe('GET /api/admin/teachers', () => {
    it('returns list of teachers with profiles', async () => {
      await request(app)
        .post('/api/admin/teacher')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: `list-t-${Date.now()}@test.com`, password: 'p', name: 'ListTeacher', phone: '0911111111' })
        .expect(201)

      const res = await request(app)
        .get('/api/admin/teachers')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      assert.ok(Array.isArray(res.body))
      assert.ok(res.body.length >= 1)
      // Should include profile data
      const teacher = res.body.find(t => t.name === 'ListTeacher')
      assert.ok(teacher)
      assert.ok(teacher.profile)
    })
  })

  describe('PUT /api/admin/teacher/:id', () => {
    it('updates a teacher', async () => {
      const createRes = await request(app)
        .post('/api/admin/teacher')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: `upd-t-${Date.now()}@test.com`, password: 'p', name: 'Orig', phone: '0911111111' })
        .expect(201)

      const teacherId = createRes.body._id

      const res = await request(app)
        .put(`/api/admin/teacher/${teacherId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated', phone: '0999999999', email: createRes.body.email })
        .expect(200)

      assert.equal(res.body.name, 'Updated')
    })

    it('returns 404 for non-existent teacher', async () => {
      const fakeId = new mongoose.Types.ObjectId()
      await request(app)
        .put(`/api/admin/teacher/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Ghost', phone: '0911111111', email: 'ghost@test.com' })
        .expect(404)
    })
  })

  describe('DELETE /api/admin/teacher/:id', () => {
    it('deletes teacher and profile', async () => {
      const createRes = await request(app)
        .post('/api/admin/teacher')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: `del-t-${Date.now()}@test.com`, password: 'p', name: 'Del Teacher', phone: '0911111111' })
        .expect(201)

      const teacherId = createRes.body._id

      await request(app)
        .delete(`/api/admin/teacher/${teacherId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      // Verify user is gone
      const user = await User.findById(teacherId)
      assert.equal(user, null)
    })

    it('returns 404 for non-existent teacher', async () => {
      const fakeId = new mongoose.Types.ObjectId()
      await request(app)
        .delete(`/api/admin/teacher/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404)
    })
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// PARENTS CRUD
// ═══════════════════════════════════════════════════════════════════════════════

describe('Parents CRUD', () => {
  describe('POST /api/admin/parent', () => {
    it('creates a parent with valid data', async () => {
      const res = await request(app)
        .post('/api/admin/parent')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: `new-parent-${Date.now()}@test.com`,
          password: 'pass123',
          name: 'New Parent',
          phone: '+251944444444',
          address: '456 Parent St',
          occupation: 'Engineer',
          relationship: 'father',
        })
        .expect(201)

      assert.ok(res.body._id)
      assert.equal(res.body.name, 'New Parent')

      // User account should exist
      const user = await User.findById(res.body.userId)
      assert.ok(user)
      assert.equal(user.role, 'parent')
    })

    it('rejects duplicate email', async () => {
      await request(app)
        .post('/api/admin/parent')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'dup-parent@test.com', password: 'p', name: 'P1', phone: '0911111111' })
        .expect(201)

      await request(app)
        .post('/api/admin/parent')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'dup-parent@test.com', password: 'p', name: 'P2', phone: '0922222222' })
        .expect(400)
    })

    it('links parent to students via studentIds', async () => {
      const { student } = await createStudent({ name: 'Linked Student' })

      const res = await request(app)
        .post('/api/admin/parent')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: `linked-parent-${Date.now()}@test.com`,
          password: 'pass123',
          name: 'Linked Parent',
          phone: '0944444444',
          studentIds: [student._id.toString()],
        })
        .expect(201)

      assert.equal(res.body.studentIds.length, 1)

      // Verify student has the parent reference
      const updatedStudent = await (await import('../models/Student.js')).default.findById(student._id)
      assert.ok(updatedStudent.parentIds.some(id => id.toString() === res.body._id))
    })

    it('403 for teacher role', async () => {
      await request(app)
        .post('/api/admin/parent')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ email: 'x@test.com', password: 'p', name: 'X', phone: '0911111111' })
        .expect(403)
    })
  })

  describe('GET /api/admin/parents', () => {
    it('returns list of parents with populated students', async () => {
      const { student } = await createStudent({ name: 'Parent Child' })

      await request(app)
        .post('/api/admin/parent')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: `list-p-${Date.now()}@test.com`, password: 'p', name: 'List Parent',
          phone: '0911111111', studentIds: [student._id.toString()],
        })
        .expect(201)

      const res = await request(app)
        .get('/api/admin/parents')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      assert.ok(Array.isArray(res.body))
      assert.ok(res.body.length >= 1)
      const parent = res.body.find(p => p.name === 'List Parent')
      assert.ok(parent)
    })
  })

  describe('PUT /api/admin/parent/:id', () => {
    it('updates a parent', async () => {
      const createRes = await request(app)
        .post('/api/admin/parent')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: `upd-p-${Date.now()}@test.com`, password: 'p', name: 'Orig', phone: '0911111111' })
        .expect(201)

      const parentId = createRes.body._id

      const res = await request(app)
        .put(`/api/admin/parent/${parentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Parent', phone: '0988888888', email: createRes.body.email })
        .expect(200)

      assert.equal(res.body.name, 'Updated Parent')
    })

    it('returns 404 for non-existent parent', async () => {
      const fakeId = new mongoose.Types.ObjectId()
      await request(app)
        .put(`/api/admin/parent/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Ghost', phone: '0911111111', email: 'g@test.com' })
        .expect(404)
    })
  })

  describe('DELETE /api/admin/parent/:id', () => {
    it('deletes parent and user account', async () => {
      const createRes = await request(app)
        .post('/api/admin/parent')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: `del-p-${Date.now()}@test.com`, password: 'p', name: 'Del Parent', phone: '0911111111' })
        .expect(201)

      const parentId = createRes.body._id
      const userId = createRes.body.userId

      await request(app)
        .delete(`/api/admin/parent/${parentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      const user = await User.findById(userId)
      assert.equal(user, null)
    })

    it('returns 404 for non-existent parent', async () => {
      const fakeId = new mongoose.Types.ObjectId()
      await request(app)
        .delete(`/api/admin/parent/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404)
    })
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// CLASSES CRUD
// ═══════════════════════════════════════════════════════════════════════════════

describe('Classes CRUD', () => {
  describe('POST /api/admin/class', () => {
    it('creates a class with valid data', async () => {
      const year = await createActiveYear()

      const res = await request(app)
        .post('/api/admin/class')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Grade 10-A',
          grade: 'Grade 10',
          section: 'A',
          capacity: 40,
          room: 'Room 101',
          academicYearId: year._id.toString(),
        })
        .expect(201)

      assert.ok(res.body._id)
      assert.equal(res.body.name, 'Grade 10-A')
      assert.equal(res.body.grade, 'Grade 10')
    })

    it('rejects duplicate class in same academic year', async () => {
      const year = await createActiveYear()
      const classData = {
        name: 'Grade 10-A', grade: 'Grade 10', section: 'A',
        capacity: 40, academicYearId: year._id.toString(),
      }

      await request(app)
        .post('/api/admin/class')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(classData)
        .expect(201)

      await request(app)
        .post('/api/admin/class')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...classData, name: 'Grade 10-A (dup)' })
        .expect(400)
    })

    it('allows same class name in different academic years', async () => {
      const year1 = await AcademicYear.create({
        name: '2025/2026', startDate: new Date('2025-09-01'),
        endDate: new Date('2026-06-30'), isActive: false,
      })
      const year2 = await AcademicYear.create({
        name: '2026/2027', startDate: new Date('2026-09-01'),
        endDate: new Date('2027-06-30'), isActive: true,
      })

      await request(app)
        .post('/api/admin/class')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Grade 10-A', grade: 'Grade 10', section: 'A', academicYearId: year1._id.toString() })
        .expect(201)

      await request(app)
        .post('/api/admin/class')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Grade 10-A', grade: 'Grade 10', section: 'A', academicYearId: year2._id.toString() })
        .expect(201)
    })

    it('rejects invalid academic year', async () => {
      const fakeId = new mongoose.Types.ObjectId()
      await request(app)
        .post('/api/admin/class')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'X', grade: 'Grade 10', section: 'A', academicYearId: fakeId.toString() })
        .expect(404)
    })

    it('validates teacher ID if provided', async () => {
      const year = await createActiveYear()
      const fakeTeacherId = new mongoose.Types.ObjectId()

      await request(app)
        .post('/api/admin/class')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Grade 10-B', grade: 'Grade 10', section: 'B',
          teacherId: fakeTeacherId.toString(), academicYearId: year._id.toString(),
        })
        .expect(400)
    })

    it('403 for teacher role', async () => {
      const year = await createActiveYear()
      await request(app)
        .post('/api/admin/class')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ name: 'X', grade: 'Grade 10', section: 'A', academicYearId: year._id.toString() })
        .expect(403)
    })
  })

  describe('GET /api/admin/classes', () => {
    it('returns list of classes', async () => {
      const year = await createActiveYear()
      await request(app)
        .post('/api/admin/class')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Grade 10-A', grade: 'Grade 10', section: 'A', academicYearId: year._id.toString() })
        .expect(201)

      const res = await request(app)
        .get('/api/admin/classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      assert.ok(Array.isArray(res.body))
      assert.ok(res.body.length >= 1)
    })
  })

  describe('PUT /api/admin/class/:id', () => {
    it('updates a class', async () => {
      const year = await createActiveYear()
      const createRes = await request(app)
        .post('/api/admin/class')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Grade 10-A', grade: 'Grade 10', section: 'A', academicYearId: year._id.toString() })
        .expect(201)

      const classId = createRes.body._id

      const res = await request(app)
        .put(`/api/admin/class/${classId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Class', grade: 'Grade 10', section: 'A', capacity: 50, academicYearId: year._id.toString() })
        .expect(200)

      assert.equal(res.body.name, 'Updated Class')
      assert.equal(res.body.capacity, 50)
    })

    it('returns 404 for non-existent class', async () => {
      const fakeId = new mongoose.Types.ObjectId()
      await request(app)
        .put(`/api/admin/class/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Ghost', grade: 'Grade 10', section: 'A' })
        .expect(404)
    })
  })
})
