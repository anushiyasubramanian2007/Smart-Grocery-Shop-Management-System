import jwt from 'jsonwebtoken';
import store from '../services/storeService.js';

export const protectOwner = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'smart_grocery_super_secret_key_2026');
    const owner = await store.getOwner();
    if (!owner || owner.username !== decoded.username) {
      return res.status(401).json({ success: false, message: 'Owner token invalid' });
    }
    req.owner = owner;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token expired or invalid', error: error.message });
  }
};
