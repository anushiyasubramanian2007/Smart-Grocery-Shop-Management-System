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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/orders', orderRoutes);

// Stock alias routes to match prompt endpoints (GET /api/stock, GET /api/stock/low)
app.use('/api/stock', productRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Smart Grocery Manager API is running smoothly' });
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
