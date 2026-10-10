import Razorpay from 'razorpay';
import crypto from 'crypto';
import store from '../services/storeService.js';

/**
 * Resolves active Razorpay credentials:
 * Prioritizes environment variables, then store owner settings, then verified defaults
 */
const getRazorpayCredentials = async () => {
  const owner = await store.getOwner();
  const key_id =
    process.env.RAZORPAY_KEY_ID?.trim() ||
    owner?.razorpayKeyId?.trim() ||
    'rzp_test_TkFe6faGMXbM8W';
  const key_secret =
    process.env.RAZORPAY_KEY_SECRET?.trim() ||
    owner?.razorpayKeySecret?.trim() ||
    '21P1HF3vuHGmHZf1kdDLQjaN';
  const config_id =
    process.env.RAZORPAY_CONFIG_ID?.trim() ||
    owner?.razorpayConfigId?.trim() ||
    'config_TkHDcNxdaCTtek';

  return { key_id, key_secret, config_id, owner };
};

/**
 * Returns public Razorpay configuration for frontend checkout
 */
export const getRazorpayConfig = async (req, res) => {
  try {
    const { key_id, config_id, owner } = await getRazorpayCredentials();

    return res.json({
      success: true,
      keyId: key_id,
      configId: config_id,
      currency: owner?.currency === '₹' ? 'INR' : (owner?.currency || 'INR'),
      shopName: owner?.shopName || 'Tamil Nadu Smart Grocery Store',
      isTestMode: key_id.startsWith('rzp_test_')
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * STEP 1: BACKEND - Create Order
 * Endpoint: POST /api/create-order (and POST /api/payment/razorpay/create-order)
 * Calls Razorpay API: POST https://api.razorpay.com/v1/orders
 * Request: { amount (paise), currency, receipt, notes }
 * Return: { order_id, amount, currency }
 * Minimum amount: 100 paise
 */
export const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt, notes } = req.body;

    // 1. Validate amount is provided and is a valid number
    if (amount === undefined || amount === null || isNaN(Number(amount))) {
      return res.status(400).json({
        success: false,
        message: 'Amount is required and must be a valid number'
      });
    }

    const numAmount = Number(amount);

    // 2. Validate amount >= 100 paise
    if (numAmount < 100) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be at least 100 paise (₹1.00)'
      });
    }

    const amountInPaise = Math.round(numAmount);
    const { key_id, key_secret, config_id } = await getRazorpayCredentials();

    // 3. Handle auth failure if credentials missing
    if (!key_id || !key_secret) {
      return res.status(401).json({
        success: false,
        message: 'Razorpay authentication failed: Missing API credentials'
      });
    }

    const razorpay = new Razorpay({
      key_id,
      key_secret
    });

    const orderOptions = {
      amount: amountInPaise,
      currency: currency || 'INR',
      receipt: receipt || `rcpt_${Date.now()}`,
      payment_capture: 1,
      notes: notes || {
        source: 'Smart Grocery POS Billing'
      }
    };

    // 4. Call official Razorpay Orders API
    const order = await razorpay.orders.create(orderOptions);

    return res.status(200).json({
      success: true,
      order_id: order.id,
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: key_id,
      configId: config_id,
      order
    });
  } catch (error) {
    console.error('[Razorpay createOrder Error]', error);

    // Handle authentication failures (return 401)
    if (
      error.statusCode === 401 ||
      (error.error?.code === 'BAD_REQUEST_ERROR' && error.error?.description?.toLowerCase().includes('auth'))
    ) {
      return res.status(401).json({
        success: false,
        message: 'Razorpay authentication failed: Invalid Key ID or Key Secret',
        error: error.message
      });
    }

    // Handle Razorpay API errors (return 500)
    return res.status(500).json({
      success: false,
      message: error.error?.description || error.message || 'Failed to create Razorpay order',
      error: error.message
    });
  }
};

/**
 * STEP 3: BACKEND - Verify Signature
 * Endpoint: POST /api/verify-payment (and POST /api/payment/razorpay/verify)
 * Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
 * Compare generated signature with razorpay_signature
 * Return success only if signatures match
 */
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const order_id = req.body.razorpay_order_id || req.body.order_id;
    const payment_id = req.body.razorpay_payment_id || req.body.payment_id;
    const signature = req.body.razorpay_signature || req.body.signature;

    // Error Handling: Missing fields return 400
    if (!order_id || !payment_id || !signature) {
      return res.status(400).json({
        success: false,
        verified: false,
        message: 'Missing required fields: order_id, payment_id, and signature are required for verification.'
      });
    }

    const { key_secret } = await getRazorpayCredentials();

    if (!key_secret) {
      return res.status(401).json({
        success: false,
        verified: false,
        message: 'Razorpay authentication failed: Key Secret not configured'
      });
    }

    // Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
    const generatedSignature = crypto
      .createHmac('sha256', key_secret)
      .update(`${order_id}|${payment_id}`)
      .digest('hex');

    // Compare generated signature with razorpay_signature
    if (generatedSignature === signature) {
      return res.status(200).json({
        success: true,
        verified: true,
        message: 'Razorpay payment signature verified successfully',
        order_id,
        payment_id
      });
    } else {
      // Signature mismatch: return 400, do NOT mark as paid
      return res.status(400).json({
        success: false,
        verified: false,
        message: 'Invalid payment signature. Verification failed.'
      });
    }
  } catch (error) {
    console.error('[Razorpay verifyPayment Error]', error);
    return res.status(500).json({
      success: false,
      verified: false,
      message: error.message || 'Signature verification encountered an internal error'
    });
  }
};

/**
 * Test Razorpay connection with provided or saved keys
 */
export const testRazorpayConnection = async (req, res) => {
  try {
    const { keyId, keySecret } = req.body;
    const { key_id: defaultKey, key_secret: defaultSecret } = await getRazorpayCredentials();

    const testKey = (keyId && keyId.trim()) || defaultKey;
    const testSecret = (keySecret && keySecret.trim()) || defaultSecret;

    if (!testKey || !testSecret) {
      return res.status(400).json({
        success: false,
        message: 'Both Razorpay Key ID and Key Secret are required to test'
      });
    }

    const razorpay = new Razorpay({ key_id: testKey, key_secret: testSecret });
    const testOrder = await razorpay.orders.create({
      amount: 100, // 1 INR in paise (minimum order amount)
      currency: 'INR',
      receipt: `test_${Date.now()}`
    });

    return res.json({
      success: true,
      message: `Razorpay connection verified! Test Order ID: ${testOrder.id}`,
      orderId: testOrder.id
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.error?.description || error.message || 'Razorpay connection test failed'
    });
  }
};

export default {
  getRazorpayConfig,
  createRazorpayOrder,
  verifyRazorpayPayment,
  testRazorpayConnection
};
