/**
 * standing-waves-canvas.js
 * Renderizador Canvas 2D de alta definición (Hi-DPI) para Ondas Estacionarias.
 * Gráficos de nivel profesional con brillos de neón, extremos fijos mecánicos,
 * descomposición en ondas viajeras, nodos/vientres y sonda interactiva.
 */

// Polyfill seguro para roundRect en navegadores antiguos
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r = 4) {
    if (typeof r === 'number') r = [r, r, r, r];
    const [tl, tr, br, bl] = r;
    this.moveTo(x + tl, y);
    this.lineTo(x + w - tr, y);
    this.quadraticCurveTo(x + w, y, x + w, y + tr);
    this.lineTo(x + w, y + h - br);
    this.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
    this.lineTo(x + bl, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - bl);
    this.lineTo(x, y + tl);
    this.quadraticCurveTo(x, y, x + tl, y);
    return this;
  };
}

class StandingWaveCanvas {
  constructor(canvasElement, physics) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.physics = physics;

    // Opciones visuales y de renderizado
    this.showStandingWave = true;
    this.showEnvelope = true;
    this.showTravelingWaves = false;
    this.showNodesAntinodes = true;
    this.showParticles = false;
    this.showVectors = false;
    this.showStrobeTrails = false;
    this.strobeHistory = []; // Almacén de trazas de estroboscopio

    // Tema y colores de diseño
    this.isDark = true;
    this.themeColors = this.getThemeColors(true);

    // Margen para el área física dentro del Canvas (en píxeles)
    this.margin = { top: 45, right: 55, bottom: 50, left: 65 };

    // Sonda puntual interactiva
    this.hoverPoint = null;
    this.isDraggingProbe = false;

    // Escuchadores de eventos
    this.setupInteractions();
  }

  getThemeColors(isDark) {
    if (isDark) {
      return {
        bg: '#0a0f1d',
        gridMajor: 'rgba(255, 255, 255, 0.12)',
        gridMinor: 'rgba(255, 255, 255, 0.04)',
        axis: 'rgba(255, 255, 255, 0.55)',
        text: '#f1f5f9',
        textMuted: '#94a3b8',
        standingWave: '#00f2fe',
        standingWaveGlow: 'rgba(0, 242, 254, 0.5)',
        standingWaveGradientEnd: '#4facfe',
        envelope: 'rgba(255, 215, 0, 0.75)',
        envelopeFill: 'rgba(0, 242, 254, 0.06)',
        waveRight: '#38bdf8', // Onda hacia la derecha (+x)
        waveLeft: '#f43f5e',  // Onda hacia la izquierda (-x)
        nodeColor: '#ef4444', // Rojo rubí para nodos
        antinodeColor: '#10b981', // Verde esmeralda para vientres
        clampMetal: '#475569',
        clampBorder: '#94a3b8',
        probeLine: '#f59e0b',
        particleColor: '#ffffff',
        particleGlow: 'rgba(255, 255, 255, 0.8)',
        vectorVelocity: '#22c55e',
        vectorAccel: '#ec4899'
      };
    } else {
      return {
        bg: '#ffffff',
        gridMajor: 'rgba(0, 0, 0, 0.12)',
        gridMinor: 'rgba(0, 0, 0, 0.04)',
        axis: 'rgba(0, 0, 0, 0.65)',
        text: '#0f172a',
        textMuted: '#64748b',
        standingWave: '#0284c7',
        standingWaveGlow: 'rgba(2, 132, 199, 0.35)',
        standingWaveGradientEnd: '#2563eb',
        envelope: 'rgba(217, 119, 6, 0.85)',
        envelopeFill: 'rgba(2, 132, 199, 0.06)',
        waveRight: '#0284c7',
        waveLeft: '#e11d48',
        nodeColor: '#dc2626',
        antinodeColor: '#059669',
        clampMetal: '#94a3b8',
        clampBorder: '#475569',
        probeLine: '#d97706',
        particleColor: '#1e293b',
        particleGlow: 'rgba(0, 0, 0, 0.25)',
        vectorVelocity: '#16a34a',
        vectorAccel: '#db2777'
      };
    }
  }

  setTheme(isDark) {
    this.isDark = isDark;
    this.themeColors = this.getThemeColors(isDark);
  }

  setupInteractions() {
    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
      const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
      return {
        px: (clientX - rect.left) * (this.canvas.width / rect.width),
        py: (clientY - rect.top) * (this.canvas.height / rect.height),
        cssX: clientX - rect.left,
        cssY: clientY - rect.top
      };
    };

    const handlePointerDown = (e) => {
      const pos = getPos(e);
      const physX = this.screenToPhysX(pos.px);
      if (physX >= 0 && physX <= this.physics.length) {
        this.physics.probeX = Math.max(0, Math.min(this.physics.length, physX));
        this.isDraggingProbe = true;
      }
    };

    const handlePointerMove = (e) => {
      const pos = getPos(e);
      const physX = this.screenToPhysX(pos.px);
      if (physX >= 0 && physX <= this.physics.length) {
        this.hoverPoint = {
          x: physX,
          y: this.physics.evaluateStandingWave(physX),
          px: pos.px,
          py: pos.py
        };
        if (this.isDraggingProbe) {
          this.physics.probeX = physX;
        }
      } else {
        this.hoverPoint = null;
      }
    };

    const handlePointerUp = () => {
      this.isDraggingProbe = false;
    };

    this.canvas.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);

    this.canvas.addEventListener('touchstart', handlePointerDown, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });
    window.addEventListener('touchend', handlePointerUp);
    this.canvas.addEventListener('mouseleave', () => {
      if (!this.isDraggingProbe) this.hoverPoint = null;
    });
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    let w = Math.round((rect.width || this.canvas.clientWidth || 800) * dpr);
    let h = Math.round((rect.height || this.canvas.clientHeight || 420) * dpr);

    if (w <= 0) w = 800;
    if (h <= 0) h = 420;

    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
  }

  // --- CONVERSIÓN DE COORDENADAS ---
  physToScreenX(x) {
    const plotWidth = Math.max(20, this.canvas.width - (this.margin.left + this.margin.right));
    return this.margin.left + (Math.max(0, Math.min(this.physics.length, x)) / this.physics.length) * plotWidth;
  }

  physToScreenY(y) {
    const plotHeight = Math.max(20, this.canvas.height - (this.margin.top + this.margin.bottom));
    const centerY = this.margin.top + plotHeight / 2;
    // Rango vertical proporcional a la amplitud máxima
    const maxA = Math.max(0.05, this.physics.maxAmplitude * 1.35);
    return centerY - (y / maxA) * (plotHeight / 2);
  }

  screenToPhysX(px) {
    const plotWidth = this.canvas.width - (this.margin.left + this.margin.right);
    return ((px - this.margin.left) / plotWidth) * this.physics.length;
  }

  screenToPhysY(py) {
    const plotHeight = this.canvas.height - (this.margin.top + this.margin.bottom);
    const centerY = this.margin.top + plotHeight / 2;
    const maxA = Math.max(0.1, this.physics.maxAmplitude * 1.35);
    return -((py - centerY) / (plotHeight / 2)) * maxA;
  }

  // --- MÉTODO PRINCIPAL DE RENDERIZADO ---
  render() {
    this.resize();
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const c = this.themeColors;

    // 1. Limpieza de fondo
    ctx.fillStyle = c.bg;
    ctx.fillRect(0, 0, w, h);

    // 2. Cuadrícula y ejes graduados
    this.drawGridAndAxes();

    // 3. Efecto Estroboscópico (si está activo)
    if (this.showStrobeTrails) {
      this.drawStrobeTrails();
    }

    // 4. Envolvente de vibración (+2A*|sin(kx)| y -2A*|sin(kx)|)
    if (this.showEnvelope) {
      this.drawEnvelope();
    }

    // 5. Ondas viajeras componentes (y1 e y2)
    if (this.showTravelingWaves) {
      this.drawTravelingWaves();
    }

    // 6. Onda Estacionaria Principal
    if (this.showStandingWave) {
      this.drawStandingWave();
    }

    // 7. Partículas discretas (cuentas) y vectores
    if (this.showParticles) {
      this.drawParticlesAndVectors();
    }

    // 8. Marcadores de Nodos y Vientres
    if (this.showNodesAntinodes) {
      this.drawNodesAndAntinodes();
    }

    // 9. Soportes mecánicos de extremos fijos (Postes / Abrazaderas)
    this.drawFixedBoundaryClamps();

    // 10. Sonda de punto interactivo (x0)
    this.drawProbe();

    // 11. HUD / Tooltip interactivo si el cursor está dentro
    if (this.hoverPoint) {
      this.drawHoverHUD();
    }
  }

  // --- DIBUJO DE CUADRÍCULA Y EJES ---
  drawGridAndAxes() {
    const ctx = this.ctx;
    const c = this.themeColors;
    const L = this.physics.length;
    const maxA = Math.max(0.1, this.physics.maxAmplitude * 1.35);

    const x0 = this.physToScreenX(0);
    const xL = this.physToScreenX(L);
    const yCenter = this.physToScreenY(0);

    // Eje de equilibrio horizontal (y = 0)
    ctx.strokeStyle = c.axis;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x0 - 25, yCenter);
    ctx.lineTo(xL + 25, yCenter);
    ctx.stroke();

    // Graduación y cuadrícula en X
    const n = this.physics.harmonic;
    // Subdivisiones inteligentes basadas en L
    let stepX = 0.5;
    if (L <= 1) stepX = 0.1;
    else if (L <= 3) stepX = 0.5;
    else if (L <= 6) stepX = 1.0;
    else stepX = 2.0;

    ctx.font = '11px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (let x = 0; x <= L + 0.001; x += stepX) {
      const px = this.physToScreenX(x);

      // Línea de cuadrícula vertical
      ctx.strokeStyle = c.gridMinor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px, this.margin.top);
      ctx.lineTo(px, this.canvas.height - this.margin.bottom);
      ctx.stroke();

      // Tick sobre el eje
      ctx.strokeStyle = c.axis;
      ctx.beginPath();
      ctx.moveTo(px, yCenter - 5);
      ctx.lineTo(px, yCenter + 5);
      ctx.stroke();

      // Etiqueta de posición
      ctx.fillStyle = c.textMuted;
      ctx.fillText(x.toFixed(1) + ' m', px, yCenter + 8);
    }

    // Graduación vertical en Y (Amplitud)
    const stepY = maxA / 3;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    [-2, -1, 1, 2].forEach(k => {
      const valY = k * (this.physics.maxAmplitude / 2);
      if (Math.abs(valY) <= maxA) {
        const py = this.physToScreenY(valY);

        ctx.strokeStyle = c.gridMinor;
        ctx.beginPath();
        ctx.moveTo(x0 - 20, py);
        ctx.lineTo(xL + 20, py);
        ctx.stroke();

        ctx.strokeStyle = c.axis;
        ctx.beginPath();
        ctx.moveTo(x0 - 5, py);
        ctx.lineTo(x0 + 5, py);
        ctx.stroke();

        ctx.fillStyle = c.textMuted;
        ctx.fillText(valY.toFixed(2) + ' m', x0 - 10, py);
      }
    });

    // Etiquetas de los ejes
    ctx.fillStyle = c.text;
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Posición longitudinal x (m)', (x0 + xL) / 2, this.canvas.height - 15);

    ctx.save();
    ctx.translate(20, yCenter);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Elongación transversal y (m)', 0, 0);
    ctx.restore();
  }

  // --- DIBUJO DE SOPORTES FIJOS (ABRAZADERAS) ---
  drawFixedBoundaryClamps() {
    const ctx = this.ctx;
    const c = this.themeColors;
    const x0 = this.physToScreenX(0);
    const xL = this.physToScreenX(this.physics.length);
    const yCenter = this.physToScreenY(0);

    const drawClamp = (x, isLeft) => {
      const clampWidth = 18;
      const clampHeight = 80;
      const postX = isLeft ? x - clampWidth : x;

      ctx.save();
      // Sombra del soporte
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 8;

      // Poste principal metálico
      const grad = ctx.createLinearGradient(postX, yCenter - clampHeight / 2, postX + clampWidth, yCenter + clampHeight / 2);
      grad.addColorStop(0, c.clampBorder);
      grad.addColorStop(0.5, c.clampMetal);
      grad.addColorStop(1, '#1e293b');

      ctx.fillStyle = grad;
      ctx.strokeStyle = c.clampBorder;
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.roundRect(postX, yCenter - clampHeight / 2, clampWidth, clampHeight, 4);
      ctx.fill();
      ctx.stroke();

      // Tornillos / remaches mecánicos
      ctx.fillStyle = '#f8fafc';
      ctx.shadowBlur = 0;
      [-26, 0, 26].forEach(offsetY => {
        ctx.beginPath();
        ctx.arc(postX + clampWidth / 2, yCenter + offsetY, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Anillo de sujeción rígido en el punto de contacto
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.arc(x, yCenter, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Etiqueta "EXTREMO FIJO"
      ctx.font = 'bold 9px Inter, sans-serif';
      ctx.fillStyle = c.textMuted;
      ctx.textAlign = 'center';
      ctx.fillText(isLeft ? 'FIJO x=0' : 'FIJO x=L', postX + clampWidth / 2, yCenter + clampHeight / 2 + 14);

      ctx.restore();
    };

    drawClamp(x0, true);
    drawClamp(xL, false);
  }

  // --- DIBUJO DE LA ENVOLVENTE ---
  drawEnvelope() {
    const ctx = this.ctx;
    const c = this.themeColors;
    const L = this.physics.length;
    const samples = 240;

    // Área sombreada entre las envolventes
    ctx.save();
    ctx.fillStyle = c.envelopeFill;
    ctx.beginPath();
    for (let i = 0; i <= samples; i++) {
      const x = (i / samples) * L;
      const y = this.physics.evaluateEnvelope(x);
      const px = this.physToScreenX(x);
      const py = this.physToScreenY(y);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    for (let i = samples; i >= 0; i--) {
      const x = (i / samples) * L;
      const y = -this.physics.evaluateEnvelope(x);
      const px = this.physToScreenX(x);
      const py = this.physToScreenY(y);
      ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    // Líneas punteadas superior e inferior
    ctx.strokeStyle = c.envelope;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);

    // Superior
    ctx.beginPath();
    for (let i = 0; i <= samples; i++) {
      const x = (i / samples) * L;
      const y = this.physics.evaluateEnvelope(x);
      const px = this.physToScreenX(x);
      const py = this.physToScreenY(y);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Inferior
    ctx.beginPath();
    for (let i = 0; i <= samples; i++) {
      const x = (i / samples) * L;
      const y = -this.physics.evaluateEnvelope(x);
      const px = this.physToScreenX(x);
      const py = this.physToScreenY(y);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // --- ONDAS VIAJERAS COMPONENTES ---
  drawTravelingWaves() {
    const ctx = this.ctx;
    const c = this.themeColors;
    const L = this.physics.length;
    const samples = 220;

    // Onda hacia la derecha (+x): y1 = A * sin(kx - wt)
    ctx.save();
    ctx.strokeStyle = c.waveRight;
    ctx.lineWidth = 2.2;
    ctx.setLineDash([8, 4]);
    ctx.beginPath();
    for (let i = 0; i <= samples; i++) {
      const x = (i / samples) * L;
      const y = this.physics.evaluateWaveRight(x);
      const px = this.physToScreenX(x);
      const py = this.physToScreenY(y);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Flechas indicadoras de dirección (+x)
    const midX1 = L * 0.35;
    const midY1 = this.physics.evaluateWaveRight(midX1);
    this.drawArrow(this.physToScreenX(midX1), this.physToScreenY(midY1) - 14, 28, 0, c.waveRight, 'y₁ (→)');

    // Onda hacia la izquierda (-x): y2 = A * sin(kx + wt)
    ctx.strokeStyle = c.waveLeft;
    ctx.lineWidth = 2.2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    for (let i = 0; i <= samples; i++) {
      const x = (i / samples) * L;
      const y = this.physics.evaluateWaveLeft(x);
      const px = this.physToScreenX(x);
      const py = this.physToScreenY(y);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Flecha indicadora de dirección (-x)
    const midX2 = L * 0.65;
    const midY2 = this.physics.evaluateWaveLeft(midX2);
    this.drawArrow(this.physToScreenX(midX2), this.physToScreenY(midY2) + 14, 28, Math.PI, c.waveLeft, 'y₂ (←)');

    ctx.restore();
  }

  drawArrow(x, y, length, angle, color, label) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-length / 2, 0);
    ctx.lineTo(length / 2, 0);
    ctx.stroke();
    // Punta de flecha
    ctx.beginPath();
    ctx.moveTo(length / 2, 0);
    ctx.lineTo(length / 2 - 6, -4);
    ctx.lineTo(length / 2 - 6, 4);
    ctx.closePath();
    ctx.fill();

    if (label) {
      ctx.rotate(-angle);
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(label, 0, -6);
    }
    ctx.restore();
  }

  // --- TRAZAS ESTROBOSCÓPICAS ---
  drawStrobeTrails() {
    const ctx = this.ctx;
    const samples = 140;
    const L = this.physics.length;

    // Actualizar historial
    if (!this.strobeCounter) this.strobeCounter = 0;
    this.strobeCounter++;

    if (this.strobeCounter % 3 === 0) {
      const curve = [];
      for (let i = 0; i <= samples; i++) {
        const x = (i / samples) * L;
        curve.push({ x, y: this.physics.evaluateStandingWave(x) });
      }
      this.strobeHistory.push(curve);
      if (this.strobeHistory.length > 12) {
        this.strobeHistory.shift();
      }
    }

    ctx.save();
    this.strobeHistory.forEach((curve, index) => {
      const alpha = (index + 1) / (this.strobeHistory.length * 3.5);
      ctx.strokeStyle = `rgba(0, 242, 254, ${alpha})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      curve.forEach((pt, i) => {
        const px = this.physToScreenX(pt.x);
        const py = this.physToScreenY(pt.y);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
    });
    ctx.restore();
  }

  // --- DIBUJO DE LA ONDA ESTACIONARIA RESULTANTE ---
  drawStandingWave() {
    const ctx = this.ctx;
    const c = this.themeColors;
    const L = this.physics.length;
    const samples = 350;

    ctx.save();

    // Resplandor de Neón exterior (Glow)
    ctx.shadowColor = c.standingWaveGlow;
    ctx.shadowBlur = 14;
    ctx.strokeStyle = c.standingWave;
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    for (let i = 0; i <= samples; i++) {
      const x = (i / samples) * L;
      const y = this.physics.evaluateStandingWave(x);
      const px = this.physToScreenX(x);
      const py = this.physToScreenY(y);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Núcleo brillante interno blanco/cian para aspecto láser
    ctx.shadowBlur = 4;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    ctx.restore();
  }

  // --- NODOS Y ANTINODOS CON ETIQUETAS ---
  drawNodesAndAntinodes() {
    const ctx = this.ctx;
    const c = this.themeColors;
    const nodes = this.physics.getNodePositions();
    const antinodes = this.physics.getAntinodePositions();
    const yCenter = this.physToScreenY(0);

    // 1. Antinodos / Vientres (Puntos que oscilan con máxima amplitud)
    antinodes.forEach((x, idx) => {
      const y = this.physics.evaluateStandingWave(x);
      const px = this.physToScreenX(x);
      const py = this.physToScreenY(y);

      ctx.save();
      // Marcador de diamante oscilante
      ctx.shadowColor = c.antinodeColor;
      ctx.shadowBlur = 10;
      ctx.fillStyle = c.antinodeColor;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;

      const size = 6.5;
      ctx.beginPath();
      ctx.moveTo(px, py - size);
      ctx.lineTo(px + size, py);
      ctx.lineTo(px, py + size);
      ctx.lineTo(px - size, py);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Etiqueta flotante del Antinodo
      ctx.shadowBlur = 0;
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillStyle = c.antinodeColor;
      ctx.textAlign = 'center';
      const labelY = py < yCenter ? py - 14 : py + 22;
      ctx.fillText(`A${idx + 1}`, px, labelY);

      ctx.restore();
    });

    // 2. Nodos (Puntos inmóviles sobre el eje)
    nodes.forEach((x, idx) => {
      const px = this.physToScreenX(x);
      const py = yCenter;

      ctx.save();
      // Círculo concéntrico rojo brillante
      ctx.shadowColor = c.nodeColor;
      ctx.shadowBlur = 10;
      ctx.fillStyle = c.nodeColor;
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Centro negro
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(px, py, 2, 0, Math.PI * 2);
      ctx.fill();

      // Etiqueta N_idx
      ctx.shadowBlur = 0;
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillStyle = c.nodeColor;
      ctx.textAlign = 'center';
      ctx.fillText(`N${idx}`, px, py - 14);

      ctx.restore();
    });
  }

  // --- PARTÍCULAS DISCRETAS (CUENTAS EN LA CUERDA) ---
  drawParticlesAndVectors() {
    const ctx = this.ctx;
    const c = this.themeColors;
    const numParticles = 24 * this.physics.harmonic;
    const L = this.physics.length;

    for (let i = 1; i < numParticles; i++) {
      const x = (i / numParticles) * L;
      const y = this.physics.evaluateStandingWave(x);
      const vy = this.physics.evaluateVelocity(x);
      const px = this.physToScreenX(x);
      const py = this.physToScreenY(y);

      // Círculo de la partícula
      ctx.save();
      ctx.shadowColor = c.particleGlow;
      ctx.shadowBlur = 6;
      ctx.fillStyle = c.particleColor;
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fill();

      // Vectores de velocidad transversal (si están activos)
      if (this.showVectors && Math.abs(vy) > 0.01) {
        const scaleVy = 2.5; // Factor de escala para visualización
        const arrowLength = -vy * scaleVy;
        ctx.strokeStyle = c.vectorVelocity;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px, py + arrowLength);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // --- SONDA PUNTUAL INTERACTIVA (x0) ---
  drawProbe() {
    const ctx = this.ctx;
    const c = this.themeColors;
    const x0 = this.physics.probeX;
    const y0 = this.physics.evaluateStandingWave(x0);
    const px = this.physToScreenX(x0);
    const py = this.physToScreenY(y0);
    const yCenter = this.physToScreenY(0);

    ctx.save();
    // Línea vertical de la sonda
    ctx.strokeStyle = c.probeLine;
    ctx.lineWidth = 1.8;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(px, this.margin.top);
    ctx.lineTo(px, this.canvas.height - this.margin.bottom);
    ctx.stroke();
    ctx.setLineDash([]);

    // Anillo exterior en el punto de contacto
    ctx.shadowColor = c.probeLine;
    ctx.shadowBlur = 12;
    ctx.fillStyle = c.probeLine;
    ctx.beginPath();
    ctx.arc(px, py, 7.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Etiqueta superior del tirador de la sonda
    ctx.fillStyle = c.probeLine;
    ctx.beginPath();
    ctx.roundRect(px - 32, this.margin.top - 20, 64, 20, 4);
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 10px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`x₀=${x0.toFixed(2)}m`, px, this.margin.top - 10);

    ctx.restore();
  }

  // --- HUD / TOOLTIP INTERACTIVO EN HOVER ---
  drawHoverHUD() {
    const ctx = this.ctx;
    const c = this.themeColors;
    const pt = this.hoverPoint;
    const vy = this.physics.evaluateVelocity(pt.x);

    const px = this.physToScreenX(pt.x);
    const py = this.physToScreenY(pt.y);

    ctx.save();
    // Anillo en posición de hover
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.stroke();

    // Panel flotante HUD
    const boxW = 165;
    const boxH = 68;
    let boxX = px + 15;
    let boxY = py - boxH - 10;

    if (boxX + boxW > this.canvas.width - 15) boxX = px - boxW - 15;
    if (boxY < 15) boxY = py + 15;

    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 12;
    ctx.fillStyle = this.isDark ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.95)';
    ctx.strokeStyle = c.standingWave;
    ctx.lineWidth = 1.2;

    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 8);
    ctx.fill();
    ctx.stroke();

    // Textos de telemetría local
    ctx.shadowBlur = 0;
    ctx.font = 'bold 11px JetBrains Mono, monospace';
    ctx.fillStyle = c.text;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    ctx.fillText(`x  = ${pt.x.toFixed(3)} m`, boxX + 10, boxY + 10);
    ctx.fillText(`y  = ${pt.y.toFixed(3)} m`, boxX + 10, boxY + 28);

    ctx.fillStyle = Math.abs(vy) > 0.05 ? c.standingWave : c.textMuted;
    ctx.fillText(`vy = ${vy.toFixed(2)} m/s`, boxX + 10, boxY + 46);

    ctx.restore();
  }
}

if (typeof window !== 'undefined') {
  window.StandingWaveCanvas = StandingWaveCanvas;
}
