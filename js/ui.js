/**
 * ui.js
 * Orquestador de la interfaz de usuario: lista reactiva de ondas componentes,
 * paleta de estilos estilo GeoGebra, panel didáctico, inspector en tiempo real,
 * atajos de teclado y exportación/importación en JSON/PNG.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['./math-engine', './state', './didactic', './virtual-keyboard'], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('./math-engine'),
      require('./state'),
      require('./didactic'),
      require('./virtual-keyboard')
    );
  } else {
    root.UIManager = factory(
      root.MathEngine,
      root.AppState,
      root.DidacticManager,
      root.VirtualKeyboard
    );
  }
})(typeof self !== 'undefined' ? self : this, function (MathEngine, AppState, DidacticManager, VirtualKeyboard) {
  'use strict';

  class UIController {
    constructor(store, modalWindow) {
      this.store = store;
      this.modalWindow = modalWindow;
      this.keyboard = null;
      this.currentPresetId = 'constructive-pulses';

      this.init();
    }

    init() {
      // 1. Inicializar teclado virtual
      this.keyboard = new VirtualKeyboard.Keyboard('virtualKeyboardContainer', {
        onApply: (val) => {
          // Callback al aplicar fórmula
        }
      });

      // 2. Enlazar controles de reproducción y tiempo
      this.bindPlaybackControls();

      // 3. Enlazar barra flotante de herramientas GeoGebra
      this.bindGeoGebraToolbar();

      // 4. Enlazar gestión de ondas componentes
      this.bindWaveEditor();

      // 5. Enlazar panel didáctico y preguntas predictivas
      this.bindDidacticPanel();

      // 6. Enlazar paleta de estilos y temas
      this.bindStylePalette();

      // 7. Enlazar exportación e importación
      this.bindExportImport();

      // 8. Enlazar atajos de teclado accesibles
      this.bindKeyboardShortcuts();

      // 9. Suscribirse a cambios del store para mantener la UI sincronizada
      this.subscribeToStore();

      // Render inicial de la lista de ondas
      this.renderWaveList();
      this.updateDidacticContent(DidacticManager.PRESETS[0]);
    }

    bindPlaybackControls() {
      const store = this.store;

      const playBtns = document.querySelectorAll('.btn-play-pause');
      const resetBtns = document.querySelectorAll('.btn-reset-time');
      const stepFwdBtns = document.querySelectorAll('.btn-step-forward');
      const stepBackBtns = document.querySelectorAll('.btn-step-backward');
      const speedSelects = document.querySelectorAll('.select-speed');
      const dirBtns = document.querySelectorAll('.btn-direction');
      const timeSliders = document.querySelectorAll('.time-slider');

      playBtns.forEach(btn => {
        btn.addEventListener('click', () => store.togglePlaying());
      });

      resetBtns.forEach(btn => {
        btn.addEventListener('click', () => store.resetTime());
      });

      stepFwdBtns.forEach(btn => {
        btn.addEventListener('click', () => store.stepTime(0.05));
      });

      stepBackBtns.forEach(btn => {
        btn.addEventListener('click', () => store.stepTime(-0.05));
      });

      speedSelects.forEach(select => {
        select.addEventListener('change', (e) => store.setTimeSpeed(e.target.value));
      });

      dirBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          store.setPlaybackDirection(store.playbackDirection * -1);
        });
      });

      timeSliders.forEach(slider => {
        slider.addEventListener('input', (e) => {
          store.setTime(Number(e.target.value));
        });
      });
    }

    bindGeoGebraToolbar() {
      const store = this.store;

      const btnZoomIn = document.getElementById('tbBtnZoomIn');
      const btnZoomOut = document.getElementById('tbBtnZoomOut');
      const btnResetView = document.getElementById('tbBtnResetView');
      const btnToolPan = document.getElementById('tbBtnToolPan');
      const btnToolInspect = document.getElementById('tbBtnToolInspect');
      const btnToggleGrid = document.getElementById('tbBtnToggleGrid');
      const btnPalette = document.getElementById('tbBtnPalette');

      if (btnZoomIn) btnZoomIn.addEventListener('click', () => store.zoom(1.2));
      if (btnZoomOut) btnZoomOut.addEventListener('click', () => store.zoom(0.83));
      if (btnResetView) {
        btnResetView.addEventListener('click', () => {
          const mainCanvas = document.getElementById('mainCanvas');
          if (mainCanvas) {
            const rect = mainCanvas.getBoundingClientRect();
            store.resetView(rect.width, rect.height);
          } else {
            store.resetView();
          }
        });
      }

      if (btnToolPan) {
        btnToolPan.addEventListener('click', () => {
          store.activeTool = 'pan';
          store.setInspector(false);
          this.updateToolButtons();
        });
      }

      if (btnToolInspect) {
        btnToolInspect.addEventListener('click', () => {
          store.activeTool = 'inspect';
          store.setInspector(true, store.inspector.x || 0, false);
          this.updateToolButtons();
        });
      }

      if (btnToggleGrid) {
        btnToggleGrid.addEventListener('click', () => {
          const isGridVisible = store.styles.showMajorGrid;
          store.updateStyles({
            showMajorGrid: !isGridVisible,
            showMinorGrid: !isGridVisible
          });
        });
      }

      if (btnPalette) {
        btnPalette.addEventListener('click', () => {
          this.openStylePalette();
        });
      }
    }

    updateToolButtons() {
      const isInspect = this.store.activeTool === 'inspect';
      const btnPan = document.getElementById('tbBtnToolPan');
      const btnInspect = document.getElementById('tbBtnToolInspect');

      if (btnPan) btnPan.classList.toggle('active', !isInspect);
      if (btnInspect) btnInspect.classList.toggle('active', isInspect);

      const inspectorPanel = document.getElementById('inspectorPanel');
      if (inspectorPanel) {
        inspectorPanel.classList.toggle('visible', isInspect);
      }
    }

    bindWaveEditor() {
      const btnAddWave = document.getElementById('btnAddWave');
      if (btnAddWave) {
        btnAddWave.addEventListener('click', () => {
          const wave = this.store.addWave({
            name: `y_{${this.store.waves.length + 1}}`,
            rawExpr: '2 * sen(x - 2*t)',
            velocity: 2.0
          });
          this.renderWaveList();
          // Enfocar input de la nueva onda
          setTimeout(() => {
            const input = document.getElementById(`waveExpr-${wave.id}`);
            if (input) input.focus();
          }, 50);
        });
      }

      // Estilo de la resultante
      const resColor = document.getElementById('resColorPicker');
      const resWidth = document.getElementById('resWidthRange');
      const resGlow = document.getElementById('resGlowToggle');
      const resFill = document.getElementById('resFillToggle');
      const resVis = document.getElementById('resVisibleToggle');

      if (resColor) {
        resColor.addEventListener('input', (e) => {
          this.store.updateStyles({ resultantColor: e.target.value });
        });
      }

      if (resWidth) {
        resWidth.addEventListener('input', (e) => {
          this.store.updateStyles({ resultantWidth: Number(e.target.value) });
          const valEl = document.getElementById('resWidthVal');
          if (valEl) valEl.textContent = `${e.target.value}px`;
        });
      }

      if (resGlow) {
        resGlow.addEventListener('change', (e) => {
          this.store.updateStyles({ resultantGlow: e.target.checked });
        });
      }

      if (resFill) {
        resFill.addEventListener('change', (e) => {
          this.store.updateStyles({ fillUnderCurve: e.target.checked });
        });
      }

      if (resVis) {
        resVis.addEventListener('change', (e) => {
          this.store.updateStyles({ resultantVisible: e.target.checked });
        });
      }
    }

    renderWaveList() {
      const container = document.getElementById('wavesContainer');
      if (!container) return;

      container.innerHTML = '';

      this.store.waves.forEach((wave, idx) => {
        const card = document.createElement('div');
        card.className = `wave-card ${!wave.visible ? 'hidden-curve' : ''} ${!wave.enabledInSum ? 'excluded-sum' : ''}`;
        card.id = `waveCard-${wave.id}`;

        const isDashed = Array.isArray(wave.dash) && wave.dash.length > 0;

        card.innerHTML = `
          <div class="wave-card-header">
            <div class="wave-identity">
              <span class="wave-color-indicator" style="background-color: ${wave.color};" title="Color de la onda"></span>
              <input type="text" class="wave-name-input" value="${wave.name}" data-id="${wave.id}" title="Nombre de la función" />
            </div>
            <div class="wave-toggles-group">
              <button type="button" class="btn-icon-action btn-dup-wave" data-id="${wave.id}" title="Duplicar componente">⎘</button>
              <button type="button" class="btn-icon-action btn-del-wave" data-id="${wave.id}" title="Eliminar componente">🗑️</button>
            </div>
          </div>

          <!-- Fila de Interruptores Toggle Principales para Mostrar/Ocultar y Sumar -->
          <div class="wave-toggle-row">
            <div class="wave-toggle-vis-box">
              <div class="vis-title-desc">
                <span class="vis-main-title">
                  <span>👁️</span> Gráfica:
                  <span class="vis-status-badge ${wave.visible ? 'on' : 'off'}">${wave.visible ? 'Visible' : 'Oculta'}</span>
                </span>
                <span class="vis-sub-desc">Mostrar u ocultar trazo</span>
              </div>
              <label class="toggle-switch" title="Interruptor toggle para mostrar u ocultar la gráfica individualmente">
                <input type="checkbox" class="toggle-wave-vis" data-id="${wave.id}" ${wave.visible ? 'checked' : ''} />
                <span class="toggle-slider"></span>
              </label>
            </div>

            <div class="wave-toggle-sum-box">
              <div class="vis-title-desc">
                <span class="vis-main-title">
                  <span>∑</span> Suma:
                  <span class="vis-status-badge ${wave.enabledInSum ? 'sum-on' : 'sum-off'}">${wave.enabledInSum ? 'Sumando' : 'Excluida'}</span>
                </span>
                <span class="vis-sub-desc">Superposición</span>
              </div>
              <label class="toggle-switch sum-toggle" title="Incluir o excluir del cálculo de la onda resultante">
                <input type="checkbox" class="toggle-wave-sum" data-id="${wave.id}" ${wave.enabledInSum ? 'checked' : ''} />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div class="wave-card-body">
            <div class="wave-expr-row">
              <div class="input-with-vk">
                <span class="input-label-math">y(x,t) =</span>
                <input type="text" class="wave-expr-input" id="waveExpr-${wave.id}" data-id="${wave.id}" value="${wave.rawExpr}" placeholder="Ej. 2*sen(x - v*t)" spellcheck="false" autocomplete="off" />
                <button type="button" class="btn-open-vk" data-id="${wave.id}" title="Abrir teclado matemático para esta onda">⌨️</button>
              </div>
            </div>

            <!-- Vista previa KaTeX -->
            <div class="wave-katex-preview" id="katexPreview-${wave.id}"></div>
            ${wave.error ? `<div class="wave-error-badge">⚠️ ${wave.error}</div>` : ''}

            <!-- Parámetros físicos y de estilo -->
            <div class="wave-props-grid">
              <div class="prop-item">
                <label>Velocidad $v$ (m/s):</label>
                <div class="prop-number-box">
                  <input type="number" step="0.1" class="prop-velocity-input" data-id="${wave.id}" value="${wave.velocity}" />
                  <span class="prop-unit">m/s</span>
                </div>
              </div>

              <div class="prop-item">
                <label>Color:</label>
                <input type="color" class="prop-color-input" data-id="${wave.id}" value="${wave.color}" />
              </div>

              <div class="prop-item">
                <label>Grosor:</label>
                <select class="prop-width-select" data-id="${wave.id}">
                  <option value="1.5" ${wave.width === 1.5 ? 'selected' : ''}>Fino (1.5px)</option>
                  <option value="2.5" ${wave.width === 2.5 || !wave.width ? 'selected' : ''}>Normal (2.5px)</option>
                  <option value="4.0" ${wave.width === 4.0 ? 'selected' : ''}>Grueso (4.0px)</option>
                  <option value="6.0" ${wave.width === 6.0 ? 'selected' : ''}>Extra (6.0px)</option>
                </select>
              </div>

              <div class="prop-item">
                <label>Patrón:</label>
                <select class="prop-dash-select" data-id="${wave.id}">
                  <option value="solid" ${!isDashed ? 'selected' : ''}>Sólida ───</option>
                  <option value="dashed" ${isDashed && wave.dash[0] > 4 ? 'selected' : ''}>Trazos ─ ─</option>
                  <option value="dotted" ${isDashed && wave.dash[0] <= 4 ? 'selected' : ''}>Puntos • • •</option>
                </select>
              </div>
            </div>
          </div>
        `;

        container.appendChild(card);

        // Renderizar vista previa LaTeX con KaTeX
        this.renderWaveKaTeX(wave.id, wave.rawExpr);
      });

      this.bindWaveCardEvents();
      this.renderQuickToggles();
    }

    renderWaveKaTeX(waveId, rawExpr) {
      const previewEl = document.getElementById(`katexPreview-${waveId}`);
      if (!previewEl) return;

      if (!rawExpr || !rawExpr.trim()) {
        previewEl.innerHTML = '';
        return;
      }

      const latex = `y(x,t) = ${MathEngine.toLatex(rawExpr)}`;
      if (typeof window !== 'undefined' && window.katex) {
        try {
          window.katex.render(latex, previewEl, {
            throwOnError: false,
            displayMode: false
          });
        } catch {
          previewEl.textContent = latex;
        }
      } else {
        previewEl.textContent = latex;
      }
    }

    renderQuickToggles() {
      const bars = [
        document.getElementById('canvasQuickToggles'),
        document.getElementById('modalQuickToggles')
      ].filter(Boolean);

      if (bars.length === 0) return;

      const html = `
        <span style="font-size: 0.72rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-right: 0.2rem;">Gráficas:</span>
        ${this.store.waves.map(wave => `
          <div class="quick-toggle-chip ${!wave.visible ? 'chip-off' : ''}" id="chip-wave-${wave.id}" title="${wave.name}: ${wave.visible ? 'Visible (Click para ocultar)' : 'Oculta (Click para mostrar)'}">
            <span class="chip-color-dot" style="background-color: ${wave.color}; box-shadow: 0 0 6px ${wave.color};"></span>
            <span class="chip-name">${wave.name}</span>
            <label class="chip-toggle-switch" title="Alternar visibilidad de ${wave.name}">
              <input type="checkbox" class="quick-toggle-chk" data-id="${wave.id}" ${wave.visible ? 'checked' : ''} />
              <span class="chip-toggle-slider" style="--chip-color: ${wave.color};"></span>
            </label>
          </div>
        `).join('')}

        <!-- Chip para la Resultante -->
        <div class="quick-toggle-chip chip-resultant ${this.store.styles.resultantVisible === false ? 'chip-off' : ''}" title="Onda Resultante (Suma)">
          <span class="chip-color-dot" style="background-color: ${this.store.styles.resultantColor}; box-shadow: 0 0 6px ${this.store.styles.resultantColor};"></span>
          <span class="chip-name" style="color: #34d399;">Resultante ∑</span>
          <label class="chip-toggle-switch" title="Alternar visibilidad de la resultante">
            <input type="checkbox" class="quick-toggle-res" ${this.store.styles.resultantVisible !== false ? 'checked' : ''} />
            <span class="chip-toggle-slider" style="--chip-color: ${this.store.styles.resultantColor};"></span>
          </label>
        </div>

        <!-- Botón para alternar todas -->
        <button type="button" class="btn-chip-action" id="btnToggleAllWaves" title="Mostrar u ocultar todas las curvas a la vez">
          <span>👁️ Alternar Todas</span>
        </button>
      `;

      bars.forEach(bar => {
        bar.innerHTML = html;

        // Escuchar cambios en los interruptores rápidos
        bar.querySelectorAll('.quick-toggle-chk').forEach(chk => {
          chk.addEventListener('change', (e) => {
            const id = Number(e.target.dataset.id);
            this.store.setWaveVisibility(id, e.target.checked);
            this.syncWaveToggles(id, e.target.checked);
          });
        });

        const resChk = bar.querySelector('.quick-toggle-res');
        if (resChk) {
          resChk.addEventListener('change', (e) => {
            this.store.updateStyles({ resultantVisible: e.target.checked });
            const resToggle = document.getElementById('resVisibleToggle');
            if (resToggle) resToggle.checked = e.target.checked;
            this.renderQuickToggles();
          });
        }

        const btnAll = bar.querySelector('#btnToggleAllWaves');
        if (btnAll) {
          btnAll.addEventListener('click', () => {
            const anyVisible = this.store.waves.some(w => w.visible);
            this.store.waves.forEach(w => {
              this.store.setWaveVisibility(w.id, !anyVisible);
            });
            this.renderWaveList();
          });
        }
      });
    }

    syncWaveToggles(id, isVisible) {
      const card = document.getElementById(`waveCard-${id}`);
      if (card) {
        card.classList.toggle('hidden-curve', !isVisible);
        const chk = card.querySelector('.toggle-wave-vis');
        if (chk) chk.checked = isVisible;
        const badge = card.querySelector('.vis-status-badge');
        if (badge) {
          badge.className = `vis-status-badge ${isVisible ? 'on' : 'off'}`;
          badge.textContent = isVisible ? 'Visible' : 'Oculta';
        }
      }

      // Sincronizar chips en las barras rápidas
      const chips = document.querySelectorAll(`#chip-wave-${id}`);
      chips.forEach(chip => {
        chip.classList.toggle('chip-off', !isVisible);
        const chk = chip.querySelector('.quick-toggle-chk');
        if (chk) chk.checked = isVisible;
      });
    }

    bindWaveCardEvents() {
      const container = document.getElementById('wavesContainer');
      if (!container) return;

      // Toggle visibilidad gráfica
      container.querySelectorAll('.toggle-wave-vis').forEach(chk => {
        chk.addEventListener('change', (e) => {
          const id = Number(e.target.dataset.id);
          this.store.setWaveVisibility(id, e.target.checked);
          this.syncWaveToggles(id, e.target.checked);
        });
      });

      // Toggle suma / superposición
      container.querySelectorAll('.toggle-wave-sum').forEach(chk => {
        chk.addEventListener('change', (e) => {
          const id = Number(e.target.dataset.id);
          this.store.setWaveInclusion(id, e.target.checked);
          const card = document.getElementById(`waveCard-${id}`);
          if (card) {
            card.classList.toggle('excluded-sum', !e.target.checked);
            const badge = card.querySelector('.vis-status-badge.sum-on, .vis-status-badge.sum-off');
            if (badge) {
              badge.className = `vis-status-badge ${e.target.checked ? 'sum-on' : 'sum-off'}`;
              badge.textContent = e.target.checked ? 'Sumando' : 'Excluida';
            }
          }
        });
      });

      // Eliminar onda
      container.querySelectorAll('.btn-del-wave').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = Number(e.target.dataset.id);
          this.store.removeWave(id);
          this.renderWaveList();
        });
      });

      // Duplicar onda
      container.querySelectorAll('.btn-dup-wave').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = Number(e.target.dataset.id);
          this.store.duplicateWave(id);
          this.renderWaveList();
        });
      });

      // Nombre de onda
      container.querySelectorAll('.wave-name-input').forEach(input => {
        input.addEventListener('change', (e) => {
          const id = Number(e.target.dataset.id);
          this.store.updateWave(id, { name: e.target.value });
        });
      });

      // Input de expresión
      container.querySelectorAll('.wave-expr-input').forEach(input => {
        input.addEventListener('input', (e) => {
          const id = Number(e.target.dataset.id);
          this.store.updateWave(id, { rawExpr: e.target.value });
          this.renderWaveKaTeX(id, e.target.value);
        });

        input.addEventListener('focus', (e) => {
          const id = Number(e.target.dataset.id);
          const wave = this.store.waves.find(w => w.id === id);
          if (this.keyboard && document.getElementById('virtualKeyboardContainer').classList.contains('visible')) {
            this.keyboard.attachToInput(input, wave ? wave.name : 'Onda');
          }
        });
      });

      // Botón para abrir teclado virtual
      container.querySelectorAll('.btn-open-vk').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = Number(e.target.dataset.id);
          const input = document.getElementById(`waveExpr-${id}`);
          const wave = this.store.waves.find(w => w.id === id);
          if (input && this.keyboard) {
            this.keyboard.attachToInput(input, wave ? wave.name : 'Onda');
          }
        });
      });

      // Velocidad
      container.querySelectorAll('.prop-velocity-input').forEach(input => {
        input.addEventListener('input', (e) => {
          const id = Number(e.target.dataset.id);
          this.store.updateWave(id, { velocity: Number(e.target.value) });
        });
      });

      // Color
      container.querySelectorAll('.prop-color-input').forEach(input => {
        input.addEventListener('input', (e) => {
          const id = Number(e.target.dataset.id);
          this.store.updateWave(id, { color: e.target.value });
          const card = document.getElementById(`waveCard-${id}`);
          if (card) {
            const ind = card.querySelector('.wave-color-indicator');
            if (ind) ind.style.backgroundColor = e.target.value;
          }
        });
      });

      // Grosor
      container.querySelectorAll('.prop-width-select').forEach(sel => {
        sel.addEventListener('change', (e) => {
          const id = Number(e.target.dataset.id);
          this.store.updateWave(id, { width: Number(e.target.value) });
        });
      });

      // Patrón de línea (dashed / solid / dotted)
      container.querySelectorAll('.prop-dash-select').forEach(sel => {
        sel.addEventListener('change', (e) => {
          const id = Number(e.target.dataset.id);
          let dash = [];
          if (e.target.value === 'dashed') dash = [6, 4];
          else if (e.target.value === 'dotted') dash = [2, 3];
          this.store.updateWave(id, { dash });
        });
      });
    }

    bindDidacticPanel() {
      const presetSelect = document.getElementById('presetSelect');
      if (!presetSelect) return;

      presetSelect.innerHTML = '';
      DidacticManager.PRESETS.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.title;
        presetSelect.appendChild(opt);
      });

      presetSelect.addEventListener('change', (e) => {
        this.loadPreset(e.target.value);
      });

      const btnLoadPreset = document.getElementById('btnLoadPreset');
      if (btnLoadPreset) {
        btnLoadPreset.addEventListener('click', () => {
          this.loadPreset(presetSelect.value);
        });
      }
    }

    loadPreset(presetId) {
      const preset = DidacticManager.PRESETS.find(p => p.id === presetId);
      if (!preset) return;

      this.currentPresetId = presetId;
      this.store.waves = [];
      this.store.nextWaveId = 1;
      this.store.time = preset.time || 0.0;

      preset.waves.forEach(w => {
        this.store.addWave(w);
      });

      this.renderWaveList();
      this.updateDidacticContent(preset);

      // Re-centrar vista en origen
      const mainCanvas = document.getElementById('mainCanvas');
      if (mainCanvas) {
        const rect = mainCanvas.getBoundingClientRect();
        this.store.resetView(rect.width, rect.height);
      }
    }

    updateDidacticContent(preset) {
      const titleEl = document.getElementById('didacticTitle');
      const descEl = document.getElementById('didacticDesc');
      const theoryEl = document.getElementById('didacticTheoryContent');
      const quizContainer = document.getElementById('didacticQuizContainer');

      if (titleEl) titleEl.textContent = preset.title;
      if (descEl) descEl.textContent = preset.subtitle;
      if (theoryEl) {
        theoryEl.innerHTML = preset.theory;
        // Renderizar fórmulas con KaTeX dentro de la teoría
        if (typeof window !== 'undefined' && window.katex) {
          const formulas = theoryEl.querySelectorAll('.formula-box');
          formulas.forEach(box => {
            const raw = box.textContent.replace(/\$\$/g, '').trim();
            try {
              window.katex.render(raw, box, { throwOnError: false, displayMode: true });
            } catch {
              // fallback
            }
          });
        }
      }

      if (quizContainer && preset.question) {
        this.renderQuiz(quizContainer, preset.question);
      }
    }

    renderQuiz(container, question) {
      container.innerHTML = `
        <div class="quiz-box">
          <div class="quiz-badge">🧠 Pregunta de Predicción Física</div>
          <div class="quiz-prompt">${question.prompt}</div>
          <div class="quiz-options">
            ${question.options.map((opt, idx) => `
              <button type="button" class="quiz-opt-btn" data-index="${idx}">
                <span class="opt-letter">${String.fromCharCode(65 + idx)})</span>
                <span class="opt-text">${opt.text}</span>
              </button>
            `).join('')}
          </div>
          <div class="quiz-feedback" id="quizFeedback" style="display: none;"></div>
        </div>
      `;

      const optBtns = container.querySelectorAll('.quiz-opt-btn');
      const feedbackEl = container.querySelector('#quizFeedback');

      optBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = Number(btn.dataset.index);
          const option = question.options[idx];

          optBtns.forEach(b => b.classList.remove('selected', 'correct', 'incorrect'));
          btn.classList.add('selected');

          feedbackEl.style.display = 'block';
          if (option.correct) {
            btn.classList.add('correct');
            feedbackEl.className = 'quiz-feedback correct';
            feedbackEl.innerHTML = `<strong>✔ ¡Excelente predicción!</strong> ${option.feedback}`;
          } else {
            btn.classList.add('incorrect');
            feedbackEl.className = 'quiz-feedback incorrect';
            feedbackEl.innerHTML = `<strong>✕ No exactamente.</strong> ${option.feedback}`;
          }
        });
      });
    }

    bindStylePalette() {
      const paletteModal = document.getElementById('paletteModal');
      const btnClose = document.getElementById('paletteBtnClose');
      const themeSelect = document.getElementById('paletteThemeSelect');
      const bgColor = document.getElementById('palBgColor');
      const axisColor = document.getElementById('palAxisColor');
      const axisWidth = document.getElementById('palAxisWidth');
      const majorGridColor = document.getElementById('palMajorGridColor');
      const minorGridColor = document.getElementById('palMinorGridColor');
      const subsSelect = document.getElementById('palGridSubs');
      const labelFontSize = document.getElementById('palLabelFontSize');
      const showVectorsCheck = document.getElementById('palShowVectors');
      const showMinorGridCheck = document.getElementById('palShowMinorGrid');

      if (btnClose && paletteModal) {
        btnClose.addEventListener('click', () => {
          paletteModal.classList.remove('active');
        });
      }

      if (themeSelect) {
        themeSelect.addEventListener('change', (e) => {
          this.store.setTheme(e.target.value);
          this.syncPaletteInputs();
        });
      }

      if (bgColor) {
        bgColor.addEventListener('input', (e) => {
          this.store.updateStyles({ bgColor: e.target.value });
        });
      }

      if (axisColor) {
        axisColor.addEventListener('input', (e) => {
          this.store.updateStyles({ axisColor: e.target.value });
        });
      }

      if (axisWidth) {
        axisWidth.addEventListener('input', (e) => {
          this.store.updateStyles({ axisWidth: Number(e.target.value) });
        });
      }

      if (majorGridColor) {
        majorGridColor.addEventListener('input', (e) => {
          this.store.updateStyles({ majorGridColor: e.target.value });
        });
      }

      if (minorGridColor) {
        minorGridColor.addEventListener('input', (e) => {
          this.store.updateStyles({ minorGridColor: e.target.value });
        });
      }

      if (subsSelect) {
        subsSelect.addEventListener('change', (e) => {
          this.store.updateStyles({ subdivisions: Number(e.target.value) });
        });
      }

      if (labelFontSize) {
        labelFontSize.addEventListener('input', (e) => {
          this.store.updateStyles({ labelFontSize: Number(e.target.value) });
        });
      }

      if (showVectorsCheck) {
        showVectorsCheck.addEventListener('change', (e) => {
          this.store.updateStyles({ showVectors: e.target.checked });
        });
      }

      if (showMinorGridCheck) {
        showMinorGridCheck.addEventListener('change', (e) => {
          this.store.updateStyles({ showMinorGrid: e.target.checked });
        });
      }
    }

    openStylePalette() {
      const paletteModal = document.getElementById('paletteModal');
      if (paletteModal) {
        this.syncPaletteInputs();
        paletteModal.classList.add('active');
      }
    }

    syncPaletteInputs() {
      const s = this.store.styles;
      const themeSelect = document.getElementById('paletteThemeSelect');
      const bgColor = document.getElementById('palBgColor');
      const axisColor = document.getElementById('palAxisColor');
      const axisWidth = document.getElementById('palAxisWidth');
      const majorGridColor = document.getElementById('palMajorGridColor');
      const minorGridColor = document.getElementById('palMinorGridColor');
      const subsSelect = document.getElementById('palGridSubs');
      const labelFontSize = document.getElementById('palLabelFontSize');
      const showVectorsCheck = document.getElementById('palShowVectors');
      const showMinorGridCheck = document.getElementById('palShowMinorGrid');

      if (themeSelect) themeSelect.value = this.store.currentThemeKey;
      if (bgColor) bgColor.value = s.bgColor;
      if (axisColor) axisColor.value = s.axisColor;
      if (axisWidth) axisWidth.value = s.axisWidth;
      if (majorGridColor) majorGridColor.value = s.majorGridColor;
      if (minorGridColor) minorGridColor.value = s.minorGridColor;
      if (subsSelect) subsSelect.value = s.subdivisions;
      if (labelFontSize) labelFontSize.value = s.labelFontSize;
      if (showVectorsCheck) showVectorsCheck.checked = s.showVectors;
      if (showMinorGridCheck) showMinorGridCheck.checked = s.showMinorGrid;
    }

    bindExportImport() {
      // Exportar JSON
      const btnExportJSON = document.getElementById('btnExportJSON');
      if (btnExportJSON) {
        btnExportJSON.addEventListener('click', () => {
          const jsonStr = this.store.exportJSON();
          const blob = new Blob([jsonStr], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `simulacion_ondas_${Date.now()}.json`;
          a.click();
          URL.revokeObjectURL(url);
        });
      }

      // Importar JSON
      const fileImportJSON = document.getElementById('fileImportJSON');
      if (fileImportJSON) {
        fileImportJSON.addEventListener('change', (e) => {
          const file = e.target.files[0];
          if (!file) return;

          const reader = new FileReader();
          reader.onload = (event) => {
            try {
              this.store.importJSON(event.target.result);
              this.renderWaveList();
              alert('Configuración importada exitosamente.');
            } catch (err) {
              alert('Error al importar archivo: ' + err.message);
            }
          };
          reader.readAsText(file);
          e.target.value = '';
        });
      }

      // Exportar Imagen PNG
      const btnExportPNG = document.getElementById('btnExportPNG');
      if (btnExportPNG) {
        btnExportPNG.addEventListener('click', () => {
          this.exportImage();
        });
      }
    }

    exportImage() {
      const canvas = document.getElementById('mainCanvas');
      if (!canvas) return;

      // Crear un canvas temporal para la imagen exportada con encabezado y marcas
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = canvas.width;
      exportCanvas.height = canvas.height;
      const ctx = exportCanvas.getContext('2d');

      // Copiar gráfico
      ctx.drawImage(canvas, 0, 0);

      // Agregar marca de agua elegante y tiempo actual
      ctx.save();
      ctx.font = '600 16px Inter, sans-serif';
      ctx.fillStyle = this.store.styles.textColor || '#ffffff';
      ctx.fillText(`Física III: Ondas y Superposición | t = ${this.store.time.toFixed(2)} s`, 25, 30);
      ctx.restore();

      const url = exportCanvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `grafico_superposicion_${Date.now()}.png`;
      a.click();
    }

    bindKeyboardShortcuts() {
      window.addEventListener('keydown', (e) => {
        // Si el usuario está escribiendo en un input, ignorar atajos globales
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
          return;
        }

        if (e.code === 'Space') {
          e.preventDefault();
          this.store.togglePlaying();
        } else if (e.key === 'r' || e.key === 'R') {
          this.store.resetTime();
        } else if (e.key === 'i' || e.key === 'I') {
          this.store.activeTool = this.store.activeTool === 'inspect' ? 'pan' : 'inspect';
          this.store.setInspector(this.store.activeTool === 'inspect');
          this.updateToolButtons();
        } else if (e.key === '+' || e.key === '=') {
          this.store.zoom(1.15);
        } else if (e.key === '-' || e.key === '_') {
          this.store.zoom(0.85);
        }
      });
    }

    subscribeToStore() {
      // Cambio en tiempo
      this.store.on('time-changed', (time) => {
        const timeDisplays = document.querySelectorAll('.time-readout-val');
        timeDisplays.forEach(el => {
          el.textContent = `${time.toFixed(2)} s`;
        });

        const sliders = document.querySelectorAll('.time-slider');
        sliders.forEach(slider => {
          slider.value = time % (Number(slider.max) || 20);
        });

        // Actualizar inspector si está activo
        if (this.store.inspector.active) {
          this.updateInspectorReadout();
        }
      });

      // Cambio en reproducción
      this.store.on('playback-changed', (isPlaying) => {
        const playBtns = document.querySelectorAll('.btn-play-pause');
        playBtns.forEach(btn => {
          btn.innerHTML = isPlaying ? '⏸ Pausa' : '▶ Reproducir';
          btn.classList.toggle('playing', isPlaying);
        });
      });

      // Cambio en inspector
      this.store.on('inspector-changed', () => {
        this.updateInspectorReadout();
      });

      // Cambio en ondas
      this.store.on('waves-changed', () => {
        if (this.store.inspector.active) {
          this.updateInspectorReadout();
        }
      });
    }

    updateInspectorReadout() {
      const panel = document.getElementById('inspectorPanel');
      if (!panel) return;

      const probeData = MathEngine.probeAt(this.store.inspector.x, this.store.time, this.store.waves);

      const probeXVal = document.getElementById('probeXVal');
      const probeResVal = document.getElementById('probeResVal');
      const probeList = document.getElementById('probeComponentsList');

      if (probeXVal) probeXVal.textContent = `${probeData.x.toFixed(3)} m`;
      if (probeResVal) {
        probeResVal.textContent = isNaN(probeData.resultant) ? 'Indefinido' : `${probeData.resultant.toFixed(3)} m`;
        probeResVal.style.color = this.store.styles.resultantColor;
      }

      if (probeList) {
        probeList.innerHTML = probeData.components.map(c => `
          <div class="probe-row ${!c.includedInSum ? 'excluded' : ''}">
            <span class="probe-badge" style="background-color: ${c.color};"></span>
            <span class="probe-name">${c.name}:</span>
            <span class="probe-val">${isNaN(c.value) ? 'NaN' : c.value.toFixed(3)} m</span>
            ${!c.includedInSum ? '<span class="probe-tag-excluded">(No sumada)</span>' : ''}
          </div>
        `).join('');
      }
    }
  }

  return {
    UIController
  };
});
