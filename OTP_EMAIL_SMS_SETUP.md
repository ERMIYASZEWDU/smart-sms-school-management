# 📧📱 OTP Setup Guide - Email & SMS Configuration

## Current Status

### ✅ **Email OTP: CONFIGURED (Test Mode)**
- Currently running in TEST MODE
- OTP codes are logged to server console
- No actual emails sent
- **Perfect for development/testing**

### ⏳ **Phone/SMS OTP: NOT CONFIGURED**
- Requires SMS provider setup
- Button disabled in UI
- Coming soon!

---

## 🎯 How It Works Right Now

### **Forgot Password Flow:**

1. User enters **email** on forgot password page
2. Backend generates 6-digit OTP code
3. **TEST MODE:** OTP is logged to server console (not sent via email)
4. User enters OTP from console
5. User resets password

### **Finding Your OTP Code:**

When you request a password reset, check your **backend server console** for:

```
📧 ================== TEST MODE EMAIL ==================
📧 To: user@example.com
📧 Subject: Password Reset OTP - Smart SMS
📧 OTP Code: 123456
📧 ====================================================
```

**Copy the 6-digit code and paste it in the OTP verification form.**

---

## 📧 Email OTP Setup (Production)

### **Option 1: Gmail (Recommended)**

1. **Enable 2-Factor Authentication** on your Gmail account
   - Go to: https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Name it "Smart SMS"
   - Copy the 16-character password

3. **Update `.env` file:**

```env
# Email Configuration (Production)
EMAIL_PROVIDER=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your.email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
EMAIL_FROM=Smart SMS <noreply@smartsms.et>
EMAIL_SECURE=false
```

4. **Restart the server:**

```bash
cd server
npm run dev
```

5. **Test it:**
   - Go to forgot password page
   - Enter your email
   - Check your **actual Gmail inbox** for OTP email
   - Beautiful HTML email with OTP code!

---

### **Option 2: Outlook/Hotmail**

1. **Update `.env` file:**

```env
EMAIL_PROVIDER=outlook
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your.email@outlook.com
EMAIL_PASSWORD=your-password
EMAIL_FROM=Smart SMS <noreply@smartsms.et>
EMAIL_SECURE=false
```

---

### **Option 3: Custom SMTP Server**

```env
EMAIL_PROVIDER=custom
EMAIL_HOST=mail.yourdomain.com
EMAIL_PORT=587
EMAIL_USER=noreply@yourdomain.com
EMAIL_PASSWORD=your-password
EMAIL_FROM=Smart SMS <noreply@yourdomain.com>
EMAIL_SECURE=false
```

---

## 📱 Phone/SMS OTP Setup (Future)

### **Option 1: Africa's Talking (For Ethiopian Numbers)**

Africa's Talking is perfect for Ethiopia (supports Ethiopian phone numbers).

1. **Sign up:**
   - Go to: https://africastalking.com/
   - Create account
   - Get API key and username

2. **Update `.env` file:**

```env
# SMS Configuration (Africa's Talking)
SMS_PROVIDER=africastalking
SMS_API_KEY=your_api_key_here
SMS_USERNAME=your_username
SMS_SENDER_ID=SmartSMS
```

3. **Update server code:**

File: `server/utils/smsService.js`

```javascript
import AfricasTalking from 'africastalking'

const africastalking = AfricasTalking({
  apiKey: process.env.SMS_API_KEY,
  username: process.env.SMS_USERNAME
})

export const sendOTPSMS = async (phone, otp) => {
  try {
    const result = await africastalking.SMS.send({
      to: [phone],
      message: `Your Smart SMS OTP code is: ${otp}. Valid for 5 minutes. Do not share this code.`,
      from: process.env.SMS_SENDER_ID
    })
    
    console.log('✅ SMS sent:', result)
    return { success: true }
  } catch (error) {
    console.error('❌ SMS failed:', error)
    return { success: false, error: error.message }
  }
}
```

4. **Install package:**

```bash
cd server
npm install africastalking
```

5. **Enable Phone button in UI:**

File: `src/pages/ForgotPassword.jsx`

Remove the `disabled` attribute from the Phone button.

---

### **Option 2: Twilio (International)**

1. **Sign up:**
   - Go to: https://www.twilio.com/
   - Create account
   - Get Account SID, Auth Token, and Phone Number

2. **Update `.env` file:**

```env
# SMS Configuration (Twilio)
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

3. **Update server code:**

File: `server/utils/smsService.js`

```javascript
import twilio from 'twilio'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

export const sendOTPSMS = async (phone, otp) => {
  try {
    const message = await client.messages.create({
      body: `Your Smart SMS OTP code is: ${otp}. Valid for 5 minutes. Do not share this code.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    })
    
    console.log('✅ SMS sent:', message.sid)
    return { success: true }
  } catch (error) {
    console.error('❌ SMS failed:', error)
    return { success: false, error: error.message }
  }
}
```

4. **Install package:**

```bash
cd server
npm install twilio
```

---

## 🧪 Testing Guide

### **Test Mode (Current Setup):**

1. Start backend server:
   ```bash
   cd server
   npm run dev
   ```

2. Watch the console output

3. Go to forgot password page: http://localhost:5173/forgot-password

4. Enter any registered email (e.g., `admin@school.com`)

5. Click "Send OTP"

6. **Check server console** for OTP code:
   ```
   📧 OTP Code: 123456
   ```

7. Enter the OTP code in the form

8. Reset your password!

---

### **Production Mode (After Email Setup):**

1. Configure Gmail/Outlook in `.env`

2. Restart server

3. Go to forgot password page

4. Enter your email

5. Click "Send OTP"

6. **Check your email inbox** for beautiful OTP email

7. Enter OTP from email

8. Reset password!

---

## 🔒 Security Features

### **Built-in Protection:**

✅ **Rate Limiting:** 60-second cooldown between OTP requests  
✅ **OTP Expiration:** 5 minutes  
✅ **Hash Storage:** OTP is hashed before storing in database  
✅ **Max Attempts:** Limited verification attempts  
✅ **Generic Responses:** Doesn't reveal if email/phone exists  

---

## 🎨 Email Template Features

When you enable production email, users receive:

- 📧 Beautiful HTML email design
- 🎨 Gradient header with school branding
- 🔐 Large, clear OTP code display
- ⏰ 5-minute expiration notice
- ⚠️ Security warnings
- 📱 Mobile-responsive design
- 🌙 Dark mode compatible

---

## 🐛 Troubleshooting

### **Email not sending in production:**

1. Check `.env` file - is `EMAIL_USER` filled?
2. Is `EMAIL_PROVIDER` set to `gmail` or `outlook` (not `test`)?
3. For Gmail: Did you enable 2FA and create App Password?
4. Check server console for error messages
5. Try sending a test email manually

### **OTP not showing in console (test mode):**

1. Make sure `EMAIL_PROVIDER=test` in `.env`
2. Make sure `EMAIL_USER` is empty or not set
3. Check server console output carefully
4. Look for the bordered box with OTP code

### **"OTP sent to your phone number" but no SMS:**

- SMS is **not configured yet**
- The message is misleading (we fixed this!)
- Use **Email** option only
- Phone/SMS requires additional setup (see above)

---

## 📊 Current Configuration

Check your current setup in `server/.env`:

```bash
cd server
cat .env | grep -E "EMAIL|SMS"
```

**Your current settings:**
```
EMAIL_PROVIDER=test          ← Test mode (console logging)
EMAIL_USER=                  ← Empty (no real emails)
SMS_PROVIDER=test            ← SMS not configured
```

---

## ✅ Next Steps

### **For Development:**
- ✅ Keep current test mode
- ✅ Use console logs for OTP codes
- ✅ No setup needed - it works!

### **For Production:**
1. ⏳ Set up Gmail App Password
2. ⏳ Update `.env` with email credentials
3. ⏳ Test email sending
4. ⏳ (Optional) Set up SMS provider for phone OTP

---

## 📞 Support

If you need help setting up:

1. **Email OTP:** Follow Gmail setup guide above
2. **SMS OTP:** Choose Africa's Talking for Ethiopia
3. **Custom Setup:** Contact your IT team

---

## 🎉 Summary

| Feature | Status | Action Needed |
|---------|--------|---------------|
| **Email OTP (Test)** | ✅ Working | None - check console for codes |
| **Email OTP (Production)** | ⏳ Not configured | Set up Gmail App Password |
| **Phone/SMS OTP** | ❌ Not configured | Set up Africa's Talking/Twilio |
| **Security** | ✅ Enabled | None - built-in protection |
| **UI/UX** | ✅ Fixed | None - clear messaging |

---

**Current Recommendation:** Keep test mode for development. When ready for production, enable Gmail email OTP first. Add SMS later if needed.
