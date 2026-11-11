/**
 * doppler-ui.js
 * Coordinador de interfaz de usuario, eventos, animación y sincronización integral
 * para el Simulador Avanzado del Efecto Doppler.
 */

(function () {
  'use strict';

  // Instancias principales
  let engine = null;
  let audio = null;
  let renderer = null;
  let graphs = null;
  let codeRunner = null;

  // Estado de animación
  let isPlaying = false;
  let lastTimestamp = 0;
  let animFrameId = null;

  // Escenario didáctico activo
  let currentScenarioIndex = 0;

  // DOM Elements Cache
  const DOM = {};

  function init() {
    cacheDOMElements();

    // 1. Inicializar Motores
    engine = new DopplerPhysics.DopplerEngine({
      f: 2.0,
      c: 340.0,
      vx_f: 0.0,
      vy_f: 0.0,
      vx_o: 0.0,
      vy_o: 0.0,
      x_f0: -170.0,
      y_f0: 0.0,
      x_o0: 170.0,
      y_o0: 0.0,
      is2D: false,
      durationMode: 'fixed',
      fixedDuration: 10.0
    });

    audio = new DopplerAudio();
    renderer = new DopplerCanvas(DOM.dopplerCanvas, engine, {
      theme: 'dark',
      sourceAvatar: 'jet',
      waveStyle: 'solid',
      waveColor: '#38bdf8'
    });

    graphs = new DopplerGraphs(DOM.graphCanvas, engine, {
      theme: 'dark',
      channel: 'frequency'
    });

    codeRunner = new DopplerCodeLab.CodeLabRunner();

    // Callbacks del renderer
    renderer.onPositionChanged = (target, x, y) => {
      syncInputsFromEngine();
      updateUI();
    };

    renderer.onWaveSelected = (wave) => {
      if (wave) {
        showWaveInspectorToast(wave);
      }
    };

    // 2. Vincular eventos de la UI
    bindUIEvents();

    // 3. Cargar escenarios didácticos en selector
    loadDidacticScenarios();

    // 4. Render inicial y fórmulas
    window.addEventListener('resize', handleWindowResize);
    handleWindowResize();

    syncInputsFromEngine();
    updateUI();
    renderMathFormulas();

    // Notificar al usuario que EfectoDoppler.html fue cargado
    console.log('Simulador del Efecto Doppler inicializado correctamente en español (es-CO).');
  }

  function cacheDOMElements() {
    DOM.appBody = document.querySelector('.app-body');
    DOM.btnModeExploration = document.getElementById('btnModeExploration');
    DOM.btnModeLab = document.getElementById('btnModeLab');
    DOM.btnThemeToggle = document.getElementById('btnThemeToggle');
    DOM.btnToggleAudio = document.getElementById('btnToggleAudio');
    DOM.btnHelpModal = document.getElementById('btnHelpModal');
    DOM.btnValidationModal = document.getElementById('btnValidationModal');

    DOM.welcomeBanner = document.getElementById('welcomeBanner');
    DOM.btnCloseBanner = document.getElementById('btnCloseBanner');

    // Canvas
    DOM.dopplerCanvas = document.getElementById('dopplerCanvas');
    DOM.graphCanvas = document.getElementById('graphCanvas');

    // Herramientas flotantes
    DOM.btnToolSelect = document.getElementById('btnToolSelect');
    DOM.btnToolMeasure = document.getElementById('btnToolMeasure');
    DOM.btnToolPan = document.getElementById('btnToolPan');
    DOM.btnZoomIn = document.getElementById('btnZoomIn');
    DOM.btnZoomOut = document.getElementById('btnZoomOut');
    DOM.btnFitScene = document.getElementById('btnFitScene');
    DOM.btnResetView = document.getElementById('btnResetView');
    DOM.btnFollowSource = document.getElementById('btnFollowSource');
    DOM.selectSourceAvatar = document.getElementById('selectSourceAvatar');
    DOM.selectWaveStyle = document.getElementById('selectWaveStyle');
    DOM.shockAlert = document.getElementById('shockAlert');

    // Reproducción
    DOM.btnPlayPause = document.getElementById('btnPlayPause');
    DOM.btnPlayIcon = document.getElementById('btnPlayIcon');
    DOM.btnRestart = document.getElementById('btnRestart');
    DOM.btnStepSubdiv = document.getElementById('btnStepSubdiv');
    DOM.btnStepPeriod = document.getElementById('btnStepPeriod');
    DOM.timelineSlider = document.getElementById('timelineSlider');
    DOM.lblCurrentTime = document.getElementById('lblCurrentTime');
    DOM.lblMaxTime = document.getElementById('lblMaxTime');
    DOM.selectPlaybackSpeed = document.getElementById('selectPlaybackSpeed');

    // Controles físicos
    DOM.sliderFreq = document.getElementById('sliderFreq');
    DOM.numFreq = document.getElementById('numFreq');
    DOM.sliderC = document.getElementById('sliderC');
    DOM.numC = document.getElementById('numC');
    DOM.sliderVf = document.getElementById('sliderVf');
    DOM.numVf = document.getElementById('numVf');
    DOM.sliderVo = document.getElementById('sliderVo');
    DOM.numVo = document.getElementById('numVo');
    DOM.sliderVf2DY = document.getElementById('sliderVf2DY');
    DOM.numVf2DY = document.getElementById('numVf2DY');
    DOM.row2DY = document.getElementById('row2DY');
    DOM.chk2DMode = document.getElementById('chk2DMode');

    // Duración
    DOM.selectDurationMode = document.getElementById('selectDurationMode');
    DOM.groupFixedDuration = document.getElementById('groupFixedDuration');
    DOM.groupNumPeriods = document.getElementById('groupNumPeriods');
    DOM.numFixedDuration = document.getElementById('numFixedDuration');
    DOM.numNumPeriods = document.getElementById('numNumPeriods');

    // Telemetría rápida
    DOM.telMach = document.getElementById('telMach');
    DOM.telRegime = document.getElementById('telRegime');
    DOM.telDist = document.getElementById('telDist');
    DOM.telLambdaAhead = document.getElementById('telLambdaAhead');
    DOM.telLambdaBehind = document.getElementById('telLambdaBehind');
    DOM.telEmitted = document.getElementById('telEmitted');
    DOM.telReceived = document.getElementById('telReceived');
    DOM.telFoInstant = document.getElementById('telFoInstant');
    DOM.telFMeas = document.getElementById('telFMeas');

    // Pestañas de Laboratorio
    DOM.labTabBtns = document.querySelectorAll('.lab-tab-btn');
    DOM.labTabContents = document.querySelectorAll('.lab-tab-content');
    DOM.selectGraphChannel = document.getElementById('selectGraphChannel');
    DOM.btnExportCSV = document.getElementById('btnExportCSV');
    DOM.btnExportPNG = document.getElementById('btnExportPNG');

    // Escenarios
    DOM.selectScenario = document.getElementById('selectScenario');
    DOM.scenarioGoal = document.getElementById('scenarioGoal');
    DOM.scenarioProcedure = document.getElementById('scenarioProcedure');
    DOM.scenarioExplanation = document.getElementById('scenarioExplanation');
    DOM.quizContainer = document.getElementById('quizContainer');
    DOM.btnApplyScenario = document.getElementById('btnApplyScenario');

    // Código
    DOM.selectCodeSnippet = document.getElementById('selectCodeSnippet');
    DOM.codeTextarea = document.getElementById('codeTextarea');
    DOM.btnRunCode = document.getElementById('btnRunCode');
    DOM.codeConsole = document.getElementById('codeConsole');

    // Modal
    DOM.modalHelp = document.getElementById('modalHelp');
    DOM.btnCloseHelp = document.getElementById('btnCloseHelp');
    DOM.modalValidation = document.getElementById('modalValidation');
    DOM.btnCloseValidation = document.getElementById('btnCloseValidation');
    DOM.btnRunValidationSuite = document.getElementById('btnRunValidationSuite');
    DOM.validationResultsContainer = document.getElementById('validationResultsContainer');

    // Tabla de llegadas
    DOM.arrivalTableBody = document.getElementById('arrivalTableBody');

    // Formulación matemática
    DOM.mathSymbolic = document.getElementById('mathSymbolic');
    DOM.mathSubstitutions = document.getElementById('mathSubstitutions');
    DOM.mathResult = document.getElementById('mathResult');

    // Botones de Presets de Movimiento Relativo
    DOM.presetSourceTowards = document.getElementById('presetSourceTowards');
    DOM.presetSourceAway = document.getElementById('presetSourceAway');
    DOM.presetObserverTowards = document.getElementById('presetObserverTowards');
    DOM.presetObserverAway = document.getElementById('presetObserverAway');
    DOM.presetBothTowards = document.getElementById('presetBothTowards');
    DOM.presetBothAway = document.getElementById('presetBothAway');
    DOM.presetPassBy = document.getElementById('presetPassBy');
    DOM.presetRest = document.getElementById('presetRest');

    // Botones de Dirección individuales para Fuente y Observador
    DOM.btnDirSourceAway = document.getElementById('btnDirSourceAway');
    DOM.btnDirSourceRest = document.getElementById('btnDirSourceRest');
    DOM.btnDirSourceTowards = document.getElementById('btnDirSourceTowards');
    DOM.btnDirObserverTowards = document.getElementById('btnDirObserverTowards');
    DOM.btnDirObserverRest = document.getElementById('btnDirObserverRest');
    DOM.btnDirObserverAway = document.getElementById('btnDirObserverAway');

    // Banner de estado de movimiento dinámico
    DOM.motionStatusBadge = document.getElementById('motionStatusBadge');
    DOM.motionStatusIcon = document.getElementById('motionStatusIcon');
    DOM.motionStatusText = document.getElementById('motionStatusText');
    DOM.motionStatusTag = document.getElementById('motionStatusTag');
  }

  function bindUIEvents() {
    // Banner inicial
    DOM.btnCloseBanner.addEventListener('click', () => {
      DOM.welcomeBanner.style.display = 'none';
    });

    // Alternar niveles
    DOM.btnModeExploration.addEventListener('click', () => setAppMode('exploration'));
    DOM.btnModeLab.addEventListener('click', () => setAppMode('lab'));

    // Modo Claro / Oscuro
    DOM.btnThemeToggle.addEventListener('click', toggleTheme);

    // Activar Audio (Web Audio API)
    DOM.btnToggleAudio.addEventListener('click', async () => {
      if (!audio.isEnabled) {
        const ok = await audio.enableAudio();
        if (ok) {
          DOM.btnToggleAudio.classList.add('audio-active');
          DOM.btnToggleAudio.querySelector('span:last-child').textContent = 'Audio: Activo';
        }
      } else {
        audio.disableAudio();
        DOM.btnToggleAudio.classList.remove('audio-active');
        DOM.btnToggleAudio.querySelector('span:last-child').textContent = 'Audio: Silenciado';
      }
    });

    // Reproducción
    DOM.btnPlayPause.addEventListener('click', togglePlay);
    DOM.btnRestart.addEventListener('click', restartSimulation);
    DOM.btnStepSubdiv.addEventListener('click', () => stepManual(1 / (engine.f * engine.subdivisionsPerPeriod)));
    DOM.btnStepPeriod.addEventListener('click', () => stepManual(1 / engine.f));

    // Deslizador temporal (Scrubbing)
    DOM.timelineSlider.addEventListener('input', (e) => {
      const targetTime = parseFloat(e.target.value);
      engine.rebuildHistoryUpTo(targetTime);
      audio.silenceAll();
      updateUI();
    });

    DOM.selectPlaybackSpeed.addEventListener('change', (e) => {
      engine.playbackRate = parseFloat(e.target.value);
    });

    // Sincronización de Sliders y Números
    bindSyncedControl(DOM.sliderFreq, DOM.numFreq, (val) => {
      engine.setFrequency(val);
      updateTimelineRange();
      updateUI();
      renderMathFormulas();
    });

    bindSyncedControl(DOM.sliderC, DOM.numC, (val) => {
      engine.setSoundSpeed(val);
      updateUI();
      renderMathFormulas();
    });

    bindSyncedControl(DOM.sliderVf, DOM.numVf, (val) => {
      engine.setSourceVelocity(val, engine.source.vy);
      updateUI();
      renderMathFormulas();
    });

    bindSyncedControl(DOM.sliderVo, DOM.numVo, (val) => {
      engine.setObserverVelocity(val, engine.observer.vy);
      updateUI();
      renderMathFormulas();
    });

    bindSyncedControl(DOM.sliderVf2DY, DOM.numVf2DY, (val) => {
      engine.setSourceVelocity(engine.source.vx, val);
      updateUI();
      renderMathFormulas();
    });

    // Alternar modo 2D
    DOM.chk2DMode.addEventListener('change', (e) => {
      engine.is2D = e.target.checked;
      DOM.row2DY.style.display = engine.is2D ? 'block' : 'none';
      renderer.fitScene();
      updateUI();
    });

    // Duración
    DOM.selectDurationMode.addEventListener('change', (e) => {
      engine.durationMode = e.target.value;
      if (engine.durationMode === 'fixed') {
        DOM.groupFixedDuration.style.display = 'block';
        DOM.groupNumPeriods.style.display = 'none';
      } else {
        DOM.groupFixedDuration.style.display = 'none';
        DOM.groupNumPeriods.style.display = 'block';
      }
      engine.maxTime = engine.calculateTotalTime();
      updateTimelineRange();
      updateUI();
    });

    DOM.numFixedDuration.addEventListener('change', (e) => {
      const val = Math.max(1, Math.min(60, parseFloat(e.target.value) || 10));
      engine.fixedDuration = val;
      engine.maxTime = engine.calculateTotalTime();
      updateTimelineRange();
      updateUI();
    });

    DOM.numNumPeriods.addEventListener('change', (e) => {
      const val = Math.max(1, Math.min(50, parseInt(e.target.value, 10) || 20));
      engine.numPeriods = val;
      engine.maxTime = engine.calculateTotalTime();
      updateTimelineRange();
      updateUI();
    });

    // Presets Rápidos de Movimiento Relativo (Barra Superior)
    if (DOM.presetSourceTowards) DOM.presetSourceTowards.addEventListener('click', () => setMotionMode('source_towards'));
    if (DOM.presetSourceAway) DOM.presetSourceAway.addEventListener('click', () => setMotionMode('source_away'));
    if (DOM.presetObserverTowards) DOM.presetObserverTowards.addEventListener('click', () => setMotionMode('observer_towards'));
    if (DOM.presetObserverAway) DOM.presetObserverAway.addEventListener('click', () => setMotionMode('observer_away'));
    if (DOM.presetBothTowards) DOM.presetBothTowards.addEventListener('click', () => setMotionMode('both_towards'));
    if (DOM.presetBothAway) DOM.presetBothAway.addEventListener('click', () => setMotionMode('both_away'));
    if (DOM.presetPassBy) DOM.presetPassBy.addEventListener('click', () => setMotionMode('pass_by'));
    if (DOM.presetRest) DOM.presetRest.addEventListener('click', () => setMotionMode('rest'));

    // Botones de dirección individuales de la Fuente
    if (DOM.btnDirSourceAway) {
      DOM.btnDirSourceAway.addEventListener('click', () => {
        const curV = Math.abs(parseFloat(DOM.numVf.value) || 85);
        engine.setSourceVelocity(-curV, engine.source.vy);
        syncInputsFromEngine();
        updateUI();
        renderMathFormulas();
        playSimulation();
      });
    }
    if (DOM.btnDirSourceRest) {
      DOM.btnDirSourceRest.addEventListener('click', () => {
        engine.setSourceVelocity(0, engine.source.vy);
        syncInputsFromEngine();
        updateUI();
        renderMathFormulas();
      });
    }
    if (DOM.btnDirSourceTowards) {
      DOM.btnDirSourceTowards.addEventListener('click', () => {
        const curV = Math.abs(parseFloat(DOM.numVf.value) || 85);
        engine.setSourceVelocity(curV, engine.source.vy);
        syncInputsFromEngine();
        updateUI();
        renderMathFormulas();
        playSimulation();
      });
    }

    // Botones de dirección individuales del Observador
    if (DOM.btnDirObserverTowards) {
      DOM.btnDirObserverTowards.addEventListener('click', () => {
        const curV = Math.abs(parseFloat(DOM.numVo.value) || 51);
        engine.setObserverVelocity(-curV, engine.observer.vy);
        syncInputsFromEngine();
        updateUI();
        renderMathFormulas();
        playSimulation();
      });
    }
    if (DOM.btnDirObserverRest) {
      DOM.btnDirObserverRest.addEventListener('click', () => {
        engine.setObserverVelocity(0, engine.observer.vy);
        syncInputsFromEngine();
        updateUI();
        renderMathFormulas();
      });
    }
    if (DOM.btnDirObserverAway) {
      DOM.btnDirObserverAway.addEventListener('click', () => {
        const curV = Math.abs(parseFloat(DOM.numVo.value) || 51);
        engine.setObserverVelocity(curV, engine.observer.vy);
        syncInputsFromEngine();
        updateUI();
        renderMathFormulas();
        playSimulation();
      });
    }

    // Herramientas del Canvas
    DOM.btnToolSelect.addEventListener('click', () => setCanvasTool('select'));
    DOM.btnToolMeasure.addEventListener('click', () => setCanvasTool('measure'));
    DOM.btnToolPan.addEventListener('click', () => setCanvasTool('pan'));

    DOM.btnZoomIn.addEventListener('click', () => {
      renderer.scale = Math.min(20, renderer.scale * 1.25);
    });
    DOM.btnZoomOut.addEventListener('click', () => {
      renderer.scale = Math.max(0.1, renderer.scale * 0.8);
    });
    DOM.btnFitScene.addEventListener('click', () => renderer.fitScene());
    DOM.btnResetView.addEventListener('click', () => renderer.resetView());

    DOM.btnFollowSource.addEventListener('click', () => {
      renderer.followSource = !renderer.followSource;
      DOM.btnFollowSource.classList.toggle('active', renderer.followSource);
    });

    DOM.selectSourceAvatar.addEventListener('change', (e) => {
      renderer.sourceAvatar = e.target.value;
    });

    DOM.selectWaveStyle.addEventListener('change', (e) => {
      renderer.waveStyle = e.target.value;
    });

    // Pestañas de Laboratorio
    DOM.labTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;
        DOM.labTabBtns.forEach(b => b.classList.remove('active'));
        DOM.labTabContents.forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        const content = document.getElementById(`tab-${targetTab}`);
        if (content) content.classList.add('active');

        if (targetTab === 'graphs') {
          graphs.resize();
          graphs.render();
        }
      });
    });

    DOM.selectGraphChannel.addEventListener('change', (e) => {
      graphs.setChannel(e.target.value);
      graphs.render();
    });

    // Exportación
    DOM.btnExportCSV.addEventListener('click', () => graphs.exportCSV());
    DOM.btnExportPNG.addEventListener('click', exportCanvasPNG);

    // Escenarios
    DOM.selectScenario.addEventListener('change', (e) => {
      loadScenario(parseInt(e.target.value, 10));
    });
    DOM.btnApplyScenario.addEventListener('click', () => {
      applyCurrentScenario();
    });

    // Código
    DOM.selectCodeSnippet.addEventListener('change', (e) => {
      const key = e.target.value;
      if (DopplerCodeLab.PRESET_SCRIPTS[key]) {
        DOM.codeTextarea.value = DopplerCodeLab.PRESET_SCRIPTS[key];
      }
    });
    DOM.btnRunCode.addEventListener('click', runUserCode);

    // Modales
    DOM.btnHelpModal.addEventListener('click', () => DOM.modalHelp.classList.add('active'));
    DOM.btnCloseHelp.addEventListener('click', () => DOM.modalHelp.classList.remove('active'));
    DOM.btnValidationModal.addEventListener('click', () => {
      DOM.modalValidation.classList.add('active');
      runScientificSuite();
    });
    DOM.btnCloseValidation.addEventListener('click', () => DOM.modalValidation.classList.remove('active'));
    DOM.btnRunValidationSuite.addEventListener('click', runScientificSuite);

    // Teclado (Accesibilidad de controles de transporte)
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'KeyR') {
        restartSimulation();
      } else if (e.code === 'ArrowRight') {
        stepManual(1 / (engine.f * 50));
      } else if (e.code === 'Escape') {
        DOM.modalHelp.classList.remove('active');
        DOM.modalValidation.classList.remove('active');
      }
    });
  }

  function bindSyncedControl(slider, num, onChange) {
    slider.addEventListener('input', () => {
      const val = parseFloat(slider.value);
      num.value = val;
      onChange(val);
    });

    num.addEventListener('change', () => {
      let val = parseFloat(num.value);
      const min = parseFloat(slider.min);
      const max = parseFloat(slider.max);
      val = Math.max(min, Math.min(max, val));
      num.value = val;
      slider.value = val;
      onChange(val);
    });
  }

  function setAppMode(mode) {
    if (mode === 'exploration') {
      DOM.btnModeExploration.classList.add('active');
      DOM.btnModeLab.classList.remove('active');
      DOM.appBody.classList.add('exploration-mode');
    } else {
      DOM.btnModeExploration.classList.remove('active');
      DOM.btnModeLab.classList.add('active');
      DOM.appBody.classList.remove('exploration-mode');
    }
    setTimeout(() => {
      renderer.resize();
      graphs.resize();
    }, 50);
  }

  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    DOM.btnThemeToggle.querySelector('span:last-child').textContent = newTheme === 'dark' ? 'Oscuro' : 'Claro';
    renderer.theme = newTheme;
    graphs.setTheme(newTheme);
    renderer.render();
    graphs.render();
  }

  function setCanvasTool(tool) {
    renderer.activeTool = tool;
    DOM.btnToolSelect.classList.toggle('active', tool === 'select');
    DOM.btnToolMeasure.classList.toggle('active', tool === 'measure');
    DOM.btnToolPan.classList.toggle('active', tool === 'pan');
  }

  function updateTimelineRange() {
    DOM.timelineSlider.max = engine.maxTime;
    DOM.lblMaxTime.textContent = `${engine.maxTime.toFixed(1)}s`;
  }

  function syncInputsFromEngine() {
    DOM.sliderFreq.value = engine.f;
    DOM.numFreq.value = engine.f;
    DOM.sliderC.value = engine.c;
    DOM.numC.value = engine.c;
    DOM.sliderVf.value = engine.source.vx;
    DOM.numVf.value = engine.source.vx;
    DOM.sliderVo.value = engine.observer.vx;
    DOM.numVo.value = engine.observer.vx;
    DOM.sliderVf2DY.value = engine.source.vy;
    DOM.numVf2DY.value = engine.source.vy;
    DOM.chk2DMode.checked = engine.is2D;
    DOM.row2DY.style.display = engine.is2D ? 'block' : 'none';

    updateTimelineRange();
  }

  // Bucle de animación continuo
  function playSimulation() {
    if (isPlaying) return;
    if (engine.currentTime >= engine.maxTime - 0.001) {
      engine.rebuildHistoryUpTo(0);
    }
    isPlaying = true;
    lastTimestamp = performance.now();
    DOM.btnPlayIcon.textContent = '⏸';
    DOM.btnPlayPause.title = 'Pausar (Espacio)';
    animFrameId = requestAnimationFrame(animationLoop);
  }

  function setMotionMode(mode) {
    // Desmarcar todos los presets activos
    document.querySelectorAll('.presets-bar .btn-preset').forEach(b => b.classList.remove('active'));

    switch (mode) {
      case 'source_towards': {
        if (DOM.presetSourceTowards) DOM.presetSourceTowards.classList.add('active');
        // Fuente a la izquierda (-260m) viajando hacia la derecha hacia el observador (+140m)
        engine.setPositions(-260, 0, 140, 0);
        engine.setSourceVelocity(85, 0); // ~Mach 0.25
        engine.setObserverVelocity(0, 0);
        break;
      }
      case 'source_away': {
        if (DOM.presetSourceAway) DOM.presetSourceAway.classList.add('active');
        // Fuente a la izquierda (-40m) retrocediendo hacia la izquierda alejándose del observador (+140m)
        engine.setPositions(-40, 0, 140, 0);
        engine.setSourceVelocity(-85, 0);
        engine.setObserverVelocity(0, 0);
        break;
      }
      case 'observer_towards': {
        if (DOM.presetObserverTowards) DOM.presetObserverTowards.classList.add('active');
        // Observador a la derecha (+260m) avanzando hacia la izquierda hacia la fuente (-140m)
        engine.setPositions(-140, 0, 260, 0);
        engine.setSourceVelocity(0, 0);
        engine.setObserverVelocity(-51, 0); // 15% de c
        break;
      }
      case 'observer_away': {
        if (DOM.presetObserverAway) DOM.presetObserverAway.classList.add('active');
        // Observador a la derecha (+40m) huyendo hacia la derecha alejándose de la fuente (-140m)
        engine.setPositions(-140, 0, 40, 0);
        engine.setSourceVelocity(0, 0);
        engine.setObserverVelocity(51, 0);
        break;
      }
      case 'both_towards': {
        if (DOM.presetBothTowards) DOM.presetBothTowards.classList.add('active');
        // Ambos avanzan al encuentro
        engine.setPositions(-240, 0, 240, 0);
        engine.setSourceVelocity(68, 0);
        engine.setObserverVelocity(-34, 0);
        break;
      }
      case 'both_away': {
        if (DOM.presetBothAway) DOM.presetBothAway.classList.add('active');
        // Ambos se alejan dándose la espalda
        engine.setPositions(-40, 0, 40, 0);
        engine.setSourceVelocity(-68, 0);
        engine.setObserverVelocity(34, 0);
        break;
      }
      case 'pass_by': {
        if (DOM.presetPassBy) DOM.presetPassBy.classList.add('active');
        // Cruce completo: la fuente arranca lejos (-300m), pasa al observador (0m) y sigue (+x)
        engine.setPositions(-300, 0, 0, 0);
        engine.setSourceVelocity(102, 0); // Mach 0.3
        engine.setObserverVelocity(0, 0);
        break;
      }
      case 'rest': {
        if (DOM.presetRest) DOM.presetRest.classList.add('active');
        engine.setPositions(-170, 0, 170, 0);
        engine.setSourceVelocity(0, 0);
        engine.setObserverVelocity(0, 0);
        break;
      }
    }

    syncInputsFromEngine();
    renderer.fitScene();
    engine.rebuildHistoryUpTo(0);
    updateUI();
    renderMathFormulas();

    // Auto-iniciar la reproducción para que el usuario VEA INMEDIATAMENTE EL MOVIMIENTO
    if (mode !== 'rest') {
      playSimulation();
    } else {
      pauseSimulation();
    }
  }

  function updateMotionButtonsAndBadge() {
    const vx = engine.source.vx;
    const vo = engine.observer.vx;
    const sf = engine.getSourcePos(engine.currentTime);
    const so = engine.getObserverPos(engine.currentTime);

    // 1. Botones de dirección de la fuente
    if (DOM.btnDirSourceAway && DOM.btnDirSourceRest && DOM.btnDirSourceTowards) {
      DOM.btnDirSourceAway.classList.remove('active-away', 'active-towards', 'active-rest');
      DOM.btnDirSourceRest.classList.remove('active-away', 'active-towards', 'active-rest');
      DOM.btnDirSourceTowards.classList.remove('active-away', 'active-towards', 'active-rest');

      if (vx < -0.5) {
        DOM.btnDirSourceAway.classList.add('active-away');
      } else if (vx > 0.5) {
        DOM.btnDirSourceTowards.classList.add('active-towards');
      } else {
        DOM.btnDirSourceRest.classList.add('active-rest');
      }
    }

    // 2. Botones de dirección del observador
    if (DOM.btnDirObserverTowards && DOM.btnDirObserverRest && DOM.btnDirObserverAway) {
      DOM.btnDirObserverTowards.classList.remove('active-towards', 'active-away', 'active-rest');
      DOM.btnDirObserverRest.classList.remove('active-towards', 'active-away', 'active-rest');
      DOM.btnDirObserverAway.classList.remove('active-towards', 'active-away', 'active-rest');

      if (vo < -0.5) {
        DOM.btnDirObserverTowards.classList.add('active-towards');
      } else if (vo > 0.5) {
        DOM.btnDirObserverAway.classList.add('active-away');
      } else {
        DOM.btnDirObserverRest.classList.add('active-rest');
      }
    }

    // 3. Banner dinámico de estado de movimiento
    if (DOM.motionStatusBadge && DOM.motionStatusText && DOM.motionStatusTag) {
      const isSourceMoving = Math.abs(vx) > 0.5;
      const isObsMoving = Math.abs(vo) > 0.5;
      const rateOfDistanceChange = (so.x > sf.x) ? (vo - vx) : (vx - vo);

      let icon = '🛑';
      let tagText = 'REPOSO';
      let tagColor = '#94a3b8';
      let tagBg = 'rgba(100,116,139,0.2)';
      let description = '';

      if (isSourceMoving && !isObsMoving) {
        const isApproaching = rateOfDistanceChange < -0.1;
        if (isApproaching) {
          icon = '🚗 ➡';
          tagText = 'FUENTE ACERCÁNDOSE';
          tagColor = '#10b981';
          tagBg = 'rgba(16,185,129,0.2)';
          description = `<strong>Fuente acercándose al observador en reposo:</strong> v_f = +${Math.abs(vx).toFixed(0)} m/s (${((Math.abs(vx)/engine.c)*100).toFixed(0)}% de c). Los frentes se comprimen adelante (λ = ${((engine.c - Math.abs(vx))/engine.f).toFixed(1)} m). Frecuencia observada más aguda: f_o > f_e.`;
        } else {
          icon = '⬅ 🚗';
          tagText = 'FUENTE ALEJÁNDOSE';
          tagColor = '#ef4444';
          tagBg = 'rgba(239,68,68,0.2)';
          description = `<strong>Fuente alejándose del observador en reposo:</strong> v_f = -${Math.abs(vx).toFixed(0)} m/s. Los frentes se dilatan atrás (λ = ${((engine.c + Math.abs(vx))/engine.f).toFixed(1)} m). Frecuencia observada más grave: f_o < f_e.`;
        }
      } else if (!isSourceMoving && isObsMoving) {
        const isApproaching = rateOfDistanceChange < -0.1;
        if (isApproaching) {
          icon = '🚶 ⬅';
          tagText = 'OBSERVADOR ACERCÁNDOSE';
          tagColor = '#10b981';
          tagBg = 'rgba(16,185,129,0.2)';
          description = `<strong>Observador acercándose a la fuente en reposo:</strong> v_o = -${Math.abs(vo).toFixed(0)} m/s. Intercepta los frentes con mayor rapidez relativa (c + |v_o|). Frecuencia observada más aguda: f_o > f_e.`;
        } else {
          icon = '➡ 🚶';
          tagText = 'OBSERVADOR ALEJÁNDOSE';
          tagColor = '#ef4444';
          tagBg = 'rgba(239,68,68,0.2)';
          description = `<strong>Observador alejándose de la fuente en reposo:</strong> v_o = +${Math.abs(vo).toFixed(0)} m/s. Huye de los frentes (rapidez relativa c - v_o). Frecuencia observada más grave: f_o < f_e.`;
        }
      } else if (isSourceMoving && isObsMoving) {
        if (rateOfDistanceChange < -0.1) {
          icon = '🚗 ➡ 🚶 ⬅';
          tagText = 'AMBOS ACERCÁNDOSE';
          tagColor = '#10b981';
          tagBg = 'rgba(16,185,129,0.25)';
          description = `<strong>Ambos aproximándose mutuamente:</strong> Fuente (v_f = ${vx.toFixed(0)} m/s) y Observador (v_o = ${vo.toFixed(0)} m/s). Efecto Doppler acumulativo: máximo corrimiento al agudo.`;
        } else {
          icon = '⬅ 🚗 ➡ 🚶';
          tagText = 'AMBOS ALEJÁNDOSE';
          tagColor = '#ef4444';
          tagBg = 'rgba(239,68,68,0.25)';
          description = `<strong>Ambos alejándose mutuamente:</strong> Fuente (v_f = ${vx.toFixed(0)} m/s) y Observador (v_o = ${vo.toFixed(0)} m/s). Máxima dilatación de frentes: corrimiento al grave pronunciado.`;
        }
      } else {
        icon = '🛑';
        tagText = 'EN REPOSO';
        tagColor = '#94a3b8';
        tagBg = 'rgba(100,116,139,0.2)';
        description = `<strong>Fuente y Observador en reposo:</strong> v_f = 0, v_o = 0. Los frentes se propagan concéntricos y uniformes. Frecuencia observada idéntica a la emitida (f_o = f_e = ${engine.f.toFixed(1)} Hz).`;
      }

      DOM.motionStatusIcon.textContent = icon;
      DOM.motionStatusText.innerHTML = description;
      DOM.motionStatusTag.textContent = tagText;
      DOM.motionStatusTag.style.color = tagColor;
      DOM.motionStatusTag.style.background = tagBg;
      DOM.motionStatusTag.style.borderColor = tagColor;
    }
  }

  function togglePlay() {
    isPlaying = !isPlaying;
    if (isPlaying) {
      if (engine.currentTime >= engine.maxTime - 0.001) {
        engine.rebuildHistoryUpTo(0);
      }
      lastTimestamp = performance.now();
      DOM.btnPlayIcon.textContent = '⏸';
      DOM.btnPlayPause.title = 'Pausar (Espacio)';
      animFrameId = requestAnimationFrame(animationLoop);
    } else {
      pauseSimulation();
    }
  }

  function pauseSimulation() {
    isPlaying = false;
    DOM.btnPlayIcon.textContent = '▶';
    DOM.btnPlayPause.title = 'Iniciar (Espacio)';
    if (animFrameId) cancelAnimationFrame(animFrameId);
    audio.silenceAll();
  }

  function restartSimulation() {
    pauseSimulation();
    engine.rebuildHistoryUpTo(0);
    audio.silenceAll();
    updateUI();
  }

  function stepManual(dt) {
    pauseSimulation();
    const result = engine.stepTime(dt);
    processArrivalSounds(result.arrivals, result.machShockTriggered);
    updateUI();
  }

  function animationLoop(timestamp) {
    if (!isPlaying) return;

    const deltaSeconds = (timestamp - lastTimestamp) / 1000;
    lastTimestamp = timestamp;

    // dt físico escalado por playbackRate
    const dtPhysics = Math.min(0.1, deltaSeconds * engine.playbackRate);

    const result = engine.stepTime(dtPhysics);

    // Audio y efectos
    processArrivalSounds(result.arrivals, result.machShockTriggered);

    // Actualizar audio continuo si está activo
    const tel = engine.getCurrentTelemetry();
    audio.updateContinuousTones(engine.f, tel.instantTheoFrequency, isPlaying);

    updateUI();

    if (result.isFinished) {
      pauseSimulation();
    } else {
      animFrameId = requestAnimationFrame(animationLoop);
    }
  }

  function processArrivalSounds(arrivals, shockTriggered) {
    if (arrivals && arrivals.length > 0) {
      renderer.triggerObserverRipple();
      for (const arr of arrivals) {
        const ratio = (arr.f_theoretical && Number.isFinite(arr.f_theoretical)) ? (arr.f_theoretical / engine.f) : 1.0;
        audio.playArrivalPulse(ratio);
      }
    }

    if (shockTriggered) {
      audio.playSonicBoom();
      triggerShockAlertUI();
    }
  }

  function triggerShockAlertUI() {
    DOM.shockAlert.style.display = 'flex';
    setTimeout(() => {
      DOM.shockAlert.style.display = 'none';
    }, 2000);
  }

  function updateUI() {
    const tel = engine.getCurrentTelemetry();

    // Actualizar slider y etiqueta temporal
    DOM.timelineSlider.value = engine.currentTime;
    DOM.lblCurrentTime.textContent = `${engine.currentTime.toFixed(2)}s`;

    // Telemetría
    DOM.telMach.textContent = `${tel.M.toFixed(2)}`;
    DOM.telRegime.textContent = tel.regime;
    DOM.telDist.textContent = `${tel.distance.toFixed(1)} m`;

    DOM.telLambdaAhead.textContent = `${tel.wavelengths.lambdaAhead.toFixed(1)} m`;
    DOM.telLambdaBehind.textContent = `${tel.wavelengths.lambdaBehind.toFixed(1)} m`;

    DOM.telEmitted.textContent = `${tel.totalEmitted}`;
    DOM.telReceived.textContent = `${tel.totalReceived}`;

    DOM.telFoInstant.textContent = (Number.isFinite(tel.instantTheoFrequency) && tel.instantTheoFrequency > 0)
      ? `${tel.instantTheoFrequency.toFixed(2)} Hz`
      : 'Infinita (Mach 1)';

    if (tel.lastReception && tel.lastReception.f_measured) {
      DOM.telFMeas.textContent = `${tel.lastReception.f_measured.toFixed(2)} Hz`;
    } else {
      DOM.telFMeas.textContent = 'Esperando 2 llegadas...';
    }

    // Dibujar escena física y gráficos
    renderer.render();
    graphs.render();

    // Actualizar botones de dirección y estado dinámico
    updateMotionButtonsAndBadge();

    // Actualizar tabla de llegadas si está visible
    updateArrivalsTable();
  }

  function updateArrivalsTable() {
    const events = engine.receptionEvents;
    if (!DOM.arrivalTableBody) return;

    if (events.length === 0) {
      DOM.arrivalTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:14px;">Esperando llegadas al observador...</td></tr>';
      return;
    }

    // Mostrar las últimas 8 llegadas
    const recent = events.slice(-8).reverse();
    let html = '';
    for (const ev of recent) {
      html += `
        <tr>
          <td>#${ev.waveId}</td>
          <td>${ev.te.toFixed(2)} s</td>
          <td>${ev.tr.toFixed(2)} s</td>
          <td>${ev.dt ? ev.dt.toFixed(3) + ' s' : '—'}</td>
          <td>${ev.f_theoretical ? ev.f_theoretical.toFixed(2) + ' Hz' : '—'}</td>
          <td style="color:#10b981;font-weight:600;">${ev.f_measured ? ev.f_measured.toFixed(2) + ' Hz' : '—'}</td>
        </tr>
      `;
    }
    DOM.arrivalTableBody.innerHTML = html;
  }

  function renderMathFormulas() {
    if (typeof katex === 'undefined') return;

    try {
      // Fórmula simbólica general retardada y fórmula 1D
      const symLatex = `f_o = f_e \\cdot \\frac{c - \\mathbf{n} \\cdot \\mathbf{v}_o}{c - \\mathbf{n} \\cdot \\mathbf{v}_f} \\quad \\Longleftrightarrow \\quad f_o = f_e \\left( \\frac{c \\pm v_o}{c \\mp v_f} \\right)`;
      katex.render(symLatex, DOM.mathSymbolic, { displayMode: true, throwOnError: false });

      // Sustitución numérica en tiempo real
      const tel = engine.getCurrentTelemetry();
      const fe = engine.f;
      const c = engine.c;
      const vf = engine.source.vx;
      const vo = engine.observer.vx;

      let subLatex = `f_o = ${fe.toFixed(1)} \\cdot \\frac{${c.toFixed(0)} - (${vo.toFixed(1)})}{${c.toFixed(0)} - (${vf.toFixed(1)})}`;
      if (tel.instantTheoFrequency && Number.isFinite(tel.instantTheoFrequency)) {
        subLatex += ` = ${tel.instantTheoFrequency.toFixed(3)} \\text{ Hz}`;
      } else {
        subLatex += ` \\to \\infty \\text{ (Onda de choque)}`;
      }

      katex.render(subLatex, DOM.mathSubstitutions, { displayMode: true, throwOnError: false });

      DOM.mathResult.innerHTML = `
        <strong>Condición de validez clásica:</strong> Medio homogéneo en reposo. Para velocidades colineales subsónicas (|vf| < c).
        En régimen supersónico (M = ${tel.M.toFixed(2)} > 1), la fórmula convencional requiere considerar la rama temporal retardada y la envolvente cónica con semiángulo \\mu = \\arcsin(1/M) = ${tel.machAngleDeg ? tel.machAngleDeg.toFixed(1) + '°' : 'N/A'}.
      `;
    } catch (e) {
      console.warn('Error al renderizar KaTeX:', e);
    }
  }

  function loadDidacticScenarios() {
    const scenarios = DopplerDidactic.SCENARIOS;
    DOM.selectScenario.innerHTML = scenarios.map((s, idx) => `<option value="${idx}">${s.title}</option>`).join('');
    loadScenario(0);
  }

  function loadScenario(idx) {
    currentScenarioIndex = idx;
    const sc = DopplerDidactic.SCENARIOS[idx];
    if (!sc) return;

    DOM.scenarioGoal.textContent = sc.goal;
    DOM.scenarioProcedure.innerHTML = sc.procedure.map(p => `<li>${p}</li>`).join('');
    DOM.scenarioExplanation.textContent = sc.explanation;

    // Pregunta de predicción
    const q = sc.predictionQuestion;
    let quizHtml = `
      <div class="quiz-question">${q.question}</div>
      <div class="quiz-options">
        ${q.options.map((opt, i) => `
          <button type="button" class="quiz-option-btn" data-opt="${i}">${opt}</button>
        `).join('')}
      </div>
      <div class="quiz-feedback" style="display:none;" id="scenarioFeedback"></div>
    `;

    DOM.quizContainer.innerHTML = quizHtml;

    // Eventos de opciones de quiz
    const btns = DOM.quizContainer.querySelectorAll('.quiz-option-btn');
    const feedbackBox = document.getElementById('scenarioFeedback');

    btns.forEach(b => {
      b.addEventListener('click', () => {
        const selected = parseInt(b.dataset.opt, 10);
        btns.forEach(btn => btn.disabled = true);
        if (selected === q.correctIndex) {
          b.classList.add('correct');
        } else {
          b.classList.add('incorrect');
          btns[q.correctIndex].classList.add('correct');
        }
        feedbackBox.style.display = 'block';
        feedbackBox.textContent = q.feedback;
      });
    });
  }

  function applyCurrentScenario() {
    const sc = DopplerDidactic.SCENARIOS[currentScenarioIndex];
    if (!sc) return;

    pauseSimulation();
    engine.resetConfig({
      f: sc.config.f,
      c: sc.config.c,
      vx_f: sc.config.vx_f,
      vy_f: sc.config.vy_f,
      vx_o: sc.config.vx_o,
      vy_o: sc.config.vy_o,
      x_f0: sc.config.x_f0,
      y_f0: sc.config.y_f0,
      x_o0: sc.config.x_o0,
      y_o0: sc.config.y_o0,
      is2D: sc.config.is2D,
      fixedDuration: sc.config.fixedDuration
    });

    syncInputsFromEngine();
    renderer.fitScene();
    updateUI();
    renderMathFormulas();
  }

  function runUserCode() {
    const code = DOM.codeTextarea.value;
    DOM.codeConsole.textContent = 'Ejecutando en entorno Web Worker aislado...\n';

    codeRunner.runCode(
      code,
      (log) => {
        DOM.codeConsole.textContent += log + '\n';
        DOM.codeConsole.scrollTop = DOM.codeConsole.scrollHeight;
      },
      () => {
        DOM.codeConsole.textContent += '\n✓ Ejecución finalizada con éxito.';
      },
      (err) => {
        DOM.codeConsole.textContent += `\n✗ ${err}\n`;
      }
    );
  }

  function runScientificSuite() {
    DOM.validationResultsContainer.innerHTML = 'Ejecutando pruebas científicas...';
    const results = DopplerPhysics.runScientificValidationTests();

    let allPassed = true;
    let html = `
      <table class="arrival-table" style="width:100%;">
        <thead>
          <tr>
            <th>Prueba</th>
            <th>Esperado</th>
            <th>Calculado</th>
            <th>Diferencia</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
    `;

    for (const r of results) {
      if (!r.passed) allPassed = false;
      const statusBadge = r.passed
        ? '<span style="color:#10b981;font-weight:700;">✓ APROBADO</span>'
        : '<span style="color:#ef4444;font-weight:700;">✗ FALLIDO</span>';

      html += `
        <tr>
          <td><strong>${r.name}</strong></td>
          <td>${r.expected.toFixed(4)} ${r.unit}</td>
          <td>${r.actual.toFixed(4)} ${r.unit}</td>
          <td>${r.diff.toExponential(2)}</td>
          <td>${statusBadge}</td>
        </tr>
      `;
    }

    html += `
        </tbody>
      </table>
      <div style="margin-top:14px;padding:10px;border-radius:6px;background:${allPassed ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'};border:1px solid ${allPassed ? '#10b981' : '#ef4444'};">
        <strong>Resultado global:</strong> ${allPassed ? '100% de las pruebas científicas superadas con tolerancias analíticas estrictas.' : 'Atención: Algunas pruebas no cumplieron la tolerancia esperada.'}
      </div>
    `;

    DOM.validationResultsContainer.innerHTML = html;
  }

  function showWaveInspectorToast(wave) {
    const banner = document.createElement('div');
    banner.style.position = 'fixed';
    banner.style.bottom = '80px';
    banner.style.left = '50%';
    banner.style.transform = 'translateX(-50%)';
    banner.style.background = 'rgba(15, 23, 42, 0.95)';
    banner.style.border = '1px solid #f59e0b';
    banner.style.color = '#f8fafc';
    banner.style.padding = '8px 16px';
    banner.style.borderRadius = '20px';
    banner.style.fontSize = '0.8rem';
    banner.style.fontFamily = 'var(--font-mono)';
    banner.style.zIndex = '999';
    banner.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';
    banner.textContent = `Inspección Frente #${wave.id}: Emitido te = ${wave.te.toFixed(2)}s en (${wave.xc.toFixed(1)}, ${wave.yc.toFixed(1)})m | Radio actual = ${wave.r.toFixed(1)}m`;

    document.body.appendChild(banner);
    setTimeout(() => {
      banner.style.transition = 'opacity 0.4s';
      banner.style.opacity = '0';
      setTimeout(() => banner.remove(), 400);
    }, 2800);
  }

  function exportCanvasPNG() {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = renderer.canvas.width;
    tempCanvas.height = renderer.canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(renderer.canvas, 0, 0);

    // Añadir marca de agua pedagógica
    tempCtx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    tempCtx.font = 'bold 16px Inter, sans-serif';
    tempCtx.fillText(`Simulador Efecto Doppler • Física III • t = ${engine.currentTime.toFixed(2)} s`, 20, 30);

    const dataUrl = tempCanvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `efecto_doppler_captura_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function handleWindowResize() {
    renderer.resize();
    graphs.resize();
    renderer.render();
    graphs.render();
  }

  // Inicialización al cargar el DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
