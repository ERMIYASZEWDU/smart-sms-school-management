/**
 * Auth Routes Tests
 *
 * Tests the full HTTP auth flow:
 * - POST /api/auth/login (success, wrong password, nonexistent email)
 * - GET  /api/auth/me   (with token, no token, invalid token)
 * - POST /api/auth/verify (valid, invalid token)
 * - POST /api/auth/forgot-password (by email, nonexistent user)
 * - POST /api/auth/verify-otp (valid, expired, too many attempts)
 * - POST /api/auth/reset-password (valid, expired, weak password)
 * - POST /api/auth/resend-otp (success, cooldown)
 */
import { describe, it, before, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

import { setupDb, teardownDb, clearDb, createUser, buildTestApp } from './setup.js'
import User from '../models/User.js'

let app

// ─── Lifecycle ────────────────────────────────────────────────────────────────

before(async () => {
  await setupDb()
  process.env.JWT_SECRET = 'test-secret'
  app = await buildTestApp()
})

after(async () => { await teardownDb() })
beforeEach(async () => { await clearDb() })

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeToken(user) {
  return jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' })
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  it('returns token and user on valid credentials', async () => {
    const user = await createUser({ email: 'login@example.com', password: 'secret123', role: 'admin', name: 'Login Admin' })

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'secret123' })
      .expect(200)

    assert.equal(res.body.success, true)
    assert.ok(res.body.token)
    assert.equal(res.body.user.email, 'login@example.com')
    assert.equal(res.body.user.role, 'admin')
    assert.equal(res.body.user.name, 'Login Admin')
    // Password should not be returned
    assert.equal(res.body.user.password, undefined)
  })

  it('returns 401 with wrong password', async () => {
    await createUser({ email: 'wrong@example.com', password: 'correct', role: 'teacher' })

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'wrong@example.com', password: 'incorrect' })
      .expect(401)

    assert.equal(res.body.success, false)
    assert.ok(res.body.message.toLowerCase().includes('incorrect'))
  })

  it('returns 401 for nonexistent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'password' })
      .expect(401)

    assert.equal(res.body.success, false)
    assert.equal(res.body.notRegistered, true)
  })

  it('returns 400 when email is missing', async () => {
    await request(app)
      .post('/api/auth/login')
      .send({ password: 'password' })
      .expect(400)
  })

  it('returns 400 when password is missing', async () => {
    await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com' })
      .expect(400)
  })

  it('normalizes email to lowercase', async () => {
    await createUser({ email: 'case@example.com', password: 'pass123', role: 'student' })

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'CASE@EXAMPLE.COM', password: 'pass123' })
      .expect(200)

    assert.equal(res.body.success, true)
  })
})

describe('GET /api/auth/me', () => {
  it('returns current user profile with valid token', async () => {
    const user = await createUser({ email: 'me@example.com', password: 'pass', role: 'teacher', name: 'Me User' })
    const token = makeToken(user)

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    assert.equal(res.body.user.email, 'me@example.com')
    assert.equal(res.body.user.role, 'teacher')
    assert.equal(res.body.user.name, 'Me User')
    assert.equal(res.body.user.password, undefined)
  })

  it('returns 401 without token', async () => {
    await request(app)
      .get('/api/auth/me')
      .expect(401)
  })

  it('returns 401 with invalid token', async () => {
    await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalidtoken123')
      .expect(401)
  })

  it('returns 401 with expired token', async () => {
    const user = await createUser({ email: 'expired@example.com', password: 'pass', role: 'student' })
    const expiredToken = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '-1h' } // Already expired
    )

    await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(401)
  })

  it('returns 404 if user was deleted after token was issued', async () => {
    const user = await createUser({ email: 'deleted@example.com', password: 'pass', role: 'student' })
    const token = makeToken(user)
    await User.findByIdAndDelete(user._id)

    await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(404)
  })
})

describe('POST /api/auth/verify', () => {
  it('returns valid=true with user info for valid token', async () => {
    const user = await createUser({ email: 'verify@example.com', password: 'pass', role: 'admin' })
    const token = makeToken(user)

    const res = await request(app)
      .post('/api/auth/verify')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    assert.equal(res.body.valid, true)
    assert.equal(res.body.user.email, 'verify@example.com')
    assert.equal(res.body.user.role, 'admin')
  })

  it('returns 401 for invalid token', async () => {
    await request(app)
      .post('/api/auth/verify')
      .set('Authorization', 'Bearer badtoken')
      .expect(401)
  })
})

describe('POST /api/auth/forgot-password', () => {
  it('sends OTP to user by email', async () => {
    const user = await createUser({ email: 'reset@example.com', password: 'pass', role: 'student', name: 'Reset User' })

    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'reset@example.com' })
      .expect(200)

    assert.equal(res.body.success, true)
    assert.equal(res.body.method, 'email')
    // In test mode, OTP should be returned for automated testing
    assert.ok(res.body.debugOtp)
    assert.equal(res.body.debugOtp.length, 6)

    // Verify user was updated with OTP hash
    const updatedUser = await User.findById(user._id)
    assert.ok(updatedUser.otpHash)
    assert.ok(updatedUser.otpExpiresAt)
  })

  it('returns 404 for nonexistent email', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'ghost@example.com' })
      .expect(404)

    assert.equal(res.body.notRegistered, true)
  })

  it('returns 400 when no email or phone provided', async () => {
    await request(app)
      .post('/api/auth/forgot-password')
      .send({})
      .expect(400)
  })
})

describe('POST /api/auth/verify-otp', () => {
  it('verifies a valid OTP and returns reset token', async () => {
    // Create user with OTP already set
    const user = await createUser({ email: 'otp@example.com', password: 'pass', role: 'student' })
    const otp = '123456'
    const otpHash = await bcrypt.hash(otp, 10)
    user.otpHash = otpHash
    user.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000)
    user.otpAttempts = 0
    await user.save()

    const res = await request(app)
      .post('/api/auth/verify-otp')
      .send({ email: 'otp@example.com', otp })
      .expect(200)

    assert.equal(res.body.success, true)
    assert.ok(res.body.resetToken)
    assert.equal(res.body.email, 'otp@example.com')

    // OTP should be cleared after successful verification
    const updated = await User.findById(user._id)
    assert.equal(updated.otpHash, null)
    assert.ok(updated.resetToken) // resetToken should be set
  })

  it('returns 400 for invalid OTP', async () => {
    const user = await createUser({ email: 'badotp@example.com', password: 'pass', role: 'student' })
    user.otpHash = await bcrypt.hash('123456', 10)
    user.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000)
    user.otpAttempts = 0
    await user.save()

    const res = await request(app)
      .post('/api/auth/verify-otp')
      .send({ email: 'badotp@example.com', otp: '999999' })
      .expect(400)

    assert.equal(res.body.success, false)
    assert.ok(res.body.message.includes('Invalid OTP'))

    // Attempt counter should be incremented
    const updated = await User.findById(user._id)
    assert.equal(updated.otpAttempts, 1)
  })

  it('returns 400 for expired OTP', async () => {
    const user = await createUser({ email: 'expired@example.com', password: 'pass', role: 'student' })
    user.otpHash = await bcrypt.hash('123456', 10)
    user.otpExpiresAt = new Date(Date.now() - 1 * 60 * 1000) // Expired 1 minute ago
    user.otpAttempts = 0
    await user.save()

    const res = await request(app)
      .post('/api/auth/verify-otp')
      .send({ email: 'expired@example.com', otp: '123456' })
      .expect(400)

    assert.equal(res.body.expired, true)
  })

  it('invalidates OTP after 5 failed attempts', async () => {
    const user = await createUser({ email: 'attempts@example.com', password: 'pass', role: 'student' })
    user.otpHash = await bcrypt.hash('123456', 10)
    user.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000)
    user.otpAttempts = 5 // Already hit the limit
    await user.save()

    const res = await request(app)
      .post('/api/auth/verify-otp')
      .send({ email: 'attempts@example.com', otp: '999999' })
      .expect(429)

    assert.ok(res.body.message.includes('Too many'))

    // OTP should be invalidated
    const updated = await User.findById(user._id)
    assert.equal(updated.otpHash, null)
  })

  it('returns 400 when email and OTP are missing', async () => {
    await request(app)
      .post('/api/auth/verify-otp')
      .send({})
      .expect(400)
  })
})

describe('POST /api/auth/reset-password', () => {
  it('resets password with valid reset token', async () => {
    const user = await createUser({ email: 'resetpw@example.com', password: 'oldpass', role: 'teacher' })
    const resetToken = 'my-reset-token-abc'
    user.resetToken = await bcrypt.hash(resetToken, 10)
    user.resetTokenExpiresAt = new Date(Date.now() + 10 * 60 * 1000)
    await user.save()

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ email: 'resetpw@example.com', resetToken, newPassword: 'newpass123' })
      .expect(200)

    assert.equal(res.body.success, true)

    // Verify new password works
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'resetpw@example.com', password: 'newpass123' })
      .expect(200)

    assert.equal(loginRes.body.success, true)

    // Verify old password no longer works
    await request(app)
      .post('/api/auth/login')
      .send({ email: 'resetpw@example.com', password: 'oldpass' })
      .expect(401)
  })

  it('returns 400 for expired reset token', async () => {
    const user = await createUser({ email: 'expiredreset@example.com', password: 'pass', role: 'student' })
    const resetToken = 'expired-token'
    user.resetToken = await bcrypt.hash(resetToken, 10)
    user.resetTokenExpiresAt = new Date(Date.now() - 1 * 60 * 1000) // Expired
    await user.save()

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ email: 'expiredreset@example.com', resetToken, newPassword: 'newpass123' })
      .expect(400)

    assert.ok(res.body.message.includes('expired'))
  })

  it('returns 400 for weak password', async () => {
    const user = await createUser({ email: 'weak@example.com', password: 'pass', role: 'student' })
    const resetToken = 'weak-token'
    user.resetToken = await bcrypt.hash(resetToken, 10)
    user.resetTokenExpiresAt = new Date(Date.now() + 10 * 60 * 1000)
    await user.save()

    await request(app)
      .post('/api/auth/reset-password')
      .send({ email: 'weak@example.com', resetToken, newPassword: '12345' })
      .expect(400)
  })

  it('returns 400 for invalid reset token', async () => {
    const user = await createUser({ email: 'invalidtoken@example.com', password: 'pass', role: 'student' })
    user.resetToken = await bcrypt.hash('correct-token', 10)
    user.resetTokenExpiresAt = new Date(Date.now() + 10 * 60 * 1000)
    await user.save()

    await request(app)
      .post('/api/auth/reset-password')
      .send({ email: 'invalidtoken@example.com', resetToken: 'wrong-token', newPassword: 'newpass123' })
      .expect(400)
  })

  it('returns 400 when required fields are missing', async () => {
    await request(app)
      .post('/api/auth/reset-password')
      .send({ email: 'test@example.com' })
      .expect(400)
  })
})

describe('POST /api/auth/resend-otp', () => {
  it('resends OTP successfully', async () => {
    const user = await createUser({ email: 'resend@example.com', password: 'pass', role: 'student' })
    // Set last sent time to > 60s ago
    user.otpLastSentAt = new Date(Date.now() - 120 * 1000)
    await user.save()

    const res = await request(app)
      .post('/api/auth/resend-otp')
      .send({ email: 'resend@example.com' })
      .expect(200)

    assert.equal(res.body.success, true)
    assert.ok(res.body.debugOtp) // Test mode returns OTP
  })

  it('returns 429 when OTP was sent too recently (cooldown)', async () => {
    const user = await createUser({ email: 'cooldown@example.com', password: 'pass', role: 'student' })
    user.otpLastSentAt = new Date() // Just sent
    await user.save()

    const res = await request(app)
      .post('/api/auth/resend-otp')
      .send({ email: 'cooldown@example.com' })
      .expect(429)

    assert.ok(res.body.message.includes('wait'))
    assert.ok(res.body.retryAfter > 0)
  })

  it('returns 404 for nonexistent user', async () => {
    await request(app)
      .post('/api/auth/resend-otp')
      .send({ email: 'ghost@example.com' })
      .expect(404)
  })
})

describe('Password reset full flow (end-to-end)', () => {
  it('complete flow: login -> forgot-password -> verify-otp -> reset-password -> login with new password', async () => {
    // 1. Create user
    const user = await createUser({
      email: 'e2e@example.com',
      password: 'original123',
      role: 'student',
      name: 'E2E User'
    })

    // 2. Verify original password works
    await request(app)
      .post('/api/auth/login')
      .send({ email: 'e2e@example.com', password: 'original123' })
      .expect(200)

    // 3. Request password reset
    const forgotRes = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'e2e@example.com' })
      .expect(200)

    const otp = forgotRes.body.debugOtp
    assert.ok(otp)

    // 4. Verify OTP
    const verifyRes = await request(app)
      .post('/api/auth/verify-otp')
      .send({ email: 'e2e@example.com', otp })
      .expect(200)

    const resetToken = verifyRes.body.resetToken
    assert.ok(resetToken)

    // 5. Reset password
    await request(app)
      .post('/api/auth/reset-password')
      .send({ email: 'e2e@example.com', resetToken, newPassword: 'newsecure123' })
      .expect(200)

    // 6. Old password should fail
    await request(app)
      .post('/api/auth/login')
      .send({ email: 'e2e@example.com', password: 'original123' })
      .expect(401)

    // 7. New password should work
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'e2e@example.com', password: 'newsecure123' })
      .expect(200)

    assert.equal(loginRes.body.success, true)
    assert.equal(loginRes.body.user.name, 'E2E User')
  })
})
