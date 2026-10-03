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
  VolumeX
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
import { reportAPI } from '../services/api';
import speechService from '../utils/speech';

export default function Dashboard() {
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
    fetchDashboard();
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
