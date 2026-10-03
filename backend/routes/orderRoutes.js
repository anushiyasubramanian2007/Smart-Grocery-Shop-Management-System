import express from 'express';
import {
  parseVoiceOrderEndpoint,
  createOrder,
  getOrders,
  getOrderById
} from '../controllers/orderController.js';

const router = express.Router();

router.post('/voice-parse', parseVoiceOrderEndpoint);
router.post('/', createOrder);
router.get('/', getOrders);
router.get('/:id', getOrderById);

export default router;
