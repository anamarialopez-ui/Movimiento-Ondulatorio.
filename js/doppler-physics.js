/**
 * doppler-physics.js
 * Motor físico acústico y modelo matemático riguroso del Efecto Doppler.
 * 
 * Implementa:
 * - Cinemática 1D y 2D de fuente y observador en medio homogéneo en reposo.
 * - Programación exacta y determinista de frentes de onda: t_e,n = n / f.
 * - Registro histórico inmutable de frentes de onda en coordenadas físicas (metros).
 * - Detección analítica y numérica de eventos de recepción: |x_o(t_r) - x_c| = c*(t_r - t_e).
 * - Cálculo de frecuencia retardada vectorial: f_o = f_e * (c - n · v_o) / (c - n · v_f).
 * - Medición experimental independiente: f_medida = 1 / (t_r,n+1 - t_r,n).
 * - Longitudes de onda espaciales lambda_0, lambda_delante, lambda_detras.
 * - Régimen sónico y supersónico: Cono de Mach (semángulo mu = arcsin(1/M)), envolvente geométrica
 *   y detección precisa de paso del frente de choque sobre el observador.
 * - Batería de pruebas de verificación científica contra soluciones analíticas canónicas.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.DopplerPhysics = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Constantes y tolerancias numéricas
  const EPSILON = 1e-9;

  class DopplerEngine {
    constructor(config = {}) {
      this.resetConfig(config);
    }

    resetConfig(config = {}) {
      // Parámetros fundamentales (SI)
      this.f = (typeof config.f === 'number' && config.f > 0) ? config.f : 2.0; // Hz
      this.c = (typeof config.c === 'number' && config.c > 0) ? config.c : 340.0; // m/s

      // Cinemática en 2D (y modo 1D colineal cuando y = 0, vy = 0)
      this.is2D = config.is2D || false;

      // Fuente (Source)
      this.source = {
        x0: typeof config.x_f0 === 'number' ? config.x_f0 : -170.0, // m
        y0: typeof config.y_f0 === 'number' ? config.y_f0 : 0.0,
        vx: typeof config.vx_f === 'number' ? config.vx_f : 0.0, // m/s
        vy: typeof config.vy_f === 'number' ? config.vy_f : 0.0,
        x: 0,
        y: 0
      };

      // Observador (Observer)
      this.observer = {
        x0: typeof config.x_o0 === 'number' ? config.x_o0 : 170.0, // m
        y0: typeof config.y_o0 === 'number' ? config.y_o0 : 0.0,
        vx: typeof config.vx_o === 'number' ? config.vx_o : 0.0, // m/s
        vy: typeof config.vy_o === 'number' ? config.vy_o : 0.0,
        x: 0,
        y: 0
      };

      // Temporalidad
      this.durationMode = config.durationMode || 'fixed'; // 'fixed' o 'periods'
      this.fixedDuration = typeof config.fixedDuration === 'number' ? config.fixedDuration : 10.0; // s
      this.numPeriods = typeof config.numPeriods === 'number' ? config.numPeriods : 20;
      this.subdivisionsPerPeriod = config.subdivisionsPerPeriod || 100;

      this.currentTime = 0.0; // s
      this.playbackRate = 1.0; // multiplicador visual
      this.maxTime = this.calculateTotalTime();

      // Colección de frentes emitidos y recepciones
      this.wavefronts = []; // Array de { id, te, xc, yc, r, received: bool, tr: number | null }
      this.receptionEvents = []; // Array de { waveId, te, tr, f_theoretical, f_measured, dt }
      this.lastReceivedWaveId = -1;
      this.machShockWaveReceived = false;

      // Inicializar posiciones en t = 0
      this.updatePositions(0);
      // Precalcular frentes y llegadas analíticamente para determinismo absoluto
      this.rebuildHistoryUpTo(0);
    }

    calculateTotalTime() {
      if (this.durationMode === 'periods') {
        return Math.max(0.1, this.numPeriods / this.f);
      }
      return Math.max(0.5, this.fixedDuration);
    }

    setFrequency(newF) {
      if (newF > 0) {
        this.f = newF;
        this.maxTime = this.calculateTotalTime();
        this.rebuildHistoryUpTo(this.currentTime);
      }
    }

    setSoundSpeed(newC) {
      if (newC > 0) {
        this.c = newC;
        this.rebuildHistoryUpTo(this.currentTime);
      }
    }

    setSourceVelocity(vx, vy = 0) {
      this.source.vx = vx;
      this.source.vy = vy;
      this.rebuildHistoryUpTo(this.currentTime);
    }

    setObserverVelocity(vx, vy = 0) {
      this.observer.vx = vx;
      this.observer.vy = vy;
      this.rebuildHistoryUpTo(this.currentTime);
    }

    setPositions(xf, yf, xo, yo) {
      this.source.x0 = xf;
      this.source.y0 = yf;
      this.observer.x0 = xo;
      this.observer.y0 = yo;
      this.rebuildHistoryUpTo(this.currentTime);
    }

    // Retorna la posición de la fuente en cualquier tiempo t
    getSourcePos(t) {
      return {
        x: this.source.x0 + this.source.vx * t,
        y: this.source.y0 + this.source.vy * t
      };
    }

    // Retorna la posición del observador en cualquier tiempo t
    getObserverPos(t) {
      return {
        x: this.observer.x0 + this.observer.vx * t,
        y: this.observer.y0 + this.observer.vy * t
      };
    }

    updatePositions(t) {
      const sf = this.getSourcePos(t);
      this.source.x = sf.x;
      this.source.y = sf.y;

      const so = this.getObserverPos(t);
      this.observer.x = so.x;
      this.observer.y = so.y;
    }

    // Número de Mach de la fuente
    getMachNumber() {
      const v = Math.sqrt(this.source.vx * this.source.vx + this.source.vy * this.source.vy);
      return v / this.c;
    }

    // Semángulo de Mach mu = arcsin(1 / M) para M > 1
    getMachAngle() {
      const M = this.getMachNumber();
      if (M <= 1.0) return null;
      return Math.asin(1.0 / M); // Radianes
    }

    // Longitudes de onda espaciales (1D colineal)
    getWavelengths() {
      const lambda0 = this.c / this.f;
      const vx = this.source.vx;
      const lambdaAhead = (this.c - vx) / this.f;
      const lambdaBehind = (this.c + vx) / this.f;
      return {
        lambda0,
        lambdaAhead: Math.max(0, lambdaAhead),
        lambdaBehind: Math.max(0, lambdaBehind)
      };
    }

    /**
     * Resuelve el instante exacto de recepción t_r para un frente emitido en t_e
     * con centro en x_c, y_c cuando el observador se mueve con v_ox, v_oy.
     * Ecuación: |x_o(t_r) - x_c|^2 = c^2 * (t_r - t_e)^2 con t_r >= t_e.
     */
    solveReceptionTime(te, xc, yc) {
      // Posición del observador: x_o(t) = xo0 + vox * t = (xo0 + vox*te) + vox*(t - te)
      // Definamos tau = t_r - te >= 0.
      // x_rel = xo(te) - xc = (xo0 + vox*te) - xc
      // y_rel = yo(te) - yc = (yo0 + voy*te) - yc
      const xRel = (this.observer.x0 + this.observer.vx * te) - xc;
      const yRel = (this.observer.y0 + this.observer.vy * te) - yc;
      const vox = this.observer.vx;
      const voy = this.observer.vy;

      // |x_rel + v_o * tau|^2 = c^2 * tau^2
      // (vox^2 + voy^2 - c^2) * tau^2 + 2*(xRel*vox + yRel*voy)*tau + (xRel^2 + yRel^2) = 0
      const A = (vox * vox + voy * voy) - (this.c * this.c);
      const B = 2 * (xRel * vox + yRel * voy);
      const C = xRel * xRel + yRel * yRel;

      // Si A es prácticamente cero (|vo| = c)
      if (Math.abs(A) < EPSILON) {
        if (Math.abs(B) < EPSILON) {
          return C === 0 ? te : null;
        }
        const tau = -C / B;
        return tau >= 0 ? te + tau : null;
      }

      const disc = B * B - 4 * A * C;
      if (disc < 0) return null; // No hay intersección física

      const sqrtD = Math.sqrt(Math.max(0, disc));
      const tau1 = (-B - sqrtD) / (2 * A);
      const tau2 = (-B + sqrtD) / (2 * A);

      // Buscamos la menor solución física válida con tau >= 0
      const validTaus = [tau1, tau2].filter(tau => tau >= -EPSILON);
      if (validTaus.length === 0) return null;

      const minTau = Math.min(...validTaus);
      return te + Math.max(0, minTau);
    }

    /**
     * Frecuencia teórica observada en el instante de recepción de un frente emitido en te:
     * f_o = f_e * (c - n · v_o) / (c - n · v_f)
     * n es el vector unitario desde el punto de emisión hacia el observador en t_r:
     * n = (x_o(t_r) - x_f(t_e)) / |x_o(t_r) - x_f(t_e)|
     */
    calculateTheoreticalObservedFrequency(te, tr, xc, yc) {
      const obsPosAtTr = this.getObserverPos(tr);
      const dx = obsPosAtTr.x - xc;
      const dy = obsPosAtTr.y - yc;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < EPSILON) {
        return this.f;
      }

      const nx = dx / dist;
      const ny = dy / dist;

      const vDotVo = nx * this.observer.vx + ny * this.observer.vy;
      const vDotVf = nx * this.source.vx + ny * this.source.vy;

      const num = this.c - vDotVo;
      const den = this.c - vDotVf;

      if (Math.abs(den) < EPSILON) {
        return Infinity; // Onda de choque / Mach 1 exacto
      }

      const fo = this.f * (num / den);
      return fo;
    }

    /**
     * Reconstruye determinísticamente el historial de frentes y eventos hasta un tiempo targetTime.
     * Esto asegura que avanzar, pausar o retroceder el deslizador restaure el estado idéntico.
     */
    rebuildHistoryUpTo(targetTime) {
      this.currentTime = Math.max(0, Math.min(targetTime, this.maxTime));
      this.updatePositions(this.currentTime);

      const period = 1.0 / this.f;
      // Número de emisiones ocurridas hasta currentTime (empezando en t = 0)
      const maxEmittedIndex = Math.floor(this.currentTime / period + EPSILON);

      this.wavefronts = [];
      this.receptionEvents = [];
      this.lastReceivedWaveId = -1;
      this.machShockWaveReceived = false;

      // Generar todos los frentes emitidos hasta el tiempo actual
      for (let n = 0; n <= maxEmittedIndex; n++) {
        const te = n * period;
        if (te > this.currentTime + EPSILON) break;

        const sourceAtTe = this.getSourcePos(te);
        const tr = this.solveReceptionTime(te, sourceAtTe.x, sourceAtTe.y);

        const currentRadius = this.c * (this.currentTime - te);

        const wave = {
          id: n,
          te: te,
          xc: sourceAtTe.x,
          yc: sourceAtTe.y,
          r: Math.max(0, currentRadius),
          tr: tr,
          received: tr !== null && tr <= this.currentTime + EPSILON
        };

        this.wavefronts.push(wave);
      }

      // Procesar recepciones ocurridas hasta currentTime en orden cronológico de recepción
      const receivedWaves = this.wavefronts
        .filter(w => w.tr !== null && w.tr <= this.currentTime + EPSILON)
        .sort((a, b) => a.tr - b.tr);

      for (let i = 0; i < receivedWaves.length; i++) {
        const w = receivedWaves[i];
        const prevW = i > 0 ? receivedWaves[i - 1] : null;

        const f_theo = this.calculateTheoreticalObservedFrequency(w.te, w.tr, w.xc, w.yc);
        let f_meas = null;
        let dt = null;

        if (prevW) {
          dt = w.tr - prevW.tr;
          if (dt > EPSILON) {
            f_meas = 1.0 / dt;
          }
        }

        this.receptionEvents.push({
          waveId: w.id,
          te: w.te,
          tr: w.tr,
          f_theoretical: f_theo,
          f_measured: f_meas,
          dt: dt
        });

        this.lastReceivedWaveId = w.id;
      }

      // Verificar si el cono de Mach ha cruzado al observador
      this.checkMachShockArrival(this.currentTime);
    }

    /**
     * Determina si la envolvente de choque supersónica (cono de Mach) ha alcanzado al observador en t.
     */
    checkMachShockArrival(t) {
      const M = this.getMachNumber();
      if (M <= 1.0) {
        this.machShockWaveReceived = false;
        return false;
      }

      // Distancia entre la trayectoria de la fuente y el observador
      // Para movimiento rectilíneo: origen en x0, y0 con v_f
      // Punto más cercano entre el cono generado hasta t y la posición actual del observador
      const obs = this.getObserverPos(t);
      const sf = this.getSourcePos(t);

      // En el frente de Mach, la distancia d_perp desde el observador a la trayectoria
      // se relaciona con la distancia axial detrás de la fuente: x_atras = d_perp / tan(mu)
      // donde mu = arcsin(1/M) -> tan(mu) = 1 / sqrt(M^2 - 1).
      // Por tanto el cono existe sólo detrás de la fuente actual:
      const v = Math.sqrt(this.source.vx * this.source.vx + this.source.vy * this.source.vy);
      if (v < EPSILON) {
        this.machShockWaveReceived = false;
        return false;
      }

      const dirX = this.source.vx / v;
      const dirY = this.source.vy / v;

      // Vector desde el observador a la fuente actual
      const rx = obs.x - sf.x;
      const ry = obs.y - sf.y;

      // Componente paralela a la velocidad (positiva hacia adelante de la fuente)
      const sPara = rx * dirX + ry * dirY;
      // Componente perpendicular
      const sPerp = Math.abs(rx * (-dirY) + ry * dirX);

      // El cono de Mach se extiende hacia atrás (sPara < 0)
      if (sPara <= 0) {
        const xBehind = -sPara;
        const coneRadius = xBehind / Math.sqrt(M * M - 1.0);
        if (sPerp <= coneRadius) {
          this.machShockWaveReceived = true;
          return true;
        }
      }

      this.machShockWaveReceived = false;
      return false;
    }

    /**
     * Avanza el tiempo físico de la simulación por un incremento dt.
     * Detecta eventos de recepción recién ocurridos en el intervalo (t_prev, t_curr].
     * Retorna una lista de nuevos eventos de llegada para activar sonido o alertas.
     */
    stepTime(dt) {
      const prevTime = this.currentTime;
      let newTime = prevTime + dt;

      if (newTime > this.maxTime) {
        newTime = this.maxTime;
      }

      this.currentTime = newTime;
      this.updatePositions(this.currentTime);

      const period = 1.0 / this.f;
      const maxEmittedIndex = Math.floor(this.currentTime / period + EPSILON);

      // Emitir cualquier frente pendiente en el intervalo
      while (this.wavefronts.length <= maxEmittedIndex) {
        const n = this.wavefronts.length;
        const te = n * period;
        if (te > this.currentTime + EPSILON) break;

        const sourceAtTe = this.getSourcePos(te);
        const tr = this.solveReceptionTime(te, sourceAtTe.x, sourceAtTe.y);

        this.wavefronts.push({
          id: n,
          te: te,
          xc: sourceAtTe.x,
          yc: sourceAtTe.y,
          r: Math.max(0, this.c * (this.currentTime - te)),
          tr: tr,
          received: false
        });
      }

      // Actualizar radios de todos los frentes
      for (let i = 0; i < this.wavefronts.length; i++) {
        const w = this.wavefronts[i];
        if (this.currentTime >= w.te) {
          w.r = this.c * (this.currentTime - w.te);
        }
      }

      // Detectar recepciones que cayeron en (prevTime, newTime]
      const newArrivals = [];
      for (let i = 0; i < this.wavefronts.length; i++) {
        const w = this.wavefronts[i];
        if (!w.received && w.tr !== null && w.tr <= this.currentTime + EPSILON) {
          w.received = true;
          this.lastReceivedWaveId = w.id;

          const f_theo = this.calculateTheoreticalObservedFrequency(w.te, w.tr, w.xc, w.yc);
          const prevEvent = this.receptionEvents.length > 0 ? this.receptionEvents[this.receptionEvents.length - 1] : null;

          let f_meas = null;
          let dt_arrival = null;

          if (prevEvent) {
            dt_arrival = w.tr - prevEvent.tr;
            if (dt_arrival > EPSILON) {
              f_meas = 1.0 / dt_arrival;
            }
          }

          const arrivalEvent = {
            waveId: w.id,
            te: w.te,
            tr: w.tr,
            f_theoretical: f_theo,
            f_measured: f_meas,
            dt: dt_arrival
          };

          this.receptionEvents.push(arrivalEvent);
          newArrivals.push(arrivalEvent);
        }
      }

      // Verificar paso de choque Mach
      const prevShock = this.machShockWaveReceived;
      this.checkMachShockArrival(this.currentTime);
      const shockTriggeredNow = !prevShock && this.machShockWaveReceived;

      return {
        currentTime: this.currentTime,
        isFinished: this.currentTime >= this.maxTime - EPSILON,
        arrivals: newArrivals,
        machShockTriggered: shockTriggeredNow
      };
    }

    /**
     * Información de telemetría completa para la UI en tiempo real
     */
    getCurrentTelemetry() {
      const M = this.getMachNumber();
      const machAngleRad = this.getMachAngle();
      const machAngleDeg = machAngleRad !== null ? (machAngleRad * 180 / Math.PI) : null;
      const wavelengths = this.getWavelengths();

      // Distancia euclidiana instantánea fuente-observador
      const dx = this.observer.x - this.source.x;
      const dy = this.observer.y - this.source.y;
      const currentDist = Math.sqrt(dx * dx + dy * dy);

      // Último evento de recepción
      const lastEvent = this.receptionEvents.length > 0 ? this.receptionEvents[this.receptionEvents.length - 1] : null;

      // Frecuencia teórica instantánea basada en la onda más recientemente recibida o posición actual
      let instantTheo = null;
      if (lastEvent) {
        instantTheo = lastEvent.f_theoretical;
      } else {
        // Estimación geométrica previa a la primera recepción
        const nx = currentDist > EPSILON ? dx / currentDist : 1;
        const ny = currentDist > EPSILON ? dy / currentDist : 0;
        const num = this.c - (nx * this.observer.vx + ny * this.observer.vy);
        const den = this.c - (nx * this.source.vx + ny * this.source.vy);
        instantTheo = den !== 0 ? this.f * (num / den) : Infinity;
      }

      // Régimen descriptivo
      let regime = 'Subbónico';
      if (Math.abs(M) < EPSILON) regime = 'Fuente en reposo';
      else if (Math.abs(M - 1.0) < 0.02) regime = 'Barrera sónica (Mach 1)';
      else if (M > 1.0) regime = 'Supersónico (M > 1)';

      return {
        time: this.currentTime,
        maxTime: this.maxTime,
        f_emitted: this.f,
        c: this.c,
        M: M,
        regime: regime,
        machAngleDeg: machAngleDeg,
        sourcePos: { x: this.source.x, y: this.source.y },
        sourceVel: { vx: this.source.vx, vy: this.source.vy },
        observerPos: { x: this.observer.x, y: this.observer.y },
        observerVel: { vx: this.observer.vx, vy: this.observer.vy },
        distance: currentDist,
        wavelengths: wavelengths,
        totalEmitted: this.wavefronts.length,
        totalReceived: this.receptionEvents.length,
        lastReception: lastEvent,
        instantTheoFrequency: instantTheo,
        machShockReceived: this.machShockWaveReceived
      };
    }
  }

  /**
   * Batería de pruebas científicas de verificación obligatoria (Requisito 14).
   * Ejecuta comprobaciones numéricas independientes con tolerancias estrictas.
   */
  function runScientificValidationTests() {
    const results = [];

    function assertClose(name, actual, expected, tol = 1e-4, unit = '') {
      const diff = Math.abs(actual - expected);
      const passed = diff <= tol;
      results.push({
        name,
        actual,
        expected,
        diff,
        passed,
        tol,
        unit
      });
      return passed;
    }

    const c = 340.0;
    const f = 1000.0;

    // Caso 1: Ambos inmóviles (1000 Hz)
    {
      const eng = new DopplerEngine({ f, c, vx_f: 0, vx_o: 0, x_f0: 0, x_o0: 340 });
      const f_calc = eng.calculateTheoreticalObservedFrequency(0, 1.0, 0, 0);
      assertClose('Ambos inmóviles (f = 1000 Hz)', f_calc, 1000.0, 1e-5, 'Hz');
    }

    // Caso 2: Fuente que se aproxima a 34 m/s (1111.1111... Hz)
    {
      const vf = 34.0;
      const expected = f * (c / (c - vf)); // 1000 * 340 / 306 = 1111.1111...
      const eng = new DopplerEngine({ f, c, vx_f: vf, vx_o: 0, x_f0: 0, x_o0: 340 });
      const tr = eng.solveReceptionTime(0, 0, 0);
      const f_calc = eng.calculateTheoreticalObservedFrequency(0, tr, 0, 0);
      assertClose('Fuente aproximándose a 34 m/s', f_calc, expected, 1e-4, 'Hz');
    }

    // Caso 3: Fuente que se aleja a 34 m/s (909.0909... Hz)
    {
      const vf = -34.0;
      const expected = f * (c / (c - vf)); // 1000 * 340 / 374 = 909.0909...
      const eng = new DopplerEngine({ f, c, vx_f: vf, vx_o: 0, x_f0: 0, x_o0: 340 });
      const tr = eng.solveReceptionTime(0, 0, 0);
      const f_calc = eng.calculateTheoreticalObservedFrequency(0, tr, 0, 0);
      assertClose('Fuente alejándose a 34 m/s', f_calc, expected, 1e-4, 'Hz');
    }

    // Caso 4: Observador que se aproxima a fuente inmóvil a 34 m/s (1100 Hz)
    {
      const vo = -34.0; // Movimiento hacia la fuente en x = 0 desde x = 340
      const expected = 1100.0; // 1000 * (340 + 34) / 340 = 1100
      const eng = new DopplerEngine({ f, c, vx_f: 0, vx_o: vo, x_f0: 0, x_o0: 340 });
      const tr = eng.solveReceptionTime(0, 0, 0);
      const f_calc = eng.calculateTheoreticalObservedFrequency(0, tr, 0, 0);
      assertClose('Observador aproximándose a 34 m/s', f_calc, expected, 1e-4, 'Hz');
    }

    // Caso 5: Observador que se aleja de fuente inmóvil a 34 m/s (900 Hz)
    {
      const vo = 34.0; // Movimiento alejándose hacia +x
      const expected = 900.0; // 1000 * (340 - 34) / 340 = 900
      const eng = new DopplerEngine({ f, c, vx_f: 0, vx_o: vo, x_f0: 0, x_o0: 340 });
      const tr = eng.solveReceptionTime(0, 0, 0);
      const f_calc = eng.calculateTheoreticalObservedFrequency(0, tr, 0, 0);
      assertClose('Observador alejándose a 34 m/s', f_calc, expected, 1e-4, 'Hz');
    }

    // Caso 6: Ambos con igual velocidad constante (vf = vo = 34 m/s) y separación constante
    {
      const v = 34.0;
      const expected = 1000.0;
      const eng = new DopplerEngine({ f, c, vx_f: v, vx_o: v, x_f0: 0, x_o0: 340 });
      const tr = eng.solveReceptionTime(0, 0, 0);
      const f_calc = eng.calculateTheoreticalObservedFrequency(0, tr, 0, 0);
      assertClose('Ambos con igual velocidad (v = 34 m/s)', f_calc, expected, 1e-4, 'Hz');
    }

    // Caso 7: Tiempo de vuelo para 340 m con c = 340 m/s es exactamente 1.0 s
    {
      const eng = new DopplerEngine({ f: 2, c: 340, vx_f: 0, vx_o: 0, x_f0: 0, x_o0: 340 });
      const tr = eng.solveReceptionTime(0, 0, 0);
      assertClose('Tiempo de vuelo para d = 340 m a c = 340 m/s', tr, 1.0, 1e-6, 's');
    }

    // Caso 8: Mach 2 semángulo de Mach mu = 30°
    {
      const eng = new DopplerEngine({ f: 2, c: 340, vx_f: 680, vx_o: 0, x_f0: 0, x_o0: 340 });
      const muRad = eng.getMachAngle();
      const muDeg = muRad * 180 / Math.PI;
      assertClose('Semángulo de Mach para M = 2.0 (mu = 30°)', muDeg, 30.0, 1e-5, '°');
    }

    // Caso 9: Comprobación empírica independiente f_medida = 1 / (tr2 - tr1)
    {
      const vf = 34.0;
      const f_vis = 2.0; // 2 Hz -> T = 0.5 s
      const eng = new DopplerEngine({ f: f_vis, c: 340, vx_f: vf, vx_o: 0, x_f0: -170, x_o0: 170 });
      const te0 = 0.0;
      const te1 = 0.5;
      const tr0 = eng.solveReceptionTime(te0, eng.getSourcePos(te0).x, 0);
      const tr1 = eng.solveReceptionTime(te1, eng.getSourcePos(te1).x, 0);
      const dt = tr1 - tr0;
      const f_measured = 1.0 / dt;
      const f_expected = f_vis * (340.0 / (340.0 - vf)); // 2 * 340 / 306 = 2.2222...
      assertClose('Frecuencia medida independiente por intervalos de llegada', f_measured, f_expected, 1e-4, 'Hz');
    }

    return results;
  }

  return {
    DopplerEngine,
    runScientificValidationTests
  };
}));
