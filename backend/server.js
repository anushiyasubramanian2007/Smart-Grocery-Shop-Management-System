import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import store from './services/storeService.js';

import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import purchaseRoutes from './routes/purchaseRoutes.js';
import saleRoutes from './routes/saleRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import voiceRoutes from './routes/voiceRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import intelligenceRoutes from './routes/intelligenceRoutes.js';
import { createRazorpayOrder, verifyRazorpayPayment } from './controllers/paymentController.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config(); // fallback to cwd if present

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Standard Razorpay Standard Web Checkout Endpoints
app.post('/api/create-order', createRazorpayOrder);
app.post('/api/verify-payment', verifyRazorpayPayment);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/intelligence', intelligenceRoutes);

// Stock alias routes to match prompt endpoints (GET /api/stock, GET /api/stock/low)
app.use('/api/stock', productRoutes);

// Serve Frontend static assets in production
const frontendDistPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDistPath));

// SPA fallback: any non-API route serves the frontend index.html
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(frontendDistPath, 'index.html'), (err) => {
    if (err) {
      next();
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[ServerError]', err.stack);
  res.status(500).json({ success: false, message: err.message || 'Internal Server Error' });
});

// Bootstrap database and server
async function startServer() {
  await connectDB();
  await store.init();

  app.listen(PORT, () => {
    console.log(`==============================================`);
    console.log(`🚀 Smart Grocery Manager Backend is LIVE!`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`🛍️ Owner Login: username="owner", password="admin123"`);
    console.log(`==============================================`);
  });
}

startServer();
