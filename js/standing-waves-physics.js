/**
 * standing-waves-physics.js
 * Motor físico riguroso para la simulación de Ondas Estacionarias con extremos fijos.
 * Física III - Movimiento Ondulatorio.
 */

class StandingWavePhysics {
  constructor(config = {}) {
    // Parámetros físicos fundamentales (Sistema Internacional)
    this.tension = config.tension !== undefined ? config.tension : 100;     // Tensión T [N]
    this.density = config.density !== undefined ? config.density : 0.01;   // Densidad lineal μ [kg/m]
    this.length = config.length !== undefined ? config.length : 2.0;       // Longitud L [m]
    this.amplitude = config.amplitude !== undefined ? config.amplitude : 0.4; // Amplitud A [m] (de cada onda viajera, máx estacionaria = 2A)
    this.harmonic = config.harmonic !== undefined ? config.harmonic : 1;    // Número de armónico n (1, 2, 3...)
    
    // Parámetros de simulación
    this.time = 0;              // Tiempo transcurrido [s]
    this.probeX = 1.0;          // Posición de la sonda puntual x0 [m]
  }

  // --- CÁLCULOS FÍSICOS ANALÍTICOS ---

  /** Velocidad de propagación en la cuerda: v = sqrt(T / mu) [m/s] */
  get waveSpeed() {
    return Math.sqrt(this.tension / Math.max(1e-6, this.density));
  }

  /** Longitud de onda del armónico n: lambda_n = 2L / n [m] */
  get wavelength() {
    return (2 * this.length) / Math.max(1, this.harmonic);
  }

  /** Número de onda: k = 2pi / lambda = n*pi / L [rad/m] */
  get waveNumber() {
    return (this.harmonic * Math.PI) / Math.max(1e-4, this.length);
  }

  /** Frecuencia del armónico n: f_n = (n / 2L) * v [Hz] */
  get frequency() {
    return (this.harmonic * this.waveSpeed) / (2 * Math.max(1e-4, this.length));
  }

  /** Frecuencia fundamental (n=1): f_1 = (1 / 2L) * v [Hz] */
  get fundamentalFrequency() {
    return this.waveSpeed / (2 * Math.max(1e-4, this.length));
  }

  /** Periodo de oscilación: T_period = 1 / f_n [s] */
  get period() {
    const f = this.frequency;
    return f > 0 ? 1 / f : 0;
  }

  /** Frecuencia angular: omega = 2 * pi * f_n [rad/s] */
  get omega() {
    return 2 * Math.PI * this.frequency;
  }

  /** Amplitud máxima de la onda estacionaria: 2*A [m] */
  get maxAmplitude() {
    return 2 * this.amplitude;
  }

  /** Distancia entre dos nodos adyacentes: lambda / 2 = L / n [m] */
  get nodeDistance() {
    return this.length / Math.max(1, this.harmonic);
  }

  /** Distancia entre un nodo y el antinodo adyacente: lambda / 4 = L / (2n) [m] */
  get nodeAntinodeDistance() {
    return this.length / (2 * Math.max(1, this.harmonic));
  }

  /** Número total de nodos (incluyendo extremos): n + 1 */
  get totalNodes() {
    return this.harmonic + 1;
  }

  /** Número total de antinodos / vientres: n */
  get totalAntinodes() {
    return this.harmonic;
  }

  /** Lista de coordenadas x de todos los nodos: x_m = m * (L / n) */
  getNodePositions() {
    const nodes = [];
    const step = this.length / this.harmonic;
    for (let m = 0; m <= this.harmonic; m++) {
      nodes.push(m * step);
    }
    return nodes;
  }

  /** Lista de coordenadas x de todos los antinodos: x_m = (m + 0.5) * (L / n) */
  getAntinodePositions() {
    const antinodes = [];
    const step = this.length / this.harmonic;
    for (let m = 0; m < this.harmonic; m++) {
      antinodes.push((m + 0.5) * step);
    }
    return antinodes;
  }

  // --- EVALUACIÓN DE ECUACIONES DE ONDA ---

  /**
   * Elongación total de la onda estacionaria:
   * y(x, t) = 2*A * sin(k*x) * cos(omega*t)
   */
  evaluateStandingWave(x, t = this.time) {
    if (x < 0 || x > this.length) return 0;
    const k = this.waveNumber;
    const w = this.omega;
    return 2 * this.amplitude * Math.sin(k * x) * Math.cos(w * t);
  }

  /**
   * Envolvente espacial (amplitud máxima local):
   * y_env(x) = 2*A * |sin(k*x)|
   */
  evaluateEnvelope(x) {
    if (x < 0 || x > this.length) return 0;
    const k = this.waveNumber;
    return 2 * this.amplitude * Math.abs(Math.sin(k * x));
  }

  /**
   * Onda viajera componente hacia la derecha (+x):
   * y1(x, t) = A * sin(k*x - omega*t)
   */
  evaluateWaveRight(x, t = this.time) {
    const k = this.waveNumber;
    const w = this.omega;
    return this.amplitude * Math.sin(k * x - w * t);
  }

  /**
   * Onda viajera componente hacia la izquierda (-x):
   * y2(x, t) = A * sin(k*x + omega*t)
   */
  evaluateWaveLeft(x, t = this.time) {
    const k = this.waveNumber;
    const w = this.omega;
    return this.amplitude * Math.sin(k * x + w * t);
  }

  /**
   * Velocidad transversal de un elemento de la cuerda:
   * v_y(x, t) = dy/dt = -2*A*omega * sin(k*x) * sin(omega*t)
   */
  evaluateVelocity(x, t = this.time) {
    if (x <= 0 || x >= this.length) return 0;
    const k = this.waveNumber;
    const w = this.omega;
    return -2 * this.amplitude * w * Math.sin(k * x) * Math.sin(w * t);
  }

  /**
   * Aceleración transversal de un elemento de la cuerda:
   * a_y(x, t) = d2y/dt2 = -omega^2 * y(x, t)
   */
  evaluateAcceleration(x, t = this.time) {
    if (x <= 0 || x >= this.length) return 0;
    const w = this.omega;
    const y = this.evaluateStandingWave(x, t);
    return -w * w * y;
  }

  // --- ANÁLISIS ENERGÉTICO INTEGRADO ---

  /**
   * Energía Cinética Total de la cuerda:
   * K(t) = 1/4 * mu * L * (2*A*omega)^2 * sin^2(omega*t)
   */
  get kineticEnergy() {
    const w = this.omega;
    const maxVy = 2 * this.amplitude * w;
    const sinFactor = Math.sin(w * this.time);
    return 0.25 * this.density * this.length * (maxVy * maxVy) * (sinFactor * sinFactor);
  }

  /**
   * Energía Potencial Elástica Total de la cuerda:
   * U(t) = 1/4 * mu * L * (2*A*omega)^2 * cos^2(omega*t)
   */
  get potentialEnergy() {
    const w = this.omega;
    const maxVy = 2 * this.amplitude * w;
    const cosFactor = Math.cos(w * this.time);
    return 0.25 * this.density * this.length * (maxVy * maxVy) * (cosFactor * cosFactor);
  }

  /**
   * Energía Mecánica Total:
   * E_total = K(t) + U(t) = 1/4 * mu * L * (2*A*omega)^2  (constante)
   */
  get totalEnergy() {
    const w = this.omega;
    const maxVy = 2 * this.amplitude * w;
    return 0.25 * this.density * this.length * (maxVy * maxVy);
  }

  // --- REORDENAMIENTO Y AVANCE TEMPORAL ---

  /** Avanza el tiempo un delta dt [s] */
  advanceTime(dt) {
    this.time += dt;
  }

  /** Reinicia el tiempo a cero */
  resetTime() {
    this.time = 0;
  }

  /** Salta exactamente al instante de máxima elongación en los vientres (cos(omega*t) = 1) */
  jumpToMaxDisplacement() {
    const w = this.omega;
    if (w <= 0) return;
    const T = this.period;
    // t tal que omega * t = 2 * pi * m => t = m * T
    const currentCycles = Math.round(this.time / T);
    this.time = currentCycles * T;
  }

  /** Salta exactamente al instante en que la cuerda está horizontal plana (cos(omega*t) = 0, y=0) */
  jumpToZeroDisplacement() {
    const w = this.omega;
    if (w <= 0) return;
    const T = this.period;
    // t tal que omega * t = pi/2 + m*pi => t = T/4 + m*(T/2)
    const quarterT = T / 4;
    const halfT = T / 2;
    const m = Math.round((this.time - quarterT) / halfT);
    this.time = Math.max(0, quarterT + m * halfT);
  }
}

// Exportar clase para navegador y Node.js
if (typeof window !== 'undefined') {
  window.StandingWavePhysics = StandingWavePhysics;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { StandingWavePhysics };
}
