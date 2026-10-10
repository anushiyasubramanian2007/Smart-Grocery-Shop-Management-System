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
  User,
  QrCode,
  Copy,
  Check,
  ExternalLink,
  Edit2,
  Upload,
  Image as ImageIcon,
  Info,
  ShieldCheck,
  CheckCheck
} from 'lucide-react';
import speechService from '../utils/speech';
import { orderAPI, productAPI, authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { processRazorpayPayment } from '../utils/razorpay';

export default function CustomerBilling() {
  const { owner, updateOwnerState } = useAuth();
  const { a11y, playChime, announce } = useAccessibility();
  const [searchParams] = useSearchParams();

  // Master product catalog
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Billing state
  const [customerName, setCustomerName] = useState('');
  const [items, setItems] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  // Payment Options Dialog state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentOption, setSelectedPaymentOption] = useState('upi_qr'); // 'upi_qr' | 'upi_id' | 'cash' | 'card' | 'khata'
  const [customerUpiId, setCustomerUpiId] = useState('');
  const [upiRefNumber, setUpiRefNumber] = useState('');
  const [cashReceived, setCashReceived] = useState('');
  const [cardLastFour, setCardLastFour] = useState('');
  const [collectRequestSent, setCollectRequestSent] = useState(false);
  const [upiCopied, setUpiCopied] = useState(false);

  // Owner UPI ID & QR Code Management
  const [isEditingOwnerUpi, setIsEditingOwnerUpi] = useState(false);
  const [customOwnerUpi, setCustomOwnerUpi] = useState(owner?.upiId || 'anusabari273@okhdfcbank');
  const [savingOwnerUpi, setSavingOwnerUpi] = useState(false);
  const [qrMode, setQrMode] = useState('universal'); // 'universal' (safe for all apps) | 'amount_locked'
  const [qrDisplaySource, setQrDisplaySource] = useState(owner?.upiQrImage ? 'uploaded' : 'generated');
  const [showQrExplanation, setShowQrExplanation] = useState(false);
  const [uploadingQrImage, setUploadingQrImage] = useState(false);
  const qrFileInputRef = useRef(null);

  // Synchronize state when owner updates
  useEffect(() => {
    if (owner?.upiId) {
      setCustomOwnerUpi(owner.upiId);
    }
    if (owner?.upiQrImage) {
      setQrDisplaySource('uploaded');
    }
  }, [owner?.upiId, owner?.upiQrImage]);

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
  const [receiptPaperWidth, setReceiptPaperWidth] = useState(a11y?.defaultReceiptWidth || '80mm'); // '58mm' | '80mm'

  useEffect(() => {
    if (a11y?.defaultReceiptWidth) {
      setReceiptPaperWidth(a11y.defaultReceiptWidth);
    }
  }, [a11y?.defaultReceiptWidth]);

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
  // OWNER UPI & QR STANDEE HANDLERS
  // ----------------------------------------------------
  const handleSaveOwnerUpi = async (e) => {
    if (e) e.preventDefault();
    const cleanId = (customOwnerUpi || '').trim();
    if (!cleanId || !cleanId.includes('@')) {
      showToast('Please enter a valid UPI ID (e.g. yourname@okhdfcbank or 9876543210@paytm)', 'error');
      playChime('warning');
      return;
    }
    setSavingOwnerUpi(true);
    try {
      const res = await authAPI.updateSettings({ upiId: cleanId });
      if (res.data?.owner) {
        updateOwnerState(res.data.owner);
      }
      setIsEditingOwnerUpi(false);
      showToast(`Owner UPI ID updated to "${cleanId}"!`, 'success');
      playChime('success');
      announce('Owner UPI ID updated');
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Failed to update UPI ID', 'error');
      playChime('warning');
    } finally {
      setSavingOwnerUpi(false);
    }
  };

  const handleQrImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file (PNG, JPG, WEBP)', 'error');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      showToast('Image size exceeds 8MB limit', 'error');
      return;
    }

    setUploadingQrImage(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target.result;
      try {
        const res = await authAPI.updateSettings({ upiQrImage: base64Data });
        if (res.data?.owner) {
          updateOwnerState(res.data.owner);
        }
        setQrDisplaySource('uploaded');
        showToast('Shop Counter QR Standee uploaded successfully!', 'success');
        playChime('success');
      } catch (err) {
        showToast(err.response?.data?.message || err.message || 'Failed to upload QR image', 'error');
        playChime('warning');
      } finally {
        setUploadingQrImage(false);
      }
    };
    reader.onerror = () => {
      setUploadingQrImage(false);
      showToast('Failed to read image file', 'error');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveQrImage = async () => {
    if (!window.confirm('Remove custom QR standee image and switch back to generated QR?')) return;
    try {
      const res = await authAPI.updateSettings({ upiQrImage: '' });
      if (res.data?.owner) {
        updateOwnerState(res.data.owner);
      }
      setQrDisplaySource('generated');
      showToast('Custom QR removed, switched to auto-generated QR', 'success');
      playChime('success');
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Failed to remove QR image', 'error');
    }
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
      speechService.finishListening();
      setIsListening(false);
    } else {
      setTranscript('');
      setInterimText('');
      setIsListening(true);

      speechService.startListening({
        lang: voiceLang,
        silenceDelayMs: 2500,
        onInterim: (interim, fullText) => {
          setInterimText(interim);
          setTranscript(fullText);
        },
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
        const clean = (text || '').toLowerCase().trim();
        const isYes =
          /^(yes|aam|ama|aama|sari|seri|correct|confirm|save|save pannu|kandippa|ok|okay|haan|theek hai)$/i.test(clean) ||
          clean.includes('save') || clean.includes('confirm') || clean.includes('sari') || clean.includes('seri') ||
          clean.includes('aama') || clean.includes('ஆம்') || clean.includes('சரி') || clean.includes('ஆமா');

        const isNo =
          /^(no|vendaam|vendam|venaam|venam|cancel|illai|ila|stop|nahi)$/i.test(clean) ||
          clean.includes('cancel') || clean.includes('vendam') || clean.includes('வேண்டாம்') || clean.includes('இல்லை');

        if (isYes) {
          setConfirmModalOpen(false);
          handleOpenPaymentModal();
        } else if (isNo) {
          setConfirmModalOpen(false);
          showToast('Order confirmation cancelled', 'info');
        }
      },
      onError: () => setListeningForAnswer(false),
      onEnd: () => setListeningForAnswer(false)
    });
  };

  const handleOpenPaymentModal = (defaultOption = 'upi_qr') => {
    if (items.length === 0) {
      showToast('Please add items to bill before confirming payment', 'warning');
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

    setConfirmModalOpen(false);
    setSelectedPaymentOption(defaultOption);
    setCashReceived(grandTotal);
    setCollectRequestSent(false);
    setUpiRefNumber('');
    setCustomerUpiId('');
    setShowPaymentModal(true);

    if (ttsEnabled) {
      const prompt = voiceLang.startsWith('ta')
        ? `மொத்த தொகை ரூபாய் ${grandTotal}. பணம் செலுத்தும் முறையை தேர்ந்தெடுக்கவும்: யுபிஐ ஸ்கேனர், யுபிஐ ஐடி, அல்லது ரொக்கம்?`
        : `Total bill is ₹${grandTotal}. Please select payment option: UPI QR Scanner, UPI ID, or Cash.`;
      speechService.speak(prompt, voiceLang);
    }
  };

  const handleConfirmPayment = async (paymentDetails = {}) => {
    // If Razorpay online gateway is chosen
    if (paymentDetails.paymentMethod === 'Razorpay') {
      setShowPaymentModal(false);
      setSubmittingOrder(true);
      try {
        await processRazorpayPayment({
          amount: grandTotal,
          invoiceNumber: `INV-${Date.now().toString().slice(-4)}`,
          customerName: customerName.trim() || 'Customer',
          customerPhone: '',
          shopName: owner?.shopName || 'Tamil Nadu Smart Grocery',
          onSuccess: async (razorpayData) => {
            await completeOrderCreation({
              paymentMethod: 'Razorpay',
              paymentStatus: 'Paid',
              razorpayOrderId: razorpayData.razorpayOrderId,
              razorpayPaymentId: razorpayData.razorpayPaymentId,
              razorpaySignature: razorpayData.razorpaySignature
            });
          },
          onError: (err) => {
            playChime('warning');
            showToast(`Razorpay Payment Failed: ${err.message || 'Cancelled'}`, 'error');
            setSubmittingOrder(false);
          },
          onDismiss: () => {
            setSubmittingOrder(false);
            showToast('Razorpay payment cancelled by customer', 'info');
          }
        });
      } catch (err) {
        setSubmittingOrder(false);
        showToast(err.message || 'Razorpay checkout error', 'error');
      }
      return;
    }

    setShowPaymentModal(false);
    await completeOrderCreation(paymentDetails);
  };

  const executeSubmitOrder = async () => {
    // When direct submit is clicked, open payment options modal to choose payment mode
    handleOpenPaymentModal();
  };

  const completeOrderCreation = async (paymentDetails = {}) => {
    setSubmittingOrder(true);
    speechService.stopListening();
    setListeningForAnswer(false);

    try {
      const finalPaymentMethod = paymentDetails.paymentMethod || paymentMethod || 'Cash';
      const payload = {
        customerName: customerName.trim() || 'Customer',
        items: items.map(it => ({
          productId: it.productId,
          productName: it.productName,
          nameTamil: it.nameTamil,
          nameEnglish: it.nameEnglish,
          displayName: it.displayName,
          quantity: it.quantity,
          unit: it.unit,
          unitPrice: it.unitPrice
        })),
        discount: numDiscount,
        paymentMethod: finalPaymentMethod,
        paymentStatus: paymentDetails.paymentStatus || 'Paid',
        paymentReference: paymentDetails.paymentReference || '',
        upiId: paymentDetails.upiId || '',
        amountReceived: Number(paymentDetails.amountReceived) || grandTotal,
        changeReturned: Number(paymentDetails.changeReturned) || 0,
        razorpayOrderId: paymentDetails.razorpayOrderId || '',
        razorpayPaymentId: paymentDetails.razorpayPaymentId || '',
        razorpaySignature: paymentDetails.razorpaySignature || ''
      };

      const res = await orderAPI.createOrder(payload);
      if (res.data?.success && res.data.data) {
        const order = res.data.data;
        setCompletedOrder(order);
        setConfirmModalOpen(false);
        setShowPaymentModal(false);
        setShowReceiptModal(true);
        setItems([]);
        setCustomerName('');
        setDiscount(0);

        // Play tactile POS bell chime & announce
        playChime('bell');
        announce(`Invoice ${order.invoiceNumber} created. Total ₹${order.grandTotal}`);

        // Refresh products so updated stock levels show immediately
        fetchProducts();

        if (a11y?.autoPrintReceipt) {
          setTimeout(() => {
            window.print();
          }, 350);
        }

        if (ttsEnabled) {
          const successVoice = voiceLang.startsWith('ta')
            ? `ரூபாய் ${order.grandTotal} ${finalPaymentMethod} முறையில் பெறப்பட்டது. பில் எண் ${order.invoiceNumber} தயாராகிவிட்டது!`
            : `Payment of ${order.grandTotal} rupees received via ${finalPaymentMethod}! Invoice ${order.invoiceNumber} generated.`;
          speechService.speak(successVoice, voiceLang);
        }
      }
    } catch (err) {
      playChime('warning');
      const errStock = err.response?.data?.stockErrors;
      if (errStock && errStock.length > 0) {
        const e = errStock[0];
        const errMsg = `${e.nameTamil || e.nameEnglish} stock-la ${e.available} ${e.unit} mattum dhaan irukku!`;
        showToast(errMsg, 'error');
        announce(errMsg);
        if (ttsEnabled) speechService.speak(errMsg, voiceLang);
      } else {
        showToast(err.response?.data?.message || 'Error saving order', 'error');
        announce(err.response?.data?.message || 'Error saving order');
      }
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
                  <option value="Razorpay">⚡ Razorpay (UPI QR, GPay, PhonePe, Card, NetBanking)</option>
                  <option value="UPI">📱 Direct UPI / QR Scan</option>
                  <option value="Card">💳 POS Card Machine</option>
                  <option value="Other">Other / Credit (கடன்)</option>
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

            {/* Payment Mode Badge - Clickable to open payment selection */}
            <div
              onClick={() => handleOpenPaymentModal('upi_qr')}
              style={{
                marginTop: '16px',
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Click to choose payment options"
            >
              <span style={{ color: '#64748b' }}>Payment Mode:</span>
              <span style={{ fontWeight: '700', color: '#2563eb', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>{paymentMethod}</span>
                <span style={{ fontSize: '11px', textDecoration: 'underline' }}>• Choose Option</span>
              </span>
            </div>

            {/* Primary Action Buttons */}
            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => handleOpenPaymentModal('upi_qr')}
                disabled={items.length === 0 || hasStockErrors}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '14px',
                  fontSize: '15px',
                  fontWeight: '700',
                  borderRadius: '10px',
                  background: hasStockErrors ? '#94a3b8' : 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                  boxShadow: hasStockErrors ? 'none' : '0 4px 14px rgba(22, 163, 74, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <ShoppingBag size={18} />
                <span>Confirm & Pay Bill (பணம் செலுத்து)</span>
              </button>

              <button
                onClick={handleOpenVoiceConfirm}
                disabled={items.length === 0 || hasStockErrors}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  borderRadius: '10px',
                  backgroundColor: '#ffffff',
                  color: hasStockErrors ? '#94a3b8' : '#2563eb',
                  border: '1.5px solid #bfdbfe',
                  cursor: hasStockErrors ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Volume2 size={17} />
                <span>Voice Confirm Bill (குரல் உறுதி செய்)</span>
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
      {/* PAYMENT OPTIONS MODAL (UPI SCANNER / UPI ID / CASH / CARD) */}
      {/* ---------------------------------------------------- */}
      {showPaymentModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '560px',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#f8fafc'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                    Select Payment Option
                  </h3>
                  <span style={{ fontSize: '12px', color: '#16a34a', backgroundColor: '#dcfce7', padding: '2px 8px', borderRadius: '6px', fontWeight: '700' }}>
                    பணம் செலுத்து
                  </span>
                </div>
                <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>
                  Customer: <strong>{customerName || 'Walk-in Customer'}</strong> • {items.length} items
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Total Due</div>
                  <div style={{ fontSize: '20px', fontWeight: '900', color: '#2563eb', lineHeight: '1.1' }}>
                    ₹{grandTotal.toFixed(2)}
                  </div>
                </div>

                <button
                  onClick={() => setShowPaymentModal(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '6px',
                    borderRadius: '50%',
                    display: 'flex'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Payment Method Selector Tabs */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '6px',
              padding: '12px 16px',
              backgroundColor: '#f1f5f9',
              borderBottom: '1px solid #e2e8f0'
            }}>
              {/* Tab 1: UPI QR Scanner */}
              <button
                type="button"
                onClick={() => setSelectedPaymentOption('upi_qr')}
                style={{
                  padding: '10px 4px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: selectedPaymentOption === 'upi_qr' ? '#ffffff' : 'transparent',
                  color: selectedPaymentOption === 'upi_qr' ? '#2563eb' : '#64748b',
                  fontWeight: selectedPaymentOption === 'upi_qr' ? '700' : '600',
                  boxShadow: selectedPaymentOption === 'upi_qr' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  transition: 'all 0.15s ease'
                }}
              >
                <QrCode size={18} />
                <span>UPI Scanner</span>
              </button>

              {/* Tab 2: UPI ID */}
              <button
                type="button"
                onClick={() => setSelectedPaymentOption('upi_id')}
                style={{
                  padding: '10px 4px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: selectedPaymentOption === 'upi_id' ? '#ffffff' : 'transparent',
                  color: selectedPaymentOption === 'upi_id' ? '#2563eb' : '#64748b',
                  fontWeight: selectedPaymentOption === 'upi_id' ? '700' : '600',
                  boxShadow: selectedPaymentOption === 'upi_id' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  transition: 'all 0.15s ease'
                }}
              >
                <Smartphone size={18} />
                <span>UPI ID</span>
              </button>

              {/* Tab 3: Cash */}
              <button
                type="button"
                onClick={() => {
                  setSelectedPaymentOption('cash');
                  if (!cashReceived) setCashReceived(grandTotal);
                }}
                style={{
                  padding: '10px 4px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: selectedPaymentOption === 'cash' ? '#ffffff' : 'transparent',
                  color: selectedPaymentOption === 'cash' ? '#16a34a' : '#64748b',
                  fontWeight: selectedPaymentOption === 'cash' ? '700' : '600',
                  boxShadow: selectedPaymentOption === 'cash' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  transition: 'all 0.15s ease'
                }}
              >
                <Banknote size={18} />
                <span>Cash</span>
              </button>

              {/* Tab 4: Card / Online */}
              <button
                type="button"
                onClick={() => setSelectedPaymentOption('card')}
                style={{
                  padding: '10px 4px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: selectedPaymentOption === 'card' ? '#ffffff' : 'transparent',
                  color: selectedPaymentOption === 'card' ? '#7c3aed' : '#64748b',
                  fontWeight: selectedPaymentOption === 'card' ? '700' : '600',
                  boxShadow: selectedPaymentOption === 'card' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  transition: 'all 0.15s ease'
                }}
              >
                <CreditCard size={18} />
                <span>Card / Pay</span>
              </button>

              {/* Tab 5: Khata / Credit */}
              <button
                type="button"
                onClick={() => setSelectedPaymentOption('khata')}
                style={{
                  padding: '10px 4px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: selectedPaymentOption === 'khata' ? '#ffffff' : 'transparent',
                  color: selectedPaymentOption === 'khata' ? '#ea580c' : '#64748b',
                  fontWeight: selectedPaymentOption === 'khata' ? '700' : '600',
                  boxShadow: selectedPaymentOption === 'khata' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  transition: 'all 0.15s ease'
                }}
              >
                <FileText size={18} />
                <span>Khata / கடன்</span>
              </button>
            </div>

            {/* Modal Body: Active Tab Content */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              {/* ---------------------------------------------------- */}
              {/* TAB 1: UPI QR SCANNER */}
              {/* ---------------------------------------------------- */}
              {selectedPaymentOption === 'upi_qr' && (
                <div style={{ textAlign: 'center' }}>
                  {/* Standee vs Generated QR Tab / Switcher if standee exists */}
                  {owner?.upiQrImage ? (
                    <div style={{
                      display: 'inline-flex',
                      backgroundColor: '#f1f5f9',
                      padding: '4px',
                      borderRadius: '10px',
                      marginBottom: '14px',
                      gap: '4px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <button
                        type="button"
                        onClick={() => setQrDisplaySource('uploaded')}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '7px',
                          border: 'none',
                          backgroundColor: qrDisplaySource === 'uploaded' ? '#2563eb' : 'transparent',
                          color: qrDisplaySource === 'uploaded' ? '#ffffff' : '#64748b',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <ImageIcon size={14} />
                        <span>My Official Shop Standee QR</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setQrDisplaySource('generated')}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '7px',
                          border: 'none',
                          backgroundColor: qrDisplaySource === 'generated' ? '#2563eb' : 'transparent',
                          color: qrDisplaySource === 'generated' ? '#ffffff' : '#64748b',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <QrCode size={14} />
                        <span>Dynamic Live UPI QR</span>
                      </button>
                    </div>
                  ) : null}

                  {/* Official Razorpay Dynamic UPI QR Launcher Card */}
                  <div style={{
                    maxWidth: '380px',
                    margin: '0 auto 16px auto',
                    padding: '12px 16px',
                    backgroundColor: '#faf5ff',
                    border: '1.5px solid #d8b4fe',
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    textAlign: 'left',
                    boxShadow: '0 2px 10px rgba(124, 58, 237, 0.08)'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '800', color: '#581c87' }}>
                          ⚡ Official Razorpay UPI QR
                        </span>
                        <span style={{ fontSize: '10px', fontWeight: '800', backgroundColor: '#7c3aed', color: '#ffffff', padding: '1px 6px', borderRadius: '4px' }}>
                          VERIFIED
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#6b21a8', marginTop: '2px' }}>
                        Generates a certified UPI QR code. Valid on GPay, PhonePe, Paytm with auto-verification!
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={submittingOrder}
                      onClick={() => handleConfirmPayment({ paymentMethod: 'Razorpay' })}
                      style={{
                        backgroundColor: '#7c3aed',
                        color: '#ffffff',
                        border: 'none',
                        padding: '9px 14px',
                        borderRadius: '9px',
                        fontSize: '12px',
                        fontWeight: '800',
                        cursor: submittingOrder ? 'not-allowed' : 'pointer',
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 8px rgba(124, 58, 237, 0.25)',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#6d28d9'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#7c3aed'}
                    >
                      <ExternalLink size={14} />
                      <span>Launch QR</span>
                    </button>
                  </div>

                  {/* QR Card Container */}
                  <div style={{
                    display: 'inline-block',
                    padding: '16px',
                    backgroundColor: '#ffffff',
                    border: '2px solid #2563eb',
                    borderRadius: '20px',
                    boxShadow: '0 8px 30px rgba(37, 99, 235, 0.14)',
                    marginBottom: '14px',
                    position: 'relative',
                    maxWidth: '280px'
                  }}>
                    {/* Badge on top */}
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      backgroundColor: '#ecfdf5',
                      border: '1px solid #a7f3d0',
                      color: '#059669',
                      fontSize: '11px',
                      fontWeight: '800',
                      marginBottom: '10px'
                    }}>
                      <ShieldCheck size={13} />
                      <span>{qrDisplaySource === 'uploaded' && owner?.upiQrImage ? 'STORE STANDEE VERIFIED' : 'NPCI UNIVERSAL UPI READY'}</span>
                    </div>

                    {/* QR Display: Uploaded vs Generated */}
                    {qrDisplaySource === 'uploaded' && owner?.upiQrImage ? (
                      <div style={{ position: 'relative' }}>
                        <img
                          src={owner.upiQrImage}
                          alt="Store Counter Standee QR Code"
                          style={{
                            width: '210px',
                            height: '210px',
                            objectFit: 'contain',
                            display: 'block',
                            margin: '0 auto',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0'
                          }}
                        />
                      </div>
                    ) : (
                      <div style={{ position: 'relative' }}>
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
                            qrMode === 'amount_locked'
                              ? `upi://pay?pa=${encodeURIComponent(owner?.upiId || 'anusabari273@okhdfcbank')}&pn=${encodeURIComponent((owner?.shopName || 'Smart Grocery').replace(/[^a-zA-Z0-9 ]/g, '').trim())}&am=${grandTotal.toFixed(2)}&cu=INR&tn=${encodeURIComponent('Bill ' + Date.now().toString().slice(-4))}`
                              : `upi://pay?pa=${encodeURIComponent(owner?.upiId || 'anusabari273@okhdfcbank')}&pn=${encodeURIComponent((owner?.shopName || 'Smart Grocery').replace(/[^a-zA-Z0-9 ]/g, '').trim())}&cu=INR`
                          )}&margin=8`}
                          alt="Universal UPI Payment QR Code"
                          style={{
                            width: '210px',
                            height: '210px',
                            display: 'block',
                            margin: '0 auto',
                            borderRadius: '12px'
                          }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div style={{
                          display: 'none',
                          width: '210px',
                          height: '210px',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#f8fafc',
                          borderRadius: '12px',
                          color: '#2563eb',
                          margin: '0 auto'
                        }}>
                          <QrCode size={64} />
                          <span style={{ fontSize: '12px', fontWeight: '700', marginTop: '8px' }}>
                            UPI QR Ready
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Amount to pay banner */}
                    <div style={{
                      marginTop: '10px',
                      padding: '6px 10px',
                      backgroundColor: '#f0fdf4',
                      borderRadius: '8px',
                      border: '1px solid #bbf7d0'
                    }}>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: '#15803d' }}>
                        SCAN WITH ANY APP & PAY
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: '900', color: '#16a34a' }}>
                        ₹{grandTotal.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* UPI Apps Supported Pills */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    marginBottom: '12px',
                    flexWrap: 'wrap'
                  }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#334155', backgroundColor: '#f1f5f9', padding: '3px 8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      Google Pay
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#334155', backgroundColor: '#f1f5f9', padding: '3px 8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      PhonePe
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#334155', backgroundColor: '#f1f5f9', padding: '3px 8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      Paytm
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#334155', backgroundColor: '#f1f5f9', padding: '3px 8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      BHIM UPI
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#334155', backgroundColor: '#f1f5f9', padding: '3px 8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      CRED / Bank
                    </span>
                  </div>

                  {/* QR Mode Switcher (Universal vs Amount-Locked) */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    fontSize: '11.5px',
                    color: '#475569',
                    marginBottom: '14px',
                    flexWrap: 'wrap'
                  }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontWeight: qrMode === 'universal' ? '700' : '500', color: qrMode === 'universal' ? '#2563eb' : '#64748b' }}>
                      <input
                        type="radio"
                        name="qrModeChoice"
                        checked={qrMode === 'universal'}
                        onChange={() => setQrMode('universal')}
                      />
                      <span>Universal Mode (Recommended - All Apps)</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontWeight: qrMode === 'amount_locked' ? '700' : '500', color: qrMode === 'amount_locked' ? '#2563eb' : '#64748b' }}>
                      <input
                        type="radio"
                        name="qrModeChoice"
                        checked={qrMode === 'amount_locked'}
                        onChange={() => setQrMode('amount_locked')}
                      />
                      <span>Lock Bill Amount (Merchant Only)</span>
                    </label>
                  </div>

                  {/* Hidden File Input for Standee QR Upload */}
                  <input
                    type="file"
                    ref={qrFileInputRef}
                    onChange={handleQrImageUpload}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />

                  {/* Owner UPI ID / Code Card with Edit and Standee Upload */}
                  <div style={{
                    backgroundColor: '#eff6ff',
                    border: '1.5px solid #bfdbfe',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    marginBottom: '14px',
                    textAlign: 'left'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Store Owner Code (UPI ID)
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: '800', color: '#1e3a8a', marginTop: '2px' }}>
                          {owner?.upiId || 'anusabari273@okhdfcbank'}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        {/* Copy Button */}
                        <button
                          type="button"
                          onClick={() => {
                            const upi = owner?.upiId || 'anusabari273@okhdfcbank';
                            navigator.clipboard?.writeText(upi);
                            setUpiCopied(true);
                            showToast(`Copied UPI ID "${upi}"!`, 'success');
                            setTimeout(() => setUpiCopied(false), 2500);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            border: '1px solid #bfdbfe',
                            background: '#ffffff',
                            color: '#2563eb',
                            padding: '5px 9px',
                            borderRadius: '7px',
                            fontSize: '11px',
                            fontWeight: '700',
                            cursor: 'pointer'
                          }}
                        >
                          {upiCopied ? <Check size={13} color="#16a34a" /> : <Copy size={13} />}
                          <span>{upiCopied ? 'Copied' : 'Copy'}</span>
                        </button>

                        {/* Edit Owner Code Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setCustomOwnerUpi(owner?.upiId || 'anusabari273@okhdfcbank');
                            setIsEditingOwnerUpi(!isEditingOwnerUpi);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            border: '1px solid #2563eb',
                            background: isEditingOwnerUpi ? '#2563eb' : '#ffffff',
                            color: isEditingOwnerUpi ? '#ffffff' : '#2563eb',
                            padding: '5px 9px',
                            borderRadius: '7px',
                            fontSize: '11px',
                            fontWeight: '700',
                            cursor: 'pointer'
                          }}
                        >
                          <Edit2 size={13} />
                          <span>{isEditingOwnerUpi ? 'Close' : 'Edit Owner Code'}</span>
                        </button>

                        {/* Upload Standee Photo Button */}
                        <button
                          type="button"
                          onClick={() => qrFileInputRef.current?.click()}
                          disabled={uploadingQrImage}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            border: '1px solid #10b981',
                            background: '#ecfdf5',
                            color: '#059669',
                            padding: '5px 9px',
                            borderRadius: '7px',
                            fontSize: '11px',
                            fontWeight: '700',
                            cursor: uploadingQrImage ? 'not-allowed' : 'pointer'
                          }}
                        >
                          <Upload size={13} />
                          <span>{uploadingQrImage ? 'Uploading...' : (owner?.upiQrImage ? 'Replace Standee' : 'Upload Standee QR')}</span>
                        </button>

                        {owner?.upiQrImage && (
                          <button
                            type="button"
                            onClick={handleRemoveQrImage}
                            title="Remove uploaded standee image"
                            style={{
                              border: '1px solid #fecaca',
                              background: '#fff1f2',
                              color: '#e11d48',
                              padding: '5px 8px',
                              borderRadius: '7px',
                              fontSize: '11px',
                              fontWeight: '700',
                              cursor: 'pointer'
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Inline Owner Code Editor */}
                    {isEditingOwnerUpi && (
                      <form onSubmit={handleSaveOwnerUpi} style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed #bfdbfe' }}>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: '#1e40af', marginBottom: '4px' }}>
                          Enter Your Shop Owner UPI ID / VPA:
                        </label>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <input
                            type="text"
                            value={customOwnerUpi}
                            onChange={(e) => setCustomOwnerUpi(e.target.value)}
                            placeholder="e.g. anusabari273@okhdfcbank or 9876543210@paytm"
                            style={{
                              flex: 1,
                              padding: '7px 10px',
                              borderRadius: '7px',
                              border: '1.5px solid #2563eb',
                              fontSize: '13px',
                              fontWeight: '700',
                              color: '#1e3a8a'
                            }}
                          />
                          <button
                            type="submit"
                            disabled={savingOwnerUpi}
                            style={{
                              padding: '7px 14px',
                              backgroundColor: '#2563eb',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '7px',
                              fontSize: '12px',
                              fontWeight: '700',
                              cursor: savingOwnerUpi ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <CheckCheck size={14} />
                            <span>{savingOwnerUpi ? 'Saving...' : 'Save & Update'}</span>
                          </button>
                        </div>

                        {/* Quick Handle Suggestions */}
                        <div style={{ display: 'flex', gap: '5px', marginTop: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                          <span style={{ fontSize: '10.5px', color: '#64748b' }}>Quick handles:</span>
                          {['@okhdfcbank', '@oksbi', '@okaxis', '@okicici', '@paytm', '@ybl'].map((h) => (
                            <button
                              key={h}
                              type="button"
                              onClick={() => {
                                const base = customOwnerUpi.includes('@') ? customOwnerUpi.split('@')[0] : customOwnerUpi;
                                setCustomOwnerUpi((base || 'yourname') + h);
                              }}
                              style={{
                                fontSize: '10px',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                border: '1px solid #cbd5e1',
                                background: '#ffffff',
                                color: '#475569',
                                cursor: 'pointer',
                                fontWeight: '600'
                              }}
                            >
                              {h}
                            </button>
                          ))}
                        </div>
                      </form>
                    )}
                  </div>

                  {/* Why was my QR invalid? Explainer Card */}
                  <div style={{
                    backgroundColor: '#fffbeb',
                    border: '1px solid #fef3c7',
                    borderRadius: '10px',
                    padding: '8px 12px',
                    marginBottom: '16px',
                    textAlign: 'left'
                  }}>
                    <button
                      type="button"
                      onClick={() => setShowQrExplanation(!showQrExplanation)}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        cursor: 'pointer',
                        color: '#b45309',
                        fontSize: '11.5px',
                        fontWeight: '700'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Info size={14} />
                        <span>Why did Google Pay or PhonePe show "QR code is invalid"?</span>
                      </div>
                      <span style={{ fontSize: '13px' }}>{showQrExplanation ? '▲' : '▼'}</span>
                    </button>

                    {showQrExplanation && (
                      <div style={{ marginTop: '8px', fontSize: '11px', color: '#92400e', lineHeight: '1.5' }}>
                        <p style={{ margin: '0 0 6px 0' }}>
                          <strong>NPCI Banking Security Rule:</strong> Personal UPI accounts (such as <code>@okhdfcbank</code>, <code>@oksbi</code>, <code>@okaxis</code>) are classified as individual accounts. When an amount (e.g. ₹488) is hardcoded into the QR for a personal account, Google Pay and PhonePe automatically reject it as "invalid QR" because individual accounts cannot act as merchant terminals.
                        </p>
                        <p style={{ margin: 0 }}>
                          <strong>The Solutions:</strong>
                          <br />
                          1. <strong>⚡ Razorpay Dynamic QR (Above):</strong> Click the violet <strong>"Launch QR"</strong> button above to open Razorpay's official merchant gateway with a certified QR code. Works on all UPI apps with automatic payment verification!
                          <br />
                          2. <strong>Upload Standee QR:</strong> Take a photo of your physical Google Pay / PhonePe counter standee and upload it.
                          <br />
                          3. <strong>Universal Mode:</strong> Generates a clean UPI link without amount locks so PhonePe & GPay won't reject it.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Optional UPI Ref / UTR number input */}
                  <div style={{ textAlign: 'left', marginBottom: '18px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                      UPI UTR / Reference No. (Optional):
                    </label>
                    <input
                      type="text"
                      value={upiRefNumber}
                      onChange={(e) => setUpiRefNumber(e.target.value)}
                      placeholder="e.g. 408271892831 or Last 4 digits"
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        color: '#1e293b'
                      }}
                    />
                  </div>

                  {/* Primary Confirm Button */}
                  <button
                    type="button"
                    disabled={submittingOrder}
                    onClick={() => handleConfirmPayment({
                      paymentMethod: 'UPI - QR Scanner',
                      paymentStatus: 'Paid',
                      paymentReference: upiRefNumber.trim() || `UPI-QR-${Date.now().toString().slice(-6)}`,
                      upiId: owner?.upiId || 'anusabari273@okhdfcbank'
                    })}
                    style={{
                      width: '100%',
                      backgroundColor: '#16a34a',
                      color: '#ffffff',
                      border: 'none',
                      padding: '14px',
                      borderRadius: '12px',
                      fontSize: '15px',
                      fontWeight: '800',
                      cursor: submittingOrder ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 14px rgba(22, 163, 74, 0.3)',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#15803d'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#16a34a'}
                  >
                    <CheckCircle2 size={18} />
                    <span>{submittingOrder ? 'Processing...' : `Payment Received via Scanner (₹${grandTotal.toFixed(2)})`}</span>
                  </button>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* TAB 2: UPI ID (COLLECT REQUEST) */}
              {/* ---------------------------------------------------- */}
              {selectedPaymentOption === 'upi_id' && (
                <div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#1e293b', marginBottom: '6px' }}>
                      Customer UPI ID / VPA (வாடிக்கையாளர் UPI):
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Smartphone size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type="text"
                        value={customerUpiId}
                        onChange={(e) => {
                          setCustomerUpiId(e.target.value);
                          setCollectRequestSent(false);
                        }}
                        placeholder="e.g. mobile@paytm or name@okaxis"
                        style={{
                          width: '100%',
                          padding: '11px 14px 11px 36px',
                          borderRadius: '10px',
                          border: '1px solid #cbd5e1',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#1e293b'
                        }}
                      />
                    </div>
                  </div>

                  {/* Quick Suffix Chips */}
                  <div style={{ marginBottom: '18px' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginBottom: '6px' }}>
                      Quick Handlers:
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {['@okaxis', '@okhdfcbank', '@paytm', '@ybl', '@upi', '@ibl'].map((suffix) => (
                        <button
                          key={suffix}
                          type="button"
                          onClick={() => {
                            const base = customerUpiId.includes('@') ? customerUpiId.split('@')[0] : customerUpiId;
                            setCustomerUpiId((base || 'customer') + suffix);
                          }}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            backgroundColor: '#f8fafc',
                            fontSize: '11px',
                            fontWeight: '600',
                            color: '#334155',
                            cursor: 'pointer'
                          }}
                        >
                          {suffix}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Send Collect Request Button */}
                  <button
                    type="button"
                    disabled={!customerUpiId || !customerUpiId.includes('@')}
                    onClick={() => {
                      setCollectRequestSent(true);
                      showToast(`Payment request of ₹${grandTotal} sent to ${customerUpiId}!`, 'success');
                      if (ttsEnabled) {
                        speechService.speak(`Payment request of ₹${grandTotal} sent to ${customerUpiId}`, voiceLang);
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '11px',
                      borderRadius: '10px',
                      border: '1px solid #2563eb',
                      backgroundColor: '#eff6ff',
                      color: '#2563eb',
                      fontSize: '13.5px',
                      fontWeight: '700',
                      cursor: (!customerUpiId || !customerUpiId.includes('@')) ? 'not-allowed' : 'pointer',
                      opacity: (!customerUpiId || !customerUpiId.includes('@')) ? 0.5 : 1,
                      marginBottom: '16px'
                    }}
                  >
                    📲 Send UPI Collect Request (பணம் கோரு)
                  </button>

                  {/* Collect Request Status Banner */}
                  {collectRequestSent && (
                    <div style={{
                      padding: '14px',
                      borderRadius: '12px',
                      backgroundColor: '#f0fdf4',
                      border: '1.5px solid #86efac',
                      marginBottom: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <div style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: '#16a34a',
                        boxShadow: '0 0 0 4px rgba(22, 163, 74, 0.2)'
                      }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#15803d' }}>
                          Collect Request Sent to {customerUpiId}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#166534', marginTop: '2px' }}>
                          Customer will approve the ₹{grandTotal.toFixed(2)} payment in their UPI app.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Primary Confirm Button */}
                  <button
                    type="button"
                    disabled={submittingOrder}
                    onClick={() => handleConfirmPayment({
                      paymentMethod: 'UPI - ID',
                      paymentStatus: 'Paid',
                      paymentReference: `COLLECT-${Date.now().toString().slice(-6)}`,
                      upiId: customerUpiId.trim() || 'customer@upi'
                    })}
                    style={{
                      width: '100%',
                      backgroundColor: '#16a34a',
                      color: '#ffffff',
                      border: 'none',
                      padding: '14px',
                      borderRadius: '12px',
                      fontSize: '15px',
                      fontWeight: '800',
                      cursor: submittingOrder ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 14px rgba(22, 163, 74, 0.3)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#15803d'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#16a34a'}
                  >
                    <CheckCircle2 size={18} />
                    <span>{submittingOrder ? 'Processing...' : `Confirm UPI Payment Received (₹${grandTotal.toFixed(2)})`}</span>
                  </button>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* TAB 3: CASH PAYMENT */}
              {/* ---------------------------------------------------- */}
              {selectedPaymentOption === 'cash' && (
                <div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px',
                    borderRadius: '12px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    marginBottom: '16px'
                  }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Grand Total Due</div>
                      <div style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a' }}>
                        ₹{grandTotal.toFixed(2)}
                      </div>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#16a34a', backgroundColor: '#dcfce7', padding: '4px 10px', borderRadius: '8px' }}>
                      Cash Sale / ரொக்கம்
                    </span>
                  </div>

                  {/* Cash Received Input */}
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#1e293b', marginBottom: '6px' }}>
                      Cash Received from Customer (பெற்ற தொகை):
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontWeight: '700', color: '#64748b' }}>₹</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={cashReceived}
                        onChange={(e) => setCashReceived(e.target.value)}
                        placeholder={grandTotal.toString()}
                        autoFocus
                        style={{
                          width: '100%',
                          padding: '12px 14px 12px 34px',
                          borderRadius: '10px',
                          border: '2px solid #3b82f6',
                          fontSize: '18px',
                          fontWeight: '800',
                          color: '#1e293b',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  {/* Quick Preset Cash Chips */}
                  <div style={{ marginBottom: '18px' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginBottom: '6px' }}>
                      Quick Amounts:
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {[
                        { label: 'Exact', val: grandTotal },
                        { label: `₹${Math.ceil(grandTotal / 50) * 50 || grandTotal}`, val: Math.ceil(grandTotal / 50) * 50 || grandTotal },
                        { label: `₹${Math.ceil(grandTotal / 100) * 100 || grandTotal}`, val: Math.ceil(grandTotal / 100) * 100 || grandTotal },
                        { label: '₹500', val: 500 },
                        { label: '₹1000', val: 1000 },
                        { label: '₹2000', val: 2000 }
                      ]
                        .filter((item, idx, arr) => arr.findIndex(x => x.val === item.val) === idx && item.val >= grandTotal)
                        .slice(0, 5)
                        .map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setCashReceived(preset.val)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '8px',
                              border: Number(cashReceived) === preset.val ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                              backgroundColor: Number(cashReceived) === preset.val ? '#eff6ff' : '#ffffff',
                              color: Number(cashReceived) === preset.val ? '#2563eb' : '#334155',
                              fontSize: '12px',
                              fontWeight: '700',
                              cursor: 'pointer'
                            }}
                          >
                            {preset.label}
                          </button>
                        ))}
                    </div>
                  </div>

                  {/* Return Change Calculation Banner */}
                  {Number(cashReceived) >= grandTotal ? (
                    <div style={{
                      padding: '14px 18px',
                      borderRadius: '12px',
                      backgroundColor: '#f0fdf4',
                      border: '1.5px solid #86efac',
                      marginBottom: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#166534' }}>
                          Change to Return (மீதி சில்லறை)
                        </div>
                        <div style={{ fontSize: '11px', color: '#4b5563' }}>
                          Customer tender: ₹{Number(cashReceived).toFixed(2)}
                        </div>
                      </div>
                      <div style={{ fontSize: '24px', fontWeight: '900', color: '#15803d' }}>
                        ₹{(Number(cashReceived) - grandTotal).toFixed(2)}
                      </div>
                    </div>
                  ) : Number(cashReceived) > 0 ? (
                    <div style={{
                      padding: '12px 16px',
                      borderRadius: '10px',
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fecaca',
                      color: '#dc2626',
                      marginBottom: '20px',
                      fontSize: '13px',
                      fontWeight: '700',
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}>
                      <span>Remaining Balance Due:</span>
                      <span>₹{(grandTotal - Number(cashReceived)).toFixed(2)}</span>
                    </div>
                  ) : null}

                  {/* Primary Confirm Button */}
                  <button
                    type="button"
                    disabled={submittingOrder}
                    onClick={() => handleConfirmPayment({
                      paymentMethod: 'Cash',
                      paymentStatus: 'Paid',
                      amountReceived: Number(cashReceived) || grandTotal,
                      changeReturned: Math.max(0, (Number(cashReceived) || grandTotal) - grandTotal)
                    })}
                    style={{
                      width: '100%',
                      backgroundColor: '#16a34a',
                      color: '#ffffff',
                      border: 'none',
                      padding: '14px',
                      borderRadius: '12px',
                      fontSize: '15px',
                      fontWeight: '800',
                      cursor: submittingOrder ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 14px rgba(22, 163, 74, 0.3)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#15803d'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#16a34a'}
                  >
                    <CheckCircle2 size={18} />
                    <span>{submittingOrder ? 'Processing...' : `Accept Cash & Complete Bill (₹${grandTotal.toFixed(2)})`}</span>
                  </button>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* TAB 4: CARD / RAZORPAY GATEWAY */}
              {/* ---------------------------------------------------- */}
              {selectedPaymentOption === 'card' && (
                <div>
                  <div style={{
                    padding: '16px',
                    borderRadius: '14px',
                    backgroundColor: '#faf5ff',
                    border: '1.5px solid #d8b4fe',
                    marginBottom: '18px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <CreditCard size={20} color="#7c3aed" />
                      <div style={{ fontSize: '14px', fontWeight: '800', color: '#581c87' }}>
                        Razorpay Online Gateway & Card Payment
                      </div>
                    </div>
                    <p style={{ fontSize: '12.5px', color: '#6b21a8', margin: '0 0 14px 0', lineHeight: '1.4' }}>
                      Accept Debit Cards, Credit Cards, NetBanking, and Instant UPI via integrated Razorpay gateway.
                    </p>

                    <button
                      type="button"
                      disabled={submittingOrder}
                      onClick={() => handleConfirmPayment({ paymentMethod: 'Razorpay' })}
                      style={{
                        width: '100%',
                        backgroundColor: '#7c3aed',
                        color: '#ffffff',
                        border: 'none',
                        padding: '12px',
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#6d28d9'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#7c3aed'}
                    >
                      <ExternalLink size={16} />
                      <span>Launch Razorpay Checkout (₹{grandTotal.toFixed(2)})</span>
                    </button>
                  </div>

                  {/* Manual POS Card Swipe Terminal option */}
                  <div style={{
                    padding: '14px',
                    borderRadius: '12px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    marginBottom: '16px'
                  }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', marginBottom: '6px' }}>
                      Or Offline POS Terminal (Card Swiped at Shop):
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input
                        type="text"
                        maxLength={4}
                        value={cardLastFour}
                        onChange={(e) => setCardLastFour(e.target.value.replace(/\D/g, ''))}
                        placeholder="Card Last 4 Digits"
                        style={{
                          flex: 1,
                          padding: '9px 12px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '13px'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleConfirmPayment({
                          paymentMethod: 'Card',
                          paymentStatus: 'Paid',
                          paymentReference: cardLastFour ? `CARD-XXXX-${cardLastFour}` : 'POS-SWIPE'
                        })}
                        style={{
                          padding: '9px 16px',
                          borderRadius: '8px',
                          backgroundColor: '#334155',
                          color: '#ffffff',
                          border: 'none',
                          fontSize: '13px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        Confirm Swiped
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* TAB 5: KHATA / SHOP CREDIT */}
              {/* ---------------------------------------------------- */}
              {selectedPaymentOption === 'khata' && (
                <div>
                  <div style={{
                    padding: '16px',
                    borderRadius: '14px',
                    backgroundColor: '#fff7ed',
                    border: '1.5px solid #fdba74',
                    marginBottom: '20px'
                  }}>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#9a3412', marginBottom: '6px' }}>
                      Add to Customer Khata (கடன் பற்று)
                    </div>
                    <p style={{ fontSize: '12.5px', color: '#c2410c', margin: '0 0 10px 0' }}>
                      Record this ₹{grandTotal.toFixed(2)} bill under the customer's credit ledger for later settlement.
                    </p>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#7c2d12' }}>
                      Customer: {customerName.trim() || 'Warning: Please provide customer name'}
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={submittingOrder}
                    onClick={() => handleConfirmPayment({
                      paymentMethod: 'Khata / Credit',
                      paymentStatus: 'Pending',
                      paymentReference: 'KHATA-LEDGER'
                    })}
                    style={{
                      width: '100%',
                      backgroundColor: '#ea580c',
                      color: '#ffffff',
                      border: 'none',
                      padding: '14px',
                      borderRadius: '12px',
                      fontSize: '15px',
                      fontWeight: '800',
                      cursor: submittingOrder ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 14px rgba(234, 88, 12, 0.3)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c2410c'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ea580c'}
                  >
                    <CheckCircle2 size={18} />
                    <span>{submittingOrder ? 'Recording...' : `Record on Khata (₹${grandTotal.toFixed(2)})`}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer helper */}
            <div style={{
              padding: '12px 24px',
              backgroundColor: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              fontSize: '11px',
              color: '#94a3b8',
              textAlign: 'center'
            }}>
              🔒 Inventory stock will automatically be updated and invoice printed upon confirmation.
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
                  <div style={{ fontWeight: 'bold' }}>Payment Mode: {completedOrder.paymentMethod || 'Cash'}</div>
                  {completedOrder.upiId && (
                    <div style={{ fontSize: '11px', marginTop: '2px' }}>
                      UPI: {completedOrder.upiId}
                    </div>
                  )}
                  {completedOrder.paymentReference && (
                    <div style={{ fontSize: '11px', marginTop: '2px' }}>
                      Ref/UTR: {completedOrder.paymentReference}
                    </div>
                  )}
                  {completedOrder.amountReceived > 0 && completedOrder.amountReceived !== completedOrder.grandTotal && (
                    <div style={{ fontSize: '11px', marginTop: '2px' }}>
                      Recd: ₹{completedOrder.amountReceived.toFixed(2)} | Change: ₹{completedOrder.changeReturned.toFixed(2)}
                    </div>
                  )}
                  {completedOrder.razorpayPaymentId && (
                    <div style={{ fontSize: '11px', fontWeight: 'bold', marginTop: '2px', color: '#000000' }}>
                      Razorpay TXN: {completedOrder.razorpayPaymentId}
                    </div>
                  )}
                  <div style={{ marginTop: '6px', fontWeight: 'bold' }}>Thank You! Visit Again</div>
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
            {completedOrder.razorpayPaymentId && (
              <div style={{ fontSize: '10px', fontWeight: 'bold', marginTop: '2px' }}>
                Razorpay TXN: {completedOrder.razorpayPaymentId}
              </div>
            )}
            <div style={{ fontWeight: 'bold', marginTop: '3px' }}>Thank You! Visit Again</div>
            <div>நன்றி! மீண்டும் வருக!</div>
          </div>
        </div>
      )}
    </div>
  );
}
