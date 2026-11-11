/**
 * app.js
 * Punto de entrada principal y bucle maestro de simulación física a 60 FPS
 * con sincronización unificada entre vista principal y ventana modal ampliada.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['./state', './renderer', './modal', './ui'], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('./state'),
      require('./renderer'),
      require('./modal'),
      require('./ui')
    );
  } else {
    root.WaveApp = factory(
      root.AppState,
      root.GeoGebraRenderer,
      root.ModalManager,
      root.UIManager
    );
  }
})(typeof self !== 'undefined' ? self : this, function (AppState, GeoGebraRenderer, ModalManager, UIManager) {
  'use strict';

  class Application {
    constructor() {
      this.store = null;
      this.mainRenderer = null;
      this.modalWindow = null;
      this.ui = null;
      this.lastTimestamp = null;
      this.rafId = null;
    }

    start() {
      // 1. Instanciar Store central
      this.store = new AppState.Store();

      // 2. Instanciar Canvas Principal
      const mainCanvas = document.getElementById('mainCanvas');
      if (!mainCanvas) {
        console.error('No se encontró el elemento mainCanvas.');
        return;
      }

      this.mainRenderer = new GeoGebraRenderer.Renderer(mainCanvas, this.store);

      // Centrar el plano cartesiano en la vista principal
      const rect = mainCanvas.getBoundingClientRect();
      this.store.resetView(rect.width, rect.height);

      // 3. Instanciar Ventana Modal Ampliada
      this.modalWindow = new ModalManager.ModalWindow(this.store, 'btnOpenModalGraph');

      // 4. Instanciar Controlador de UI
      this.ui = new UIManager.UIController(this.store, this.modalWindow);

      // 5. Configurar observador de redimensionamiento
      this.setupResizeHandlers();

      // 6. Arrancar bucle maestro de animación
      this.animate = this.animate.bind(this);
      this.rafId = requestAnimationFrame(this.animate);

      console.log('⚡ Antigravity Physics: Simulador de Ondas y Superposición inicializado correctamente.');
    }

    setupResizeHandlers() {
      const canvasContainer = document.querySelector('.canvas-wrapper');
      if (typeof ResizeObserver !== 'undefined' && canvasContainer) {
        const ro = new ResizeObserver(() => {
          this.mainRenderer.resize();
        });
        ro.observe(canvasContainer);
      } else {
        window.addEventListener('resize', () => {
          this.mainRenderer.resize();
        });
      }
    }

    animate(timestamp) {
      if (!this.lastTimestamp) {
        this.lastTimestamp = timestamp;
      }

      // Delta de tiempo en segundos
      const dt = Math.min((timestamp - this.lastTimestamp) / 1000, 0.1);
      this.lastTimestamp = timestamp;

      // Avance físico del tiempo si la simulación está activa
      if (this.store.isPlaying) {
        const delta = dt * this.store.timeSpeed * this.store.playbackDirection;
        let newTime = this.store.time + delta;
        if (newTime < 0) {
          newTime = 0;
          this.store.setPlaying(false);
        }
        this.store.setTime(newTime);
      }

      // Renderizar vista principal
      this.mainRenderer.render();

      // Renderizar vista modal si está abierta (sincronizada)
      if (this.modalWindow && this.modalWindow.isOpen()) {
        this.modalWindow.render();
      }

      this.rafId = requestAnimationFrame(this.animate);
    }
  }

  // Inicialización al cargar el DOM
  document.addEventListener('DOMContentLoaded', () => {
    const app = new Application();
    app.start();
    window.__waveApp = app; // Para inspección o pruebas si es necesario
  });

  return {
    Application
  };
});
