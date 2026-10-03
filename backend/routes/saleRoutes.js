import express from 'express';
import { getSales, addSale } from '../controllers/saleController.js';
import { protectOwner } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getSales);
router.post('/', protectOwner, addSale);

export default router;
