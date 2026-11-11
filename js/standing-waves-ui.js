/**
 * standing-waves-ui.js
 * Orquestador de la interfaz, controles de movimiento, osciloscopio en tiempo real,
 * telemetría analítica con KaTeX y gestión de eventos didácticos.
 */

class StandingWaveApp {
  constructor() {
    // 1. Instancias de subsistemas
    this.physics = new StandingWavePhysics({
      tension: 100,
      density: 0.01,
      length: 2.0,
      amplitude: 0.35,
      harmonic: 1
    });

    this.audio = new StandingWaveAudio();
    this.canvasRenderer = null;

    // 2. Estado de animación y reproducción
    this.isPlaying = true;
    this.playbackSpeed = 0.10; // Velocidad pausada y perfectamente observable por defecto
    this.prevTimestamp = 0;
    this.animationFrameId = null;

    // 3. Historial del Osciloscopio para x0
    this.oscilloscopeHistory = [];
    this.maxOscilloscopePoints = 120;

    // 4. Referencias al DOM
    this.dom = {};
  }

  init() {
    this.cacheDomElements();
    this.setupCanvas();
    this.setupEventListeners();
    this.setupKeyboardShortcuts();
    this.setHarmonic(1);
    this.setPlaybackSpeed(0.10);
    this.updateAllInputsFromPhysics();
    this.updateCalculations();
    this.startAnimationLoop();
  }

  cacheDomElements() {
    // Canvas
    this.dom.waveCanvas = document.getElementById('waveCanvas');
    this.dom.scopeCanvas = document.getElementById('scopeCanvas');

    // Deslizadores y campos numéricos
    this.dom.sliderTension = document.getElementById('sliderTension');
    this.dom.numTension = document.getElementById('numTension');
    this.dom.sliderDensity = document.getElementById('sliderDensity');
    this.dom.numDensity = document.getElementById('numDensity');
    this.dom.sliderLength = document.getElementById('sliderLength');
    this.dom.numLength = document.getElementById('numLength');
    this.dom.sliderAmplitude = document.getElementById('sliderAmplitude');
    this.dom.numAmplitude = document.getElementById('numAmplitude');
    this.dom.sliderHarmonic = document.getElementById('sliderHarmonic');
    this.dom.numHarmonic = document.getElementById('numHarmonic');
    this.dom.sliderProbe = document.getElementById('sliderProbe');
    this.dom.numProbe = document.getElementById('numProbe');

    // Botones de control de movimiento
    this.dom.btnPlayPause = document.getElementById('btnPlayPause');
    this.dom.btnReset = document.getElementById('btnReset');
    this.dom.btnStepBack = document.getElementById('btnStepBack');
    this.dom.btnStepForward = document.getElementById('btnStepForward');
    this.dom.btnJumpMax = document.getElementById('btnJumpMax');
    this.dom.btnJumpZero = document.getElementById('btnJumpZero');
    this.dom.sliderSpeed = document.getElementById('sliderSpeed');
    this.dom.speedValueDisplay = document.getElementById('speedValueDisplay');
    this.dom.timeDisplay = document.getElementById('timeDisplay');
    this.dom.timeScrubber = document.getElementById('timeScrubber');

    // Botones de velocidad rápida
    this.dom.speedButtons = document.querySelectorAll('.btn-speed');

    // Pastillas de armónicos rápidos (1..8)
    this.dom.harmonicPills = document.querySelectorAll('.harmonic-pill');

    // Toggles de visualización
    this.dom.toggleStandingWave = document.getElementById('toggleStandingWave');
    this.dom.toggleEnvelope = document.getElementById('toggleEnvelope');
    this.dom.toggleTravelingWaves = document.getElementById('toggleTravelingWaves');
    this.dom.toggleNodesAntinodes = document.getElementById('toggleNodesAntinodes');
    this.dom.toggleParticles = document.getElementById('toggleParticles');
    this.dom.toggleVectors = document.getElementById('toggleVectors');
    this.dom.toggleStrobe = document.getElementById('toggleStrobe');

    // Botones de cabecera
    this.dom.btnAudio = document.getElementById('btnAudio');
    this.dom.btnTheory = document.getElementById('btnTheory');
    this.dom.btnQuiz = document.getElementById('btnQuiz');
    this.dom.btnTheme = document.getElementById('btnTheme');
    this.dom.btnExportPNG = document.getElementById('btnExportPNG');
    this.dom.btnExportCSV = document.getElementById('btnExportCSV');

    // Medidores de energía
    this.dom.barKinetic = document.getElementById('barKinetic');
    this.dom.barPotential = document.getElementById('barPotential');
    this.dom.barTotal = document.getElementById('barTotal');
    this.dom.valKinetic = document.getElementById('valKinetic');
    this.dom.valPotential = document.getElementById('valPotential');
    this.dom.valTotal = document.getElementById('valTotal');

    // Pantallas de telemetría analítica
    this.dom.calcSpeed = document.getElementById('calcSpeed');
    this.dom.calcFreq = document.getElementById('calcFreq');
    this.dom.calcWavelength = document.getElementById('calcWavelength');
    this.dom.calcPeriod = document.getElementById('calcPeriod');
    this.dom.calcOmega = document.getElementById('calcOmega');
    this.dom.calcWaveNumber = document.getElementById('calcWaveNumber');
    this.dom.calcNodeDistance = document.getElementById('calcNodeDistance');
    this.dom.calcNodeAntinodeDist = document.getElementById('calcNodeAntinodeDist');
    this.dom.calcNodesCount = document.getElementById('calcNodesCount');
    this.dom.calcAntinodesCount = document.getElementById('calcAntinodesCount');
    this.dom.calcNodesList = document.getElementById('calcNodesList');
    this.dom.calcAntinodesList = document.getElementById('calcAntinodesList');

    // Sonda puntual
    this.dom.probeXDisplay = document.getElementById('probeXDisplay');
    this.dom.probeYDisplay = document.getElementById('probeYDisplay');
    this.dom.probeVyDisplay = document.getElementById('probeVyDisplay');
  }

  setupCanvas() {
    this.canvasRenderer = new StandingWaveCanvas(this.dom.waveCanvas, this.physics);
    this.scopeCtx = this.dom.scopeCanvas.getContext('2d');
    this.resizeScopeCanvas();
  }

  setupEventListeners() {
    // Sincronización de Sliders <-> Inputs Numéricos
    const bindPair = (slider, num, setter) => {
      if (!slider || !num) return;
      slider.addEventListener('input', () => {
        num.value = slider.value;
        setter(parseFloat(slider.value));
      });
      num.addEventListener('input', () => {
        slider.value = num.value;
        setter(parseFloat(num.value));
      });
    };

    bindPair(this.dom.sliderTension, this.dom.numTension, (v) => {
      this.physics.tension = v;
      this.onPhysicsParamChanged();
    });

    bindPair(this.dom.sliderDensity, this.dom.numDensity, (v) => {
      this.physics.density = v;
      this.onPhysicsParamChanged();
    });

    bindPair(this.dom.sliderLength, this.dom.numLength, (v) => {
      this.physics.length = v;
      if (this.physics.probeX > v) this.physics.probeX = v / 2;
      this.updateProbeSliderMax();
      this.onPhysicsParamChanged();
    });

    bindPair(this.dom.sliderAmplitude, this.dom.numAmplitude, (v) => {
      this.physics.amplitude = v;
      this.onPhysicsParamChanged();
    });

    bindPair(this.dom.sliderHarmonic, this.dom.numHarmonic, (v) => {
      this.setHarmonic(parseInt(v, 10));
    });

    bindPair(this.dom.sliderProbe, this.dom.numProbe, (v) => {
      this.physics.probeX = v;
    });

    // Control de velocidad de reproducción
    this.dom.sliderSpeed.addEventListener('input', (e) => {
      this.setPlaybackSpeed(parseFloat(e.target.value));
    });

    this.dom.speedButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const speed = parseFloat(btn.dataset.speed);
        this.setPlaybackSpeed(speed);
      });
    });

    // Botones de movimiento clave
    this.dom.btnPlayPause.addEventListener('click', () => this.togglePlayPause());
    this.dom.btnReset.addEventListener('click', () => this.resetSimulation());
    this.dom.btnStepBack.addEventListener('click', () => this.stepTime(-1));
    this.dom.btnStepForward.addEventListener('click', () => this.stepTime(1));
    this.dom.btnJumpMax.addEventListener('click', () => {
      this.physics.jumpToMaxDisplacement();
      this.renderOnce();
    });
    this.dom.btnJumpZero.addEventListener('click', () => {
      this.physics.jumpToZeroDisplacement();
      this.renderOnce();
    });

    // Time Scrubber manual
    this.isScrubbing = false;
    this.dom.timeScrubber.addEventListener('mousedown', () => this.isScrubbing = true);
    this.dom.timeScrubber.addEventListener('touchstart', () => this.isScrubbing = true, { passive: true });
    window.addEventListener('mouseup', () => this.isScrubbing = false);
    window.addEventListener('touchend', () => this.isScrubbing = false);

    this.dom.timeScrubber.addEventListener('input', (e) => {
      const fraction = parseFloat(e.target.value) / 100;
      this.physics.time = fraction * this.physics.period * 2;
      this.renderOnce();
    });

    // Pastillas de selección de armónicos rápidos
    this.dom.harmonicPills.forEach(pill => {
      pill.addEventListener('click', () => {
        const h = parseInt(pill.dataset.harmonic, 10);
        this.setHarmonic(h);
      });
    });

    // Presets didácticos
    document.querySelectorAll('.btn-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        const presetKey = btn.dataset.preset;
        this.loadPreset(presetKey);
      });
    });

    // Toggles de capas visuales
    this.bindToggle(this.dom.toggleStandingWave, (checked) => this.canvasRenderer.showStandingWave = checked);
    this.bindToggle(this.dom.toggleEnvelope, (checked) => this.canvasRenderer.showEnvelope = checked);
    this.bindToggle(this.dom.toggleTravelingWaves, (checked) => this.canvasRenderer.showTravelingWaves = checked);
    this.bindToggle(this.dom.toggleNodesAntinodes, (checked) => this.canvasRenderer.showNodesAntinodes = checked);
    this.bindToggle(this.dom.toggleParticles, (checked) => this.canvasRenderer.showParticles = checked);
    this.bindToggle(this.dom.toggleVectors, (checked) => this.canvasRenderer.showVectors = checked);
    this.bindToggle(this.dom.toggleStrobe, (checked) => {
      this.canvasRenderer.showStrobeTrails = checked;
      this.canvasRenderer.strobeHistory = [];
    });

    // Audio
    this.dom.btnAudio.addEventListener('click', () => {
      const active = this.audio.toggle();
      this.dom.btnAudio.classList.toggle('active', active);
      this.dom.btnAudio.innerHTML = active
        ? '<span>🔊</span><span>Audio: Activo</span>'
        : '<span>🔈</span><span>Audio: Silenciado</span>';
      if (active) {
        this.audio.updateFrequency(this.physics.frequency, this.physics.harmonic);
      }
    });

    // Alternar tema Claro / Oscuro
    this.dom.btnTheme.addEventListener('click', () => this.toggleTheme());

    // Exportar Captura PNG
    this.dom.btnExportPNG.addEventListener('click', () => this.exportCanvasPNG());

    // Exportar Datos CSV
    if (this.dom.btnExportCSV) {
      this.dom.btnExportCSV.addEventListener('click', () => this.exportDataCSV());
    }

    // Modales de Teoría y Cuestionario
    this.setupModals();

    // Redimensionado de ventana
    window.addEventListener('resize', () => {
      if (this.canvasRenderer) this.canvasRenderer.resize();
      this.resizeScopeCanvas();
    });
  }

  bindToggle(el, callback) {
    if (!el) return;
    el.addEventListener('change', () => {
      callback(el.checked);
      if (!this.isPlaying) this.renderOnce();
    });
  }

  setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Ignorar si el usuario está escribiendo en un input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        this.togglePlayPause();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        this.stepTime(1);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        this.stepTime(-1);
      } else if (e.key === 'r' || e.key === 'R') {
        this.resetSimulation();
      } else if (e.key === 'm' || e.key === 'M') {
        this.dom.btnAudio.click();
      } else if (e.key >= '1' && e.key <= '8') {
        this.setHarmonic(parseInt(e.key, 10));
      }
    });
  }

  // --- GESTIÓN DE VELOCIDAD Y CONTROLES DE REPRODUCCIÓN ---
  setPlaybackSpeed(speed) {
    this.playbackSpeed = speed;
    this.dom.sliderSpeed.value = speed;
    this.dom.speedValueDisplay.textContent = `${speed.toFixed(2)}x`;

    this.dom.speedButtons.forEach(btn => {
      const bSpeed = parseFloat(btn.dataset.speed);
      btn.classList.toggle('active', Math.abs(bSpeed - speed) < 0.01);
    });
  }

  togglePlayPause() {
    this.isPlaying = !this.isPlaying;
    if (this.isPlaying) {
      this.dom.btnPlayPause.innerHTML = '<span class="icon">⏸</span><span>Pausar</span>';
      this.dom.btnPlayPause.classList.remove('btn-success');
      this.dom.btnPlayPause.classList.add('btn-warning');
      this.prevTimestamp = 0;
      this.startAnimationLoop();
    } else {
      this.dom.btnPlayPause.innerHTML = '<span class="icon">▶</span><span>Reanudar</span>';
      this.dom.btnPlayPause.classList.remove('btn-warning');
      this.dom.btnPlayPause.classList.add('btn-success');
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  resetSimulation() {
    this.physics.resetTime();
    this.oscilloscopeHistory = [];
    this.dom.timeScrubber.value = 0;
    this.renderOnce();
    this.updateLiveTelemetry();
  }

  stepTime(direction = 1) {
    // Paso elemental correspondiente a 1/30 del periodo de oscilación
    const dt = (this.physics.period / 30) * direction;
    this.physics.advanceTime(dt);
    if (this.physics.time < 0) this.physics.time = 0;
    this.renderOnce();
    this.updateLiveTelemetry();
  }

  // --- SELECCIÓN DE ARMÓNICOS ---
  setHarmonic(n) {
    n = Math.max(1, Math.min(10, n));
    this.physics.harmonic = n;
    this.dom.sliderHarmonic.value = n;
    this.dom.numHarmonic.value = n;

    this.dom.harmonicPills.forEach(pill => {
      const h = parseInt(pill.dataset.harmonic, 10);
      pill.classList.toggle('active', h === n);
    });

    this.onPhysicsParamChanged();
  }

  onPhysicsParamChanged() {
    this.updateCalculations();
    this.audio.updateFrequency(this.physics.frequency, this.physics.harmonic);
    this.oscilloscopeHistory = [];
    if (!this.isPlaying) this.renderOnce();
  }

  updateProbeSliderMax() {
    const L = this.physics.length;
    this.dom.sliderProbe.max = L;
    this.dom.numProbe.max = L;
    if (parseFloat(this.dom.sliderProbe.value) > L) {
      this.dom.sliderProbe.value = (L / 2).toFixed(2);
      this.dom.numProbe.value = (L / 2).toFixed(2);
      this.physics.probeX = L / 2;
    }
  }

  updateAllInputsFromPhysics() {
    this.dom.sliderTension.value = this.physics.tension;
    this.dom.numTension.value = this.physics.tension;

    this.dom.sliderDensity.value = this.physics.density;
    this.dom.numDensity.value = this.physics.density;

    this.dom.sliderLength.value = this.physics.length;
    this.dom.numLength.value = this.physics.length;

    this.dom.sliderAmplitude.value = this.physics.amplitude;
    this.dom.numAmplitude.value = this.physics.amplitude;

    this.dom.sliderHarmonic.value = this.physics.harmonic;
    this.dom.numHarmonic.value = this.physics.harmonic;

    this.updateProbeSliderMax();
    this.dom.sliderProbe.value = this.physics.probeX;
    this.dom.numProbe.value = this.physics.probeX;

    this.setPlaybackSpeed(this.playbackSpeed);
  }

  // --- PRESETS DIDÁCTICOS ---
  loadPreset(key) {
    const presets = {
      fundamental: {
        tension: 100,
        density: 0.01,
        length: 2.0,
        amplitude: 0.4,
        harmonic: 1
      },
      harmonic2: {
        tension: 100,
        density: 0.01,
        length: 2.0,
        amplitude: 0.35,
        harmonic: 2
      },
      harmonic3: {
        tension: 120,
        density: 0.01,
        length: 2.4,
        amplitude: 0.3,
        harmonic: 3
      },
      guitar: {
        tension: 72,
        density: 0.007,
        length: 0.65,
        amplitude: 0.15,
        harmonic: 1
      },
      melde: {
        tension: 40,
        density: 0.004,
        length: 1.8,
        amplitude: 0.25,
        harmonic: 4
      },
      resonance: {
        tension: 150,
        density: 0.008,
        length: 3.0,
        amplitude: 0.2,
        harmonic: 6
      }
    };

    const cfg = presets[key];
    if (!cfg) return;

    this.physics.tension = cfg.tension;
    this.physics.density = cfg.density;
    this.physics.length = cfg.length;
    this.physics.amplitude = cfg.amplitude;
    this.physics.harmonic = cfg.harmonic;

    this.updateAllInputsFromPhysics();
    this.setHarmonic(cfg.harmonic);
    this.resetSimulation();
  }

  // --- BUCLE DE ANIMACIÓN PRINCIPAL ---
  startAnimationLoop() {
    const loop = (timestamp) => {
      if (!this.isPlaying) return;

      if (!this.prevTimestamp) {
        this.prevTimestamp = timestamp;
      }

      const dt = (timestamp - this.prevTimestamp) / 1000;
      this.prevTimestamp = timestamp;

      // Avance temporal amortiguado contra caídas de FPS
      if (dt < 0.1) {
        this.physics.advanceTime(dt * this.playbackSpeed);
      }

      this.render();
      this.updateLiveTelemetry();

      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  render() {
    if (this.canvasRenderer) {
      this.canvasRenderer.render();
    }
    this.renderOscilloscope();
  }

  renderOnce() {
    this.render();
    this.updateLiveTelemetry();
  }

  // --- RENDERIZADO DEL OSCILOSCOPIO (SONDA PUNTUAL x0) ---
  renderOscilloscope() {
    const canvas = this.dom.scopeCanvas;
    if (!canvas) return;
    if (canvas.width === 0 || canvas.height === 0) {
      this.resizeScopeCanvas();
    }
    const ctx = this.scopeCtx;
    const w = canvas.width;
    const h = canvas.height;

    // Registrar punto actual en el historial
    const x0 = this.physics.probeX;
    const y0 = this.physics.evaluateStandingWave(x0);
    this.oscilloscopeHistory.push({ t: this.physics.time, y: y0 });
    if (this.oscilloscopeHistory.length > this.maxOscilloscopePoints) {
      this.oscilloscopeHistory.shift();
    }

    // Limpieza
    ctx.fillStyle = this.canvasRenderer.isDark ? '#080d1a' : '#f8fafc';
    ctx.fillRect(0, 0, w, h);

    // Eje central y = 0
    const centerY = h / 2;
    ctx.strokeStyle = this.canvasRenderer.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(w, centerY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Curva del osciloscopio
    if (this.oscilloscopeHistory.length > 1) {
      const maxA = Math.max(0.05, this.physics.maxAmplitude);
      ctx.strokeStyle = '#f59e0b'; // Ámbar brillante
      ctx.lineWidth = 2.2;
      ctx.beginPath();

      const step = w / (this.maxOscilloscopePoints - 1);
      this.oscilloscopeHistory.forEach((pt, idx) => {
        const px = idx * step;
        const py = centerY - (pt.y / maxA) * (centerY * 0.85);
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();

      // Punto actual en el cabezal
      const lastPt = this.oscilloscopeHistory[this.oscilloscopeHistory.length - 1];
      const headX = (this.oscilloscopeHistory.length - 1) * step;
      const headY = centerY - (lastPt.y / maxA) * (centerY * 0.85);

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(headX, headY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Etiqueta indicadora
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillStyle = this.canvasRenderer.isDark ? '#94a3b8' : '#64748b';
    ctx.textAlign = 'left';
    ctx.fillText(`y(x₀, t) en x₀=${x0.toFixed(2)}m`, 8, 14);
  }

  resizeScopeCanvas() {
    const canvas = this.dom.scopeCanvas;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    let w = Math.round((rect.width || canvas.clientWidth || 320) * dpr);
    let h = Math.round((rect.height || canvas.clientHeight || 110) * dpr);
    if (w <= 0) w = 320;
    if (h <= 0) h = 110;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
  }

  // --- TELEMETRÍA DINÁMICA Y BARRAS DE ENERGÍA ---
  updateLiveTelemetry() {
    // Tiempo transcurrido
    const t = this.physics.time;
    this.dom.timeDisplay.textContent = `${t.toFixed(2)} s`;

    // Sincronizar scrubber si el usuario no lo está arrastrando activamente
    const T = this.physics.period;
    if (!this.isScrubbing && T > 0) {
      const cycleProgress = ((t % (2 * T)) / (2 * T)) * 100;
      this.dom.timeScrubber.value = cycleProgress;
    }

    // Datos de la sonda
    const x0 = this.physics.probeX;
    const y0 = this.physics.evaluateStandingWave(x0);
    const vy0 = this.physics.evaluateVelocity(x0);
    this.dom.probeXDisplay.textContent = `${x0.toFixed(2)} m`;
    this.dom.probeYDisplay.textContent = `${y0.toFixed(3)} m`;
    this.dom.probeVyDisplay.textContent = `${vy0.toFixed(2)} m/s`;

    // Medidores de Energía
    const K = this.physics.kineticEnergy;
    const U = this.physics.potentialEnergy;
    const E = this.physics.totalEnergy;

    const percentK = E > 0 ? (K / E) * 100 : 0;
    const percentU = E > 0 ? (U / E) * 100 : 0;

    this.dom.barKinetic.style.width = `${percentK.toFixed(1)}%`;
    this.dom.barPotential.style.width = `${percentU.toFixed(1)}%`;
    this.dom.barTotal.style.width = '100%';

    this.dom.valKinetic.textContent = `${K.toFixed(2)} J (${percentK.toFixed(0)}%)`;
    this.dom.valPotential.textContent = `${U.toFixed(2)} J (${percentU.toFixed(0)}%)`;
    this.dom.valTotal.textContent = `${E.toFixed(2)} J (100%)`;
  }

  // --- CÁLCULOS ANALÍTICOS (FÓRMULAS Y KATEX) ---
  updateCalculations() {
    const v = this.physics.waveSpeed;
    const f = this.physics.frequency;
    const lambda = this.physics.wavelength;
    const T = this.physics.period;
    const omega = this.physics.omega;
    const k = this.physics.waveNumber;
    const dNN = this.physics.nodeDistance;
    const dNA = this.physics.nodeAntinodeDistance;
    const numNodes = this.physics.totalNodes;
    const numAntinodes = this.physics.totalAntinodes;

    this.dom.calcSpeed.textContent = `${v.toFixed(2)} m/s`;
    this.dom.calcFreq.textContent = `${f.toFixed(2)} Hz`;
    this.dom.calcWavelength.textContent = `${lambda.toFixed(3)} m`;
    this.dom.calcPeriod.textContent = `${T.toFixed(3)} s`;
    this.dom.calcOmega.textContent = `${omega.toFixed(2)} rad/s`;
    this.dom.calcWaveNumber.textContent = `${k.toFixed(2)} rad/m`;
    this.dom.calcNodeDistance.textContent = `${dNN.toFixed(3)} m`;
    this.dom.calcNodeAntinodeDist.textContent = `${dNA.toFixed(3)} m`;
    this.dom.calcNodesCount.textContent = `${numNodes} nodos (${numNodes - 2} interiores)`;
    this.dom.calcAntinodesCount.textContent = `${numAntinodes} vientres`;

    // Listas de posiciones de nodos y antinodos
    const nodes = this.physics.getNodePositions();
    const antinodes = this.physics.getAntinodePositions();

    this.dom.calcNodesList.innerHTML = nodes.map((x, i) => `<span class="badge badge-node">N${i}: ${x.toFixed(2)}m</span>`).join(' ');
    this.dom.calcAntinodesList.innerHTML = antinodes.map((x, i) => `<span class="badge badge-antinode">A${i + 1}: ${x.toFixed(2)}m</span>`).join(' ');

    // Renderizar KaTeX si está disponible
    this.renderMath();
  }

  renderMath() {
    if (window.renderMathInElement) {
      try {
        window.renderMathInElement(document.body, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false }
          ],
          throwOnError: false
        });
      } catch (err) {
        console.warn('Aviso KaTeX:', err);
      }
    } else {
      window.addEventListener('load', () => {
        if (window.renderMathInElement) {
          try {
            window.renderMathInElement(document.body, {
              delimiters: [
                { left: '$$', right: '$$', display: true },
                { left: '$', right: '$', display: false }
              ],
              throwOnError: false
            });
          } catch (e) {}
        }
      }, { once: true });
    }
  }

  // --- TEMA CLARO / OSCURO ---
  toggleTheme() {
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const nextTheme = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nextTheme);

    this.canvasRenderer.setTheme(!isDark);
    this.dom.btnTheme.innerHTML = !isDark
      ? '<span>☀️</span><span>Tema Claro</span>'
      : '<span>🌙</span><span>Tema Oscuro</span>';

    this.renderOnce();
  }

  // --- EXPORTAR IMAGEN PNG ---
  exportCanvasPNG() {
    const dataURL = this.canvasRenderer.canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `Ondas_Estacionarias_n${this.physics.harmonic}_T${this.physics.tension}N.png`;
    link.href = dataURL;
    link.click();
  }

  // --- EXPORTAR DATOS EN CSV ---
  exportDataCSV() {
    const p = this.physics;
    const nodes = p.getNodePositions().map(n => n.toFixed(3)).join('; ');
    const antinodes = p.getAntinodePositions().map(a => a.toFixed(3)).join('; ');

    const rows = [
      ['Parámetro', 'Valor', 'Unidad'],
      ['Tensión (T)', p.tension.toFixed(2), 'N'],
      ['Densidad Lineal (mu)', p.density.toFixed(4), 'kg/m'],
      ['Longitud de la Cuerda (L)', p.length.toFixed(2), 'm'],
      ['Amplitud Viajera (A)', p.amplitude.toFixed(3), 'm'],
      ['Amplitud Máxima Estacionaria (2A)', p.maxAmplitude.toFixed(3), 'm'],
      ['Número de Armónico (n)', p.harmonic, 'adimensional'],
      ['Velocidad de Propagación (v)', p.waveSpeed.toFixed(2), 'm/s'],
      ['Frecuencia Propia (fn)', p.frequency.toFixed(2), 'Hz'],
      ['Periodo de Oscilación (T)', p.period.toFixed(4), 's'],
      ['Frecuencia Angular (omega)', p.omega.toFixed(2), 'rad/s'],
      ['Longitud de Onda (lambda)', p.wavelength.toFixed(3), 'm'],
      ['Número de Onda (k)', p.waveNumber.toFixed(2), 'rad/m'],
      ['Distancia entre Nodos (lambda/2)', p.nodeDistance.toFixed(3), 'm'],
      ['Distancia Nodo-Antinodo (lambda/4)', p.nodeAntinodeDistance.toFixed(3), 'm'],
      ['Total de Nodos', p.totalNodes, 'nodos'],
      ['Total de Antinodos (Vientres)', p.totalAntinodes, 'vientres'],
      ['Posiciones de Nodos [m]', `"${nodes}"`, 'm'],
      ['Posiciones de Antinodos [m]', `"${antinodes}"`, 'm'],
      ['Energía Mecánica Total (E)', p.totalEnergy.toFixed(3), 'J'],
      ['Fecha y Hora de Exportación', `"${new Date().toLocaleString('es-CO')}"`, 'marca temporal']
    ];

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Datos_Ondas_Estacionarias_n${p.harmonic}_${p.tension}N.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // --- CONFIGURACIÓN DE MODALES ---
  setupModals() {
    const modalTheory = document.getElementById('modalTheory');
    const modalQuiz = document.getElementById('modalQuiz');

    const openModal = (modal) => {
      modal.classList.add('active');
      this.renderMath();
    };

    const closeModal = (modal) => {
      modal.classList.remove('active');
    };

    this.dom.btnTheory.addEventListener('click', () => openModal(modalTheory));
    this.dom.btnQuiz.addEventListener('click', () => openModal(modalQuiz));

    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal-backdrop');
        if (modal) closeModal(modal);
      });
    });

    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) closeModal(backdrop);
      });
    });

    // Lógica del cuestionario interactivo
    this.setupQuizLogic();
  }

  setupQuizLogic() {
    const questions = [
      {
        id: 'q1',
        correct: 'b',
        feedback: '¡Exacto! La distancia entre dos nodos consecutivos es siempre media longitud de onda: λ / 2.'
      },
      {
        id: 'q2',
        correct: 'c',
        feedback: '¡Correcto! En los nodos la cuerda no se mueve (y = 0 y vy = 0 en todo instante).'
      },
      {
        id: 'q3',
        correct: 'a',
        feedback: '¡Excelente! Dado que v = √(T/μ), si cuadruplicamos la tensión (4T), la velocidad se duplica (√4 = 2).'
      }
    ];

    document.querySelectorAll('.quiz-option').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const parent = btn.closest('.quiz-question');
        const qId = parent.dataset.qid;
        const qData = questions.find(q => q.id === qId);
        if (!qData) return;

        parent.querySelectorAll('.quiz-option').forEach(o => o.classList.remove('selected', 'correct', 'wrong'));
        btn.classList.add('selected');

        const isCorrect = btn.dataset.choice === qData.correct;
        btn.classList.add(isCorrect ? 'correct' : 'wrong');

        const feedbackEl = parent.querySelector('.quiz-feedback');
        if (feedbackEl) {
          feedbackEl.textContent = isCorrect ? `✓ ${qData.feedback}` : '✗ Respuesta incorrecta. Revisa la fundamentación teórica.';
          feedbackEl.className = `quiz-feedback ${isCorrect ? 'text-success' : 'text-danger'}`;
          feedbackEl.style.display = 'block';
        }
      });
    });
  }
}

// Iniciar aplicación asegurando ejecución inmediata o en DOMContentLoaded
function bootstrapStandingWaveApp() {
  if (!window.waveApp) {
    window.waveApp = new StandingWaveApp();
    window.waveApp.init();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrapStandingWaveApp);
} else {
  bootstrapStandingWaveApp();
}
