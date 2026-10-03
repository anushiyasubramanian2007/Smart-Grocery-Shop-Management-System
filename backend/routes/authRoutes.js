import express from 'express';
import { loginOwner, getOwnerProfile, updateOwnerSettings } from '../controllers/authController.js';
import { protectOwner } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', loginOwner);
router.get('/profile', protectOwner, getOwnerProfile);
router.put('/settings', protectOwner, updateOwnerSettings);

export default router;
