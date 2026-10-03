// Multi-Lingual Speech Service with robust browser Web Speech API implementation

export class SpeechService {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.currentRecognition = null;
    this.isListening = false;
  }

  hasSpeechRecognition() {
    if (typeof window === 'undefined') return false;
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  hasSpeechSynthesis() {
    if (typeof window === 'undefined') return false;
    return !!window.speechSynthesis;
  }

  getEnvironmentDiagnostics() {
    if (typeof window === 'undefined') return {};
    const isChromeOrEdge = /Chrome|Edg/i.test(navigator.userAgent) && !/Brave/i.test(navigator.userAgent);
    const isBrave = navigator.brave && typeof navigator.brave.isBrave === 'function';
    const isFirefox = /Firefox/i.test(navigator.userAgent);
    const isSecure = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'https:';

    return {
      hasSpeechRecognition: this.hasSpeechRecognition(),
      hasSpeechSynthesis: this.hasSpeechSynthesis(),
      isSecure,
      hostname: window.location.hostname,
      protocol: window.location.protocol,
      userAgent: navigator.userAgent,
      isFirefox,
      isBrave,
      isChromeOrEdge
    };
  }

  startListening({ onInterim, onResult, onError, onEnd, onAudioStart, lang = 'en-IN' }) {
    if (!this.hasSpeechRecognition()) {
      if (onError) {
        onError({
          code: 'not-supported',
          message: 'Speech Recognition is not supported by your browser engine. For voice features, please open this app in Google Chrome or Microsoft Edge.'
        });
      }
      return;
    }

    // Stop any existing session
    this.stopListening();

    try {
      const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SpeechRecognitionClass();

      rec.continuous = false;
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      rec.lang = lang;

      let recognizedFinal = '';

      rec.onstart = () => {
        this.isListening = true;
        if (onAudioStart) onAudioStart();
      };

      rec.onaudiostart = () => {
        this.isListening = true;
      };

      rec.onspeechstart = () => {
        this.isListening = true;
      };

      rec.onresult = (event) => {
        let interimText = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            recognizedFinal += item[0].transcript;
          } else {
            interimText += item[0].transcript;
          }
        }

        if (interimText && onInterim) {
          onInterim(interimText);
        }

        if (recognizedFinal && onResult) {
          onResult(recognizedFinal.trim());
        }
      };

      rec.onerror = (event) => {
        this.isListening = false;
        // Ignore aborted error (normal when stopping) or if speech was already captured
        if (event.error === 'aborted' || recognizedFinal.trim().length > 0) {
          return;
        }

        let friendlyMsg = 'Microphone audio error. Please try again.';

        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          friendlyMsg = 'Microphone permission blocked! Please click the lock/microphone icon in your browser URL address bar (top-left) and set Microphone to "Allow", then refresh.';
        } else if (event.error === 'no-speech') {
          friendlyMsg = 'No speech detected. Please speak closer to your mic or click any of the example commands below.';
        } else if (event.error === 'network') {
          friendlyMsg = 'Speech network service issue. If using Brave, enable Google services in brave://settings/privacy, or use Google Chrome.';
        } else if (event.error === 'audio-capture') {
          friendlyMsg = 'No microphone device was detected on your computer. Please check audio inputs.';
        }

        if (onError) {
          onError({
            code: event.error,
            message: friendlyMsg
          });
        }
      };

      rec.onend = () => {
        this.isListening = false;
        this.currentRecognition = null;
        if (onEnd) onEnd();
      };

      this.currentRecognition = rec;
      rec.start();
    } catch (err) {
      this.isListening = false;
      console.error('Speech recognition invocation error:', err);
      if (onError) {
        onError({
          code: 'start-failed',
          message: err.message || 'Could not start microphone.'
        });
      }
    }
  }

  stopListening() {
    if (this.currentRecognition) {
      try {
        this.currentRecognition.abort();
      } catch {}
      this.currentRecognition = null;
    }
    this.isListening = false;
  }

  speak(text, lang = 'en-IN', onComplete = null) {
    if (!this.synth || !text) {
      if (onComplete) onComplete();
      return;
    }

    try {
      this.synth.cancel(); // Cancel any ongoing speech

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      if (onComplete) {
        utterance.onend = onComplete;
        utterance.onerror = onComplete;
      }

      // Try finding a matching voice for the target language (e.g. kn, te, hi, ta, en)
      const voices = this.synth.getVoices();
      const langPrefix = lang.slice(0, 2).toLowerCase();
      const matched = voices.find(v => v.lang.toLowerCase().startsWith(langPrefix));
      if (matched) {
        utterance.voice = matched;
      }

      this.synth.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
      if (onComplete) onComplete();
    }
  }

  stopSpeaking() {
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch {}
    }
  }
}

export const speechService = new SpeechService();
export default speechService;
