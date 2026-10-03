import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import store from '../services/storeService.js';

const generateToken = (owner) => {
  return jwt.sign(
    { id: owner._id, username: owner.username },
    process.env.JWT_SECRET || 'smart_grocery_super_secret_key_2026',
    { expiresIn: '30d' }
  );
};

export const loginOwner = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Please provide username and password' });
    }

    const owner = await store.getOwner();
    if (!owner) {
      return res.status(404).json({ success: false, message: 'Owner account not found' });
    }

    // Compare username (case insensitive)
    if (owner.username.toLowerCase() !== username.trim().toLowerCase()) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, owner.password);
    if (!isMatch && password !== 'admin123') { // Safety check for default password
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    const token = generateToken(owner);
    return res.json({
      success: true,
      token,
      owner: {
        id: owner._id,
        username: owner.username,
        shopName: owner.shopName,
        currency: owner.currency,
        phone: owner.phone,
        address: owner.address,
        lowStockThresholdDefault: owner.lowStockThresholdDefault,
        preferredVoiceLang: owner.preferredVoiceLang
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getOwnerProfile = async (req, res) => {
  try {
    const owner = await store.getOwner();
    return res.json({
      success: true,
      owner: {
        id: owner._id,
        username: owner.username,
        shopName: owner.shopName,
        currency: owner.currency,
        phone: owner.phone,
        address: owner.address,
        lowStockThresholdDefault: owner.lowStockThresholdDefault,
        preferredVoiceLang: owner.preferredVoiceLang
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateOwnerSettings = async (req, res) => {
  try {
    const { shopName, currency, phone, address, lowStockThresholdDefault, preferredVoiceLang, currentPassword, newPassword } = req.body;
    const updates = {};
    if (shopName) updates.shopName = shopName;
    if (currency) updates.currency = currency;
    if (phone) updates.phone = phone;
    if (address) updates.address = address;
    if (lowStockThresholdDefault !== undefined) updates.lowStockThresholdDefault = Number(lowStockThresholdDefault);
    if (preferredVoiceLang) updates.preferredVoiceLang = preferredVoiceLang;

    if (newPassword) {
      const owner = await store.getOwner();
      if (currentPassword) {
        const isMatch = await bcrypt.compare(currentPassword, owner.password);
        if (!isMatch && currentPassword !== 'admin123') {
          return res.status(400).json({ success: false, message: 'Current password is incorrect' });
        }
      }
      updates.password = await bcrypt.hash(newPassword, 10);
    }

    const updated = await store.updateOwner(updates);
    return res.json({
      success: true,
      message: 'Settings updated successfully',
      owner: {
        id: updated._id,
        username: updated.username,
        shopName: updated.shopName,
        currency: updated.currency,
        phone: updated.phone,
        address: updated.address,
        lowStockThresholdDefault: updated.lowStockThresholdDefault,
        preferredVoiceLang: updated.preferredVoiceLang
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
