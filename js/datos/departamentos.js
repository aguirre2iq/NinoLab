/* ==========================================================
   NiñoLab · datos/departamentos.js
   Los 25 departamentos, las variables que se investigan
   y las opciones del perfil.
   ========================================================== */
window.NL = window.NL || {};

/* id, nombre, capital, [lat, lon] de la capital, [lat, lon] de la etiqueta en el mapa,
   punto de mar frente a su costa (o null), lluvia y temperatura típicas (solo para el modo sin conexión) */
NL.DEPARTAMENTOS = [
  ['tum', 'Tumbes', 'Tumbes', [-3.57, -80.45], [-3.85, -80.55], [-3.6, -81.0], 450, 26],
  ['piu', 'Piura', 'Piura', [-5.19, -80.63], [-5.15, -80.35], [-5.1, -81.6], 180, 25],
  ['lam', 'Lambayeque', 'Chiclayo', [-6.77, -79.84], [-6.3, -79.85], [-6.9, -80.6], 60, 23],
  ['lib', 'La Libertad', 'Trujillo', [-8.11, -79.03], [-7.95, -78.4], [-8.2, -79.8], 250, 19],
  ['caj', 'Cajamarca', 'Cajamarca', [-7.16, -78.51], [-6.4, -78.8], null, 800, 15],
  ['ama', 'Amazonas', 'Chachapoyas', [-6.23, -77.87], [-5.0, -78.0], null, 1300, 20],
  ['lor', 'Loreto', 'Iquitos', [-3.75, -73.25], [-4.4, -74.6], null, 2900, 27],
  ['sam', 'San Martín', 'Moyobamba', [-6.03, -76.97], [-7.2, -76.75], null, 1400, 25],
  ['anc', 'Áncash', 'Huaraz', [-9.53, -77.53], [-9.45, -77.65], [-9.1, -79.3], 500, 14],
  ['hua', 'Huánuco', 'Huánuco', [-9.93, -76.24], [-9.4, -76.0], null, 1000, 18],
  ['uca', 'Ucayali', 'Pucallpa', [-8.38, -74.55], [-9.6, -73.6], null, 1700, 26],
  ['cal', 'Callao', 'Callao', [-12.06, -77.13], [-12.05, -77.75], [-12.05, -77.8], 15, 19],
  ['lim', 'Lima', 'Lima', [-12.05, -77.04], [-11.6, -76.6], [-12.4, -77.6], 100, 18],
  ['pas', 'Pasco', 'Cerro de Pasco', [-10.68, -76.26], [-10.4, -75.4], null, 900, 10],
  ['jun', 'Junín', 'Huancayo', [-12.07, -75.21], [-11.5, -74.85], null, 900, 13],
  ['mdd', 'Madre de Dios', 'Puerto Maldonado', [-12.59, -69.19], [-11.95, -70.5], null, 2300, 26],
  ['ica', 'Ica', 'Ica', [-14.07, -75.73], [-14.25, -75.6], [-13.8, -77.0], 20, 21],
  ['hvc', 'Huancavelica', 'Huancavelica', [-12.79, -74.97], [-13.0, -75.0], null, 750, 10],
  ['aya', 'Ayacucho', 'Ayacucho', [-13.16, -74.22], [-14.1, -74.05], null, 650, 14],
  ['cus', 'Cusco', 'Cusco', [-13.53, -71.97], [-13.2, -72.1], null, 750, 12],
  ['are', 'Arequipa', 'Arequipa', [-16.40, -71.54], [-15.85, -72.5], [-17.1, -72.8], 120, 15],
  ['apu', 'Apurímac', 'Abancay', [-13.64, -72.88], [-14.05, -72.95], null, 800, 14],
  ['pun', 'Puno', 'Puno', [-15.84, -70.02], [-15.0, -70.0], null, 700, 9],
  ['moq', 'Moquegua', 'Moquegua', [-17.19, -70.93], [-16.85, -70.85], [-17.7, -72.0], 80, 16],
  ['tac', 'Tacna', 'Tacna', [-18.01, -70.25], [-17.65, -70.25], [-18.4, -71.1], 60, 17]
].map(a => ({ id: a[0], nombre: a[1], capital: a[2], punto: a[3], etiqueta: a[4], mar: a[5], costa: !!a[5], lluvia: a[6], temp: a[7] }));

NL.DEP = Object.fromEntries(NL.DEPARTAMENTOS.map(d => [d.id, d]));
NL.DEP_ORDENADOS = NL.DEPARTAMENTOS.slice().sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
NL.COSTA_NORTE = ['tum', 'piu', 'lam', 'lib'];

/* Años con El Niño fuerte o costero documentado (para el contexto de los años excepcionales) */
NL.AÑOS_NIÑO = [1982, 1983, 1987, 1992, 1997, 1998, 2015, 2016, 2017, 2023, 2024];

/* Variables que el motor sabe investigar. Todas salen de NASA POWER. */
NL.VARIABLES = {
  pr:  { nombre: 'Precipitación',        unidad: 'mm/año', parametro: 'PRECTOTCORR', fuente: 'NASA POWER (PRECTOTCORR)', desde: 1981, dec: 0, relativa: true,
         frase: 'las lluvias', plural: true },
  t2m: { nombre: 'Temperatura del aire', unidad: '°C',     parametro: 'T2M',         fuente: 'NASA POWER (T2M)',         desde: 1981, dec: 1, relativa: false,
         frase: 'la temperatura del aire' },
  sm:  { nombre: 'Humedad del suelo',    unidad: '%',      parametro: 'GWETTOP',     fuente: 'NASA POWER (GWETTOP)',     desde: 1981, dec: 0, relativa: false,
         frase: 'la humedad del suelo' },
  sst: { nombre: 'Temperatura del mar',  unidad: '°C',     parametro: 'TS',          fuente: 'NASA POWER (TS, mar)',     desde: 1981, dec: 1, relativa: false,
         frase: 'la temperatura del mar', soloCosta: true }
};

/* Perfil: actividad */
NL.SECTORES = {
  agro:  { nombre: 'Agricultura', corto: 'Agro', pista: 'Lluvias, calor y humedad del suelo', variable: 'pr',
           icono: '<path d="M12 21V9"/><path d="M12 13c-4 0-6-3-6-6 4 0 6 3 6 6Z"/><path d="M12 11c0-3 2-6 6-6 0 3-2 6-6 6Z"/>' },
  pesca: { nombre: 'Pesca', corto: 'Pesca', pista: 'Temperatura y anomalías del mar', variable: 'sst',
           icono: '<path d="M3 12c3-4 9-5 13-2l4-3v10l-4-3c-4 3-10 2-13-2Z"/><circle cx="8.5" cy="11" r="1"/>' },
  gana:  { nombre: 'Ganadería', corto: 'Ganadería', pista: 'Temperatura, lluvia y pastos', variable: 't2m',
           icono: '<path d="M5 9c0-2 2-4 4-4h6c2 0 4 2 4 4v4c0 3-3 6-7 6s-7-3-7-6Z"/><path d="M5 9 2 7M19 9l3-2"/>' },
  tur:   { nombre: 'Turismo y negocios', corto: 'Turismo', pista: 'Calor y lluvias en tu zona', variable: 't2m',
           icono: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>' },
  est:   { nombre: 'Estudiante o investigador', corto: 'Investigación', pista: 'Datos, métodos y reproducibilidad', variable: 'pr',
           icono: '<path d="M3 9l9-5 9 5-9 5Z"/><path d="M7 11v5c3 2 7 2 10 0v-5"/>' },
  ciu:   { nombre: 'Ciudadano', corto: 'Ciudadano', pista: 'Cómo cambia mi localidad', variable: 't2m',
           icono: '<path d="M4 21V10l8-6 8 6v11"/><path d="M9 21v-6h6v6"/>' }
};

/* Perfil: preocupación principal */
NL.PREOCUPACIONES = {
  lluvia: { nombre: 'Lluvias intensas', pista: 'Huaicos, inundaciones', variable: 'pr' },
  calor:  { nombre: 'Más calor', pista: 'Olas de calor, estrés', variable: 't2m' },
  mar:    { nombre: 'El mar', pista: 'Agua caliente, pesca', variable: 'sst' },
  seco:   { nombre: 'Sequía', pista: 'Suelo seco, cosechas', variable: 'sm' }
};
