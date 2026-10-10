import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Boxes,
  ShoppingBag,
  TrendingUp,
  Receipt,
  ReceiptText,
  BarChart3,
  Mic,
  Settings,
  LogOut,
  ShoppingCart,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/intelligence', label: 'AI Intelligence', icon: Sparkles, badge: 'AI' },
    { to: '/billing', label: 'Voice Billing', icon: ReceiptText, badge: 'Voice' },
    { to: '/products', label: 'Products / Stock', icon: Boxes },
    { to: '/purchases', label: 'Purchase', icon: ShoppingBag },
    { to: '/sales', label: 'Sales', icon: TrendingUp },
    { to: '/expenses', label: 'Expenses', icon: Receipt },
    { to: '/reports', label: 'Reports', icon: BarChart3 },
    { to: '/voice', label: 'Voice Assistant', icon: Mic },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside style={{
      width: '260px',
      backgroundColor: '#1e293b',
      color: '#94a3b8',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      height: '100vh',
      position: 'sticky',
      top: 0,
      userSelect: 'none'
    }}>
      {/* Brand Header */}
      <div style={{
        padding: '24px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #06b6d4, #2563eb)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          boxShadow: '0 4px 10px rgba(37, 99, 235, 0.3)'
        }}>
          <ShoppingCart size={22} />
        </div>
        <span style={{
          color: '#ffffff',
          fontWeight: '700',
          fontSize: '16px',
          letterSpacing: '-0.2px'
        }}>
          Smart Grocery Manager
        </span>
      </div>

      {/* Navigation Links */}
      <nav style={{
        flex: 1,
        padding: '20px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        overflowY: 'auto'
      }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '11px 16px',
                borderRadius: '9px',
                fontSize: '14px',
                fontWeight: isActive ? '600' : '500',
                color: isActive ? '#ffffff' : '#94a3b8',
                backgroundColor: isActive ? '#2563eb' : 'transparent',
                transition: 'all 0.15s ease',
                boxShadow: isActive ? '0 4px 12px rgba(37, 99, 235, 0.25)' : 'none'
              })}
            >
              <Icon size={19} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && (
                <span style={{
                  fontSize: '10px',
                  fontWeight: '700',
                  padding: '2px 7px',
                  borderRadius: '9999px',
                  backgroundColor: '#06b6d4',
                  color: '#ffffff',
                  letterSpacing: '0.3px',
                  textTransform: 'uppercase'
                }}>
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Logout button */}
      <div style={{
        padding: '16px 14px',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '11px 16px',
            borderRadius: '9px',
            fontSize: '14px',
            fontWeight: '500',
            color: '#94a3b8',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'background-color 0.15s, color 0.15s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#ef4444';
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#94a3b8';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <LogOut size={19} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
