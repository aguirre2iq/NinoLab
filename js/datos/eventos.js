/* ==========================================================
   NiñoLab · datos/eventos.js
   Episodios de El Niño en el Perú y paneles de historias.
   Hechos históricos: verificar con ENFEN, IGP y NOAA.
   ========================================================== */
window.NL = window.NL || {};

NL.EVENTOS = [
  { año: '1578', tipo: 'Registro colonial', titulo: 'Las lluvias de Trujillo', etiqueta: 'Lluvias de 1578',
    mar: 'Las crónicas no midieron el mar, pero describen un calor y lluvias impropias de la costa norte.',
    tierra: 'Documentos coloniales registran lluvias torrenciales e inundaciones en Trujillo y los valles del norte. Es uno de los episodios tipo Niño más antiguos documentados.',
    gente: 'Pérdida de cultivos y daños en la ciudad. Esos registros sirven hoy para reconstruir la historia del fenómeno.' },
  { año: '1892', tipo: 'El nombre', titulo: 'Los marineros de Paita lo bautizan', etiqueta: 'Nace el nombre',
    mar: 'Los pescadores de Paita notaban una corriente cálida que llegaba cerca de Navidad.',
    tierra: 'El geógrafo Luis Carranza la describió en la Sociedad Geográfica de Lima: la llamaban “corriente del Niño”, por el Niño Jesús.',
    gente: 'El nombre local terminó usándose en todo el mundo.' },
  { año: '1925', tipo: 'Niño costero', titulo: 'El primer gran Niño costero', etiqueta: 'Niño costero intenso',
    mar: 'El calentamiento se concentró frente a la costa peruana, sin un evento fuerte en el Pacífico central.',
    tierra: 'Lluvias extraordinarias en Trujillo, Piura y la costa norte; ríos desbordados en pleno desierto.',
    gente: 'Demostró que el mar frente al Perú puede calentarse por su cuenta. Por eso hoy se vigila la región Niño 1+2.' },
  { año: '1972', tipo: 'Pesca', titulo: 'El mar caliente y la anchoveta', etiqueta: 'Crisis de la anchoveta',
    mar: 'Agua cálida frente a la costa y afloramiento debilitado.',
    tierra: 'La pesquería de anchoveta colapsó. El Niño se sumó a años de sobrepesca: no fue una sola causa.',
    gente: 'Golpe fuerte a la pesca industrial y a la economía. Lección: una variable sola no explica la pesca.' },
  { año: '1983', tipo: 'Extraordinario', titulo: 'Norte inundado, sur seco', etiqueta: 'Niño extraordinario',
    mar: 'Uno de los calentamientos más intensos del siglo XX, en el Pacífico central y frente al Perú.',
    tierra: 'Lluvias intensas e inundaciones en Tumbes y Piura, mientras el altiplano de Puno sufría sequía.',
    gente: 'Agricultura, vivienda y carreteras dañadas en el norte; pérdida de cosechas y ganado en el sur.',
    investigar: { lugar: 'piu', variable: 'pr', desde: 1981 } },
  { año: '1998', tipo: 'Extraordinario', titulo: 'El satélite que lo vio venir', etiqueta: 'Niño 1997–98',
    mar: 'El satélite TOPEX/Poseidon (NASA y CNES) registró desde el espacio la onda de agua cálida cruzando el Pacífico.',
    tierra: 'Lluvias extremas en la costa norte. En el desierto de Sechura se formó una gran laguna temporal, conocida como La Niña.',
    gente: 'Puentes, carreteras y cultivos destruidos. Fue el impulso para mejorar los sistemas de alerta.',
    investigar: { lugar: 'piu', variable: 'pr', desde: 1985 } },
  { año: '2017', tipo: 'Niño costero', titulo: 'Huaicos sin aviso del Pacífico', etiqueta: 'Niño costero 2017',
    mar: 'El mar frente al Perú se calentó rápido mientras el Pacífico central seguía casi neutral.',
    tierra: 'Huaicos en Lima y la sierra, y el desborde del río Piura en marzo.',
    gente: 'Uno de los desastres recientes más graves del país. Mostró que los índices globales no bastan para la costa peruana.',
    investigar: { lugar: 'piu', variable: 'pr', desde: 1991 } },
  { año: '2023', tipo: 'Niño costero', titulo: 'Ciclón Yaku y un mar muy caliente', etiqueta: 'Niño costero 2023',
    mar: 'Las ondas cálidas cruzaron el Pacífico; el satélite Sentinel-6 Michael Freilich (NASA y ESA) las siguió desde el espacio.',
    tierra: 'En marzo, el ciclón Yaku trajo lluvias intensas a la costa norte y central.',
    gente: 'Inundaciones y una epidemia de dengue en el norte. El calor del mar también afectó la pesca de anchoveta.',
    investigar: { lugar: 'tum', variable: 'sst', desde: 1991 } }
  /* El episodio "Hoy" se agrega en secciones/cronologia.js a partir del índice costero real. */
];

NL.HISTORIAS = [
  { clave: 'Sechura · 1998', titulo: 'Una laguna en medio del desierto',
    texto: 'Las lluvias de 1997–98 llenaron una depresión del desierto de Sechura y formaron una laguna temporal de gran tamaño.',
    arte: '<rect width="400" height="130" fill="#F3DDB3"/><path d="M0 95c60-18 120 14 200-4s140 6 200-10v49H0Z" fill="#E6C58A"/><ellipse cx="215" cy="74" rx="120" ry="26" fill="#1F6FB5"/><path d="M130 72c14-6 28 6 42 0s28 6 42 0 28 6 42 0" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".7"/><circle cx="340" cy="30" r="16" fill="#D3202B"/>' },
  { clave: 'Desde el espacio', titulo: 'Los satélites ven llegar el agua caliente',
    texto: 'Las ondas Kelvin elevan el nivel del mar unos centímetros. Los altímetros de la NASA las detectan semanas antes de que lleguen a la costa.',
    arte: '<rect width="400" height="130" fill="#EAF3FB"/><path d="M0 92c40-14 70 14 110 0s70-14 110 0 70 14 110 0 50-10 70-4v42H0Z" fill="#1F6FB5" opacity=".25"/><path d="M0 84c50-30 110-30 160 0s110 30 240-6" fill="none" stroke="#D3202B" stroke-width="4" stroke-linecap="round"/><g transform="translate(300 32) rotate(18)"><rect x="-12" y="-8" width="24" height="16" rx="3" fill="#151112"/><rect x="-44" y="-6" width="28" height="12" fill="#1F6FB5"/><rect x="16" y="-6" width="28" height="12" fill="#1F6FB5"/></g><path d="M292 46 250 86M300 48l-8 44M308 46l26 40" stroke="#151112" stroke-width="1.5" stroke-dasharray="3 5"/>' },
  { clave: 'Ciencia peruana', titulo: 'Por qué el Perú mira la región Niño 1+2',
    texto: 'El ICEN del ENFEN mide el mar frente a nuestra costa. El ONI de NOAA mide el Pacífico central. Pueden contar historias distintas.',
    arte: '<rect width="400" height="130" fill="#FDEEEF"/><path d="M0 65h400" stroke="#D3202B" stroke-dasharray="4 6" opacity=".5"/><rect x="60" y="42" width="180" height="46" fill="none" stroke="#151112" stroke-width="2" stroke-dasharray="6 5"/><text x="150" y="71" text-anchor="middle" font-family="JetBrains Mono, monospace" font-weight="700" font-size="15" fill="#151112">NIÑO 3.4</text><rect x="290" y="65" width="52" height="46" fill="#D3202B"/><text x="316" y="93" text-anchor="middle" font-family="JetBrains Mono, monospace" font-weight="700" font-size="15" fill="#fff">1+2</text><path d="M350 20c-6 30 14 50 6 110h44V20Z" fill="#151112"/>' }
];

/* Avisos oficiales que se conectarán más adelante (no son titulares reales) */
NL.CINTA = [
  '<b>ENFEN</b> · comunicados oficiales del estado de alerta',
  '<b>NASA</b> · nuevas imágenes de temperatura del mar',
  '<b>SENAMHI</b> · avisos de lluvia por región',
  '<b>NOAA</b> · actualización mensual del ONI',
  '<b>IGP</b> · pronóstico de ondas Kelvin'
];
