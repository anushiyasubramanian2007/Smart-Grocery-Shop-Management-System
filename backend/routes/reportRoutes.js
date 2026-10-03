import express from 'express';
import { getDashboard, getReports } from '../controllers/reportController.js';

const router = express.Router();

router.get('/dashboard', getDashboard);
router.get('/analytics', getReports);
router.get('/today', (req, res, next) => {
  req.query.period = 'daily';
  getReports(req, res, next);
});
router.get('/weekly', (req, res, next) => {
  req.query.period = 'weekly';
  getReports(req, res, next);
});
router.get('/monthly', (req, res, next) => {
  req.query.period = 'monthly';
  getReports(req, res, next);
});

export default router;
