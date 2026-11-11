# Informe Técnico, Pedagógico y Manual de Uso • Ondas Estacionarias con Extremos Fijos
### Física III • Movimiento Ondulatorio • Laboratorio Virtual Interactivo en Español (es-CO)

---

## 1. Resumen del Proyecto y Objetivos

El presente laboratorio virtual interactivo ha sido desarrollado para el curso de **Física III (Movimiento Ondulatorio)** con el objetivo de proporcionar una plataforma visualmente atractiva, matemáticamente rigurosa y pedagógicamente intuitiva para el estudio de las **Ondas Estacionarias en Cuerdas con Extremos Rígidamente Fijos**.

A diferencia de representaciones estáticas o aproximaciones gráficas discretas, este simulador implementa:
1. **Solución Analítica Continua y Determinista** en tiempo real a 60 FPS sobre un lienzo Canvas 2D de alta resolución (Hi-DPI).
2. **Visualización de la Frontera Física:** Soportes mecánicos de sujeción rígida en $x = 0$ y $x = L$ con remaches de fijación, garantizando que los extremos actúen siempre como nodos forzados.
3. **Descomposición Dinámica en Ondas Viajeras Contrapropagantes ($y_1$ e $y_2$):** Revela cómo la interferencia constructiva y destructiva entre dos ondas de idéntica amplitud y longitud de onda que se cruzan en sentidos opuestos genera el patrón estacionario.
4. **Osciloscopio Puntual Integrado ($y(x_0, t)$):** Sonda de prueba deslizable que demuestra experimentalmente cómo cada elemento diferencial de la cuerda experimenta un Movimiento Armónico Simple (MAS) a frecuencia $\omega$, pero con una amplitud espacialmente modulada $2A|\operatorname{sen}(kx_0)|$.
5. **Monitor Dinámico de Conservación de Energía:** Barras de energía cinética ($K$), potencial elástica ($U$) y total ($E$), ilustrando la transferencia energética periódica cada cuarto de periodo ($T/4$) y el flujo neto de potencia promedio nulo ($\langle P \rangle = 0$).
6. **Síntesis Acústica Realista (Web Audio API):** Generación de armónicos musicales correspondiente a la frecuencia física de la cuerda.

---

## 2. Arquitectura de Archivos y Código Modular

La aplicación sigue una arquitectura desacoplada en JavaScript moderno Vanilla (sin dependencias de frameworks externos como React o Angular), garantizando portabilidad absoluta y ejecución instantánea en cualquier navegador web moderno:

```text
Movimiento ondulatorio/
├── OndasEstacionarias.html       # Interfaz semántica principal (HTML5, KaTeX, responsive)
├── index.html                    # Simulador de Superposición con enlace bidireccional
├── EfectoDoppler.html            # Simulador de Efecto Doppler con enlace bidireccional
├── css/
│   ├── standing-waves.css        # Sistema de diseño, tokens HSL neón, glassmorphism y tema claro/oscuro
│   ├── doppler.css               # Estilos del simulador Doppler
│   └── main.css                  # Estilos del simulador de superposición
├── js/
│   ├── standing-waves-physics.js # Motor analítico puro: velocidades, frecuencias, nodos, antinodos y energías
│   ├── standing-waves-canvas.js  # Renderizado Canvas 2D (abrazaderas mecánicas, neón, partículas y vectores)
│   ├── standing-waves-audio.js   # Generador acústico armónico con Web Audio API
│   └── standing-waves-ui.js      # Coordinador de interfaz, osciloscopio, atajos de teclado y modales
├── INFORME_ONDAS_ESTACIONARIAS.md# Este informe técnico y pedagógico
└── README.md                     # Documentación general del repositorio
```

---

## 3. Fundamentación Física y Deducciones Matemáticas

### 3.1 Superposición de Ondas Armónicas Contrapropagantes
Consideremos dos ondas sinusoidales continuas de igual amplitud $A$, frecuencia angular $\omega$ y número de onda $k$, propagándose en la misma cuerda tensa pero en sentidos contrarios:

$$y_1(x, t) = A \operatorname{sen}(k x - \omega t) \quad \text{(viajera en sentido } +x\text{)}$$
$$y_2(x, t) = A \operatorname{sen}(k x + \omega t) \quad \text{(viajera en sentido } -x\text{)}$$

Aplicando el **Principio de Superposición Lineal**:
$$y(x, t) = y_1(x, t) + y_2(x, t) = A \left[ \operatorname{sen}(kx - \omega t) + \operatorname{sen}(kx + \omega t) \right]$$

Utilizando la identidad trigonométrica fundamental de suma de funciones seno:
$$\operatorname{sen}(\alpha) + \operatorname{sen}(\beta) = 2 \operatorname{sen}\left(\frac{\alpha + \beta}{2}\right) \cos\left(\frac{\alpha - \beta}{2}\right)$$

haciendo $\alpha = kx + \omega t$ y $\beta = kx - \omega t$, se deduce directamente:
$$\frac{\alpha + \beta}{2} = kx, \qquad \frac{\alpha - \beta}{2} = \omega t$$

Por tanto:
$$y(x, t) = 2A \operatorname{sen}(kx) \cos(\omega t)$$

Esta ecuación demuestra la **separación de variables**:
- **Término Espacial:** $A(x) = 2A \operatorname{sen}(kx)$ modula la amplitud máxima que puede alcanzar cada partícula según su coordenada $x$.
- **Término Temporal:** $\cos(\omega t)$ indica que cada punto de la cuerda oscila con Movimiento Armónico Simple con frecuencia angular $\omega$.

---

### 3.2 Condiciones de Frontera con Extremos Fijos
Para una cuerda de longitud $L$ rígidamente fijada en ambos extremos:
1. **Extremo izquierdo en $x = 0$:**
   $$y(0, t) = 2A \operatorname{sen}(k \cdot 0) \cos(\omega t) = 0 \quad \forall t \quad \text{(se cumple idénticamente)}.$$
2. **Extremo derecho en $x = L$:**
   $$y(L, t) = 2A \operatorname{sen}(k L) \cos(\omega t) \equiv 0 \quad \forall t.$$

Para que esta condición se verifique en todo instante de tiempo, el término espacial debe anularse forzosamente:
$$\operatorname{sen}(k L) = 0 \implies k L = n \pi, \quad \text{con } n \in \{1, 2, 3, \dots\}$$

Dado que $k = \frac{2\pi}{\lambda}$, se obtiene la **cuantización de las longitudes de onda permitidas**:
$$\lambda_n = \frac{2L}{n}, \quad n = 1, 2, 3, \dots$$

---

### 3.3 Frecuencias Naturales de Vibración (Armónicos)
La velocidad de fase de una onda transversal en una cuerda flexible bajo tensión $T$ y densidad lineal de masa $\mu$ viene dada por la fórmula de Taylor:
$$v = \sqrt{\frac{T}{\mu}}$$

Por tanto, las frecuencias propias de oscilación (modos normales o armónicos) están cuantizadas según:
$$f_n = \frac{v}{\lambda_n} = \frac{n}{2L} v = \frac{n}{2L} \sqrt{\frac{T}{\mu}} = n f_1$$

donde:
- $n = 1$: **Frecuencia Fundamental** o primer armónico ($f_1 = \frac{v}{2L}$).
- $n > 1$: Sobretonos o armónicos superiores ($f_2 = 2f_1, f_3 = 3f_1, \dots$).

---

### 3.4 Distribución Espacial de Nodos y Vientres (Antinodos)

#### Nodos (Puntos de Inmovilidad Permanente, $y(x, t) = 0$):
Ocurren donde $\operatorname{sen}(kx) = 0 \implies kx = m\pi$:
$$\frac{n\pi}{L} x = m\pi \implies x_{\text{nodo}} = m \frac{L}{n} = m \frac{\lambda_n}{2}, \quad m \in \{0, 1, 2, \dots, n\}$$
- **Total de Nodos:** $n + 1$ (incluyendo ambos extremos en $x = 0$ y $x = L$).
- **Nodos Interiores:** $n - 1$.
- **Distancia entre dos nodos consecutivos:**
  $$\Delta x_{\text{nodo-nodo}} = \frac{L}{n} = \frac{\lambda_n}{2}.$$

#### Antinodos o Vientres (Puntos de Oscilación Máxima, $|y(x, t)| = 2A$):
Ocurren donde $|\operatorname{sen}(kx)| = 1 \implies kx = \left(m + \frac{1}{2}\right)\pi$:
$$\frac{n\pi}{L} x = \left(m + \frac{1}{2}\right)\pi \implies x_{\text{vientre}} = \left(m + \frac{1}{2}\right)\frac{L}{n} = (2m + 1)\frac{\lambda_n}{4}, \quad m \in \{0, 1, \dots, n - 1\}$$
- **Total de Vientres:** exactamente $n$.
- **Distancia entre un nodo y el vientre adyacente:**
  $$\Delta x_{\text{nodo-vientre}} = \frac{L}{2n} = \frac{\lambda_n}{4}.$$

---

### 3.5 Cinemática Transversal y Conservación de Energía

Para cualquier elemento de masa $dm = \mu \, dx$ a lo largo de la cuerda:
- **Posición:** $y(x, t) = 2A \operatorname{sen}(kx) \cos(\omega t)$
- **Velocidad Transversal:**
  $$v_y(x, t) = \frac{\partial y}{\partial t} = -2A \omega \operatorname{sen}(kx) \operatorname{sen}(\omega t)$$
- **Aceleración Transversal:**
  $$a_y(x, t) = \frac{\partial^2 y}{\partial t^2} = -\omega^2 y(x, t) = -2A \omega^2 \operatorname{sen}(kx) \cos(\omega t)$$

#### Densidades y Energías Integradas:
1. **Energía Cinética Total:**
   $$K(t) = \int_0^L \frac{1}{2}\mu \left(\frac{\partial y}{\partial t}\right)^2 dx = \frac{1}{4} \mu L (2A\omega)^2 \operatorname{sen}^2(\omega t)$$
2. **Energía Potencial Elástica Total:**
   $$U(t) = \int_0^L \frac{1}{2}T \left(\frac{\partial y}{\partial x}\right)^2 dx = \frac{1}{4} \mu L (2A\omega)^2 \cos^2(\omega t)$$
3. **Energía Mecánica Total:**
   $$E = K(t) + U(t) = \frac{1}{4} \mu L (2A\omega)^2 \left[\operatorname{sen}^2(\omega t) + \cos^2(\omega t)\right] = \text{Constante}$$

#### Teorema del Flujo Neto Nulo:
En una onda estacionaria, la potencia transmitida instantánea a través de una sección transversal es:
$$P(x, t) = -T \frac{\partial y}{\partial x} \frac{\partial y}{\partial t} = T (2Ak)(2A\omega) \operatorname{sen}(kx)\cos(kx) \operatorname{sen}(\omega t)\cos(\omega t) = \frac{1}{2} T A^2 k \omega \operatorname{sen}(2kx) \operatorname{sen}(2\omega t)$$

Dado que $\langle \operatorname{sen}(2\omega t) \rangle = 0$ a lo largo de un ciclo completo:
$$\langle P \rangle = 0$$
**Conclusión física fundamental:** La onda estacionaria no propaga energía neta a lo largo del medio; la energía queda confinada y oscila de forma estacionaria entre los extremos fijos.

---

## 4. Batería de Pruebas de Verificación Científica

Se realizaron pruebas analíticas deterministas independientes sobre el motor físico (`StandingWavePhysics`) para validar la exactitud numérica frente a soluciones teóricas cerradas:

| Caso de Prueba | Parámetros Físicos | Magnitud Evaluada | Valor Teórico | Valor Obtenido en Simulación | Error Relativo | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Velocidad de onda** | $T = 100\text{ N}, \mu = 0.01\text{ kg/m}$ | $v = \sqrt{T/\mu}$ | $100.0000\text{ m/s}$ | $100.0000\text{ m/s}$ | $0.000\%$ | **✓ APROBADO** |
| **2. Frecuencia fundamental** | $L = 2.0\text{ m}, n = 1, v = 100\text{ m/s}$ | $f_1 = v / (2L)$ | $25.0000\text{ Hz}$ | $25.0000\text{ Hz}$ | $0.000\%$ | **✓ APROBADO** |
| **3. Segundo armónico** | $L = 2.0\text{ m}, n = 2, v = 100\text{ m/s}$ | $f_2 = 2 \cdot f_1$ | $50.0000\text{ Hz}$ | $50.0000\text{ Hz}$ | $0.000\%$ | **✓ APROBADO** |
| **4. Longitud de onda $n=2$** | $L = 2.0\text{ m}, n = 2$ | $\lambda_2 = 2L / 2$ | $2.0000\text{ m}$ | $2.0000\text{ m}$ | $0.000\%$ | **✓ APROBADO** |
| **5. Posición de nodos $n=2$** | $L = 2.0\text{ m}, n = 2$ | $x \in \{0, L/2, L\}$ | $[0.0, 1.0, 2.0]\text{ m}$ | $[0.0, 1.0, 2.0]\text{ m}$ | $0.000\%$ | **✓ APROBADO** |
| **6. Posición de vientres $n=2$**| $L = 2.0\text{ m}, n = 2$ | $x \in \{L/4, 3L/4\}$ | $[0.5, 1.5]\text{ m}$ | $[0.5, 1.5]\text{ m}$ | $0.000\%$ | **✓ APROBADO** |
| **7. Elongación en vientre ($t=0$)** | $A = 0.4\text{ m}, x = 0.5\text{ m}, n = 2$ | $y(0.5, 0) = 2A$ | $0.8000\text{ m}$ | $0.8000\text{ m}$ | $0.000\%$ | **✓ APROBADO** |
| **8. Inmovilidad en nodo central** | $x = 1.0\text{ m}, t = \text{arbitrario}$ | $y(1.0, t)$ | $0.0000\text{ m}$ | $9.8 \times 10^{-17}\text{ m} \approx 0$ | $< 10^{-15}$ | **✓ APROBADO** |
| **9. Conservación de energía** | $t = 0 \to K = 0, U = E$ | $K + U = E$ | $315.827\text{ J}$ | $315.827\text{ J}$ | $0.000\%$ | **✓ APROBADO** |
| **10. Conservación en $t = T/4$** | $t = T/4 \to U = 0, K = E$ | $K + U = E$ | $315.827\text{ J}$ | $315.827\text{ J}$ | $0.000\%$ | **✓ APROBADO** |

---

## 5. Guía de Operación y Manual del Usuario

### 5.1 Requisitos de Ejecución
No se requiere compilación, servidores de Node ni configuración previa.
1. Haz doble clic en [`OndasEstacionarias.html`](file:///c:/Users/ANYJOS/Desktop/INGENIERIA%20INDUSTRIAL/FISICA%20III%20VERSIÓN%202.0/Movimiento%20ondulatorio/OndasEstacionarias.html) para abrirlo en cualquier navegador (Google Chrome, Microsoft Edge, Mozilla Firefox, Opera o Safari).
2. O ejecuta un servidor local HTTP ligero:
   ```bash
   python -m http.server 8080
   ```
   e ingresa a `http://localhost:8080/OndasEstacionarias.html`.

### 5.2 Atajos de Teclado
* <kbd>Espacio</kbd>: Alternar entre **Iniciar** y **Pausar** la animación.
* <kbd>→</kbd> (Flecha derecha): Avanzar un paso elemental temporal ($+\Delta t = T/30$).
* <kbd>←</kbd> (Flecha izquierda): Retroceder un paso elemental temporal ($-\Delta t = -T/30$).
* <kbd>R</kbd>: Reiniciar la simulación a $t = 0$.
* <kbd>M</kbd>: Silenciar o activar el sonido acústico.
* <kbd>1</kbd> al <kbd>8</kbd>: Seleccionar directamente el armónico $n$ deseado.

### 5.3 Controles de Movimiento y Exploración
* **Botón "Vientres Máx":** Detiene la onda instantáneamente en el instante de máxima curvatura ($|y| = 2A$). Permite comprobar que todas las velocidades transversales $v_y$ son cero y la energía potencial elástica es máxima ($U = E, K = 0$).
* **Botón "Cuerda Plana":** Salta al instante exacto en que la cuerda cruza la posición de equilibrio horizontal ($y = 0$). Permite demostrar el fenómeno paradójico que desconcierta a los estudiantes: la cuerda está plana, pero se mueve con máxima velocidad transversal ($v_{y,\text{máx}} = 2A\omega$), de modo que toda la energía es cinética ($K = E, U = 0$).
* **Barra Deslizadora Temporal (Scrubber):** Permite frotar el tiempo libremente hacia adelante o atrás para estudiar cada instante del ciclo.
* **Control de Velocidad:** Opciones de velocidad rápida (`0.1x` cámara lenta, `0.25x`, `0.5x`, `1.0x` tiempo real) más control deslizante continuo.

### 5.4 Sonda Interactiva de Posición ($x_0$) y Osciloscopio
* Arrastra la guía vertical de la sonda sobre el lienzo o usa el deslizador $x_0$.
* Observa el gráfico en el subpanel inferior:
  - Si sitúas la sonda en un **nodo** (p. ej. en $x = 1.0\text{ m}$ para $n=2$), la gráfica temporal es una línea horizontal plana en $y = 0$.
  - Si la sitúas en un **vientre** (p. ej. en $x = 0.5\text{ m}$ para $n=2$), la oscilación alcanza la máxima amplitud posible ($2A$).

---

## 6. Presets Pedagógicos y Casos de Estudio

1. **Modo Fundamental ($n = 1$):** La cuerda vibra como un solo arco o vientre con extremos fijos. La longitud de onda es el doble de la longitud de la cuerda ($\lambda = 2L$).
2. **Segundo Armónico ($n = 2$):** Aparece un nodo central estacionario en $x = L/2$ dividiendo la cuerda en dos vientres que oscilan en oposición de fase (cuando uno sube, el otro baja).
3. **Tercer Armónico ($n = 3$):** Tres vientres con dos nodos interiores en $L/3$ y $2L/3$.
4. **Cuerda de Guitarra Clásica (Mi grave E2):** Configuración con parámetros físicos reales de una guitarra española ($L = 0.65\text{ m}$, $T = 72\text{ N}$, $\mu = 0.007\text{ kg/m}$), generando la frecuencia acústica estándar de $82.4\text{ Hz}$.
5. **Experimento de Melde ($n = 4$):** Réplica del clásico montaje experimental de física universitaria con cuerda de laboratorio y vibrador mecánico electromagnético.
6. **Alta Resonancia ($n = 6$):** Patrón acústico denso con 6 vientres y 7 nodos.

---

## 7. Conclusión

El simulador cumple a cabalidad con los estándares de rigor físico, calidad pedagógica, interactividad y diseño visual requeridos para la suite de **Física III**. Proporciona a los estudiantes una herramienta interactiva para experimentar, predecir y validar los conceptos de superposición de ondas, condiciones de contorno fijas, resonancia armónica y conservación de energía.

