import store from '../services/storeService.js';
import { parseCommand } from '../utils/nlpParser.js';

export const parseVoiceCommand = async (req, res) => {
  try {
    const command = req.body.command || req.body.text;
    if (!command || !command.trim()) {
      return res.status(400).json({ success: false, message: 'Command text is required' });
    }

    const products = await store.getProducts();
    const parsed = parseCommand(command, products);

    // If it is a query like TODAY_REPORT or STOCK_CHECK, we can immediately fetch data
    if (parsed.action === 'TODAY_REPORT') {
      const summary = await store.getDashboardSummary();
      parsed.data = summary;
      parsed.ttsMessage = `Today's sales are ₹${summary.todaySales}. Today's net profit is ₹${summary.todayNetProfit}. Total expenses are ₹${summary.todayExpenses}.`;
    } else if (parsed.action === 'STOCK_CHECK') {
      const p = await store.getProductByName(parsed.productName);
      if (p) {
        parsed.product = p;
        const displayName = p.nameEnglish || p.name;
        parsed.ttsMessage = `${displayName} current stock is ${p.currentStock} ${p.unit}. Average purchase cost is ₹${p.averageCost}. Selling price is ₹${p.sellingPrice}.`;
      } else {
        parsed.ttsMessage = `Sorry, I could not find product ${parsed.productName} in your stock.`;
      }
    }

    return res.json({ success: true, parsed });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const executeVoiceAction = async (req, res) => {
  try {
    const { action, payload } = req.body;

    if (action === 'PURCHASE') {
      // Find or create product if missing
      let product = null;
      if (payload.productId) {
        product = await store.getProductById(payload.productId);
      }
      if (!product && payload.productName) {
        product = await store.getProductByName(payload.productName);
      }
      if (!product) {
        product = await store.createProduct({
          name: payload.productName,
          category: 'Grains & Pulses',
          unit: payload.unit || 'kg',
          currentStock: 0,
          averageCost: payload.purchasePricePerUnit || 0,
          sellingPrice: Math.round((payload.purchasePricePerUnit || 0) * 1.2)
        });
      }

      const result = await store.addPurchase({
        productId: product._id,
        quantity: payload.quantity,
        purchasePricePerUnit: payload.purchasePricePerUnit,
        totalPurchasePrice: payload.totalPurchasePrice,
        supplier: 'Voice Order',
        billNumber: 'V-' + Date.now().toString().slice(-4),
        date: new Date().toISOString()
      });

      const displayProdName = (product.nameEnglish) || payload.productName?.match(/\((.*?)\)/)?.[1] || payload.productName;
      const ttsFeedback = `Purchase of ${payload.quantity} ${payload.unit || 'kg'} ${displayProdName} saved. Current stock is now ${result.updatedProduct.currentStock} ${result.updatedProduct.unit}.`;

      return res.json({
        success: true,
        message: ttsFeedback,
        ttsFeedback,
        result
      });
    }

    if (action === 'SALE') {
      let product = null;
      if (payload.productId) {
        product = await store.getProductById(payload.productId);
      }
      if (!product && payload.productName) {
        product = await store.getProductByName(payload.productName);
      }
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product ${payload.productName} not found in inventory.`,
          ttsFeedback: `Product ${payload.productName} not found.`
        });
      }

      if (Number(product.currentStock) < Number(payload.quantity)) {
        const errorMsg = `Cannot sell ${payload.quantity} ${product.unit}. Only ${product.currentStock} ${product.unit} available in stock.`;
        return res.status(400).json({
          success: false,
          message: errorMsg,
          ttsFeedback: errorMsg
        });
      }

      const result = await store.addSale({
        productId: product._id,
        quantity: payload.quantity,
        sellingPrice: payload.sellingPrice,
        date: new Date().toISOString()
      });

      const displayProdName = (product.nameEnglish) || payload.productName?.match(/\((.*?)\)/)?.[1] || payload.productName;
      const ttsFeedback = `Sale of ${payload.quantity} ${payload.unit || 'kg'} ${displayProdName} recorded. Profit earned is ₹${result.sale.profit}. Remaining stock is ${result.updatedProduct.currentStock} ${result.updatedProduct.unit}.`;

      return res.json({
        success: true,
        message: ttsFeedback,
        ttsFeedback,
        result
      });
    }

    if (action === 'SALE_LIST' || (action === 'SALE' && payload.items && Array.isArray(payload.items))) {
      const items = payload.items || [];
      const results = [];
      for (const item of items) {
        const prod = (item.productId && await store.getProductById(item.productId)) ||
          await store.getProductByName(item.productName) ||
          await store.getProductByName(item.nameEnglish) ||
          await store.getProductByName(item.nameTamil);

        if (prod) {
          const qty = Number(item.quantity) || 1;
          const sellRes = await store.addSale({
            productId: prod._id,
            quantity: qty,
            sellingPrice: item.sellingPrice || prod.sellingPrice || 25,
            date: new Date().toISOString()
          });
          results.push(sellRes);
        }
      }

      const ttsFeedback = `Sale for ${results.length} items recorded successfully.`;
      return res.json({
        success: true,
        message: ttsFeedback,
        ttsFeedback,
        results
      });
    }

    if (action === 'PURCHASE_LIST' || (action === 'PURCHASE' && payload.items && Array.isArray(payload.items))) {
      const items = payload.items || [];
      const results = [];
      for (const item of items) {
        let prod = (item.productId && await store.getProductById(item.productId)) ||
          await store.getProductByName(item.productName) ||
          await store.getProductByName(item.nameEnglish);

        if (!prod) {
          prod = await store.createProduct({
            name: item.productName,
            category: 'Grains & Pulses',
            unit: item.unit || 'kg',
            currentStock: 0,
            averageCost: item.purchasePricePerUnit || 20,
            sellingPrice: Math.round((item.purchasePricePerUnit || 20) * 1.2) || 25
          });
        }

        const purRes = await store.addPurchase({
          productId: prod._id,
          quantity: item.quantity,
          purchasePricePerUnit: item.purchasePricePerUnit || prod.averageCost || 20,
          totalPurchasePrice: item.totalPurchasePrice || (item.quantity * (item.purchasePricePerUnit || prod.averageCost || 20)),
          supplier: 'Voice Batch Order',
          billNumber: 'V-' + Date.now().toString().slice(-4),
          date: new Date().toISOString()
        });
        results.push(purRes);
      }

      const ttsFeedback = `Purchase of ${results.length} items recorded successfully.`;
      return res.json({
        success: true,
        message: ttsFeedback,
        ttsFeedback,
        results
      });
    }

    if (action === 'EXPENSE') {
      const expense = await store.addExpense({
        category: payload.category || 'Other',
        amount: payload.amount,
        description: payload.description || 'Voice logged expense',
        date: new Date().toISOString()
      });

      const ttsFeedback = `Expense of ₹${payload.amount} for ${payload.category} added successfully.`;

      return res.json({
        success: true,
        message: ttsFeedback,
        ttsFeedback,
        result: expense
      });
    }

    return res.status(400).json({ success: false, message: 'Invalid action provided' });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message, ttsFeedback: error.message });
  }
};
