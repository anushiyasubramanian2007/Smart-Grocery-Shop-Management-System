import { paymentAPI } from '../services/api';

/**
 * Dynamically loads the official Razorpay Checkout JavaScript SDK
 */
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      console.warn('Failed to load Razorpay SDK from official CDN');
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

/**
 * Initiates Razorpay Standard Web Checkout
 */
export const processRazorpayPayment = async ({
  amount,
  invoiceNumber,
  customerName = 'Customer',
  customerPhone = '',
  shopName = 'Smart Grocery Store',
  onSuccess,
  onError,
  onDismiss
}) => {
  try {
    const isLoaded = await loadRazorpayScript();
    if (!isLoaded) {
      throw new Error('Razorpay Checkout SDK failed to load. Please check your internet connection.');
    }

    // Convert bill amount from Rupees to paise (Razorpay API requires amount in paise: ₹1 = 100 paise)
    const rawNum = Number(amount);
    const amountInPaise = Math.round(rawNum * 100);

    // 1. Create order on backend (calls POST /api/create-order)
    const orderRes = await paymentAPI.createOrder({
      amount: amountInPaise,
      currency: 'INR',
      receipt: invoiceNumber || `rcpt_${Date.now()}`
    });

    if (!orderRes.data?.success || (!orderRes.data?.order_id && !orderRes.data?.order?.id)) {
      throw new Error(orderRes.data?.message || 'Could not initiate Razorpay order');
    }

    const orderId = orderRes.data.order_id || orderRes.data.order?.id;
    const orderAmount = orderRes.data.amount || orderRes.data.order?.amount || amountInPaise;
    const orderCurrency = orderRes.data.currency || orderRes.data.order?.currency || 'INR';
    const keyId = orderRes.data.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TkFe6faGMXbM8W';
    const configId =
      orderRes.data.configId ||
      orderRes.data.config_id ||
      import.meta.env.VITE_RAZORPAY_CONFIG_ID;

    // A config_id only works with the Key ID from the EXACT same Razorpay account.
    // If the default demo test key is active, do not attach custom config_id to avoid "Authentication failed".
    const isCustomMerchantAccount = keyId && keyId !== 'rzp_test_TkFe6faGMXbM8W';
    const activeConfigId = isCustomMerchantAccount ? configId : null;

    // 2. Open official Razorpay Checkout Modal
    const options = {
      key: keyId,
      amount: orderAmount,
      currency: orderCurrency,
      name: shopName,
      description: `Grocery Bill Payment ${invoiceNumber ? `(${invoiceNumber})` : ''}`,
      image: 'https://cdn-icons-png.flaticon.com/512/3724/3724720.png',
      order_id: orderId,
      ...(activeConfigId ? { config_id: activeConfigId } : {}),
      prefill: {
        name: customerName !== 'Customer' ? customerName : '',
        contact: customerPhone || ''
      },
      notes: {
        invoice: invoiceNumber || 'POS'
      },
      theme: {
        color: '#2563eb'
      },
      handler: async (response) => {
        try {
          // On success: receives razorpay_payment_id, razorpay_order_id, razorpay_signature
          // Send all three to verify endpoint (POST /api/verify-payment)
          const verifyRes = await paymentAPI.verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
          });

          if (verifyRes.data?.success && verifyRes.data?.verified) {
            if (onSuccess) {
              onSuccess({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                method: 'Razorpay'
              });
            }
          } else {
            throw new Error(verifyRes.data?.message || 'Payment signature verification failed');
          }
        } catch (vErr) {
          if (onError) onError(vErr);
        }
      },
      modal: {
        ondismiss: () => {
          if (onDismiss) onDismiss();
        }
      }
    };

    const rzpInstance = new window.Razorpay(options);

    // Error Handling: payment.failed event
    rzpInstance.on('payment.failed', function (failRes) {
      if (onError) {
        onError(new Error(failRes.error?.description || failRes.error?.reason || 'Payment failed'));
      }
    });

    rzpInstance.open();
  } catch (err) {
    if (onError) {
      onError(err);
    }
  }
};

export default {
  loadRazorpayScript,
  processRazorpayPayment
};
