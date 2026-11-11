/**
 * doppler-didactic.js
 * Módulo pedagógico y de aprendizaje guiado para el Efecto Doppler.
 * 
 * Contiene los 8 escenarios preparados con:
 * - Objetivo educativo y fundamentación física rigurosa.
 * - Configuración automática instantánea de parámetros del motor.
 * - Preguntas de predicción previas al experimento (con opciones múltiples).
 * - Procedimiento guiado paso a paso.
 * - Explicación física profunda de lo observado.
 * - Pregunta de comprobación con retroalimentación conceptual inmediata.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.DopplerDidactic = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const SCENARIOS = [
    {
      id: 'static',
      title: '1. Fuente y observador inmóviles',
      subtitle: 'Caso base de referencia y tiempo de retardo acústico',
      goal: 'Comprender que en reposo la longitud de onda en el medio es constante en todas las direcciones y que el sonido tarda un tiempo finito en llegar al observador.',
      config: {
        f: 2.0,
        c: 340.0,
        vx_f: 0.0,
        vy_f: 0.0,
        vx_o: 0.0,
        vy_o: 0.0,
        x_f0: -170.0,
        y_f0: 0.0,
        x_o0: 170.0,
        y_o0: 0.0,
        is2D: false,
        fixedDuration: 6.0
      },
      predictionQuestion: {
        question: 'Si la fuente emite a 2.0 Hz y ambos están en reposo separados 340 metros (c = 340 m/s), ¿qué frecuencia percibirá el observador y cuánto tardará en recibir el primer frente?',
        options: [
          'Percibe 2.0 Hz inmediatamente en t = 0 s.',
          'Percibe 2.0 Hz a partir de t = 1.0 s tras el viaje acústico.',
          'Percibe 4.0 Hz debido a la resonancia del medio a 340 m/s.',
          'Percibe 0 Hz porque la fuente no se está moviendo.'
        ],
        correctIndex: 1,
        feedback: '¡Exacto! El sonido viaja por el medio a c = 340 m/s. Para recorrer 340 m necesita t = d/c = 340/340 = 1.0 s. Una vez comienzan las recepciones, el ritmo de llegada coincide exactamente con el de emisión: f_o = 2.0 Hz.'
      },
      procedure: [
        'Presiona "Iniciar" para poner en marcha el experimento.',
        'Observa cómo los frentes circulares se expanden a velocidad c = 340 m/s.',
        'Fíjate en el cronómetro: el primer frente alcanza al receptor exactamente en t = 1.00 s.',
        'Cuenta las llegadas sucesivas y verifica que f_medida = 2.0 Hz.'
      ],
      explanation: 'En un medio estático sin movimiento relativo, los centros de todas las ondas coinciden en la posición fija de la fuente. La longitud de onda es espacialmente uniforme e idéntica en toda dirección: λ = c / f = 340 / 2 = 170 m. La frecuencia recibida es idéntica a la emitida.',
      checkQuestion: {
        question: 'Si la separación inicial se duplica a 680 m, ¿qué sucede con la frecuencia medida cuando los frentes lleguen?',
        options: [
          'La frecuencia medida disminuye a la mitad (1 Hz).',
          'La frecuencia medida sigue siendo 2 Hz, pero el primer frente tarda 2 s en llegar.',
          'La frecuencia aumenta porque las ondas se aceleran.',
          'El observador no podrá medir frecuencia porque la onda desaparece.'
        ],
        correctIndex: 1,
        feedback: '¡Correcto! La distancia sólo retrasa el instante de la primera llegada (tiempo de vuelo), pero la separación temporal entre frentes sucesivos sigue siendo el período original T = 0.5 s.'
      }
    },
    {
      id: 'source_approaching',
      title: '2. Fuente que se aproxima al observador',
      subtitle: 'Compresión espacial de frentes de onda y elevación tonal',
      goal: 'Descubrir cómo el avance de la fuente entre emisiones consecutivas acorta la distancia espacial entre crestas (compresión de frentes).',
      config: {
        f: 2.0,
        c: 340.0,
        vx_f: 170.0, // vf = 0.5 c
        vy_f: 0.0,
        vx_o: 0.0,
        vy_o: 0.0,
        x_f0: -250.0,
        y_f0: 0.0,
        x_o0: 250.0,
        y_o0: 0.0,
        is2D: false,
        fixedDuration: 4.0
      },
      predictionQuestion: {
        question: 'Si la fuente avanza hacia el observador a la mitad de la velocidad del sonido (vf = 170 m/s, c = 340 m/s) emitiendo a f = 2 Hz, ¿cuál será la frecuencia percibida?',
        options: [
          'f_o = 2.0 Hz (no cambia porque el sonido viaja a 340 m/s en el medio).',
          'f_o = 3.0 Hz (aumento proporcional a la suma simple).',
          'f_o = 4.0 Hz (se duplica al comprimirse la longitud de onda a la mitad).',
          'f_o = 1.0 Hz (se reduce por efecto del movimiento).'
        ],
        correctIndex: 2,
        feedback: '¡Excelente! Aplicando la fórmula f_o = f * c / (c - vf) = 2 * 340 / (340 - 170) = 2 * 2 = 4.0 Hz. La fuente recorre 85 m antes de emitir la siguiente cresta, reduciendo la longitud de onda delante a la mitad: λ = 85 m.'
      },
      procedure: [
        'Inicia la simulación.',
        'Observa cómo los frentes de onda se aprietan por delante de la fuente y se espacian por detrás.',
        'Usa el calibrador de longitud de onda verde: verifica que λ delante = 85 m frente a λ0 = 170 m.',
        'Comprueba en el panel de mediciones que f_medida = 4.0 Hz.'
      ],
      explanation: 'IMPORTANTE: ¡La fuente NO le transfiere velocidad al sonido! Las ondas viajan siempre a c = 340 m/s respecto al medio. Lo que cambia es que la fuente persigue sus propios frentes emitidos, emitiendo cada nueva cresta más cerca de la anterior.',
      checkQuestion: {
        question: '¿Por qué la longitud de onda por delante es menor?',
        options: [
          'Porque el sonido viaja más rápido hacia adelante.',
          'Porque la fuente se desplaza hacia adelante una distancia vf * T antes de emitir el siguiente frente.',
          'Porque el medio se comprime físicamente aumentando su densidad.',
          'Porque el observador atrae las ondas gravitatoriamente.'
        ],
        correctIndex: 1,
        feedback: '¡Exacto! En cada período T, la onda avanza c*T mientras la fuente avanza vf*T. La distancia entre dos crestas consecutivas en el medio es λ = (c - vf)*T.'
      }
    },
    {
      id: 'source_receding',
      title: '3. Fuente que se aleja del observador',
      subtitle: 'Dilatación espacial de frentes de onda y descenso tonal',
      goal: 'Analizar el ensanchamiento de frentes de onda cuando la fuente se mueve en sentido contrario a la propagación hacia el observador.',
      config: {
        f: 2.0,
        c: 340.0,
        vx_f: 170.0, // Fuente se mueve hacia +x alejándose de un observador en -x
        vy_f: 0.0,
        vx_o: 0.0,
        vy_o: 0.0,
        x_f0: 0.0,
        y_f0: 0.0,
        x_o0: -300.0,
        y_o0: 0.0,
        is2D: false,
        fixedDuration: 5.0
      },
      predictionQuestion: {
        question: 'Con la fuente alejándose a vf = 170 m/s y el observador detrás (x_o = -300 m), ¿qué ocurrirá con el intervalo de llegada entre frentes?',
        options: [
          'El intervalo entre llegadas se duplicará (llegarán más espaciados en el tiempo).',
          'El intervalo entre llegadas se reducirá.',
          'El intervalo se mantendrá en T = 0.5 s.',
          'Nunca llegará ninguna onda porque la fuente se aleja.'
        ],
        correctIndex: 0,
        feedback: '¡Muy bien! Dado que la fuente se aleja de las ondas emitidas hacia atrás, la longitud de onda detrás es λ_detrás = (c + vf)/f = 510/2 = 255 m. El intervalo temporal entre llegadas se eleva a Δt = 0.75 s y la frecuencia cae a f_o = 1.33 Hz.'
      },
      procedure: [
        'Ejecuta el experimento.',
        'Observa los frentes dilatados que se dirigen hacia la izquierda (hacia el observador).',
        'Verifica que la longitud de onda detrás es 255 m.',
        'Comprueba que el tono recibido es más grave (frecuencia menor a 2 Hz).'
      ],
      explanation: 'Al alejarse la fuente del observador en reposo, cada nuevo frente se emite más lejos del observador que el anterior. Por tanto, cada frente debe recorrer una distancia mayor que el previo, llegando con un retraso acumulado que disminuye la frecuencia observada.',
      checkQuestion: {
        question: 'En el régimen ordinario, cuando una fuente subsónica se aleja a cualquier velocidad, ¿puede la frecuencia observada ser cero o negativa?',
        options: [
          'Sí, si la fuente supera los 100 m/s la frecuencia se vuelve negativa.',
          'No, la frecuencia observada siempre es positiva (f_o > 0), aunque tienda a cero si la velocidad fuera inmensa.',
          'Se vuelve imaginaria.',
          'Depende del volumen del sonido.'
        ],
        correctIndex: 1,
        feedback: '¡Correcto! En f_o = f * c / (c + vf), dado que vf > 0 y c > 0, el denominador (c + vf) siempre es estrictamente positivo, por lo que f_o > 0 siempre.'
      }
    },
    {
      id: 'observer_approaching',
      title: '4. Observador que se aproxima a la fuente en reposo',
      subtitle: 'Mayor frecuencia de encuentro sin alteración de la longitud de onda',
      goal: 'Comprender la diferencia crucial: el movimiento del observador NO modifica la longitud de onda en el medio, sino la rapidez relativa con la que intercepta las crestas.',
      config: {
        f: 2.0,
        c: 340.0,
        vx_f: 0.0,
        vy_f: 0.0,
        vx_o: -170.0, // Observador viaja hacia la izquierda a 170 m/s
        vy_o: 0.0,
        x_f0: -200.0,
        y_f0: 0.0,
        x_o0: 250.0,
        y_o0: 0.0,
        is2D: false,
        fixedDuration: 3.5
      },
      predictionQuestion: {
        question: 'Si la fuente está quieta (λ = 170 m en el medio) y el observador viaja hacia ella a vo = 170 m/s, ¿cuál es la longitud de onda espacial de las ondas en el aire?',
        options: [
          'λ = 85 m porque el observador se mueve hacia ellas.',
          'λ = 170 m (no cambia en el medio; el observador simplemente las intercepta con mayor rapidez relativa).',
          'λ = 340 m.',
          'La longitud de onda deja de existir.'
        ],
        correctIndex: 1,
        feedback: '¡Exacto y fundamental! La fuente en reposo emite ondas espaciadas λ = c/f = 170 m en el aire. El movimiento del observador no puede alterar retroactivamente las ondas ya presentes en el medio; lo que cambia es la velocidad relativa de corte: v_rel = c + vo = 510 m/s, dando f_o = v_rel / λ = 510 / 170 = 3.0 Hz.'
      },
      procedure: [
        'Inicia la simulación.',
        'Observa que los círculos son concéntricos y su separación espacial es uniforme (170 m).',
        'Mira cómo el observador avanza hacia los frentes y los cruza en rápida sucesión.',
        'Comprueba que f_medida = 3.0 Hz.'
      ],
      explanation: 'Esta es una distinción pedagógica esencial: la fuente altera la longitud de onda en el medio; el observador altera la frecuencia de encuentro al interceptar las ondas con una rapidez relativa c + vo.',
      checkQuestion: {
        question: '¿Por qué la fórmula con observador en movimiento es lineal en el numerador f_o = f * (c + vo)/c a diferencia de la fuente que tiene la velocidad en el denominador?',
        options: [
          'Es una aproximación matemática sin sentido físico.',
          'Porque la velocidad del observador se suma directamente a la rapidez relativa con la que las ondas barren su posición.',
          'Porque el observador emite ondas secundarias que interfieren.',
          'Por convención de signos histórica.'
        ],
        correctIndex: 1,
        feedback: '¡Excelente! En cada segundo, el observador barre una longitud espacial c + vo. Como cada onda ocupa λ = c/f metros, el número de ondas interceptadas por segundo es (c + vo) / λ = f*(c + vo)/c.'
      }
    },
    {
      id: 'observer_receding',
      title: '5. Observador que se aleja de la fuente en reposo',
      subtitle: 'Intercepción retardada de crestas',
      goal: 'Analizar qué ocurre cuando el observador huye de los frentes de onda en reposo.',
      config: {
        f: 2.0,
        c: 340.0,
        vx_f: 0.0,
        vy_f: 0.0,
        vx_o: 170.0, // Observador huye hacia +x a 170 m/s
        vy_o: 0.0,
        x_f0: -200.0,
        y_f0: 0.0,
        x_o0: 0.0,
        y_o0: 0.0,
        is2D: false,
        fixedDuration: 4.0
      },
      predictionQuestion: {
        question: 'Si el observador se aleja a vo = 170 m/s (c = 340 m/s, f = 2 Hz), ¿cuál será la frecuencia con la que las ondas lo alcanzan?',
        options: [
          'f_o = 1.0 Hz (la mitad de la frecuencia emitida).',
          'f_o = 0 Hz (las ondas nunca lo alcanzan).',
          'f_o = 2.0 Hz.',
          'f_o = 0.5 Hz.'
        ],
        correctIndex: 0,
        feedback: '¡Correcto! Rapidez relativa de aproximación de la onda al observador: c - vo = 340 - 170 = 170 m/s. Frecuencia observada: f_o = f * (c - vo)/c = 2 * (170/340) = 1.0 Hz.'
      },
      procedure: [
        'Pon en marcha el experimento.',
        'Observa cómo los frentes persiguen al observador y lo van rebasando lentamente.',
        'Verifica que el intervalo entre llegadas es exactamente 1.0 s (el doble del período de emisión).',
        'Comprueba que f_medida = 1.0 Hz.'
      ],
      explanation: 'Como la onda se propaga en el medio a 340 m/s y el observador avanza en la misma dirección a 170 m/s, la onda gana terreno a una tasa neta de 170 m/s. Por tanto, tarda el doble de tiempo en alcanzar al observador respecto al caso estático.',
      checkQuestion: {
        question: '¿Qué ocurriría si el observador se moviese a la velocidad del sonido (vo = c = 340 m/s)?',
        options: [
          'Escucharía un tono infinitamente agudo.',
          'Ningún frente nuevo lo alcanzaría; si cabalga sobre una cresta, f_o = 0 Hz.',
          'El sonido viajaría al doble de velocidad.',
          'La fuente se detendría.'
        ],
        correctIndex: 1,
        feedback: '¡Exacto! Si vo = c, el numerador (c - vo) es cero, por lo que f_o = 0 Hz: el observador viaja a la par con la onda y nunca cruza frentes sucesivos.'
      }
    },
    {
      id: 'equal_velocities',
      title: '6. Fuente y observador con igual velocidad constante',
      subtitle: 'Separación constante: ¿hay efecto Doppler?',
      goal: 'Verificar rigurosamente que cuando fuente y observador viajan con idéntica velocidad respecto al medio homogéneo en régimen subsónico, la frecuencia observada es exactamente igual a la emitida.',
      config: {
        f: 2.0,
        c: 340.0,
        vx_f: 136.0, // vf = 136 m/s (0.4 c)
        vy_f: 0.0,
        vx_o: 136.0, // vo = 136 m/s
        vy_o: 0.0,
        x_f0: -200.0,
        y_f0: 0.0,
        x_o0: 100.0,
        y_o0: 0.0,
        is2D: false,
        fixedDuration: 5.0
      },
      predictionQuestion: {
        question: 'Si ambos se mueven en la misma dirección a 136 m/s manteniendo una distancia constante de 300 m, ¿cuál será la frecuencia percibida?',
        options: [
          'Mayor a 2 Hz por el avance de la fuente.',
          'Menor a 2 Hz por la huida del observador.',
          'Exactamente 2 Hz: el efecto de la fuente y el del observador se cancelan perfectamente.',
          '0 Hz porque no hay movimiento relativo entre ellos.'
        ],
        correctIndex: 2,
        feedback: '¡Excelente deducción! Aplicando la fórmula: f_o = f * (c - vo)/(c - vf). Como vo = vf = 136 m/s, la fracción (340 - 136)/(340 - 136) = 1. Por lo tanto, f_o = f = 2.0 Hz. La compresión de longitud de onda delante de la fuente es exactamente compensada por la velocidad con la que el observador se aleja de ellas.'
      },
      procedure: [
        'Inicia la simulación.',
        'Observa que ambos cuerpos se desplazan juntos manteniendo fija su distancia.',
        'Fíjate en las llegadas: los frentes que alcanzan al observador están comprimidos, pero el observador huye a la misma tasa.',
        'Verifica que f_medida = 2.0 Hz idéntico a f_emitida.'
      ],
      explanation: 'Aunque ambos cuerpos se mueven respecto al aire, su separación se mantiene fija. Cada frente emitido tarda exactamente el mismo tiempo de vuelo en alcanzar al observador que el frente anterior. Por lo tanto, el intervalo entre emisiones es igual al intervalo entre recepciones: Δtr = Δte = T.',
      checkQuestion: {
        question: '¿Significa esto que el tiempo de viaje del sonido entre ellos es igual al caso en reposo?',
        options: [
          'Sí, el tiempo de vuelo es idéntico.',
          'No: el tiempo de vuelo depende de la velocidad respecto al medio, pero la derivada del tiempo de vuelo es cero, manteniendo la frecuencia constante.',
          'El tiempo de vuelo es instantáneo.',
          'El sonido no viaja.'
        ],
        correctIndex: 1,
        feedback: '¡Respuesta de nivel universitario! Como el observador huye del punto donde se emitió el sonido, el tiempo de vuelo es t_vuelo = d0 / (c - vo), que es mayor que d0/c. Pero como es constante para todos los pulsos, Δtr = Δte.'
      }
    },
    {
      id: 'lateral_pass_2d',
      title: '7. Paso lateral bidimensional (Efecto Doppler 2D)',
      subtitle: 'Variación continua del ángulo n · v y caída gradual de tono',
      goal: 'Explorar la geometría vectorial en 2D: cómo la proyección de la velocidad sobre la línea de visión cambia continuamente de acercamiento a alejamiento.',
      config: {
        f: 2.0,
        c: 340.0,
        vx_f: 200.0, // Fuente viaja horizontalmente
        vy_f: 0.0,
        vx_o: 0.0,
        vy_o: 0.0,
        x_f0: -350.0,
        y_f0: 80.0, // Desplazada 80 metros en el eje Y (impact parameter)
        x_o0: 0.0,
        y_o0: -60.0,
        is2D: true,
        fixedDuration: 5.0
      },
      predictionQuestion: {
        question: 'Cuando la fuente pasa a un lado del observador (sin chocar con él), ¿cómo varía la frecuencia percibida en el tiempo?',
        options: [
          'Pasa bruscamente de aguda a grave en un salto instantáneo.',
          'Se mantiene constante todo el trayecto.',
          'Comienza alta durante la aproximación lejana, disminuye suavemente al cruzar el punto más cercano y desciende a un valor bajo al alejarse.',
          'Aumenta continuamente a medida que el tiempo avanza.'
        ],
        correctIndex: 2,
        feedback: '¡Brillante! En 2D, el factor Doppler depende de n · vf = vf * cos(θ). Al inicio θ es casi 0° (cos θ ≈ 1, máxima frecuencia). Al pasar de lado θ = 90° (cos θ = 0, f_o = f). Al alejarse θ tiende a 180° (cos θ ≈ -1, mínima frecuencia). Esto produce el característico silbido o zumbido descendente: "¡iiiii-uuuuu!".'
      },
      procedure: [
        'Activa el modo 2D y reproduce la simulación.',
        'Observa cómo el vector unitario n (línea de visión retardada) va rotando.',
        'Mira la gráfica de frecuencia teórica: observa la curva suave en forma de "S" invertida.',
        'Si tienes el audio activado, escucha la transición tonal continua.'
      ],
      explanation: 'En dos dimensiones, f_o(t) = f * (c - n · vo) / (c - n · vf). La dirección retardada n conecta el punto de emisión con el observador. La caída de frecuencia no es un escalón instantáneo sino una transición continua modulada por el ángulo de visión.',
      checkQuestion: {
        question: 'En el instante de máxima aproximación (cuando la distancia entre fuente y observador es mínima en 2D), ¿la frecuencia recibida es exactamente igual a la emitida?',
        options: [
          'Sí, pero sólo si se evalúa considerando el retardo del sonido emitido con n · vf = 0.',
          'No, en el instante de máxima aproximación la frecuencia siempre es el doble.',
          'La frecuencia desaparece.',
          'Depende de la masa de la fuente.'
        ],
        correctIndex: 0,
        feedback: '¡Exacto! El punto de inflexión donde fo = fe corresponde al frente emitido cuando el vector velocidad es exactamente perpendicular al vector de posición retardado hacia el observador.'
      }
    },
    {
      id: 'supersonic_mach',
      title: '8. Barrera sónica (Mach 1) y régimen supersónico (Mach 1.5)',
      subtitle: 'Acumulación de frentes, cono de Mach y estampido sónico',
      goal: 'Comprender la singularidad en M = 1 y la formación de la envolvente de choque geométrica en M > 1 con semángulo μ = arcsin(1/M).',
      config: {
        f: 2.0,
        c: 340.0,
        vx_f: 510.0, // Mach 1.5 (1.5 * 340 = 510 m/s)
        vy_f: 0.0,
        vx_o: 0.0,
        vy_o: 0.0,
        x_f0: -400.0,
        y_f0: 0.0,
        x_o0: 200.0,
        y_o0: 100.0, // Observador fuera de la línea de vuelo
        is2D: true,
        fixedDuration: 3.5
      },
      predictionQuestion: {
        question: 'Para una fuente viajando a Mach 1.5 (vf = 510 m/s, c = 340 m/s), ¿cuál es el semángulo del cono de Mach μ y qué escucha el observador antes de que el cono lo alcance?',
        options: [
          'μ = 45° y escucha el sonido normal desde el principio.',
          'μ = arcsin(1 / 1.5) ≈ 41.8° y hay silencio absoluto antes de la llegada del frente de choque.',
          'μ = 90° y el observador escucha un estampido inmediato en t = 0.',
          'No se forma cono porque el sonido no puede viajar más rápido que la fuente.'
        ],
        correctIndex: 1,
        feedback: '¡Extraordinario! Como la fuente viaja más rápido que las ondas que emite, todas las ondas quedan confinadas dentro de la cuña de Mach con semángulo μ = arcsin(1/M) = arcsin(1/1.5) = 41.81°. En la zona por delante del cono ("zona de silencio") ninguna onda ha podido llegar aún.'
      },
      procedure: [
        'Inicia la simulación a Mach 1.5.',
        'Observa las líneas rojas tangentes: forman la envolvente de Mach.',
        'Nota que la fuente se adelanta a todos sus frentes de onda.',
        'Fíjate cuando la línea roja del cono de choque barre el punto del observador: ¡en ese instante exacto se registra la llegada del frente de choque y se dispara la sonificación del estampido!'
      ],
      explanation: 'En régimen supersónico, las ondas emitidas en instantes sucesivos interfieren constructivamente a lo largo de una superficie cónica tangente. A través de esta superficie la presión cambia abruptamente (onda de choque). El observador no escucha nada hasta que la superficie del cono lo intercepta.',
      checkQuestion: {
        question: 'Si la velocidad aumenta a Mach 2.0, ¿el cono de Mach se vuelve más cerrado (ángulo menor) o más abierto?',
        options: [
          'Más abierto (μ = 60°).',
          'Más cerrado: μ = arcsin(1/2) = 30°.',
          'Permanece en 41.8°.',
          'Se convierte en un círculo plano.'
        ],
        correctIndex: 1,
        feedback: '¡Correcto! A mayor número de Mach, 1/M es menor y por tanto el ángulo μ = arcsin(1/M) se hace más agudo (30° para Mach 2).'
      }
    }
  ];

  return {
    SCENARIOS
  };
}));
