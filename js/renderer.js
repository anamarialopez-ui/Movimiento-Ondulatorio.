/**
 * renderer.js
 * Motor de renderizado Canvas 2D de alta fidelidad estilo "GeoGebra":
 * Cuadrícula mayor y menor (papel milimetrado), reglas, marcas, ticks graduados,
 * renderizado adaptativo de ondas, vectores de propagación, sonda/inspector
 * y reescalamiento manual independiente de ejes.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['./math-engine'], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./math-engine'));
  } else {
    root.GeoGebraRenderer = factory(root.MathEngine);
  }
})(typeof self !== 'undefined' ? self : this, function (MathEngine) {
  'use strict';

  class Renderer {
    constructor(canvas, store, options = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.store = store;
      this.isModalInstance = !!options.isModal;

      this.dpr = 1;
      this.width = 0;
      this.height = 0;

      // Estado de interacción de mouse / touch
      this.isDragging = false;
      this.dragMode = 'pan'; // 'pan', 'scale-x', 'scale-y'
      this.dragStart = { x: 0, y: 0 };
      this.lastMouseWorld = { x: 0, y: 0 };
      this.mouseScreen = { x: 0, y: 0 };
      this.isHovering = false;

      // Soporte multitouch
      this.touchDistance = 0;

      // Inicializar y enlazar eventos
      this.initEvents();
      this.resize();
    }

    resize() {
      if (!this.canvas) return;
      const rect = this.canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      this.dpr = window.devicePixelRatio || 1;
      this.width = rect.width;
      this.height = rect.height;

      this.canvas.width = Math.floor(rect.width * this.dpr);
      this.canvas.height = Math.floor(rect.height * this.dpr);

      // Si los orígenes no se han definido o están en 0, centrar
      if (this.store.view.originX === 0 && this.store.view.originY === 0) {
        this.store.view.originX = this.width / 2;
        this.store.view.originY = this.height / 2;
      }
    }

    worldToScreen(x, y) {
      const view = this.store.view;
      return {
        x: view.originX + x * view.scaleX,
        y: view.originY - y * view.scaleY
      };
    }

    screenToWorld(sx, sy) {
      const view = this.store.view;
      return {
        x: (sx - view.originX) / view.scaleX,
        y: (view.originY - sy) / view.scaleY
      };
    }

    /**
     * Calcula paso de cuadrícula "amigable" estilo GeoGebra (1, 2, 5 x 10^n)
     */
    calculateNiceStep(scale, targetPixelSpacing = 80) {
      const rawStep = targetPixelSpacing / scale;
      const power = Math.floor(Math.log10(rawStep));
      const fraction = rawStep / Math.pow(10, power);

      let niceFraction;
      if (fraction < 1.5) niceFraction = 1;
      else if (fraction < 3.5) niceFraction = 2;
      else if (fraction < 7.5) niceFraction = 5;
      else niceFraction = 10;

      return niceFraction * Math.pow(10, power);
    }

    render() {
      if (!this.canvas || !this.ctx || this.width === 0 || this.height === 0) return;

      const ctx = this.ctx;
      const store = this.store;
      const styles = store.styles;
      const view = store.view;

      ctx.save();
      // Escalar contexto por DPR para nitidez máxima en pantallas retina/alta densidad
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

      // 1. Fondo del lienzo
      ctx.fillStyle = styles.bgColor;
      ctx.fillRect(0, 0, this.width, this.height);

      // Límites del mundo visibles
      const topLeftWorld = this.screenToWorld(0, 0);
      const bottomRightWorld = this.screenToWorld(this.width, this.height);

      const xMin = topLeftWorld.x;
      const xMax = bottomRightWorld.x;
      const yMin = bottomRightWorld.y;
      const yMax = topLeftWorld.y;

      // 2. Cuadrícula (Mayor y Menor - Papel Milimetrado)
      this.drawGrids(ctx, xMin, xMax, yMin, yMax, styles, view);

      // 3. Ejes Cartesianos con reglas, ticks graduados y números
      if (styles.showAxes) {
        this.drawAxes(ctx, xMin, xMax, yMin, yMax, styles, view);
      }

      // 4. Renderizar ondas componentes
      this.drawComponentWaves(ctx, xMin, xMax, yMin, yMax, store);

      // 5. Renderizar onda resultante (Superposición)
      this.drawResultantWave(ctx, xMin, xMax, yMin, yMax, store);

      // 6. Sonda / Inspector puntual
      if (store.inspector.active) {
        this.drawInspector(ctx, yMin, yMax, store);
      }

      ctx.restore();
    }

    drawGrids(ctx, xMin, xMax, yMin, yMax, styles, view) {
      if (!styles.showMajorGrid && !styles.showMinorGrid) return;

      const stepX = this.calculateNiceStep(view.scaleX, 75);
      const stepY = this.calculateNiceStep(view.scaleY, 75);

      const subs = styles.subdivisions || 5;
      const minorStepX = stepX / subs;
      const minorStepY = stepY / subs;

      // --- Cuadrícula menor (papel milimetrado) ---
      if (styles.showMinorGrid) {
        ctx.strokeStyle = styles.minorGridColor;
        ctx.lineWidth = styles.minorGridWidth;
        ctx.beginPath();

        const startMinX = Math.floor(xMin / minorStepX) * minorStepX;
        const endMinX = Math.ceil(xMax / minorStepX) * minorStepX;
        for (let x = startMinX; x <= endMinX; x += minorStepX) {
          const sx = Math.round(view.originX + x * view.scaleX) + 0.5;
          ctx.moveTo(sx, 0);
          ctx.lineTo(sx, this.height);
        }

        const startMinY = Math.floor(yMin / minorStepY) * minorStepY;
        const endMinY = Math.ceil(yMax / minorStepY) * minorStepY;
        for (let y = startMinY; y <= endMinY; y += minorStepY) {
          const sy = Math.round(view.originY - y * view.scaleY) + 0.5;
          ctx.moveTo(0, sy);
          ctx.lineTo(this.width, sy);
        }
        ctx.stroke();
      }

      // --- Cuadrícula mayor ---
      if (styles.showMajorGrid) {
        ctx.strokeStyle = styles.majorGridColor;
        ctx.lineWidth = styles.majorGridWidth;
        ctx.beginPath();

        const startX = Math.floor(xMin / stepX) * stepX;
        const endX = Math.ceil(xMax / stepX) * stepX;
        for (let x = startX; x <= endX; x += stepX) {
          const sx = Math.round(view.originX + x * view.scaleX) + 0.5;
          ctx.moveTo(sx, 0);
          ctx.lineTo(sx, this.height);
        }

        const startY = Math.floor(yMin / stepY) * stepY;
        const endY = Math.ceil(yMax / stepY) * stepY;
        for (let y = startY; y <= endY; y += stepY) {
          const sy = Math.round(view.originY - y * view.scaleY) + 0.5;
          ctx.moveTo(0, sy);
          ctx.lineTo(this.width, sy);
        }
        ctx.stroke();
      }
    }

    drawAxes(ctx, xMin, xMax, yMin, yMax, styles, view) {
      const originX = view.originX;
      const originY = view.originY;

      ctx.strokeStyle = styles.axisColor;
      ctx.lineWidth = styles.axisWidth;
      ctx.fillStyle = styles.axisColor;
      ctx.font = `${styles.tickFontSize || 11}px ${styles.fontFamily}`;

      // Posición fija del eje si está fuera de pantalla (estilo regla flotante de GeoGebra)
      const clampedAxisY = Math.max(25, Math.min(this.height - 25, originY));
      const clampedAxisX = Math.max(35, Math.min(this.width - 35, originX));

      // 1. Línea Eje X
      ctx.beginPath();
      ctx.moveTo(0, Math.round(clampedAxisY) + 0.5);
      ctx.lineTo(this.width, Math.round(clampedAxisY) + 0.5);
      ctx.stroke();

      // Flecha Eje X (derecha)
      ctx.beginPath();
      ctx.moveTo(this.width - 12, clampedAxisY - 4);
      ctx.lineTo(this.width - 1, clampedAxisY);
      ctx.lineTo(this.width - 12, clampedAxisY + 4);
      ctx.stroke();

      // 2. Línea Eje Y
      ctx.beginPath();
      ctx.moveTo(Math.round(clampedAxisX) + 0.5, 0);
      ctx.lineTo(Math.round(clampedAxisX) + 0.5, this.height);
      ctx.stroke();

      // Flecha Eje Y (arriba)
      ctx.beginPath();
      ctx.moveTo(clampedAxisX - 4, 12);
      ctx.lineTo(clampedAxisX, 1);
      ctx.lineTo(clampedAxisX + 4, 12);
      ctx.stroke();

      // Etiquetas de los ejes
      ctx.font = `600 ${styles.labelFontSize || 13}px ${styles.fontFamily}`;
      ctx.fillText('x (m)', this.width - 40, clampedAxisY - 10);
      ctx.fillText('y (m)', clampedAxisX + 12, 18);

      // 3. Ticks y Números graduados
      if (styles.showTicks || styles.showLabels) {
        ctx.font = `${styles.tickFontSize || 11}px ${styles.fontFamily}`;
        const stepX = this.calculateNiceStep(view.scaleX, 75);
        const stepY = this.calculateNiceStep(view.scaleY, 75);

        // Ticks en X
        const startX = Math.floor(xMin / stepX) * stepX;
        const endX = Math.ceil(xMax / stepX) * stepX;

        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        for (let x = startX; x <= endX; x += stepX) {
          if (Math.abs(x) < stepX * 0.05) continue; // Evitar el cero aquí

          const sx = Math.round(view.originX + x * view.scaleX) + 0.5;
          if (sx < 10 || sx > this.width - 10) continue;

          // Marca (tick)
          if (styles.showTicks) {
            ctx.beginPath();
            ctx.moveTo(sx, clampedAxisY - 4);
            ctx.lineTo(sx, clampedAxisY + 4);
            ctx.stroke();
          }

          // Número
          if (styles.showLabels) {
            const formatted = this.formatNumber(x, stepX);
            ctx.fillText(formatted, sx, clampedAxisY + 6);
          }
        }

        // Ticks en Y
        const startY = Math.floor(yMin / stepY) * stepY;
        const endY = Math.ceil(yMax / stepY) * stepY;

        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';

        for (let y = startY; y <= endY; y += stepY) {
          if (Math.abs(y) < stepY * 0.05) continue;

          const sy = Math.round(view.originY - y * view.scaleY) + 0.5;
          if (sy < 10 || sy > this.height - 10) continue;

          if (styles.showTicks) {
            ctx.beginPath();
            ctx.moveTo(clampedAxisX - 4, sy);
            ctx.lineTo(clampedAxisX + 4, sy);
            ctx.stroke();
          }

          if (styles.showLabels) {
            const formatted = this.formatNumber(y, stepY);
            ctx.fillText(formatted, clampedAxisX - 7, sy);
          }
        }

        // Cero '0' en el origen
        if (styles.showLabels) {
          ctx.textAlign = 'right';
          ctx.textBaseline = 'top';
          ctx.fillText('0', clampedAxisX - 6, clampedAxisY + 6);
        }
      }
    }

    formatNumber(num, step) {
      if (Math.abs(num) < 1e-10) return '0';
      const decimals = step < 0.1 ? 2 : step < 1 ? 1 : 0;
      return num.toFixed(decimals);
    }

    drawComponentWaves(ctx, xMin, xMax, yMin, yMax, store) {
      const waves = store.waves;
      const t = store.time;
      const view = store.view;
      const showVectors = store.styles.showVectors;

      for (let i = 0; i < waves.length; i++) {
        const wave = waves[i];
        if (wave.visible === false || !wave.fn) continue;

        ctx.save();
        ctx.strokeStyle = wave.color;
        ctx.lineWidth = wave.width || 2.5;
        ctx.globalAlpha = wave.opacity !== undefined ? wave.opacity : 0.85;

        if (Array.isArray(wave.dash) && wave.dash.length > 0) {
          ctx.setLineDash(wave.dash);
        } else {
          ctx.setLineDash([]);
        }

        const segments = MathEngine.sampleWave(
          wave.fn,
          xMin,
          xMax,
          yMin,
          yMax,
          t,
          wave.velocity,
          1.5,
          view.scaleX
        );

        let maxPoint = null;
        let maxAbsY = 0;

        for (let s = 0; s < segments.length; s++) {
          const seg = segments[s];
          if (seg.length < 2) continue;

          ctx.beginPath();
          const p0 = this.worldToScreen(seg[0].x, seg[0].y);
          ctx.moveTo(p0.x, p0.y);

          for (let k = 1; k < seg.length; k++) {
            const pk = this.worldToScreen(seg[k].x, seg[k].y);
            ctx.lineTo(pk.x, pk.y);

            if (Math.abs(seg[k].y) > maxAbsY) {
              maxAbsY = Math.abs(seg[k].y);
              maxPoint = seg[k];
            }
          }
          ctx.stroke();
        }

        ctx.restore();

        // Indicador vectorial de propagación (flecha y etiqueta de velocidad)
        if (showVectors && wave.velocity !== 0 && maxPoint && maxAbsY > 0.15) {
          this.drawPropagationVector(ctx, wave, maxPoint);
        }
      }
    }

    drawPropagationVector(ctx, wave, point) {
      const pScreen = this.worldToScreen(point.x, point.y);
      const v = wave.velocity;
      const dir = v > 0 ? 1 : -1;
      const arrowLen = 38;

      ctx.save();
      ctx.strokeStyle = wave.color;
      ctx.fillStyle = wave.color;
      ctx.lineWidth = 2.0;

      // Colocar flecha justo arriba de la cresta o punto principal
      const offsetY = point.y >= 0 ? -22 : 22;
      const sx = pScreen.x;
      const sy = pScreen.y + offsetY;

      // Línea del vector
      ctx.beginPath();
      ctx.moveTo(sx - (arrowLen / 2) * dir, sy);
      ctx.lineTo(sx + (arrowLen / 2) * dir, sy);
      ctx.stroke();

      // Punta de flecha
      const tipX = sx + (arrowLen / 2) * dir;
      ctx.beginPath();
      ctx.moveTo(tipX, sy);
      ctx.lineTo(tipX - 7 * dir, sy - 5);
      ctx.lineTo(tipX - 7 * dir, sy + 5);
      ctx.closePath();
      ctx.fill();

      // Etiqueta v
      ctx.font = '600 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = point.y >= 0 ? 'bottom' : 'top';
      const labelText = `v = ${v > 0 ? '+' : ''}${v} m/s`;
      ctx.fillText(labelText, sx, sy + (point.y >= 0 ? -4 : 4));

      ctx.restore();
    }

    drawResultantWave(ctx, xMin, xMax, yMin, yMax, store) {
      const styles = store.styles;
      if (styles.resultantVisible === false) return;

      const activeWaves = store.waves.filter(w => w.enabledInSum !== false && w.fn);
      if (activeWaves.length === 0) return;

      const t = store.time;
      const view = store.view;

      const segments = MathEngine.sampleSuperposition(
        activeWaves,
        xMin,
        xMax,
        yMin,
        yMax,
        t,
        1.5,
        view.scaleX
      );

      ctx.save();

      // Sombreado de área bajo la curva (relleno translúcido)
      if (styles.fillUnderCurve && segments.length > 0) {
        ctx.fillStyle = styles.resultantColor;
        ctx.globalAlpha = styles.fillOpacity || 0.12;

        const zeroScreenY = view.originY;

        for (let s = 0; s < segments.length; s++) {
          const seg = segments[s];
          if (seg.length < 2) continue;

          ctx.beginPath();
          const first = this.worldToScreen(seg[0].x, seg[0].y);
          ctx.moveTo(first.x, zeroScreenY);
          ctx.lineTo(first.x, first.y);

          for (let k = 1; k < seg.length; k++) {
            const pk = this.worldToScreen(seg[k].x, seg[k].y);
            ctx.lineTo(pk.x, pk.y);
          }

          const last = this.worldToScreen(seg[seg.length - 1].x, seg[seg.length - 1].y);
          ctx.lineTo(last.x, zeroScreenY);
          ctx.closePath();
          ctx.fill();
        }
      }

      // Trazo de la curva resultante
      ctx.strokeStyle = styles.resultantColor;
      ctx.lineWidth = styles.resultantWidth || 3.5;
      ctx.globalAlpha = styles.resultantOpacity !== undefined ? styles.resultantOpacity : 1.0;

      if (Array.isArray(styles.resultantDash) && styles.resultantDash.length > 0) {
        ctx.setLineDash(styles.resultantDash);
      } else {
        ctx.setLineDash([]);
      }

      // Efecto resplandor / glow opcional
      if (styles.resultantGlow) {
        ctx.shadowColor = styles.resultantColor;
        ctx.shadowBlur = 9;
      }

      for (let s = 0; s < segments.length; s++) {
        const seg = segments[s];
        if (seg.length < 2) continue;

        ctx.beginPath();
        const p0 = this.worldToScreen(seg[0].x, seg[0].y);
        ctx.moveTo(p0.x, p0.y);

        for (let k = 1; k < seg.length; k++) {
          const pk = this.worldToScreen(seg[k].x, seg[k].y);
          ctx.lineTo(pk.x, pk.y);
        }
        ctx.stroke();
      }

      ctx.restore();
    }

    drawInspector(ctx, yMin, yMax, store) {
      const probeX = store.inspector.x;
      const t = store.time;
      const view = store.view;

      const screenX = view.originX + probeX * view.scaleX;

      // Si está dentro de la pantalla visible
      if (screenX < 0 || screenX > this.width) return;

      const probeData = MathEngine.probeAt(probeX, t, store.waves);

      ctx.save();

      // Línea vertical de la sonda
      ctx.strokeStyle = '#f59e0b'; // Ámbar brillante
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(screenX, 0);
      ctx.lineTo(screenX, this.height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Puntos de intersección en cada componente
      probeData.components.forEach(comp => {
        if (!comp.visible || isNaN(comp.value)) return;
        const pt = this.worldToScreen(probeX, comp.value);

        ctx.fillStyle = comp.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      // Punto de intersección en la resultante
      if (store.styles.resultantVisible !== false && !isNaN(probeData.resultant)) {
        const ptRes = this.worldToScreen(probeX, probeData.resultant);

        ctx.fillStyle = store.styles.resultantColor;
        ctx.beginPath();
        ctx.arc(ptRes.x, ptRes.y, 6.0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.0;
        ctx.stroke();
      }

      // Marcador de coordenada en el eje X
      const tagText = `x = ${probeX.toFixed(2)} m`;
      ctx.font = '600 11px Inter, sans-serif';
      const textWidth = ctx.measureText(tagText).width;

      ctx.fillStyle = '#f59e0b';
      const tagX = Math.max(5, Math.min(this.width - textWidth - 15, screenX - (textWidth + 12) / 2));
      const tagY = Math.min(this.height - 24, view.originY + 8);

      ctx.beginPath();
      ctx.roundRect(tagX, tagY, textWidth + 12, 18, 4);
      ctx.fill();

      ctx.fillStyle = '#000000';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(tagText, tagX + 6, tagY + 9);

      ctx.restore();
    }

    // Inicialización y manejo de eventos de ratón, rueda y toques táctiles
    initEvents() {
      const canvas = this.canvas;

      canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
        this.store.zoom(zoomFactor, mouseX, mouseY);
      }, { passive: false });

      canvas.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return; // Solo click izquierdo
        const rect = canvas.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;

        this.isDragging = true;
        this.dragStart = { x: sx, y: sy };

        // Detección de reescalamiento independiente de ejes estilo GeoGebra
        const view = this.store.view;
        const nearAxisX = Math.abs(sy - view.originY) < 22;
        const nearAxisY = Math.abs(sx - view.originX) < 22;

        if (this.store.activeTool === 'inspect') {
          const w = this.screenToWorld(sx, sy);
          this.store.setInspector(true, w.x, true);
          this.dragMode = 'inspect';
        } else if (nearAxisX && !nearAxisY) {
          this.dragMode = 'scale-x';
          canvas.style.cursor = 'ew-resize';
        } else if (nearAxisY && !nearAxisX) {
          this.dragMode = 'scale-y';
          canvas.style.cursor = 'ns-resize';
        } else {
          this.dragMode = 'pan';
          canvas.style.cursor = 'grabbing';
        }
      });

      window.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;

        this.mouseScreen = { x: sx, y: sy };
        this.lastMouseWorld = this.screenToWorld(sx, sy);

        if (this.isDragging) {
          const dx = sx - this.dragStart.x;
          const dy = sy - this.dragStart.y;

          if (this.dragMode === 'pan') {
            this.store.pan(dx, dy);
            this.dragStart = { x: sx, y: sy };
          } else if (this.dragMode === 'scale-x') {
            const factor = 1 + (dx / 180);
            this.store.scaleAxis('x', factor, this.store.view.originX);
            this.dragStart = { x: sx, y: sy };
          } else if (this.dragMode === 'scale-y') {
            const factor = 1 - (dy / 180);
            this.store.scaleAxis('y', factor, this.store.view.originY);
            this.dragStart = { x: sx, y: sy };
          } else if (this.dragMode === 'inspect') {
            const w = this.screenToWorld(sx, sy);
            this.store.setInspector(true, w.x, true);
          }
        } else {
          // Actualización del cursor según posición
          const view = this.store.view;
          const nearAxisX = Math.abs(sy - view.originY) < 22;
          const nearAxisY = Math.abs(sx - view.originX) < 22;

          if (this.store.activeTool === 'inspect') {
            canvas.style.cursor = 'crosshair';
            if (!this.store.inspector.pinned) {
              const w = this.screenToWorld(sx, sy);
              this.store.setInspector(true, w.x, false);
            }
          } else if (nearAxisX && !nearAxisY) {
            canvas.style.cursor = 'ew-resize';
          } else if (nearAxisY && !nearAxisX) {
            canvas.style.cursor = 'ns-resize';
          } else {
            canvas.style.cursor = 'grab';
          }
        }
      });

      window.addEventListener('mouseup', () => {
        if (this.isDragging) {
          this.isDragging = false;
          canvas.style.cursor = this.store.activeTool === 'inspect' ? 'crosshair' : 'grab';
        }
      });

      // Doble click: restablecer vista centrada en el origen
      canvas.addEventListener('dblclick', () => {
        this.store.resetView(this.width, this.height);
      });

      // Gestos táctiles para dispositivos móviles
      canvas.addEventListener('touchstart', (e) => {
        const rect = canvas.getBoundingClientRect();
        if (e.touches.length === 1) {
          const t = e.touches[0];
          this.isDragging = true;
          this.dragMode = 'pan';
          this.dragStart = { x: t.clientX - rect.left, y: t.clientY - rect.top };
        } else if (e.touches.length === 2) {
          this.isDragging = false;
          const t1 = e.touches[0];
          const t2 = e.touches[1];
          this.touchDistance = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        }
      }, { passive: true });

      canvas.addEventListener('touchmove', (e) => {
        const rect = canvas.getBoundingClientRect();
        if (e.touches.length === 1 && this.isDragging) {
          const t = e.touches[0];
          const sx = t.clientX - rect.left;
          const sy = t.clientY - rect.top;
          const dx = sx - this.dragStart.x;
          const dy = sy - this.dragStart.y;
          this.store.pan(dx, dy);
          this.dragStart = { x: sx, y: sy };
        } else if (e.touches.length === 2) {
          const t1 = e.touches[0];
          const t2 = e.touches[1];
          const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
          if (this.touchDistance > 0) {
            const factor = dist / this.touchDistance;
            const midX = (t1.clientX + t2.clientX) / 2 - rect.left;
            const midY = (t1.clientY + t2.clientY) / 2 - rect.top;
            this.store.zoom(factor, midX, midY);
          }
          this.touchDistance = dist;
        }
      }, { passive: true });

      canvas.addEventListener('touchend', () => {
        this.isDragging = false;
        this.touchDistance = 0;
      });
    }
  }

  return {
    Renderer
  };
});
