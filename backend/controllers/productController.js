import store from '../services/storeService.js';

export const getProducts = async (req, res) => {
  try {
    const products = await store.getProducts();
    return res.json({ success: true, count: products.length, data: products });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getLowStockProducts = async (req, res) => {
  try {
    const lowStock = await store.getLowStockProducts();
    return res.json({ success: true, count: lowStock.length, data: lowStock });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await store.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    return res.json({ success: true, data: product });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    const {
      name,
      nameTamil,
      nameEnglish,
      category,
      unit,
      currentStock,
      minimumStock,
      averageCost,
      profitType,
      profitValue,
      sellingPrice,
      supplier,
      icon
    } = req.body;

    const resolvedTamil = (nameTamil || '').trim();
    const resolvedEnglish = (nameEnglish || '').trim();
    let resolvedName = (name || '').trim();

    if (resolvedTamil && resolvedEnglish) {
      resolvedName = `${resolvedTamil} (${resolvedEnglish})`;
    } else if (!resolvedName) {
      resolvedName = resolvedTamil || resolvedEnglish;
    }

    if (!resolvedName) {
      return res.status(400).json({ success: false, message: 'Product name is required (Tamil or English)' });
    }

    const existing = await store.getProductByName(resolvedName);
    if (existing) {
      return res.status(400).json({ success: false, message: `Product '${resolvedName}' already exists` });
    }

    const product = await store.createProduct({
      name: resolvedName,
      nameTamil: resolvedTamil || resolvedName,
      nameEnglish: resolvedEnglish || resolvedName,
      category,
      unit,
      currentStock,
      minimumStock,
      averageCost,
      profitType,
      profitValue,
      sellingPrice,
      supplier,
      icon
    });

    return res.status(201).json({ success: true, message: 'Product added successfully', data: product });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    if (req.body.nameTamil && req.body.nameEnglish && !req.body.name) {
      req.body.name = `${req.body.nameTamil.trim()} (${req.body.nameEnglish.trim()})`;
    }
    const updated = await store.updateProduct(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    return res.json({ success: true, message: 'Product updated successfully', data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const deleted = await store.deleteProduct(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    return res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const seedTamilNaduCatalog = async (req, res) => {
  try {
    const products = await store.seedTamilNaduCatalog();
    return res.json({
      success: true,
      message: 'Authentic Tamil Nadu grocery catalog loaded successfully',
      count: products.length,
      data: products
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
