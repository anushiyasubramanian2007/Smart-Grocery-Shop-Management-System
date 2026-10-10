import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  DollarSign,
  Receipt,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingBag,
  Volume2,
  VolumeX,
  Sparkles,
  Package,
  Clock,
  ShieldAlert,
  ArrowRight,
  BrainCircuit
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { reportAPI, intelligenceAPI } from '../services/api';
import speechService from '../utils/speech';

export default function Dashboard() {
  const [intelSummary, setIntelSummary] = useState(null);
  const [intelLoading, setIntelLoading] = useState(true);
  const [data, setData] = useState({
    todaySales: 5250,
    todayNetProfit: 1250,
    todayExpenses: 500,
    salesGrowth: 12,
    profitGrowth: 8,
    expenseChange: -5,
    lowStockAlerts: [],
    salesOverview: [
      { day: 'Mon', sales: 4200 },
      { day: 'Tue', sales: 5100 },
      { day: 'Wed', sales: 4800 },
      { day: 'Thu', sales: 5300 },
      { day: 'Fri', sales: 4900 },
      { day: 'Sat', sales: 5800 },
      { day: 'Sun', sales: 5250 },
    ],
    recentTransactions: []
  });
  const [loading, setLoading] = useState(true);
  const [speakingId, setSpeakingId] = useState(null);

  const handleSpeakAlert = (item) => {
    const tamilName = item.nameTamil || (item.name ? item.name.split('(')[0].trim() : 'பொருள்');
    const alertText = `${tamilName} stock குறைவாக உள்ளது. மீதம் ${item.currentStock} ${item.unit || 'kg'} மட்டுமே உள்ளது.`;
    setSpeakingId(item._id);
    speechService.speak(alertText, 'ta-IN', () => {
      setSpeakingId(null);
    });
  };

  const handleSpeakAllAlerts = () => {
    if (!data.lowStockAlerts || data.lowStockAlerts.length === 0) return;
    const fullText = data.lowStockAlerts
      .map((item) => {
        const tamilName = item.nameTamil || (item.name ? item.name.split('(')[0].trim() : 'பொருள்');
        return `${tamilName} stock குறைவாக உள்ளது. மீதம் ${item.currentStock} ${item.unit || 'kg'} மட்டுமே உள்ளது.`;
      })
      .join('. ');

    setSpeakingId('ALL');
    speechService.speak(fullText, 'ta-IN', () => {
      setSpeakingId(null);
    });
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await reportAPI.getDashboard();
        if (res.data && res.data.data) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchIntelligence = async () => {
      try {
        const res = await intelligenceAPI.getSummary();
        if (res.data && res.data.data) {
          setIntelSummary(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load intelligence summary:', err);
      } finally {
        setIntelLoading(false);
      }
    };

    fetchDashboard();
    fetchIntelligence();
  }, []);

  const formatPrice = (val) => Number(val || 0).toLocaleString('en-IN');

  const formatTxDate = (dateStr) => {
    if (!dateStr) return 'Today';
    const d = new Date(dateStr);
    const today = new Date().toDateString();
    const isToday = d.toDateString() === today;
    const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    if (isToday) return `Today, ${time}`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + `, ${time}`;
  };

  return (
    <div className="page-container">
      {/* 3 Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        marginBottom: '28px'
      }}>
        {/* Total Sales Card */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: 'var(--card-shadow)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              backgroundColor: '#dcfce7',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <DollarSign size={24} />
            </div>
            <div>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>
                Total Sales
              </span>
              <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', lineHeight: '1.2' }}>
                ₹ {formatPrice(data.todaySales)}
              </h2>
            </div>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '13px',
            fontWeight: '600',
            color: '#16a34a'
          }}>
            <ArrowUpRight size={16} />
            <span>{data.salesGrowth >= 0 ? `+${data.salesGrowth}%` : `${data.salesGrowth}%`} vs yesterday</span>
          </div>
        </div>

        {/* Total Profit Card */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: 'var(--card-shadow)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              backgroundColor: '#dbeafe',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <TrendingUp size={24} />
            </div>
            <div>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>
                Total Profit
              </span>
              <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', lineHeight: '1.2' }}>
                ₹ {formatPrice(data.todayNetProfit)}
              </h2>
            </div>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '13px',
            fontWeight: '600',
            color: '#2563eb'
          }}>
            <ArrowUpRight size={16} />
            <span>+{data.profitGrowth}% vs yesterday</span>
          </div>
        </div>

        {/* Total Expenses Card */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: 'var(--card-shadow)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              backgroundColor: '#ffedd5',
              color: '#ea580c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Receipt size={24} />
            </div>
            <div>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>
                Total Expenses
              </span>
              <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', lineHeight: '1.2' }}>
                ₹ {formatPrice(data.todayExpenses)}
              </h2>
            </div>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '13px',
            fontWeight: '600',
            color: '#ea580c'
          }}>
            <ArrowDownRight size={16} />
            <span>{data.expenseChange}% vs yesterday</span>
          </div>
        </div>
      </div>

      {/* NEW SECTION: SMART GROCERY INTELLIGENCE */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '18px',
        padding: '26px',
        border: '1px solid #e2e8f0',
        boxShadow: 'var(--card-shadow)',
        marginBottom: '28px',
        background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)'
      }}>
        {/* Section Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}>
                <Sparkles size={18} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                SMART GROCERY INTELLIGENCE
              </h3>
              <span style={{
                fontSize: '11px',
                fontWeight: '700',
                padding: '3px 8px',
                borderRadius: '999px',
                backgroundColor: '#ede9fe',
                color: '#7c3aed',
                textTransform: 'uppercase'
              }}>
                Decision Support
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
              Smart Reorder Formulas • FEFO Expiry Scheduling • Dead Stock Analytics • What-If Simulation
            </p>
          </div>

          <Link
            to="/intelligence"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              padding: '10px 18px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: '600',
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
              transition: 'all 0.2s'
            }}
          >
            <span>Open Intelligence Hub</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* 4 Feature Quick Tabs / Links */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: '22px',
          paddingBottom: '16px',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <Link
            to="/intelligence?tab=reorder"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#334155',
              fontSize: '12px',
              fontWeight: '600',
              textDecoration: 'none'
            }}
          >
            <span>📦 Smart Reorder</span>
          </Link>
          <Link
            to="/intelligence?tab=expiry"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#334155',
              fontSize: '12px',
              fontWeight: '600',
              textDecoration: 'none'
            }}
          >
            <span>⏳ Expiry Intelligence</span>
          </Link>
          <Link
            to="/intelligence?tab=profit"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#334155',
              fontSize: '12px',
              fontWeight: '600',
              textDecoration: 'none'
            }}
          >
            <span>📉 Profit & Dead Stock</span>
          </Link>
          <Link
            to="/intelligence?tab=simulator"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#334155',
              fontSize: '12px',
              fontWeight: '600',
              textDecoration: 'none'
            }}
          >
            <span>💡 What-If Simulator</span>
          </Link>
        </div>

        {/* 4 Summary Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px'
        }}>

          {/* Card 2: Products to Reorder */}
          <Link
            to="/intelligence?tab=reorder"
            style={{
              textDecoration: 'none',
              backgroundColor: '#ffffff',
              border: (intelSummary?.reorderNeededCount || 0) > 0 ? '1px solid #fecaca' : '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '20px' }}>📦</span>
              <span style={{
                fontSize: '11px',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '999px',
                backgroundColor: (intelSummary?.reorderNeededCount || 0) > 0 ? '#fee2e2' : '#f0fdf4',
                color: (intelSummary?.reorderNeededCount || 0) > 0 ? '#b91c1c' : '#15803d'
              }}>
                {(intelSummary?.reorderNeededCount || 0) > 0 ? 'Action Needed' : 'Healthy'}
              </span>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>
                {intelLoading ? '...' : (intelSummary?.reorderNeededCount || 0)}
              </div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#334155', marginTop: '2px' }}>
                Products to Reorder
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                Formula: D₇ + SS - Current Stock
              </div>
            </div>
          </Link>

          {/* Card 3: Expiring Soon */}
          <Link
            to="/intelligence?tab=expiry"
            style={{
              textDecoration: 'none',
              backgroundColor: '#ffffff',
              border: ((intelSummary?.expiringSoonCount || 0) + (intelSummary?.urgentExpiryCount || 0)) > 0 ? '1px solid #fed7aa' : '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '20px' }}>⏳</span>
              <span style={{
                fontSize: '11px',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '999px',
                backgroundColor: '#fff7ed',
                color: '#c2410c'
              }}>
                FEFO Order
              </span>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>
                {intelLoading ? '...' : ((intelSummary?.expiringSoonCount || 0) + (intelSummary?.urgentExpiryCount || 0))}
              </div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#334155', marginTop: '2px' }}>
                Expiring Soon
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                Batches needing prioritized sales
              </div>
            </div>
          </Link>

          {/* Card 4: Dead Stock Items */}
          <Link
            to="/intelligence?tab=profit"
            style={{
              textDecoration: 'none',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '20px' }}>📉</span>
              <span style={{
                fontSize: '11px',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '999px',
                backgroundColor: '#f1f5f9',
                color: '#475569'
              }}>
                0 Sales &gt;14d
              </span>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>
                {intelLoading ? '...' : (intelSummary?.deadStockCount || 0)}
              </div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#334155', marginTop: '2px' }}>
                Dead Stock Items
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                ₹{formatPrice(intelSummary?.deadStockValue || 0)} capital tied up
              </div>
            </div>
          </Link>

          {/* Card 5: Estimated Profit Opportunities */}
          <Link
            to="/intelligence?tab=profit"
            style={{
              textDecoration: 'none',
              backgroundColor: '#ffffff',
              border: '1px solid #bbf7d0',
              borderRadius: '14px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '20px' }}>💰</span>
              <span style={{
                fontSize: '11px',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '999px',
                backgroundColor: '#dcfce7',
                color: '#15803d'
              }}>
                Opportunity
              </span>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#15803d' }}>
                ₹{intelLoading ? '...' : formatPrice(intelSummary?.potentialProfitRecovery || 0)}
              </div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#334155', marginTop: '2px' }}>
                Profit Opportunities
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                Estimated leak recovery & dead stock
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Middle Section: Low Stock Alerts & 7-Day Chart */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(320px, 1fr) minmax(400px, 1.3fr)',
        gap: '24px',
        marginBottom: '28px'
      }}>
        {/* Low Stock Alerts */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: 'var(--card-shadow)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} color="#ef4444" />
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
                குறைந்த இருப்பு எச்சரிக்கை (Low Stock Alerts)
              </h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {data.lowStockAlerts && data.lowStockAlerts.length > 0 && (
                <button
                  onClick={handleSpeakAllAlerts}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    backgroundColor: speakingId === 'ALL' ? '#e11d48' : '#fef2f2',
                    color: speakingId === 'ALL' ? '#ffffff' : '#b91c1c',
                    border: '1px solid #fecaca',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                  title="Speak all alerts in Tamil"
                >
                  <Volume2 size={14} />
                  <span>{speakingId === 'ALL' ? 'பேசுகிறது...' : 'அனைத்தும் வாசி'}</span>
                </button>
              )}
              <Link to="/products" style={{ fontSize: '13px', fontWeight: '600', color: '#2563eb' }}>
                View All
              </Link>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
            {(!data.lowStockAlerts || data.lowStockAlerts.length === 0) ? (
              <div style={{
                textAlign: 'center',
                padding: '36px 12px',
                color: '#15803d',
                backgroundColor: '#f0fdf4',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                ✅ அனைத்து பொருட்களும் போதுமான அளவில் உள்ளன! (All stock healthy)
              </div>
            ) : (
              data.lowStockAlerts.slice(0, 5).map((item) => {
                const tamilName = item.nameTamil || (item.name ? item.name.split('(')[0].trim() : 'பொருள்');
                const alertNotification = `⚠️ ${tamilName} stock குறைவாக உள்ளது. மீதம் ${item.currentStock} ${item.unit || 'kg'} மட்டுமே உள்ளது.`;

                return (
                  <div
                    key={item._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      backgroundColor: '#fff1f2',
                      border: '1px solid #fecdd3',
                      gap: '12px'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      {/* Authentic Tamil notification required by prompt */}
                      <div style={{ fontWeight: '700', fontSize: '13px', color: '#9f1239', lineHeight: '1.4' }}>
                        {alertNotification}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                        {item.nameEnglish || item.name} • குறைந்தபட்ச அளவு: {item.minimumStock} {item.unit || 'kg'}
                      </div>
                    </div>

                    <button
                      onClick={() => handleSpeakAlert(item)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        backgroundColor: speakingId === item._id ? '#e11d48' : '#ffffff',
                        color: speakingId === item._id ? '#ffffff' : '#be123c',
                        border: '1px solid #fda4af',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        flexShrink: 0
                      }}
                      title="Speak Tamil Alert"
                    >
                      <Volume2 size={13} />
                      <span>{speakingId === item._id ? 'Speaking...' : '📢 குரல்'}</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Sales Overview (Last 7 Days) */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: 'var(--card-shadow)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
              Sales Overview (Last 7 Days)
            </h3>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Weekly Trend</span>
          </div>

          <div style={{ width: '100%', height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.salesOverview || []} barSize={26}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickFormatter={(val) => (val >= 1000 ? `${val / 1000}k` : val)}
                />
                <Tooltip
                  formatter={(value) => [`₹ ${value}`, 'Sales']}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '12px'
                  }}
                />
                <Bar
                  dataKey="sales"
                  fill="#2563eb"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Transactions */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid #e2e8f0',
        boxShadow: 'var(--card-shadow)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
            Recent Transactions
          </h3>
          <Link to="/sales" style={{ fontSize: '13px', fontWeight: '600', color: '#2563eb' }}>
            View All
          </Link>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f1f5f9', color: '#64748b', fontSize: '12px', fontWeight: '600' }}>
                <th style={{ padding: '12px 16px' }}>Product</th>
                <th style={{ padding: '12px 16px' }}>Type</th>
                <th style={{ padding: '12px 16px' }}>Quantity</th>
                <th style={{ padding: '12px 16px' }}>Price</th>
                <th style={{ padding: '12px 16px' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {data.recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                    No recent transactions found
                  </td>
                </tr>
              ) : (
                data.recentTransactions.map((tx, idx) => (
                  <tr
                    key={tx._id || idx}
                    style={{
                      borderBottom: '1px solid #f8fafc',
                      transition: 'background-color 0.1s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '14px 16px', fontWeight: '600', color: '#1e293b' }}>
                      {tx.product}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '9999px',
                        fontSize: '11px',
                        fontWeight: '700',
                        backgroundColor: tx.type === 'Sale' ? '#dcfce7' : '#dbeafe',
                        color: tx.type === 'Sale' ? '#16a34a' : '#2563eb'
                      }}>
                        {tx.type}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#475569' }}>
                      {tx.quantity}
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: '600', color: '#0f172a' }}>
                      ₹{tx.price}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '13px' }}>
                      {formatTxDate(tx.date)}
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
