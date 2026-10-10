import mongoose from 'mongoose';

const saleSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.Mixed, required: false },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0.01 },
  unit: { type: String, default: 'kg' },
  sellingPrice: { type: Number, required: true, min: 0 }, // per unit
  totalAmount: { type: Number, required: true, min: 0 },
  costOfGoodsSold: { type: Number, required: true, min: 0 },
  profit: { type: Number, required: true },
  date: { type: Date, default: Date.now }
});

export const Sale = mongoose.model('Sale', saleSchema);
export default Sale;
