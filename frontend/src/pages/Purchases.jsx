import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, ShoppingBag, Calculator, Calendar, Building2, Hash, Sparkles } from 'lucide-react';
import { productAPI, purchaseAPI } from '../services/api';

export default function Purchases() {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    productId: searchParams.get('productId') || '',
    quantity: searchParams.get('quantity') || '',
    purchasePricePerUnit: searchParams.get('price') || '',
    supplier: searchParams.get('supplier') || '',
    billNumber: '',
    batchNumber: '',
    expiryDate: '',
    date: new Date().toISOString().slice(0, 10)
  });

  const fetchData = async () => {
    try {
      const [prodRes, purRes] = await Promise.all([
        productAPI.getProducts(),
        purchaseAPI.getPurchases()
      ]);
      if (prodRes.data && prodRes.data.data) {
        setProducts(prodRes.data.data);
        const paramPid = searchParams.get('productId');
        if (paramPid) {
          setFormData(prev => ({
            ...prev,
            productId: paramPid,
            quantity: searchParams.get('quantity') || prev.quantity,
            purchasePricePerUnit: searchParams.get('price') || prev.purchasePricePerUnit,
            supplier: searchParams.get('supplier') || prev.supplier
          }));
        } else if (prodRes.data.data.length > 0 && !formData.productId) {
          setFormData(prev => ({ ...prev, productId: prodRes.data.data[0]._id }));
        }
      }
      if (purRes.data && purRes.data.data) {
        setPurchases(purRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load purchases data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchParams]);

  const selectedProduct = products.find(p => p._id === formData.productId);

  // Calculate live Weighted Average Cost preview
  const calculateLiveWAC = () => {
    if (!selectedProduct) return null;
    const prevStock = Number(selectedProduct.currentStock) || 0;
    const prevAvg = Number(selectedProduct.averageCost) || 0;
    const newQty = Number(formData.quantity) || 0;
    const newPrice = Number(formData.purchasePricePerUnit) || 0;

    if (newQty <= 0) return prevAvg;
    const totalStock = prevStock + newQty;
    if (prevStock <= 0) return newPrice;
    return Math.round(((prevStock * prevAvg + newQty * newPrice) / totalStock) * 100) / 100;
  };

  const liveWAC = calculateLiveWAC();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!formData.productId || !formData.quantity || !formData.purchasePricePerUnit) {
      setErrorMsg('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const res = await purchaseAPI.addPurchase({
        ...formData,
        quantity: Number(formData.quantity),
        purchasePricePerUnit: Number(formData.purchasePricePerUnit)
      });
      setSuccessMsg(res.data.message || 'Purchase recorded successfully!');
      setFormData(prev => ({
        ...prev,
        quantity: '',
        purchasePricePerUnit: '',
        supplier: '',
        billNumber: '',
        batchNumber: '',
        expiryDate: ''
      }));
      await fetchData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to record purchase');
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
      {/* Add Purchase Form Card */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '28px',
        border: '1px solid #e2e8f0',
        boxShadow: 'var(--card-shadow)',
        marginBottom: '32px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <ShoppingBag size={22} color="#2563eb" />
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
            Add Purchase
          </h2>
        </div>

        {errorMsg && (
          <div style={{
            backgroundColor: '#fee2e2',
            color: '#ef4444',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '13px',
            marginBottom: '18px'
          }}>
            {errorMsg}
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

        {searchParams.get('productId') && (
          <div style={{
            backgroundColor: '#ede9fe',
            border: '1px solid #ddd6fe',
            color: '#6d28d9',
            padding: '12px 16px',
            borderRadius: '10px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13px',
            fontWeight: '600'
          }}>
            <Sparkles size={18} />
            <span>
              Reviewing AI Smart Reorder recommendation. Product, quantity, and estimated cost have been prefilled. Verify supplier & batch information, then click Add Purchase to confirm.
            </span>
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
                onChange={handleChange}
                className="form-input"
                required
              >
                <option value="">Select Product (பொருளைத் தேர்ந்தெடுக்கவும்)</option>
                {products.map(p => {
                  const displayName = p.nameTamil && p.nameEnglish ? `${p.nameTamil} (${p.nameEnglish})` : (p.name || p.nameTamil || p.nameEnglish);
                  return (
                    <option key={p._id} value={p._id}>
                      {displayName} (Current: {p.currentStock} {p.unit || 'kg'} @ ₹{p.averageCost})
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
                placeholder="e.g. 10"
                min="0.01"
                step="any"
                className="form-input"
                required
              />
            </div>

            {/* Purchase Price per unit */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Purchase Price (per {selectedProduct?.unit || 'unit'}) *
              </label>
              <input
                type="number"
                name="purchasePricePerUnit"
                value={formData.purchasePricePerUnit}
                onChange={handleChange}
                placeholder="e.g. 50"
                min="0"
                step="any"
                className="form-input"
                required
              />
            </div>

            {/* Supplier Name */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Supplier Name
              </label>
              <input
                type="text"
                name="supplier"
                value={formData.supplier}
                onChange={handleChange}
                placeholder="e.g. ABC Suppliers"
                className="form-input"
              />
            </div>

            {/* Date */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Purchase Date
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

            {/* Bill Number */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Bill Number (Optional)
              </label>
              <input
                type="text"
                name="billNumber"
                value={formData.billNumber}
                onChange={handleChange}
                placeholder="e.g. B1234"
                className="form-input"
              />
            </div>

            {/* Batch Number */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Batch Number (தொகுதி எண் - Optional)
              </label>
              <input
                type="text"
                name="batchNumber"
                value={formData.batchNumber}
                onChange={handleChange}
                placeholder="e.g. B-2026-001"
                className="form-input"
              />
            </div>

            {/* Expiry Date */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Expiry Date (காலாவதி தேதி - Optional)
              </label>
              <input
                type="date"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          </div>

          {/* Live Weighted Average Cost Calculation Banner */}
          {selectedProduct && formData.quantity && formData.purchasePricePerUnit && (
            <div style={{
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '10px',
              padding: '12px 16px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '13px',
              color: '#1e40af'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calculator size={18} />
                <span>
                  <strong>Weighted Average Engine:</strong> Previous Avg Cost: <strong>₹{selectedProduct.averageCost}</strong> → New Avg Cost: <strong>₹{liveWAC}</strong>/{selectedProduct.unit}
                </span>
              </div>
              <div>
                Total Bill: <strong>₹{Number(formData.quantity) * Number(formData.purchasePricePerUnit)}</strong>
              </div>
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
            <span>{loading ? 'Adding...' : 'Add Purchase'}</span>
          </button>
        </form>
      </div>

      {/* Recent Purchases Table */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid #e2e8f0',
        boxShadow: 'var(--card-shadow)'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '16px' }}>
          Recent Purchases
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>
                <th style={{ padding: '14px 16px' }}>Product</th>
                <th style={{ padding: '14px 16px' }}>Qty</th>
                <th style={{ padding: '14px 16px' }}>Total Price</th>
                <th style={{ padding: '14px 16px' }}>Batch & Expiry</th>
                <th style={{ padding: '14px 16px' }}>Date</th>
                <th style={{ padding: '14px 16px' }}>Supplier / Bill</th>
              </tr>
            </thead>
            <tbody>
              {purchases.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                    No purchases recorded yet
                  </td>
                </tr>
              ) : (
                purchases.map((p) => (
                  <tr
                    key={p._id}
                    style={{ borderBottom: '1px solid #f1f5f9' }}
                  >
                    <td style={{ padding: '14px 16px', fontWeight: '600', color: '#1e293b' }}>
                      {p.productName}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#475569' }}>
                      {p.quantity} {p.unit || 'kg'}
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: '600', color: '#0f172a' }}>
                      ₹{p.totalPurchasePrice}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13px' }}>
                      {p.batchNumber ? (
                        <div style={{ fontWeight: '600', color: '#1e293b' }}>
                          Batch: {p.batchNumber}
                        </div>
                      ) : null}
                      {p.expiryDate ? (
                        <div style={{ color: '#ea580c', fontSize: '12px' }}>
                          Exp: {formatDate(p.expiryDate)}
                        </div>
                      ) : (
                        !p.batchNumber && <span style={{ color: '#94a3b8' }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#64748b' }}>
                      {formatDate(p.date)}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '13px' }}>
                      {p.supplier || 'Wholesale Trader'} {p.billNumber ? `(${p.billNumber})` : ''}
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
