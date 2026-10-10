/**
 * Intelligence Controller
 * Exposes REST API endpoints for the 5 advanced intelligence features
 */

import intelligenceService from '../services/intelligenceService.js';

export const getIntelligenceSummary = async (req, res) => {
  try {
    const summary = await intelligenceService.getSummary();
    return res.json({ success: true, data: summary });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getReorderRecommendations = async (req, res) => {
  try {
    const recommendations = await intelligenceService.getReorderRecommendations();
    return res.json({ success: true, data: recommendations });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getExpiryAlerts = async (req, res) => {
  try {
    const alerts = await intelligenceService.getExpiryAlerts();
    return res.json({ success: true, data: alerts });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getDeadStock = async (req, res) => {
  try {
    const deadStock = await intelligenceService.getDeadStock();
    return res.json({ success: true, data: deadStock });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getProfitAnalysis = async (req, res) => {
  try {
    const analysis = await intelligenceService.getProfitAnalysis();
    return res.json({ success: true, data: analysis });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const simulateWhatIf = async (req, res) => {
  try {
    const scenario = req.body;
    if (!scenario || (!scenario.productId && !scenario.productName)) {
      return res.status(400).json({ success: false, message: 'Please provide scenario details including productId or productName' });
    }
    const result = await intelligenceService.simulateWhatIf(scenario);
    return res.json({ success: true, data: result });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
