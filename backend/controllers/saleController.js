import store from '../services/storeService.js';

export const getSales = async (req, res) => {
  try {
    const sales = await store.getSales();
    return res.json({ success: true, count: sales.length, data: sales });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const addSale = async (req, res) => {
  try {
    const { productId, quantity, sellingPrice, date } = req.body;

    if (!productId || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Please provide productId and quantity'
      });
    }

    const result = await store.addSale({
      productId,
      quantity,
      sellingPrice,
      date
    });

    return res.status(201).json({
      success: true,
      message: `Sale recorded successfully! Profit earned: ₹${result.sale.profit}`,
      data: result
    });
  } catch (error) {
    // 400 Bad Request for insufficient stock / validation errors
    return res.status(400).json({ success: false, message: error.message });
  }
};
