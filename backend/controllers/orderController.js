import store from '../services/storeService.js';
import { parseVoiceOrder } from '../utils/nlpParser.js';

/**
 * Parses spoken speech text into customer order items
 * Validates stock availability and prepares order preview
 */
export const parseVoiceOrderEndpoint = async (req, res) => {
  try {
    const { command } = req.body;
    if (!command || !command.trim()) {
      return res.status(400).json({ success: false, message: 'Spoken text/command is required' });
    }

    const products = await store.getProducts();
    const parsed = parseVoiceOrder(command, products);

    // Enrich items with current product data and stock validation
    const items = [];
    const outOfStockWarnings = [];

    for (const item of parsed.items) {
      const prod = item.product || (await store.getProductByName(item.productName));
      const currentStock = prod ? Number(prod.currentStock) || 0 : 0;
      const unitPrice = prod ? Number(prod.sellingPrice) || 0 : 0;
      const total = Math.round((item.quantity * unitPrice) * 100) / 100;

      const enrichedItem = {
        productId: prod ? prod._id : null,
        productName: prod ? prod.name : item.productName,
        nameTamil: prod ? (prod.nameTamil || '') : '',
        nameEnglish: prod ? (prod.nameEnglish || '') : item.productName,
        displayName: prod ? (prod.nameTamil ? `${prod.nameTamil} (${prod.nameEnglish})` : prod.name) : item.productName,
        quantity: item.quantity,
        unit: item.unit || (prod ? prod.unit : 'kg'),
        unitPrice,
        total,
        currentStock,
        minimumStock: prod ? prod.minimumStock : 5,
        isStockAvailable: currentStock >= item.quantity,
        missingStock: item.quantity > currentStock ? Math.round((item.quantity - currentStock) * 100) / 100 : 0
      };

      if (item.quantity > currentStock) {
        outOfStockWarnings.push({
          productName: prod ? prod.name : item.productName,
          nameTamil: prod ? prod.nameTamil : item.productName,
          nameEnglish: prod ? prod.nameEnglish : item.productName,
          requested: item.quantity,
          available: currentStock,
          unit: enrichedItem.unit
        });
      }

      items.push(enrichedItem);
    }

    const subtotal = Math.round(items.reduce((acc, it) => acc + it.total, 0) * 100) / 100;

    // Generate spoken summary message
    let spokenSummary = '';
    const customer = parsed.customerName || 'Customer';

    if (outOfStockWarnings.length > 0) {
      const firstWarn = outOfStockWarnings[0];
      spokenSummary = `${firstWarn.nameTamil || firstWarn.nameEnglish} stock-la ${firstWarn.available} ${firstWarn.unit} mattum dhaan irukku. Please check!`;
    } else if (items.length > 0) {
      if (parsed.customerName && parsed.customerName !== 'Customer') {
        spokenSummary = `${customer}-ku ${items.length} items bill ready. Total ₹${subtotal}. Bill confirm pannalama?`;
      } else {
        spokenSummary = `${items.length} items bill ready. Total ₹${subtotal}. Bill confirm pannalama?`;
      }
    } else if (parsed.customerName && parsed.customerName !== 'Customer') {
      spokenSummary = `${parsed.customerName} customer name invoice-la enter panniyachu. Ippo items sollunga.`;
    } else {
      spokenSummary = `Sorry, items could not be recognized. Please repeat the order.`;
    }

    return res.json({
      success: true,
      data: {
        customerName: parsed.customerName,
        customerOnly: parsed.customerOnly || false,
        items,
        unrecognized: parsed.unrecognized,
        outOfStockWarnings,
        subtotal,
        spokenSummary,
        ttsMessage: parsed.ttsMessage,
        ttsTamil: parsed.ttsTamil
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Creates a confirmed customer order
 * Deducts stock, writes Sales records for dashboard sync, and generates invoice
 */
export const createOrder = async (req, res) => {
  try {
    const { customerName, items, discount, paymentMethod, invoiceNumber } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one item'
      });
    }

    const savedOrder = await store.createOrder({
      customerName,
      items,
      discount: Number(discount) || 0,
      paymentMethod: paymentMethod || 'Cash',
      invoiceNumber
    });

    return res.status(201).json({
      success: true,
      message: `Invoice ${savedOrder.invoiceNumber} created successfully! Total: ₹${savedOrder.grandTotal}`,
      data: savedOrder
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
      stockErrors: error.stockErrors || null
    });
  }
};

/**
 * Returns all past customer orders
 */
export const getOrders = async (req, res) => {
  try {
    const orders = await store.getOrders();
    return res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Returns a specific order by ID or invoice number
 */
export const getOrderById = async (req, res) => {
  try {
    const order = await store.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    return res.json({ success: true, data: order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
