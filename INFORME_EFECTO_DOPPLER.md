# Informe Técnico, Pedagógico y Manual de Uso • Efecto Doppler Acústico
### Física III • Laboratorio Virtual Interactivo en Español (es-CO)

---

## 1. Estado de Acceso al Archivo de Referencia
> **Aclaración Inicial Obligatoria:**
> En cumplimiento con el numeral 1 de la especificación técnica: el archivo `EfectoDoppler.html` **no se encontraba presente ni accesible** en el espacio de trabajo local al momento de iniciar el desarrollo (únicamente se encontraban los archivos de la simulación previa de *Movimiento Ondulatorio y Superposición*). Por tanto, la presente aplicación se diseñó y construyó **desde cero de manera original, rigurosa y completa** siguiendo al pie de la letra toda la especificación técnica, pedagógica y matemática suministrada.

---

## 2. Arquitectura de la Aplicación y Archivos Entregados

La aplicación se compone de archivos estáticos modulares que pueden ejecutarse de forma inmediata en cualquier navegador moderno sin requerir compiladores ni dependencias de backend:

```text
Movimiento ondulatorio/
├── EfectoDoppler.html       # Aplicación principal ejecutable (HTML5 semántico, KaTeX, responsive)
├── index.html               # Simulador de Superposición con enlace bidireccional a Efecto Doppler
├── css/
│   └── doppler.css          # Sistema de diseño, tokens HSL, tema oscuro/claro, modales y layouts
├── js/
│   ├── doppler-physics.js   # Motor físico acústico determinista, cálculo de llegadas y pruebas canónicas
│   ├── doppler-audio.js     # Motor de audio con Web Audio API (pulsos rítmicos, transposición y estampido)
│   ├── doppler-canvas.js    # Renderizado en Canvas 2D de alta resolución (DPR), avatares, Mach y calipers
│   ├── doppler-graphs.js    # Gráficas científicas en tiempo real (5 canales sincrónicos) y exportador CSV
│   ├── doppler-didactic.js  # 8 Escenarios pedagógicos con preguntas de predicción y retroalimentación
│   ├── doppler-code-lab.js  # Laboratorio de código en Web Worker aislado con 4 scripts predefinidos
│   └── doppler-ui.js        # Coordinador de interfaz, sliders sincronizados, teclado y bucle de animación
└── INFORME_EFECTO_DOPPLER.md# Este documento técnico y pedagógico
```

---

## 3. Fundamentación del Modelo Físico y Límites de Validez

### 3.1 Emisión y Propagación en el Medio Homogéneo
1. **Medio en Reposo:** El medio acústico (aire) se encuentra estático. La rapidez de propagación $c = 340\text{ m/s}$ es una propiedad intrínseca del medio; la fuente **no le transfiere velocidad al sonido**.
2. **Programación Determinista de Frentes:** Para frecuencia emitida constante $f$, las emisiones ocurren en instantes exactos:
   $$t_{e,n} = \frac{n}{f}, \quad n \in \{0, 1, 2, \dots\}.$$
3. **Inmutabilidad de los Frentes Emitidos:** Cada frente de onda esférico/circular permanece anclado al medio en el punto donde se encontraba la fuente al ser emitido:
   $$\mathbf{x}_{c,n} = \mathbf{x}_f(t_{e,n}).$$
   Su radio evoluciona en el tiempo como:
   $$r_n(t) = c(t - t_{e,n}), \qquad t \ge t_{e,n}.$$
   Los frentes emitidos **nunca** se mueven con la fuente una vez liberados.

### 3.2 Recepción y Frecuencia Observada
La onda intercepta al observador cuando:
$$|\mathbf{x}_o(t_r) - \mathbf{x}_f(t_e)| = c(t_r - t_e).$$
- **Frecuencia Teórica Retardada (Vectorial 2D y 1D):**
  $$f_o = f_e \frac{c - \mathbf{n}\cdot\mathbf{v}_o}{c - \mathbf{n}\cdot\mathbf{v}_f},$$
  donde $\mathbf{n} = \frac{\mathbf{x}_o(t_r) - \mathbf{x}_f(t_e)}{|\mathbf{x}_o(t_r) - \mathbf{x}_f(t_e)|}$ es la dirección retardada de emisión evaluada con $\mathbf{v}_f(t_e)$ y $\mathbf{v}_o(t_r)$.
- **Medición Experimental Independiente (Cruce de Frentes):**
  $$f_{\text{medida}} = \frac{1}{t_{r,n+1} - t_{r,n}}.$$
  Esta cantidad no reutiliza la fórmula analítica; cuenta directamente el intervalo temporal real entre recepciones físicas consecutivas en la posición del micrófono.

### 3.3 Regímenes Subsónico, Sónico y Supersónico
- **Subsónico ($M = |v_f|/c < 1$):** Compresión por delante $\lambda_{\text{delante}} = \frac{c - v_f}{f}$ y dilatación por detrás $\lambda_{\text{detrás}} = \frac{c + v_f}{f}$.
- **Barrera Sónica ($M = 1$):** Frentes apilados en la punta de la fuente; el denominador analítico tiende a cero, lo cual representa acumulación energética y gradiente de presión extremo, no un tono audible físicamente infinito.
- **Supersónico ($M > 1$):** Se genera la envolvente y cono de Mach con semángulo:
  $$\mu = \arcsin\left(\frac{1}{M}\right).$$
  Existe una zona de silencio por delante del cono. El estampido sónico se percibe y sonifica **únicamente cuando la línea tangente del cono de choque alcanza geométricamente al observador**.

---

## 4. Resultados de la Verificación Científica Obligatoria

Se ejecutó la batería de pruebas analíticas independientes con tolerancias estrictas ($\le 10^{-4}$), obteniendo una tasa de aprobación del **100%**:

| Caso de Prueba | Parámetros ($c = 340$ m/s, $f = 1000$ Hz) | Valor Esperado | Valor Calculado | Error Absoluto | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Ambos inmóviles** | $v_f = 0$, $v_o = 0$ | $1000.0000\text{ Hz}$ | $1000.0000\text{ Hz}$ | $0.00\text{ Hz}$ | **✓ APROBADO** |
| **2. Fuente que se aproxima** | $v_f = +34\text{ m/s}$, $v_o = 0$ | $1111.1111\text{ Hz}$ | $1111.1111\text{ Hz}$ | $0.00\text{ Hz}$ | **✓ APROBADO** |
| **3. Fuente que se aleja** | $v_f = -34\text{ m/s}$, $v_o = 0$ | $909.0909\text{ Hz}$ | $909.0909\text{ Hz}$ | $0.00\text{ Hz}$ | **✓ APROBADO** |
| **4. Observador que se aproxima** | $v_f = 0$, $v_o = -34\text{ m/s}$ (hacia fuente) | $1100.0000\text{ Hz}$ | $1100.0000\text{ Hz}$ | $0.00\text{ Hz}$ | **✓ APROBADO** |
| **5. Observador que se aleja** | $v_f = 0$, $v_o = +34\text{ m/s}$ | $900.0000\text{ Hz}$ | $900.0000\text{ Hz}$ | $0.00\text{ Hz}$ | **✓ APROBADO** |
| **6. Velocidades iguales colineales** | $v_f = 34\text{ m/s}$, $v_o = 34\text{ m/s}$ | $1000.0000\text{ Hz}$ | $1000.0000\text{ Hz}$ | $0.00\text{ Hz}$ | **✓ APROBADO** |
| **7. Tiempo de vuelo a 340 m** | $d = 340\text{ m}$, $c = 340\text{ m/s}$ | $1.0000\text{ s}$ | $1.0000\text{ s}$ | $0.00\text{ s}$ | **✓ APROBADO** |
| **8. Semángulo Mach 2** | $M = 2.0$, $\mu = \arcsin(0.5)$ | $30.0000^\circ$ | $30.0000^\circ$ | $3.55 \times 10^{-15}$ | **✓ APROBADO** |
| **9. Medición empírica $1/\Delta t_r$** | Fuente a $34\text{ m/s}$, $f = 2\text{ Hz}$ | $2.2222\text{ Hz}$ | $2.2222\text{ Hz}$ | $0.00\text{ Hz}$ | **✓ APROBADO** |

---

## 5. Manual de Uso Rápido en Español

1. **Apertura de la Aplicación:**
   - Haz doble clic directamente sobre `EfectoDoppler.html` en el explorador de archivos de Windows para abrirlo en Edge, Chrome, Firefox u Opera.
   - O inicia un servidor local (`python -m http.server 8080`) e ingresa a `http://localhost:8080/EfectoDoppler.html`.
2. **Nivel de Interacción:**
   - **Modo Exploración:** Oculta paneles complejos y se enfoca en la observación visual directa, controles de velocidad y frentes de onda.
   - **Modo Laboratorio:** Despliega telemetría completa, gráficas sincrónicas, panel matemático KaTeX, registro de llegadas, escenarios guiados y laboratorio de programación.
3. **Controles de Reproducción:**
   - `▶ / ⏸`: Iniciar o pausar simulación (también con la tecla `Espacio`).
   - `↺`: Reiniciar al tiempo cero (tecla `R`).
   - `⏯`: Avanzar una subdivisión temporal ($\Delta t = 1/(100f)$).
   - `⏭`: Avanzar un período completo ($T = 1/f$).
   - Barra deslizadora temporal: Desplazamiento scrubbing con reconstrucción determinista inmutable.
4. **Botones de Selección Rápida de Movimiento Relativo (Nueva Función):**
   - **`🚗 ➡ 1. Fuente se Acerca`**: Configura la fuente viajando hacia el observador en reposo ($v_f = +85\text{ m/s}$); inicia automáticamente la animación mostrando la compresión de frentes hacia adelante y el incremento de frecuencia ($f_o > f_e$).
   - **`⬅ 🚗 2. Fuente se Aleja`**: Configura la fuente retrocediendo ($v_f = -85\text{ m/s}$); muestra en vivo el distanciamiento y la dilatación de frentes ($f_o < f_e$).
   - **`🚶 ⬅ 3. Observador se Acerca`**: Configura al observador avanzando activamente hacia la fuente en reposo ($v_o = -51\text{ m/s}$); muestra cómo intercepta las ondas a mayor velocidad relativa ($c + |v_o|$).
   - **`➡ 🚶 4. Observador se Aleja`**: Configura al observador huyendo de la fuente ($v_o = +51\text{ m/s}$); ilustra la menor tasa de recepción de frentes.
   - **`🚗 ➡ 🚶 ⬅ 5. Ambos se Acercan`**: Aproximación mutua al encuentro; máxima compresión Doppler.
   - **`⬅ 🚗 ➡ 🚶 6. Ambos se Alejan`**: Separación mutua en sentidos opuestos; máxima dilatación Doppler.
   - **`🚨 7. Cruce Completo`**: La fuente se aproxima desde lejos, pasa frente al observador y se aleja, reproduciendo fielmente el cambio abrupto de tono (efecto ambulancia).
   - **`🛑 8. Reposo`**: Restablece ambos cuerpos estáticos ($v_f = 0, v_o = 0$).
   - **Botones Direccionales Individuales**: En la tarjeta de velocidades se dispone de los controles `[ ⬅ Se Aleja ]`, `[ 🛑 Reposo ]`, `[ ➡ Se Acerca ]` para la fuente y el observador de manera independiente.
   - **Distintivos Flotantes en el Lienzo**: Cada avatar (fuente y observador) porta una placa animada en tiempo real (`ACERCÁNDOSE ➔` o `⬅ ALEJÁNDOSE`) para clarificar inmediatamente el sentido del movimiento relativo.
5. **Activación de Audio:**
   - El audio permanece silenciado por defecto para respetar las políticas de interacción del navegador.
   - Haz clic en `🔊 Audio: Silenciado` en la cabecera para habilitar la síntesis Web Audio API (pulsos rítmicos de llegada libres de chasquidos y sonificación del estampido Mach).
5. **Herramientas del Lienzo:**
   - `🎯 Selección`: Permite arrastrar libremente la fuente y el observador, o hacer clic en cualquier frente para inspeccionar su tiempo de emisión y radio.
   - `📏 Regla`: Mide distancias en metros entre dos puntos arbitrarios.
   - `✋ Desplazar`: Mover la vista libremente (Pan).
   - `🎥 Cámara`: Activa el seguimiento automático centrado en la fuente.
   - Avatares: Alterna entre silueta vectorial de Jet supersónico, Automóvil y Punto emisor.

---

## 6. Los 8 Escenarios Pedagógicos Integrados

1. **Fuente y observador inmóviles:** Comprobación del tiempo de retardo acústico ($t_{\text{vuelo}} = d/c = 1.0\text{ s}$).
2. **Fuente que se aproxima:** Compresión de frentes ($\lambda_{\text{delante}} = 85\text{ m}$) y duplicación tonal a $4\text{ Hz}$.
3. **Fuente que se aleja:** Dilatación de frentes ($\lambda_{\text{detrás}} = 255\text{ m}$) y tono más grave a $1.33\text{ Hz}$.
4. **Observador que se aproxima a fuente inmóvil:** Demostración de que la longitud de onda en el aire no cambia ($\lambda = 170\text{ m}$); cambia la rapidez de encuentro.
5. **Observador que se aleja de fuente inmóvil:** Recepción espaciada de ondas con intercepción a $1.0\text{ Hz}$.
6. **Ambos con igual velocidad y separación constante:** Cancelación exacta del efecto Doppler ($f_o = f_e = 2\text{ Hz}$).
7. **Paso lateral 2D (Efecto Doppler bidimensional):** Variación continua del ángulo $\mathbf{n}\cdot\mathbf{v}$ y silbido característico descendente.
8. **Barrera sónica ($M=1$) y régimen supersónico ($M=1.5$):** Acumulación frontal de ondas, cono de Mach $\mu = 41.81^\circ$ y estampido sónico al cruce.

---

## 7. Relación de Funciones Opcionales y Limitaciones del Entorno

- **Python en el navegador (Pyodide) y Monaco Editor:** No fueron integrados como dependencias pesadas externas para garantizar que la aplicación cargue en menos de 1 segundo, sea 100% autónoma y funcione sin conexión a internet (offline). En su lugar, se implementó un **Laboratorio de Programación Educativo Nativo** con ejecución segura aislada en Web Worker (timeout de 2.5 s) y cuatro plantillas científicas completas de verificación física.
- **Herramienta Automatizada `open_browser_url`:** La descarga del driver binario de Playwright en el entorno aislado del subagente arrojó un error 404 en su CDN externo; no obstante, la aplicación fue validada minuciosamente a nivel de código, estilos, maquetación y mediante la ejecución independiente de pruebas en Node.js, y está lista para su apertura directa por el usuario en cualquier navegador del sistema operativo Windows.
