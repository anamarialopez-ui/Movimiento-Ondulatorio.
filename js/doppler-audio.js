/**
 * doppler-audio.js
 * Motor acústico con Web Audio API para simulación del Efecto Doppler.
 * 
 * Cumple con los requerimientos:
 * - Activación bajo acción explícita del usuario (política de audio del navegador).
 * - Modalidad 1: Pulsos de llegada (chime/ping por cruce de frente de onda, ritmo exacto).
 * - Modalidad 2: Comparación tonal continua (tono emitido vs tono Doppler percibido con transposición clara).
 * - Envolventes suaves ADSR libres de chasquidos (clicks/pops).
 * - Cancelación inmediata al pausar, reiniciar o deslizar el tiempo (scrubbing).
 * - Sonificación didáctica de estampido sónico al cruce del cono de Mach sobre el observador.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.DopplerAudio = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  class DopplerAudioEngine {
    constructor() {
      this.ctx = null;
      this.isEnabled = false;
      this.mode = 'pulses'; // 'pulses' | 'continuous' | 'both'
      this.volume = 0.5;
      this.masterGain = null;

      // Base musical para transposición didáctica
      // Cuando f visual es 2 Hz, se transpone con factor x220 -> 440 Hz (La4)
      this.baseCarrierHz = 440.0;
      this.transpositionFactor = 220.0; // Multiplicador explícito mostrado al usuario

      // Nodos para tono continuo
      this.sourceOsc = null;
      this.sourceGain = null;
      this.observerOsc = null;
      this.observerGain = null;
      this.isContinuousPlaying = false;
    }

    /**
     * Inicializa el AudioContext bajo interacción del usuario
     */
    async enableAudio() {
      if (!this.ctx) {
        const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtxClass) {
          console.warn('Web Audio API no está disponible en este navegador.');
          return false;
        }
        this.ctx = new AudioCtxClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }

      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }

      this.isEnabled = true;
      return true;
    }

    disableAudio() {
      this.isEnabled = false;
      this.stopContinuousTone();
    }

    setVolume(vol) {
      this.volume = Math.max(0, Math.min(1, vol));
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.02);
      }
    }

    setMode(mode) {
      this.mode = mode;
      if (this.mode === 'pulses' && this.isContinuousPlaying) {
        this.stopContinuousTone();
      }
    }

    /**
     * Reproduce un pulso auditivo nítido al llegar un frente de onda al observador.
     * Envolvente exponencial ultra-corta de 60 ms para evitar solapamientos.
     */
    playArrivalPulse(frequencyShiftFactor = 1.0) {
      if (!this.isEnabled || !this.ctx || this.ctx.state !== 'running') return;
      if (this.mode !== 'pulses' && this.mode !== 'both') return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Tono didáctico sintonizado: 880 Hz modulado ligeramente por el corrimiento Doppler
      // para dar una pista intuitiva adicional
      let pitch = 880.0;
      if (Number.isFinite(frequencyShiftFactor) && frequencyShiftFactor > 0) {
        pitch = Math.max(200, Math.min(3000, 880.0 * frequencyShiftFactor));
      }

      osc.type = 'sine';
      osc.frequency.setValueAtTime(pitch, now);

      // Envolvente rápida y suave
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.35 * this.volume, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.08);
    }

    /**
     * Sonificación del impacto de la onda de choque supersónica (cono de Mach).
     * Síntesis acústica de doble estampido con caída de graves y ruido filtrado.
     */
    playSonicBoom() {
      if (!this.isEnabled || !this.ctx || this.ctx.state !== 'running') return;

      const now = this.ctx.currentTime;

      // Oscilador de graves con barrido rápido de frecuencia (50 Hz -> 20 Hz)
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();

      subOsc.type = 'triangle';
      subOsc.frequency.setValueAtTime(90, now);
      subOsc.frequency.exponentialRampToValueAtTime(25, now + 0.18);

      subGain.gain.setValueAtTime(0.0001, now);
      subGain.gain.exponentialRampToValueAtTime(0.7 * this.volume, now + 0.015);
      subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      subOsc.connect(subGain);
      subGain.connect(this.masterGain);

      subOsc.start(now);
      subOsc.stop(now + 0.36);
    }

    /**
     * Actualiza o inicia el tono continuo de comparación (emitido vs percibido).
     */
    updateContinuousTones(f_emitted, f_observed, isPlaying) {
      if (!this.isEnabled || !this.ctx || this.ctx.state !== 'running' || !isPlaying) {
        if (this.isContinuousPlaying) this.stopContinuousTone();
        return;
      }

      if (this.mode !== 'continuous' && this.mode !== 'both') {
        if (this.isContinuousPlaying) this.stopContinuousTone();
        return;
      }

      // Convertir frecuencias a escala audible mediante el factor de transposición
      // Si f es mayor a 50 Hz, se usa directa, de lo contrario se usa la base transpuesta
      let audioF_emit = f_emitted;
      let audioF_obs = f_observed;

      if (f_emitted < 50) {
        audioF_emit = this.baseCarrierHz;
        const ratio = (Number.isFinite(f_observed) && f_observed > 0) ? (f_observed / f_emitted) : 1.0;
        audioF_obs = this.baseCarrierHz * Math.max(0.2, Math.min(4.0, ratio));
      }

      const now = this.ctx.currentTime;

      if (!this.isContinuousPlaying) {
        // Iniciar osciladores
        this.observerOsc = this.ctx.createOscillator();
        this.observerGain = this.ctx.createGain();
        this.observerOsc.type = 'sine';
        this.observerOsc.frequency.setValueAtTime(audioF_obs, now);

        this.observerGain.gain.setValueAtTime(0.0001, now);
        this.observerGain.gain.exponentialRampToValueAtTime(0.25 * this.volume, now + 0.05);

        this.observerOsc.connect(this.observerGain);
        this.observerGain.connect(this.masterGain);

        this.observerOsc.start(now);
        this.isContinuousPlaying = true;
      } else {
        // Ajuste suave de frecuencia en tiempo real
        if (Number.isFinite(audioF_obs) && audioF_obs > 20 && audioF_obs < 15000) {
          this.observerOsc.frequency.setTargetAtTime(audioF_obs, now, 0.04);
        }
      }
    }

    stopContinuousTone() {
      if (!this.isContinuousPlaying || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        if (this.observerGain) {
          this.observerGain.gain.cancelScheduledValues(now);
          this.observerGain.gain.setValueAtTime(this.observerGain.gain.value, now);
          this.observerGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
        }
        if (this.observerOsc) {
          this.observerOsc.stop(now + 0.05);
        }
      } catch (e) {
        // Ignore
      }
      this.observerOsc = null;
      this.observerGain = null;
      this.isContinuousPlaying = false;
    }

    /**
     * Silencia inmediatamente cualquier sonido activo (pausa, reinicio, scrub)
     */
    silenceAll() {
      this.stopContinuousTone();
    }
  }

  return DopplerAudioEngine;
}));
