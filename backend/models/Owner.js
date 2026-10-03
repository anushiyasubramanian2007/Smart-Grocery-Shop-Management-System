import mongoose from 'mongoose';

const ownerSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  shopName: { type: String, default: 'Smart Grocery Store' },
  currency: { type: String, default: '₹' },
  phone: { type: String, default: '9876543210' },
  address: { type: String, default: 'Main Bazaar Road, Shop #12' },
  lowStockThresholdDefault: { type: Number, default: 5 },
  preferredVoiceLang: { type: String, default: 'en-IN' },
  createdAt: { type: Date, default: Date.now }
});

export const Owner = mongoose.model('Owner', ownerSchema);
export default Owner;
