/* ==========================================================
   NiñoLab · motor/nasa-power.js
   Conexión real con NASA POWER (https://power.larc.nasa.gov).
   Pide la serie mensual de un punto desde 1981 y la convierte
   en valores anuales. Si no hay conexión, avisa para que la
   página use la serie de demostración.
   ========================================================== */
window.NL = window.NL || {};

NL.power = (function () {
  const AÑO_FIN = 2025;                     // último año completo
  const memoria = {};                       // respuestas ya pedidas en esta visita

  function url(lat, lon) {
    return 'https://power.larc.nasa.gov/api/temporal/monthly/point' +
      `?parameters=T2M,PRECTOTCORR,GWETTOP,TS&community=AG&longitude=${lon}&latitude=${lat}` +
      `&start=1981&end=${AÑO_FIN}&format=JSON`;
  }
  const bisiesto = a => (a % 4 === 0 && a % 100 !== 0) || a % 400 === 0;

  /* Devuelve { PRECTOTCORR:{1981:…}, T2M:{…}, … } con un valor por año (o null si falta) */
  async function pedirPunto(lat, lon) {
    const clave = lat + ',' + lon;
    if (memoria[clave]) return memoria[clave];
    const guardado = NL.guardar.leer('ninolab-power-' + clave, null);
    if (guardado) { memoria[clave] = guardado; return guardado; }

    const control = new AbortController();
    const reloj = setTimeout(() => control.abort(), 25000);
    try {
      const resp = await fetch(url(lat, lon), { signal: control.signal });
      if (!resp.ok) throw new Error('NASA POWER respondió ' + resp.status);
      const json = await resp.json();
      const crudo = json.properties.parameter, anual = {};
      for (const param of Object.keys(crudo)) {
        anual[param] = {};
        for (let año = 1981; año <= AÑO_FIN; año++) {
          let v = crudo[param][año + '13'];                 // la clave "13" es el promedio anual
          if (v === undefined || v < -900) v = null;        // -999 = sin dato
          else if (param === 'PRECTOTCORR') v = v * (bisiesto(año) ? 366 : 365);   // mm/día → mm/año
          else if (param === 'GWETTOP') v = v * 100;        // fracción → %
          anual[param][año] = v;
        }
      }
      memoria[clave] = anual;
      NL.guardar.escribir('ninolab-power-' + clave, anual);
      return anual;
    } finally { clearTimeout(reloj); }
  }

  /* Serie anual [{año, valor}] de una variable para un departamento */
  async function serie(depId, variableId, añoInicio, añoFin) {
    const dep = NL.DEP[depId], variable = NL.VARIABLES[variableId];
    const [lat, lon] = variableId === 'sst' ? dep.mar : dep.punto;
    const datos = await pedirPunto(lat, lon);
    const salida = [];
    for (let año = añoInicio; año <= añoFin; año++) salida.push({ año, valor: datos[variable.parametro][año] ?? null });
    return salida;
  }

  return { serie, AÑO_FIN };
})();
