import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Send,
  MessageSquare,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Info,
  Globe,
  Check,
  X,
  HelpCircle,
  Activity
} from 'lucide-react';
import speechService from '../utils/speech';
import { voiceAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ConfirmationModal from '../components/ConfirmationModal';

const LANGUAGE_PACKS = {
  'ta-IN': {
    label: 'தமிழ் / Tanglish',
    nativeLabel: 'தமிழ் / Tanglish (Tamil & Tanglish Voice)',
    ttsSample: 'வணக்கம்! தமிழ் மற்றும் Tanglish வாய்ஸ் அசிஸ்டன்ட் தயாராக உள்ளது.',
    examples: [
      { text: 'Ponni Rice 25 kg 1300 ku vanginen', type: 'Purchase (Tanglish)' },
      { text: 'Toor Dal 2 kg 155 ku viten', type: 'Sale (Tanglish)' },
      { text: 'Urad Dal stock evlo irukku', type: 'Stock Check (Tanglish)' },
      { text: 'Innaiku laabam evlo', type: 'Today Profit (Tanglish)' },
      { text: 'Current bill 500 rooba kattinen', type: 'Expense (Tanglish)' },
      { text: 'Vadagai 5000 kuduthen', type: 'Rent Expense (Tanglish)' },
      { text: 'Thakkali 2 kilo vanginen 60 ku', type: 'Purchase (Tanglish)' },
      { text: 'உளுந்து பருப்பு 10 கிலோ 1250 ரூபாய்க்கு வாங்கினேன்', type: 'கொள்முதல் (Tamil Purchase)' },
      { text: 'துவரம் பருப்பு 2 கிலோ விற்றேன்', type: 'விற்பனை (Tamil Sale)' },
      { text: 'உளுந்து பருப்பு ஸ்டாக் எவ்வளவு?', type: 'இருப்பு சரிபார்ப்பு (Stock Check)' },
      { text: 'இன்றைய லாபம் எவ்வளவு?', type: 'இன்றைய லாபம் (Today Profit)' }
    ]
  },
  'en-IN': {
    label: 'English',
    nativeLabel: 'English (Indian English)',
    ttsSample: 'Smart Grocery Manager voice assistant is ready in English!',
    examples: [
      { text: 'Urad Dal 10 kg purchase for 1250', type: 'Purchase (English)' },
      { text: 'Toor Dal 2 kg sell for 155 per kg', type: 'Sale (English)' },
      { text: 'Urad Dal stock check', type: 'Stock Check' },
      { text: 'Today profit report', type: 'Today Profit & Sales' },
      { text: 'Electricity bill 350 rupees expense', type: 'Expense' },
      { text: 'Shop rent 5000 rupees expense', type: 'Expense' }
    ]
  },
  'hi-IN': {
    label: 'Hindi',
    nativeLabel: 'हिंदी (Hindi)',
    ttsSample: 'नमस्ते! वॉइस असिस्टेंट तैयार है।',
    examples: [
      { text: 'आज का प्रॉफिट कितना है', type: 'आज का मुनाफा (Native Script)' },
      { text: 'चावल 10 किलो 500 रुपये में खरीदा', type: 'खरीद (Native Script)' },
      { text: 'उड़द दाल 2 किलो बेच दिया', type: 'बिक्री (Native Script)' },
      { text: 'दाल का स्टॉक कितना है', type: 'स्टॉक चेक (Native Script)' },
      { text: 'बिजली बिल 500 रुपये खर्चा', type: 'खर्चा (Expense)' },
      { text: 'Chawal 10 kilo 500 rupaye me khareeda', type: 'Hinglish Purchase' }
    ]
  }
};

export default function VoiceAssistant() {
  const navigate = useNavigate();
  const { owner } = useAuth();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [textInput, setTextInput] = useState('');
  const [processing, setProcessing] = useState(false);
  const [language, setLanguage] = useState(owner?.preferredVoiceLang || 'ta-IN');
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [systemResponse, setSystemResponse] = useState('');
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [showTips, setShowTips] = useState(false);

  const [parsedCommand, setParsedCommand] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const diagnostics = speechService.getEnvironmentDiagnostics();

  useEffect(() => {
    if (owner?.preferredVoiceLang) {
      setLanguage(owner.preferredVoiceLang);
    }
  }, [owner?.preferredVoiceLang]);

  useEffect(() => {
    return () => {
      speechService.stopListening();
      speechService.stopSpeaking();
    };
  }, []);

  const handleToggleListen = () => {
    if (isListening) {
      // User tapped while listening - finalize immediately
      speechService.finishListening();
      setIsListening(false);
      setInterimText('');
      setVolumeLevel(0);
    } else {
      setTranscript('');
      setInterimText('');
      setErrorMessage('');
      setSystemResponse('');
      setIsListening(true);
      setVolumeLevel(10);

      speechService.startListening({
        lang: language,
        silenceDelayMs: 2500, // Smart 2.5s silence debounce allows thinking/natural speaking pauses
        onVolumeChange: (vol) => {
          setVolumeLevel(vol);
        },
        onInterim: (interim, fullAccumulated) => {
          setInterimText(interim);
          setTranscript(fullAccumulated);
        },
        onResult: (text) => {
          setTranscript(text);
          setInterimText('');
          setErrorMessage('');
          setIsListening(false);
          setVolumeLevel(0);
          processVoiceText(text);
        },
        onError: (err) => {
          console.warn('Speech error received:', err);
          setIsListening(false);
          setInterimText('');
          setVolumeLevel(0);
          // Only show error if no command was successfully received
          if (transcript || err.code === 'aborted') {
            return;
          }
          if (err.code === 'no-speech') {
            setErrorMessage('No voice detected. Please speak closer to your microphone or click an example command below.');
          } else {
            setErrorMessage(err.message || 'Microphone error. Please allow microphone access or use the text box below.');
          }
        },
        onEnd: () => {
          setIsListening(false);
          setVolumeLevel(0);
        }
      });
    }
  };

  const handleDoneSpeaking = () => {
    speechService.finishListening();
    setIsListening(false);
    setInterimText('');
    setVolumeLevel(0);
  };

  const handleCancelListening = () => {
    speechService.stopListening();
    setIsListening(false);
    setInterimText('');
    setTranscript('');
    setVolumeLevel(0);
  };

  const processVoiceText = async (text) => {
    if (!text || !text.trim()) return;
    setProcessing(true);
    setErrorMessage('');
    setSystemResponse('');

    try {
      const res = await voiceAPI.parseCommand(text);
      if (res.data && res.data.parsed) {
        const parsed = res.data.parsed;
        setParsedCommand(parsed);

        // If Invoice/Billing command, route directly to Customer Billing
        if (parsed.action === 'INVOICE_BILLING') {
          const cust = parsed.customerName && parsed.customerName !== 'Customer' ? parsed.customerName : '';
          const msg = cust ? `Opening invoice for customer "${cust}"...` : 'Opening Customer Billing...';
          setSystemResponse(`🧾 ${msg}`);
          if (speechEnabled) {
            speechService.speak(language.startsWith('ta') && parsed.ttsTamil ? parsed.ttsTamil : (parsed.ttsMessage || msg), language);
          }
          setTimeout(() => {
            navigate(`/billing${cust ? `?customer=${encodeURIComponent(cust)}` : ''}`);
          }, 1200);
          return;
        }

        // Confirmation required for data-modifying actions
        if (parsed.confirmationNeeded) {
          setIsModalOpen(true);
        } else {
          // Direct query like TODAY_REPORT or STOCK_CHECK
          setSystemResponse(parsed.ttsMessage || parsed.summary);
          if (speechEnabled && parsed.ttsMessage) {
            speechService.speak(parsed.ttsMessage, language);
          }
        }
      }
    } catch (err) {
      console.error('Error processing command:', err);
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to process command');
    } finally {
      setProcessing(false);
    }
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    const cmd = textInput.trim();
    setTranscript(cmd);
    setTextInput('');
    processVoiceText(cmd);
  };

  const handleConfirmSave = async () => {
    if (!parsedCommand) return;
    setSaveLoading(true);

    try {
      const res = await voiceAPI.executeAction(parsedCommand.action, parsedCommand);
      setIsModalOpen(false);
      const feedback = res.data.ttsFeedback || res.data.message || 'Operation saved successfully!';
      setSystemResponse(`✅ ${feedback}`);
      if (speechEnabled && res.data.ttsFeedback) {
        speechService.speak(res.data.ttsFeedback, language);
      }
      setParsedCommand(null);
    } catch (err) {
      const errFeedback = err.response?.data?.message || err.message || 'Failed to execute operation';
      setErrorMessage(errFeedback);
      if (speechEnabled) {
        speechService.speak(errFeedback, language);
      }
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCancelSave = () => {
    setIsModalOpen(false);
    setSystemResponse('Operation cancelled.');
    if (speechEnabled) {
      speechService.speak('Operation cancelled', language);
    }
    setParsedCommand(null);
  };

  const handleExampleClick = (commandText) => {
    setTranscript(commandText);
    processVoiceText(commandText);
  };

  const handleTestSpeaker = () => {
    const sample = LANGUAGE_PACKS[language]?.ttsSample || 'Smart Grocery Assistant is ready!';
    speechService.speak(sample, language);
  };

  const currentLangPack = LANGUAGE_PACKS[language] || LANGUAGE_PACKS['en-IN'];

  return (
    <div className="page-container" style={{ maxWidth: '900px', margin: '0 auto' }}>
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
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a' }}>
            Voice Assistant
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b' }}>
            Multi-lingual shop management in English, தமிழ் (Tamil), and हिंदी (Hindi)
          </p>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Multi-language Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Globe size={16} color="#2563eb" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                fontSize: '13px',
                fontWeight: '600',
                color: '#1e293b',
                cursor: 'pointer'
              }}
            >
              {Object.entries(LANGUAGE_PACKS).map(([code, pack]) => (
                <option key={code} value={code}>
                  {pack.nativeLabel}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleTestSpeaker}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              fontSize: '12px',
              fontWeight: '600',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
            title="Test Voice Output"
          >
            <Volume2 size={15} />
            <span>Test Voice</span>
          </button>

          <button
            onClick={() => setSpeechEnabled(!speechEnabled)}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              backgroundColor: speechEnabled ? '#eff6ff' : '#f8fafc',
              color: speechEnabled ? '#2563eb' : '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            title={speechEnabled ? 'Text-to-Speech Enabled' : 'Text-to-Speech Muted'}
          >
            {speechEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>

          <button
            onClick={() => setShowDiagnostics(!showDiagnostics)}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              backgroundColor: showDiagnostics ? '#f1f5f9' : '#ffffff',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            title="Browser & Mic Diagnostics"
          >
            <Info size={18} />
          </button>
        </div>
      </div>

      {/* Browser Diagnostics Dropdown */}
      {showDiagnostics && (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '16px 20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          marginBottom: '20px',
          fontSize: '13px'
        }}>
          <div style={{ fontWeight: '700', color: '#0f172a', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Info size={16} color="#2563eb" />
            <span>Voice Assistant System Diagnostics</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
            <div>
              Browser Speech API: {diagnostics.hasSpeechRecognition ? (
                <span style={{ color: '#16a34a', fontWeight: '600' }}>Supported ✅</span>
              ) : (
                <span style={{ color: '#ef4444', fontWeight: '600' }}>Not Supported (Use Chrome/Edge) ❌</span>
              )}
            </div>
            <div>
              Text-to-Speech Engine: {diagnostics.hasSpeechSynthesis ? (
                <span style={{ color: '#16a34a', fontWeight: '600' }}>Available ✅</span>
              ) : (
                <span style={{ color: '#ef4444', fontWeight: '600' }}>Unavailable ❌</span>
              )}
            </div>
            <div>
              Origin Context: {diagnostics.isSecure ? (
                <span style={{ color: '#16a34a', fontWeight: '600' }}>Secure (localhost) ✅</span>
              ) : (
                <span style={{ color: '#ea580c', fontWeight: '600' }}>Warning: Use http://localhost:3000 ⚠️</span>
              )}
            </div>
            <div>
              Active Language: <strong style={{ color: '#2563eb' }}>{currentLangPack.nativeLabel}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Center Interactive Microphone Card matching Mockup */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        padding: '40px 32px',
        border: '1px solid #e2e8f0',
        boxShadow: 'var(--card-shadow)',
        textAlign: 'center',
        marginBottom: '28px',
        position: 'relative'
      }}>
        {/* Pulsing Mic Button */}
        <div style={{ display: 'inline-block', position: 'relative', marginBottom: '20px' }}>
          <button
            onClick={handleToggleListen}
            disabled={processing}
            className={isListening ? 'pulse-active' : ''}
            style={{
              width: '110px',
              height: '110px',
              borderRadius: '50%',
              backgroundColor: isListening ? '#ef4444' : '#2563eb',
              border: 'none',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: isListening
                ? '0 0 35px rgba(239, 68, 68, 0.5)'
                : '0 10px 25px rgba(37, 99, 235, 0.35)',
              transition: 'all 0.25s ease'
            }}
          >
            {isListening ? <MicOff size={44} /> : <Mic size={44} />}
          </button>
        </div>

        <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
          {isListening ? `Listening in ${currentLangPack.label}...` : 'Tap to Speak'}
        </h3>
        <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '440px', margin: '0 auto 20px' }}>
          {isListening
            ? 'Speak your command clearly into your microphone now...'
            : `Tell me what you want to do with your shop in ${currentLangPack.label}, or type below:`}
        </p>

        {/* Live Audio Waves & Realtime Speech Display */}
        {isListening && (
          <div style={{
            backgroundColor: '#f8fafc',
            border: '2px dashed #93c5fd',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '24px',
            animation: 'fadeIn 0.2s ease-in'
          }}>
            {/* Sound Wave Bars reacting to microphone volume */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              height: '42px',
              marginBottom: '14px'
            }}>
              {[0.4, 0.8, 1.2, 0.6, 1.4, 0.9, 1.5, 0.7, 1.1, 0.5].map((multiplier, i) => {
                const dynamicHeight = Math.min(38, Math.max(8, Math.round((volumeLevel || 15) * multiplier * 0.4)));
                return (
                  <div
                    key={i}
                    style={{
                      width: '4px',
                      height: `${dynamicHeight}px`,
                      backgroundColor: volumeLevel > 10 ? '#2563eb' : '#94a3b8',
                      borderRadius: '4px',
                      transition: 'height 0.1s ease',
                      animation: volumeLevel > 5 ? `bounce 0.8s infinite ${i * 0.08}s` : 'none'
                    }}
                  />
                );
              })}
            </div>

            {/* Live Spoken Text Bubble */}
            <div style={{
              fontSize: '15px',
              fontWeight: '600',
              color: '#1e293b',
              minHeight: '26px',
              marginBottom: '16px',
              wordBreak: 'break-word'
            }}>
              {transcript || interimText ? (
                <span style={{ color: '#0f172a' }}>
                  "{transcript} {interimText && <span style={{ color: '#2563eb', fontStyle: 'italic' }}>{interimText}</span>}"
                </span>
              ) : (
                <span style={{ color: '#64748b', fontWeight: '400' }}>
                  🎙️ Speak naturally at your own pace — your words appear here...
                </span>
              )}
            </div>

            {/* User Controls: Done Speaking or Cancel */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              <button
                type="button"
                onClick={handleDoneSpeaking}
                style={{
                  backgroundColor: '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)',
                  transition: 'background-color 0.15s, transform 0.1s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#15803d'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#16a34a'}
              >
                <Check size={16} />
                <span>Done Speaking (Process Now)</span>
              </button>

              <button
                type="button"
                onClick={handleCancelListening}
                style={{
                  backgroundColor: '#f1f5f9',
                  color: '#64748b',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '10px 16px',
                  fontSize: '14px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
              >
                <X size={16} />
                <span>Cancel</span>
              </button>
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '10px' }}>
              💡 Auto-submits after 2.5 seconds of silence, or tap <strong>Done Speaking</strong> above.
            </div>
          </div>
        )}

        {/* ChatGPT Comparison & Voice Clarity Helper Banner */}
        <div style={{
          marginBottom: '20px',
          textAlign: 'left'
        }}>
          <button
            type="button"
            onClick={() => setShowTips(!showTips)}
            style={{
              background: 'none',
              border: 'none',
              padding: '0',
              fontSize: '12px',
              fontWeight: '600',
              color: '#2563eb',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              cursor: 'pointer'
            }}
          >
            <HelpCircle size={14} />
            <span>{showTips ? 'Hide Voice Clarity Tips' : 'Why does voice capture differ from ChatGPT? Tips for 100% accuracy'}</span>
          </button>

          {showTips && (
            <div style={{
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '12px',
              padding: '16px',
              marginTop: '10px',
              fontSize: '12.5px',
              color: '#166534',
              lineHeight: '1.6'
            }}>
              <div style={{ fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Activity size={15} color="#16a34a" />
                <span>How Voice Recognition Works in This System vs ChatGPT:</span>
              </div>
              <ul style={{ paddingLeft: '20px', margin: '0 0 10px 0' }}>
                <li>
                  <strong>Cloud AI vs Browser Engine:</strong> ChatGPT records raw audio and sends it to massive cloud AI (OpenAI Whisper) with billions of parameters. This web app uses the browser's high-speed Speech Engine for zero-latency instant offline action without paying API costs.
                </li>
                <li>
                  <strong>Match Your Language Accent:</strong> Browser speech recognition is strictly language-aware! If speaking in Tamil or Tanglish, make sure <em>"தமிழ் / Tanglish"</em> is selected at the top right. If speaking English, choose <em>"English (India)"</em>.
                </li>
                <li>
                  <strong>Continuous Mode & Hardware Noise Suppression:</strong> The mic now stays active without cutting you off when you hesitate. Ambient background noise is automatically filtered using browser echo-cancellation.
                </li>
                <li>
                  <strong>"Done Speaking" Button:</strong> When you finish speaking your phrase, tap <em>"Done Speaking"</em> to immediately analyze and preview the action!
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            borderRadius: '10px',
            padding: '12px 16px',
            marginBottom: '20px',
            fontSize: '13px',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px'
          }}>
            <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: '600', marginBottom: '2px' }}>Assistant Alert:</div>
              <div>{errorMessage}</div>
            </div>
          </div>
        )}

        {/* Live Transcript / Result Box */}
        {(transcript || processing || systemResponse) && (
          <div style={{
            backgroundColor: '#f8fafc',
            borderRadius: '12px',
            padding: '16px 20px',
            border: '1px solid #e2e8f0',
            textAlign: 'left',
            marginBottom: '24px'
          }}>
            {transcript && (
              <div style={{ marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>
                  Received Command:
                </span>
                <p style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b', marginTop: '2px' }}>
                  "{transcript}"
                </p>
              </div>
            )}

            {processing && (
              <div style={{ fontSize: '13px', color: '#2563eb', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={15} />
                <span>Processing natural speech through AI NLP engine...</span>
              </div>
            )}

            {systemResponse && (
              <div style={{
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                padding: '12px 14px',
                marginTop: '10px',
                color: '#1e40af',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                {systemResponse}
              </div>
            )}
          </div>
        )}

        {/* Dual Command Input Bar (Type or Speak) */}
        <form onSubmit={handleTextSubmit} style={{ display: 'flex', gap: '10px', maxWidth: '640px', margin: '0 auto' }}>
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder={`Type command in ${currentLangPack.label} (e.g. "${currentLangPack.examples[0].text}")...`}
            className="form-input"
            style={{ padding: '12px 16px', fontSize: '14px' }}
          />
          <button
            type="submit"
            disabled={!textInput.trim() || processing}
            className="btn-primary"
            style={{ padding: '0 20px', flexShrink: 0 }}
          >
            <Send size={16} />
            <span>Send</span>
          </button>
        </form>
      </div>

      {/* Language-Specific Example Commands Card */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={18} color="#2563eb" />
            <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
              Example Commands in {currentLangPack.nativeLabel} (Click any to test immediately)
            </h4>
          </div>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Instant 1-Click Execution
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
          {currentLangPack.examples.map((cmd, idx) => (
            <div
              key={idx}
              onClick={() => handleExampleClick(cmd.text)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: '10px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#eff6ff';
                e.currentTarget.style.borderColor = '#93c5fd';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f8fafc';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
            >
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>
                  "{cmd.text}"
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  {cmd.type}
                </div>
              </div>
              <ArrowRight size={14} color="#2563eb" />
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation Modal with Voice "Yes" / "No" and Manual Buttons */}
      <ConfirmationModal
        isOpen={isModalOpen}
        parsedCommand={parsedCommand}
        language={language}
        onConfirm={handleConfirmSave}
        onCancel={handleCancelSave}
        loading={saveLoading}
      />
    </div>
  );
}
