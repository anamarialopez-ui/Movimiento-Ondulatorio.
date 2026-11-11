/**
 * doppler-graphs.js
 * Módulo de gráficas científicas sincronizadas para el laboratorio de Efecto Doppler.
 * 
 * Permite alternar entre los siguientes canales de análisis físico:
 * 1. Posición temporal: x_f(t) y x_o(t).
 * 2. Distancia de separación: d(t) = |x_o(t) - x_f(t)|.
 * 3. Frecuencias: Frecuencia emitida f_e, teórica f_o y medida f_medida.
 * 4. Diagrama espacio-temporal de eventos: Instante de emisión t_e vs llegada t_r.
 * 5. Intervalos entre llegadas consecutivas: Delta t_r.
 * 
 * Incluye cursor temporal animado, leyendas interactivas y exportación a CSV/PNG.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.DopplerGraphs = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  class DopplerGraphsView {
    constructor(canvas, engine, options = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.engine = engine;
      this.channel = options.channel || 'frequency'; // 'position' | 'distance' | 'frequency' | 'timeline' | 'intervals'
      this.theme = options.theme || 'dark';
      this.dpr = window.devicePixelRatio || 1;

      this.padding = { top: 30, right: 30, bottom: 40, left: 60 };
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
    }

    setChannel(ch) {
      this.channel = ch;
    }

    setTheme(th) {
      this.theme = th;
    }

    render() {
      const ctx = this.ctx;
      if (!ctx || this.width <= 0 || this.height <= 0) return;

      const isDark = this.theme === 'dark';
      const bgColor = isDark ? '#0f172a' : '#ffffff';
      const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
      const axisColor = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';
      const textColor = isDark ? '#94a3b8' : '#64748b';
      const cursorColor = '#ef4444';

      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, this.width, this.height);

      const plotW = this.width - this.padding.left - this.padding.right;
      const plotH = this.height - this.padding.top - this.padding.bottom;

      if (plotW <= 10 || plotH <= 10) return;

      const tMax = Math.max(1.0, this.engine.maxTime);
      const tCurrent = this.engine.currentTime;

      // Según el canal seleccionado, determinar rango Y y series de datos
      let yMin = 0;
      let yMax = 10;
      let yLabel = '';
      let title = '';

      if (this.channel === 'frequency') {
        title = 'Frecuencias: f_emitida, f_teórica y f_medida experimental';
        yLabel = 'Frecuencia (Hz)';
        const fNominal = this.engine.f;
        yMin = 0;
        yMax = Math.max(fNominal * 2.5, 5.0);

        // Ajustar a eventos medidos si existen
        for (const ev of this.engine.receptionEvents) {
          if (ev.f_measured && Number.isFinite(ev.f_measured)) {
            yMax = Math.max(yMax, ev.f_measured * 1.25);
          }
          if (ev.f_theoretical && Number.isFinite(ev.f_theoretical)) {
            yMax = Math.max(yMax, ev.f_theoretical * 1.25);
          }
        }
      } else if (this.channel === 'position') {
        title = 'Posiciones espaciales: x_f(t) de la fuente y x_o(t) del observador';
        yLabel = 'Posición x (m)';
        const sf0 = this.engine.source.x0;
        const sf1 = this.engine.getSourcePos(tMax).x;
        const so0 = this.engine.observer.x0;
        const so1 = this.engine.getObserverPos(tMax).x;
        yMin = Math.min(sf0, sf1, so0, so1) - 50;
        yMax = Math.max(sf0, sf1, so0, so1) + 50;
      } else if (this.channel === 'distance') {
        title = 'Distancia Euclidiana Fuente - Observador: d(t)';
        yLabel = 'Distancia (m)';
        yMin = 0;
        const d0 = Math.hypot(this.engine.observer.x0 - this.engine.source.x0, this.engine.observer.y0 - this.engine.source.y0);
        const sfMax = this.engine.getSourcePos(tMax);
        const soMax = this.engine.getObserverPos(tMax);
        const dMax = Math.hypot(soMax.x - sfMax.x, soMax.y - sfMax.y);
        yMax = Math.max(d0, dMax, 100) * 1.2;
      } else if (this.channel === 'timeline') {
        title = 'Diagrama de Llegadas: t_emisión vs t_recepción';
        yLabel = 'Tiempo (s)';
        yMin = 0;
        yMax = tMax;
      } else if (this.channel === 'intervals') {
        title = 'Intervalos entre Llegadas Sucesivas: Δt_r';
        yLabel = 'Intervalo Δt_r (s)';
        const period0 = 1.0 / this.engine.f;
        yMin = 0;
        yMax = period0 * 2.5;
        for (const ev of this.engine.receptionEvents) {
          if (ev.dt && Number.isFinite(ev.dt)) {
            yMax = Math.max(yMax, ev.dt * 1.3);
          }
        }
      }

      // Funciones de mapeo a coordenadas de pantalla dentro del área del gráfico
      const mapX = (t) => this.padding.left + (t / tMax) * plotW;
      const mapY = (val) => this.padding.top + plotH - ((val - yMin) / (yMax - yMin)) * plotH;

      // Dibujar cuadrícula y ticks de los ejes
      ctx.lineWidth = 1;
      ctx.strokeStyle = gridColor;
      ctx.fillStyle = textColor;
      ctx.font = '10px "JetBrains Mono", monospace';

      // Rejilla X (tiempo)
      const numXTicks = 5;
      for (let i = 0; i <= numXTicks; i++) {
        const tVal = (i / numXTicks) * tMax;
        const xPos = mapX(tVal);
        ctx.beginPath();
        ctx.moveTo(xPos, this.padding.top);
        ctx.lineTo(xPos, this.padding.top + plotH);
        ctx.stroke();

        ctx.fillText(`${tVal.toFixed(1)}s`, xPos - 12, this.padding.top + plotH + 18);
      }

      // Rejilla Y
      const numYTicks = 4;
      for (let j = 0; j <= numYTicks; j++) {
        const yVal = yMin + (j / numYTicks) * (yMax - yMin);
        const yPos = mapY(yVal);
        ctx.beginPath();
        ctx.moveTo(this.padding.left, yPos);
        ctx.lineTo(this.padding.left + plotW, yPos);
        ctx.stroke();

        ctx.textAlign = 'right';
        ctx.fillText(yVal.toFixed(1), this.padding.left - 8, yPos + 3);
        ctx.textAlign = 'left';
      }

      // Ejes
      ctx.strokeStyle = axisColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(this.padding.left, this.padding.top);
      ctx.lineTo(this.padding.left, this.padding.top + plotH);
      ctx.lineTo(this.padding.left + plotW, this.padding.top + plotH);
      ctx.stroke();

      // Título y etiqueta Y
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillStyle = isDark ? '#f1f5f9' : '#0f172a';
      ctx.fillText(title, this.padding.left, this.padding.top - 12);

      ctx.save();
      ctx.translate(14, this.padding.top + plotH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.font = '10px Inter, sans-serif';
      ctx.fillStyle = textColor;
      ctx.fillText(yLabel, 0, 0);
      ctx.restore();

      // -------------------------------------------------------------
      // Dibujar Curvas según el canal
      // -------------------------------------------------------------
      const steps = 120;
      const dtSample = tMax / steps;

      if (this.channel === 'frequency') {
        // Línea constante: f emitida nominal
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(mapX(0), mapY(this.engine.f));
        ctx.lineTo(mapX(tMax), mapY(this.engine.f));
        ctx.stroke();
        ctx.setLineDash([]);

        // Curva teórica continua f_o(t)
        ctx.strokeStyle = '#38bdf8'; // Celeste cian
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        let started = false;
        for (let i = 0; i <= steps; i++) {
          const t = i * dtSample;
          const sf = this.engine.getSourcePos(t);
          const so = this.engine.getObserverPos(t);
          const dx = so.x - sf.x;
          const dy = so.y - sf.y;
          const d = Math.hypot(dx, dy);
          const nx = d > 1e-4 ? dx / d : 1;
          const ny = d > 1e-4 ? dy / d : 0;
          const num = this.engine.c - (nx * this.engine.observer.vx + ny * this.engine.observer.vy);
          const den = this.engine.c - (nx * this.engine.source.vx + ny * this.engine.source.vy);
          if (Math.abs(den) > 1e-4) {
            const fo = this.engine.f * (num / den);
            if (Number.isFinite(fo) && fo >= yMin && fo <= yMax) {
              const xPos = mapX(t);
              const yPos = mapY(fo);
              if (!started) {
                ctx.moveTo(xPos, yPos);
                started = true;
              } else {
                ctx.lineTo(xPos, yPos);
              }
            }
          }
        }
        ctx.stroke();

        // Puntos medidos experimentales (f_medida) hasta tCurrent
        for (const ev of this.engine.receptionEvents) {
          if (ev.tr <= tCurrent && ev.f_measured && Number.isFinite(ev.f_measured)) {
            const px = mapX(ev.tr);
            const py = mapY(ev.f_measured);
            ctx.fillStyle = '#10b981'; // Verde experimental
            ctx.beginPath();
            ctx.arc(px, py, 4.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }

        // Leyenda
        this.drawLegend([
          { label: `f_emitida = ${this.engine.f} Hz`, color: '#64748b', dashed: true },
          { label: 'f_teórica (Doppler retardado)', color: '#38bdf8' },
          { label: 'f_medida (intervalos 1/Δt)', color: '#10b981', dot: true }
        ]);

      } else if (this.channel === 'position') {
        // x_f(t) - Fuente
        ctx.strokeStyle = '#f59e0b'; // Ámbar
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i <= steps; i++) {
          const t = i * dtSample;
          const xVal = this.engine.getSourcePos(t).x;
          const px = mapX(t);
          const py = mapY(xVal);
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();

        // x_o(t) - Observador
        ctx.strokeStyle = '#a855f7'; // Púrpura
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i <= steps; i++) {
          const t = i * dtSample;
          const xVal = this.engine.getObserverPos(t).x;
          const px = mapX(t);
          const py = mapY(xVal);
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();

        this.drawLegend([
          { label: 'Posición Fuente x_f(t)', color: '#f59e0b' },
          { label: 'Posición Observador x_o(t)', color: '#a855f7' }
        ]);

      } else if (this.channel === 'distance') {
        // d(t)
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i <= steps; i++) {
          const t = i * dtSample;
          const sf = this.engine.getSourcePos(t);
          const so = this.engine.getObserverPos(t);
          const d = Math.hypot(so.x - sf.x, so.y - sf.y);
          const px = mapX(t);
          const py = mapY(d);
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();

        this.drawLegend([
          { label: 'Separación d(t)', color: '#06b6d4' }
        ]);

      } else if (this.channel === 'timeline') {
        // t_e vs t_r
        ctx.strokeStyle = '#818cf8';
        ctx.lineWidth = 1.5;
        for (const ev of this.engine.receptionEvents) {
          if (ev.tr <= tCurrent) {
            const px1 = mapX(ev.te);
            const py1 = mapY(ev.te);
            const px2 = mapX(ev.tr);
            const py2 = mapY(ev.tr);

            ctx.beginPath();
            ctx.moveTo(px1, py1);
            ctx.lineTo(px2, py2);
            ctx.stroke();

            ctx.fillStyle = '#818cf8';
            ctx.beginPath();
            ctx.arc(px2, py2, 3.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        this.drawLegend([
          { label: 'Tiempo de vuelo acústico (te → tr)', color: '#818cf8' }
        ]);

      } else if (this.channel === 'intervals') {
        // Δt_r
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        for (const ev of this.engine.receptionEvents) {
          if (ev.tr <= tCurrent && ev.dt) {
            const px = mapX(ev.tr);
            const py = mapY(ev.dt);
            ctx.fillStyle = '#10b981';
            ctx.beginPath();
            ctx.arc(px, py, 4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        this.drawLegend([
          { label: 'Intervalo Δtr entre recepciones', color: '#10b981', dot: true }
        ]);
      }

      // Cursor vertical de tiempo actual
      if (tCurrent >= 0 && tCurrent <= tMax) {
        const cursorX = mapX(tCurrent);
        ctx.save();
        ctx.strokeStyle = cursorColor;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(cursorX, this.padding.top);
        ctx.lineTo(cursorX, this.padding.top + plotH);
        ctx.stroke();

        ctx.fillStyle = cursorColor;
        ctx.font = 'bold 10px "JetBrains Mono", monospace';
        ctx.fillText(`t = ${tCurrent.toFixed(2)}s`, cursorX + 4, this.padding.top + 14);
        ctx.restore();
      }
    }

    drawLegend(items) {
      const ctx = this.ctx;
      const startX = this.padding.left + 15;
      let curX = startX;
      const y = this.height - 10;

      ctx.save();
      ctx.font = '10px Inter, sans-serif';

      for (const it of items) {
        ctx.strokeStyle = it.color;
        ctx.fillStyle = it.color;
        ctx.lineWidth = 2;

        if (it.dot) {
          ctx.beginPath();
          ctx.arc(curX + 6, y - 3, 3.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (it.dashed) {
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(curX, y - 3);
          ctx.lineTo(curX + 14, y - 3);
          ctx.stroke();
          ctx.setLineDash([]);
        } else {
          ctx.beginPath();
          ctx.moveTo(curX, y - 3);
          ctx.lineTo(curX + 14, y - 3);
          ctx.stroke();
        }

        ctx.fillStyle = this.theme === 'dark' ? '#cbd5e1' : '#334155';
        ctx.fillText(it.label, curX + 18, y);
        curX += ctx.measureText(it.label).width + 30;
      }

      ctx.restore();
    }

    /**
     * Exporta los datos experimentales simulados en formato CSV para análisis en Excel/Python
     */
    exportCSV() {
      const rows = [
        ['ID_Frente', 't_emision_s', 't_recepcion_s', 'dt_llegada_s', 'f_teorica_Hz', 'f_medida_Hz', 'x_fuente_m', 'x_observador_m']
      ];

      for (const ev of this.engine.receptionEvents) {
        const sf = this.engine.getSourcePos(ev.te);
        const so = this.engine.getObserverPos(ev.tr);
        rows.push([
          ev.waveId,
          ev.te.toFixed(4),
          ev.tr.toFixed(4),
          ev.dt ? ev.dt.toFixed(4) : '',
          ev.f_theoretical ? ev.f_theoretical.toFixed(4) : '',
          ev.f_measured ? ev.f_measured.toFixed(4) : '',
          sf.x.toFixed(2),
          so.x.toFixed(2)
        ]);
      }

      const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `efecto_doppler_datos_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  return DopplerGraphsView;
}));
