import mongoose from 'mongoose';

const ownerSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  email: { type: String, default: '' },
  googleId: { type: String, default: '' },
  avatar: { type: String, default: '' },
  shopName: { type: String, default: 'Smart Grocery Store' },
  currency: { type: String, default: '₹' },
  phone: { type: String, default: '9876543210' },
  address: { type: String, default: 'Main Bazaar Road, Shop #12' },
  lowStockThresholdDefault: { type: Number, default: 5 },
  preferredVoiceLang: { type: String, default: 'ta-IN' },
  accessibility: {
    fontSize: { type: String, default: 'normal' },
    themeMode: { type: String, default: 'standard' },
    reducedMotion: { type: Boolean, default: false },
    dyslexicFont: { type: Boolean, default: false },
    soundFeedback: { type: Boolean, default: true },
    soundVolume: { type: Number, default: 80 },
    largeFocusRings: { type: Boolean, default: false },
    largeClickTargets: { type: Boolean, default: false },
    keyboardShortcuts: { type: Boolean, default: true },
    speechRate: { type: Number, default: 0.95 },
    speechPitch: { type: Number, default: 1.0 },
    screenReaderAnnounce: { type: Boolean, default: false },
    autoPrintReceipt: { type: Boolean, default: false },
    defaultReceiptWidth: { type: String, default: '80mm' },
    bilingualDisplay: { type: String, default: 'both' }
  },
  upiId: { type: String, default: 'smartgrocery@upi' },
  upiQrImage: { type: String, default: '' },
  razorpayKeyId: { type: String, default: '' },
  razorpayKeySecret: { type: String, default: '' },
  razorpayConfigId: { type: String, default: 'config_TkHDcNxdaCTtek' },
  razorpayEnabled: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

export const Owner = mongoose.model('Owner', ownerSchema);
export default Owner;
