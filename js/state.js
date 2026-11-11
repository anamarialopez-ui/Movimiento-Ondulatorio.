/**
 * state.js
 * Gestión centralizada del estado de la aplicación, parámetros físicos,
 * paleta de estilos, ondas componentes, presets y persistencia.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['./math-engine'], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./math-engine'));
  } else {
    root.AppState = factory(root.MathEngine);
  }
})(typeof self !== 'undefined' ? self : this, function (MathEngine) {
  'use strict';

  // Paleta de colores predeterminada para las componentes
  const COMPONENT_PALETTES = [
    '#2563eb', // Azul real vibrante
    '#dc2626', // Rojo bermellón
    '#d97706', // Ámbar / Naranja intenso
    '#9333ea', // Púrpura elegante
    '#0891b2', // Cian profundo
    '#ec4899', // Rosa magenta
    '#16a34a', // Verde bosque
    '#ea580c'  // Naranja quemado
  ];

  // Temas visuales para el plano cartesiano estilo GeoGebra
  const THEMES = {
    geogebra: {
      name: 'GeoGebra Clásico',
      bgColor: '#ffffff',
      axisColor: '#1e293b',
      axisWidth: 1.8,
      majorGridColor: '#cbd5e1',
      minorGridColor: '#f1f5f9',
      majorGridWidth: 1.0,
      minorGridWidth: 0.6,
      subdivisions: 5,
      textColor: '#0f172a',
      fontFamily: 'Inter, system-ui, sans-serif',
      labelFontSize: 13,
      tickFontSize: 11,
      resultantColor: '#059669',
      resultantGlow: false,
      fillUnderCurve: true,
      fillOpacity: 0.12
    },
    dark: {
      name: 'Modo Oscuro Pro',
      bgColor: '#0f172a',
      axisColor: '#94a3b8',
      axisWidth: 1.8,
      majorGridColor: '#334155',
      minorGridColor: '#1e293b',
      majorGridWidth: 1.0,
      minorGridWidth: 0.6,
      subdivisions: 5,
      textColor: '#f8fafc',
      fontFamily: 'Inter, system-ui, sans-serif',
      labelFontSize: 13,
      tickFontSize: 11,
      resultantColor: '#10b981',
      resultantGlow: true,
      fillUnderCurve: true,
      fillOpacity: 0.18
    },
    paper: {
      name: 'Papel Milimetrado Técnico',
      bgColor: '#fbfcf8',
      axisColor: '#1e3a5f',
      axisWidth: 2.0,
      majorGridColor: '#93c5fd',
      minorGridColor: '#dbeafe',
      majorGridWidth: 1.0,
      minorGridWidth: 0.5,
      subdivisions: 10,
      textColor: '#1e3a5f',
      fontFamily: 'Inter, system-ui, sans-serif',
      labelFontSize: 13,
      tickFontSize: 11,
      resultantColor: '#e11d48',
      resultantGlow: false,
      fillUnderCurve: true,
      fillOpacity: 0.10
    },
    contrast: {
      name: 'Alto Contraste Accesible',
      bgColor: '#000000',
      axisColor: '#ffffff',
      axisWidth: 2.2,
      majorGridColor: '#52525b',
      minorGridColor: '#27272a',
      majorGridWidth: 1.2,
      minorGridWidth: 0.7,
      subdivisions: 5,
      textColor: '#ffffff',
      fontFamily: 'Inter, system-ui, sans-serif',
      labelFontSize: 14,
      tickFontSize: 12,
      resultantColor: '#22c55e',
      resultantGlow: true,
      fillUnderCurve: true,
      fillOpacity: 0.22
    }
  };

  class StateStore {
    constructor() {
      this.listeners = new Map();
      this.nextWaveId = 1;

      // Estado físico y simulación
      this.time = 0.0;
      this.isPlaying = true;
      this.timeSpeed = 1.0;
      this.playbackDirection = 1; // 1 = adelante, -1 = reversa
      this.lastTimestamp = null;

      // Vista y cámara del plano cartesiano
      this.view = {
        originX: 0,
        originY: 0,
        scaleX: 65, // píxeles por unidad física en X (metros)
        scaleY: 65, // píxeles por unidad física en Y (metros)
        defaultScaleX: 65,
        defaultScaleY: 65,
        minScale: 10,
        maxScale: 600
      };

      // Configuración de visualización y estilo
      this.currentThemeKey = 'dark';
      this.styles = {
        ...THEMES.dark,
        showMajorGrid: true,
        showMinorGrid: true,
        showAxes: true,
        showLabels: true,
        showTicks: true,
        showVectors: true,
        resultantWidth: 3.5,
        resultantDash: [], // [] = sólida, [6, 4] = dashed, [2, 3] = dotted
        resultantOpacity: 1.0,
        resultantVisible: true
      };

      // Inspector interactivo puntual
      this.inspector = {
        active: false,
        x: 0.0,
        pinned: false
      };

      // Modal ampliado
      this.modal = {
        isOpen: false,
        isMaximized: false,
        isCollapsed: false,
        isFullscreen: false
      };

      // Herramienta activa: 'pan', 'inspect', 'scale-x', 'scale-y'
      this.activeTool = 'pan';

      // Lista de ondas componentes
      this.waves = [];

      // Cargar preset 1 por defecto
      this.loadDefaultPreset();
    }

    // Suscripción a eventos de cambio
    on(event, callback) {
      if (!this.listeners.has(event)) {
        this.listeners.set(event, new Set());
      }
      this.listeners.get(event).add(callback);
      return () => this.listeners.get(event).delete(callback);
    }

    emit(event, payload) {
      if (this.listeners.has(event)) {
        this.listeners.get(event).forEach(cb => {
          try {
            cb(payload);
          } catch (err) {
            console.error(`Error en listener de evento '${event}':`, err);
          }
        });
      }
      // Notificador global
      if (event !== '*' && this.listeners.has('*')) {
        this.listeners.get('*').forEach(cb => cb({ event, payload }));
      }
    }

    // Gestión del tiempo
    setTime(t) {
      this.time = Math.max(0, t);
      this.emit('time-changed', this.time);
    }

    resetTime() {
      this.time = 0.0;
      this.emit('time-changed', this.time);
    }

    setPlaying(playing) {
      this.isPlaying = !!playing;
      this.emit('playback-changed', this.isPlaying);
    }

    togglePlaying() {
      this.setPlaying(!this.isPlaying);
    }

    setTimeSpeed(speed) {
      this.timeSpeed = Math.max(0.05, Math.min(5.0, Number(speed) || 1.0));
      this.emit('speed-changed', this.timeSpeed);
    }

    setPlaybackDirection(dir) {
      this.playbackDirection = dir < 0 ? -1 : 1;
      this.emit('direction-changed', this.playbackDirection);
    }

    stepTime(delta = 0.05) {
      this.setTime(this.time + delta * this.playbackDirection);
    }

    // Gestión de ondas
    addWave(data = {}) {
      const id = this.nextWaveId++;
      const paletteIndex = (this.waves.length) % COMPONENT_PALETTES.length;
      const defaultColor = COMPONENT_PALETTES[paletteIndex];

      const rawExpr = data.rawExpr !== undefined ? data.rawExpr : '2 / ((x - v*t)^4 + 1)';
      let fn = null;
      let error = null;

      try {
        fn = MathEngine.compile(rawExpr);
      } catch (err) {
        error = err.message;
      }

      const wave = {
        id,
        name: data.name || `y_{${id}}`,
        rawExpr,
        velocity: data.velocity !== undefined ? Number(data.velocity) : 2.0,
        visible: data.visible !== undefined ? !!data.visible : true,
        enabledInSum: data.enabledInSum !== undefined ? !!data.enabledInSum : true,
        color: data.color || defaultColor,
        width: data.width || 2.5,
        dash: Array.isArray(data.dash) ? data.dash : [],
        opacity: data.opacity !== undefined ? Number(data.opacity) : 0.85,
        fn,
        error
      };

      this.waves.push(wave);
      this.emit('waves-changed', this.waves);
      return wave;
    }

    updateWave(id, patch) {
      const wave = this.waves.find(w => w.id === id);
      if (!wave) return null;

      let recompileNeeded = false;
      if (patch.rawExpr !== undefined && patch.rawExpr !== wave.rawExpr) {
        wave.rawExpr = patch.rawExpr;
        recompileNeeded = true;
      }

      if (patch.name !== undefined) wave.name = patch.name;
      if (patch.velocity !== undefined) wave.velocity = Number(patch.velocity);
      if (patch.visible !== undefined) wave.visible = !!patch.visible;
      if (patch.enabledInSum !== undefined) wave.enabledInSum = !!patch.enabledInSum;
      if (patch.color !== undefined) wave.color = patch.color;
      if (patch.width !== undefined) wave.width = Number(patch.width);
      if (patch.dash !== undefined) wave.dash = Array.isArray(patch.dash) ? patch.dash : [];
      if (patch.opacity !== undefined) wave.opacity = Number(patch.opacity);

      if (recompileNeeded) {
        try {
          wave.fn = MathEngine.compile(wave.rawExpr);
          wave.error = null;
        } catch (err) {
          wave.error = err.message;
          wave.fn = null;
        }
      }

      this.emit('waves-changed', this.waves);
      return wave;
    }

    removeWave(id) {
      const idx = this.waves.findIndex(w => w.id === id);
      if (idx !== -1) {
        this.waves.splice(idx, 1);
        this.emit('waves-changed', this.waves);
      }
    }

    duplicateWave(id) {
      const source = this.waves.find(w => w.id === id);
      if (!source) return;
      this.addWave({
        name: `${source.name}'`,
        rawExpr: source.rawExpr,
        velocity: source.velocity,
        visible: source.visible,
        enabledInSum: source.enabledInSum,
        width: source.width,
        dash: [...source.dash],
        opacity: source.opacity
      });
    }

    setWaveVisibility(id, visible) {
      this.updateWave(id, { visible });
    }

    setWaveInclusion(id, enabledInSum) {
      this.updateWave(id, { enabledInSum });
    }

    // Temas y estilos
    setTheme(themeKey) {
      if (THEMES[themeKey]) {
        this.currentThemeKey = themeKey;
        this.styles = {
          ...this.styles,
          ...THEMES[themeKey]
        };
        this.emit('styles-changed', this.styles);
      }
    }

    updateStyles(patch) {
      this.styles = {
        ...this.styles,
        ...patch
      };
      this.emit('styles-changed', this.styles);
    }

    // Vista y cámara
    resetView(canvasWidth, canvasHeight) {
      if (canvasWidth && canvasHeight) {
        this.view.originX = canvasWidth / 2;
        this.view.originY = canvasHeight / 2;
      }
      this.view.scaleX = this.view.defaultScaleX;
      this.view.scaleY = this.view.defaultScaleY;
      this.emit('view-changed', this.view);
    }

    pan(dx, dy) {
      this.view.originX += dx;
      this.view.originY += dy;
      this.emit('view-changed', this.view);
    }

    zoom(factor, pivotX, pivotY) {
      const oldScaleX = this.view.scaleX;
      const oldScaleY = this.view.scaleY;

      let newScaleX = Math.max(this.view.minScale, Math.min(this.view.maxScale, oldScaleX * factor));
      let newScaleY = Math.max(this.view.minScale, Math.min(this.view.maxScale, oldScaleY * factor));

      if (pivotX !== undefined && pivotY !== undefined) {
        this.view.originX = pivotX - (pivotX - this.view.originX) * (newScaleX / oldScaleX);
        this.view.originY = pivotY - (pivotY - this.view.originY) * (newScaleY / oldScaleY);
      }

      this.view.scaleX = newScaleX;
      this.view.scaleY = newScaleY;
      this.emit('view-changed', this.view);
    }

    scaleAxis(axis, factor, pivotScreen) {
      if (axis === 'x') {
        const old = this.view.scaleX;
        const newScale = Math.max(this.view.minScale, Math.min(this.view.maxScale, old * factor));
        if (pivotScreen !== undefined) {
          this.view.originX = pivotScreen - (pivotScreen - this.view.originX) * (newScale / old);
        }
        this.view.scaleX = newScale;
      } else if (axis === 'y') {
        const old = this.view.scaleY;
        const newScale = Math.max(this.view.minScale, Math.min(this.view.maxScale, old * factor));
        if (pivotScreen !== undefined) {
          this.view.originY = pivotScreen - (pivotScreen - this.view.originY) * (newScale / old);
        }
        this.view.scaleY = newScale;
      }
      this.emit('view-changed', this.view);
    }

    // Inspector
    setInspector(active, x = 0, pinned = false) {
      this.inspector.active = active;
      this.inspector.x = x;
      this.inspector.pinned = pinned;
      this.emit('inspector-changed', this.inspector);
    }

    // Presets Pedagógicos
    loadDefaultPreset() {
      this.waves = [];
      this.nextWaveId = 1;
      this.time = 0.0;

      // Preset 1: Dos pulsos iguales en sentidos opuestos (Interferencia Constructiva)
      this.addWave({
        name: 'y_1 (hacia la derecha)',
        rawExpr: '2 / ((x - 2*t + 6)^2 + 1)',
        velocity: 2.0,
        color: '#3b82f6',
        width: 2.5
      });

      this.addWave({
        name: 'y_2 (hacia la izquierda)',
        rawExpr: '2 / ((x + 2*t - 6)^2 + 1)',
        velocity: -2.0,
        color: '#f59e0b',
        width: 2.5
      });
    }

    // Exportación e Importación de configuración en JSON
    exportJSON() {
      const data = {
        version: '2.0',
        timestamp: new Date().toISOString(),
        title: 'Simulación de Movimiento Ondulatorio y Superposición',
        time: this.time,
        timeSpeed: this.timeSpeed,
        playbackDirection: this.playbackDirection,
        view: {
          scaleX: this.view.scaleX,
          scaleY: this.view.scaleY
        },
        styles: {
          theme: this.currentThemeKey,
          ...this.styles
        },
        waves: this.waves.map(w => ({
          name: w.name,
          rawExpr: w.rawExpr,
          velocity: w.velocity,
          visible: w.visible,
          enabledInSum: w.enabledInSum,
          color: w.color,
          width: w.width,
          dash: w.dash,
          opacity: w.opacity
        }))
      };
      return JSON.stringify(data, null, 2);
    }

    importJSON(jsonString) {
      try {
        const data = JSON.parse(jsonString);
        if (!data || !Array.isArray(data.waves)) {
          throw new Error('Formato JSON inválido: debe contener un arreglo de ondas');
        }

        this.waves = [];
        this.nextWaveId = 1;

        if (data.time !== undefined) this.time = Number(data.time) || 0;
        if (data.timeSpeed !== undefined) this.timeSpeed = Number(data.timeSpeed) || 1.0;
        if (data.view) {
          if (data.view.scaleX) this.view.scaleX = Number(data.view.scaleX);
          if (data.view.scaleY) this.view.scaleY = Number(data.view.scaleY);
        }

        if (data.styles) {
          if (data.styles.theme && THEMES[data.styles.theme]) {
            this.setTheme(data.styles.theme);
          }
          this.updateStyles(data.styles);
        }

        data.waves.forEach(wData => {
          this.addWave(wData);
        });

        this.emit('imported', data);
        return true;
      } catch (err) {
        throw new Error('Error al importar archivo de configuración: ' + err.message);
      }
    }
  }

  return {
    Store: StateStore,
    THEMES,
    COMPONENT_PALETTES
  };
});
