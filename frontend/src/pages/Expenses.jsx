import React, { useState, useEffect } from 'react';
import { Plus, Receipt, AlertCircle } from 'lucide-react';
import { expenseAPI } from '../services/api';

const EXPENSE_TYPES = [
  'Electricity',
  'Rent',
  'Transport',
  'Salary',
  'Packaging',
  'Maintenance',
  'Other'
];

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    category: 'Electricity',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    description: ''
  });

  const fetchExpenses = async () => {
    try {
      const res = await expenseAPI.getExpenses();
      if (res.data && res.data.data) {
        setExpenses(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load expenses:', err);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!formData.category || !formData.amount || Number(formData.amount) <= 0) {
      setErrorMsg('Please enter a valid expense amount');
      return;
    }

    setLoading(true);
    try {
      await expenseAPI.addExpense({
        ...formData,
        amount: Number(formData.amount)
      });
      setSuccessMsg('Expense added successfully!');
      setFormData({
        category: 'Electricity',
        amount: '',
        date: new Date().toISOString().slice(0, 10),
        description: ''
      });
      await fetchExpenses();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="page-container">
      {/* Add Expense Form Card */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '28px',
        border: '1px solid #e2e8f0',
        boxShadow: 'var(--card-shadow)',
        marginBottom: '32px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <Receipt size={22} color="#2563eb" />
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
            Add Expense
          </h2>
        </div>

        {errorMsg && (
          <div style={{
            backgroundColor: '#fee2e2',
            color: '#ef4444',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '13px',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div style={{
            backgroundColor: '#dcfce7',
            color: '#16a34a',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '13px',
            marginBottom: '18px'
          }}>
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '20px',
            marginBottom: '20px'
          }}>
            {/* Expense Type */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Expense Type *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="form-input"
                required
              >
                {EXPENSE_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Amount (₹) *
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="e.g. 100"
                min="1"
                step="any"
                className="form-input"
                required
              />
            </div>

            {/* Date */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Date
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            {/* Note / Description */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Note (Optional)
              </label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="e.g. Electricity bill"
                className="form-input"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '180px' }}
          >
            <Plus size={16} />
            <span>{loading ? 'Adding...' : 'Add Expense'}</span>
          </button>
        </form>
      </div>

      {/* Recent Expenses Table */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid #e2e8f0',
        boxShadow: 'var(--card-shadow)'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '16px' }}>
          Recent Expenses
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>
                <th style={{ padding: '14px 16px' }}>Type</th>
                <th style={{ padding: '14px 16px' }}>Amount</th>
                <th style={{ padding: '14px 16px' }}>Date</th>
                <th style={{ padding: '14px 16px' }}>Note</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                    No expenses recorded yet
                  </td>
                </tr>
              ) : (
                expenses.map((e) => (
                  <tr
                    key={e._id}
                    style={{ borderBottom: '1px solid #f1f5f9' }}
                  >
                    <td style={{ padding: '14px 16px', fontWeight: '600', color: '#1e293b' }}>
                      {e.category}
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: '600', color: '#ea580c' }}>
                      ₹{Number(e.amount).toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#64748b' }}>
                      {formatDate(e.date)}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '13px' }}>
                      {e.description || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
