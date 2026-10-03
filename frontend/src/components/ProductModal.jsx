import React, { useState, useEffect } from 'react';
import { X, Plus, Calculator, Check, Sparkles } from 'lucide-react';

export const TAMIL_NADU_CATEGORIES = [
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
];

export const SUPPORTED_UNITS = [
  { value: 'kg', label: 'kg (கிலோ)' },
  { value: 'gram', label: 'gram (கிராம்)' },
  { value: 'litre', label: 'litre (லிட்டர்)' },
  { value: 'ml', label: 'ml (மில்லி)' },
  { value: 'packet', label: 'packet (பாக்கெட்)' },
  { value: 'piece', label: 'piece (எண்ணிக்கை)' },
  { value: 'bottle', label: 'bottle (பாட்டில்)' },
  { value: 'bunch', label: 'bunch (கட்டு)' },
  { value: 'dozen', label: 'dozen (டஜன்)' },
  { value: 'pouch', label: 'pouch (பவுச்)' }
];

export default function ProductModal({ isOpen, onClose, onSave, initialData = null }) {
  const [formData, setFormData] = useState({
    nameTamil: '',
    nameEnglish: '',
    category: 'DAL / பருப்பு வகைகள்',
    unit: 'kg',
    currentStock: 0,
    minimumStock: 5,
    averageCost: 0,
    profitType: 'FIXED',
    profitValue: 15,
    sellingPrice: 0,
    supplier: 'Local Wholesale Mandi'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        nameTamil: initialData.nameTamil || '',
        nameEnglish: initialData.nameEnglish || '',
        category: initialData.category || 'DAL / பருப்பு வகைகள்',
        unit: initialData.unit || 'kg',
        currentStock: initialData.currentStock ?? 0,
        minimumStock: initialData.minimumStock ?? 5,
        averageCost: initialData.averageCost ?? 0,
        profitType: initialData.profitType || 'FIXED',
        profitValue: initialData.profitValue ?? 15,
        sellingPrice: initialData.sellingPrice ?? 0,
        supplier: initialData.supplier || 'Local Wholesale Mandi'
      });
    } else {
      setFormData({
        nameTamil: '',
        nameEnglish: '',
        category: 'DAL / பருப்பு வகைகள்',
        unit: 'kg',
        currentStock: 10,
        minimumStock: 5,
        averageCost: 100,
        profitType: 'FIXED',
        profitValue: 15,
        sellingPrice: 115,
        supplier: 'Local Wholesale Mandi'
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const calculateSellingPrice = (cost, type, val) => {
    const c = Number(cost) || 0;
    const v = Number(val) || 0;
    if (type === 'PERCENTAGE') {
      return Math.round((c * (1 + v / 100)) * 100) / 100;
    }
    return Math.round((c + v) * 100) / 100;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextForm = { ...formData, [name]: value };

    if (name === 'averageCost' || name === 'profitType' || name === 'profitValue') {
      nextForm.sellingPrice = calculateSellingPrice(
        name === 'averageCost' ? value : formData.averageCost,
        name === 'profitType' ? value : formData.profitType,
        name === 'profitValue' ? value : formData.profitValue
      );
    }
    setFormData(nextForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const t = formData.nameTamil.trim();
    const eng = formData.nameEnglish.trim();

    if (!t && !eng) {
      setError('Please enter product name in Tamil or English');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        ...formData,
        nameTamil: t || eng,
        nameEnglish: eng || t,
        name: t && eng ? `${t} (${eng})` : (t || eng),
        currentStock: Number(formData.currentStock) || 0,
        minimumStock: Number(formData.minimumStock) || 5,
        averageCost: Number(formData.averageCost) || 0,
        profitValue: Number(formData.profitValue) || 0,
        sellingPrice: Number(formData.sellingPrice) || 0,
        supplier: formData.supplier.trim() || 'Wholesale Mandi'
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const displayNamePreview = formData.nameTamil && formData.nameEnglish
    ? `${formData.nameTamil} (${formData.nameEnglish})`
    : (formData.nameTamil || formData.nameEnglish || 'புதிய பொருள் (New Product)');

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '560px',
        maxHeight: '92vh',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        overflowY: 'auto',
        border: '1px solid #e2e8f0'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#f8fafc'
        }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{initialData ? 'பொருளைத் திருத்து (Edit Product)' : 'புதிய பொருள் சேர்க்க (Add Product)'}</span>
            </h2>
            <p style={{ fontSize: '12px', color: '#64748b' }}>
              Tamil Nadu Grocery Shop Management System • Bilingual Support
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#94a3b8',
              padding: '6px',
              borderRadius: '8px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Live Bilingual Preview Pill */}
        <div style={{
          padding: '10px 24px',
          backgroundColor: '#eff6ff',
          borderBottom: '1px solid #dbeafe',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13px',
          color: '#1e40af'
        }}>
          <Sparkles size={16} color="#2563eb" />
          <span><strong>காட்சிப் பெயர் (Display Name):</strong> {displayNamePreview}</span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px' }}>
          {error && (
            <div style={{
              backgroundColor: '#fee2e2',
              color: '#ef4444',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '16px'
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            {/* Tamil Name */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>
                தமிழ் பெயர் (Tamil Name) *
              </label>
              <input
                type="text"
                name="nameTamil"
                value={formData.nameTamil}
                onChange={handleChange}
                placeholder="எ.கா: உளுந்து பருப்பு"
                className="form-input"
                style={{ fontSize: '14px' }}
                required
              />
            </div>

            {/* English Name */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>
                ஆங்கிலப் பெயர் (English Name) *
              </label>
              <input
                type="text"
                name="nameEnglish"
                value={formData.nameEnglish}
                onChange={handleChange}
                placeholder="e.g. Urad Dal"
                className="form-input"
                style={{ fontSize: '14px' }}
                required
              />
            </div>

            {/* Category */}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>
                பிரிவு (Category)
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="form-input"
              >
                {TAMIL_NADU_CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Unit */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>
                அளவு அலகு (Unit)
              </label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="form-input"
              >
                {SUPPORTED_UNITS.map(u => (
                  <option key={u.value} value={u.value}>{u.label}</option>
                ))}
              </select>
            </div>

            {/* Supplier */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>
                விற்பனையாளர் (Supplier / Mandi)
              </label>
              <input
                type="text"
                name="supplier"
                value={formData.supplier}
                onChange={handleChange}
                placeholder="e.g. Erode Mandi, ABC Wholesalers"
                className="form-input"
              />
            </div>

            {/* Current Stock */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>
                தற்போதைய இருப்பு (Initial Stock)
              </label>
              <input
                type="number"
                name="currentStock"
                value={formData.currentStock}
                onChange={handleChange}
                min="0"
                step="any"
                className="form-input"
              />
            </div>

            {/* Minimum Stock Alert Level */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>
                குறைந்தபட்ச இருப்பு எச்சரிக்கை (Low Stock Limit)
              </label>
              <input
                type="number"
                name="minimumStock"
                value={formData.minimumStock}
                onChange={handleChange}
                min="0"
                step="any"
                className="form-input"
              />
            </div>

            {/* Average Cost */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>
                கொள்முதல் விலை (Purchase Cost ₹)
              </label>
              <input
                type="number"
                name="averageCost"
                value={formData.averageCost}
                onChange={handleChange}
                min="0"
                step="any"
                className="form-input"
              />
            </div>

            {/* Profit Margin Type */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>
                லாப முறை (Profit Type)
              </label>
              <select
                name="profitType"
                value={formData.profitType}
                onChange={handleChange}
                className="form-input"
              >
                <option value="FIXED">நிலையான தொகை (Fixed ₹ per unit)</option>
                <option value="PERCENTAGE">சதவீதம் (Percentage %)</option>
              </select>
            </div>

            {/* Profit Margin Value */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>
                {formData.profitType === 'PERCENTAGE' ? 'லாப சதவீதம் (Margin %)' : 'லாபத் தொகை (Margin ₹)'}
              </label>
              <input
                type="number"
                name="profitValue"
                value={formData.profitValue}
                onChange={handleChange}
                min="0"
                step="any"
                className="form-input"
              />
            </div>

            {/* Calculated Selling Price Preview */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>
                கணக்கிடப்பட்ட விற்பனை விலை (Selling Price)
              </label>
              <div style={{
                padding: '9px 12px',
                backgroundColor: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: '8px',
                fontWeight: '700',
                color: '#065f46',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '14px'
              }}>
                <Calculator size={16} />
                <span>₹ {formData.sellingPrice || 0} / {formData.unit}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '18px', paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: '#f1f5f9',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '8px',
                fontWeight: '500',
                fontSize: '14px',
                color: '#475569',
                cursor: 'pointer'
              }}
            >
              ரத்து செய் (Cancel)
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {initialData ? <Check size={16} /> : <Plus size={16} />}
              <span>{loading ? 'Saving...' : initialData ? 'சேமி (Update)' : 'சேர் (Add Product)'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
