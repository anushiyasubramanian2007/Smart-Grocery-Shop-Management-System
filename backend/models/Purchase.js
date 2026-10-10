import mongoose from 'mongoose';

const purchaseSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.Mixed, required: false },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0.01 },
  unit: { type: String, default: 'kg' },
  purchasePricePerUnit: { type: Number, required: true, min: 0 },
  totalPurchasePrice: { type: Number, required: true, min: 0 },
  supplier: { type: String, default: 'General Wholesaler' },
  billNumber: { type: String, default: '' },
  batchNumber: { type: String, default: '' },
  expiryDate: { type: Date, default: null },
  batchQuantity: { type: Number, default: 0 },
  date: { type: Date, default: Date.now },
  previousStock: { type: Number, default: 0 },
  previousAverageCost: { type: Number, default: 0 },
  newAverageCost: { type: Number, default: 0 }
});

export const Purchase = mongoose.model('Purchase', purchaseSchema);
export default Purchase;
