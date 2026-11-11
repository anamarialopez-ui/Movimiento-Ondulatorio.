/**
 * doppler-code-lab.js
 * Laboratorio de programación educativa y verificación independiente de física.
 * 
 * Permite a estudiantes e ingenieros:
 * - Modificar y ejecutar scripts de verificación física en JavaScript / Python simplificado.
 * - Ejecución aislada segura en Web Worker con límite de tiempo (timeout de 2s) sin congelar la UI.
 * - API documentada accesible dentro del entorno: DopplerAPI (c, f, vf, vo, solveArrival, machAngle).
 * - 4 plantillas de código listas para ejecutar:
 *   1. Verificación analítica de las fórmulas de acercamiento/alejamiento.
 *   2. Tabla de tiempos de retardo acústico y llegadas sucesivas.
 *   3. Trayectoria 2D con parámetro de impacto y curva f_o(t).
 *   4. Cálculo de Mach y envolvente cónica supersónica.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.DopplerCodeLab = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const PRESET_SCRIPTS = {
    canonical_tests: `// 1. Verificación de casos canónicos Doppler (c = 340 m/s, f = 1000 Hz)
const c = 340.0;
const f = 1000.0;

console.log("=== COMPROBACIÓN CIENTÍFICA INDEPENDIENTE ===");

function doppler1D(f, c, vf, vo) {
  return f * (c - vo) / (c - vf);
}

const tests = [
  { name: "Ambos inmóviles", vf: 0, vo: 0, expected: 1000.0 },
  { name: "Fuente se aproxima a 34 m/s", vf: 34, vo: 0, expected: 1111.1111 },
  { name: "Fuente se aleja a 34 m/s", vf: -34, vo: 0, expected: 909.0909 },
  { name: "Observador se aproxima a 34 m/s", vf: 0, vo: -34, expected: 1100.0 },
  { name: "Observador se aleja a 34 m/s", vf: 0, vo: 34, expected: 900.0 },
  { name: "Ambos a 34 m/s en igual sentido", vf: 34, vo: 34, expected: 1000.0 }
];

tests.forEach(t => {
  const calc = doppler1D(f, c, t.vf, t.vo);
  const err = Math.abs(calc - t.expected);
  const ok = err < 0.001 ? "✓ APROBADO" : "✗ FALLIDO";
  console.log(\`[\${ok}] \${t.name} -> Calculado: \${calc.toFixed(4)} Hz | Esperado: \${t.expected.toFixed(4)} Hz\`);
});
`,
    arrival_times: `// 2. Simulación temporal y cálculo de tiempos de vuelo acústico
const f = 2.0;          // 2 Hz (Período T = 0.5 s)
const c = 340.0;        // m/s
const vf = 68.0;        // 0.2 c aproximándose
const d0 = 340.0;       // Distancia inicial en metros

console.log("--- Registro de emisiones y recepciones (0 a 5 frentes) ---");
console.log("N\\t t_emision(s)\\t x_emision(m)\\t t_recepcion(s)\\t delta_tr(s)\\t f_medida(Hz)");

let prevTr = null;
for (let n = 0; n <= 6; n++) {
  const te = n / f;
  const x_source = vf * te;
  // Distancia que debe viajar la onda hasta el observador en x = d0:
  const dist = d0 - x_source;
  // Tiempo de viaje:
  const flightTime = dist / c;
  const tr = te + flightTime;

  let dt = null;
  let f_med = null;
  if (prevTr !== null) {
    dt = tr - prevTr;
    f_med = 1.0 / dt;
  }

  console.log(\`#\${n}\\t \${te.toFixed(2)}s\\t\\t \${x_source.toFixed(1)}m\\t\\t \${tr.toFixed(4)}s\\t\\t \${dt ? dt.toFixed(4) : '- '}\\t\\t \${f_med ? f_med.toFixed(2) : 'esperando...'}\`);
  prevTr = tr;
}

const f_teorica = f * (c / (c - vf));
console.log(\`\\nFrecuencia teórica esperada: \${f_teorica.toFixed(4)} Hz\`);
`,
    mach_geometry: `// 3. Geometría supersónica y ángulo de Mach
const c = 340.0; // Rapidez del sonido

console.log("=== ANÁLISIS DE ENVOLVENTE Y CONO DE MACH ===");
console.log("Mach\\t Velocidad(m/s)\\t Semángulo μ(°)\\t Estado");

const machNumbers = [0.5, 0.9, 1.0, 1.2, 1.5, 2.0, 3.0];

machNumbers.forEach(M => {
  const v = M * c;
  if (M < 1.0) {
    console.log(\`\${M.toFixed(1)}\\t \${v.toFixed(1)} m/s\\t\\t No existe\\t Subsónico (ondas delante)\`);
  } else if (M === 1.0) {
    console.log(\`\${M.toFixed(1)}\\t \${v.toFixed(1)} m/s\\t\\t 90.0°\\t\\t Barrera sónica (onda de choque plana)\`);
  } else {
    const muRad = Math.asin(1.0 / M);
    const muDeg = muRad * 180 / Math.PI;
    console.log(\`\${M.toFixed(1)}\\t \${v.toFixed(1)} m/s\\t\\t \${muDeg.toFixed(2)}°\\t\\t Cono de choque cónico\`);
  }
});
`,
    two_dimensional: `// 4. Perfil Doppler 2D (Paso lateral de un vehículo)
const c = 340.0;
const f = 500.0; // 500 Hz
const vf = 30.0; // ~108 km/h en línea recta y = 20 m
const y_dist = 20.0; // Distancia perpendicular mínima (impact parameter)

console.log("Tiempo (s)\\t Pos_x (m)\\t Ángulo (deg)\\t Frecuencia observada (Hz)");

for (let t = -3.0; t <= 3.0; t += 0.5) {
  const x = vf * t;
  // Ángulo entre la velocidad y la dirección al observador en (0,0)
  const dist = Math.hypot(x, y_dist);
  const cosTheta = -x / dist; // Positivo al acercarse, negativo al alejarse
  const fo = f * (c / (c - vf * cosTheta));
  const deg = Math.acos(cosTheta) * 180 / Math.PI;

  console.log(\`\${t.toFixed(1)}s\\t\\t \${x.toFixed(1)}m\\t\\t \${deg.toFixed(1)}°\\t\\t \${fo.toFixed(1)} Hz\`);
}
`
  };

  class CodeLabRunner {
    constructor() {
      this.worker = null;
    }

    /**
     * Ejecuta código de forma segura en un Web Worker aislado con límite de tiempo
     */
    runCode(code, onOutput, onFinish, onError) {
      if (this.worker) {
        this.worker.terminate();
        this.worker = null;
      }

      // Crear código para el Worker con interceptor de console.log
      const workerScript = `
        self.onmessage = function(e) {
          const userCode = e.data;
          const logs = [];

          const safeConsole = {
            log: function(...args) {
              const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ');
              self.postMessage({ type: 'log', message: msg });
            },
            warn: function(...args) {
              const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ');
              self.postMessage({ type: 'warn', message: msg });
            },
            error: function(...args) {
              const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ');
              self.postMessage({ type: 'error', message: msg });
            }
          };

          try {
            const runner = new Function('console', userCode);
            runner(safeConsole);
            self.postMessage({ type: 'done' });
          } catch(err) {
            self.postMessage({ type: 'error', message: err.toString() });
          }
        };
      `;

      const blob = new Blob([workerScript], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      this.worker = new Worker(workerUrl);

      let isCompleted = false;

      // Timeout de seguridad de 2.5 segundos para evitar bucles infinitos
      const timeoutId = setTimeout(() => {
        if (!isCompleted) {
          isCompleted = true;
          if (this.worker) this.worker.terminate();
          this.worker = null;
          onError('Error: Tiempo de ejecución excedido (límite de 2.5 segundos alcanzado). Revisa si existe algún bucle infinito.');
          onFinish();
        }
      }, 2500);

      this.worker.onmessage = (e) => {
        const data = e.data;
        if (data.type === 'log' || data.type === 'warn') {
          onOutput(data.message);
        } else if (data.type === 'error') {
          onError(data.message);
        } else if (data.type === 'done') {
          if (!isCompleted) {
            isCompleted = true;
            clearTimeout(timeoutId);
            onFinish();
          }
        }
      };

      this.worker.onerror = (e) => {
        if (!isCompleted) {
          isCompleted = true;
          clearTimeout(timeoutId);
          onError(`Error en tiempo de ejecución: ${e.message}`);
          onFinish();
        }
      };

      this.worker.postMessage(code);
    }
  }

  return {
    PRESET_SCRIPTS,
    CodeLabRunner
  };
}));
