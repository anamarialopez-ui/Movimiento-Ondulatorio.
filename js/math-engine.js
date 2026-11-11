/**
 * math-engine.js
 * Motor matemático para análisis, compilación, evaluación y muestreo adaptativo
 * de ondas y superposiciones en Física III.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.MathEngine = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Caché de funciones compiladas para máxima velocidad (60 FPS)
  const compileCache = new Map();

  // Lista blanca estricta de tokens permitidos para evaluación segura
  const ALLOWED_IDENTIFIERS = new Set([
    'x', 't', 'v', 'pi', 'PI', 'e', 'E',
    'sin', 'sen', 'cos', 'tan', 'tg', 'asin', 'acos', 'atan', 'atan2',
    'sinh', 'cosh', 'tanh', 'exp', 'log', 'ln', 'log10', 'sqrt', 'abs',
    'min', 'max', 'floor', 'ceil', 'round', 'sign', 'pow'
  ]);

  /**
   * Normaliza la expresión matemática ingresada por el usuario:
   * - Soporta notación en español ('sen', 'tg', '·', 'π')
   * - Agrega multiplicación implícita (ej. '2x' -> '2*x', '2(x-vt)' -> '2*(x-vt)')
   * - Convierte '^' en potencia
   */
  function normalizeExpression(expr) {
    if (!expr || typeof expr !== 'string') return '0';

    let s = expr.trim();
    if (!s) return '0';

    // Reemplazos de caracteres especiales comunes
    s = s.replace(/·/g, '*');
    s = s.replace(/×/g, '*');
    s = s.replace(/÷/g, '/');
    s = s.replace(/π/g, 'pi');
    s = s.replace(/\bsen\b/gi, 'sin');
    s = s.replace(/\btg\b/gi, 'tan');
    s = s.replace(/\bln\b/gi, 'log');

    // Multiplicación implícita: número seguido de letra o paréntesis: 2x -> 2*x, 3( -> 3*(
    s = s.replace(/(\d+(\.\d+)?)\s*([a-zA-Z(])/g, '$1*$3');

    // Multiplicación implícita: paréntesis de cierre seguido de paréntesis o letra/número: )( -> )*(, )x -> )*x
    s = s.replace(/\)\s*(\(|[a-zA-Z0-9])/g, ')*$1');

    // Multiplicación implícita: variable seguida de función o variable: x sin -> x*sin
    s = s.replace(/([a-zA-Z])\s+(\(|[a-zA-Z])/g, '$1*$2');

    return s;
  }

  /**
   * Convierte una expresión en sintaxis estándar a código LaTeX para KaTeX
   */
  function toLatex(rawExpr) {
    if (!rawExpr || !rawExpr.trim()) return '0';
    let s = rawExpr.trim();

    // Reemplazar sen/sin
    s = s.replace(/\bsen\b|\bsin\b/gi, '\\operatorname{sen}');
    s = s.replace(/\bcos\b/gi, '\\cos');
    s = s.replace(/\btan\b|\btg\b/gi, '\\tan');
    s = s.replace(/\bexp\b/gi, '\\exp');
    s = s.replace(/\bsqrt\b/gi, '\\sqrt');
    s = s.replace(/\babs\b\(([^)]+)\)/gi, '{\\left| $1 \\right|}');
    s = s.replace(/\bpi\b|π/gi, '\\pi');

    // Reemplazar multiplicación
    s = s.replace(/\*/g, ' \\cdot ');

    // Detectar patrones simples de fracción a / b
    // Si contiene patrones tipo (A) / (B)
    s = s.replace(/\(([^()]+)\)\s*\/\s*\(([^()]+)\)/g, '\\frac{$1}{$2}');
    s = s.replace(/(\d+(\.\d+)?|[a-zA-Z])\s*\/\s*\(([^()]+)\)/g, '\\frac{$1}{$3}');
    s = s.replace(/\(([^()]+)\)\s*\/\s*(\d+(\.\d+)?|[a-zA-Z])/g, '\\frac{$1}{$2}');

    // Potencias x^2 o x^(a+b)
    s = s.replace(/\^([0-9a-zA-Z]+)/g, '^{$1}');
    s = s.replace(/\^\(([^()]+)\)/g, '^{$1}');

    return s;
  }

  /**
   * Compila una expresión de forma segura y devuelve una función nativa f(x, t, v).
   * Si la expresión es inválida, lanza un Error descriptivo en español.
   */
  function compile(rawExpr) {
    const norm = normalizeExpression(rawExpr);
    if (compileCache.has(norm)) {
      return compileCache.get(norm);
    }

    // 1. Si Math.js está disponible, intentar compilar con Math.js para validación de sintaxis
    let mathJsCompiled = null;
    if (typeof window !== 'undefined' && window.math && typeof window.math.compile === 'function') {
      try {
        mathJsCompiled = window.math.compile(norm);
      } catch (err) {
        throw new Error('Sintaxis matemática no válida: ' + (err.message || 'Revise paréntesis u operadores'));
      }
    }

    // 2. Construir función nativa JS optimizada para velocidad (60 FPS sin sobrecarga)
    // Convertir ^ a **
    let jsCode = norm.replace(/\^/g, '**');

    // Reemplazar funciones matemáticas estándar por Math.*
    const mathFuncs = [
      'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2',
      'sinh', 'cosh', 'tanh', 'exp', 'log', 'sqrt', 'abs',
      'min', 'max', 'floor', 'ceil', 'round', 'sign', 'pow'
    ];

    mathFuncs.forEach(fn => {
      const reg = new RegExp(`\\b${fn}\\b`, 'g');
      jsCode = jsCode.replace(reg, `Math.${fn}`);
    });

    // Reemplazar constantes pi y e
    jsCode = jsCode.replace(/\bpi\b/gi, 'Math.PI');
    // Para 'e', solo si no es parte de otra palabra ni notación científica tipo 1e-3
    jsCode = jsCode.replace(/(?<![0-9a-zA-Z_.])e(?![0-9a-zA-Z_.])/g, 'Math.E');

    // Validación de seguridad: verificar que solo contenga tokens válidos
    const identifiers = jsCode.match(/[a-zA-Z_$][a-zA-Z0-9_$]*/g) || [];
    const allowedSet = new Set(['Math', 'x', 't', 'v', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2', 'sinh', 'cosh', 'tanh', 'exp', 'log', 'sqrt', 'abs', 'min', 'max', 'floor', 'ceil', 'round', 'sign', 'pow', 'PI', 'E']);
    for (const id of identifiers) {
      if (!allowedSet.has(id)) {
        throw new Error(`Identificador o comando no permitido: "${id}"`);
      }
    }

    let nativeFn;
    try {
      // Función con evaluación protegida
      const evalFn = new Function('x', 't', 'v', `"use strict"; return (${jsCode});`);
      nativeFn = function (x, t, v) {
        try {
          const res = evalFn(x, t, v);
          if (typeof res !== 'number' || !isFinite(res)) {
            return NaN;
          }
          return res;
        } catch {
          return NaN;
        }
      };
    } catch (syntaxErr) {
      if (mathJsCompiled) {
        // Fallback a Math.js si la construcción de JS nativo falló
        nativeFn = function (x, t, v) {
          try {
            const res = mathJsCompiled.evaluate({ x, t, v, pi: Math.PI, e: Math.E });
            return (typeof res === 'number' && isFinite(res)) ? res : NaN;
          } catch {
            return NaN;
          }
        };
      } else {
        throw new Error('Error al interpretar expresión: ' + syntaxErr.message);
      }
    }

    // Probar evaluación previa con valores de muestra
    try {
      const testVal = nativeFn(1.0, 0.0, 1.0);
      // Solo verificamos que la invocación no arroje excepción no controlada
    } catch (testErr) {
      throw new Error('Error al evaluar la ecuación con valores de prueba: ' + testErr.message);
    }

    compileCache.set(norm, nativeFn);
    return nativeFn;
  }

  /**
   * Muestreo adaptativo con detección de discontinuidades y asíntotas:
   * Genera los segmentos de línea listos para dibujar en el Canvas.
   * 
   * @param {Function} fn - Función compilada y = f(x, t, v)
   * @param {number} xMin - Coordenada X mínima en unidades físicas
   * @param {number} xMax - Coordenada X máxima en unidades físicas
   * @param {number} yMin - Coordenada Y mínima visible
   * @param {number} yMax - Coordenada Y máxima visible
   * @param {number} t - Tiempo actual
   * @param {number} v - Velocidad de propagación
   * @param {number} pixelStep - Paso en píxeles (ej. 1 o 1.5)
   * @param {number} scaleX - Escala píxeles por unidad física en X
   * @returns {Array<Array<{x: number, y: number}>>} Lista de trazos continuos
   */
  function sampleWave(fn, xMin, xMax, yMin, yMax, t, v, pixelStep, scaleX) {
    if (!fn) return [];

    const segments = [];
    let currentSegment = [];

    const physicalStep = Math.max((pixelStep || 1.5) / (scaleX || 50), 0.0005);
    const yRange = Math.abs(yMax - yMin) || 10;
    // Límite de salto vertical para considerar singularidad/asíntota
    const jumpThreshold = yRange * 3.5;
    const extremeBound = yRange * 10;

    let prevX = null;
    let prevY = null;

    for (let x = xMin; x <= xMax; x += physicalStep) {
      const y = fn(x, t, v);

      if (isNaN(y) || !isFinite(y)) {
        // Punto singular / no definido -> romper trazo
        if (currentSegment.length > 0) {
          segments.push(currentSegment);
          currentSegment = [];
        }
        prevX = null;
        prevY = null;
        continue;
      }

      // Si el valor se sale catastróficamente del rango visible
      if (Math.abs(y) > extremeBound) {
        if (currentSegment.length > 0) {
          segments.push(currentSegment);
          currentSegment = [];
        }
        prevX = null;
        prevY = null;
        continue;
      }

      // Detección de salto discontinuo / asíntota vertical (ej. tan(x))
      if (prevY !== null) {
        const deltaY = Math.abs(y - prevY);
        // Salto gigante con cambio de signo o pendiente desmedida
        if (deltaY > jumpThreshold && ((y * prevY < 0) || deltaY > yRange * 5)) {
          if (currentSegment.length > 0) {
            segments.push(currentSegment);
            currentSegment = [];
          }
        }
      }

      currentSegment.push({ x, y });
      prevX = x;
      prevY = y;
    }

    if (currentSegment.length > 0) {
      segments.push(currentSegment);
    }

    return segments;
  }

  /**
   * Muestreo de la onda resultante (suma de componentes activas):
   * Superpone numéricamente cada componente evaluada en cada punto x.
   */
  function sampleSuperposition(activeWaves, xMin, xMax, yMin, yMax, t, pixelStep, scaleX) {
    if (!activeWaves || activeWaves.length === 0) return [];

    const segments = [];
    let currentSegment = [];

    const physicalStep = Math.max((pixelStep || 1.5) / (scaleX || 50), 0.0005);
    const yRange = Math.abs(yMax - yMin) || 10;
    const jumpThreshold = yRange * 4.0;
    const extremeBound = yRange * 12;

    let prevY = null;

    for (let x = xMin; x <= xMax; x += physicalStep) {
      let sumY = 0;
      let valid = true;

      for (let i = 0; i < activeWaves.length; i++) {
        const wave = activeWaves[i];
        if (!wave.fn) continue;
        const val = wave.fn(x, t, wave.velocity ?? 1.0);
        if (isNaN(val) || !isFinite(val)) {
          valid = false;
          break;
        }
        sumY += val;
      }

      if (!valid || Math.abs(sumY) > extremeBound) {
        if (currentSegment.length > 0) {
          segments.push(currentSegment);
          currentSegment = [];
        }
        prevY = null;
        continue;
      }

      if (prevY !== null) {
        const deltaY = Math.abs(sumY - prevY);
        if (deltaY > jumpThreshold && ((sumY * prevY < 0) || deltaY > yRange * 6)) {
          if (currentSegment.length > 0) {
            segments.push(currentSegment);
            currentSegment = [];
          }
        }
      }

      currentSegment.push({ x, y: sumY });
      prevY = sumY;
    }

    if (currentSegment.length > 0) {
      segments.push(currentSegment);
    }

    return segments;
  }

  /**
   * Calcula el valor de todas las ondas individuales y de la resultante en un punto específico x.
   * Utilizado para el Inspector / Sonda de punto.
   */
  function probeAt(x, t, allWaves) {
    const results = {
      x,
      t,
      components: [],
      resultant: 0,
      activeCount: 0
    };

    let sum = 0;

    for (let i = 0; i < allWaves.length; i++) {
      const wave = allWaves[i];
      let val = NaN;
      if (wave.fn) {
        val = wave.fn(x, t, wave.velocity ?? 1.0);
      }

      const isIncluded = wave.enabledInSum !== false;
      const isVisible = wave.visible !== false;

      results.components.push({
        id: wave.id,
        name: wave.name || `y_{${i + 1}}`,
        rawExpr: wave.rawExpr,
        velocity: wave.velocity,
        color: wave.color,
        value: val,
        visible: isVisible,
        includedInSum: isIncluded
      });

      if (isIncluded && !isNaN(val) && isFinite(val)) {
        sum += val;
        results.activeCount++;
      }
    }

    results.resultant = results.activeCount > 0 ? sum : 0;
    return results;
  }

  return {
    compile,
    normalizeExpression,
    toLatex,
    sampleWave,
    sampleSuperposition,
    probeAt
  };
});
