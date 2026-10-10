import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import speechService from '../utils/speech';

export const DEFAULT_A11Y = {
  fontSize: 'normal', // 'normal' (14px), 'medium' (16px), 'large' (18px), 'xlarge' (20px)
  themeMode: 'standard', // 'standard', 'high-contrast-light', 'high-contrast-dark', 'sepia'
  reducedMotion: false,
  dyslexicFont: false,
  soundFeedback: true,
  soundVolume: 80, // 0 to 100
  largeFocusRings: false,
  largeClickTargets: false,
  keyboardShortcuts: true,
  speechRate: 0.95, // 0.75 to 1.5
  speechPitch: 1.0, // 0.8 to 1.4
  screenReaderAnnounce: false,
  autoPrintReceipt: false,
  defaultReceiptWidth: '80mm', // '58mm' | '80mm'
  bilingualDisplay: 'both' // 'both' | 'tamil' | 'english'
};

const STORAGE_KEY = 'smart_grocery_accessibility';

const AccessibilityContext = createContext(null);

export const AccessibilityProvider = ({ children }) => {
  const navigate = useNavigate();
  const [a11y, setA11y] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_A11Y, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Error reading accessibility storage:', e);
    }
    return DEFAULT_A11Y;
  });

  const [announcement, setAnnouncement] = useState('');
  const audioContextRef = useRef(null);

  // Initialize Web Audio Context on first user interaction
  const getAudioContext = useCallback(() => {
    if (typeof window === 'undefined') return null;
    if (!audioContextRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        audioContextRef.current = new AudioCtx();
      }
    }
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  // Web Audio Synthesizer for tactile action chimes
  const playChime = useCallback((type = 'click') => {
    if (!a11y.soundFeedback || a11y.soundVolume <= 0) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const masterVol = (a11y.soundVolume / 100) * 0.25; // Gentle volume ceiling

      if (type === 'success') {
        // Upbeat harmonic chord: C5 (523.25Hz), E5 (659.25Hz), G5 (783.99Hz)
        const notes = [523.25, 659.25, 783.99];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

          gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.08);
          gain.gain.linearRampToValueAtTime(masterVol, ctx.currentTime + idx * 0.08 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.08 + 0.35);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.08);
          osc.stop(ctx.currentTime + idx * 0.08 + 0.4);
        });
      } else if (type === 'warning') {
        // Dual descending alert tone: 440Hz -> 311Hz
        [440, 311.13].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);

          gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.12);
          gain.gain.linearRampToValueAtTime(masterVol * 0.7, ctx.currentTime + idx * 0.12 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.12 + 0.22);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.12);
          osc.stop(ctx.currentTime + idx * 0.12 + 0.25);
        });
      } else if (type === 'bell') {
        // POS Cash Register Bell: 987.77Hz (B5) with pleasant resonance
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(987.77, ctx.currentTime);

        gain.gain.setValueAtTime(masterVol, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.65);
      } else if (type === 'voice') {
        // Voice mic activated ping: 587.33Hz (D5)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);

        gain.gain.setValueAtTime(masterVol * 0.8, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else {
        // Default subtle UI click: 800Hz short blip
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);

        gain.gain.setValueAtTime(masterVol * 0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      }
    } catch (e) {
      console.warn('Audio synthesis warning:', e);
    }
  }, [a11y.soundFeedback, a11y.soundVolume, getAudioContext]);

  // Voice output test utility
  const speakTestUtterance = useCallback((text = 'வணக்கம், Smart Grocery Assistant is active.') => {
    speechService.speak(text, 'ta-IN', null, {
      rate: a11y.speechRate,
      pitch: a11y.speechPitch,
      volume: a11y.soundVolume / 100
    });
  }, [a11y.speechRate, a11y.speechPitch, a11y.soundVolume]);

  // Screen reader announcer
  const announce = useCallback((text) => {
    if (!a11y.screenReaderAnnounce && !text) return;
    setAnnouncement('');
    setTimeout(() => {
      setAnnouncement(text);
    }, 50);
  }, [a11y.screenReaderAnnounce]);

  // Apply CSS attributes to document root whenever settings change
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', a11y.themeMode || 'standard');
    root.setAttribute('data-font-size', a11y.fontSize || 'normal');
    root.setAttribute('data-reduced-motion', a11y.reducedMotion ? 'true' : 'false');
    root.setAttribute('data-dyslexic', a11y.dyslexicFont ? 'true' : 'false');
    root.setAttribute('data-focus-rings', a11y.largeFocusRings ? 'true' : 'false');
    root.setAttribute('data-large-targets', a11y.largeClickTargets ? 'true' : 'false');

    // Sync speech service
    speechService.setPreferences({
      rate: a11y.speechRate,
      pitch: a11y.speechPitch,
      volume: a11y.soundVolume / 100
    });

    // Save locally
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(a11y));
    } catch {}
  }, [a11y]);

  // Global Keyboard Shortcuts handler
  useEffect(() => {
    if (!a11y.keyboardShortcuts) return;

    const handleKeyDown = (e) => {
      // Ignore if typing inside input, textarea, or select (unless it is Alt key combination)
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
      if (isInput && !e.altKey) return;

      if (e.altKey) {
        const key = e.key.toLowerCase();
        switch (key) {
          case 'd':
            e.preventDefault();
            playChime('click');
            navigate('/');
            announce('Navigating to Dashboard');
            break;
          case 'b':
            e.preventDefault();
            playChime('click');
            navigate('/billing');
            announce('Navigating to Voice Billing Counter');
            break;
          case 'p':
            e.preventDefault();
            playChime('click');
            navigate('/products');
            announce('Navigating to Products and Stock');
            break;
          case 'v':
            e.preventDefault();
            playChime('click');
            navigate('/voice');
            announce('Navigating to Voice Assistant');
            break;
          case 's':
            e.preventDefault();
            playChime('click');
            navigate('/settings');
            announce('Navigating to Settings');
            break;
          case 'r':
            e.preventDefault();
            playChime('click');
            navigate('/reports');
            announce('Navigating to Reports and Analytics');
            break;
          case 'e':
            e.preventDefault();
            playChime('click');
            navigate('/expenses');
            announce('Navigating to Expense Tracker');
            break;
          case 'u':
            e.preventDefault();
            playChime('click');
            navigate('/purchases');
            announce('Navigating to Purchases');
            break;
          case 'a':
            e.preventDefault();
            playChime('click');
            navigate('/sales');
            announce('Navigating to Sales');
            break;
          case 'h':
            e.preventDefault();
            // Toggle high contrast theme
            setA11y(prev => {
              const nextTheme = prev.themeMode === 'high-contrast-dark' ? 'standard' : 'high-contrast-dark';
              announce(`Theme switched to ${nextTheme}`);
              return { ...prev, themeMode: nextTheme };
            });
            playChime('click');
            break;
          case '+':
          case '=':
            e.preventDefault();
            // Increase font size
            setA11y(prev => {
              const sizes = ['normal', 'medium', 'large', 'xlarge'];
              const currIdx = sizes.indexOf(prev.fontSize);
              const next = sizes[Math.min(sizes.length - 1, (currIdx === -1 ? 0 : currIdx) + 1)];
              announce(`Font size increased to ${next}`);
              return { ...prev, fontSize: next };
            });
            playChime('click');
            break;
          case '-':
            e.preventDefault();
            // Decrease font size
            setA11y(prev => {
              const sizes = ['normal', 'medium', 'large', 'xlarge'];
              const currIdx = sizes.indexOf(prev.fontSize);
              const next = sizes[Math.max(0, (currIdx === -1 ? 0 : currIdx) - 1)];
              announce(`Font size decreased to ${next}`);
              return { ...prev, fontSize: next };
            });
            playChime('click');
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [a11y.keyboardShortcuts, navigate, playChime, announce]);

  const updateAccessibility = useCallback((partial) => {
    setA11y(prev => ({ ...prev, ...partial }));
  }, []);

  const resetAccessibility = useCallback(() => {
    setA11y(DEFAULT_A11Y);
    playChime('warning');
    announce('Accessibility settings reset to defaults');
  }, [playChime, announce]);

  return (
    <AccessibilityContext.Provider
      value={{
        a11y,
        updateAccessibility,
        resetAccessibility,
        playChime,
        speakTestUtterance,
        announce
      }}
    >
      {children}
      {/* Live Region for Screen Readers */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: '0',
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: '0'
        }}
      >
        {announcement}
      </div>
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return ctx;
};

export default AccessibilityContext;
