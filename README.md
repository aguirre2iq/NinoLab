# NiñoLab

Detective científico de cambios ambientales en el Perú con datos abiertos de la NASA.
Proyecto para NASA Space Apps Challenge 2026 · Challenge 2: *Be An Earth System Trend Detective!*

## Cómo abrirlo

- **IntelliJ:** File → Open → esta carpeta. Abre `index.html` y pulsa el ícono del navegador (arriba a la derecha del editor).
- **Sin IntelliJ:** doble clic en `index.html`.
- **Link público:** sube la carpeta completa a Netlify Drop o a GitHub Pages.

No hay que instalar nada. Es HTML, CSS y JavaScript puro.

## Carpetas

```
NinoLab/
├── index.html                  Estructura de la página (todas las secciones)
├── css/
│   ├── base.css                Colores, tipografías, botones, figuras decorativas
│   ├── layout.css              Barra de navegación y pie de página
│   ├── inicio.css              Portada y planeta
│   ├── perfil.css              Las 3 preguntas del perfil
│   ├── investigar.css          Formulario y resultado en 3 niveles
│   ├── territorio.css          Mapa del Perú
│   ├── oceano.css              Mapa del Pacífico e índice costero
│   ├── cronologia.css          Línea de tiempo e historias
│   ├── hallazgos-metodo.css    Cuaderno de hallazgos y expediente
│   ├── duke.css                Asistente
│   └── leaflet.css             Estilos de la librería de mapas
└── js/
    ├── main.js                 Arranque y navegación
    ├── util.js                 Funciones compartidas
    ├── graficos.js             Gráficos SVG de la investigación
    ├── duke.js                 Asistente Duke
    ├── datos/
    │   ├── departamentos.js    25 departamentos, variables y opciones del perfil
    │   ├── eventos.js          Episodios de El Niño e historias
    │   ├── indice-costero.js   Índice Niño 1+2 calculado con NASA POWER (1981–2026)
    │   ├── escalas-nasa.js     Escalas de color oficiales de NASA GIBS
    │   ├── peru-geo.js         Límites de departamentos y países vecinos
    │   ├── tierra.js           Continentes para el planeta de la portada
    │   └── tierra-pacifico.js  Tierra para el mapa del océano
    ├── motor/
    │   ├── nasa-power.js       Conexión con NASA POWER
    │   ├── estadistica.js      Mann-Kendall, pendiente de Sen, robustez
    │   ├── interpretacion.js   Convierte los números en explicaciones
    │   └── series-demo.js      Series de ejemplo para cuando no hay internet
    ├── secciones/
    │   ├── inicio.js           Planeta interactivo
    │   ├── perfil.js           Perfil del usuario
    │   ├── investigar.js       Flujo de la investigación
    │   ├── territorio.js       Mapa del Perú con clima de hoy
    │   ├── oceano.js           Mapa del mar con imágenes NASA
    │   ├── indice.js           Índice costero, serie y comparación
    │   ├── cronologia.js       Línea de tiempo
    │   └── hallazgos.js        Investigaciones guardadas
    └── vendor/leaflet.js       Librería de mapas (Leaflet 1.9.4)
```

## De dónde salen los datos

| Sección | Fuente | Tipo |
|---|---|---|
| Investigar | NASA POWER (lluvia, temperatura, humedad del suelo, temperatura de superficie) | Real, desde 1981 |
| Océano (mapa) | NASA GIBS: MUR (temperatura y anomalía), SMAP (salinidad), MEaSUREs (altura del mar), OSCAR (corrientes) | Real; temperatura, anomalía y salinidad al día |
| Índice costero | Calculado con NASA POWER en la región Niño 1+2 | Real; **no es el ICEN oficial del ENFEN** |
| Territorio | Open-Meteo (clima de hoy en cada capital) | Real, fuente complementaria |

Si no hay internet, la página usa ejemplos y lo indica con una etiqueta ámbar.

## Para cambiar cosas

- **Colores:** `css/base.css`, bloque `:root`.
- **Textos de las secciones:** `index.html`.
- **Episodios de la línea de tiempo:** `js/datos/eventos.js`.
- **Preguntas del perfil:** `js/datos/departamentos.js`.
- **Respuestas de Duke:** `js/duke.js`.
