import store from '../services/storeService.js';

export const getExpenses = async (req, res) => {
  try {
    const expenses = await store.getExpenses();
    return res.json({ success: true, count: expenses.length, data: expenses });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const addExpense = async (req, res) => {
  try {
    const { category, amount, description, date } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Please enter a valid expense amount' });
    }

    const expense = await store.addExpense({
      category: category || 'Other',
      amount,
      description,
      date
    });

    return res.status(201).json({
      success: true,
      message: 'Expense added successfully',
      data: expense
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
