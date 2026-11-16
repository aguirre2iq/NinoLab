/* ==========================================================
   NiñoLab · motor/interpretacion.js
   Convierte los números del análisis en frases sencillas.
   El perfil del usuario solo cambia "¿Qué significa para mí?",
   nunca los resultados.
   ========================================================== */
window.NL = window.NL || {};

NL.interpretar = function (R, depId, variableId, sectorId, esReal) {
  const V = NL.VARIABLES[variableId], dep = NL.DEP[depId], fmt = NL.fmt;
  const cant = x => `${fmt(x, V.dec)} ${V.unidad}`;
  const sube = R.mk.sen > 0, pl = !!V.plural, frase = V.frase, Frase = frase[0].toUpperCase() + frase.slice(1);
  const verboCambio = sube ? (pl ? 'aumentaron' : 'aumentó') : (pl ? 'disminuyeron' : 'disminuyó');

  // Cifra principal: % para lluvia, diferencia directa para el resto
  const dif = R.tipicoFinal - R.tipicoInicio;
  const pct = V.relativa ? (R.tipicoFinal / R.tipicoInicio - 1) * 100 : null;
  const cambioTxt = V.relativa
    ? `${fmt(Math.abs(pct), 0)} % ${pct >= 0 ? 'más' : 'menos'}`
    : `${NL.signo(dif, V.unidad === '%' ? 0 : 1)} ${V.unidad === '%' ? 'puntos' : V.unidad}`;

  const añosExc = R.excepcionales.map(p => p.año).sort();
  const conNiño = añosExc.filter(a => NL.AÑOS_NIÑO.includes(a));

  // Título específico (nunca genérico)
  let titulo;
  if (R.estado === 'ok') titulo = `${Frase} en ${dep.nombre} ${verboCambio} de forma sostenida entre ${R.añoInicio} y ${R.añoFin}`;
  else if (añosExc.length) titulo = `En ${dep.nombre}, ${frase} ${pl ? 'dependen' : 'depende'} más de años como ${añosExc.slice(0, 2).join(' y ')} que de una tendencia`;
  else titulo = `${Frase} en ${dep.nombre}: variaciones de año a año sin una tendencia clara (${R.añoInicio}–${R.añoFin})`;

  // Conclusión
  let conclusion;
  if (R.estado === 'ok')
    conclusion = `Durante ${R.añoInicio}–${R.añoFin}, ${frase} en ${dep.nombre} ${verboCambio} de manera progresiva. Aunque hubo años que se salieron de lo normal, la tendencia se mantiene incluso al quitar los dos años más extremos.`;
  else if (R.estado === 'inc')
    conclusion = R.cobertura < 0.8
      ? `Faltan demasiados datos en ${dep.nombre} para dar una conclusión firme sobre ${frase}.`
      : `Los datos de ${dep.nombre} muestran un cambio en ${frase}, pero depende sobre todo de ${añosExc.length ? 'los años ' + añosExc.slice(0, 2).join(' y ') : 'unos pocos años'}. Al quitarlos, la tendencia ya no se sostiene, así que no podemos afirmarla.`;
  else
    conclusion = `${Frase} en ${dep.nombre} ${pl ? 'subieron y bajaron' : 'subió y bajó'} año a año, pero no hay evidencia suficiente de una tendencia sostenida entre ${R.añoInicio} y ${R.añoFin}. Eso no prueba que no haya cambio: significa que los datos no alcanzan para afirmarlo.`;

  // La historia del período completo
  const e = R.etapas, tip = V.relativa ? 'mediana' : 'media', tuvo = pl ? 'tuvieron' : 'tuvo';
  const historia = [
    { t: 'Al inicio', p: `Entre ${R.primeros[0].año} y ${R.primeros[R.primeros.length - 1].año}, ${frase} ${tuvo} un valor típico de ${cant(R.tipicoInicio)}.` },
    { t: 'En el medio', p: `En la etapa ${e[1].añoInicio}–${e[1].añoFin} el valor típico fue ${cant(e[1][tip])}, frente a ${cant(e[0][tip])} en la primera etapa.` },
    { t: 'Años excepcionales', p: añosExc.length
        ? `${añosExc.join(', ')} ${añosExc.length > 1 ? 'se apartaron' : 'se apartó'} mucho de lo habitual${conNiño.length ? `; ${conNiño.length === añosExc.length ? (añosExc.length > 1 ? 'todos coinciden' : 'coincide') : conNiño.join(' y ') + (conNiño.length > 1 ? ' coinciden' : ' coincide')} con años de El Niño` : ''}.`
        : `Ningún año se apartó de forma extrema de la referencia ${R.referencia}.` },
    { t: 'Lo más reciente', p: `Entre ${R.ultimos[0].año} y ${R.ultimos[R.ultimos.length - 1].año}, el valor típico fue ${cant(R.tipicoFinal)}: ${cambioTxt} que al inicio.` }
  ];

  // Observaciones
  const obs = [`Se analizaron ${R.n} de ${R.serie.length} años (${fmt(R.cobertura * 100, 0)} % de cobertura).`];
  if (R.excepcionales.length) obs.push(`El año más extremo fue ${R.excepcionales[0].año}, con ${cant(R.excepcionales[0].valor)} frente a una referencia de ${cant(R.base)}.`);
  obs.push(`La pendiente estimada es ${NL.signo(R.mk.sen * 10, V.dec + 1)} ${V.unidad} por década.`);
  if (R.estado === 'ok' && R.relevancia < 0.5) obs.push('El cambio es estadísticamente claro pero pequeño frente a la variación normal de un año a otro.');
  if (R.estado === 'ok' && R.relevancia >= 1) obs.push('El cambio acumulado es mayor que la variación normal entre años: tiene relevancia práctica.');

  // ¿Qué significa para mí? (según el sector del perfil)
  const SIGNIFICA = {
    agro: { pr: 'Las lluvias definen siembras, riego y riesgo de huaicos. Los años excepcionales pesan más que el promedio: planifica para ellos.', t2m: 'Más calor acelera la evaporación y puede adelantar los ciclos de cultivo. Revisa la humedad del suelo junto con esta variable.', sm: 'La humedad del suelo es la reserva de agua del cultivo. Compárala con la lluvia para saber si el problema es falta de lluvia o más evaporación.', sst: 'Un mar más cálido frente a tu costa suele anticipar lluvias en el norte. Úsalo como señal para vigilar los avisos oficiales.' },
    pesca: { pr: 'Las lluvias intensas aumentan los caudales y los sedimentos que llegan al mar cerca de los ríos.', t2m: 'La temperatura del aire acompaña al mar pero no lo reemplaza. Para tu actividad, revisa la temperatura del mar.', sm: 'Esta variable es terrestre. Para tu actividad, revisa la temperatura del mar.', sst: 'El agua más cálida puede cambiar dónde se concentran algunas especies. La temperatura sola no prueba cambios en la pesca: compárala con los reportes de desembarque.' },
    gana: { pr: 'La lluvia determina la disponibilidad de pastos y de agua para los animales.', t2m: 'El calor sostenido aumenta el estrés de los animales y su demanda de agua.', sm: 'Un suelo más seco reduce el crecimiento de los pastos.', sst: 'Un mar cálido en el norte suele traer lluvias que cambian los pastos costeros.' },
    tur: { pr: 'Los años de lluvias extremas afectan carreteras y accesos. Tómalos en cuenta al planificar temporadas.', t2m: 'Más calor cambia la temporada alta y la demanda de servicios.', sm: 'Útil para actividades al aire libre y paisajes.', sst: 'El mar más cálido cambia la experiencia de playa y la temporada.' },
    est: { pr: 'Revisa el expediente: método, cobertura y robustez están en la pestaña Verificar.', t2m: 'Compara con estaciones de SENAMHI para validar la serie de reanálisis.', sm: 'GWETTOP es un producto de modelo (MERRA-2); contrástalo con SMAP desde 2015.', sst: 'Contrasta con el ICEN del ENFEN para la región Niño 1+2.' },
    ciu: { pr: 'Si vives cerca de quebradas o ríos, los años excepcionales son los que más riesgo traen.', t2m: 'Más calor afecta la salud, el consumo de agua y la energía en casa.', sm: 'El suelo seco aumenta el polvo y el riesgo para las áreas verdes.', sst: 'El mar caliente en la costa norte se asocia con lluvias intensas y con brotes de enfermedades como el dengue.' }
  };

  // ¿Qué no sabemos?
  const limites = [
    !esReal ? 'Sin conexión con NASA: esta serie es de demostración, no una medición.'
      : variableId === 'sst' ? `Es la celda de NASA POWER frente a la costa de ${dep.nombre} (reanálisis MERRA-2), no una boya.`
      : `Es la celda de NASA POWER (≈ 50 km) sobre ${dep.capital}, no el promedio de todo el departamento.`,
    'Una tendencia pasada no garantiza que continúe.',
    'Coincidir con El Niño no prueba que El Niño sea la causa.'
  ];

  return { titulo, conclusion, historia, obs, significa: SIGNIFICA[sectorId || 'ciu'][variableId], limites, cambioTxt, cant };
};
