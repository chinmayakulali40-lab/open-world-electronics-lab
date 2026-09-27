const express = require('express');
const router = express.Router();

// In-memory OTP store for mock/testing
const otpStore = new Map();

/**
 * POST /api/auth/phone/send-otp
 * Accept { phone }, log the generated 6-digit code (e.g. 123456) to console,
 * and return { success: true, message: "OTP sent successfully" }
 */
router.post(['/phone/send-otp', '/send-otp'], (req, res) => {
  const phone = req.body.phone || req.body.phoneNumber || req.body.mobile || '';
  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  const cleanPhone = phone.toString().trim();
  const code = '123456';
  otpStore.set(cleanPhone, code);

  console.log(`[Phone OTP] Generated 6-digit verification code for ${cleanPhone}: ${code}`);

  return res.status(200).json({
    success: true,
    message: 'OTP sent successfully',
    otp: code
  });
});

/**
 * POST /api/auth/phone/verify-otp
 * Accept { phone, otp }, accept 123456 or any valid 6-digit string,
 * and return { success: true, user: { phone, role: 'student' }, token: 'mock-jwt-token' }
 */
router.post(['/phone/verify-otp', '/verify-otp'], (req, res) => {
  const phone = req.body.phone || req.body.phoneNumber || req.body.mobile || '';
  const otp = (req.body.otp || req.body.code || '').toString().trim();

  if (!phone || !otp) {
    return res.status(400).json({ error: 'Phone and OTP are required' });
  }

  const cleanPhone = phone.toString().trim();
  const storedOtp = otpStore.get(cleanPhone);
  const isValid = otp === '123456' || otp === storedOtp || /^\d{6}$/.test(otp);

  if (!isValid) {
    return res.status(400).json({ error: 'Invalid verification code. Please enter 123456 or a valid 6-digit code.' });
  }

  return res.status(200).json({
    success: true,
    message: 'Mobile number verified successfully',
    user: {
      phone: cleanPhone,
      role: 'student'
    },
    token: 'mock-jwt-token'
  });
});

module.exports = router;
