// Multi-Lingual Speech Service with High-Accuracy Continuous Audio Processing,
// Hardware Noise-Suppression, Silence Auto-Detection, and Real-time Voice Meter.

export class SpeechService {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.currentRecognition = null;
    this.audioStream = null;
    this.audioContext = null;
    this.analyser = null;
    this.volumeInterval = null;
    this.isListening = false;
    this.silenceTimeout = null;
    this.accumulatedFinal = '';
    this.currentFullTranscript = '';
    this.activeCallbacks = null;
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

  async startListening({
    onInterim,
    onResult,
    onError,
    onEnd,
    onAudioStart,
    onVolumeChange,
    lang = 'en-IN',
    silenceDelayMs = 2000 // 2 seconds of silence before auto-submission
  }) {
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

    this.accumulatedFinal = '';
    this.currentFullTranscript = '';
    this.activeCallbacks = { onInterim, onResult, onError, onEnd, onAudioStart, onVolumeChange };

    // 1. Enable Hardware Noise Suppression & Mic Audio Stream
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        this.audioStream = stream;

        // Setup real-time audio volume analysis for visual feedback
        if (onVolumeChange && (window.AudioContext || window.webkitAudioContext)) {
          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          this.audioContext = new AudioContextClass();
          const source = this.audioContext.createMediaStreamSource(stream);
          this.analyser = this.audioContext.createAnalyser();
          this.analyser.fftSize = 256;
          source.connect(this.analyser);

          const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
          this.volumeInterval = setInterval(() => {
            if (!this.isListening || !this.analyser) return;
            this.analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const average = sum / dataArray.length;
            const normalized = Math.min(100, Math.round((average / 128) * 100));
            onVolumeChange(normalized);
          }, 100);
        }
      }
    } catch (e) {
      console.warn('Microphone noise-suppression setup warning (continuing with WebSpeech directly):', e.message);
    }

    try {
      const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SpeechRecognitionClass();

      // Continuous listening prevents premature cutoff when pausing to think
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      rec.lang = lang;

      const resetSilenceTimer = () => {
        if (this.silenceTimeout) {
          clearTimeout(this.silenceTimeout);
        }
        this.silenceTimeout = setTimeout(() => {
          if (this.currentFullTranscript.trim()) {
            this.finishListening();
          }
        }, silenceDelayMs);
      };

      rec.onstart = () => {
        this.isListening = true;
        if (onAudioStart) onAudioStart();
      };

      rec.onaudiostart = () => {
        this.isListening = true;
      };

      rec.onspeechstart = () => {
        this.isListening = true;
        resetSilenceTimer();
      };

      rec.onresult = (event) => {
        let finalChunk = '';
        let interimChunk = '';

        for (let i = 0; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res.isFinal) {
            finalChunk += res[0].transcript + ' ';
          } else {
            interimChunk += res[0].transcript;
          }
        }

        this.accumulatedFinal = finalChunk.trim();
        this.currentFullTranscript = (finalChunk + ' ' + interimChunk).trim();

        if (onInterim) {
          onInterim(interimChunk.trim(), this.currentFullTranscript);
        }

        // Whenever user speaks, refresh the silence countdown
        if (this.currentFullTranscript.trim()) {
          resetSilenceTimer();
        }
      };

      rec.onerror = (event) => {
        if (event.error === 'aborted' || this.currentFullTranscript.trim().length > 0) {
          return;
        }

        this.cleanupAudio();
        this.isListening = false;

        let friendlyMsg = 'Microphone audio error. Please try again.';
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          friendlyMsg = 'Microphone permission blocked! Please click the lock/microphone icon in your browser URL address bar and select "Allow", then refresh.';
        } else if (event.error === 'no-speech') {
          friendlyMsg = 'No speech detected. Please speak closer to your mic or tap an example command below.';
        } else if (event.error === 'network') {
          friendlyMsg = 'Speech network service issue. If using Brave browser, enable Google Services in brave://settings/privacy, or use Google Chrome.';
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
        // If recognition closed automatically by browser but we have transcript, deliver it
        if (this.isListening && this.currentFullTranscript.trim()) {
          this.finishListening();
          return;
        }

        this.cleanupAudio();
        this.isListening = false;
        this.currentRecognition = null;
        if (onEnd) onEnd();
      };

      this.currentRecognition = rec;
      rec.start();
    } catch (err) {
      this.cleanupAudio();
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

  // Gracefully complete and submit the final recognized speech
  finishListening() {
    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
      this.silenceTimeout = null;
    }

    const textToDeliver = this.currentFullTranscript.trim() || this.accumulatedFinal.trim();

    if (this.currentRecognition) {
      try {
        this.currentRecognition.stop();
      } catch {}
      this.currentRecognition = null;
    }

    this.cleanupAudio();
    this.isListening = false;

    if (textToDeliver && this.activeCallbacks?.onResult) {
      this.activeCallbacks.onResult(textToDeliver);
    } else if (this.activeCallbacks?.onEnd) {
      this.activeCallbacks.onEnd();
    }
  }

  // Abort/Cancel listening without submitting
  stopListening() {
    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
      this.silenceTimeout = null;
    }

    if (this.currentRecognition) {
      try {
        this.currentRecognition.abort();
      } catch {}
      this.currentRecognition = null;
    }

    this.cleanupAudio();
    this.isListening = false;
    this.accumulatedFinal = '';
    this.currentFullTranscript = '';
  }

  cleanupAudio() {
    if (this.volumeInterval) {
      clearInterval(this.volumeInterval);
      this.volumeInterval = null;
    }
    if (this.audioStream) {
      try {
        this.audioStream.getTracks().forEach(track => track.stop());
      } catch {}
      this.audioStream = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch {}
      this.audioContext = null;
    }
  }

  setPreferences({ rate, pitch, volume } = {}) {
    if (rate !== undefined) this.customRate = Number(rate);
    if (pitch !== undefined) this.customPitch = Number(pitch);
    if (volume !== undefined) this.customVolume = Number(volume);
  }

  speak(text, lang = 'en-IN', onComplete = null, options = {}) {
    if (!this.synth || !text) {
      if (onComplete) onComplete();
      return;
    }

    try {
      this.synth.cancel(); // Cancel any ongoing speech

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = options.rate ?? this.customRate ?? 0.95;
      utterance.pitch = options.pitch ?? this.customPitch ?? 1.0;
      utterance.volume = options.volume ?? this.customVolume ?? 1.0;

      if (onComplete) {
        utterance.onend = onComplete;
        utterance.onerror = onComplete;
      }

      // Try finding a matching voice for the target language (e.g. ta, hi, en)
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
