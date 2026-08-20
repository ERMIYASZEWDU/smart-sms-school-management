/**
 * Email Service for sending OTP and notifications
 * Uses Nodemailer with Gmail (or any SMTP service)
 * 
 * Environment Variables Required:
 * - EMAIL_HOST: SMTP host (e.g., smtp.gmail.com)
 * - EMAIL_PORT: SMTP port (e.g., 587)
 * - EMAIL_USER: Email address to send from
 * - EMAIL_PASSWORD: Email password or app-specific password
 * - EMAIL_FROM: Display name and email (e.g., "Smart SMS <noreply@smartsms.et>")
 */

import nodemailer from 'nodemailer'

/**
 * Create email transporter
 * In test mode, uses ethereal email (fake SMTP)
 * In production, uses configured SMTP
 */
const createTransporter = async () => {
  const emailProvider = process.env.EMAIL_PROVIDER || 'test'
  
  if (emailProvider === 'test' || process.env.NODE_ENV === 'development') {
    // Development mode - use console logging or ethereal
    console.log('📧 Email Service: TEST MODE')
    
    // For test mode, we'll still create a real transporter but log to console
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: false,
      auth: process.env.EMAIL_USER ? {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      } : null,
      // In test mode without credentials, just log
      streamTransport: !process.env.EMAIL_USER,
      newline: 'unix',
      buffer: true
    })
  }
  
  // Production mode - use real SMTP
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  })
}

/**
 * Send OTP via email
 * @param {string} email - Recipient email address
 * @param {string} otp - 6-digit OTP code
 * @param {string} userName - User's name for personalization
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export const sendOTPEmail = async (email, otp, userName = 'User') => {
  try {
    const transporter = await createTransporter()
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Smart SMS" <noreply@smartsms.et>',
      to: email,
      subject: 'Password Reset OTP - Smart SMS',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
    .otp-box { background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
    .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; margin: 10px 0; }
    .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .footer { text-align: center; color: #6c757d; font-size: 12px; margin-top: 30px; padding: 20px; }
    .btn { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Password Reset Request</h1>
    </div>
    <div class="content">
      <p>Hello <strong>${userName}</strong>,</p>
      
      <p>We received a request to reset your password for your Smart SMS account.</p>
      
      <div class="otp-box">
        <p style="margin: 0; color: #666; font-size: 14px;">Your verification code is:</p>
        <div class="otp-code">${otp}</div>
        <p style="margin: 0; color: #666; font-size: 12px;">Valid for 5 minutes</p>
      </div>
      
      <p>Enter this code in the password reset form to continue.</p>
      
      <div class="warning">
        <strong>⚠️ Security Notice:</strong>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>Never share this code with anyone</li>
          <li>Smart SMS staff will never ask for this code</li>
          <li>This code expires in 5 minutes</li>
          <li>If you didn't request this, please ignore this email</li>
        </ul>
      </div>
      
      <p style="color: #666; font-size: 14px;">
        If the button doesn't work, you can manually enter the code shown above in the password reset form.
      </p>
    </div>
    <div class="footer">
      <p>Smart School Management System</p>
      <p>This is an automated email. Please do not reply to this message.</p>
      <p style="color: #999; font-size: 11px;">
        If you did not request a password reset, you can safely ignore this email.
        Your account security is important to us.
      </p>
    </div>
  </div>
</body>
</html>
      `,
      text: `
Hello ${userName},

We received a request to reset your password for your Smart SMS account.

Your verification code is: ${otp}

This code is valid for 5 minutes.

Enter this code in the password reset form to continue.

SECURITY NOTICE:
- Never share this code with anyone
- Smart SMS staff will never ask for this code
- This code expires in 5 minutes
- If you didn't request this, please ignore this email

Smart School Management System
This is an automated email. Please do not reply to this message.
      `
    }
    
    // If test mode without credentials, just log
    if (!process.env.EMAIL_USER) {
      console.log('📧 ================== TEST MODE EMAIL ==================')
      console.log(`📧 To: ${email}`)
      console.log(`📧 Subject: ${mailOptions.subject}`)
      console.log(`📧 OTP Code: ${otp}`)
      console.log('📧 ====================================================')
      
      return {
        success: true,
        messageId: `test-${Date.now()}`,
        testMode: true
      }
    }
    
    const info = await transporter.sendMail(mailOptions)
    
    console.log('✅ Email sent successfully:', info.messageId)
    console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(info))
    
    return {
      success: true,
      messageId: info.messageId
    }
    
  } catch (error) {
    console.error('❌ Email sending failed:', error.message)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Send password reset confirmation email
 * @param {string} email - Recipient email
 * @param {string} userName - User's name
 */
export const sendPasswordResetConfirmation = async (email, userName = 'User') => {
  try {
    const transporter = await createTransporter()
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Smart SMS" <noreply@smartsms.et>',
      to: email,
      subject: 'Password Reset Successful - Smart SMS',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
    .success-icon { font-size: 48px; text-align: center; margin: 20px 0; }
    .footer { text-align: center; color: #6c757d; font-size: 12px; margin-top: 30px; padding: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Password Reset Successful</h1>
    </div>
    <div class="content">
      <div class="success-icon">🎉</div>
      
      <p>Hello <strong>${userName}</strong>,</p>
      
      <p>Your password has been successfully reset.</p>
      
      <p>You can now log in to your Smart SMS account with your new password.</p>
      
      <p style="color: #dc3545; background: #fff5f5; padding: 15px; border-left: 4px solid #dc3545; border-radius: 4px;">
        <strong>⚠️ Didn't reset your password?</strong><br>
        If you did not perform this action, please contact your system administrator immediately.
      </p>
    </div>
    <div class="footer">
      <p>Smart School Management System</p>
      <p>This is an automated email. Please do not reply to this message.</p>
    </div>
  </div>
</body>
</html>
      `,
      text: `
Hello ${userName},

Your password has been successfully reset.

You can now log in to your Smart SMS account with your new password.

⚠️ Didn't reset your password?
If you did not perform this action, please contact your system administrator immediately.

Smart School Management System
This is an automated email. Please do not reply to this message.
      `
    }
    
    if (!process.env.EMAIL_USER) {
      console.log('📧 [TEST MODE] Password reset confirmation email logged')
      return { success: true, testMode: true }
    }
    
    const info = await transporter.sendMail(mailOptions)
    console.log('✅ Password reset confirmation sent:', info.messageId)
    
    return {
      success: true,
      messageId: info.messageId
    }
    
  } catch (error) {
    console.error('❌ Confirmation email failed:', error.message)
    return {
      success: false,
      error: error.message
    }
  }
}

export default {
  sendOTPEmail,
  sendPasswordResetConfirmation
}
