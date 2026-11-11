/**
 * didactic.js
 * Módulo pedagógico: Presets listos para clase de Física, explicaciones teóricas,
 * preguntas orientadoras predictivas interactivas con retroalimentación y
 * análisis del principio de superposición.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.DidacticManager = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const PRESETS = [
    {
      id: 'constructive-pulses',
      title: '1. Dos pulsos iguales en sentidos opuestos',
      subtitle: 'Interferencia Constructiva Máxima',
      description: 'Dos pulsos idénticos viajan en sentidos contrarios. En el punto de encuentro sus amplitudes se suman directamente duplicando la altura.',
      theory: `
        <p><strong>Principio Físico:</strong> De acuerdo con el <em>Principio de Superposición</em> para ecuaciones de onda lineales, la función de onda total es la suma algebraica puntual:</p>
        <p class="formula-box">$$y(x,t) = y_1(x,t) + y_2(x,t)$$</p>
        <p>Cuando los centros de ambos pulsos coinciden en $x = 0$, la elongación máxima es:</p>
        <p class="formula-box">$$y_{\\text{máx}} = A_1 + A_2 = 2\\text{ m} + 2\\text{ m} = 4\\text{ m}$$</p>
        <p>Tras el cruce, cada pulso continúa su trayectoria inalterado en forma, amplitud y velocidad. Esto demuestra que las ondas no colisionan como partículas sólidas, sino que se atraviesan mutuamente sin transferir deformación permanente.</p>
      `,
      question: {
        prompt: '¿Qué ocurrirá cuando ambos pulsos se superpongan exactamente en el centro y qué pasará después?',
        options: [
          {
            text: 'Rebotan en sentidos contrarios como bolas de billar.',
            correct: false,
            feedback: 'Incorrecto. Las ondas no son cuerpos rígidos con masa puntual: se rigen por la linealidad de la ecuación diferencial de onda.'
          },
          {
            text: 'Se suman duplicando la amplitud a 4 m momentáneamente y luego continúan su camino sin alterarse.',
            correct: true,
            feedback: '¡Exacto! El principio de superposición garantiza la interferencia constructiva instantánea y la conservación de la identidad de cada onda tras el cruce.'
          },
          {
            text: 'Se destruyen mutuamente disipando toda su energía.',
            correct: false,
            feedback: 'Incorrecto. La energía mecánica total del medio se conserva íntegramente.'
          }
        ]
      },
      time: 0.0,
      waves: [
        {
          name: 'y₁ (hacia la derecha)',
          rawExpr: '2 / ((x - 2.5*t + 7)^2 + 1)',
          velocity: 2.5,
          color: '#2563eb',
          width: 2.5
        },
        {
          name: 'y₂ (hacia la izquierda)',
          rawExpr: '2 / ((x + 2.5*t - 7)^2 + 1)',
          velocity: -2.5,
          color: '#d97706',
          width: 2.5
        }
      ]
    },
    {
      id: 'destructive-pulses',
      title: '2. Dos pulsos de signos contrarios',
      subtitle: 'Interferencia Destructiva y Conservación de Energía',
      description: 'Un pulso positivo y un pulso invertido viajan al encuentro. En el instante de cruce la cuerda queda totalmente plana.',
      theory: `
        <p><strong>Principio Físico:</strong> En el instante de máxima coincidencia ($t \\approx 2.8\\text{ s}$), para cada punto se cumple $y_1(x,t) = -y_2(x,t)$, produciendo una anulación completa del desplazamiento:</p>
        <p class="formula-box">$$y(x,t) = 0 \\quad \\forall x$$</p>
        <p><strong>¿Dónde está la energía en ese instante?</strong> La energía potencial elástica depende de la pendiente $\\left(\\frac{\\partial y}{\\partial x}\\right)^2$, la cual es cero. Toda la energía mecánica está almacenada temporalmente en forma de <em>energía cinética transversal</em> máxima de las partículas del medio:</p>
        <p class="formula-box">$$E_k = \\frac{1}{2} \\mu \\int \\left( \\frac{\\partial y}{\\partial t} \\right)^2 dx$$</p>
      `,
      question: {
        prompt: 'En el instante exacto en que la cuerda queda totalmente plana (y = 0 en todo x), ¿dónde reside la energía?',
        options: [
          {
            text: 'En la energía cinética transversal de las partículas del medio, que se mueven a velocidad máxima.',
            correct: true,
            feedback: '¡Brillante! Aunque la cuerda parece en reposo por un instante infinitesimal, sus elementos de masa tienen velocidad transversal máxima.'
          },
          {
            text: 'La energía desaparece momentáneamente violando la física cuántica clásica.',
            correct: false,
            feedback: 'Incorrecto. La energía total de una onda mecánica jamás desaparece en un medio elástico ideal.'
          },
          {
            text: 'Se transforma en radiación térmica instantánea.',
            correct: false,
            feedback: 'Incorrecto. En un medio no disipativo no hay pérdidas térmicas.'
          }
        ]
      },
      time: 0.0,
      waves: [
        {
          name: 'y₁ (pulso cresta)',
          rawExpr: '2 / ((x - 2.5*t + 7)^2 + 1)',
          velocity: 2.5,
          color: '#2563eb',
          width: 2.5
        },
        {
          name: 'y₂ (pulso valle invertido)',
          rawExpr: '-2 / ((x + 2.5*t - 7)^2 + 1)',
          velocity: -2.5,
          color: '#dc2626',
          width: 2.5
        }
      ]
    },
    {
      id: 'different-pulses',
      title: '3. Pulsos con diferentes amplitudes y anchuras',
      subtitle: 'Superposición Asimétrica de Paquetes',
      description: 'Un pulso angosto y alto se superpone con un pulso ancho y bajo para evidenciar la suma punto a punto de perfiles disímiles.',
      theory: `
        <p>El principio de superposición es universal e independiente de la simetría o geometría de las perturbaciones. No requiere que las componentes tengan la misma anchura, longitud o amplitud.</p>
        <p class="formula-box">$$y_1 = 3 \\cdot e^{-0.8(x - 2t + 6)^2}, \\quad y_2 = 1.2 \\cdot e^{-0.12(x + 2t - 6)^2}$$</p>
        <p>El perfil resultante adopta una forma compuesta asimétrica donde el pulso angosto parece "montar" sobre la cresta del pulso extendido antes de separarse limpiamente.</p>
      `,
      question: {
        prompt: '¿Al interactuar, el pulso más ancho y extendido deformará permanentemente al pulso angosto?',
        options: [
          {
            text: 'Sí, el pulso angosto perderá energía y quedará ensanchado de por vida.',
            correct: false,
            feedback: 'Incorrecto. En un medio elástico lineal no hay dispersión no lineal; cada componente retiene su forma espectral íntegra.'
          },
          {
            text: 'No, tras la superposición cada pulso emerge exactamente con su forma y energía originales.',
            correct: true,
            feedback: '¡Correcto! Esta propiedad es la base de la transmisión de señales simultáneas por fibra óptica y ondas de radio.'
          }
        ]
      },
      time: 0.0,
      waves: [
        {
          name: 'y₁ (pulso angosto y alto)',
          rawExpr: '3 * exp(-0.8 * (x - 2*t + 6)^2)',
          velocity: 2.0,
          color: '#9333ea',
          width: 2.8
        },
        {
          name: 'y₂ (pulso ancho)',
          rawExpr: '1.2 * exp(-0.12 * (x + 2*t - 6)^2)',
          velocity: -2.0,
          color: '#0891b2',
          width: 2.8
        }
      ]
    },
    {
      id: 'fourier-synthesis',
      title: '4. Superposición de tres o más componentes',
      subtitle: 'Síntesis Armónica de Fourier',
      description: 'Suma de la frecuencia fundamental con el segundo y tercer armónico viajando a la misma velocidad de fase.',
      theory: `
        <p>El matemático francés Joseph Fourier demostró que cualquier onda periódica compleja puede representarse como una serie de armónicos sinusoidales:</p>
        <p class="formula-box">$$y(x,t) = \\sum_{n=1}^{\\infty} A_n \\operatorname{sen}\\left( n(k x - \\omega t) \\right)$$</p>
        <p>Observa cómo la suma de tres armónicos de frecuencias $f, 2f, 3f$ con amplitudes decrecientes comienza a modelar un tren de ondas con pendientes asimétricas (onda en diente de sierra).</p>
      `,
      question: {
        prompt: 'Si sumamos un número infinito de armónicos impares con amplitudes proporcionales a 1/n, ¿qué forma geométrica adquiere la onda resultante?',
        options: [
          {
            text: 'Una onda cuadrada perfecta.',
            correct: true,
            feedback: '¡Exacto! Es la célebre serie de Fourier de la onda cuadrada, fundamental en electrónica digital y física de oscilaciones.'
          },
          {
            text: 'Una línea recta horizontal inmóvil.',
            correct: false,
            feedback: 'Incorrecto. Los armónicos interfieren constructiva y destructivamente creando mesetas periódicas.'
          }
        ]
      },
      time: 0.0,
      waves: [
        {
          name: 'y₁ (Fundamental, f)',
          rawExpr: '1.6 * sen(x - 2*t)',
          velocity: 2.0,
          color: '#2563eb',
          width: 2.2
        },
        {
          name: 'y₂ (2° Armónico, 2f)',
          rawExpr: '0.8 * sen(2 * (x - 2*t))',
          velocity: 2.0,
          color: '#16a34a',
          width: 2.0
        },
        {
          name: 'y₃ (3° Armónico, 3f)',
          rawExpr: '0.4 * sen(3 * (x - 2*t))',
          velocity: 2.0,
          color: '#ea580c',
          width: 1.8
        }
      ]
    },
    {
      id: 'standing-waves',
      title: '5. Dos ondas sinusoidales en sentidos opuestos',
      subtitle: 'Generación de Ondas Estacionarias y Nodos',
      description: 'Dos ondas sinusoidales de igual amplitud y frecuencia propagándose en sentidos contrarios generan una onda estacionaria.',
      theory: `
        <p>Aplicando identidades trigonométricas de suma de senos:</p>
        <p class="formula-box">$$\\operatorname{sen}(A) + \\operatorname{sen}(B) = 2 \\operatorname{sen}\\left(\\frac{A+B}{2}\\right) \\cos\\left(\\frac{A-B}{2}\\right)$$</p>
        <p class="formula-box">$$y_{\\text{res}}(x,t) = 2 A \\operatorname{sen}(kx) \\cos(\\omega t)$$</p>
        <p><strong>Nodos:</strong> Puntos donde $\\operatorname{sen}(kx) = 0 \\implies x_n = \\frac{n\\pi}{k}$. La cuerda NUNCA oscila en estos puntos (amplitud permanentemente cero).<br>
        <strong>Vientres (Antinodos):</strong> Puntos de máxima oscilación con amplitud $2A$. La onda NO transporta energía neta a lo largo del eje $x$.</p>
      `,
      question: {
        prompt: '¿Hacia qué lado viaja la onda resultante verde en el espacio?',
        options: [
          {
            text: 'Hacia la derecha con el doble de velocidad.',
            correct: false,
            feedback: 'Incorrecto. Observa los nodos: permanecen inmóviles en las mismas posiciones x fijas.'
          },
          {
            text: 'No viaja hacia ningún lado: es una onda estacionaria con nodos fijos en el espacio.',
            correct: true,
            feedback: '¡Perfecto! El perfil oscila verticalmente in situ sin propagación horizontal de energía neta.'
          },
          {
            text: 'Oscila caóticamente cambiando de sentido periódicamente.',
            correct: false,
            feedback: 'Incorrecto. La oscilación es perfectamente armónica pura con frecuencia angular ω.'
          }
        ]
      },
      time: 0.0,
      waves: [
        {
          name: 'y₁ (hacia la derecha +x)',
          rawExpr: '1.8 * sen(x - 2.2*t)',
          velocity: 2.2,
          color: '#2563eb',
          width: 2.2
        },
        {
          name: 'y₂ (hacia la izquierda -x)',
          rawExpr: '1.8 * sen(x + 2.2*t)',
          velocity: -2.2,
          color: '#dc2626',
          width: 2.2
        }
      ]
    },
    {
      id: 'beats-interference',
      title: '6. Batimiento Ondulatorio (Beats)',
      subtitle: 'Modulación de Amplitud por Frecuencias Cercanas',
      description: 'Superposición de dos ondas armónicas con frecuencias espaciales y temporales muy próximas.',
      theory: `
        <p>Cuando dos frecuencias $f_1 \\approx f_2$ interfieren, se genera una modulación de envolvente periódica:</p>
        <p class="formula-box">$$y(x,t) = \\left[ 2A \\cos\\left(\\frac{\\Delta k \\cdot x - \\Delta \\omega \\cdot t}{2}\\right) \\right] \\operatorname{sen}(k_{\\text{prom}} x - \\omega_{\\text{prom}} t)$$</p>
        <p>El término entre corchetes actúa como una <strong>amplitud modulada variable</strong> que produce paquetes pulsantes de sonido o desplazamiento.</p>
      `,
      question: {
        prompt: '¿Cómo se percibe el batimiento en una onda sonora acústica?',
        options: [
          {
            text: 'Como una variación periódica o pulsante en la intensidad (volumen) del sonido.',
            correct: true,
            feedback: '¡Exacto! Es el efecto que usan los músicos de oído para afinar instrumentos (las pulsaciones desaparecen cuando f1 = f2).'
          },
          {
            text: 'Como un cambio repentino a un tono ultrasónico inaudible.',
            correct: false,
            feedback: 'Incorrecto. El tono percibido es la frecuencia promedio, modulado en intensidad.'
          }
        ]
      },
      time: 0.0,
      waves: [
        {
          name: 'y₁ (k = 1.1, ω = 2.2)',
          rawExpr: '1.5 * sen(1.1*x - 2.2*t)',
          velocity: 2.0,
          color: '#2563eb',
          width: 2.2
        },
        {
          name: 'y₂ (k = 0.9, ω = 1.8)',
          rawExpr: '1.5 * sen(0.9*x - 1.8*t)',
          velocity: 2.0,
          color: '#d97706',
          width: 2.2
        }
      ]
    }
  ];

  return {
    PRESETS
  };
});
