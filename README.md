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
