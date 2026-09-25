import { Router } from 'express';
import {
  register,
  login,
  getMe,
  sendPhoneOtp,
  verifyPhoneOtp,
  sendEmailOtp,
  verifyEmailOtp,
  requestPasswordSetup,
  setupPassword,
} from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Password & Email Auth
router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateToken, getMe);

// SMS / Mobile OTP Auth
router.post('/phone/send-otp', sendPhoneOtp);
router.post('/phone/verify-otp', verifyPhoneOtp);
router.post('/send-otp', sendPhoneOtp);
router.post('/verify-otp', verifyPhoneOtp);

// Email OTP Verification
router.post('/email/send-otp', sendEmailOtp);
router.post('/email/verify-otp', verifyEmailOtp);

// Email Password Setup / Reset
router.post('/password/request-setup', requestPasswordSetup);
router.post('/password/setup', setupPassword);

export default router;
