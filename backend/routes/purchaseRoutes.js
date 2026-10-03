import express from 'express';
import { getPurchases, addPurchase } from '../controllers/purchaseController.js';
import { protectOwner } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getPurchases);
router.post('/', protectOwner, addPurchase);

export default router;
