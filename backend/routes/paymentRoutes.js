import express from 'express';
import {
  getRazorpayConfig,
  createRazorpayOrder,
  verifyRazorpayPayment,
  testRazorpayConnection
} from '../controllers/paymentController.js';

const router = express.Router();

// Config & Test endpoints
router.get('/razorpay/config', getRazorpayConfig);
router.post('/razorpay/test-connection', testRazorpayConnection);

// Order creation endpoints
router.post('/create-order', createRazorpayOrder);
router.post('/razorpay/create-order', createRazorpayOrder);

// Verification endpoints
router.post('/verify-payment', verifyRazorpayPayment);
router.post('/razorpay/verify', verifyRazorpayPayment);

export default router;
