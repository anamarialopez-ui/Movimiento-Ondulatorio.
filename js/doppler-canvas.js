/**
 * doppler-canvas.js
 * Motor de renderizado en Canvas 2D de alta fidelidad para el Efecto Doppler.
 * 
 * Implementa:
 * - Conversión bidireccional física (metros) <-> pantalla (píxeles) con devicePixelRatio.
 * - Zoom suave centrado en el cursor y desplazamiento (Pan).
 * - Cuadrícula métrica adaptativa, ejes cartesianos graduados y barra de escala física.
 * - Frentes de onda circulares fijos en el medio, con estilo, atenuación y selección de inspección.
 * - Avatares vectoriales de la fuente: Punto emisor, Automóvil y Avión supersónico.
 * - Avatar del observador (micrófono acústico con punto de detección y animación de recepción).
 * - Vectores cinemáticos de velocidad (vf y vo).
 * - Envolvente y cono de choque de Mach (mu = arcsin(1/M)) en régimen supersónico.
 * - Regla de medición de longitud de onda espacial (caliper) entre frentes consecutivos.
 * - Herramienta interactiva de arrastre de objetos y medición con cinta métrica.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.DopplerCanvas = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  class DopplerCanvasRenderer {
    constructor(canvas, engine, options = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.engine = engine;

      // Opciones de estilo y visualización
      this.theme = options.theme || 'dark'; // 'dark' | 'light'
      this.sourceAvatar = options.sourceAvatar || 'jet'; // 'point' | 'car' | 'jet'
      this.waveStyle = options.waveStyle || 'solid'; // 'solid' | 'dashed' | 'dotted'
      this.waveColor = options.waveColor || '#38bdf8'; // Celeste cian de alto contraste
      this.waveWidth = options.waveWidth || 2.0;
      this.visualAttenuation = options.visualAttenuation || false;
      this.showMachCone = true;
      this.showVectors = true;
      this.showWavelengthCalipers = true;
      this.followSource = false;
      this.activeTool = 'select'; // 'select' | 'pan' | 'measure' | 'drag-source' | 'drag-observer'

      // Transformación de vista: el centro de la pantalla corresponde a (offsetX, offsetY) en metros
      this.scale = 1.0; // píxeles por metro
      this.panX = 0; // offset en metros del centro
      this.panY = 0;
      this.dpr = window.devicePixelRatio || 1;

      // Estado de interacción
      this.isDragging = false;
      this.dragTarget = null; // 'source' | 'observer' | 'pan' | 'measure'
      this.dragStart = { x: 0, y: 0 };
      this.selectedWaveId = null;
      this.hoveredWaveId = null;

      // Medición manual (regla)
      this.measurePoints = null; // { p1: {x,y}, p2: {x,y} }

      // Animación de pulso del observador
      this.observerPulseTime = 0;

      this.initEvents();
      this.resize();
    }

    resize() {
      if (!this.canvas) return;
      const rect = this.canvas.getBoundingClientRect();
      this.width = rect.width;
      this.height = rect.height;
      this.dpr = window.devicePixelRatio || 1;

      this.canvas.width = Math.round(this.width * this.dpr);
      this.canvas.height = Math.round(this.height * this.dpr);
      this.ctx.resetTransform();
      this.ctx.scale(this.dpr, this.dpr);

      // Si es la primera vez, ajustar escala inicial para que 600 metros quepan cómodamente
      if (this.scale === 1.0 && this.width > 0) {
        this.fitScene();
      }
    }

    fitScene() {
      // Ajustar escala para visualizar la trayectoria y la separación
      const dist = Math.abs(this.engine.observer.x0 - this.engine.source.x0) + 200;
      const targetMeters = Math.max(500, dist * 1.4);
      this.scale = this.width / targetMeters;
      // Centrar entre fuente y observador inicial
      this.panX = (this.engine.source.x0 + this.engine.observer.x0) / 2;
      this.panY = (this.engine.source.y0 + this.engine.observer.y0) / 2;
    }

    resetView() {
      this.fitScene();
    }

    /**
     * Coordenadas físicas (metros) a coordenadas de pantalla (píxeles en CSS)
     */
    worldToScreen(xm, ym) {
      const cx = this.width / 2;
      const cy = this.height / 2;
      const sx = cx + (xm - this.panX) * this.scale;
      const sy = cy - (ym - this.panY) * this.scale; // Eje Y físico positivo hacia arriba
      return { x: sx, y: sy };
    }

    /**
     * Coordenadas de pantalla a coordenadas físicas en metros
     */
    screenToWorld(sx, sy) {
      const cx = this.width / 2;
      const cy = this.height / 2;
      const xm = this.panX + (sx - cx) / this.scale;
      const ym = this.panY - (sy - cy) / this.scale;
      return { x: xm, y: ym };
    }

    initEvents() {
      const c = this.canvas;

      c.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
        const rect = c.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Punto físico bajo el cursor antes del zoom
        const wBefore = this.screenToWorld(mouseX, mouseY);

        // Limitar escala
        const newScale = Math.max(0.1, Math.min(20.0, this.scale * zoomFactor));
        this.scale = newScale;

        // Ajustar pan para que el punto físico bajo el cursor permanezca inmóvil
        const wAfter = this.screenToWorld(mouseX, mouseY);
        this.panX += (wBefore.x - wAfter.x);
        this.panY += (wBefore.y - wAfter.y);
      }, { passive: false });

      c.addEventListener('mousedown', (e) => {
        const rect = c.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const worldPos = this.screenToWorld(mouseX, mouseY);

        this.dragStart = { x: mouseX, y: mouseY, world: worldPos, panX: this.panX, panY: this.panY };

        // Comprobar si se hizo clic cerca de la fuente o del observador (umbral de 24 px)
        const sScreen = this.worldToScreen(this.engine.source.x, this.engine.source.y);
        const oScreen = this.worldToScreen(this.engine.observer.x, this.engine.observer.y);

        const distToSource = Math.hypot(mouseX - sScreen.x, mouseY - sScreen.y);
        const distToObserver = Math.hypot(mouseX - oScreen.x, mouseY - oScreen.y);

        if (distToSource <= 24) {
          this.isDragging = true;
          this.dragTarget = 'source';
        } else if (distToObserver <= 24) {
          this.isDragging = true;
          this.dragTarget = 'observer';
        } else if (this.activeTool === 'measure') {
          this.isDragging = true;
          this.dragTarget = 'measure';
          this.measurePoints = { p1: { ...worldPos }, p2: { ...worldPos } };
        } else {
          // Desplazamiento (Pan) o selección de frente
          this.isDragging = true;
          this.dragTarget = 'pan';

          // Intentar seleccionar frente de onda
          this.detectWaveSelection(worldPos);
        }
      });

      window.addEventListener('mousemove', (e) => {
        const rect = c.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const worldPos = this.screenToWorld(mouseX, mouseY);

        if (!this.isDragging) {
          // Actualizar cursor de hover
          const sScreen = this.worldToScreen(this.engine.source.x, this.engine.source.y);
          const oScreen = this.worldToScreen(this.engine.observer.x, this.engine.observer.y);
          const distToSource = Math.hypot(mouseX - sScreen.x, mouseY - sScreen.y);
          const distToObserver = Math.hypot(mouseX - oScreen.x, mouseY - oScreen.y);

          if (distToSource <= 24 || distToObserver <= 24) {
            c.style.cursor = 'grab';
          } else if (this.activeTool === 'measure') {
            c.style.cursor = 'crosshair';
          } else {
            c.style.cursor = 'default';
          }
          return;
        }

        if (this.dragTarget === 'pan') {
          const dxPixels = mouseX - this.dragStart.x;
          const dyPixels = mouseY - this.dragStart.y;
          this.panX = this.dragStart.panX - (dxPixels / this.scale);
          this.panY = this.dragStart.panY + (dyPixels / this.scale);
        } else if (this.dragTarget === 'source') {
          c.style.cursor = 'grabbing';
          // Actualizar posición de la fuente en tiempo cero o reposicionar
          const newX = this.engine.is2D ? worldPos.x : worldPos.x;
          const newY = this.engine.is2D ? worldPos.y : 0;
          this.engine.source.x0 = Math.round(newX);
          this.engine.source.y0 = Math.round(newY);
          this.engine.rebuildHistoryUpTo(this.engine.currentTime);
          if (this.onPositionChanged) this.onPositionChanged('source', this.engine.source.x0, this.engine.source.y0);
        } else if (this.dragTarget === 'observer') {
          c.style.cursor = 'grabbing';
          const newX = this.engine.is2D ? worldPos.x : worldPos.x;
          const newY = this.engine.is2D ? worldPos.y : 0;
          this.engine.observer.x0 = Math.round(newX);
          this.engine.observer.y0 = Math.round(newY);
          this.engine.rebuildHistoryUpTo(this.engine.currentTime);
          if (this.onPositionChanged) this.onPositionChanged('observer', this.engine.observer.x0, this.engine.observer.y0);
        } else if (this.dragTarget === 'measure') {
          if (this.measurePoints) {
            this.measurePoints.p2 = { ...worldPos };
          }
        }
      });

      window.addEventListener('mouseup', () => {
        this.isDragging = false;
        this.dragTarget = null;
        c.style.cursor = 'default';
      });

      // Soporte táctil básico (touch)
      let initialTouchDist = 0;
      c.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
          const t = e.touches[0];
          const rect = c.getBoundingClientRect();
          const mouseX = t.clientX - rect.left;
          const mouseY = t.clientY - rect.top;
          const worldPos = this.screenToWorld(mouseX, mouseY);
          this.dragStart = { x: mouseX, y: mouseY, world: worldPos, panX: this.panX, panY: this.panY };
          this.isDragging = true;
          this.dragTarget = 'pan';
        } else if (e.touches.length === 2) {
          this.isDragging = false;
          initialTouchDist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );
        }
      }, { passive: true });

      c.addEventListener('touchmove', (e) => {
        if (e.touches.length === 1 && this.isDragging) {
          const t = e.touches[0];
          const rect = c.getBoundingClientRect();
          const mouseX = t.clientX - rect.left;
          const mouseY = t.clientY - rect.top;
          const dxPixels = mouseX - this.dragStart.x;
          const dyPixels = mouseY - this.dragStart.y;
          this.panX = this.dragStart.panX - (dxPixels / this.scale);
          this.panY = this.dragStart.panY + (dyPixels / this.scale);
        } else if (e.touches.length === 2 && initialTouchDist > 0) {
          const currentDist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );
          const factor = currentDist / initialTouchDist;
          this.scale = Math.max(0.1, Math.min(20.0, this.scale * factor));
          initialTouchDist = currentDist;
        }
      }, { passive: true });

      c.addEventListener('touchend', () => {
        this.isDragging = false;
        initialTouchDist = 0;
      });
    }

    detectWaveSelection(worldPos) {
      let closestWave = null;
      let minDistance = Infinity;

      for (const w of this.engine.wavefronts) {
        if (this.engine.currentTime < w.te) continue;
        const distFromCenter = Math.hypot(worldPos.x - w.xc, worldPos.y - w.yc);
        const diff = Math.abs(distFromCenter - w.r);
        const pixelDiff = diff * this.scale;
        if (pixelDiff < 14 && pixelDiff < minDistance) {
          minDistance = pixelDiff;
          closestWave = w;
        }
      }

      this.selectedWaveId = closestWave ? closestWave.id : null;
      if (this.onWaveSelected) {
        this.onWaveSelected(closestWave);
      }
    }

    triggerObserverRipple() {
      this.observerPulseTime = performance.now();
    }

    /**
     * Bucle principal de dibujo del canvas
     */
    render() {
      const ctx = this.ctx;
      if (!ctx) return;

      // Seguimiento de cámara si está activo
      if (this.followSource) {
        this.panX = this.engine.source.x;
        this.panY = this.engine.source.y;
      }

      const isDark = this.theme === 'dark';
      const bgColor = isDark ? '#090d16' : '#f8fafc';
      const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';
      const subGridColor = isDark ? 'rgba(255, 255, 255, 0.025)' : 'rgba(0, 0, 0, 0.025)';
      const axisColor = isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.3)';
      const textColor = isDark ? '#94a3b8' : '#64748b';

      // 1. Limpiar lienzo
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, this.width, this.height);

      // 2. Dibujar cuadrícula cartesiana con escala métrica
      this.drawGrid(gridColor, subGridColor, axisColor, textColor);

      // 3. Dibujar cono / envolvente de Mach si M > 1
      if (this.showMachCone && this.engine.getMachNumber() > 1.0) {
        this.drawMachCone();
      }

      // 4. Dibujar frentes de onda emitidos
      this.drawWavefronts();

      // 5. Dibujar segmentos de longitud de onda (calipers)
      if (this.showWavelengthCalipers && !this.engine.is2D) {
        this.drawWavelengthCalipers();
      }

      // 6. Dibujar observador y fuente
      this.drawSource();
      this.drawObserver();

      // 7. Dibujar medición activa si existe
      if (this.measurePoints && this.measurePoints.p1 && this.measurePoints.p2) {
        this.drawMeasureLine();
      }

      // 8. Dibujar escala métrica física (regla en esquina inferior)
      this.drawScaleBar(textColor, axisColor);
    }

    /**
     * Dibuja cuadrícula cartesiana con espaciado métrico adaptativo
     */
    drawGrid(gridColor, subGridColor, axisColor, textColor) {
      const ctx = this.ctx;

      // Calcular paso de cuadrícula en potencias de 10 o 50 metros según el zoom
      const minPixelSpacing = 50;
      const rawStep = minPixelSpacing / this.scale;
      const exponent = Math.floor(Math.log10(rawStep));
      const fraction = rawStep / Math.pow(10, exponent);

      let step = Math.pow(10, exponent);
      if (fraction > 5) step *= 10;
      else if (fraction > 2) step *= 5;
      else if (fraction > 1) step *= 2;

      // Límites físicos visibles
      const topLeft = this.screenToWorld(0, 0);
      const bottomRight = this.screenToWorld(this.width, this.height);

      const startX = Math.floor(topLeft.x / step) * step;
      const endX = Math.ceil(bottomRight.x / step) * step;
      const startY = Math.floor(bottomRight.y / step) * step;
      const endY = Math.ceil(topLeft.y / step) * step;

      ctx.lineWidth = 1;
      ctx.strokeStyle = gridColor;
      ctx.fillStyle = textColor;
      ctx.font = '10px "JetBrains Mono", monospace';

      // Líneas verticales
      for (let x = startX; x <= endX; x += step) {
        const s = this.worldToScreen(x, 0);
        ctx.beginPath();
        ctx.moveTo(s.x, 0);
        ctx.lineTo(s.x, this.height);
        ctx.stroke();

        // Etiquetas numéricas de posición sobre el eje x
        if (Math.abs(x) > 1e-4) {
          const originS = this.worldToScreen(0, 0);
          const yLabel = Math.max(16, Math.min(this.height - 8, originS.y + 14));
          ctx.fillText(`${x.toFixed(0)}m`, s.x + 3, yLabel);
        }
      }

      // Líneas horizontales
      for (let y = startY; y <= endY; y += step) {
        const s = this.worldToScreen(0, y);
        ctx.beginPath();
        ctx.moveTo(0, s.y);
        ctx.lineTo(this.width, s.y);
        ctx.stroke();

        if (Math.abs(y) > 1e-4) {
          const originS = this.worldToScreen(0, 0);
          const xLabel = Math.max(8, Math.min(this.width - 45, originS.x + 4));
          ctx.fillText(`${y.toFixed(0)}m`, xLabel, s.y - 3);
        }
      }

      // Ejes principales (x = 0, y = 0)
      const originScreen = this.worldToScreen(0, 0);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = axisColor;

      // Eje X
      ctx.beginPath();
      ctx.moveTo(0, originScreen.y);
      ctx.lineTo(this.width, originScreen.y);
      ctx.stroke();

      // Eje Y
      ctx.beginPath();
      ctx.moveTo(originScreen.x, 0);
      ctx.lineTo(originScreen.x, this.height);
      ctx.stroke();
    }

    /**
     * Dibuja los frentes de onda circulares con estilo y resaltado del seleccionado
     */
    drawWavefronts() {
      const ctx = this.ctx;
      const currentTime = this.engine.currentTime;
      const waves = this.engine.wavefronts;

      ctx.save();

      // Configurar estilo de línea
      if (this.waveStyle === 'dashed') {
        ctx.setLineDash([8, 6]);
      } else if (this.waveStyle === 'dotted') {
        ctx.setLineDash([3, 5]);
      } else {
        ctx.setLineDash([]);
      }

      for (let i = 0; i < waves.length; i++) {
        const w = waves[i];
        if (currentTime < w.te) continue;

        const centerScreen = this.worldToScreen(w.xc, w.yc);
        const radiusPixels = w.r * this.scale;

        if (radiusPixels <= 0) continue;

        const isSelected = this.selectedWaveId === w.id;

        // Atenuación visual opcional
        let alpha = 0.85;
        if (this.visualAttenuation) {
          alpha = Math.max(0.12, 1.0 - (radiusPixels / (this.width * 0.9)));
        }

        ctx.beginPath();
        ctx.arc(centerScreen.x, centerScreen.y, radiusPixels, 0, Math.PI * 2);

        if (isSelected) {
          ctx.strokeStyle = '#f59e0b'; // Amarillo ambar seleccionado
          ctx.lineWidth = this.waveWidth + 2.0;
          ctx.stroke();

          // Marcador del centro de emisión original
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(centerScreen.x, centerScreen.y, 4, 0, Math.PI * 2);
          ctx.fill();

          // Etiqueta informativa del frente seleccionado
          ctx.font = '11px "JetBrains Mono", monospace';
          ctx.fillStyle = '#f59e0b';
          ctx.fillText(`Frente #${w.id} (te=${w.te.toFixed(2)}s, r=${w.r.toFixed(1)}m)`, centerScreen.x + 8, centerScreen.y - 8);
        } else {
          ctx.strokeStyle = this.waveColor;
          ctx.globalAlpha = alpha;
          ctx.lineWidth = this.waveWidth;
          ctx.stroke();
          ctx.globalAlpha = 1.0;
        }
      }

      ctx.restore();
    }

    /**
     * Dibuja la envolvente y el cono de Mach (shock wave)
     */
    drawMachCone() {
      const ctx = this.ctx;
      const M = this.engine.getMachNumber();
      const mu = this.engine.getMachAngle();
      if (mu === null) return;

      const sf = this.engine.getSourcePos(this.engine.currentTime);
      const sourceScreen = this.worldToScreen(sf.x, sf.y);

      // Dirección de la velocidad
      const vx = this.engine.source.vx;
      const vy = this.engine.source.vy;
      const vMag = Math.hypot(vx, vy);
      if (vMag < 1e-4) return;

      const forwardAngle = Math.atan2(vy, vx);
      // Las líneas de la cuña se abren hacia atrás en forwardAngle + PI ± (PI/2 - mu)
      const lineLen = Math.max(this.width, this.height) * 2;

      const angle1 = forwardAngle + Math.PI - (Math.PI / 2 - mu);
      const angle2 = forwardAngle + Math.PI + (Math.PI / 2 - mu);

      ctx.save();
      ctx.strokeStyle = '#ef4444'; // Rojo vibrante para onda de choque
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 4]);

      // Línea superior de Mach
      ctx.beginPath();
      ctx.moveTo(sourceScreen.x, sourceScreen.y);
      ctx.lineTo(sourceScreen.x + Math.cos(angle1) * lineLen, sourceScreen.y - Math.sin(angle1) * lineLen);
      ctx.stroke();

      // Línea inferior de Mach
      ctx.beginPath();
      ctx.moveTo(sourceScreen.x, sourceScreen.y);
      ctx.lineTo(sourceScreen.x + Math.cos(angle2) * lineLen, sourceScreen.y - Math.sin(angle2) * lineLen);
      ctx.stroke();

      // Relleno suave translúcido del interior del cono de Mach
      ctx.beginPath();
      ctx.moveTo(sourceScreen.x, sourceScreen.y);
      ctx.lineTo(sourceScreen.x + Math.cos(angle1) * lineLen, sourceScreen.y - Math.sin(angle1) * lineLen);
      ctx.lineTo(sourceScreen.x + Math.cos(angle2) * lineLen, sourceScreen.y - Math.sin(angle2) * lineLen);
      ctx.closePath();
      ctx.fillStyle = 'rgba(239, 68, 68, 0.07)';
      ctx.fill();

      // Etiqueta del cono
      const deg = (mu * 180 / Math.PI).toFixed(1);
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillText(`Envolvente de Mach: μ = ${deg}° (M = ${M.toFixed(2)})`, sourceScreen.x - 140, sourceScreen.y - 25);

      ctx.restore();
    }

    /**
     * Dibuja las cotas de longitud de onda espacial (calipers) por delante y por detrás
     */
    drawWavelengthCalipers() {
      const ctx = this.ctx;
      const waves = this.engine.wavefronts;
      const currTime = this.engine.currentTime;
      if (waves.length < 2) return;

      const wLengths = this.engine.getWavelengths();
      const sf = this.engine.getSourcePos(currTime);

      // Si la fuente viaja hacia +x, delante está a la derecha (+x)
      const sScreen = this.worldToScreen(sf.x, sf.y);
      const caliperY = sScreen.y - 50;

      ctx.save();
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.strokeStyle = '#10b981'; // Verde esmeralda didáctico
      ctx.fillStyle = '#10b981';
      ctx.lineWidth = 1.5;

      // Cota Delantera si hay frentes
      if (wLengths.lambdaAhead > 5) {
        const x1Screen = sScreen.x + 10;
        const x2Screen = x1Screen + (wLengths.lambdaAhead * this.scale);

        if (x2Screen < this.width - 20) {
          ctx.beginPath();
          ctx.moveTo(x1Screen, caliperY);
          ctx.lineTo(x2Screen, caliperY);
          // Ticks extremos
          ctx.moveTo(x1Screen, caliperY - 5);
          ctx.lineTo(x1Screen, caliperY + 5);
          ctx.moveTo(x2Screen, caliperY - 5);
          ctx.lineTo(x2Screen, caliperY + 5);
          ctx.stroke();

          ctx.fillText(`λ delante = ${wLengths.lambdaAhead.toFixed(1)} m`, x1Screen + 4, caliperY - 8);
        }
      }

      // Cota Trasera
      if (wLengths.lambdaBehind > 5) {
        const x2Screen = sScreen.x - 10;
        const x1Screen = x2Screen - (wLengths.lambdaBehind * this.scale);

        if (x1Screen > 20) {
          ctx.beginPath();
          ctx.moveTo(x1Screen, caliperY);
          ctx.lineTo(x2Screen, caliperY);
          // Ticks
          ctx.moveTo(x1Screen, caliperY - 5);
          ctx.lineTo(x1Screen, caliperY + 5);
          ctx.moveTo(x2Screen, caliperY - 5);
          ctx.lineTo(x2Screen, caliperY + 5);
          ctx.stroke();

          ctx.fillText(`λ detrás = ${wLengths.lambdaBehind.toFixed(1)} m`, x1Screen + 4, caliperY - 8);
        }
      }

      ctx.restore();
    }

    /**
     * Dibuja la fuente emisora con el avatar seleccionado y su vector de velocidad
     */
    drawSource() {
      const ctx = this.ctx;
      const sf = this.engine.getSourcePos(this.engine.currentTime);
      const s = this.worldToScreen(sf.x, sf.y);

      ctx.save();

      // Vector de velocidad
      if (this.showVectors) {
        const vx = this.engine.source.vx;
        const vy = this.engine.source.vy;
        const vMag = Math.hypot(vx, vy);
        if (vMag > 0.1) {
          const vectorScale = 0.5 * this.scale; // Representación proporcional de velocidad
          const vxScreen = vx * vectorScale;
          const vyScreen = -vy * vectorScale;
          this.drawArrow(s.x, s.y, s.x + vxScreen, s.y + vyScreen, '#f59e0b', `vf = ${vMag.toFixed(1)} m/s`);
        }
      }

      // Dibujar avatar
      if (this.sourceAvatar === 'jet') {
        this.drawJetAvatar(s.x, s.y);
      } else if (this.sourceAvatar === 'car') {
        this.drawCarAvatar(s.x, s.y);
      } else {
        // Punto emisor
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(s.x, s.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Etiqueta principal de posición
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Fuente S (${sf.x.toFixed(0)}m)`, s.x, s.y + 28);

      // Distintivo flotante de movimiento relativo
      const so = this.engine.getObserverPos(this.engine.currentTime);
      const vx = this.engine.source.vx;
      let motionText = '🛑 EN REPOSO';
      let motionColor = '#94a3b8';
      let motionBg = 'rgba(30, 41, 59, 0.85)';

      if (Math.abs(vx) > 0.5) {
        const isApproaching = (sf.x < so.x && vx > 0) || (sf.x > so.x && vx < 0);
        if (isApproaching) {
          motionText = vx > 0 ? '🚗 ACERCÁNDOSE ➔' : '⬅ 🚗 ACERCÁNDOSE';
          motionColor = '#10b981';
          motionBg = 'rgba(6, 78, 59, 0.85)';
        } else {
          motionText = vx < 0 ? '⬅ 🚗 ALEJÁNDOSE' : '🚗 ALEJÁNDOSE ➔';
          motionColor = '#ef4444';
          motionBg = 'rgba(127, 29, 29, 0.85)';
        }
      }

      ctx.save();
      ctx.font = 'bold 10px JetBrains Mono, monospace';
      const textWidth = ctx.measureText(motionText).width;
      const tagW = textWidth + 14;
      const tagH = 18;
      const tagX = s.x - tagW / 2;
      const tagY = s.y - 32;

      ctx.fillStyle = motionBg;
      ctx.strokeStyle = motionColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(tagX, tagY, tagW, tagH, 4) : ctx.rect(tagX, tagY, tagW, tagH);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = motionColor;
      ctx.textBaseline = 'middle';
      ctx.fillText(motionText, s.x, tagY + tagH / 2);
      ctx.restore();

      ctx.restore();
    }

    drawJetAvatar(x, y) {
      const ctx = this.ctx;
      const vx = this.engine.source.vx;
      const vy = this.engine.source.vy;
      const angle = (Math.hypot(vx, vy) > 0.1) ? Math.atan2(-vy, vx) : 0;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Silueta estilizada de jet supersónico
      ctx.fillStyle = '#38bdf8';
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.moveTo(18, 0); // Punta
      ctx.lineTo(2, 6);
      ctx.lineTo(-12, 16); // Ala derecha
      ctx.lineTo(-8, 5);
      ctx.lineTo(-18, 5);
      ctx.lineTo(-14, 0); // Cola
      ctx.lineTo(-18, -5);
      ctx.lineTo(-8, -5);
      ctx.lineTo(-12, -16); // Ala izquierda
      ctx.lineTo(2, -6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Cabina
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(4, 0, 5, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    drawCarAvatar(x, y) {
      const ctx = this.ctx;
      const vx = this.engine.source.vx;
      const facingRight = vx >= 0;

      ctx.save();
      ctx.translate(x, y);
      if (!facingRight) ctx.scale(-1, 1);

      // Chasis
      ctx.fillStyle = '#f59e0b';
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.roundRect(-16, -10, 32, 14, [4, 8, 2, 2]);
      ctx.fill();
      ctx.stroke();

      // Ventanilla
      ctx.fillStyle = '#e0f2fe';
      ctx.beginPath();
      ctx.roundRect(-6, -8, 14, 7, [2, 4, 1, 1]);
      ctx.fill();

      // Ruedas
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(-10, 6, 4, 0, Math.PI * 2);
      ctx.arc(10, 6, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    /**
     * Dibuja el observador acústico (micrófono / oreja) con retículo de recepción exacto
     */
    drawObserver() {
      const ctx = this.ctx;
      const so = this.engine.getObserverPos(this.engine.currentTime);
      const s = this.worldToScreen(so.x, so.y);

      ctx.save();

      // Vector de velocidad del observador
      if (this.showVectors) {
        const vx = this.engine.observer.vx;
        const vy = this.engine.observer.vy;
        const vMag = Math.hypot(vx, vy);
        if (vMag > 0.1) {
          const vectorScale = 0.5 * this.scale;
          const vxScreen = vx * vectorScale;
          const vyScreen = -vy * vectorScale;
          this.drawArrow(s.x, s.y, s.x + vxScreen, s.y + vyScreen, '#a855f7', `vo = ${vMag.toFixed(1)} m/s`);
        }
      }

      // Animación de pulso al recibir un frente
      const now = performance.now();
      const pulseElapsed = (now - this.observerPulseTime) / 1000;
      if (pulseElapsed < 0.4) {
        const pulseRadius = 14 + (pulseElapsed * 35);
        const pulseAlpha = Math.max(0, 1.0 - (pulseElapsed / 0.4));
        ctx.strokeStyle = `rgba(168, 85, 247, ${pulseAlpha})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(s.x, s.y, pulseRadius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Icono de receptor / micrófono
      ctx.fillStyle = '#a855f7'; // Púrpura vibrante
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;

      // Base del receptor
      ctx.beginPath();
      ctx.arc(s.x, s.y, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Retículo central de detección milimétrica
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(s.x - 13, s.y);
      ctx.lineTo(s.x + 13, s.y);
      ctx.moveTo(s.x, s.y - 13);
      ctx.lineTo(s.x, s.y + 13);
      ctx.stroke();

      // Etiqueta principal de posición
      ctx.fillStyle = '#a855f7';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Observador O (${so.x.toFixed(0)}m)`, s.x, s.y + 28);

      // Distintivo flotante de movimiento relativo del observador
      const sf = this.engine.getSourcePos(this.engine.currentTime);
      const vo = this.engine.observer.vx;
      let motionText = '🛑 EN REPOSO';
      let motionColor = '#94a3b8';
      let motionBg = 'rgba(30, 41, 59, 0.85)';

      if (Math.abs(vo) > 0.5) {
        const isApproaching = (so.x > sf.x && vo < 0) || (so.x < sf.x && vo > 0);
        if (isApproaching) {
          motionText = vo < 0 ? '⬅ 🚶 ACERCÁNDOSE' : '🚶 ACERCÁNDOSE ➔';
          motionColor = '#10b981';
          motionBg = 'rgba(6, 78, 59, 0.85)';
        } else {
          motionText = vo > 0 ? '🚶 ALEJÁNDOSE ➔' : '⬅ 🚶 ALEJÁNDOSE';
          motionColor = '#ef4444';
          motionBg = 'rgba(127, 29, 29, 0.85)';
        }
      }

      ctx.save();
      ctx.font = 'bold 10px JetBrains Mono, monospace';
      const textWidth = ctx.measureText(motionText).width;
      const tagW = textWidth + 14;
      const tagH = 18;
      const tagX = s.x - tagW / 2;
      const tagY = s.y - 32;

      ctx.fillStyle = motionBg;
      ctx.strokeStyle = motionColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(tagX, tagY, tagW, tagH, 4) : ctx.rect(tagX, tagY, tagW, tagH);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = motionColor;
      ctx.textBaseline = 'middle';
      ctx.fillText(motionText, s.x, tagY + tagH / 2);
      ctx.restore();

      ctx.restore();
    }

    /**
     * Dibuja una flecha vectorial con texto
     */
    drawArrow(fromX, fromY, toX, toY, color, label) {
      const ctx = this.ctx;
      const headLength = 10;
      const dx = toX - fromX;
      const dy = toY - fromY;
      const angle = Math.atan2(dy, dx);
      const len = Math.hypot(dx, dy);

      if (len < 6) return;

      ctx.save();
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      ctx.stroke();

      // Cabeza de flecha
      ctx.beginPath();
      ctx.moveTo(toX, toY);
      ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();

      // Etiqueta del vector
      if (label) {
        ctx.font = 'bold 10px "JetBrains Mono", monospace';
        ctx.fillText(label, toX + 6, toY - 4);
      }

      ctx.restore();
    }

    drawMeasureLine() {
      const ctx = this.ctx;
      const p1Screen = this.worldToScreen(this.measurePoints.p1.x, this.measurePoints.p1.y);
      const p2Screen = this.worldToScreen(this.measurePoints.p2.x, this.measurePoints.p2.y);
      const dist = Math.hypot(this.measurePoints.p2.x - this.measurePoints.p1.x, this.measurePoints.p2.y - this.measurePoints.p1.y);

      ctx.save();
      ctx.strokeStyle = '#ec4899'; // Rosa para la regla
      ctx.fillStyle = '#ec4899';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);

      ctx.beginPath();
      ctx.moveTo(p1Screen.x, p1Screen.y);
      ctx.lineTo(p2Screen.x, p2Screen.y);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(p1Screen.x, p1Screen.y, 4, 0, Math.PI * 2);
      ctx.arc(p2Screen.x, p2Screen.y, 4, 0, Math.PI * 2);
      ctx.fill();

      const midX = (p1Screen.x + p2Screen.x) / 2;
      const midY = (p1Screen.y + p2Screen.y) / 2;
      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      ctx.fillText(`d = ${dist.toFixed(1)} m`, midX + 8, midY - 8);

      ctx.restore();
    }

    /**
     * Dibuja la barra de escala física de referencia en la esquina inferior derecha
     */
    drawScaleBar(textColor, axisColor) {
      const ctx = this.ctx;
      // Definir una longitud conveniente en metros (50m, 100m, 200m)
      const targetPixels = 120;
      const metersRaw = targetPixels / this.scale;
      const exp = Math.floor(Math.log10(metersRaw));
      let barMeters = Math.pow(10, exp);
      if (metersRaw / barMeters >= 5) barMeters *= 5;
      else if (metersRaw / barMeters >= 2) barMeters *= 2;

      const barPixels = barMeters * this.scale;
      const xEnd = this.width - 25;
      const xStart = xEnd - barPixels;
      const y = this.height - 25;

      ctx.save();
      ctx.strokeStyle = axisColor;
      ctx.lineWidth = 3;
      ctx.fillStyle = textColor;
      ctx.font = 'bold 10px "JetBrains Mono", monospace';

      ctx.beginPath();
      ctx.moveTo(xStart, y);
      ctx.lineTo(xEnd, y);
      // Ticks extremos
      ctx.moveTo(xStart, y - 5);
      ctx.lineTo(xStart, y + 5);
      ctx.moveTo(xEnd, y - 5);
      ctx.lineTo(xEnd, y + 5);
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillText(`${barMeters} m`, (xStart + xEnd) / 2, y - 8);
      ctx.restore();
    }
  }

  return DopplerCanvasRenderer;
}));
