import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Store, Shield, Volume2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

export default function Settings() {
  const { owner, updateOwnerState } = useAuth();
  const [formData, setFormData] = useState({
    shopName: '',
    currency: '₹',
    phone: '',
    address: '',
    lowStockThresholdDefault: 5,
    preferredVoiceLang: 'en-IN',
    currentPassword: '',
    newPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (owner) {
      setFormData(prev => ({
        ...prev,
        shopName: owner.shopName || 'Smart Grocery Store',
        currency: owner.currency || '₹',
        phone: owner.phone || '9876543210',
        address: owner.address || 'Main Bazaar Road, Shop #12',
        lowStockThresholdDefault: owner.lowStockThresholdDefault || 5,
        preferredVoiceLang: owner.preferredVoiceLang || 'en-IN'
      }));
    }
  }, [owner]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await authAPI.updateSettings(formData);
      if (res.data && res.data.owner) {
        updateOwnerState(res.data.owner);
      }
      setSuccessMsg('Settings updated successfully!');
      setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '' }));
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>
          Shop & Profile Settings
        </h2>
        <p style={{ fontSize: '13px', color: '#64748b' }}>
          Manage your grocery store information, voice preferences, and account security
        </p>
      </div>

      {successMsg && (
        <div style={{
          backgroundColor: '#dcfce7',
          color: '#16a34a',
          padding: '12px 16px',
          borderRadius: '10px',
          fontSize: '13px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div style={{
          backgroundColor: '#fee2e2',
          color: '#ef4444',
          padding: '12px 16px',
          borderRadius: '10px',
          fontSize: '13px',
          marginBottom: '20px'
        }}>
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Store Details Card */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: 'var(--card-shadow)',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Store size={20} color="#2563eb" />
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
              Store Information
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Store Name
              </label>
              <input
                type="text"
                name="shopName"
                value={formData.shopName}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Currency Symbol
              </label>
              <input
                type="text"
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Phone Number
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Shop Address
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          </div>
        </div>

        {/* Voice & Alerts Card */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: 'var(--card-shadow)',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Volume2 size={20} color="#2563eb" />
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
              Voice & Alert Preferences
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Default Low-Stock Threshold
              </label>
              <input
                type="number"
                name="lowStockThresholdDefault"
                value={formData.lowStockThresholdDefault}
                onChange={handleChange}
                min="1"
                className="form-input"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Preferred Voice Assistant Language
              </label>
              <select
                name="preferredVoiceLang"
                value={formData.preferredVoiceLang}
                onChange={handleChange}
                className="form-input"
              >
                <option value="ta-IN">Tamil & Tanglish - தமிழ் / Tanglish (ta-IN)</option>
                <option value="en-IN">Indian English (en-IN)</option>
                <option value="hi-IN">Hindi - हिंदी (hi-IN)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Security / Password Card */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: 'var(--card-shadow)',
          marginBottom: '28px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Shield size={20} color="#2563eb" />
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
              Change Password (Optional)
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Current Password
              </label>
              <input
                type="password"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                placeholder="Enter current password"
                className="form-input"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                New Password
              </label>
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Enter new password"
                className="form-input"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary"
          style={{ width: '180px' }}
        >
          <Save size={16} />
          <span>{loading ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </form>
    </div>
  );
}
