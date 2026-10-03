import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  MoreVertical,
  Trash2,
  Edit2,
  AlertCircle,
  CheckCircle2,
  Search,
  Filter,
  RefreshCw,
  Package,
  Layers,
  Sparkles
} from 'lucide-react';
import { productAPI } from '../services/api';
import ProductModal, { TAMIL_NADU_CATEGORIES } from '../components/ProductModal';

export default function ProductsStock() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [stockFilter, setStockFilter] = useState('ALL'); // 'ALL', 'LOW', 'HEALTHY'
  const [resettingCatalog, setResettingCatalog] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await productAPI.getProducts();
      if (res.data && res.data.data) {
        setProducts(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSaveProduct = async (productData) => {
    if (editingProduct) {
      await productAPI.updateProduct(editingProduct._id, productData);
    } else {
      await productAPI.createProduct(productData);
    }
    setEditingProduct(null);
    await fetchProducts();
  };

  const handleEditClick = (p) => {
    setEditingProduct(p);
    setIsModalOpen(true);
    setActiveMenuId(null);
  };

  const handleDeleteProduct = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await productAPI.deleteProduct(id);
        setActiveMenuId(null);
        await fetchProducts();
      } catch (err) {
        alert(err.response?.data?.message || 'Error deleting product');
      }
    }
  };

  const handleReloadCatalog = async () => {
    if (window.confirm('Reload the complete authentic 15-category Tamil Nadu grocery catalog (~145 products)?')) {
      try {
        setResettingCatalog(true);
        await productAPI.seedCatalog();
        await fetchProducts();
        alert('Authentic Tamil Nadu grocery catalog loaded successfully!');
      } catch (err) {
        alert('Failed to reload catalog: ' + (err.response?.data?.message || err.message));
      } finally {
        setResettingCatalog(false);
      }
    }
  };

  const getProductEmoji = (category, name) => {
    const c = (category || '').toLowerCase();
    const n = (name || '').toLowerCase();
    if (c.includes('dal') || c.includes('பருப்பு')) return '🥣';
    if (c.includes('rice') || c.includes('அரிசி')) return '🍚';
    if (c.includes('millet') || c.includes('சிறுதானியம்')) return '🌾';
    if (c.includes('flour') || c.includes('மாவு')) return '🥟';
    if (c.includes('spice') || c.includes('மசாலா')) return '🌶️';
    if (c.includes('oil') || c.includes('எண்ணெய்')) return '🫒';
    if (c.includes('sugar') || c.includes('சர்க்கரை')) return '🍯';
    if (c.includes('salt') || c.includes('உப்பு')) return '🧂';
    if (c.includes('veg') || c.includes('காய்')) return '🥬';
    if (c.includes('fruit') || c.includes('பழ')) return '🍎';
    if (c.includes('tea') || c.includes('coffee') || c.includes('காபி')) return '☕';
    if (c.includes('snack') || c.includes('தின்பண்டம்')) return '🥨';
    if (c.includes('dairy') || c.includes('பால்')) return '🥛';
    if (c.includes('house') || c.includes('வீட்டு')) return '🧼';
    return '📦';
  };

  // Filtered Products by search (Tamil & English) and category
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        (p.nameTamil && p.nameTamil.toLowerCase().includes(q)) ||
        (p.nameEnglish && p.nameEnglish.toLowerCase().includes(q)) ||
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.supplier && p.supplier.toLowerCase().includes(q));

      const matchCategory = selectedCategory === 'ALL' || p.category === selectedCategory;

      const isLow = Number(p.currentStock) <= Number(p.minimumStock);
      const matchStock =
        stockFilter === 'ALL' ||
        (stockFilter === 'LOW' && isLow) ||
        (stockFilter === 'HEALTHY' && !isLow);

      return matchSearch && matchCategory && matchStock;
    });
  }, [products, searchQuery, selectedCategory, stockFilter]);

  const lowStockCount = useMemo(() => {
    return products.filter((p) => Number(p.currentStock) <= Number(p.minimumStock)).length;
  }, [products]);

  return (
    <div className="page-container">
      {/* Top Header & Action Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '20px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              பொருட்கள் / இருப்பு (Products & Stock)
            </h2>
            <span style={{
              backgroundColor: '#eff6ff',
              color: '#1d4ed8',
              padding: '2px 8px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '700'
            }}>
              {products.length} Items
            </span>
          </div>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            தமிழ்நாடு மளிகைக் கடை இருப்பு மேலாண்மை • இருமொழி ஆதரவு (Tamil & English Search)
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleReloadCatalog}
            disabled={resettingCatalog}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#f8fafc',
              border: '1px solid #cbd5e1',
              padding: '9px 14px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: '600',
              color: '#334155',
              cursor: 'pointer'
            }}
            title="Reload authentic Tamil Nadu 15-category grocery catalog"
          >
            <RefreshCw size={15} className={resettingCatalog ? 'animate-spin' : ''} />
            <span>{resettingCatalog ? 'Reloading...' : 'Reload Catalog'}</span>
          </button>

          <button
            onClick={() => {
              setEditingProduct(null);
              setIsModalOpen(true);
            }}
            className="btn-primary"
          >
            <Plus size={18} />
            <span>புதிய பொருள் சேர் (Add Product)</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '14px',
        padding: '16px 20px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
        marginBottom: '20px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '14px',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Bilingual Search input */}
        <div style={{
          position: 'relative',
          flex: '1 1 280px',
          minWidth: '240px'
        }}>
          <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Tamil or English (எ.கா: உளுந்து, Toor Dal, எண்ணெய்)..."
            style={{
              width: '100%',
              padding: '10px 14px 10px 38px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s',
              backgroundColor: '#f8fafc'
            }}
            onFocus={(e) => e.target.style.borderColor = '#2563eb'}
            onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
          />
        </div>

        {/* Category Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 260px' }}>
          <Filter size={16} color="#64748b" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              backgroundColor: '#f8fafc',
              color: '#1e293b',
              fontWeight: '500',
              outline: 'none'
            }}
          >
            <option value="ALL">அனைத்து பிரிவுகள் (All 15 Categories)</option>
            {TAMIL_NADU_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Stock Status Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => setStockFilter('ALL')}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: stockFilter === 'ALL' ? '1px solid #2563eb' : '1px solid #e2e8f0',
              backgroundColor: stockFilter === 'ALL' ? '#eff6ff' : '#ffffff',
              color: stockFilter === 'ALL' ? '#1d4ed8' : '#64748b',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            அனைத்தும் (All)
          </button>
          <button
            onClick={() => setStockFilter('LOW')}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: stockFilter === 'LOW' ? '1px solid #ef4444' : '1px solid #e2e8f0',
              backgroundColor: stockFilter === 'LOW' ? '#fef2f2' : '#ffffff',
              color: stockFilter === 'LOW' ? '#b91c1c' : '#64748b',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <AlertCircle size={14} color="#ef4444" />
            <span>குறைந்த இருப்பு ({lowStockCount})</span>
          </button>
        </div>
      </div>

      {/* Products Table Card */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
        overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{
                backgroundColor: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                color: '#475569',
                fontSize: '13px',
                fontWeight: '700'
              }}>
                <th style={{ padding: '16px 20px' }}>பொருள் (Product)</th>
                <th style={{ padding: '16px 20px' }}>பிரிவு (Category)</th>
                <th style={{ padding: '16px 20px' }}>இருப்பு (Stock)</th>
                <th style={{ padding: '16px 20px' }}>கொள்முதல் விலை (Avg Cost)</th>
                <th style={{ padding: '16px 20px' }}>விற்பனை விலை (Selling Price)</th>
                <th style={{ padding: '16px 20px' }}>நிலை (Status)</th>
                <th style={{ padding: '16px 20px', textAlign: 'right' }}>செயல் (Action)</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <RefreshCw size={20} className="animate-spin text-primary" />
                      <span>Loading products...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '48px 24px', textAlign: 'center', color: '#64748b' }}>
                    <Package size={36} color="#94a3b8" style={{ margin: '0 auto 12px auto' }} />
                    <p style={{ fontWeight: '600', color: '#334155' }}>பொருட்கள் எதுவும் கிடைக்கவில்லை (No matching products)</p>
                    <p style={{ fontSize: '13px' }}>Try adjusting your search query or category filter</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLow = Number(p.currentStock) <= Number(p.minimumStock);
                  const displayTamil = p.nameTamil || (p.name ? p.name.split('(')[0].trim() : 'பொருள்');
                  const displayEng = p.nameEnglish || (p.name && p.name.includes('(') ? p.name.match(/\((.*?)\)/)?.[1] : p.name);

                  return (
                    <tr
                      key={p._id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background-color 0.15s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {/* Bilingual Product Name & Icon */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '12px',
                            backgroundColor: isLow ? '#fef2f2' : '#f8fafc',
                            border: `1px solid ${isLow ? '#fecaca' : '#e2e8f0'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '22px',
                            flexShrink: 0
                          }}>
                            {getProductEmoji(p.category, p.name)}
                          </div>
                          <div>
                            {/* Tamil Name highlighted */}
                            <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '15px' }}>
                              {displayTamil}
                            </div>
                            {/* English Name */}
                            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                              {displayEng}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{
                          backgroundColor: '#f1f5f9',
                          color: '#475569',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '600',
                          whiteSpace: 'nowrap'
                        }}>
                          {p.category}
                        </span>
                      </td>

                      {/* Current Stock */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ fontWeight: '700', color: isLow ? '#dc2626' : '#1e293b' }}>
                          {p.currentStock} <span style={{ fontSize: '12px', fontWeight: '500', color: '#64748b' }}>{p.unit || 'kg'}</span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                          Min: {p.minimumStock} {p.unit || 'kg'}
                        </div>
                      </td>

                      {/* Average Purchase Cost */}
                      <td style={{ padding: '14px 20px', color: '#334155', fontWeight: '500' }}>
                        ₹{Number(p.averageCost || 0).toFixed(2)}
                      </td>

                      {/* Selling Price */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '15px' }}>
                          ₹{Number(p.sellingPrice || 0).toFixed(2)}
                        </div>
                        <div style={{ fontSize: '11px', color: '#16a34a' }}>
                          +{p.profitType === 'PERCENTAGE' ? `${p.profitValue}%` : `₹${p.profitValue}`}
                        </div>
                      </td>

                      {/* Stock Status Badge */}
                      <td style={{ padding: '14px 20px' }}>
                        {isLow ? (
                          <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{
                              backgroundColor: '#fee2e2',
                              color: '#b91c1c',
                              padding: '3px 10px',
                              borderRadius: '9999px',
                              fontSize: '11px',
                              fontWeight: '700',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <AlertCircle size={12} />
                              குறைவு (Low)
                            </span>
                          </div>
                        ) : (
                          <span style={{
                            backgroundColor: '#dcfce7',
                            color: '#15803d',
                            padding: '3px 10px',
                            borderRadius: '9999px',
                            fontSize: '11px',
                            fontWeight: '700',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <CheckCircle2 size={12} />
                            சரி (Good)
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 20px', textAlign: 'right', position: 'relative' }}>
                        <button
                          onClick={() => setActiveMenuId(activeMenuId === p._id ? null : p._id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#94a3b8',
                            padding: '6px',
                            borderRadius: '6px'
                          }}
                        >
                          <MoreVertical size={18} />
                        </button>

                        {activeMenuId === p._id && (
                          <div style={{
                            position: 'absolute',
                            right: '20px',
                            top: '44px',
                            backgroundColor: '#ffffff',
                            borderRadius: '10px',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
                            border: '1px solid #e2e8f0',
                            padding: '6px',
                            zIndex: 50,
                            minWidth: '140px',
                            textAlign: 'left'
                          }}>
                            <button
                              onClick={() => handleEditClick(p)}
                              style={{
                                width: '100%',
                                background: 'none',
                                border: 'none',
                                padding: '8px 12px',
                                borderRadius: '6px',
                                fontSize: '13px',
                                color: '#1e293b',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                cursor: 'pointer'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <Edit2 size={14} color="#2563eb" />
                              <span>திருத்து (Edit)</span>
                            </button>

                            <button
                              onClick={() => handleDeleteProduct(p._id, p.name || p.nameTamil)}
                              style={{
                                width: '100%',
                                background: 'none',
                                border: 'none',
                                padding: '8px 12px',
                                borderRadius: '6px',
                                fontSize: '13px',
                                color: '#ef4444',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                cursor: 'pointer'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <Trash2 size={14} />
                              <span>நீக்கு (Delete)</span>
                            </button>
                          </div>
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

      {/* Add / Edit Product Modal */}
      <ProductModal
        isOpen={isModalOpen}
        initialData={editingProduct}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
      />
    </div>
  );
}
