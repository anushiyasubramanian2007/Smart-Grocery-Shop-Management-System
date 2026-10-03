import express from 'express';
import { getExpenses, addExpense } from '../controllers/expenseController.js';
import { protectOwner } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getExpenses);
router.post('/', protectOwner, addExpense);

export default router;
