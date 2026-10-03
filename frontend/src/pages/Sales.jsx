import React, { useState, useEffect } from 'react';
import { Plus, TrendingUp, AlertCircle, ShoppingCart } from 'lucide-react';
import { productAPI, saleAPI } from '../services/api';

export default function Sales() {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    productId: '',
    quantity: '',
    sellingPrice: '',
    date: new Date().toISOString().slice(0, 10)
  });

  const fetchData = async () => {
    try {
      const [prodRes, saleRes] = await Promise.all([
        productAPI.getProducts(),
        saleAPI.getSales()
      ]);
      if (prodRes.data && prodRes.data.data) {
        setProducts(prodRes.data.data);
        if (prodRes.data.data.length > 0 && !formData.productId) {
          const first = prodRes.data.data[0];
          setFormData(prev => ({
            ...prev,
            productId: first._id,
            sellingPrice: first.sellingPrice || ''
          }));
        }
      }
      if (saleRes.data && saleRes.data.data) {
        setSales(saleRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load sales data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectedProduct = products.find(p => p._id === formData.productId);

  const handleProductChange = (e) => {
    const prodId = e.target.value;
    const prod = products.find(p => p._id === prodId);
    setFormData({
      ...formData,
      productId: prodId,
      sellingPrice: prod ? prod.sellingPrice : ''
    });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!formData.productId || !formData.quantity || !formData.sellingPrice) {
      setErrorMsg('Please fill all required fields');
      return;
    }

    const qty = Number(formData.quantity);
    if (selectedProduct && qty > Number(selectedProduct.currentStock)) {
      setErrorMsg(`Cannot sell ${qty} ${selectedProduct.unit}. Only ${selectedProduct.currentStock} ${selectedProduct.unit} available in stock!`);
      return;
    }

    setLoading(true);
    try {
      const res = await saleAPI.addSale({
        ...formData,
        quantity: qty,
        sellingPrice: Number(formData.sellingPrice)
      });
      setSuccessMsg(res.data.message || 'Sale recorded successfully!');
      setFormData(prev => ({
        ...prev,
        quantity: ''
      }));
      await fetchData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to record sale');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const totalRevenue = Number(formData.quantity || 0) * Number(formData.sellingPrice || 0);

  return (
    <div className="page-container">
      {/* Add Sale Form Card */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '28px',
        border: '1px solid #e2e8f0',
        boxShadow: 'var(--card-shadow)',
        marginBottom: '32px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <TrendingUp size={22} color="#2563eb" />
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
            Add Sale
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
            {/* Product Dropdown */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Product *
              </label>
              <select
                name="productId"
                value={formData.productId}
                onChange={handleProductChange}
                className="form-input"
                required
              >
                <option value="">Select Product (பொருளைத் தேர்ந்தெடுக்கவும்)</option>
                {products.map(p => {
                  const displayName = p.nameTamil && p.nameEnglish ? `${p.nameTamil} (${p.nameEnglish})` : (p.name || p.nameTamil || p.nameEnglish);
                  return (
                    <option key={p._id} value={p._id}>
                      {displayName} (Stock: {p.currentStock} {p.unit || 'kg'} | Avg Cost: ₹{p.averageCost})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Quantity ({selectedProduct?.unit || 'kg'}) *
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                placeholder="e.g. 5"
                min="0.01"
                step="any"
                max={selectedProduct ? selectedProduct.currentStock : undefined}
                className="form-input"
                required
              />
              {selectedProduct && (
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                  Available in stock: <strong>{selectedProduct.currentStock} {selectedProduct.unit}</strong>
                </div>
              )}
            </div>

            {/* Selling Price per unit */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Selling Price (per {selectedProduct?.unit || 'unit'}) *
              </label>
              <input
                type="number"
                name="sellingPrice"
                value={formData.sellingPrice}
                onChange={handleChange}
                placeholder="e.g. 25"
                min="0"
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
          </div>

          {/* Revenue preview */}
          {totalRevenue > 0 && (
            <div style={{
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '10px',
              padding: '12px 16px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '13px',
              color: '#166534'
            }}>
              <span>
                Total Sale Amount: <strong>₹{totalRevenue}</strong> ({formData.quantity} {selectedProduct?.unit} × ₹{formData.sellingPrice})
              </span>
              <span>
                Estimated Profit: <strong>₹{Math.round((totalRevenue - (Number(formData.quantity) * Number(selectedProduct?.averageCost || 0))) * 100) / 100}</strong>
              </span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '180px' }}
          >
            <Plus size={16} />
            <span>{loading ? 'Recording...' : 'Add Sale'}</span>
          </button>
        </form>
      </div>

      {/* Recent Sales Table */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid #e2e8f0',
        boxShadow: 'var(--card-shadow)'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '16px' }}>
          Recent Sales
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>
                <th style={{ padding: '14px 16px' }}>Product</th>
                <th style={{ padding: '14px 16px' }}>Qty</th>
                <th style={{ padding: '14px 16px' }}>Price</th>
                <th style={{ padding: '14px 16px' }}>Total</th>
                <th style={{ padding: '14px 16px' }}>Profit</th>
                <th style={{ padding: '14px 16px' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {sales.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                    No sales recorded yet
                  </td>
                </tr>
              ) : (
                sales.map((s) => (
                  <tr
                    key={s._id}
                    style={{ borderBottom: '1px solid #f1f5f9' }}
                  >
                    <td style={{ padding: '14px 16px', fontWeight: '600', color: '#1e293b' }}>
                      {s.productName}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#475569' }}>
                      {s.quantity} {s.unit || 'kg'}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#475569' }}>
                      ₹{s.sellingPrice}
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: '700', color: '#0f172a' }}>
                      ₹{s.totalAmount}
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: '600', color: '#16a34a' }}>
                      +₹{s.profit}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#64748b' }}>
                      {formatDate(s.date)}
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
