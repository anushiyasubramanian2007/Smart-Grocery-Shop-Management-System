import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: false },
  productName: { type: String, required: true },
  nameTamil: { type: String },
  nameEnglish: { type: String },
  displayName: { type: String },
  quantity: { type: Number, required: true, min: 0.01 },
  unit: { type: String, default: 'kg' },
  unitPrice: { type: Number, required: true, min: 0 },
  costPrice: { type: Number, default: 0 },
  totalPrice: { type: Number, required: true, min: 0 },
  profit: { type: Number, default: 0 }
});

const orderSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  customerName: { type: String, default: 'Customer' },
  items: [orderItemSchema],
  subtotal: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true, min: 0 },
  totalProfit: { type: Number, default: 0 },
  paymentMethod: { type: String, enum: ['Cash', 'UPI', 'Card', 'Other'], default: 'Cash' },
  date: { type: Date, default: Date.now },
  time: { type: String },
  lowStockAlerts: [{ type: String }]
}, {
  timestamps: true
});

export const Order = mongoose.model('Order', orderSchema);
export default Order;
