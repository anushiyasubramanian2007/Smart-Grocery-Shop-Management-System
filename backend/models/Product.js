import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  nameTamil: { type: String, required: true, trim: true },
  nameEnglish: { type: String, required: true, trim: true },
  name: { type: String, trim: true }, // Display name: "nameTamil (nameEnglish)"
  category: {
    type: String,
    required: true,
    enum: [
      'DAL / பருப்பு வகைகள்',
      'RICE / அரிசி வகைகள்',
      'MILLETS / சிறுதானியங்கள்',
      'FLOURS / மாவு வகைகள்',
      'SPICES / மசாலா பொருட்கள்',
      'SPICE POWDERS / மசாலா பொடிகள்',
      'OIL / எண்ணெய் வகைகள்',
      'SUGAR & SWEETENERS / சர்க்கரை வகைகள்',
      'SALT / உப்பு',
      'VEGETABLES / காய்கறிகள்',
      'FRUITS / பழங்கள்',
      'TEA & COFFEE / தேயிலை & காபி',
      'SNACKS / தின்பண்டங்கள்',
      'DAIRY / பால் பொருட்கள்',
      'HOUSEHOLD / வீட்டு உபயோகப் பொருட்கள்'
    ],
    default: 'DAL / பருப்பு வகைகள்'
  },
  unit: {
    type: String,
    required: true,
    enum: ['kg', 'gram', 'litre', 'ml', 'packet', 'piece', 'bottle', 'bunch', 'dozen', 'pouch'],
    default: 'kg'
  },
  currentStock: { type: Number, default: 0, min: 0 },
  minimumStock: { type: Number, default: 5, min: 0 },
  averageCost: { type: Number, default: 0, min: 0 },
  sellingPrice: { type: Number, default: 0, min: 0 },
  profitType: { type: String, enum: ['FIXED', 'PERCENTAGE'], default: 'FIXED' },
  profitValue: { type: Number, default: 5, min: 0 },
  supplier: { type: String, default: 'Local Wholesale Mandi' },
  icon: { type: String, default: 'groceries' },
  shelfLifeDays: { type: Number, default: 90 },
  batchNumber: { type: String, default: '' },
  expiryDate: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Automatically ensure display name matches "nameTamil (nameEnglish)"
productSchema.pre('save', function (next) {
  if (this.nameTamil && this.nameEnglish) {
    this.name = `${this.nameTamil} (${this.nameEnglish})`;
  } else if (!this.name) {
    this.name = this.nameTamil || this.nameEnglish || 'Item';
  }
  next();
});

export const Product = mongoose.model('Product', productSchema);
export default Product;
