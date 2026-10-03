import store from '../services/storeService.js';

export const getDashboard = async (req, res) => {
  try {
    const summary = await store.getDashboardSummary();
    return res.json({ success: true, data: summary });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getReports = async (req, res) => {
  try {
    const { period, date } = req.query;
    const reportData = await store.getReports(period || 'daily', date);
    return res.json({ success: true, data: reportData });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
