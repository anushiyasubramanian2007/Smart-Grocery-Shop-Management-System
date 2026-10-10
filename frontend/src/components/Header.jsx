import React, { useState, useEffect } from 'react';
import { Bell, ChevronDown, User, AlertTriangle, Eye, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { productAPI } from '../services/api';

export default function Header({ title, subtitle }) {
  const { owner } = useAuth();
  const { a11y, updateAccessibility, playChime, announce } = useAccessibility();
  const navigate = useNavigate();
  const [lowStockList, setLowStockList] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const fetchLowStock = async () => {
      try {
        const res = await productAPI.getLowStock();
        if (res.data && res.data.data) {
          setLowStockList(res.data.data);
        }
      } catch {}
    };
    fetchLowStock();
    const timer = setInterval(fetchLowStock, 20000); // refresh every 20s
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const defaultTitle = `${getGreeting()}, ${owner?.username ? owner.username.charAt(0).toUpperCase() + owner.username.slice(1) : 'Owner'}! 👋`;
  const defaultSubtitle = "Here's what's happening with your shop today.";

  return (
    <header style={{
      backgroundColor: '#ffffff',
      padding: '20px 32px',
      borderBottom: '1px solid #e2e8f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'relative'
    }}>
      {/* Greeting / Page Title */}
      <div>
        <h1 style={{
          fontSize: '22px',
          fontWeight: '700',
          color: '#0f172a',
          lineHeight: '1.2'
        }}>
          {title || defaultTitle}
        </h1>
        <p style={{
          fontSize: '13px',
          color: '#64748b',
          marginTop: '4px'
        }}>
          {subtitle || defaultSubtitle}
        </p>
      </div>

      {/* Right Controls: Quick Accessibility, Theme, Notifications & Owner Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Quick Accessibility Button */}
        <button
          onClick={() => {
            playChime('click');
            navigate('/settings');
          }}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#2563eb',
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
          title="Universal Accessibility & Themes (Alt+S)"
          aria-label="Universal Accessibility & Themes"
        >
          <Eye size={18} />
        </button>

        {/* Quick Theme Toggle */}
        <button
          onClick={() => {
            playChime('click');
            const nextTheme = a11y.themeMode === 'high-contrast-dark' ? 'standard' : 'high-contrast-dark';
            updateAccessibility({ themeMode: nextTheme });
            announce(`Theme changed to ${nextTheme}`);
          }}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: a11y.themeMode === 'high-contrast-dark' ? '#fbbf24' : '#475569',
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
          title="Toggle High Contrast Dark Theme (Alt+H)"
          aria-label="Toggle High Contrast Dark Theme"
        >
          {a11y.themeMode === 'high-contrast-dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notification Bell */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#475569',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background-color 0.15s'
            }}
            title="Low Stock Alerts"
          >
            <Bell size={18} />
            {lowStockList.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                backgroundColor: '#ef4444',
                color: '#ffffff',
                fontSize: '10px',
                fontWeight: '700',
                borderRadius: '9999px',
                minWidth: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
                border: '2px solid #ffffff'
              }}>
                {lowStockList.length}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div style={{
              position: 'absolute',
              top: '48px',
              right: '0',
              width: '320px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1), 0 2px 5px rgba(0,0,0,0.05)',
              border: '1px solid #e2e8f0',
              padding: '16px',
              zIndex: 100
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '12px',
                borderBottom: '1px solid #f1f5f9',
                marginBottom: '10px'
              }}>
                <span style={{ fontWeight: '600', fontSize: '14px', color: '#0f172a' }}>
                  Low Stock Alerts
                </span>
                <span style={{
                  fontSize: '11px',
                  backgroundColor: '#fee2e2',
                  color: '#ef4444',
                  fontWeight: '600',
                  padding: '2px 8px',
                  borderRadius: '9999px'
                }}>
                  {lowStockList.length} Items
                </span>
              </div>

              {lowStockList.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#64748b', textAlign: 'center', padding: '12px 0' }}>
                  All products are well stocked! 🎉
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
                  {lowStockList.map(p => (
                    <div
                      key={p._id}
                      style={{
                        padding: '8px 10px',
                        backgroundColor: '#fff1f2',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '13px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertTriangle size={15} color="#ef4444" />
                        <div>
                          <div style={{ fontWeight: '600', color: '#991b1b' }}>{p.name}</div>
                          <div style={{ fontSize: '11px', color: '#dc2626' }}>
                            Only {p.currentStock} {p.unit} left (Min: {p.minimumStock})
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setShowNotifications(false);
                          navigate('/purchases');
                        }}
                        style={{
                          backgroundColor: '#ef4444',
                          color: '#ffffff',
                          border: 'none',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          cursor: 'pointer',
                          fontWeight: '500'
                        }}
                      >
                        Restock
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Owner Profile Pill */}
        <div
          onClick={() => navigate('/settings')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '6px 12px 6px 8px',
            borderRadius: '9999px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            cursor: 'pointer',
            transition: 'background-color 0.15s'
          }}
        >
          <div style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '600',
            fontSize: '13px'
          }}>
            <User size={16} />
          </div>
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>
            {owner?.username ? owner.username.charAt(0).toUpperCase() + owner.username.slice(1) : 'Owner'}
          </span>
          <ChevronDown size={14} color="#64748b" />
        </div>
      </div>
    </header>
  );
}
