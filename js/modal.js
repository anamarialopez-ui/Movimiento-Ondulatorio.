/**
 * modal.js
 * Gestión de la ventana modal ampliada con sincronización en tiempo real,
 * estados de maximizado, restaurado, colapsado/minimizado y pantalla completa nativa.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['./renderer'], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./renderer'));
  } else {
    root.ModalManager = factory(root.GeoGebraRenderer);
  }
})(typeof self !== 'undefined' ? self : this, function (GeoGebraRenderer) {
  'use strict';

  class ModalWindow {
    constructor(store, triggerButtonId) {
      this.store = store;
      this.triggerBtn = document.getElementById(triggerButtonId);
      this.modalEl = document.getElementById('modalExpandedGraph');
      this.modalCanvas = document.getElementById('modalCanvas');
      this.renderer = null;

      this.isMaximized = false;
      this.isCollapsed = false;
      this.previousFocusedElement = null;

      this.init();
    }

    init() {
      if (!this.modalEl || !this.modalCanvas) return;

      // Instanciar renderer del modal conectado al mismo store
      this.renderer = new GeoGebraRenderer.Renderer(this.modalCanvas, this.store, { isModal: true });

      // Botón que abre el modal
      if (this.triggerBtn) {
        this.triggerBtn.addEventListener('click', () => this.open());
      }

      // Botones de la barra de título de la ventana modal
      const btnClose = document.getElementById('modalBtnClose');
      const btnMaximize = document.getElementById('modalBtnMaximize');
      const btnMinimize = document.getElementById('modalBtnMinimize');
      const btnFullscreen = document.getElementById('modalBtnFullscreen');

      if (btnClose) btnClose.addEventListener('click', () => this.close());
      if (btnMaximize) btnMaximize.addEventListener('click', () => this.toggleMaximize());
      if (btnMinimize) btnMinimize.addEventListener('click', () => this.toggleCollapse());
      if (btnFullscreen) btnFullscreen.addEventListener('click', () => this.toggleFullscreen());

      // Atajo de teclado: Escape para cerrar
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen()) {
          this.close();
        }
      });

      // Cambio en pantalla completa nativa
      document.addEventListener('fullscreenchange', () => {
        const isFs = !!document.fullscreenElement;
        this.store.modal.isFullscreen = isFs;
        if (btnFullscreen) {
          btnFullscreen.innerHTML = isFs ? '⤢' : '⛶';
          btnFullscreen.title = isFs ? 'Salir de pantalla completa' : 'Pantalla completa';
        }
        this.handleResize();
      });

      // Resize observer para el canvas del modal
      if (typeof ResizeObserver !== 'undefined') {
        const ro = new ResizeObserver(() => {
          if (this.isOpen() && !this.isCollapsed) {
            this.handleResize();
          }
        });
        ro.observe(this.modalEl);
      }
    }

    isOpen() {
      return this.modalEl && this.modalEl.classList.contains('active');
    }

    open() {
      this.previousFocusedElement = document.activeElement;
      this.modalEl.classList.add('active');
      this.modalEl.classList.remove('collapsed');
      this.isCollapsed = false;
      this.store.modal.isOpen = true;

      // Accesibilidad
      this.modalEl.setAttribute('aria-hidden', 'false');

      // Dar un tick para calcular dimensiones y redimensionar canvas
      requestAnimationFrame(() => {
        this.handleResize();
        const focusable = this.modalEl.querySelector('button, [tabindex="0"]');
        if (focusable) focusable.focus();
      });
    }

    close() {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      this.modalEl.classList.remove('active', 'maximized', 'collapsed');
      this.isMaximized = false;
      this.isCollapsed = false;
      this.store.modal.isOpen = false;
      this.store.modal.isMaximized = false;
      this.store.modal.isCollapsed = false;

      this.modalEl.setAttribute('aria-hidden', 'true');

      if (this.previousFocusedElement && typeof this.previousFocusedElement.focus === 'function') {
        this.previousFocusedElement.focus();
      }
    }

    toggleMaximize() {
      if (this.isCollapsed) {
        this.modalEl.classList.remove('collapsed');
        this.isCollapsed = false;
      }

      this.isMaximized = !this.isMaximized;
      this.modalEl.classList.toggle('maximized', this.isMaximized);
      this.store.modal.isMaximized = this.isMaximized;

      const btn = document.getElementById('modalBtnMaximize');
      if (btn) {
        btn.innerHTML = this.isMaximized ? '❐' : '🗖';
        btn.title = this.isMaximized ? 'Restaurar tamaño' : 'Maximizar ventana';
      }

      setTimeout(() => this.handleResize(), 50);
    }

    toggleCollapse() {
      this.isCollapsed = !this.isCollapsed;
      this.modalEl.classList.toggle('collapsed', this.isCollapsed);
      this.store.modal.isCollapsed = this.isCollapsed;

      const btn = document.getElementById('modalBtnMinimize');
      if (btn) {
        btn.innerHTML = this.isCollapsed ? '▲' : '🗕';
        btn.title = this.isCollapsed ? 'Expandir modal' : 'Minimizar / Colapsar';
      }

      if (!this.isCollapsed) {
        setTimeout(() => this.handleResize(), 50);
      }
    }

    toggleFullscreen() {
      if (!document.fullscreenElement) {
        if (this.modalEl.requestFullscreen) {
          this.modalEl.requestFullscreen().catch(err => {
            console.warn('Error al solicitar pantalla completa:', err);
          });
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      }
    }

    handleResize() {
      if (this.renderer) {
        this.renderer.resize();
        this.renderer.render();
      }
    }

    render() {
      if (this.isOpen() && !this.isCollapsed && this.renderer) {
        this.renderer.render();
      }
    }
  }

  return {
    ModalWindow
  };
});
