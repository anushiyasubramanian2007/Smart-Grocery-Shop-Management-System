import express from 'express';
import {
  loginOwner,
  googleLoginOwner,
  sendGoogleEmailVerificationCode,
  verifyGoogleEmailCode,
  getOwnerProfile,
  updateOwnerSettings
} from '../controllers/authController.js';
import { protectOwner } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', loginOwner);
router.post('/google', googleLoginOwner);
router.post('/google/send-code', sendGoogleEmailVerificationCode);
router.post('/google/verify-code', verifyGoogleEmailCode);
router.get('/profile', protectOwner, getOwnerProfile);
router.put('/settings', protectOwner, updateOwnerSettings);

export default router;
