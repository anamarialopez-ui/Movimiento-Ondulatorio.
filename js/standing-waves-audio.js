/**
 * standing-waves-audio.js
 * Síntesis acústica de la cuerda vibrante utilizando Web Audio API.
 * Modela el timbre armónico de una cuerda musical con transiciones suaves.
 */

class StandingWaveAudio {
  constructor() {
    this.audioCtx = null;
    this.masterGain = null;
    this.oscillators = [];
    this.harmonicGains = [];
    this.isEnabled = false;
    this.volume = 0.3; // Volumen normalizado [0, 1]
    this.currentFrequency = 110; // Hz por defecto
    this.harmonicNumber = 1;
  }

  /** Inicializa el contexto de audio con una interacción de usuario */
  init() {
    if (this.audioCtx) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContextClass();

      // Master Gain
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.setValueAtTime(0, this.audioCtx.currentTime);
      this.masterGain.connect(this.audioCtx.destination);

      // Crear osciladores para síntesis aditiva de cuerda (Fundamental + sobretonos suaves)
      const overtoneWeights = [1.0, 0.45, 0.25, 0.15, 0.08]; // Pesos tímbricos de cuerda
      this.oscillators = [];
      this.harmonicGains = [];

      overtoneWeights.forEach((weight, index) => {
        const osc = this.audioCtx.createOscillator();
        osc.type = index === 0 ? 'sine' : 'triangle';

        const gain = this.audioCtx.createGain();
        gain.gain.setValueAtTime(weight * 0.2, this.audioCtx.currentTime);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();

        this.oscillators.push(osc);
        this.harmonicGains.push(gain);
      });

      this.updateFrequency(this.currentFrequency, this.harmonicNumber);
    } catch (e) {
      console.warn('Web Audio API no soportado o bloqueado:', e);
    }
  }

  /** Activa o desactiva la emisión de sonido */
  toggle(forceState) {
    if (!this.audioCtx) {
      this.init();
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    this.isEnabled = forceState !== undefined ? forceState : !this.isEnabled;

    if (this.masterGain && this.audioCtx) {
      const now = this.audioCtx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      if (this.isEnabled) {
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
        this.masterGain.gain.linearRampToValueAtTime(this.volume, now + 0.08);
      } else {
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
        this.masterGain.gain.linearRampToValueAtTime(0, now + 0.08);
      }
    }

    return this.isEnabled;
  }

  /** Ajusta el volumen del audio */
  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.isEnabled && this.masterGain && this.audioCtx) {
      const now = this.audioCtx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.linearRampToValueAtTime(this.volume, now + 0.05);
    }
  }

  /**
   * Actualiza la frecuencia reproducida.
   * Si la frecuencia física es inaudible (<25 Hz o >4000 Hz), se traslada a la octava audible más clara.
   */
  updateFrequency(physicalFreq, harmonic = 1) {
    this.currentFrequency = physicalFreq;
    this.harmonicNumber = harmonic;

    if (!this.audioCtx || this.oscillators.length === 0) return;

    // Adaptación a rango musical audible placentero (40 Hz a 2000 Hz)
    let audibleFreq = physicalFreq;
    if (audibleFreq <= 0) audibleFreq = 55;
    while (audibleFreq < 45) audibleFreq *= 2;
    while (audibleFreq > 2200) audibleFreq /= 2;

    const now = this.audioCtx.currentTime;

    this.oscillators.forEach((osc, i) => {
      const mult = i + 1;
      const targetFreq = Math.min(18000, audibleFreq * mult);
      try {
        osc.frequency.cancelScheduledValues(now);
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, targetFreq), now + 0.06);
      } catch (e) {
        osc.frequency.setValueAtTime(Math.max(20, targetFreq), now);
      }
    });
  }
}

if (typeof window !== 'undefined') {
  window.StandingWaveAudio = StandingWaveAudio;
}

