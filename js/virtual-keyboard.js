/**
 * virtual-keyboard.js
 * Teclado virtual matemático interactivo, responsivo y completo
 * con previsualización en tiempo real en KaTeX y plantillas de ondas físicas.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['./math-engine'], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./math-engine'));
  } else {
    root.VirtualKeyboard = factory(root.MathEngine);
  }
})(typeof self !== 'undefined' ? self : this, function (MathEngine) {
  'use strict';

  class Keyboard {
    constructor(containerId, options = {}) {
      this.container = document.getElementById(containerId);
      this.activeInput = null;
      this.onApplyCallback = options.onApply || null;
      this.currentCategory = 'math'; // 'math', 'trig', 'templates'

      this.initDOM();
      this.bindEvents();
    }

    initDOM() {
      if (!this.container) return;

      this.container.innerHTML = `
        <div class="vk-header">
          <div class="vk-title-group">
            <span class="vk-icon">⌨️</span>
            <span class="vk-title">Teclado Matemático</span>
          </div>
          <div class="vk-tabs">
            <button type="button" class="vk-tab active" data-tab="math">Básico y Números</button>
            <button type="button" class="vk-tab" data-tab="trig">Trig. y Funciones</button>
            <button type="button" class="vk-tab" data-tab="templates">Plantillas Físicas</button>
          </div>
          <button type="button" class="vk-close-btn" id="vkCloseBtn" title="Cerrar teclado" aria-label="Cerrar teclado">✕</button>
        </div>

        <div class="vk-preview-box">
          <div class="vk-preview-label">Vista previa (LaTeX):</div>
          <div class="vk-preview-content" id="vkKatexPreview">$$\\text{Seleccione una ecuación}$$</div>
        </div>

        <div class="vk-body">
          <!-- Pestaña 1: Básico y Números -->
          <div class="vk-tab-pane active" id="vkTabMath">
            <div class="vk-grid-standard">
              <!-- Fila 1: Variables y constantes -->
              <button type="button" class="vk-key vk-var" data-insert="x">x</button>
              <button type="button" class="vk-key vk-var" data-insert="t">t</button>
              <button type="button" class="vk-key vk-var" data-insert="v">v</button>
              <button type="button" class="vk-key vk-const" data-insert="pi">π</button>
              <button type="button" class="vk-key vk-const" data-insert="e">e</button>
              <button type="button" class="vk-key vk-op" data-insert="(">(</button>
              <button type="button" class="vk-key vk-op" data-insert=")">)</button>
              <button type="button" class="vk-key vk-action vk-backspace" data-action="backspace">⌫</button>

              <!-- Fila 2: Números y operadores primarios -->
              <button type="button" class="vk-key vk-num" data-insert="7">7</button>
              <button type="button" class="vk-key vk-num" data-insert="8">8</button>
              <button type="button" class="vk-key vk-num" data-insert="9">9</button>
              <button type="button" class="vk-key vk-op" data-insert="/">÷</button>
              <button type="button" class="vk-key vk-fn" data-insert="sqrt(">√</button>
              <button type="button" class="vk-key vk-op" data-insert="^">^</button>
              <button type="button" class="vk-key vk-op" data-insert="^2">x²</button>
              <button type="button" class="vk-key vk-action vk-clear" data-action="clear">C</button>

              <!-- Fila 3 -->
              <button type="button" class="vk-key vk-num" data-insert="4">4</button>
              <button type="button" class="vk-key vk-num" data-insert="5">5</button>
              <button type="button" class="vk-key vk-num" data-insert="6">6</button>
              <button type="button" class="vk-key vk-op" data-insert="*">×</button>
              <button type="button" class="vk-key vk-fn" data-insert="sen(">sen</button>
              <button type="button" class="vk-key vk-fn" data-insert="cos(">cos</button>
              <button type="button" class="vk-key vk-fn" data-insert="exp(">exp</button>
              <button type="button" class="vk-key vk-nav" data-action="left">←</button>

              <!-- Fila 4 -->
              <button type="button" class="vk-key vk-num" data-insert="1">1</button>
              <button type="button" class="vk-key vk-num" data-insert="2">2</button>
              <button type="button" class="vk-key vk-num" data-insert="3">3</button>
              <button type="button" class="vk-key vk-op" data-insert="-">−</button>
              <button type="button" class="vk-key vk-num" data-insert="0">0</button>
              <button type="button" class="vk-key vk-num" data-insert=".">.</button>
              <button type="button" class="vk-key vk-op" data-insert="+">+</button>
              <button type="button" class="vk-key vk-nav" data-action="right">→</button>
            </div>
          </div>

          <!-- Pestaña 2: Trigonométricas y avanzadas -->
          <div class="vk-tab-pane" id="vkTabTrig">
            <div class="vk-grid-trig">
              <button type="button" class="vk-key vk-fn" data-insert="sen(">sen(θ)</button>
              <button type="button" class="vk-key vk-fn" data-insert="cos(">cos(θ)</button>
              <button type="button" class="vk-key vk-fn" data-insert="tan(">tan(θ)</button>
              <button type="button" class="vk-key vk-fn" data-insert="asin(">arcsen</button>
              <button type="button" class="vk-key vk-fn" data-insert="acos(">arccos</button>
              <button type="button" class="vk-key vk-fn" data-insert="atan(">arctan</button>

              <button type="button" class="vk-key vk-fn" data-insert="sinh(">senh</button>
              <button type="button" class="vk-key vk-fn" data-insert="cosh(">cosh</button>
              <button type="button" class="vk-key vk-fn" data-insert="tanh(">tanh</button>
              <button type="button" class="vk-key vk-fn" data-insert="abs(">| x |</button>
              <button type="button" class="vk-key vk-fn" data-insert="ln(">ln(x)</button>
              <button type="button" class="vk-key vk-fn" data-insert="log10(">log₁₀</button>

              <button type="button" class="vk-key vk-op" data-insert="(x - v*t)">(x − v·t)</button>
              <button type="button" class="vk-key vk-op" data-insert="(x + v*t)">(x + v·t)</button>
              <button type="button" class="vk-key vk-op" data-insert="^4">x⁴</button>
              <button type="button" class="vk-key vk-op" data-insert="((x - v*t)^4 + 1)">((x−vt)⁴+1)</button>
            </div>
          </div>

          <!-- Pestaña 3: Plantillas Físicas -->
          <div class="vk-tab-pane" id="vkTabTemplates">
            <div class="vk-templates-list">
              <div class="vk-tpl-item" data-template="2 * sen(x - v*t)">
                <div class="vk-tpl-title">Onda Senoidal Viajera ($x - vt$)</div>
                <div class="vk-tpl-math">$$y(x,t) = 2 \\cdot \\operatorname{sen}(x - v \\cdot t)$$</div>
              </div>
              <div class="vk-tpl-item" data-template="2 / ((x - v*t)^4 + 1)">
                <div class="vk-tpl-title">Pulso Racional Cuártico (Solitón)</div>
                <div class="vk-tpl-math">$$y(x,t) = \\frac{2}{(x - v \\cdot t)^4 + 1}$$</div>
              </div>
              <div class="vk-tpl-item" data-template="3 * exp(-0.5 * (x - v*t)^2)">
                <div class="vk-tpl-title">Pulso Gaussiano</div>
                <div class="vk-tpl-math">$$y(x,t) = 3 \\cdot e^{-0.5(x - v \\cdot t)^2}$$</div>
              </div>
              <div class="vk-tpl-item" data-template="1.5 * sen(2*pi*0.5*x - 2*pi*1.0*t)">
                <div class="vk-tpl-title">Onda Armónica Estándar ($k x - \\omega t$)</div>
                <div class="vk-tpl-math">$$y(x,t) = 1.5 \\cdot \\operatorname{sen}(k x - \\omega t)$$</div>
              </div>
              <div class="vk-tpl-item" data-template="2 * exp(-0.2 * (x - v*t)^2) * cos(3 * (x - v*t))">
                <div class="vk-tpl-title">Paquete de Ondas Modulado</div>
                <div class="vk-tpl-math">$$y(x,t) = 2 \\cdot e^{-0.2(x-vt)^2} \\cos(3(x-vt))$$</div>
              </div>
            </div>
          </div>
        </div>

        <div class="vk-footer">
          <button type="button" class="vk-btn-cancel" id="vkBtnCancel">Ocultar</button>
          <button type="button" class="vk-btn-apply" id="vkBtnApply">✔ Aplicar a la Onda</button>
        </div>
      `;

      this.previewEl = document.getElementById('vkKatexPreview');
    }

    bindEvents() {
      if (!this.container) return;

      // Pestañas
      const tabs = this.container.querySelectorAll('.vk-tab');
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          const targetTab = tab.dataset.tab;

          const panes = this.container.querySelectorAll('.vk-tab-pane');
          panes.forEach(p => p.classList.remove('active'));

          if (targetTab === 'math') {
            document.getElementById('vkTabMath').classList.add('active');
          } else if (targetTab === 'trig') {
            document.getElementById('vkTabTrig').classList.add('active');
          } else if (targetTab === 'templates') {
            document.getElementById('vkTabTemplates').classList.add('active');
            this.renderTemplatesMath();
          }
        });
      });

      // Teclas de inserción
      this.container.addEventListener('click', (e) => {
        const key = e.target.closest('.vk-key');
        if (key) {
          if (key.dataset.insert) {
            this.insertText(key.dataset.insert);
          } else if (key.dataset.action) {
            this.handleAction(key.dataset.action);
          }
          return;
        }

        const tpl = e.target.closest('.vk-tpl-item');
        if (tpl && tpl.dataset.template) {
          this.setFullText(tpl.dataset.template);
          return;
        }

        if (e.target.id === 'vkCloseBtn' || e.target.id === 'vkBtnCancel') {
          this.hide();
          return;
        }

        if (e.target.id === 'vkBtnApply') {
          if (this.onApplyCallback && this.activeInput) {
            this.onApplyCallback(this.activeInput.value);
          }
          this.hide();
        }
      });
    }

    renderTemplatesMath() {
      if (typeof window !== 'undefined' && window.katex) {
        const mathNodes = this.container.querySelectorAll('.vk-tpl-math');
        mathNodes.forEach(node => {
          if (!node.dataset.rendered) {
            const code = node.textContent.replace(/\$\$/g, '').trim();
            try {
              window.katex.render(code, node, { throwOnError: false, displayMode: true });
              node.dataset.rendered = 'true';
            } catch {
              // fallback
            }
          }
        });
      }
    }

    attachToInput(inputEl, waveName = 'Onda') {
      this.activeInput = inputEl;
      this.container.classList.add('visible');

      const titleEl = this.container.querySelector('.vk-title');
      if (titleEl) {
        titleEl.textContent = `Editando ecuación: ${waveName}`;
      }

      this.updatePreview();

      // Escuchar cambios directos de teclado físico en el input
      inputEl.addEventListener('input', () => {
        this.updatePreview();
      });

      // Asegurar foco
      inputEl.focus();
    }

    hide() {
      if (this.container) {
        this.container.classList.remove('visible');
      }
      this.activeInput = null;
    }

    insertText(text) {
      if (!this.activeInput) return;

      const input = this.activeInput;
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const val = input.value;

      input.value = val.substring(0, start) + text + val.substring(end);
      const newCursor = start + text.length;
      input.setSelectionRange(newCursor, newCursor);
      input.focus();

      // Disparar evento de input para que react-like stores actualicen
      input.dispatchEvent(new Event('input', { bubbles: true }));
      this.updatePreview();
    }

    setFullText(text) {
      if (!this.activeInput) return;
      this.activeInput.value = text;
      this.activeInput.focus();
      this.activeInput.setSelectionRange(text.length, text.length);
      this.activeInput.dispatchEvent(new Event('input', { bubbles: true }));
      this.updatePreview();
    }

    handleAction(action) {
      if (!this.activeInput) return;
      const input = this.activeInput;
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const val = input.value;

      if (action === 'backspace') {
        if (start === end && start > 0) {
          input.value = val.substring(0, start - 1) + val.substring(end);
          input.setSelectionRange(start - 1, start - 1);
        } else if (start !== end) {
          input.value = val.substring(0, start) + val.substring(end);
          input.setSelectionRange(start, start);
        }
      } else if (action === 'clear') {
        input.value = '';
        input.setSelectionRange(0, 0);
      } else if (action === 'left') {
        const nextPos = Math.max(0, start - 1);
        input.setSelectionRange(nextPos, nextPos);
      } else if (action === 'right') {
        const nextPos = Math.min(val.length, end + 1);
        input.setSelectionRange(nextPos, nextPos);
      }

      input.focus();
      input.dispatchEvent(new Event('input', { bubbles: true }));
      this.updatePreview();
    }

    updatePreview() {
      if (!this.previewEl) return;
      const raw = this.activeInput ? this.activeInput.value : '';

      if (!raw || !raw.trim()) {
        this.previewEl.innerHTML = '<span class="vk-placeholder">Escriba una ecuación matemática...</span>';
        return;
      }

      const latexStr = `y(x,t) = ${MathEngine.toLatex(raw)}`;

      if (typeof window !== 'undefined' && window.katex) {
        try {
          window.katex.render(latexStr, this.previewEl, {
            throwOnError: false,
            displayMode: true
          });
        } catch {
          this.previewEl.textContent = latexStr;
        }
      } else {
        this.previewEl.textContent = raw;
      }
    }
  }

  return {
    Keyboard
  };
});
