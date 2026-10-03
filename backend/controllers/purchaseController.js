import store from '../services/storeService.js';

export const getPurchases = async (req, res) => {
  try {
    const purchases = await store.getPurchases();
    return res.json({ success: true, count: purchases.length, data: purchases });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const addPurchase = async (req, res) => {
  try {
    const { productId, quantity, purchasePricePerUnit, totalPurchasePrice, supplier, billNumber, date } = req.body;

    if (!productId || !quantity || purchasePricePerUnit === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide productId, quantity, and purchasePricePerUnit'
      });
    }

    const result = await store.addPurchase({
      productId,
      quantity,
      purchasePricePerUnit,
      totalPurchasePrice,
      supplier,
      billNumber,
      date
    });

    return res.status(201).json({
      success: true,
      message: `Purchase recorded successfully. Stock increased and Weighted Average Cost updated to ₹${result.updatedProduct.averageCost}/${result.updatedProduct.unit}`,
      data: result
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
