import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Plus,
  Trash2,
  Receipt,
  Printer,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ShoppingBag,
  CreditCard,
  Banknote,
  Smartphone,
  ArrowRight,
  History,
  X,
  Search,
  RefreshCw,
  User
} from 'lucide-react';
import speechService from '../utils/speech';
import { orderAPI, productAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function CustomerBilling() {
  const { owner } = useAuth();
  const [searchParams] = useSearchParams();

  // Master product catalog
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Billing state
  const [customerName, setCustomerName] = useState('');
  const [items, setItems] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  // Voice recognition state
  const [isListening, setIsListening] = useState(false);
  const [listeningCustomerName, setListeningCustomerName] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [voiceLang, setVoiceLang] = useState(owner?.preferredVoiceLang || 'ta-IN');
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [processingVoice, setProcessingVoice] = useState(false);
  const [manualCommandInput, setManualCommandInput] = useState('');

  // Auto-fill customer name from query param if provided (e.g. from Voice Assistant)
  useEffect(() => {
    const custParam = searchParams.get('customer');
    if (custParam && custParam.trim()) {
      setCustomerName(custParam.trim());
    }
  }, [searchParams]);

  // Manual product addition bar
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [manualQty, setManualQty] = useState(1);

  // Voice confirmation modal state
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [listeningForAnswer, setListeningForAnswer] = useState(false);
  const [confirmSpokenText, setConfirmSpokenText] = useState('');
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // Completed order & receipt modal
  const [completedOrder, setCompletedOrder] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptPaperWidth, setReceiptPaperWidth] = useState('80mm'); // '58mm' | '80mm'

  // Past orders drawer / modal
  const [showPastOrders, setShowPastOrders] = useState(false);
  const [pastOrders, setPastOrders] = useState([]);
  const [loadingPastOrders, setLoadingPastOrders] = useState(false);

  // System notification / alerts
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const res = await productAPI.getProducts();
      if (res.data?.data) {
        setProducts(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchPastOrders = async () => {
    try {
      setLoadingPastOrders(true);
      const res = await orderAPI.getOrders();
      if (res.data?.data) {
        setPastOrders(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoadingPastOrders(false);
    }
  };

  const showToast = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // ----------------------------------------------------
  // VOICE ORDER PARSING
  // ----------------------------------------------------
  const toggleVoiceRecording = () => {
    if (listeningCustomerName) {
      speechService.stopListening();
      setListeningCustomerName(false);
    }

    if (isListening) {
      speechService.stopListening();
      setIsListening(false);
      if (transcript.trim()) {
        handleProcessVoiceOrder(transcript.trim());
      }
    } else {
      setTranscript('');
      setInterimText('');
      setIsListening(true);

      speechService.startListening({
        lang: voiceLang,
        onInterim: (text) => setInterimText(text),
        onResult: (text) => {
          setTranscript(text);
          setIsListening(false);
          handleProcessVoiceOrder(text);
        },
        onError: (err) => {
          setIsListening(false);
          showToast(err.message || 'Microphone error', 'error');
        },
        onEnd: () => {
          setIsListening(false);
        }
      });
    }
  };

  // Dedicated Voice Input for Customer Name field
  const toggleCustomerVoiceInput = () => {
    if (listeningCustomerName) {
      speechService.stopListening();
      setListeningCustomerName(false);
    } else {
      if (isListening) {
        speechService.stopListening();
        setIsListening(false);
      }
      setListeningCustomerName(true);

      speechService.startListening({
        lang: voiceLang,
        onInterim: () => {},
        onResult: async (text) => {
          setListeningCustomerName(false);
          if (text && text.trim()) {
            try {
              const res = await orderAPI.parseVoiceOrder(text);
              const extracted = res.data?.data?.customerName;
              if (extracted && extracted !== 'Customer') {
                setCustomerName(extracted);
                showToast(`Customer name set to "${extracted}"!`, 'success');
                if (ttsEnabled) {
                  speechService.speak(
                    voiceLang.startsWith('ta') ? `வாடிக்கையாளர் பெயர் ${extracted}` : `Customer ${extracted}`,
                    voiceLang
                  );
                }
                return;
              }
            } catch (err) {
              // fallback to direct string extraction below
            }

            const rawClean = text.replace(/^(?:customer|name|வாடிக்கையாளர்|பெயர்|graahak|grahak|ग्राहक)\s*/i, '').trim();
            if (rawClean) {
              const formatted = rawClean.charAt(0).toUpperCase() + rawClean.slice(1);
              setCustomerName(formatted);
              showToast(`Customer name set to "${formatted}"!`, 'success');
              if (ttsEnabled) {
                speechService.speak(
                  voiceLang.startsWith('ta') ? `வாடிக்கையாளர் பெயர் ${formatted}` : `Customer ${formatted}`,
                  voiceLang
                );
              }
            }
          }
        },
        onError: (err) => {
          setListeningCustomerName(false);
          showToast(err.message || 'Microphone error', 'error');
        },
        onEnd: () => {
          setListeningCustomerName(false);
        }
      });
    }
  };

  const handleProcessVoiceOrder = async (spokenText) => {
    if (!spokenText || !spokenText.trim()) return;
    setProcessingVoice(true);

    try {
      const res = await orderAPI.parseVoiceOrder(spokenText);
      if (res.data?.success && res.data.data) {
        const parsed = res.data.data;

        if (parsed.customerName && parsed.customerName !== 'Customer') {
          setCustomerName(parsed.customerName);
        }

        if (parsed.items && parsed.items.length > 0) {
          // Merge with existing items or replace
          setItems(prevItems => {
            const merged = [...prevItems];
            for (const newItem of parsed.items) {
              const existingIdx = merged.findIndex(i => String(i.productId) === String(newItem.productId));
              if (existingIdx !== -1) {
                merged[existingIdx] = {
                  ...merged[existingIdx],
                  quantity: merged[existingIdx].quantity + newItem.quantity,
                  total: Math.round((merged[existingIdx].quantity + newItem.quantity) * merged[existingIdx].unitPrice * 100) / 100
                };
              } else {
                merged.push(newItem);
              }
            }
            return merged;
          });

          if (parsed.customerName && parsed.customerName !== 'Customer') {
            showToast(`Customer "${parsed.customerName}" & ${parsed.items.length} item(s) added to invoice!`, 'success');
          } else {
            showToast(`Added ${parsed.items.length} item(s) from voice order!`, 'success');
          }

          // If TTS enabled, speak status or stock warning
          if (ttsEnabled && parsed.spokenSummary) {
            speechService.speak(parsed.spokenSummary, voiceLang);
          }
        } else if (parsed.customerName && parsed.customerName !== 'Customer') {
          // Customer name set successfully by voice without items
          showToast(`Customer name set to "${parsed.customerName}" for invoice!`, 'success');
          if (ttsEnabled) {
            const feedback = voiceLang.startsWith('ta')
              ? (parsed.ttsTamil || `வாடிக்கையாளர் பெயர் ${parsed.customerName} என பில்லில் பதிவு செய்யப்பட்டது. பொருட்களைச் சொல்லுங்கள்.`)
              : (parsed.ttsMessage || parsed.spokenSummary || `Customer name set to ${parsed.customerName} for invoice. Please speak products to add.`);
            speechService.speak(feedback, voiceLang);
          }
        } else {
          showToast('Could not recognize products or customer name. Please try speaking customer name or item names.', 'warning');
          if (ttsEnabled) {
            speechService.speak('பொருட்களை அடையாளம் காண முடியவில்லை. தயவுசெய்து மீண்டும் பேசவும்.', voiceLang);
          }
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error processing voice command', 'error');
    } finally {
      setProcessingVoice(false);
    }
  };

  // ----------------------------------------------------
  // MANUAL PRODUCT ADDITION
  // ----------------------------------------------------
  const handleAddManualProduct = () => {
    if (!selectedProduct) {
      showToast('Please select a product first', 'warning');
      return;
    }

    const qty = Number(manualQty);
    if (isNaN(qty) || qty <= 0) {
      showToast('Please enter a valid quantity', 'warning');
      return;
    }

    const unitPrice = Number(selectedProduct.sellingPrice) || 0;
    const currentStock = Number(selectedProduct.currentStock) || 0;
    const total = Math.round(qty * unitPrice * 100) / 100;

    const newItem = {
      productId: selectedProduct._id,
      productName: selectedProduct.name,
      nameTamil: selectedProduct.nameTamil || '',
      nameEnglish: selectedProduct.nameEnglish || selectedProduct.name,
      displayName: selectedProduct.nameTamil ? `${selectedProduct.nameTamil} (${selectedProduct.nameEnglish})` : selectedProduct.name,
      quantity: qty,
      unit: selectedProduct.unit || 'kg',
      unitPrice,
      total,
      currentStock,
      minimumStock: selectedProduct.minimumStock || 5,
      isStockAvailable: currentStock >= qty,
      missingStock: qty > currentStock ? Math.round((qty - currentStock) * 100) / 100 : 0
    };

    setItems(prev => {
      const idx = prev.findIndex(i => String(i.productId) === String(newItem.productId));
      if (idx !== -1) {
        const updated = [...prev];
        const newTotalQty = updated[idx].quantity + qty;
        updated[idx] = {
          ...updated[idx],
          quantity: newTotalQty,
          total: Math.round(newTotalQty * updated[idx].unitPrice * 100) / 100,
          isStockAvailable: currentStock >= newTotalQty,
          missingStock: newTotalQty > currentStock ? Math.round((newTotalQty - currentStock) * 100) / 100 : 0
        };
        return updated;
      }
      return [...prev, newItem];
    });

    // Reset picker
    setSelectedProduct(null);
    setSearchQuery('');
    setManualQty(1);
    showToast(`Added ${selectedProduct.nameEnglish || selectedProduct.name} to bill`, 'success');
  };

  // ----------------------------------------------------
  // ITEM EDIT / DELETE
  // ----------------------------------------------------
  const handleUpdateItemQty = (index, newQty) => {
    const qty = Number(newQty);
    if (isNaN(qty) || qty <= 0) return;

    setItems(prev => {
      const updated = [...prev];
      const item = updated[index];
      const currentStock = Number(item.currentStock) || 0;
      updated[index] = {
        ...item,
        quantity: qty,
        total: Math.round(qty * item.unitPrice * 100) / 100,
        isStockAvailable: currentStock >= qty,
        missingStock: qty > currentStock ? Math.round((qty - currentStock) * 100) / 100 : 0
      };
      return updated;
    });
  };

  const handleRemoveItem = (index) => {
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleClearBill = () => {
    if (items.length > 0 && !window.confirm('Clear current bill?')) return;
    setItems([]);
    setCustomerName('');
    setDiscount(0);
    setPaymentMethod('Cash');
    setTranscript('');
    setInterimText('');
  };

  // ----------------------------------------------------
  // CALCULATIONS & STOCK VALIDATION
  // ----------------------------------------------------
  const subtotal = Math.round(items.reduce((acc, it) => acc + (Number(it.total) || 0), 0) * 100) / 100;
  const numDiscount = Math.max(0, Number(discount) || 0);
  const grandTotal = Math.max(0, Math.round((subtotal - numDiscount) * 100) / 100);

  const outOfStockItems = items.filter(it => it.quantity > (Number(it.currentStock) || 0));
  const hasStockErrors = outOfStockItems.length > 0;

  // ----------------------------------------------------
  // VOICE CONFIRMATION WORKFLOW
  // ----------------------------------------------------
  const handleOpenVoiceConfirm = () => {
    if (items.length === 0) {
      showToast('Please add items to bill before confirming', 'warning');
      return;
    }

    if (hasStockErrors) {
      const firstError = outOfStockItems[0];
      const msg = `${firstError.nameTamil || firstError.nameEnglish} stock-la ${firstError.currentStock} ${firstError.unit} mattum dhaan irukku!`;
      showToast(msg, 'error');
      if (ttsEnabled) {
        speechService.speak(msg, voiceLang);
      }
      return;
    }

    const cName = customerName.trim() || 'Customer';
    const spokenPrompt = `${cName}-ku ${items.length} items bill ready. Total ₹${grandTotal}. Bill confirm pannalama?`;
    setConfirmSpokenText(spokenPrompt);
    setConfirmModalOpen(true);

    if (ttsEnabled) {
      speechService.speak(spokenPrompt, voiceLang, () => {
        startConfirmListener();
      });
    } else {
      startConfirmListener();
    }
  };

  const startConfirmListener = () => {
    if (!speechService.hasSpeechRecognition()) return;
    setListeningForAnswer(true);

    speechService.startListening({
      lang: voiceLang,
      onResult: (text) => {
        setListeningForAnswer(false);
        const isYes =
          /^(yes|aam|ama|aama|sari|seri|correct|confirm|save|save pannu|kandippa|ok|okay|haan|theek hai)$/i.test(clean) ||
          clean.includes('save') || clean.includes('confirm') || clean.includes('sari') || clean.includes('seri') ||
          clean.includes('aama') || clean.includes('ஆம்') || clean.includes('சரி') || clean.includes('ஆமா');

        const isNo =
          /^(no|vendaam|vendam|venaam|venam|cancel|illai|ila|stop|nahi)$/i.test(clean) ||
          clean.includes('cancel') || clean.includes('vendam') || clean.includes('வேண்டாம்') || clean.includes('இல்லை');

        if (isYes) {
          executeSubmitOrder();
        } else if (isNo) {
          setConfirmModalOpen(false);
          showToast('Order confirmation cancelled', 'info');
        }
      },
      onError: () => setListeningForAnswer(false),
      onEnd: () => setListeningForAnswer(false)
    });
  };

  const executeSubmitOrder = async () => {
    setSubmittingOrder(true);
    speechService.stopListening();
    setListeningForAnswer(false);

    try {
      const payload = {
        customerName: customerName.trim() || 'Customer',
        items: items.map(it => ({
          productId: it.productId,
          productName: it.productName,
          quantity: it.quantity,
          unit: it.unit,
          unitPrice: it.unitPrice
        })),
        discount: numDiscount,
        paymentMethod
      };

      const res = await orderAPI.createOrder(payload);
      if (res.data?.success && res.data.data) {
        const order = res.data.data;
        setCompletedOrder(order);
        setConfirmModalOpen(false);
        setShowReceiptModal(true);
        setItems([]);
        setCustomerName('');
        setDiscount(0);

        // Refresh products so updated stock levels show immediately
        fetchProducts();

        if (ttsEnabled) {
          const successVoice = `Invoice ${order.invoiceNumber} created! Bill total ${order.grandTotal} rupees.`;
          speechService.speak(successVoice, voiceLang);
        }
      }
    } catch (err) {
      const errStock = err.response?.data?.stockErrors;
      if (errStock && errStock.length > 0) {
        const e = errStock[0];
        const errMsg = `${e.nameTamil || e.nameEnglish} stock-la ${e.available} ${e.unit} mattum dhaan irukku!`;
        showToast(errMsg, 'error');
        if (ttsEnabled) speechService.speak(errMsg, voiceLang);
      } else {
        showToast(err.response?.data?.message || 'Error saving order', 'error');
      }
      setConfirmModalOpen(false);
    } finally {
      setSubmittingOrder(false);
    }
  };

  // ----------------------------------------------------
  // THERMAL RECEIPT PRINTING
  // ----------------------------------------------------
  const handlePrintReceipt = () => {
    window.print();
  };

  const filteredProducts = products.filter(p => {
    if (!searchQuery.trim()) return false;
    const q = searchQuery.toLowerCase();
    return (
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.nameTamil && p.nameTamil.toLowerCase().includes(q)) ||
      (p.nameEnglish && p.nameEnglish.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q))
    );
  }).slice(0, 8);

  return (
    <div className="page-container no-print" style={{ maxWidth: '1440px', margin: '0 auto' }}>
      {/* Toast notification */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          backgroundColor: notification.type === 'error' ? '#ef4444' : notification.type === 'success' ? '#10b981' : notification.type === 'warning' ? '#f59e0b' : '#3b82f6',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '10px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: '500',
          fontSize: '14px',
          animation: 'fadeIn 0.2s ease-in-out'
        }}>
          {notification.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Voice Customer Billing
            </h1>
            <span style={{
              backgroundColor: '#dbeafe',
              color: '#1d4ed8',
              fontSize: '12px',
              fontWeight: '700',
              padding: '4px 10px',
              borderRadius: '9999px'
            }}>
              வாடிக்கையாளர் பில்
            </span>
          </div>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
            Speak customer orders in Tanglish or Tamil • Auto-validates live stock • Instant 58mm/80mm thermal receipt
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Language Selector */}
          <select
            value={voiceLang}
            onChange={(e) => setVoiceLang(e.target.value)}
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
            <option value="ta-IN">🇮🇳 தமிழ் / Tanglish</option>
            <option value="en-IN">🇮🇳 Indian English</option>
          </select>

          {/* TTS Speaker Toggle */}
          <button
            onClick={() => setTtsEnabled(!ttsEnabled)}
            title={ttsEnabled ? 'Voice feedback ON' : 'Voice feedback OFF'}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: ttsEnabled ? '#eff6ff' : '#ffffff',
              color: ttsEnabled ? '#2563eb' : '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: '600'
            }}
          >
            {ttsEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span>{ttsEnabled ? 'Audio ON' : 'Muted'}</span>
          </button>

          {/* Past Orders History Button */}
          <button
            onClick={() => {
              fetchPastOrders();
              setShowPastOrders(true);
            }}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#334155',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: '600'
            }}
          >
            <History size={16} />
            <span>Past Invoices</span>
          </button>

          {/* New Bill Button */}
          <button
            onClick={handleClearBill}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              color: '#dc2626',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: '600'
            }}
          >
            <RefreshCw size={15} />
            <span>New Bill</span>
          </button>
        </div>
      </div>

      {/* Hero Voice Order Card */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        borderRadius: '16px',
        padding: '24px 28px',
        color: '#ffffff',
        marginBottom: '24px',
        boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.4)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle decorative glow */}
        <div style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '180px',
          height: '180px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, rgba(59, 130, 246, 0) 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ flex: 1, minWidth: '280px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Sparkles size={18} color="#60a5fa" />
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#93c5fd', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Multi-Item Voice Order
              </span>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 8px 0', color: '#f8fafc' }}>
              Speak Customer Name & Multiple Items
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0, lineHeight: 1.5 }}>
              Say: <span style={{ color: '#93c5fd', fontWeight: '700' }}>"Customer Anu"</span> to set name, or <span style={{ color: '#e2e8f0', fontWeight: '600' }}>"Customer Anu, Ulundhu paruppu 2 kilo, Sambar podi 2 packet"</span> for full order.
            </p>
          </div>

          {/* Glow Mic Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={toggleVoiceRecording}
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: isListening ? '#ef4444' : '#2563eb',
                color: '#ffffff',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: isListening
                  ? '0 0 0 10px rgba(239, 68, 68, 0.25), 0 8px 20px rgba(239, 68, 68, 0.5)'
                  : '0 0 0 6px rgba(37, 99, 235, 0.2), 0 8px 20px rgba(37, 99, 235, 0.4)',
                transition: 'all 0.2s ease-in-out',
                transform: isListening ? 'scale(1.06)' : 'scale(1)'
              }}
              className={isListening ? 'pulse-active' : ''}
              title={isListening ? 'Click to stop and parse order' : 'Click to speak customer order'}
            >
              {isListening ? <MicOff size={28} /> : <Mic size={28} />}
            </button>

            <div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: isListening ? '#fca5a5' : '#e2e8f0' }}>
                {isListening ? 'Listening... Speak now' : 'Click Mic to Speak'}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                {isListening ? 'Stop when finished' : 'Tamil, Tanglish & English supported'}
              </div>
            </div>
          </div>
        </div>

        {/* Live speech feedback & interim transcription */}
        {(isListening || transcript || interimText || processingVoice) && (
          <div style={{
            marginTop: '18px',
            padding: '12px 16px',
            borderRadius: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isListening ? '#ef4444' : '#10b981',
                animation: isListening ? 'pulse-ring 1s infinite' : 'none'
              }} />
              <div style={{ fontSize: '14px', color: '#f1f5f9' }}>
                {processingVoice ? (
                  <span style={{ color: '#93c5fd' }}>Parsing products and verifying stock...</span>
                ) : (
                  <span>
                    <strong>Spoken: </strong>
                    <span style={{ color: '#cbd5e1' }}>{transcript}</span>
                    <span style={{ color: '#94a3b8', fontStyle: 'italic' }}> {interimText}</span>
                  </span>
                )}
              </div>
            </div>

            {transcript && !processingVoice && (
              <button
                onClick={() => handleProcessVoiceOrder(transcript)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  backgroundColor: '#3b82f6',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Parse Order Again
              </button>
            )}
          </div>
        )}

        {/* Fallback Text Input for silent entry / testing */}
        <div style={{ marginTop: '14px', display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={manualCommandInput}
            onChange={(e) => setManualCommandInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && manualCommandInput.trim()) {
                handleProcessVoiceOrder(manualCommandInput.trim());
                setManualCommandInput('');
              }
            }}
            placeholder="Or type order: e.g. Customer Anu OR Customer Anu, Ulundhu paruppu 2 kilo, Sambar podi 2 packet..."
            style={{
              flex: 1,
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              color: '#ffffff',
              fontSize: '13px'
            }}
          />
          <button
            onClick={() => {
              if (manualCommandInput.trim()) {
                handleProcessVoiceOrder(manualCommandInput.trim());
                setManualCommandInput('');
              }
            }}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              backgroundColor: '#334155',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Parse
          </button>
        </div>
      </div>

      {/* Main Grid: Customer & Items vs Order Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Left Column: Customer details & Bill items table */}
        <div>
          {/* Customer info & Manual add product row */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            padding: '20px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px', marginBottom: '18px' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                  <span>Customer Name (வாடிக்கையாளர் பெயர்)</span>
                  {customerName && (
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={13} /> Active for Invoice
                    </span>
                  )}
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Anu / Priya / Walk-in Customer"
                    className="form-input"
                    style={{ fontWeight: '600', flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={toggleCustomerVoiceInput}
                    title={listeningCustomerName ? "Listening... Speak customer name now (e.g. Anu)" : "Click to speak Customer Name (e.g. Anu)"}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: listeningCustomerName ? '#ef4444' : '#2563eb',
                      color: '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      fontWeight: '700',
                      transition: 'all 0.2s',
                      boxShadow: listeningCustomerName ? '0 0 0 4px rgba(239, 68, 68, 0.25)' : 'none',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {listeningCustomerName ? <MicOff size={15} /> : <Mic size={15} />}
                    <span>{listeningCustomerName ? 'Listening...' : 'Voice Name'}</span>
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                  Payment Method (பணம் செலுத்தும் முறை)
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="form-input"
                  style={{ fontWeight: '600', cursor: 'pointer' }}
                >
                  <option value="Cash">💵 Cash (ரொக்கம்)</option>
                  <option value="UPI">📱 UPI / GPay / PhonePe</option>
                  <option value="Card">💳 Card</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Quick manual product search & add */}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>
                Quick Manual Add (பொருளைத் தேடிச் சேர்க்க)
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', position: 'relative' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSelectedProduct(null);
                    }}
                    placeholder="Search product by Tamil or English name..."
                    className="form-input"
                    style={{ paddingLeft: '36px' }}
                  />

                  {/* Autocomplete dropdown */}
                  {searchQuery.trim() && !selectedProduct && filteredProducts.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      zIndex: 100,
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                      marginTop: '4px',
                      maxHeight: '240px',
                      overflowY: 'auto'
                    }}>
                      {filteredProducts.map(p => (
                        <div
                          key={p._id}
                          onClick={() => {
                            setSelectedProduct(p);
                            setSearchQuery(p.nameTamil ? `${p.nameTamil} (${p.nameEnglish})` : p.name);
                          }}
                          style={{
                            padding: '10px 14px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #f1f5f9',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                        >
                          <div>
                            <div style={{ fontWeight: '600', fontSize: '13px', color: '#1e293b' }}>
                              {p.nameTamil ? `${p.nameTamil} (${p.nameEnglish})` : p.name}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>{p.category}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: '700', fontSize: '13px', color: '#2563eb' }}>₹{p.sellingPrice} / {p.unit}</div>
                            <div style={{
                              fontSize: '11px',
                              fontWeight: '600',
                              color: p.currentStock <= p.minimumStock ? '#ef4444' : '#10b981'
                            }}>
                              Stock: {p.currentStock} {p.unit}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ width: '100px' }}>
                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    value={manualQty}
                    onChange={(e) => setManualQty(e.target.value)}
                    placeholder="Qty"
                    className="form-input"
                    style={{ textAlign: 'center', fontWeight: '700' }}
                  />
                </div>

                <button
                  onClick={handleAddManualProduct}
                  className="btn-primary"
                  style={{ whiteSpace: 'nowrap', padding: '10px 16px' }}
                >
                  <Plus size={16} />
                  <span>Add</span>
                </button>
              </div>
            </div>
          </div>

          {/* Out of stock alert banner if any item exceeds available stock */}
          {hasStockErrors && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '12px',
              padding: '14px 18px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}>
              <AlertTriangle size={20} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontWeight: '700', color: '#991b1b', fontSize: '14px' }}>
                  Stock Limit Exceeded (இருப்பு போதாது!)
                </div>
                <div style={{ color: '#b91c1c', fontSize: '13px', marginTop: '2px' }}>
                  {outOfStockItems.map(it => (
                    <div key={it.productId || it.productName}>
                      • <strong>{it.displayName || it.productName}</strong>: Available stock is only <strong>{it.currentStock} {it.unit}</strong> (requested: {it.quantity} {it.unit}). Please reduce quantity to proceed.
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Bill Items Table */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Receipt size={18} color="#2563eb" />
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                  Customer Order Items ({items.length})
                </h3>
              </div>

              {items.length > 0 && (
                <button
                  onClick={handleClearBill}
                  style={{
                    border: 'none',
                    background: 'none',
                    color: '#dc2626',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Trash2 size={13} />
                  <span>Clear All</span>
                </button>
              )}
            </div>

            {items.length === 0 ? (
              <div style={{
                padding: '60px 20px',
                textAlign: 'center',
                color: '#94a3b8'
              }}>
                <ShoppingBag size={42} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#64748b' }}>
                  No items in current bill
                </div>
                <div style={{ fontSize: '13px', marginTop: '4px' }}>
                  Speak an order using the mic button above or add products manually.
                </div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '12px 16px', width: '36px' }}>#</th>
                      <th style={{ padding: '12px 16px' }}>Product / பொருள்</th>
                      <th style={{ padding: '12px 16px' }}>Stock</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Price (₹)</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', width: '140px' }}>Qty</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Total (₹)</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', width: '48px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => {
                      const isOutOfStock = item.quantity > (Number(item.currentStock) || 0);
                      return (
                        <tr
                          key={idx}
                          style={{
                            borderBottom: '1px solid #f1f5f9',
                            backgroundColor: isOutOfStock ? '#fff1f2' : 'transparent'
                          }}
                        >
                          <td style={{ padding: '14px 16px', color: '#94a3b8', fontWeight: '600' }}>
                            {idx + 1}
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ fontWeight: '700', color: isOutOfStock ? '#991b1b' : '#1e293b' }}>
                              {item.displayName || item.productName}
                            </div>
                            {item.nameEnglish && item.nameTamil && (
                              <div style={{ fontSize: '11px', color: '#64748b' }}>
                                {item.nameTamil}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: '700',
                              backgroundColor: isOutOfStock ? '#fee2e2' : item.currentStock <= item.minimumStock ? '#fef3c7' : '#dcfce7',
                              color: isOutOfStock ? '#b91c1c' : item.currentStock <= item.minimumStock ? '#b45309' : '#15803d'
                            }}>
                              {item.currentStock} {item.unit}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '600', color: '#475569' }}>
                            ₹{item.unitPrice}
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                              <button
                                onClick={() => handleUpdateItemQty(idx, Math.max(0.5, item.quantity - 1))}
                                style={{
                                  width: '26px',
                                  height: '26px',
                                  borderRadius: '4px',
                                  border: '1px solid #cbd5e1',
                                  backgroundColor: '#ffffff',
                                  cursor: 'pointer',
                                  fontWeight: '700'
                                }}
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="0.1"
                                step="any"
                                value={item.quantity}
                                onChange={(e) => handleUpdateItemQty(idx, e.target.value)}
                                style={{
                                  width: '54px',
                                  padding: '4px',
                                  textAlign: 'center',
                                  borderRadius: '4px',
                                  border: isOutOfStock ? '1px solid #dc2626' : '1px solid #cbd5e1',
                                  backgroundColor: isOutOfStock ? '#ffffff' : '#f8fafc',
                                  fontWeight: '700',
                                  fontSize: '13px'
                                }}
                              />
                              <button
                                onClick={() => handleUpdateItemQty(idx, item.quantity + 1)}
                                style={{
                                  width: '26px',
                                  height: '26px',
                                  borderRadius: '4px',
                                  border: '1px solid #cbd5e1',
                                  backgroundColor: '#ffffff',
                                  cursor: 'pointer',
                                  fontWeight: '700'
                                }}
                              >
                                +
                              </button>
                            </div>
                            {isOutOfStock && (
                              <div style={{ fontSize: '10px', color: '#dc2626', textAlign: 'center', marginTop: '2px', fontWeight: '700' }}>
                                Max: {item.currentStock}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '700', color: '#1e293b' }}>
                            ₹{item.total}
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                            <button
                              onClick={() => handleRemoveItem(idx)}
                              title="Delete Item"
                              style={{
                                border: 'none',
                                background: 'none',
                                color: '#94a3b8',
                                cursor: 'pointer',
                                padding: '4px'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.color = '#dc2626'}
                              onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Order Financial Summary & Confirmation */}
        <div style={{ position: 'sticky', top: '24px' }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
            padding: '24px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 16px 0', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              Bill Summary
            </h3>

            {/* Financial Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                <span>Subtotal ({items.length} items)</span>
                <span style={{ fontWeight: '600', color: '#1e293b' }}>₹{subtotal.toFixed(2)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b' }}>Discount (₹ தள்ளுபடி)</span>
                <input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  style={{
                    width: '80px',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    textAlign: 'right',
                    fontWeight: '600',
                    fontSize: '13px'
                  }}
                />
              </div>

              <div style={{
                borderTop: '2px dashed #e2e8f0',
                paddingTop: '16px',
                marginTop: '4px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline'
              }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>Grand Total</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>மொத்த தொகை</div>
                </div>
                <div style={{ fontSize: '28px', fontWeight: '900', color: '#2563eb' }}>
                  ₹{grandTotal.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Payment Mode Badge */}
            <div style={{
              marginTop: '16px',
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '13px'
            }}>
              <span style={{ color: '#64748b' }}>Payment Mode:</span>
              <span style={{ fontWeight: '700', color: '#1e293b' }}>{paymentMethod}</span>
            </div>

            {/* Primary Action Buttons */}
            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={handleOpenVoiceConfirm}
                disabled={items.length === 0 || hasStockErrors}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '14px',
                  fontSize: '15px',
                  fontWeight: '700',
                  borderRadius: '10px',
                  background: hasStockErrors ? '#94a3b8' : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  boxShadow: hasStockErrors ? 'none' : '0 4px 14px rgba(37, 99, 235, 0.3)'
                }}
              >
                <Volume2 size={18} />
                <span>Voice Confirm Bill (உறுதி செய்)</span>
              </button>

              <button
                onClick={executeSubmitOrder}
                disabled={items.length === 0 || hasStockErrors || submittingOrder}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  borderRadius: '10px',
                  backgroundColor: '#ffffff',
                  color: hasStockErrors ? '#94a3b8' : '#334155',
                  border: '1px solid #cbd5e1',
                  cursor: hasStockErrors ? 'not-allowed' : 'pointer'
                }}
              >
                {submittingOrder ? 'Generating Bill...' : 'Direct Print & Save Bill'}
              </button>
            </div>

            {/* Quick helper note */}
            <div style={{
              marginTop: '18px',
              fontSize: '11px',
              color: '#94a3b8',
              lineHeight: 1.4,
              textAlign: 'center'
            }}>
              Stock will be automatically deducted and invoice generated upon confirmation.
            </div>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* VOICE CONFIRMATION MODAL */}
      {/* ---------------------------------------------------- */}
      {confirmModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '18px',
            width: '100%',
            maxWidth: '520px',
            padding: '28px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: listeningForAnswer ? '#fee2e2' : '#eff6ff',
              color: listeningForAnswer ? '#ef4444' : '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              animation: listeningForAnswer ? 'pulse-ring 1.5s infinite' : 'none'
            }}>
              {listeningForAnswer ? <Mic size={32} /> : <Volume2 size={32} />}
            </div>

            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0' }}>
              {listeningForAnswer ? 'Listening for Confirmation...' : 'Confirm Customer Bill'}
            </h3>

            <div style={{
              padding: '14px 18px',
              borderRadius: '12px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              margin: '16px 0',
              fontSize: '15px',
              color: '#1e293b',
              fontWeight: '600'
            }}>
              "{confirmSpokenText}"
            </div>

            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px' }}>
              Speak: <strong style={{ color: '#16a34a' }}>"Aama" / "Yes" / "Confirm"</strong> to finalize, or{' '}
              <strong style={{ color: '#dc2626' }}>"Vendam" / "No"</strong> to cancel.
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  speechService.stopListening();
                  setConfirmModalOpen(false);
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#64748b',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel (வேண்டாம்)
              </button>

              <button
                onClick={executeSubmitOrder}
                disabled={submittingOrder}
                className="btn-primary"
                style={{
                  flex: 1,
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: '700',
                  borderRadius: '10px'
                }}
              >
                {submittingOrder ? 'Saving...' : 'Confirm Bill (ஆம் / சேமி)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* THERMAL RECEIPT MODAL & PRINT PREVIEW */}
      {/* ---------------------------------------------------- */}
      {showReceiptModal && completedOrder && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '18px',
            width: '100%',
            maxWidth: '540px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#f8fafc'
            }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Bill Generated Successfully!
                </h3>
                <div style={{ fontSize: '12px', color: '#10b981', fontWeight: '700', marginTop: '2px' }}>
                  Invoice: {completedOrder.invoiceNumber}
                </div>
              </div>

              <button
                onClick={() => setShowReceiptModal(false)}
                style={{ border: 'none', background: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Low stock post-order alerts banner */}
            {completedOrder.lowStockAlerts && completedOrder.lowStockAlerts.length > 0 && (
              <div style={{
                backgroundColor: '#fffbeb',
                borderBottom: '1px solid #fef3c7',
                padding: '10px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '12px',
                color: '#b45309',
                fontWeight: '600'
              }}>
                <AlertTriangle size={16} color="#d97706" />
                <span>
                  <strong>Low Stock Warning: </strong>
                  {completedOrder.lowStockAlerts.join(' • ')}
                </span>
              </div>
            )}

            {/* Receipt Preview Scroll Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', backgroundColor: '#f1f5f9' }}>
              {/* Thermal paper simulator card */}
              <div style={{
                maxWidth: receiptPaperWidth === '58mm' ? '280px' : '380px',
                margin: '0 auto',
                backgroundColor: '#ffffff',
                padding: '20px 16px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                borderRadius: '4px',
                fontFamily: "'Courier New', Courier, monospace",
                fontSize: '12px',
                lineHeight: 1.4,
                color: '#000000',
                border: '1px solid #e2e8f0'
              }}>
                {/* Store Header */}
                <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                  <div style={{ fontWeight: '900', fontSize: '15px' }}>
                    {owner?.shopName || 'TAMIL NADU SMART GROCERY'}
                  </div>
                  <div style={{ fontSize: '11px' }}>{owner?.address || 'Main Bazaar Road, Shop #12'}</div>
                  <div style={{ fontSize: '11px' }}>Ph: {owner?.phone || '9876543210'}</div>
                </div>

                <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '6px 0', margin: '8px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>INV: {completedOrder.invoiceNumber}</span>
                    <span>{new Date(completedOrder.date).toLocaleDateString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Cust: {completedOrder.customerName}</span>
                    <span>{completedOrder.time || '10:00 AM'}</span>
                  </div>
                </div>

                {/* Items Table */}
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderBottom: '1px solid #000', paddingBottom: '3px' }}>
                    <span style={{ flex: 2 }}>Item</span>
                    <span style={{ flex: 1, textAlign: 'center' }}>Qty</span>
                    <span style={{ flex: 1, textAlign: 'right' }}>Price</span>
                    <span style={{ flex: 1, textAlign: 'right' }}>Total</span>
                  </div>

                  {completedOrder.items?.map((it, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                      <span style={{ flex: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {it.nameEnglish || it.productName}
                      </span>
                      <span style={{ flex: 1, textAlign: 'center' }}>
                        {it.quantity} {it.unit}
                      </span>
                      <span style={{ flex: 1, textAlign: 'right' }}>
                        {it.unitPrice}
                      </span>
                      <span style={{ flex: 1, textAlign: 'right', fontWeight: 'bold' }}>
                        {it.totalPrice || (it.quantity * it.unitPrice).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div style={{ borderTop: '1px dashed #000', paddingTop: '6px', marginTop: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Subtotal:</span>
                    <span>₹{completedOrder.subtotal?.toFixed(2)}</span>
                  </div>
                  {completedOrder.discount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Discount:</span>
                      <span>-₹{completedOrder.discount?.toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '900', fontSize: '14px', borderTop: '1px solid #000', paddingTop: '4px', marginTop: '4px' }}>
                    <span>GRAND TOTAL:</span>
                    <span>₹{completedOrder.grandTotal?.toFixed(2)}</span>
                  </div>
                </div>

                {/* Footer Note */}
                <div style={{ borderTop: '1px dashed #000', paddingTop: '8px', marginTop: '10px', textAlign: 'center' }}>
                  <div>Paid by: {completedOrder.paymentMethod || 'Cash'}</div>
                  <div style={{ marginTop: '4px', fontWeight: 'bold' }}>Thank You! Visit Again</div>
                  <div style={{ fontSize: '11px' }}>நன்றி! மீண்டும் வருக!</div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#ffffff'
            }}>
              {/* Width toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                <span style={{ color: '#64748b' }}>Paper Size:</span>
                <button
                  onClick={() => setReceiptPaperWidth('58mm')}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: receiptPaperWidth === '58mm' ? '#2563eb' : '#ffffff',
                    color: receiptPaperWidth === '58mm' ? '#ffffff' : '#334155',
                    fontSize: '11px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  58mm
                </button>
                <button
                  onClick={() => setReceiptPaperWidth('80mm')}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: receiptPaperWidth === '80mm' ? '#2563eb' : '#ffffff',
                    color: receiptPaperWidth === '80mm' ? '#ffffff' : '#334155',
                    fontSize: '11px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  80mm
                </button>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setShowReceiptModal(false)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#334155',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>

                <button
                  onClick={handlePrintReceipt}
                  className="btn-primary"
                  style={{
                    padding: '10px 18px',
                    fontSize: '13px',
                    fontWeight: '700',
                    borderRadius: '8px'
                  }}
                >
                  <Printer size={16} />
                  <span>Print Thermal Receipt</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* PAST ORDERS DRAWER */}
      {/* ---------------------------------------------------- */}
      {showPastOrders && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '480px',
            backgroundColor: '#ffffff',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '-10px 0 30px rgba(0,0,0,0.2)'
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Recent Customer Invoices
                </h3>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  View past customer bills and reprint receipts
                </div>
              </div>
              <button
                onClick={() => setShowPastOrders(false)}
                style={{ border: 'none', background: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
              {loadingPastOrders ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  Loading past invoices...
                </div>
              ) : pastOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  No past orders found.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {pastOrders.map(ord => (
                    <div
                      key={ord._id || ord.invoiceNumber}
                      style={{
                        padding: '14px 16px',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        backgroundColor: '#ffffff',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontWeight: '800', fontSize: '14px', color: '#2563eb' }}>
                          {ord.invoiceNumber}
                        </span>
                        <span style={{ fontWeight: '800', fontSize: '15px', color: '#0f172a' }}>
                          ₹{ord.grandTotal?.toFixed(2)}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>
                        <span>Cust: <strong>{ord.customerName}</strong> ({ord.items?.length || 0} items)</span>
                        <span>{new Date(ord.date).toLocaleDateString('en-IN')} {ord.time}</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          onClick={() => {
                            setCompletedOrder(ord);
                            setShowReceiptModal(true);
                          }}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            backgroundColor: '#ffffff',
                            color: '#2563eb',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Printer size={14} />
                          <span>Reprint Receipt</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* HIDDEN PRINT-ONLY THERMAL RECEIPT AREA */}
      {/* ---------------------------------------------------- */}
      {completedOrder && (
        <div id="thermal-receipt-print-area">
          <div style={{ textAlign: 'center', marginBottom: '10px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
              {owner?.shopName || 'TAMIL NADU SMART GROCERY'}
            </div>
            <div>{owner?.address || 'Main Bazaar Road, Shop #12'}</div>
            <div>Ph: {owner?.phone || '9876543210'}</div>
          </div>

          <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '4px 0', margin: '6px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>INV: {completedOrder.invoiceNumber}</span>
              <span>{new Date(completedOrder.date).toLocaleDateString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Cust: {completedOrder.customerName}</span>
              <span>{completedOrder.time || '10:00 AM'}</span>
            </div>
          </div>

          <div style={{ marginBottom: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderBottom: '1px solid #000', paddingBottom: '2px' }}>
              <span style={{ flex: 2 }}>Item</span>
              <span style={{ flex: 1, textAlign: 'center' }}>Qty</span>
              <span style={{ flex: 1, textAlign: 'right' }}>Rate</span>
              <span style={{ flex: 1, textAlign: 'right' }}>Total</span>
            </div>

            {completedOrder.items?.map((it, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                <span style={{ flex: 2 }}>{it.nameEnglish || it.productName}</span>
                <span style={{ flex: 1, textAlign: 'center' }}>{it.quantity} {it.unit}</span>
                <span style={{ flex: 1, textAlign: 'right' }}>{it.unitPrice}</span>
                <span style={{ flex: 1, textAlign: 'right', fontWeight: 'bold' }}>
                  {it.totalPrice || (it.quantity * it.unitPrice).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px dashed #000', paddingTop: '4px', marginTop: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Subtotal:</span>
              <span>₹{completedOrder.subtotal?.toFixed(2)}</span>
            </div>
            {completedOrder.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Discount:</span>
                <span>-₹{completedOrder.discount?.toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px', borderTop: '1px solid #000', paddingTop: '3px', marginTop: '3px' }}>
              <span>TOTAL:</span>
              <span>₹{completedOrder.grandTotal?.toFixed(2)}</span>
            </div>
          </div>

          <div style={{ borderTop: '1px dashed #000', paddingTop: '6px', marginTop: '8px', textAlign: 'center' }}>
            <div>Payment: {completedOrder.paymentMethod || 'Cash'}</div>
            <div style={{ fontWeight: 'bold', marginTop: '3px' }}>Thank You! Visit Again</div>
            <div>நன்றி! மீண்டும் வருக!</div>
          </div>
        </div>
      )}
    </div>
  );
}
