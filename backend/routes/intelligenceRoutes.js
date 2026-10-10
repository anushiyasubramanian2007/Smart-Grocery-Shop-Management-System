import express from 'express';
import {
  getIntelligenceSummary,
  getReorderRecommendations,
  getExpiryAlerts,
  getDeadStock,
  getProfitAnalysis,
  simulateWhatIf
} from '../controllers/intelligenceController.js';
import { protectOwner } from '../middleware/authMiddleware.js';

const router = express.Router();

// Allow read access for dashboard overview and AI intelligence view
// (Token is automatically attached by frontend api interceptor)
router.get('/summary', getIntelligenceSummary);
router.get('/reorder-recommendations', getReorderRecommendations);
router.get('/expiry-alerts', getExpiryAlerts);
router.get('/dead-stock', getDeadStock);
router.get('/profit-analysis', getProfitAnalysis);

// What-if simulator endpoint
router.post('/what-if', simulateWhatIf);

export default router;
