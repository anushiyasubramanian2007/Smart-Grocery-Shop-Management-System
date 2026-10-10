import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  Store,
  Shield,
  Volume2,
  VolumeX,
  CheckCircle2,
  Eye,
  Type,
  Moon,
  Sun,
  Zap,
  Keyboard,
  Printer,
  RotateCcw,
  Sparkles,
  Sliders,
  Monitor,
  HelpCircle,
  AlertTriangle,
  Play,
  CreditCard,
  Smartphone,
  QrCode,
  Upload,
  Trash2,
  Image as ImageIcon,
  Info,
  ShieldCheck,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAccessibility, DEFAULT_A11Y } from '../context/AccessibilityContext';
import { authAPI, paymentAPI } from '../services/api';

export default function Settings() {
  const { owner, updateOwnerState } = useAuth();
  const {
    a11y,
    updateAccessibility,
    resetAccessibility,
    playChime,
    speakTestUtterance,
    announce
  } = useAccessibility();

  const [activeTab, setActiveTab] = useState('accessibility'); // default open accessibility tab as requested
  const [formData, setFormData] = useState({
    shopName: '',
    currency: '₹',
    phone: '',
    address: '',
    lowStockThresholdDefault: 5,
    preferredVoiceLang: 'ta-IN',
    upiId: 'anusabari273@okhdfcbank',
    upiQrImage: '',
    razorpayKeyId: '',
    razorpayKeySecret: '',
    razorpayConfigId: 'config_TkHDcNxdaCTtek',
    razorpayEnabled: true,
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [testingRazorpay, setTestingRazorpay] = useState(false);
  const [razorpayTestStatus, setRazorpayTestStatus] = useState(null);

  useEffect(() => {
    if (owner) {
      setFormData(prev => ({
        ...prev,
        shopName: owner.shopName || 'Tamil Nadu Smart Grocery Store',
        currency: owner.currency || '₹',
        phone: owner.phone || '9876543210',
        address: owner.address || 'Main Bazaar Road, Shop #12',
        lowStockThresholdDefault: owner.lowStockThresholdDefault || 5,
        preferredVoiceLang: owner.preferredVoiceLang || 'ta-IN',
        upiId: owner.upiId || 'anusabari273@okhdfcbank',
        upiQrImage: owner.upiQrImage || '',
        razorpayKeyId: owner.razorpayKeyId || '',
        razorpayKeySecret: '',
        razorpayConfigId: owner.razorpayConfigId || 'config_TkHDcNxdaCTtek',
        razorpayEnabled: owner.razorpayEnabled !== undefined ? owner.razorpayEnabled : true
      }));

      if (owner.accessibility) {
        updateAccessibility(owner.accessibility);
      }
    }
  }, [owner, updateAccessibility]);

  const handleTestRazorpay = async () => {
    setTestingRazorpay(true);
    setRazorpayTestStatus(null);
    try {
      const res = await paymentAPI.testRazorpayConnection({
        keyId: formData.razorpayKeyId || 'rzp_test_TkFe6faGMXbM8W',
        keySecret: formData.razorpayKeySecret || '21P1HF3vuHGmHZf1kdDLQjaN'
      });
      playChime('success');
      setRazorpayTestStatus({
        success: true,
        message: res.data?.message || 'Razorpay connection test passed! UPI & Cards are ready.'
      });
    } catch (err) {
      playChime('warning');
      setRazorpayTestStatus({
        success: false,
        message: err.response?.data?.message || err.message || 'Razorpay connection failed'
      });
    } finally {
      setTestingRazorpay(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSettingsQrUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select an image file (PNG, JPG, WEBP)');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setErrorMsg('Image size exceeds 8MB limit');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData(prev => ({ ...prev, upiQrImage: event.target.result }));
      playChime('click');
      setSuccessMsg('QR image loaded! Click "Save All Settings" to persist.');
    };
    reader.readAsDataURL(file);
  };

  const handleSettingsRemoveQr = () => {
    setFormData(prev => ({ ...prev, upiQrImage: '' }));
    playChime('click');
    setSuccessMsg('Custom QR image removed! Click "Save All Settings" to persist.');
  };

  const handleA11yToggle = (key) => {
    playChime('click');
    const newVal = !a11y[key];
    updateAccessibility({ [key]: newVal });
    announce(`${key} toggled ${newVal ? 'on' : 'off'}`);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      playChime('warning');
      setErrorMsg('New password and confirm password do not match');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        accessibility: a11y
      };
      const res = await authAPI.updateSettings(payload);
      if (res.data && res.data.owner) {
        updateOwnerState(res.data.owner);
      }
      playChime('success');
      setSuccessMsg('Settings and accessibility preferences saved successfully!');
      announce('Settings saved successfully');
      setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
    } catch (err) {
      playChime('warning');
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const handleResetA11y = () => {
    if (window.confirm('Reset all accessibility preferences back to system defaults?')) {
      resetAccessibility();
      setSuccessMsg('Accessibility preferences reset to default!');
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              backgroundColor: '#eff6ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2563eb'
            }}>
              <SettingsIcon size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                கடை & அணுகல் அமைப்புகள் (Shop & Accessibility Settings)
              </h2>
              <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                WCAG 2.1 Universal Usability, Visual Themes, High Contrast, Audio Cues & Shop Controls
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="btn-primary"
          style={{ padding: '10px 24px', fontSize: '14px', fontWeight: '600' }}
        >
          <Save size={16} />
          <span>{loading ? 'சேமிக்கிறது...' : 'Save All Settings'}</span>
        </button>
      </div>

      {/* Status Alerts */}
      {successMsg && (
        <div style={{
          backgroundColor: '#dcfce7',
          color: '#16a34a',
          padding: '14px 18px',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: '600',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          border: '1px solid #bbf7d0'
        }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div style={{
          backgroundColor: '#fee2e2',
          color: '#ef4444',
          padding: '14px 18px',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: '600',
          marginBottom: '20px',
          border: '1px solid #fecaca',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <AlertTriangle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Modern Tab Bar */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '2px solid #e2e8f0',
        marginBottom: '28px',
        overflowX: 'auto',
        paddingBottom: '2px'
      }}>
        <button
          type="button"
          onClick={() => { setActiveTab('accessibility'); playChime('click'); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            border: 'none',
            borderBottom: activeTab === 'accessibility' ? '3px solid #2563eb' : '3px solid transparent',
            backgroundColor: activeTab === 'accessibility' ? '#eff6ff' : 'transparent',
            color: activeTab === 'accessibility' ? '#1d4ed8' : '#64748b',
            fontWeight: '700',
            fontSize: '14px',
            cursor: 'pointer',
            borderRadius: '8px 8px 0 0',
            transition: 'all 0.15s'
          }}
        >
          <Eye size={18} />
          <span>அணுகல் வசதிகள் (Accessibility Suite)</span>
          <span style={{
            backgroundColor: '#2563eb',
            color: '#ffffff',
            fontSize: '10px',
            padding: '2px 6px',
            borderRadius: '9999px',
            marginLeft: '4px'
          }}>
            Enhanced
          </span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('general'); playChime('click'); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            border: 'none',
            borderBottom: activeTab === 'general' ? '3px solid #2563eb' : '3px solid transparent',
            backgroundColor: activeTab === 'general' ? '#eff6ff' : 'transparent',
            color: activeTab === 'general' ? '#1d4ed8' : '#64748b',
            fontWeight: '700',
            fontSize: '14px',
            cursor: 'pointer',
            borderRadius: '8px 8px 0 0',
            transition: 'all 0.15s'
          }}
        >
          <Store size={18} />
          <span>கடை சுயவிவரம் (Store Details)</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('payment'); playChime('click'); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            border: 'none',
            borderBottom: activeTab === 'payment' ? '3px solid #2563eb' : '3px solid transparent',
            backgroundColor: activeTab === 'payment' ? '#eff6ff' : 'transparent',
            color: activeTab === 'payment' ? '#1d4ed8' : '#64748b',
            fontWeight: '700',
            fontSize: '14px',
            cursor: 'pointer',
            borderRadius: '8px 8px 0 0',
            transition: 'all 0.15s'
          }}
        >
          <CreditCard size={18} />
          <span>ரேஸர்பே கட்டணம் (Razorpay Gateway)</span>
          <span style={{
            backgroundColor: '#10b981',
            color: '#ffffff',
            fontSize: '10px',
            padding: '2px 6px',
            borderRadius: '9999px',
            marginLeft: '4px'
          }}>
            UPI / Cards
          </span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('voice_pos'); playChime('click'); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            border: 'none',
            borderBottom: activeTab === 'voice_pos' ? '3px solid #2563eb' : '3px solid transparent',
            backgroundColor: activeTab === 'voice_pos' ? '#eff6ff' : 'transparent',
            color: activeTab === 'voice_pos' ? '#1d4ed8' : '#64748b',
            fontWeight: '700',
            fontSize: '14px',
            cursor: 'pointer',
            borderRadius: '8px 8px 0 0',
            transition: 'all 0.15s'
          }}
        >
          <Printer size={18} />
          <span>குரல் & ரசீது அச்சு (Voice & POS)</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('security'); playChime('click'); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            border: 'none',
            borderBottom: activeTab === 'security' ? '3px solid #2563eb' : '3px solid transparent',
            backgroundColor: activeTab === 'security' ? '#eff6ff' : 'transparent',
            color: activeTab === 'security' ? '#1d4ed8' : '#64748b',
            fontWeight: '700',
            fontSize: '14px',
            cursor: 'pointer',
            borderRadius: '8px 8px 0 0',
            transition: 'all 0.15s'
          }}
        >
          <Shield size={18} />
          <span>பாதுகாப்பு (Security)</span>
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* =========================================================================
            TAB 1: UNIVERSAL ACCESSIBILITY SUITE
            ========================================================================= */}
        {activeTab === 'accessibility' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Quick Actions Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              padding: '14px 20px',
              borderRadius: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sparkles size={20} color="#2563eb" />
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#1e3a8a' }}>
                  Universal Accessibility & Cognitive Usability Controls
                </span>
              </div>
              <button
                type="button"
                onClick={handleResetA11y}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#475569',
                  cursor: 'pointer'
                }}
              >
                <RotateCcw size={14} />
                <span>Reset to Defaults</span>
              </button>
            </div>

            {/* 1. Visual & Contrast Themes */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid #e2e8f0',
              boxShadow: 'var(--card-shadow)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <Sun size={20} color="#2563eb" />
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                  காட்சி & வண்ண தீம்கள் (Visual Contrast & Color Themes)
                </h3>
              </div>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '18px' }}>
                Choose high contrast or eye-comfort themes suited for varying shop lighting and vision requirements.
              </p>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '14px'
              }}>
                {/* Standard Light */}
                <div
                  onClick={() => {
                    playChime('click');
                    updateAccessibility({ themeMode: 'standard' });
                  }}
                  style={{
                    border: a11y.themeMode === 'standard' ? '2px solid #2563eb' : '1px solid #e2e8f0',
                    backgroundColor: a11y.themeMode === 'standard' ? '#f8faff' : '#ffffff',
                    padding: '16px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a' }}>Standard Light</span>
                    {a11y.themeMode === 'standard' && <CheckCircle2 size={16} color="#2563eb" />}
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1' }} />
                    <div style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: '#2563eb' }} />
                    <div style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1' }} />
                  </div>
                  <p style={{ fontSize: '11px', color: '#64748b', marginTop: '8px', margin: 0 }}>Clean modern UI default</p>
                </div>

                {/* High Contrast Light (WCAG AAA) */}
                <div
                  onClick={() => {
                    playChime('click');
                    updateAccessibility({ themeMode: 'high-contrast-light' });
                  }}
                  style={{
                    border: a11y.themeMode === 'high-contrast-light' ? '2px solid #000000' : '1px solid #e2e8f0',
                    backgroundColor: a11y.themeMode === 'high-contrast-light' ? '#f5f5f5' : '#ffffff',
                    padding: '16px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: '#000000' }}>High Contrast Light</span>
                    {a11y.themeMode === 'high-contrast-light' && <CheckCircle2 size={16} color="#000000" />}
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: '#ffffff', border: '2px solid #000000' }} />
                    <div style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: '#000000' }} />
                    <div style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: '#0037c6' }} />
                  </div>
                  <p style={{ fontSize: '11px', color: '#000000', marginTop: '8px', margin: 0, fontWeight: '600' }}>Pure black & white (Low Vision)</p>
                </div>

                {/* High Contrast Dark (OLED) */}
                <div
                  onClick={() => {
                    playChime('click');
                    updateAccessibility({ themeMode: 'high-contrast-dark' });
                  }}
                  style={{
                    border: a11y.themeMode === 'high-contrast-dark' ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                    backgroundColor: '#0f172a',
                    padding: '16px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: '#f8fafc' }}>High Contrast Dark</span>
                    {a11y.themeMode === 'high-contrast-dark' && <CheckCircle2 size={16} color="#60a5fa" />}
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: '#080c14', border: '1px solid #334155' }} />
                    <div style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: '#3b82f6' }} />
                    <div style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: '#fbbf24' }} />
                  </div>
                  <p style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '8px', margin: 0 }}>Deep OLED Dark Mode</p>
                </div>

                {/* Sepia Eye-Comfort */}
                <div
                  onClick={() => {
                    playChime('click');
                    updateAccessibility({ themeMode: 'sepia' });
                  }}
                  style={{
                    border: a11y.themeMode === 'sepia' ? '2px solid #8b5a2b' : '1px solid #e2e8f0',
                    backgroundColor: '#fdfaf6',
                    padding: '16px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: '#2b2118' }}>Warm Sepia</span>
                    {a11y.themeMode === 'sepia' && <CheckCircle2 size={16} color="#8b5a2b" />}
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: '#f4ece1', border: '1px solid #ded2c3' }} />
                    <div style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: '#8b5a2b' }} />
                    <div style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: '#faecd9' }} />
                  </div>
                  <p style={{ fontSize: '11px', color: '#6e5d4f', marginTop: '8px', margin: 0 }}>Reduces eye fatigue at night</p>
                </div>
              </div>
            </div>

            {/* 2. Font Size Scaling & Readability */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid #e2e8f0',
              boxShadow: 'var(--card-shadow)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <Type size={20} color="#2563eb" />
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                  எழுத்து அளவு & வாசிப்புத் திறன் (Font Scaling & Readability)
                </h3>
              </div>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '18px' }}>
                Increase font sizes up to 145% across all pages to make bill reading effortless from a distance.
              </p>

              {/* Font Size Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '12px',
                marginBottom: '20px'
              }}>
                {[
                  { id: 'normal', label: 'Standard', size: '100% (14px)', sample: 'அ' },
                  { id: 'medium', label: 'Medium', size: '115% (16px)', sample: 'அ' },
                  { id: 'large', label: 'Large', size: '130% (18px)', sample: 'அ' },
                  { id: 'xlarge', label: 'Extra Large', size: '145% (20px)', sample: 'அ' }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      playChime('click');
                      updateAccessibility({ fontSize: item.id });
                    }}
                    style={{
                      border: a11y.fontSize === item.id ? '2px solid #2563eb' : '1px solid #cbd5e1',
                      backgroundColor: a11y.fontSize === item.id ? '#eff6ff' : '#f8fafc',
                      padding: '14px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{
                      fontSize: item.id === 'normal' ? '18px' : item.id === 'medium' ? '22px' : item.id === 'large' ? '26px' : '30px',
                      fontWeight: '800',
                      color: a11y.fontSize === item.id ? '#2563eb' : '#334155',
                      lineHeight: '1.2'
                    }}>
                      {item.sample}
                    </div>
                    <div style={{ fontWeight: '700', fontSize: '13px', marginTop: '6px', color: '#0f172a' }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{item.size}</div>
                  </button>
                ))}
              </div>

              {/* Live Preview Box */}
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px dashed #cbd5e1',
                padding: '16px 20px',
                borderRadius: '12px',
                marginBottom: '20px'
              }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  நேரலை மாதிரி பார்வை (Live Text Preview)
                </span>
                <p style={{ fontWeight: '700', color: '#0f172a', marginTop: '6px', margin: 0 }}>
                  துவரம் பருப்பு (Toor Dal) • 2 kg • ₹310 | நேரடி மளிகைக் கடை ரசீது
                </p>
              </div>

              {/* Dyslexia-Friendly Font & Readability Toggles */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a' }}>
                      Dyslexia-Friendly Typography
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      Increased letter spacing & weighted glyphs
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={!!a11y.dyslexicFont}
                    onChange={() => handleA11yToggle('dyslexicFont')}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a' }}>
                      High-Visibility Focus Rings
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      Bold 3px outline for keyboard tab navigation
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={!!a11y.largeFocusRings}
                    onChange={() => handleA11yToggle('largeFocusRings')}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                </div>
              </div>
            </div>

            {/* 3. Auditory Feedback & Action Chimes */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid #e2e8f0',
              boxShadow: 'var(--card-shadow)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <Volume2 size={20} color="#2563eb" />
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                  ஒலி கருத்து & அறிவிப்புகள் (Auditory Feedback & POS Chimes)
                </h3>
              </div>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '18px' }}>
                Auditory confirmations for sales, stock warnings, voice recording, and button clicks.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '16px' }}>
                {/* Sound Toggle */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a' }}>
                      Enable POS Sound Feedback
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      Chimes for successful sales and alerts
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={!!a11y.soundFeedback}
                    onChange={() => handleA11yToggle('soundFeedback')}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                </div>

                {/* Volume Slider */}
                <div style={{
                  padding: '14px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a' }}>Sound Volume</span>
                    <span style={{ fontWeight: '700', fontSize: '13px', color: '#2563eb' }}>{a11y.soundVolume}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={a11y.soundVolume}
                    disabled={!a11y.soundFeedback}
                    onChange={(e) => updateAccessibility({ soundVolume: Number(e.target.value) })}
                    style={{ width: '100%', cursor: 'pointer' }}
                  />
                </div>
              </div>

              {/* Sound Test Buttons */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => playChime('success')}
                  disabled={!a11y.soundFeedback}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: '#dcfce7',
                    color: '#15803d',
                    border: '1px solid #86efac',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  <Play size={13} />
                  <span>Test Sale Chime</span>
                </button>

                <button
                  type="button"
                  onClick={() => playChime('warning')}
                  disabled={!a11y.soundFeedback}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: '#fee2e2',
                    color: '#b91c1c',
                    border: '1px solid #fca5a5',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  <Play size={13} />
                  <span>Test Stock Alert</span>
                </button>

                <button
                  type="button"
                  onClick={() => playChime('bell')}
                  disabled={!a11y.soundFeedback}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: '#fef3c7',
                    color: '#b45309',
                    border: '1px solid #fde68a',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  <Play size={13} />
                  <span>Test Cash Register Bell</span>
                </button>
              </div>
            </div>

            {/* 4. Motor & Motion Comfort */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid #e2e8f0',
              boxShadow: 'var(--card-shadow)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <Zap size={20} color="#2563eb" />
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                  இயக்கம் & தொடு வசதி (Motion & Motor Accessibility)
                </h3>
              </div>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '18px' }}>
                Accommodations for vestibular comfort, hand tremors, and touchscreen terminals.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a' }}>
                      Reduced Motion Mode
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      Stops pulsing mic rings & spinning animations
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={!!a11y.reducedMotion}
                    onChange={() => handleA11yToggle('reducedMotion')}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a' }}>
                      Large Touch / Click Targets
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      Expands all buttons to minimum 48px height
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={!!a11y.largeClickTargets}
                    onChange={() => handleA11yToggle('largeClickTargets')}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                </div>
              </div>
            </div>

            {/* 5. Keyboard Navigation & Hotkeys */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid #e2e8f0',
              boxShadow: 'var(--card-shadow)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Keyboard size={20} color="#2563eb" />
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                    விசைப்பலகை குறுக்குவழிகள் (Keyboard Navigation Shortcuts)
                  </h3>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Shortcuts Active:</span>
                  <input
                    type="checkbox"
                    checked={!!a11y.keyboardShortcuts}
                    onChange={() => handleA11yToggle('keyboardShortcuts')}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                </div>
              </div>

              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
                Fast cashier keys to operate the grocery counter without touching the mouse.
              </p>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                gap: '10px'
              }}>
                {[
                  { key: 'Alt + B', desc: 'Customer Voice Billing (கடை ரசீது)' },
                  { key: 'Alt + P', desc: 'Products & Stock (பொருட்கள்)' },
                  { key: 'Alt + D', desc: 'Dashboard Overview (முகப்பு)' },
                  { key: 'Alt + V', desc: 'Voice Assistant (குரல் உதவியாளர்)' },
                  { key: 'Alt + S', desc: 'Settings (அமைப்புகள்)' },
                  { key: 'Alt + H', desc: 'Toggle Dark Contrast Mode' },
                  { key: 'Alt + + / -', desc: 'Zoom In / Out Text Scale' },
                  { key: 'Esc', desc: 'Close Modals & Receipts' }
                ].map((sc, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 14px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <kbd style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      padding: '3px 8px',
                      fontSize: '12px',
                      fontWeight: '800',
                      color: '#1e293b',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}>
                      {sc.key}
                    </kbd>
                    <span style={{ fontSize: '12px', color: '#334155', fontWeight: '500' }}>
                      {sc.desc}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 6. Screen Reader & Bilingual Assist */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid #e2e8f0',
              boxShadow: 'var(--card-shadow)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <Monitor size={20} color="#2563eb" />
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                  திரை வாசிப்பான் & இருமொழி உதவி (Screen Reader & Language Modes)
                </h3>
              </div>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '18px' }}>
                Optimizations for NVDA, JAWS, Narrator, and Tamil script display preferences.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a' }}>
                      Live ARIA Announcements
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      Speaks totals, stock deductions & errors aloud
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={!!a11y.screenReaderAnnounce}
                    onChange={() => handleA11yToggle('screenReaderAnnounce')}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                </div>

                <div style={{
                  padding: '14px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0'
                }}>
                  <label style={{ display: 'block', fontWeight: '700', fontSize: '13px', color: '#0f172a', marginBottom: '6px' }}>
                    Bilingual Display Preference
                  </label>
                  <select
                    value={a11y.bilingualDisplay}
                    onChange={(e) => updateAccessibility({ bilingualDisplay: e.target.value })}
                    className="form-input"
                    style={{ padding: '8px 12px', fontSize: '13px' }}
                  >
                    <option value="both">இருமொழி - தமிழ் + English (Recommended)</option>
                    <option value="tamil">தமிழ் முதன்மை (Tamil Primary)</option>
                    <option value="english">English Primary</option>
                  </select>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* =========================================================================
            TAB 2: STORE INFORMATION
            ========================================================================= */}
        {activeTab === 'general' && (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '28px',
            border: '1px solid #e2e8f0',
            boxShadow: 'var(--card-shadow)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <Store size={22} color="#2563eb" />
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                கடை சுயவிவர விவரங்கள் (Store Information)
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                  Store / Shop Name (கடை பெயர்)
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
                  Currency Symbol (நாணயக் குறியீடு)
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
                  Contact Phone Number (தொலைபேசி)
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
                  Default Low-Stock Threshold (குறைந்த இருப்பு எச்சரிக்கை அளவு)
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

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                  Store Address (கடை முகவரி - Prints on Thermal POS Receipt)
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={3}
                  className="form-input"
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: RAZORPAY PAYMENT GATEWAY
            ========================================================================= */}
        {activeTab === 'payment' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '28px',
              border: '1px solid #e2e8f0',
              boxShadow: 'var(--card-shadow)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CreditCard size={22} color="#2563eb" />
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                    ரேஸர்பே கட்டண நுழைவாயில் (Razorpay Payment Gateway Setup)
                  </h3>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#ecfdf5',
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  border: '1px solid #a7f3d0'
                }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#047857' }}>
                    UPI, QR, GPay & Cards Supported
                  </span>
                </div>
              </div>

              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
                Enable customers to pay directly at your grocery counter via Razorpay UPI QR (Google Pay, PhonePe, Paytm, BHIM), RuPay / Visa / Mastercard Debit & Credit Cards, and NetBanking.
              </p>

              {/* Status Alert for connection testing */}
              {razorpayTestStatus && (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: '600',
                  marginBottom: '20px',
                  backgroundColor: razorpayTestStatus.success ? '#dcfce7' : '#fee2e2',
                  color: razorpayTestStatus.success ? '#15803d' : '#b91c1c',
                  border: razorpayTestStatus.success ? '1px solid #bbf7d0' : '1px solid #fecaca',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  {razorpayTestStatus.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                  <span>{razorpayTestStatus.message}</span>
                </div>
              )}

              {/* Store Counter UPI ID & Standee QR Configuration Card */}
              <div style={{
                padding: '24px',
                backgroundColor: '#eff6ff',
                borderRadius: '16px',
                border: '1.5px solid #bfdbfe',
                marginBottom: '24px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      backgroundColor: '#dbeafe',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#2563eb'
                    }}>
                      <Smartphone size={20} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#1e40af', margin: 0 }}>
                        Store Owner Code / UPI ID & Counter QR Standee
                      </h4>
                      <p style={{ fontSize: '12px', color: '#3b82f6', margin: '2px 0 0 0' }}>
                        கடை உரிமையாளர் UPI முகவரி மற்றும் கவுண்டர் QR குறியீடு அமைப்புகள்
                      </p>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: '9999px',
                    backgroundColor: '#dcfce7',
                    border: '1px solid #bbf7d0',
                    color: '#15803d',
                    fontSize: '11.5px',
                    fontWeight: '700'
                  }}>
                    <ShieldCheck size={14} />
                    <span>NPCI Universal Format (PhonePe / GPay Valid)</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginTop: '16px' }}>
                  {/* Left Column: Owner Code Input & Standee Upload */}
                  <div>
                    {/* Owner UPI ID Input */}
                    <div style={{ marginBottom: '18px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#1e40af', marginBottom: '6px' }}>
                        Owner UPI ID (Owner Code):
                      </label>
                      <input
                        type="text"
                        name="upiId"
                        value={formData.upiId}
                        onChange={handleChange}
                        placeholder="e.g. anusabari273@okhdfcbank or 9876543210@paytm"
                        className="form-input"
                        style={{
                          fontWeight: '800',
                          fontSize: '15px',
                          color: '#1e3a8a',
                          padding: '10px 14px',
                          border: '1.5px solid #2563eb',
                          backgroundColor: '#ffffff'
                        }}
                      />
                      <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                        Enter your primary UPI ID. Customers scan this QR to pay you directly.
                      </span>

                      {/* Quick handle pills */}
                      <div style={{ display: 'flex', gap: '5px', marginTop: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontSize: '10.5px', color: '#64748b' }}>Quick handles:</span>
                        {['@okhdfcbank', '@oksbi', '@okaxis', '@okicici', '@paytm', '@ybl'].map((h) => (
                          <button
                            key={h}
                            type="button"
                            onClick={() => {
                              const base = formData.upiId.includes('@') ? formData.upiId.split('@')[0] : formData.upiId;
                              setFormData(prev => ({ ...prev, upiId: (base || 'anusabari273') + h }));
                            }}
                            style={{
                              fontSize: '10.5px',
                              padding: '2px 7px',
                              borderRadius: '4px',
                              border: '1px solid #cbd5e1',
                              background: '#ffffff',
                              color: '#334155',
                              cursor: 'pointer',
                              fontWeight: '600'
                            }}
                          >
                            {h}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Counter Standee Photo Upload */}
                    <div style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      padding: '16px',
                      border: '1px solid #cbd5e1'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                          Upload Counter Standee QR Photo (Optional)
                        </span>
                        {formData.upiQrImage && (
                          <button
                            type="button"
                            onClick={handleSettingsRemoveQr}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              border: 'none',
                              background: '#fee2e2',
                              color: '#ef4444',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: '700',
                              cursor: 'pointer'
                            }}
                          >
                            <Trash2 size={12} />
                            <span>Remove Photo</span>
                          </button>
                        )}
                      </div>

                      <p style={{ fontSize: '11.5px', color: '#64748b', margin: '0 0 12px 0' }}>
                        Have a physical Google Pay for Business, PhonePe Business, or Paytm Soundbox QR standee at your counter? Upload its photo to show your authentic store standee at checkout!
                      </p>

                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '2px dashed #93c5fd',
                        backgroundColor: '#f8fafc',
                        cursor: 'pointer',
                        color: '#2563eb',
                        fontSize: '13px',
                        fontWeight: '700',
                        transition: 'all 0.15s ease'
                      }}>
                        <Upload size={16} />
                        <span>{formData.upiQrImage ? 'Upload Different Standee Image' : 'Select Standee QR Photo (PNG / JPG)'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleSettingsQrUpload}
                          style={{ display: 'none' }}
                        />
                      </label>
                    </div>

                    {/* Why did QR Code say invalid? Explanation */}
                    <div style={{
                      marginTop: '16px',
                      backgroundColor: '#fffbeb',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      border: '1px solid #fde68a'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#b45309', fontWeight: '800', fontSize: '12px', marginBottom: '4px' }}>
                        <Info size={15} />
                        <span>Why did PhonePe / Google Pay say "QR code is invalid"?</span>
                      </div>
                      <p style={{ fontSize: '11.5px', color: '#92400e', margin: 0, lineHeight: '1.5' }}>
                        Individual personal UPI IDs (like <code>@okhdfcbank</code>, <code>@oksbi</code>) belong to savings accounts. According to NPCI regulations, personal accounts cannot issue amount-locked QR codes. Our system now generates <strong>Universal Mode QR</strong> which opens Google Pay, PhonePe, and Paytm smoothly without any errors!
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Live Phone Camera Test Scanner Box */}
                  <div style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    padding: '20px',
                    border: '1.5px solid #2563eb',
                    textAlign: 'center',
                    boxShadow: '0 4px 16px rgba(37, 99, 235, 0.08)'
                  }}>
                    <div style={{
                      fontSize: '11px',
                      fontWeight: '800',
                      color: '#2563eb',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      marginBottom: '10px'
                    }}>
                      📱 Live Phone Camera Scanner Test
                    </div>

                    {formData.upiQrImage ? (
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#16a34a', marginBottom: '8px' }}>
                          Showing Uploaded Counter Standee QR:
                        </div>
                        <img
                          src={formData.upiQrImage}
                          alt="Uploaded Standee QR"
                          style={{
                            width: '180px',
                            height: '180px',
                            objectFit: 'contain',
                            display: 'block',
                            margin: '0 auto 12px auto',
                            borderRadius: '10px',
                            border: '1px solid #cbd5e1'
                          }}
                        />
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#16a34a', marginBottom: '8px' }}>
                          Universal QR for: <code>{formData.upiId || 'anusabari273@okhdfcbank'}</code>
                        </div>
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(`upi://pay?pa=${formData.upiId || 'anusabari273@okhdfcbank'}&pn=${encodeURIComponent((formData.shopName || 'Smart Grocery').replace(/[^a-zA-Z0-9 ]/g, '').trim())}&cu=INR`)}&margin=8`}
                          alt="Universal UPI Test QR"
                          style={{
                            width: '180px',
                            height: '180px',
                            display: 'block',
                            margin: '0 auto 12px auto',
                            borderRadius: '10px'
                          }}
                        />
                      </div>
                    )}

                    <div style={{
                      backgroundColor: '#f1f5f9',
                      padding: '10px',
                      borderRadius: '8px',
                      fontSize: '11.5px',
                      color: '#475569',
                      lineHeight: '1.4'
                    }}>
                      Point your phone's <strong>Google Pay</strong> or <strong>PhonePe</strong> camera at this screen right now to verify that it opens directly without any "invalid QR" warning!
                    </div>
                  </div>
                </div>
              </div>

              {/* Razorpay Toggle */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                marginBottom: '20px'
              }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a' }}>
                    Enable Razorpay at Counter Billing
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Adds Razorpay (UPI QR / Cards / NetBanking) to customer billing payment options
                  </div>
                </div>
                <input
                  type="checkbox"
                  name="razorpayEnabled"
                  checked={formData.razorpayEnabled}
                  onChange={(e) => setFormData(prev => ({ ...prev, razorpayEnabled: e.target.checked }))}
                  style={{ width: '22px', height: '22px', cursor: 'pointer' }}
                />
              </div>

              {/* Credentials Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                    Razorpay Key ID
                  </label>
                  <input
                    type="text"
                    name="razorpayKeyId"
                    value={formData.razorpayKeyId}
                    onChange={handleChange}
                    placeholder="rzp_test_... or rzp_live_..."
                    className="form-input"
                  />
                  <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                    Default test mode key is pre-configured for sandbox checkout
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                    Razorpay Key Secret
                  </label>
                  <input
                    type="password"
                    name="razorpayKeySecret"
                    value={formData.razorpayKeySecret}
                    onChange={handleChange}
                    placeholder="Enter Razorpay Key Secret"
                    className="form-input"
                  />
                  <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                    Kept secure on backend for HMAC SHA256 payment signature verification
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                    Razorpay Configuration ID (Checkout Config)
                  </label>
                  <input
                    type="text"
                    name="razorpayConfigId"
                    value={formData.razorpayConfigId}
                    onChange={handleChange}
                    placeholder="e.g. config_TkHDcNxdaCTtek"
                    className="form-input"
                  />
                  <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                    Applies custom payment methods & UPI QR order from Razorpay Dashboard
                  </span>
                </div>
              </div>

              {/* Supported Payment Channels Info */}
              <div style={{
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '12px',
                padding: '16px 20px',
                marginBottom: '20px'
              }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e40af', marginBottom: '6px' }}>
                  Supported Payment Channels for Customer:
                </div>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12px', color: '#2563eb', fontWeight: '600' }}>
                  <span>📱 Google Pay & PhonePe UPI</span>
                  <span>⚡ Instant Counter QR</span>
                  <span>💳 RuPay / Visa / Mastercard</span>
                  <span>🏦 NetBanking (50+ Banks)</span>
                  <span>👛 Paytm & Wallets</span>
                </div>
              </div>

              {/* Test Connection Button */}
              <button
                type="button"
                onClick={handleTestRazorpay}
                disabled={testingRazorpay}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: '#1e293b',
                  cursor: 'pointer'
                }}
              >
                <Zap size={16} color="#f59e0b" />
                <span>{testingRazorpay ? 'Testing Connection...' : '⚡ Test Razorpay API Connection'}</span>
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: VOICE ASSISTANT & POS HARDWARE
            ========================================================================= */}
        {activeTab === 'voice_pos' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Voice Assistant Tuning Card */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid #e2e8f0',
              boxShadow: 'var(--card-shadow)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <Volume2 size={20} color="#2563eb" />
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                  குரல் உதவியாளர் விருப்பங்கள் (Voice Assistant Speed & Language)
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                    Speech Recognition & Synthesis Language
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

                {/* Voice Speech Rate Slider */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>
                      Voice Speaking Speed (பேச்சு வேகம்)
                    </label>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#2563eb' }}>
                      {a11y.speechRate}x {a11y.speechRate < 0.9 ? '(Clear / Slow)' : a11y.speechRate > 1.1 ? '(Fast)' : '(Normal)'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.75"
                    max="1.4"
                    step="0.05"
                    value={a11y.speechRate}
                    onChange={(e) => updateAccessibility({ speechRate: Number(e.target.value) })}
                    style={{ width: '100%', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8' }}>
                    <span>0.75x (Elderly/Clarity)</span>
                    <span>1.0x</span>
                    <span>1.4x (Speed)</span>
                  </div>
                </div>

                {/* Pitch Slider */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>
                      Voice Pitch (குரல் சுருதி)
                    </label>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#2563eb' }}>
                      {a11y.speechPitch}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.8"
                    max="1.3"
                    step="0.05"
                    value={a11y.speechPitch}
                    onChange={(e) => updateAccessibility({ speechPitch: Number(e.target.value) })}
                    style={{ width: '100%', cursor: 'pointer' }}
                  />
                </div>

                {/* Voice Test Button */}
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => speakTestUtterance(formData.preferredVoiceLang === 'ta-IN' ? 'வணக்கம், ஸ்மார்ட் மளிகைக் கடை உதவியாளர் தயாராக உள்ளது.' : 'Hello, your Smart Grocery Voice Assistant is active and ready.')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      padding: '10px 16px',
                      borderRadius: '8px',
                      color: '#1d4ed8',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      width: '100%',
                      justifyContent: 'center'
                    }}
                  >
                    <Play size={15} />
                    <span>Test Voice Speech Output</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Thermal POS Receipt Preferences */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid #e2e8f0',
              boxShadow: 'var(--card-shadow)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <Printer size={20} color="#2563eb" />
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                  ரசீது அச்சு அமைப்புகள் (Thermal POS Receipt Settings)
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                    Default Thermal Paper Roll Size
                  </label>
                  <select
                    value={a11y.defaultReceiptWidth}
                    onChange={(e) => updateAccessibility({ defaultReceiptWidth: e.target.value })}
                    className="form-input"
                  >
                    <option value="80mm">80mm (Standard Desktop Thermal POS Printer)</option>
                    <option value="58mm">58mm (Compact Mobile Bluetooth Thermal Printer)</option>
                  </select>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a' }}>
                      Auto-Trigger Print Dialog
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      Instantly print bill receipt upon confirmation
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={!!a11y.autoPrintReceipt}
                    onChange={() => handleA11yToggle('autoPrintReceipt')}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                </div>
              </div>
            </div>

          </div>
        )}

        {/* =========================================================================
            TAB 4: SECURITY & ACCOUNT
            ========================================================================= */}
        {activeTab === 'security' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Account Card */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid #e2e8f0',
              boxShadow: 'var(--card-shadow)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <Shield size={20} color="#2563eb" />
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                  Owner Account & Google Connection
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <div style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Current Username</div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>{owner?.username || 'owner'}</div>
                </div>

                <div style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Google Account</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: (owner?.googleId || (owner?.email && owner?.email.includes('@'))) ? '#15803d' : '#64748b', marginTop: '4px' }}>
                    {(owner?.googleId || (owner?.email && owner?.email.includes('@'))) ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#16a34a' }}>
                        <span>🟢 Linked:</span>
                        <strong style={{ color: '#0f172a' }}>{owner?.email || 'Connected with Google'}</strong>
                      </span>
                    ) : (
                      'Not linked'
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Password Change Card */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid #e2e8f0',
              boxShadow: 'var(--card-shadow)'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '14px' }}>
                Change Password (கடவுச்சொல்லை மாற்றவும்)
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
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

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-type new password"
                    className="form-input"
                  />
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Global Save Button at Bottom */}
        <div style={{ marginTop: '28px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '220px', padding: '12px' }}
          >
            <Save size={18} />
            <span>{loading ? 'சேமிக்கிறது...' : 'Save All Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
