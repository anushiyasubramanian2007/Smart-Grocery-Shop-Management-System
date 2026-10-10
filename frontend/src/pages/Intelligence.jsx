import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  TrendingUp,
  ShoppingBag,
  Clock,
  AlertTriangle,
  TrendingDown,
  DollarSign,
  ArrowRight,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sliders,
  HelpCircle,
  Layers,
  ChevronRight,
  ShieldCheck,
  Zap,
  Tag,
  PackageCheck,
  PieChart
} from 'lucide-react';
import { intelligenceAPI, productAPI } from '../services/api';

export default function Intelligence() {
  const navigate = useNavigate();

  // Active sub-module tab: 'reorder' | 'expiry' | 'profit' | 'whatif'
  const [activeTab, setActiveTab] = useState('reorder');

  // Loading & error states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Top summary cards data
  const [summaryData, setSummaryData] = useState(null);

  // Tab 1: Reorder recommendations data
  const [reorderRecommendations, setReorderRecommendations] = useState([]);
  const [reorderSummary, setReorderSummary] = useState(null);
  const [reorderFilter, setReorderFilter] = useState('ALL'); // 'ALL' | 'REORDER_NOW' | 'REORDER_SOON' | 'NO_REORDER_REQUIRED'
  const [reorderSearch, setReorderSearch] = useState('');

  // Tab 2: Expiry & FEFO data
  const [expiryBatches, setExpiryBatches] = useState([]);
  const [expirySummary, setExpirySummary] = useState(null);
  const [expiryFilter, setExpiryFilter] = useState('ALL'); // 'ALL' | 'EXPIRED' | 'URGENT' | 'EXPIRING_SOON' | 'SAFE'
  const [expirySearch, setExpirySearch] = useState('');

  // Tab 3: Dead stock & profit leaks data
  const [deadStockItems, setDeadStockItems] = useState([]);
  const [profitLeaks, setProfitLeaks] = useState([]);
  const [deadStockSummary, setDeadStockSummary] = useState(null);
  const [deadStockFilter, setDeadStockFilter] = useState('ALL'); // 'ALL' | 'DEAD_STOCK' | 'SLOW_MOVING' | 'ACTIVE'
  const [deadStockSearch, setDeadStockSearch] = useState('');

  // Tab 4: What-If Business Simulator state
  const [allProducts, setAllProducts] = useState([]);
  const [simSelectedProdId, setSimSelectedProdId] = useState('');
  const [simPrice, setSimPrice] = useState('');
  const [simDiscount, setSimDiscount] = useState(0);
  const [simPurchaseCost, setSimPurchaseCost] = useState('');
  const [simPurchaseQty, setSimPurchaseQty] = useState('');
  const [simResult, setSimResult] = useState(null);
  const [simLoading, setSimLoading] = useState(false);

  // Fetch all initial data
  const loadAllIntelligence = async () => {
    try {
      setRefreshing(true);
      setErrorMsg('');

      const [sumRes, reoRes, expRes, prfRes, prodRes] = await Promise.all([
        intelligenceAPI.getSummary(),
        intelligenceAPI.getReorderRecommendations(),
        intelligenceAPI.getExpiryAlerts(),
        intelligenceAPI.getProfitAnalysis(),
        productAPI.getProducts()
      ]);

      if (sumRes.data?.data) setSummaryData(sumRes.data.data);
      if (reoRes.data?.data) {
        setReorderRecommendations(reoRes.data.data.recommendations || []);
        setReorderSummary(reoRes.data.data.summary);
      }
      if (expRes.data?.data) {
        setExpiryBatches(expRes.data.data.batches || []);
        setExpirySummary(expRes.data.data.summary);
      }
      if (prfRes.data?.data) {
        setDeadStockItems(prfRes.data.data.deadStockItems || []);
        setProfitLeaks(prfRes.data.data.profitLeaks || []);
        setDeadStockSummary(prfRes.data.data.summary);
      }
      if (prodRes.data?.data) {
        const prods = prodRes.data.data || [];
        setAllProducts(prods);
        if (prods.length > 0 && !simSelectedProdId) {
          const first = prods[0];
          setSimSelectedProdId(first._id);
          setSimPrice(first.sellingPrice || 0);
          setSimPurchaseCost(first.averageCost || 0);
        }
      }
    } catch (err) {
      console.error('Failed to load intelligence data:', err);
      setErrorMsg('Failed to fetch intelligence reports. ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllIntelligence();
  }, []);

  // When changing selected product in What-If simulator, update base inputs
  const handleSimProductChange = (prodId) => {
    setSimSelectedProdId(prodId);
    setSimResult(null);
    const prod = allProducts.find(p => String(p._id) === String(prodId));
    if (prod) {
      setSimPrice(prod.sellingPrice || 0);
      setSimPurchaseCost(prod.averageCost || 0);
      setSimDiscount(0);
      setSimPurchaseQty('');
    }
  };

  // Run What-If simulation
  const handleRunSimulation = async (e) => {
    if (e) e.preventDefault();
    if (!simSelectedProdId) return;

    try {
      setSimLoading(true);
      const res = await intelligenceAPI.simulateWhatIf({
        productId: simSelectedProdId,
        newSellingPrice: simPrice !== '' ? Number(simPrice) : undefined,
        discountPercentage: Number(simDiscount) || 0,
        newPurchaseCost: simPurchaseCost !== '' ? Number(simPurchaseCost) : undefined,
        purchaseQuantity: simPurchaseQty !== '' ? Number(simPurchaseQty) : undefined
      });
      if (res.data?.data) {
        setSimResult(res.data.data);
      }
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setSimLoading(false);
    }
  };

  // One-click Reorder Action: navigate to Purchases page with pre-filled state
  const handleExecuteReorder = (item) => {
    const query = new URLSearchParams({
      productId: item.productId,
      quantity: item.recommendedOrderQuantity,
      purchasePricePerUnit: item.estimatedUnitCost,
      supplier: item.supplier || 'Local Wholesale Mandi'
    }).toString();
    navigate(`/purchases?${query}`);
  };

  // Format INR currency
  const formatINR = (val) => Number(val || 0).toLocaleString('en-IN');

  // Filtered lists
  const filteredReorder = reorderRecommendations.filter(r => {
    const matchesFilter = reorderFilter === 'ALL' || r.status === reorderFilter;
    const matchesSearch = !reorderSearch ||
      (r.productName && r.productName.toLowerCase().includes(reorderSearch.toLowerCase())) ||
      (r.nameEnglish && r.nameEnglish.toLowerCase().includes(reorderSearch.toLowerCase())) ||
      (r.nameTamil && r.nameTamil.includes(reorderSearch));
    return matchesFilter && matchesSearch;
  });

  const filteredExpiry = expiryBatches.filter(b => {
    const matchesFilter = expiryFilter === 'ALL' || b.status === expiryFilter;
    const matchesSearch = !expirySearch ||
      (b.productName && b.productName.toLowerCase().includes(expirySearch.toLowerCase())) ||
      (b.nameEnglish && b.nameEnglish.toLowerCase().includes(expirySearch.toLowerCase())) ||
      (b.batchNumber && b.batchNumber.toLowerCase().includes(expirySearch.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const filteredDeadStock = deadStockItems.filter(d => {
    const matchesFilter = deadStockFilter === 'ALL' || d.status === deadStockFilter;
    const matchesSearch = !deadStockSearch ||
      (d.productName && d.productName.toLowerCase().includes(deadStockSearch.toLowerCase())) ||
      (d.nameEnglish && d.nameEnglish.toLowerCase().includes(deadStockSearch.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="page-container" style={{ maxWidth: '1280px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Page Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '6px',
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              fontSize: '11px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              <Sparkles size={13} />
              AI Decision Support System
            </span>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>
            Smart Grocery Intelligence
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b' }}>
            Smart reordering, FEFO expiry intelligence, dead stock audits & what-if business simulation
          </p>
        </div>

        <button
          onClick={loadAllIntelligence}
          disabled={refreshing}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: '600',
            color: '#1e293b',
            cursor: refreshing ? 'not-allowed' : 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}
        >
          <RefreshCw size={15} className={refreshing ? 'spin' : ''} />
          <span>{refreshing ? 'Recalculating...' : 'Refresh Intelligence'}</span>
        </button>
      </div>

      {errorMsg && (
        <div style={{
          padding: '14px 18px',
          borderRadius: '10px',
          backgroundColor: '#fee2e2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          fontSize: '13px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 4 Top Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px',
        marginBottom: '28px'
      }}>

        {/* Card 2: Reorder Needed */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          padding: '18px 20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
              Products to Reorder
            </span>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: '#fff7ed',
              color: '#ea580c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShoppingBag size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#ea580c', marginBottom: '4px' }}>
            {summaryData?.cards.reorderNeeded.count || 0}
          </div>
          <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
            Urgent wholesale restock recommended
          </p>
        </div>

        {/* Card 3: Expiring Soon */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          padding: '18px 20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
              Expiring Soon
            </span>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: '#fef2f2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Clock size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#dc2626', marginBottom: '4px' }}>
            {summaryData?.cards.expiringSoon.count || 0}
          </div>
          <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
            Batches requiring FEFO priority rotation
          </p>
        </div>

        {/* Card 4: Dead Stock Items */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          padding: '18px 20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
              Dead Stock Items
            </span>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: '#f5f3ff',
              color: '#7c3aed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <TrendingDown size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#7c3aed', marginBottom: '4px' }}>
            {summaryData?.cards.deadStock.count || 0}
          </div>
          <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
            {summaryData?.cards.deadStock.badgeText || 'Trapped capital'}
          </p>
        </div>

        {/* Card 5: Profit Opportunities */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          padding: '18px 20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
              Profit Leak Opportunities
            </span>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: '#f0fdf4',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <DollarSign size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#16a34a', marginBottom: '4px' }}>
            ₹{formatINR(summaryData?.preview?.totalIdentifiedLeakImpact || 0)}
          </div>
          <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
            Estimated recoverable margin opportunities
          </p>
        </div>
      </div>

      {/* Main Tab Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        borderBottom: '1px solid #e2e8f0',
        marginBottom: '24px',
        overflowX: 'auto',
        paddingBottom: '4px'
      }}>
        {[
          { key: 'reorder', label: '1. Smart Reorder', icon: ShoppingBag, count: reorderSummary?.reorderNowCount },
          { key: 'expiry', label: '2. Expiry & FEFO', icon: Clock, count: expirySummary?.urgentCount },
          { key: 'profit', label: '3. Dead Stock & Leaks', icon: TrendingDown, count: deadStockSummary?.deadStockCount },
          { key: 'whatif', label: '4. What-If Simulator', icon: Sliders }
        ].map(tab => {
          const isActive = activeTab === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 18px',
                border: 'none',
                borderBottom: isActive ? '3px solid #2563eb' : '3px solid transparent',
                backgroundColor: 'transparent',
                color: isActive ? '#2563eb' : '#64748b',
                fontWeight: isActive ? '700' : '600',
                fontSize: '14px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span style={{
                  padding: '1px 6px',
                  borderRadius: '10px',
                  backgroundColor: isActive ? '#dbeafe' : '#f1f5f9',
                  color: isActive ? '#1d4ed8' : '#475569',
                  fontSize: '11px',
                  fontWeight: '700'
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: SMART REORDER RECOMMENDATION */}
      {activeTab === 'reorder' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          {/* Formula Callout Banner */}
          <div style={{
            backgroundColor: '#fff7ed',
            border: '1px solid #ffedd5',
            borderRadius: '10px',
            padding: '14px 18px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShoppingBag size={20} color="#ea580c" />
              <div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#9a3412' }}>
                  Replenishment Formula: Recommended Order = max(0, Predicted Demand + Safety Stock - Current Stock)
                </div>
                <div style={{ fontSize: '12px', color: '#c2410c' }}>
                  Decision Support Only: Review and adjust quantities before placing purchase orders with suppliers.
                </div>
              </div>
            </div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#9a3412' }}>
              Est. Reorder Cost: ₹{formatINR(reorderSummary?.estimatedTotalReorderCost || 0)}
            </div>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#0f172a' }}>
              Inventory Reorder Queue
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                <input
                  type="text"
                  placeholder="Search product..."
                  value={reorderSearch}
                  onChange={(e) => setReorderSearch(e.target.value)}
                  style={{
                    padding: '8px 12px 8px 30px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                    width: '200px'
                  }}
                />
              </div>

              <select
                value={reorderFilter}
                onChange={(e) => setReorderFilter(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#1e293b',
                  backgroundColor: '#ffffff'
                }}
              >
                <option value="ALL">All Products ({reorderRecommendations.length})</option>
                <option value="REORDER_NOW">Reorder Now ({reorderSummary?.reorderNowCount || 0})</option>
                <option value="REORDER_SOON">Reorder Soon ({reorderSummary?.reorderSoonCount || 0})</option>
                <option value="NO_REORDER_REQUIRED">Sufficient Stock ({reorderSummary?.noReorderCount || 0})</option>
              </select>
            </div>
          </div>

          {/* Reorders Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: '700' }}>
                  <th style={{ padding: '12px 16px' }}>Product</th>
                  <th style={{ padding: '12px 16px' }}>Stock</th>
                  <th style={{ padding: '12px 16px' }}>Predicted (7d)</th>
                  <th style={{ padding: '12px 16px' }}>Safety Stock</th>
                  <th style={{ padding: '12px 16px' }}>Recommended Order</th>
                  <th style={{ padding: '12px 16px' }}>Est. Cost</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Owner Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredReorder.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                      No products match the selected criteria.
                    </td>
                  </tr>
                ) : (
                  filteredReorder.map(item => {
                    let badgeColor = '#16a34a';
                    let badgeBg = '#dcfce7';
                    let badgeText = 'NO REORDER REQUIRED';

                    if (item.status === 'REORDER_NOW') {
                      badgeColor = '#dc2626';
                      badgeBg = '#fee2e2';
                      badgeText = 'REORDER NOW';
                    } else if (item.status === 'REORDER_SOON') {
                      badgeColor = '#ea580c';
                      badgeBg = '#ffedd5';
                      badgeText = 'REORDER SOON';
                    }

                    return (
                      <tr key={item.productId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: '700', color: '#0f172a' }}>
                            {item.nameTamil ? `${item.nameTamil} (${item.nameEnglish || item.productName})` : item.productName}
                          </div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>Supplier: {item.supplier}</div>
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: '600' }}>
                          {item.currentStock} {item.unit}
                        </td>
                        <td style={{ padding: '14px 16px', color: '#475569' }}>
                          {item.predictedDemand} {item.unit}
                        </td>
                        <td style={{ padding: '14px 16px', color: '#64748b' }}>
                          {item.safetyStock} {item.unit}
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: '800', color: item.recommendedOrderQuantity > 0 ? '#ea580c' : '#1e293b' }}>
                          {item.recommendedOrderQuantity > 0 ? `${item.recommendedOrderQuantity} ${item.unit}` : '0'}
                        </td>
                        <td style={{ padding: '14px 16px', color: '#475569' }}>
                          ₹{formatINR(item.estimatedPurchaseCost)}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '700',
                            backgroundColor: badgeBg,
                            color: badgeColor
                          }}>
                            {badgeText}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          {item.recommendedOrderQuantity > 0 ? (
                            <button
                              onClick={() => handleExecuteReorder(item)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 12px',
                                backgroundColor: '#2563eb',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: 'pointer'
                              }}
                            >
                              <span>Review & Purchase</span>
                              <ArrowRight size={13} />
                            </button>
                          ) : (
                            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Optimal</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: EXPIRY & BATCH INTELLIGENCE (FEFO) */}
      {activeTab === 'expiry' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          {/* FEFO Banner */}
          <div style={{
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '10px',
            padding: '14px 18px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Clock size={20} color="#2563eb" />
              <div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e40af' }}>
                  FEFO Rule Active: First Expire, First Out
                </div>
                <div style={{ fontSize: '12px', color: '#1d4ed8' }}>
                  Earliest expiring batches are sorted first to ensure older inventory is rotated before newer stock.
                </div>
              </div>
            </div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#1e40af' }}>
              Total Batches Monitored: {expiryBatches.length}
            </div>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#0f172a' }}>
              Batch Expiry Schedule & Action Matrix
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                <input
                  type="text"
                  placeholder="Search batch or product..."
                  value={expirySearch}
                  onChange={(e) => setExpirySearch(e.target.value)}
                  style={{
                    padding: '8px 12px 8px 30px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                    width: '210px'
                  }}
                />
              </div>

              <select
                value={expiryFilter}
                onChange={(e) => setExpiryFilter(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#1e293b',
                  backgroundColor: '#ffffff'
                }}
              >
                <option value="ALL">All Batches ({expiryBatches.length})</option>
                <option value="EXPIRED">Expired ({expirySummary?.expiredCount || 0})</option>
                <option value="URGENT">Urgent (≤7 days) ({expirySummary?.urgentCount || 0})</option>
                <option value="EXPIRING_SOON">Expiring Soon (≤30 days) ({expirySummary?.expiringSoonCount || 0})</option>
                <option value="SAFE">Safe ({expirySummary?.safeCount || 0})</option>
              </select>
            </div>
          </div>

          {/* Batches Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: '700' }}>
                  <th style={{ padding: '12px 16px' }}>Batch #</th>
                  <th style={{ padding: '12px 16px' }}>Product</th>
                  <th style={{ padding: '12px 16px' }}>Batch Qty</th>
                  <th style={{ padding: '12px 16px' }}>Expiry Date</th>
                  <th style={{ padding: '12px 16px' }}>Remaining</th>
                  <th style={{ padding: '12px 16px' }}>Expiry Status</th>
                  <th style={{ padding: '12px 16px' }}>FEFO Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpiry.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                      No batches match the selected criteria.
                    </td>
                  </tr>
                ) : (
                  filteredExpiry.map((b, idx) => {
                    let badgeBg = '#dcfce7';
                    let badgeColor = '#16a34a';
                    let badgeLabel = 'SAFE';

                    if (b.status === 'EXPIRED') {
                      badgeBg = '#fee2e2';
                      badgeColor = '#dc2626';
                      badgeLabel = 'EXPIRED';
                    } else if (b.status === 'URGENT') {
                      badgeBg = '#fef2f2';
                      badgeColor = '#b91c1c';
                      badgeLabel = 'URGENT (≤7d)';
                    } else if (b.status === 'EXPIRING_SOON') {
                      badgeBg = '#fef3c7';
                      badgeColor = '#d97706';
                      badgeLabel = 'EXPIRING SOON';
                    }

                    return (
                      <tr key={b.batchId || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontWeight: '700', color: '#334155' }}>
                          {b.batchNumber}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: '700', color: '#0f172a' }}>
                            {b.nameTamil ? `${b.nameTamil} (${b.nameEnglish || b.productName})` : b.productName}
                          </div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>{b.category}</div>
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: '600' }}>
                          {b.quantity} {b.unit}
                        </td>
                        <td style={{ padding: '14px 16px', color: '#475569' }}>
                          {b.expiryDateFormatted}
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: '700', color: b.daysRemaining <= 7 ? '#dc2626' : '#1e293b' }}>
                          {b.daysRemaining < 0 ? `${Math.abs(b.daysRemaining)}d ago` : `${b.daysRemaining} days`}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '700',
                            backgroundColor: badgeBg,
                            color: badgeColor
                          }}>
                            {badgeLabel}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '12px', color: '#334155', maxWidth: '380px' }}>
                          {b.recommendation}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: PROFIT LEAK & DEAD STOCK DETECTION */}
      {activeTab === 'profit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Section A: Profit Leak Audit Cards */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ marginBottom: '18px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#0f172a' }}>
                Profit Leak Audit & Margin Protection
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b' }}>
                Identifies operations, stagnant stock, excessive discounts, and expense overheads that reduce net margins.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {profitLeaks.map((leak, idx) => (
                <div key={idx} style={{
                  padding: '18px',
                  borderRadius: '12px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
                        {leak.category}
                      </span>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '700',
                        backgroundColor: leak.severity === 'HIGH' ? '#fee2e2' : '#fef3c7',
                        color: leak.severity === 'HIGH' ? '#dc2626' : '#d97706'
                      }}>
                        {leak.severity} IMPACT
                      </span>
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
                      ₹{formatINR(leak.estimatedImpact)}
                    </div>
                    <p style={{ fontSize: '12px', color: '#475569', marginBottom: '12px', lineHeight: '1.5' }}>
                      {leak.description}
                    </p>
                  </div>

                  <div style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    fontSize: '12px',
                    color: '#0f172a',
                    fontWeight: '600'
                  }}>
                    💡 {leak.actionableAdvice}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section B: Dead Stock Inventory Table */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#0f172a' }}>
                  Dead Stock & Slow Moving Inventory
                </h3>
                <p style={{ fontSize: '13px', color: '#64748b' }}>
                  Total Tied-Up Capital: ₹{formatINR(deadStockSummary?.totalTiedUpCapital || 0)} across stagnant items
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                  <input
                    type="text"
                    placeholder="Search product..."
                    value={deadStockSearch}
                    onChange={(e) => setDeadStockSearch(e.target.value)}
                    style={{
                      padding: '8px 12px 8px 30px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      outline: 'none',
                      width: '200px'
                    }}
                  />
                </div>

                <select
                  value={deadStockFilter}
                  onChange={(e) => setDeadStockFilter(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#1e293b',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <option value="ALL">All Inventory ({deadStockItems.length})</option>
                  <option value="DEAD_STOCK">Dead Stock (&gt;21d) ({deadStockSummary?.deadStockCount || 0})</option>
                  <option value="SLOW_MOVING">Slow Moving ({deadStockSummary?.slowMovingCount || 0})</option>
                  <option value="ACTIVE">Active Turnover ({deadStockSummary?.activeCount || 0})</option>
                </select>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: '700' }}>
                    <th style={{ padding: '12px 16px' }}>Product</th>
                    <th style={{ padding: '12px 16px' }}>Stock</th>
                    <th style={{ padding: '12px 16px' }}>Sold (30d)</th>
                    <th style={{ padding: '12px 16px' }}>Days Without Sale</th>
                    <th style={{ padding: '12px 16px' }}>Tied-up Capital</th>
                    <th style={{ padding: '12px 16px' }}>Status</th>
                    <th style={{ padding: '12px 16px' }}>Liquidation Recommendation</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDeadStock.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                        No products match the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredDeadStock.map(item => {
                      let badgeBg = '#dcfce7';
                      let badgeColor = '#16a34a';
                      let badgeLabel = 'ACTIVE';

                      if (item.status === 'DEAD_STOCK') {
                        badgeBg = '#fee2e2';
                        badgeColor = '#dc2626';
                        badgeLabel = 'DEAD STOCK';
                      } else if (item.status === 'SLOW_MOVING') {
                        badgeBg = '#fef3c7';
                        badgeColor = '#d97706';
                        badgeLabel = 'SLOW MOVING';
                      }

                      return (
                        <tr key={item.productId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ fontWeight: '700', color: '#0f172a' }}>
                              {item.nameTamil ? `${item.nameTamil} (${item.nameEnglish || item.productName})` : item.productName}
                            </div>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{item.category}</div>
                          </td>
                          <td style={{ padding: '14px 16px', fontWeight: '600' }}>
                            {item.currentStock} {item.unit}
                          </td>
                          <td style={{ padding: '14px 16px', color: '#475569' }}>
                            {item.soldInLast30Days} {item.unit}
                          </td>
                          <td style={{ padding: '14px 16px', fontWeight: '700', color: item.daysWithoutSale >= 21 ? '#dc2626' : '#1e293b' }}>
                            {item.daysWithoutSale} days
                          </td>
                          <td style={{ padding: '14px 16px', fontWeight: '700', color: '#0f172a' }}>
                            ₹{formatINR(item.tiedUpCapital)}
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: '700',
                              backgroundColor: badgeBg,
                              color: badgeColor
                            }}>
                              {badgeLabel}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: '12px', color: '#475569', maxWidth: '340px' }}>
                            {item.recommendations[0]}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: WHAT-IF BUSINESS SIMULATOR */}
      {activeTab === 'whatif' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          {/* Header */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>
              What-If Decision Simulator
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b' }}>
              Simulate price alterations, promotional discounts, and wholesale purchasing scenarios without modifying real database data.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px' }}>
            {/* Input Form Column */}
            <form onSubmit={handleRunSimulation} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Product Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Select Product to Simulate *
                </label>
                <select
                  value={simSelectedProdId}
                  onChange={(e) => handleSimProductChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#0f172a',
                    backgroundColor: '#ffffff'
                  }}
                  required
                >
                  {allProducts.map(p => (
                    <option key={p._id} value={p._id}>
                      {p.nameTamil ? `${p.nameTamil} (${p.nameEnglish || p.name})` : p.name} — Current: ₹{p.sellingPrice}/{p.unit || 'kg'} (Cost: ₹{p.averageCost})
                    </option>
                  ))}
                </select>
              </div>

              {/* Proposed Selling Price */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    New Selling Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    value={simPrice}
                    onChange={(e) => setSimPrice(e.target.value)}
                    placeholder="e.g. 155"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#0f172a'
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Discount Percentage (%)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="50"
                    value={simDiscount}
                    onChange={(e) => setSimDiscount(e.target.value)}
                    placeholder="0"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#0f172a'
                    }}
                  />
                </div>
              </div>

              {/* Wholesale Purchasing Scenarios */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    New Purchase Cost (₹/unit)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={simPurchaseCost}
                    onChange={(e) => setSimPurchaseCost(e.target.value)}
                    placeholder="Wholesale cost"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#0f172a'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Proposed Restock Qty
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={simPurchaseQty}
                    onChange={(e) => setSimPurchaseQty(e.target.value)}
                    placeholder="e.g. 50"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#0f172a'
                    }}
                  />
                </div>
              </div>

              {/* Simulate Button */}
              <button
                type="submit"
                disabled={simLoading}
                style={{
                  padding: '12px 20px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
                }}
              >
                <Zap size={16} />
                <span>{simLoading ? 'Simulating Model...' : 'Calculate Decision Impact'}</span>
              </button>

              <div style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center' }}>
                🔒 Read-Only Simulation. Real product prices and stock are NOT modified.
              </div>
            </form>

            {/* Results Column */}
            <div style={{
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              {!simResult ? (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: '#94a3b8' }}>
                  <Sliders size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                  <p style={{ fontSize: '14px', fontWeight: '600' }}>Ready for Simulation</p>
                  <p style={{ fontSize: '12px' }}>Adjust price or discount on the left and click "Calculate Decision Impact".</p>
                </div>
              ) : !simResult.hasSufficientData ? (
                <div style={{
                  padding: '20px',
                  borderRadius: '10px',
                  backgroundColor: '#fef3c7',
                  border: '1px solid #fde68a',
                  color: '#92400e'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', marginBottom: '6px' }}>
                    <AlertTriangle size={18} />
                    <span>Insufficient Historical Data</span>
                  </div>
                  <p style={{ fontSize: '13px', lineHeight: '1.5', margin: 0 }}>
                    {simResult.explanation || 'Minimum 2 historical sales required to compute baseline elasticity for accurate simulation.'}
                  </p>
                </div>
              ) : (
                <div>
                  {/* Verdict Banner */}
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    backgroundColor: simResult.impact.verdict === 'POSITIVE' ? '#dcfce7' : (simResult.impact.verdict === 'NEGATIVE' ? '#fee2e2' : '#f1f5f9'),
                    color: simResult.impact.verdict === 'POSITIVE' ? '#16a34a' : (simResult.impact.verdict === 'NEGATIVE' ? '#dc2626' : '#475569'),
                    fontWeight: '700',
                    fontSize: '13px',
                    marginBottom: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    {simResult.impact.verdict === 'POSITIVE' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                    <span>{simResult.impact.summaryText}</span>
                  </div>

                  {/* Comparison Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
                    <div style={{ padding: '12px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>Current Baseline</div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>
                        ₹{formatINR(simResult.baseline.revenue)} Rev
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        Profit: ₹{formatINR(simResult.baseline.grossProfit)} ({simResult.baseline.profitMargin}%)
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                        Vol: ~{simResult.baseline.estimatedMonthlySales} {simResult.product.unit}/mo
                      </div>
                    </div>

                    <div style={{ padding: '12px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '11px', color: '#2563eb', textTransform: 'uppercase', fontWeight: '700' }}>Simulated Scenario</div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>
                        ₹{formatINR(simResult.simulation.revenue)} Rev
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        Profit: ₹{formatINR(simResult.simulation.grossProfit)} ({simResult.simulation.profitMargin}%)
                      </div>
                      <div style={{ fontSize: '11px', color: '#2563eb' }}>
                        Vol: ~{simResult.simulation.estimatedSalesQty} {simResult.product.unit}/mo
                      </div>
                    </div>
                  </div>

                  {/* Impact Summary Pill */}
                  <div style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    fontSize: '12px',
                    lineHeight: '1.6',
                    color: '#1e293b'
                  }}>
                    <div><strong>Net Profit Impact:</strong> <span style={{ color: simResult.impact.profitDelta >= 0 ? '#16a34a' : '#dc2626', fontWeight: '700' }}>{simResult.impact.profitDelta >= 0 ? '+' : ''}₹{formatINR(simResult.impact.profitDelta)}</span></div>
                    <div><strong>Revenue Delta:</strong> {simResult.impact.revenueDelta >= 0 ? '+' : ''}₹{formatINR(simResult.impact.revenueDelta)}</div>
                    <div><strong>Estimated Volume Delta:</strong> {simResult.impact.quantityDelta >= 0 ? '+' : ''}{simResult.impact.quantityDelta} {simResult.product.unit}</div>
                    <div style={{ marginTop: '6px', fontSize: '11px', color: '#94a3b8' }}>
                      Elasticity: {simResult.modelAssumptions.elasticityApplied} ({simResult.product.category})
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
