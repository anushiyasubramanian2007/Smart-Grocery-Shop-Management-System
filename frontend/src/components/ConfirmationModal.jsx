import React, { useEffect, useState } from 'react';
import { Check, X, Mic, AlertCircle, Volume2 } from 'lucide-react';
import speechService from '../utils/speech';

export default function ConfirmationModal({
  isOpen,
  parsedCommand,
  language = 'ta-IN',
  onConfirm,
  onCancel,
  loading
}) {
  const [listeningForAnswer, setListeningForAnswer] = useState(false);
  const [isSpeakingPrompt, setIsSpeakingPrompt] = useState(false);

  useEffect(() => {
    if (isOpen && parsedCommand) {
      // Step 1: Speak the confirmation prompt out loud first
      if (parsedCommand.ttsMessage) {
        setIsSpeakingPrompt(true);
        speechService.speak(parsedCommand.ttsMessage, language, () => {
          setIsSpeakingPrompt(false);
          // Step 2: After speaking finishes, listen for "Yes" or "No" voice confirmation
          startAnswerListener();
        });
      } else {
        startAnswerListener();
      }
    }

    return () => {
      speechService.stopListening();
      speechService.stopSpeaking();
      setListeningForAnswer(false);
      setIsSpeakingPrompt(false);
    };
  }, [isOpen, parsedCommand, language]);

  const startAnswerListener = () => {
    if (!speechService.hasSpeechRecognition()) return;
    setListeningForAnswer(true);

    speechService.startListening({
      lang: language,
      onResult: (text) => {
        const clean = text.trim().toLowerCase();
        const isYes =
          /^(yes|aam|ama|aama|sari|seri|correct|confirm|save|save pannu|save pannunga|kandippa|ok|okay|yes save|haan|sahi|theek hai)$/i.test(clean) ||
          clean.includes('save') || clean.includes('confirm') || clean.includes('sari') || clean.includes('seri') ||
          clean.includes('aama') || clean.includes('kandippa') ||
          clean.includes('ஆம்') || clean.includes('சரி') || clean.includes('சேமி') || clean.includes('ஆமா') ||
          clean.includes('हाँ') || clean.includes('हां');

        const isNo =
          /^(no|vendaam|vendam|venaam|venam|cancel|illai|ila|stop|dont|nahi|mat karo)$/i.test(clean) ||
          clean.includes('cancel') || clean.includes('vendam') || clean.includes('vendaam') || clean.includes('venaam') ||
          clean.includes('illai') || clean.includes('வேண்டாம்') || clean.includes('இல்லை') || clean.includes('ரத்து') || clean.includes('வேணாம்') ||
          clean.includes('नहीं');

        if (isYes) {
          setListeningForAnswer(false);
          onConfirm();
        } else if (isNo) {
          setListeningForAnswer(false);
          onCancel();
        }
      },
      onError: () => {
        setListeningForAnswer(false);
      },
      onEnd: () => {
        setListeningForAnswer(false);
      }
    });
  };

  if (!isOpen || !parsedCommand) return null;

  const { action, productName, quantity, unit, totalPurchasePrice, sellingPrice, totalAmount, category, amount } = parsedCommand;

  const getActionColor = () => {
    if (action?.includes('PURCHASE')) return { bg: '#dbeafe', text: '#2563eb', border: '#bfdbfe' };
    if (action?.includes('SALE')) return { bg: '#dcfce7', text: '#16a34a', border: '#bbf7d0' };
    return { bg: '#ffedd5', text: '#ea580c', border: '#fed7aa' };
  };

  const colors = getActionColor();

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '18px',
        width: '100%',
        maxWidth: '460px',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
        textAlign: 'center',
        animation: 'fadeIn 0.2s ease-out'
      }}>
        {/* Header Icon */}
        <div style={{
          padding: '28px 24px 16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            backgroundColor: colors.bg,
            color: colors.text,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px'
          }}>
            <AlertCircle size={30} />
          </div>

          <span style={{
            backgroundColor: colors.bg,
            color: colors.text,
            fontWeight: '700',
            fontSize: '12px',
            padding: '4px 12px',
            borderRadius: '9999px',
            letterSpacing: '0.5px',
            marginBottom: '8px'
          }}>
            ACTION CONFIRMATION: {action}
          </span>

          <h3 style={{ fontSize: '19px', fontWeight: '700', color: '#0f172a', lineHeight: '1.3' }}>
            {parsedCommand.confirmationMessage || 'Do you want to save this?'}
          </h3>

          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '6px' }}>
            Understood from: <em>"{parsedCommand.originalText}"</em>
          </p>
        </div>

        {/* Structured Details Card */}
        <div style={{
          backgroundColor: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          borderBottom: '1px solid #e2e8f0',
          padding: '16px 24px',
          textAlign: 'left',
          maxHeight: '260px',
          overflowY: 'auto'
        }}>
          {parsedCommand.items && parsedCommand.items.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                Products Identified ({parsedCommand.items.length}):
              </div>
              {parsedCommand.items.map((it, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '13px'
                }}>
                  <div>
                    <strong>{it.displayName || it.nameTamil ? `${it.nameTamil} (${it.nameEnglish || it.productName})` : it.productName}</strong>
                  </div>
                  <div style={{ fontWeight: '700', color: '#2563eb' }}>
                    {it.quantity} {it.unit}
                  </div>
                </div>
              ))}
              {parsedCommand.totalAmount ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
                  <span>Estimated Total:</span>
                  <span>₹{parsedCommand.totalAmount}</span>
                </div>
              ) : null}
            </div>
          ) : action === 'PURCHASE' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
              <div><span style={{ color: '#64748b' }}>Product:</span> <strong>{productName}</strong></div>
              <div><span style={{ color: '#64748b' }}>Quantity:</span> <strong>{quantity} {unit}</strong></div>
              <div><span style={{ color: '#64748b' }}>Total Price:</span> <strong>₹{totalPurchasePrice}</strong></div>
              <div><span style={{ color: '#64748b' }}>Unit Cost:</span> <strong>₹{parsedCommand.purchasePricePerUnit}/{unit}</strong></div>
            </div>
          ) : action === 'SALE' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
              <div><span style={{ color: '#64748b' }}>Product:</span> <strong>{productName}</strong></div>
              <div><span style={{ color: '#64748b' }}>Quantity:</span> <strong>{quantity} {unit}</strong></div>
              <div><span style={{ color: '#64748b' }}>Selling Price:</span> <strong>₹{sellingPrice}/{unit}</strong></div>
              <div><span style={{ color: '#64748b' }}>Total Revenue:</span> <strong>₹{totalAmount}</strong></div>
            </div>
          ) : action === 'EXPENSE' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
              <div><span style={{ color: '#64748b' }}>Category:</span> <strong>{category}</strong></div>
              <div><span style={{ color: '#64748b' }}>Amount:</span> <strong>₹{amount}</strong></div>
            </div>
          ) : null}
        </div>

        {/* Audio status banner */}
        <div style={{
          padding: '12px',
          backgroundColor: isSpeakingPrompt ? '#fef3c7' : (listeningForAnswer ? '#eff6ff' : '#f8fafc'),
          color: isSpeakingPrompt ? '#b45309' : (listeningForAnswer ? '#2563eb' : '#64748b'),
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px'
        }}>
          {isSpeakingPrompt ? (
            <>
              <Volume2 size={14} className="pulse-active" />
              <span>Speaking confirmation prompt...</span>
            </>
          ) : listeningForAnswer ? (
            <>
              <Mic size={14} className="pulse-active" />
              <span>Listening: Say <strong>"Yes" / "Aama"</strong> to save or <strong>"No" / "Vendam"</strong> to cancel</span>
            </>
          ) : (
            <span>Click below or say "Yes" / "Aama"</span>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{
          padding: '16px 24px 24px',
          display: 'flex',
          gap: '12px'
        }}>
          <button
            type="button"
            onClick={() => {
              speechService.stopSpeaking();
              speechService.stopListening();
              onCancel();
            }}
            disabled={loading}
            style={{
              flex: 1,
              backgroundColor: '#f1f5f9',
              border: 'none',
              padding: '12px 16px',
              borderRadius: '10px',
              fontWeight: '600',
              fontSize: '14px',
              color: '#475569',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <X size={16} />
            <span>Cancel / No</span>
          </button>

          <button
            type="button"
            onClick={() => {
              speechService.stopSpeaking();
              speechService.stopListening();
              onConfirm();
            }}
            disabled={loading}
            style={{
              flex: 1,
              backgroundColor: '#2563eb',
              border: 'none',
              padding: '12px 16px',
              borderRadius: '10px',
              fontWeight: '600',
              fontSize: '14px',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
            }}
          >
            <Check size={16} />
            <span>{loading ? 'Saving...' : 'Yes, Save'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
