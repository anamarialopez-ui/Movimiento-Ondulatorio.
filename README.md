# 🌊 Suite Interactiva de Movimiento Ondulatorio — Física III

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/es/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/es/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/es/docs/Web/JavaScript)
[![KaTeX](https://img.shields.io/badge/KaTeX-007ACC?style=for-the-badge&logo=latex&logoColor=white)](https://katex.org/)
[![Web Audio API](https://img.shields.io/badge/Web%20Audio%20API-FF6F00?style=for-the-badge)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![Licencia](https://img.shields.io/badge/Licencia-MIT-green.svg?style=for-the-badge)](LICENSE)

> Plataforma web interactiva, moderna y matemáticamente rigurosa para la enseñanza, estudio y visualización del **Movimiento Ondulatorio**, **Superposición**, **Ondas Estacionarias** y **Efecto Doppler Acústico**, desarrollada para cursos universitarios de **Física III** en **Ingeniería Industrial**.

---

## 📑 Tabla de Contenidos

- [🌟 Módulos del Proyecto](#-módulos-del-proyecto)
  - [1. Cuaderno Digital Interactivo Argollado](#1-cuaderno-digital-interactivo-argollado)
  - [2. Simulador de Ondas Estacionarias con Extremos Fijos](#2-simulador-de-ondas-estacionarias-con-extremos-fijos)
  - [3. Simulador de Efecto Doppler Acústico](#3-simulador-de-efecto-doppler-acústico)
  - [4. Laboratorio de Superposición Cartesiano (Estilo GeoGebra)](#4-laboratorio-de-superposición-cartesiano-estilo-geogebra)
- [📐 Fundamentos Teóricos y Ecuaciones](#-fundamentos-teóricos-y-ecuaciones)
- [📁 Estructura del Repositorio](#-estructura-del-repositorio)
- [🚀 Instalación y Uso Rápido](#-instalación-y-uso-rápido)
- [⌨️ Atajos de Teclado](#-atajos-de-teclado)
- [📚 Bibliografía y Referencias Académicas](#-bibliografía-y-referencias-académicas)
- [📄 Licencia](#-licencia)

---

## 🌟 Módulos del Proyecto

### 1. Cuaderno Digital Interactivo Argollado
📄 **Archivo principal:** [`index.html`](index.html) *(o [`Cuaderno_Movimiento_Ondulatorio.html`](Cuaderno_Movimiento_Ondulatorio.html))*

Experiencia de estudio inmersiva que emula físicamente un **cuaderno argollado universitario abierto**:
- **Portada y Contraportada con Cierre Físico:** El cuaderno inicia **cerrado** mostrando la portada oficial limpia, con el espiral metálico calzado sobre el margen izquierdo. Al avanzar, la portada gira en 3D (`rotateY(-180deg)`) revelando el cuaderno abierto a dos páginas con argollas centrales. Al llegar al final, se cierra con una contraportada del mismo color de fondo uniforme.
- **Paso de Hojas Tridimensional con Sonido:** Animación suave de giro de hoja con sombras dinámicas y sonido sintético de papel generado por la *Web Audio API*.
- **Controles Inferiores Ergonómicos:** Botones de *«Hoja Anterior»* y *«Hoja Siguiente»*, barra deslizadora (*Scrubber Slider*) e indicador en tiempo real de página y tema.
- **Teoría Oficial del Libro Guía (Serway & Jewett, 10.ª ed., Cap. 16):**
  - **Ondas Viajeras y Armónicas** ($y(x,t) = A\sin(kx \mp \omega t + \phi)$).
  - **Rapidez en Medios y Transferencia de Potencia** ($v = \sqrt{T/\mu}$, $P = \frac{1}{2}\mu\omega^2 A^2 v$).
  - **Ondas Sonoras** ($s(x,t)$, $\Delta P(x,t)$, $v = \sqrt{B/\rho}$, escala en decibeles $\beta = 10\log(I/I_0)$).
  - **Ondas Estacionarias** (condiciones de frontera, cuantización de armónicos $f_n = n\frac{v}{2L}$).
  - **Efecto Doppler** ($f' = f\frac{v + v_O}{v - v_S}$).
  - **Ecuación de Onda Lineal** ($\frac{\partial^2 y}{\partial x^2} = \frac{1}{v^2}\frac{\partial^2 y}{\partial t^2}$).
- **Ejercicios Resueltos Paso a Paso del Final del Libro:**
  - *Problema 1 (pág. 445):* Ondas sísmicas P y S para ubicación del epicentro ($d = 184\text{ km}$).
  - *Problema 11 (pág. 446):* Tensión requerida para aumentar la rapidez en cuerda ($T_2 = 13.5\text{ N}$).
  - *Problema 23 (pág. 447):* Parámetros canónicos de onda sonora de desplazamiento ($s_{\max}, \lambda, v, s, v_{\max}$).
  - *Problema 38 (pág. 448):* Sonar de submarinos en movimiento relativo ($f' = 5298\text{ Hz}$).
  - *Problema 34 (pág. 447):* Cohete detonante, nivel sonoro ($\beta = 108.5\text{ dB}$) y energía liberada ($E = 17.6\text{ kJ}$).
- **Simulaciones Incrustadas:** Las simulaciones interactivas se cargan con el lienzo gráfico en primer plano arriba, sin requerir desplazamientos hacia abajo.

---

### 2. Simulador de Ondas Estacionarias con Extremos Fijos
📄 **Archivo:** [`OndasEstacionarias.html`](OndasEstacionarias.html)

Simulador numérico continuo de alta precisión a 60 FPS:
- **Modos Normales de Resonancia:** Selección de armónicos $n = 1, 2, \dots, 8$. Configurado por defecto en **modo fundamental $n = 1$** y velocidad de animación lenta ($0.10x$) para observación pedagógica.
- **Visualización de Fronteras Mecánicas:** Soportes rígidos de sujeción con remaches en $x = 0$ y $x = L$, garantizando nodos forzados.
- **Descomposición Dinámica:** Muestra cómo dos ondas armónicas contrapropagantes ($y_1$ e $y_2$) interfieren para generar la envolvente estacionaria.
- **Osciloscopio Puntual en Vivo:** Sonda deslizable de prueba en $x_0$ con gráfica temporal $y(x_0, t)$ y lecturas de elongación y velocidad transversal.
- **Monitor de Conservación de Energía:** Barras en tiempo real de energía cinética ($K$), potencial elástica ($U$) y total ($E$).
- **Síntesis Acústica Realista:** Generador de tonos armónicos puros acoplados a la frecuencia física calculada mediante Web Audio API.

---

### 3. Simulador de Efecto Doppler Acústico
📄 **Archivo:** [`EfectoDoppler.html`](EfectoDoppler.html)

Entorno de simulación cinemática y ondulatoria bidimensional:
- **Medio Homogéneo en Reposo:** Emisión determinista de frentes de onda circulares inmutables propagándose a la rapidez del sonido ($c = 343\text{ m/s}$).
- **8 Presets de Movimiento Instantáneo:**
  - Fuente se acerca / aleja con observador en reposo.
  - Observador se acerca / aleja con fuente en reposo.
  - Acercamiento y alejamiento simultáneo mutuo.
  - Fuente subsónica, sónica ($M = 1.0$) y supersónica ($M > 1.0$, con formación del cono y ángulo de Mach $\sin\theta = c/v_S$).
- **Telemetría y Gráficos en Tiempo Real:** Frecuencias teóricas retardadas, mediciones experimentales independientes basadas en la llegada física de frentes y exportador de datos CSV.
- **Audio Espacializado:** Efecto acústico de paso Doppler con pitch transitorio y estampido sónico.

---

### 4. Laboratorio de Superposición Cartesiano (Estilo GeoGebra)
📄 **Archivo:** [`superposicion.html`](superposicion.html)

- **Plano Cartesiano Adaptativo:** Reescalamiento independiente en $X$ e $Y$, papel milimetrado configurable, numeración inteligente en potencias de 1, 2 y 5 y soporte Retina/High-DPI.
- **Gestión Libre de Funciones:** Soporte para ondas sinusoidales, paquetes gaussianos, solitones y trenes de pulsos.
- **Teclado Virtual Matemático:** Entrada rápida de funciones analíticas con previsualización en vivo mediante KaTeX.
- **Inspección Puntual y Análisis de Discontinuidades:** Detección automática de asíntotas y puntos singulares sin artefactos visuales.

---

## 📐 Fundamentos Teóricos y Ecuaciones

### Ecuación de Onda Lineal
$$\frac{\partial^2 y}{\partial x^2} = \frac{1}{v^2} \frac{\partial^2 y}{\partial t^2}$$

### Onda Armónica Unidimensional
$$y(x,t) = A \sin(kx \mp \omega t + \phi)$$
$$\text{donde: } k = \frac{2\pi}{\lambda}, \quad \omega = 2\pi f = \frac{2\pi}{T}, \quad v = \lambda f = \frac{\omega}{k}$$

### Rapidez de Onda en Cuerda Tensada
$$v = \sqrt{\frac{T_s}{\mu}} \qquad \left(\mu = \frac{m}{L}\right)$$

### Potencia Promedio Transmitida
$$P = \frac{1}{2}\mu \omega^2 A^2 v$$

### Ondas Estacionarias (Extremos Fijos)
$$y(x,t) = [2A \sin(kx)] \cos(\omega t)$$
$$\lambda_n = \frac{2L}{n}, \qquad f_n = n\left(\frac{v}{2L}\right) = n f_1 \quad (n = 1, 2, 3, \dots)$$

### Ondas Sonoras y Nivel de Intensidad
$$s(x,t) = s_{\max}\cos(kx - \omega t) \qquad \Delta P(x,t) = \Delta P_{\max}\sin(kx - \omega t)$$
$$v = \sqrt{\frac{B}{\rho}} \qquad \beta = 10\log_{10}\left(\frac{I}{I_0}\right) \quad (I_0 = 1.0\times 10^{-12}\text{ W/m}^2)$$

### Efecto Doppler General
$$f' = f \left(\frac{v \pm v_O}{v \mp v_S}\right)$$

---

## 📁 Estructura del Repositorio

```text
Movimiento ondulatorio/
├── index.html                         # Cuaderno Interactivo Principal (Punto de entrada GitHub Pages)
├── Cuaderno_Movimiento_Ondulatorio.html # Copia del Cuaderno Interactivo Digital
├── OndasEstacionarias.html             # Laboratorio de Ondas Estacionarias con extremos fijos
├── EfectoDoppler.html                 # Laboratorio de Efecto Doppler acústico
├── superposicion.html                 # Laboratorio de Superposición con plano estilo GeoGebra
├── INFORME_ONDAS_ESTACIONARIAS.md     # Informe técnico-pedagógico de ondas estacionarias
├── INFORME_EFECTO_DOPPLER.md          # Informe técnico-pedagógico de efecto Doppler
├── README.md                          # Este documento
├── css/
│   ├── standing-waves.css             # Estilos de ondas estacionarias y modo embed
│   ├── doppler.css                    # Estilos del simulador Doppler y modo embed
│   ├── main.css                       # Estilos del laboratorio de superposición
│   ├── components.css                 # Componentes genéricos de interfaz
│   ├── keyboard.css                   # Estilos del teclado virtual matemático
│   ├── modal.css                      # Estilos de ventanas modales
│   └── geogebra-canvas.css            # Estilos del plano cartesiano interactivo
├── js/
│   ├── standing-waves-physics.js      # Motor analítico físico de ondas estacionarias
│   ├── standing-waves-canvas.js       # Renderizado Canvas 2D de alta resolución (DPI)
│   ├── standing-waves-audio.js        # Motor acústico armónico (Web Audio API)
│   ├── standing-waves-ui.js           # Controlador de interfaz, osciloscopio y eventos
│   ├── doppler-physics.js             # Cinemática de propagación y frentes acústicos
│   ├── doppler-canvas.js              # Renderizado de avatares, frentes y cono de Mach
│   ├── doppler-audio.js               # Síntesis acústica del efecto Doppler
│   ├── doppler-graphs.js              # Gráficas sincronizadas en tiempo real
│   ├── doppler-didactic.js            # Escenarios pedagógicos guiados
│   ├── doppler-code-lab.js            # Laboratorio de código en Web Worker aislado
│   ├── doppler-ui.js                  # Coordinador de interfaz del Efecto Doppler
│   ├── math-engine.js                 # Parser y evaluador matemático seguro
│   ├── renderer.js                    # Renderizado del plano cartesiano GeoGebra
│   ├── state.js                       # Estado reactivo global
│   ├── ui.js                          # Gestión de paneles y controles
│   ├── app.js                         # Inicializador principal de la suite
│   ├── virtual-keyboard.js            # Lógica del teclado virtual matemático
│   ├── modal.js                       # Lógica de modales y diálogos
│   └── didactic.js                    # Casos didácticos preconfigurados
└── imagenes/
    ├── Portada.png                    # Portada del cuaderno argollado
    └── plantilla de contenido}.png    # Textura institucional de papel
```

---

## 🚀 Instalación y Uso Rápido

Este proyecto es **100% cliente (*client-side*)**, sin dependencias de Node.js, Python ni servidores backend. Funciona de inmediato en cualquier navegador web moderno (Google Chrome, Mozilla Firefox, Microsoft Edge, Safari, Opera).

### Opción 1: Clonar y Abrir Localmente
```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/movimiento-ondulatorio.git

# 2. Entrar a la carpeta
cd movimiento-ondulatorio

# 3. Abrir el cuaderno interactivo en el navegador
# En Windows:
start index.html

# En macOS:
open index.html

# En Linux:
xdg-open index.html
```

### Opción 2: Publicar en GitHub Pages
1. Sube el proyecto a tu repositorio de GitHub.
2. Ve a **Settings** > **Pages**.
3. En **Source**, selecciona la rama `main` y la carpeta `/(root)`.
4. Guarda y accede a la URL pública generada para utilizar la suite en línea.

---

## ⌨️ Atajos de Teclado

### En el Cuaderno Interactivo
| Tecla | Acción |
| :---: | :--- |
| `→` o `PageDown` | Avanzar a la siguiente hoja |
| `←` o `PageUp` | Retroceder a la hoja anterior |
| `Clic en Portada` | Abrir el cuaderno en la primera hoja |

### En el Simulador de Ondas Estacionarias
| Tecla | Acción |
| :---: | :--- |
| `Espacio` | Alternar Reproducción / Pausa |
| `R` | Reiniciar animación a $t = 0$ |
| `.` / `,` | Avanzar / Retroceder un paso temporal |
| `1` a `8` | Seleccionar armónico directo ($n=1$ a $n=8$) |
| `M` | Silenciar / Activar audio sintético |
| `T` | Abrir modal de teoría y deducciones |

---

## 📚 Bibliografía y Referencias Académicas

1. **Serway, R. A., & Jewett, J. W. (2019).** *Física para ciencias e ingeniería* (Volumen 1, 10.ª edición en español).
   - **Capítulo 16:** *Movimiento ondulatorio* (pp. 415–450).
   - **Capítulo 17:** *Ondas sonoras y superposición* (pp. 451–480).
   - México: Cengage Learning Editores, S.A. de C.V.
2. **Halliday, D., Resnick, R., & Walker, J. (2018).** *Fundamentos de Física* (10.ª ed., Vol. 1). Grupo Editorial Patria / John Wiley & Sons.
3. **Tipler, P. A., & Mosca, G. (2010).** *Física para la ciencia y la tecnología: Oscilaciones y Ondas* (Vol. 1, 6.ª ed.). Barcelona: Editorial Reverté.
4. **French, A. P. (1974).** *Vibraciones y Ondas* (M.I.T. Introductory Physics Series). Barcelona: Editorial Reverté.

---

## 📄 Licencia

Este proyecto se distribuye bajo la licencia **MIT**. Eres libre de usarlo, modificarlo y distribuirlo con fines académicos, educativos y formativos, citando la autoría original.
