import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['Electricity', 'Rent', 'Transport', 'Salary', 'Packaging', 'Maintenance', 'Other'],
    default: 'Other'
  },
  amount: { type: Number, required: true, min: 0 },
  description: { type: String, default: '' },
  date: { type: Date, default: Date.now }
});

export const Expense = mongoose.model('Expense', expenseSchema);
export default Expense;
