import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import Sidebar from './components/Sidebar';
import Header from './components/Header';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProductsStock from './pages/ProductsStock';
import Purchases from './pages/Purchases';
import Sales from './pages/Sales';
import CustomerBilling from './pages/CustomerBilling';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import VoiceAssistant from './pages/VoiceAssistant';
import Settings from './pages/Settings';

// Protected layout wrapper
function ProtectedLayout() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f1f5f9',
        fontSize: '16px',
        fontWeight: '600',
        color: '#64748b'
      }}>
        Loading Smart Grocery Manager...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Get current page header titles
  const getHeaderDetails = () => {
    switch (location.pathname) {
      case '/billing':
        return { title: 'Voice Billing & Orders', subtitle: 'Hands-free voice customer billing, live stock check, and instant thermal receipt printing' };
      case '/products':
        return { title: 'Products / Stock', subtitle: 'Manage grocery products, stock alerts, and profit margins' };
      case '/purchases':
        return { title: 'Purchase Management', subtitle: 'Record supplier deliveries and auto-compute weighted average cost' };
      case '/sales':
        return { title: 'Sales Management', subtitle: 'Bill customers, auto-deduct stock, and calculate profits' };
      case '/expenses':
        return { title: 'Expense Tracker', subtitle: 'Log electricity, rent, transport, salaries, and shop overheads' };
      case '/reports':
        return { title: 'Analytics & Reports', subtitle: 'Daily, weekly, and monthly business performance metrics' };
      case '/voice':
        return { title: 'Voice Assistant', subtitle: 'Hands-free shop management in English, Tamil, and Tanglish' };
      case '/settings':
        return { title: 'Settings', subtitle: 'Customize store profile, voice settings, and security' };
      default:
        return { title: '', subtitle: '' }; // Uses default greeting
    }
  };

  const { title, subtitle } = getHeaderDetails();

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content-area">
        <Header title={title} subtitle={subtitle} />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/billing" element={<CustomerBilling />} />
            <Route path="/products" element={<ProductsStock />} />
            <Route path="/purchases" element={<Purchases />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/voice" element={<VoiceAssistant />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/*" element={<ProtectedLayout />} />
    </Routes>
  );
}
