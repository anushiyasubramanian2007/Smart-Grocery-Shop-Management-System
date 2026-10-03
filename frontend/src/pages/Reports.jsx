import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  ShoppingBag,
  Receipt,
  DollarSign,
  Calendar,
  Filter
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { reportAPI } from '../services/api';

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Reports() {
  const [period, setPeriod] = useState('daily');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [reportData, setReportData] = useState({
    totalSales: 5250,
    totalPurchases: 3000,
    totalExpenses: 500,
    netProfit: 1250,
    salesVsPurchaseChart: [
      { day: 'Mon', sales: 4000, purchases: 2500 },
      { day: 'Tue', sales: 3000, purchases: 3200 },
      { day: 'Wed', sales: 5000, purchases: 2000 },
      { day: 'Thu', sales: 4500, purchases: 2800 },
      { day: 'Fri', sales: 6000, purchases: 4000 },
      { day: 'Sat', sales: 7000, purchases: 3500 },
      { day: 'Sun', sales: 5250, purchases: 3000 },
    ],
    topSellingProducts: [
      { name: 'Dhal', percentage: 35, color: '#3b82f6' },
      { name: 'Rice', percentage: 25, color: '#10b981' },
      { name: 'Sugar', percentage: 15, color: '#f59e0b' },
      { name: 'Oil', percentage: 10, color: '#ef4444' },
      { name: 'Others', percentage: 15, color: '#8b5cf6' }
    ]
  });

  const fetchReports = async () => {
    try {
      const res = await reportAPI.getReports(period, date);
      if (res.data && res.data.data) {
        setReportData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [period, date]);

  const formatPrice = (val) => Number(val || 0).toLocaleString('en-IN');

  return (
    <div className="page-container">
      {/* Top Filter Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>
          Reports
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Period Dropdown */}
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              fontSize: '13px',
              fontWeight: '600',
              color: '#334155',
              cursor: 'pointer'
            }}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>

          {/* Date Picker */}
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              fontSize: '13px',
              color: '#334155'
            }}
          />
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px',
        marginBottom: '28px'
      }}>
        {/* Total Sales */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid #e2e8f0',
          boxShadow: 'var(--card-shadow)',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            backgroundColor: '#dcfce7',
            color: '#16a34a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <DollarSign size={22} />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Total Sales</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>
              ₹ {formatPrice(reportData.totalSales)}
            </div>
          </div>
        </div>

        {/* Total Purchases */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid #e2e8f0',
          boxShadow: 'var(--card-shadow)',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            backgroundColor: '#dbeafe',
            color: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShoppingBag size={22} />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Total Purchase</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>
              ₹ {formatPrice(reportData.totalPurchases)}
            </div>
          </div>
        </div>

        {/* Total Expenses */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid #e2e8f0',
          boxShadow: 'var(--card-shadow)',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            backgroundColor: '#ffedd5',
            color: '#ea580c',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Receipt size={22} />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Total Expenses</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>
              ₹ {formatPrice(reportData.totalExpenses)}
            </div>
          </div>
        </div>

        {/* Net Profit */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid #e2e8f0',
          boxShadow: 'var(--card-shadow)',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            backgroundColor: '#f3e8ff',
            color: '#9333ea',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <TrendingUp size={22} />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Net Profit</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>
              ₹ {formatPrice(reportData.netProfit)}
            </div>
          </div>
        </div>
      </div>

      {/* 2 Charts Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(350px, 1.4fr) minmax(320px, 1fr)',
        gap: '24px'
      }}>
        {/* Sales vs Purchase Bar Chart */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: 'var(--card-shadow)'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '18px' }}>
            Sales vs Purchase
          </h3>

          <div style={{ width: '100%', height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.salesVsPurchaseChart || []} barGap={6}>
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
                  formatter={(val, name) => [`₹ ${val}`, name === 'sales' ? 'Sales' : 'Purchase']}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '12px'
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="center"
                  wrapperStyle={{ paddingBottom: '16px', fontSize: '12px' }}
                />
                <Bar dataKey="sales" name="Sales" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="purchases" name="Purchase" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Selling Products Pie Chart */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: 'var(--card-shadow)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '18px' }}>
            Top Selling Products
          </h3>

          <div style={{ width: '100%', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={reportData.topSellingProducts || []}
                  dataKey="percentage"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {(reportData.topSellingProducts || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val, name) => [`${val}%`, name]}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend Items */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            marginTop: '16px',
            borderTop: '1px solid #f1f5f9',
            paddingTop: '14px'
          }}>
            {(reportData.topSellingProducts || []).map((item, idx) => (
              <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: item.color || PIE_COLORS[idx % PIE_COLORS.length]
                  }} />
                  <span style={{ color: '#334155' }}>{item.name}</span>
                </div>
                <span style={{ fontWeight: '600', color: '#0f172a' }}>{item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
