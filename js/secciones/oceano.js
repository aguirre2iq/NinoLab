/* ==========================================================
   NiñoLab · secciones/oceano.js
   Mapa del Pacífico con imágenes satelitales de NASA GIBS
   (https://gibs.earthdata.nasa.gov). El valor de un punto se
   lee del color del píxel usando la escala oficial de NASA.
   ========================================================== */
window.NL = window.NL || {};

NL.oceano = (function () {
  const $ = NL.$, $$ = NL.$$, fmt = NL.fmt;
  const GIBS = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/';

  /* Capas disponibles (verificadas en el catálogo de GIBS el 15/11/2026) */
  const CAPAS = {
    anom: { nombre: 'Anomalía', capa: 'GHRSST_L4_MUR_Sea_Surface_Temperature_Anomalies', matriz: 'GoogleMapsCompatible_Level7', nivel: 7,
            paso: 1, ultima: '2026-11-14', diaria: true, unidad: '°C', dec: 1, factor: 1, signo: true,
            leyenda: 'Mar más frío o más caliente de lo normal', producto: 'NASA/JPL MUR · anomalía de temperatura del mar' },
    sst:  { nombre: 'Temperatura', capa: 'GHRSST_L4_MUR_Sea_Surface_Temperature', matriz: 'GoogleMapsCompatible_Level7', nivel: 7,
            paso: 1, ultima: '2026-11-14', diaria: true, unidad: '°C', dec: 1, factor: 1,
            leyenda: 'Temperatura de la superficie del mar', producto: 'NASA/JPL MUR · temperatura superficial del mar' },
    ssh:  { nombre: 'Altura del mar', capa: 'JPL_MEaSUREs_L4_Sea_Surface_Height_Anomalies', matriz: 'GoogleMapsCompatible_Level6', nivel: 6,
            paso: 5, ultima: '2019-01-22', pasos: 30, unidad: 'cm', dec: 0, factor: 100, signo: true,
            leyenda: 'Nivel del mar por encima o por debajo de lo normal', producto: 'NASA/JPL MEaSUREs · anomalía de altura del mar' },
    cur:  { nombre: 'Corrientes', capa: 'OSCAR_Sea_Surface_Currents_Zonal', matriz: 'GoogleMapsCompatible_Level6', nivel: 6,
            paso: 5, ultima: '2024-07-17', pasos: 3, unidad: 'm/s', dec: 2, factor: 1, signo: true,
            leyenda: 'Corriente hacia el este (rojo) o hacia el oeste (azul)', producto: 'NASA OSCAR · corriente superficial este-oeste' },
    sal:  { nombre: 'Salinidad', capa: 'SMAP_L3_Sea_Surface_Salinity_CAP_8Day_RunningMean', matriz: 'GoogleMapsCompatible_Level6', nivel: 6,
            paso: 1, ultima: '2026-11-12', diaria: true, unidad: 'PSU', dec: 1, factor: 1,
            leyenda: 'Sal en el agua superficial (promedio de 8 días)', producto: 'NASA SMAP · salinidad superficial' }
  };
  const ORDEN = ['anom', 'sst', 'ssh', 'cur', 'sal'];
  const COSTEROS = NL.DEPARTAMENTOS.filter(d => d.costa);

  let mapa, mosaico = null, variable = 'anom', fechas = {}, indiceFecha = 0, conectado = null;
  let lugarA = 'piu', lugarB = 'lim', marcas = [];

  const iso = d => d.toISOString().slice(0, 10);
  const restar = (fechaIso, dias) => { const d = new Date(fechaIso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() - dias); return iso(d); };
  const fechaLarga = f => new Date(f + 'T12:00:00Z').toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  const urlMosaico = (v, fecha) => `${GIBS}${CAPAS[v].capa}/default/${fecha}/${CAPAS[v].matriz}/{z}/{y}/{x}.png`;
  const fechaActual = () => fechas[variable][indiceFecha];

  /* ---------- Imágenes: carga con permiso para leer sus píxeles ---------- */
  const cache = new Map();
  function cargarImagen(url) {
    if (!cache.has(url)) cache.set(url, new Promise((ok, falla) => {
      const img = new Image(); img.crossOrigin = 'anonymous';
      img.onload = () => ok(img); img.onerror = () => falla(new Error('sin imagen')); img.src = url;
    }));
    return cache.get(url);
  }

  /* Busca la fecha más reciente publicada (prueba desde ayer hacia atrás) */
  async function buscarUltimaFecha(v) {
    const C = CAPAS[v];
    if (!C.diaria) return C.ultima;
    const hoy = iso(new Date());
    for (let i = 1; i <= 9; i++) {
      const f = restar(hoy, i);
      if (f < C.ultima) break;
      try { await cargarImagen(urlMosaico(v, f).replace('{z}/{y}/{x}', '2/1/1')); return f; } catch (e) { cache.delete(urlMosaico(v, f).replace('{z}/{y}/{x}', '2/1/1')); }
    }
    await cargarImagen(urlMosaico(v, C.ultima).replace('{z}/{y}/{x}', '2/1/1'));   // si falla, no hay conexión
    return C.ultima;
  }

  /* ---------- Del color del píxel al valor ---------- */
  function valorDeColor(v, r, g, b) {
    const filas = NL.ESCALAS[v]; let mejor = 0, dist = 1e9;
    for (let i = 0; i < filas.length; i++) {
      const d = (filas[i][0] - r) ** 2 + (filas[i][1] - g) ** 2 + (filas[i][2] - b) ** 2;
      if (d < dist) { dist = d; mejor = i; }
    }
    if (dist > 900) return null;                    // color que no pertenece a la escala
    return filas[mejor][3] * CAPAS[v].factor;
  }
  async function valorEn(v, fecha, lat, lon) {
    const z = Math.min(5, CAPAS[v].nivel), n = 2 ** z;
    lon = ((lon + 180) % 360 + 360) % 360 - 180;
    const fx = (lon + 180) / 360 * n, s = Math.sin(lat * Math.PI / 180);
    const fy = (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * n;
    const x = Math.floor(fx), y = Math.floor(fy);
    const img = await cargarImagen(urlMosaico(v, fecha).replace('{z}/{y}/{x}', `${z}/${y}/${x}`));
    if (!img._ctx) { const c = document.createElement('canvas'); c.width = c.height = 256; img._ctx = c.getContext('2d', { willReadFrequently: true }); img._ctx.drawImage(img, 0, 0, 256, 256); }
    const px = Math.min(255, Math.floor((fx - x) * 256)), py = Math.min(255, Math.floor((fy - y) * 256));
    // Si el píxel exacto no tiene dato (tierra, nube), se prueba alrededor
    for (const [dx, dy] of [[0, 0], [-2, 0], [-4, 0], [0, 2], [0, -2], [-6, 0], [-3, 3], [-3, -3]]) {
      const qx = Math.max(0, Math.min(255, px + dx)), qy = Math.max(0, Math.min(255, py + dy));
      const p = img._ctx.getImageData(qx, qy, 1, 1).data;
      if (p[3] > 200) { const val = valorDeColor(v, p[0], p[1], p[2]); if (val !== null) return val; }
    }
    return null;
  }
  /* ¿El valor está en el tope de la escala de colores? (entonces el real puede ser mayor) */
  function enTope(v, val) {
    const f = NL.ESCALAS[v], k = CAPAS[v].factor;
    return val !== null && (val >= f[f.length - 1][3] * k ? 1 : val <= f[1][3] * k ? -1 : 0);
  }
  const texto = (v, val) => val === null ? 'sin dato'
    : `${enTope(v, val) === 1 ? '> ' : enTope(v, val) === -1 ? '< ' : ''}${CAPAS[v].signo ? NL.signo(val, CAPAS[v].dec) : fmt(val, CAPAS[v].dec)} ${CAPAS[v].unidad}`;

  /* ---------- Pintado ---------- */
  function pintarLeyenda() {
    const C = CAPAS[variable], filas = NL.ESCALAS[variable], paradas = [];
    for (let i = 1; i < filas.length; i += Math.max(1, Math.floor(filas.length / 24))) paradas.push(`rgb(${filas[i][0]},${filas[i][1]},${filas[i][2]})`);
    const min = filas[1][3] * C.factor, max = filas[filas.length - 1][3] * C.factor;
    $('#oLeyTitulo').textContent = C.leyenda;
    $('#oLeyRampa').style.background = `linear-gradient(90deg,${paradas.join(',')})`;
    $('#oLeyMin').textContent = (C.signo ? NL.signo(min, 0) : fmt(min, 0)) + ' ' + C.unidad;
    $('#oLeyMax').textContent = (C.signo ? NL.signo(max, 0) : fmt(max, 0)) + ' ' + C.unidad;
    $('#oLeyMedio').textContent = C.signo ? '0 = normal' : '';
  }

  function pintarMosaico() {
    const C = CAPAS[variable], fecha = fechaActual();
    if (mosaico) mapa.removeLayer(mosaico);
    mosaico = L.tileLayer(urlMosaico(variable, fecha), { maxNativeZoom: C.nivel, crossOrigin: 'anonymous', opacity: .95, attribution: 'NASA GIBS' }).addTo(mapa);
    const n = fechas[variable].length;
    $('#oFecha').max = n - 1; $('#oFecha').value = n - 1 - indiceFecha;
    $('#oFechaTxt').textContent = fechaLarga(fecha);
    $('#oFuente').textContent = `Fuente: NASA GIBS · ${C.producto} · ${fechaLarga(fecha)}` +
      (C.diaria ? (indiceFecha === 0 ? ' (dato más reciente)' : '') : ' · esta capa no se actualiza a diario: se muestra su última fecha publicada');
    $$('#oVar button').forEach(b => b.classList.toggle('on', b.dataset.v === variable));
  }

  async function pintarComparacion() {
    const A = NL.DEP[lugarA], B = NL.DEP[lugarB], C = CAPAS[variable], fecha = fechaActual();
    marcas.forEach(m => mapa.removeLayer(m)); marcas = [];
    [A, B].forEach(d => {
      marcas.push(L.circleMarker(d.mar, { radius: 7, color: '#fff', weight: 2.5, fillColor: '#D3202B', fillOpacity: 1, pane: 'puntos' }).addTo(mapa));
      marcas.push(L.marker(d.mar, { interactive: false, pane: 'puntos', icon: L.divIcon({ className: 'puerto-lbl', iconSize: [0, 0], html: `<div>${d.nombre}</div>` }) }).addTo(mapa));
    });
    $('#valA').textContent = '…'; $('#valB').textContent = '…'; $('#oDif').innerHTML = '&nbsp;';
    if (conectado === false) { $('#valA').textContent = '—'; $('#valB').textContent = '—'; $('#oTexto').textContent = 'Sin conexión con NASA GIBS no se pueden leer valores.'; return; }
    let a = null, b = null;
    try { [a, b] = await Promise.all([valorEn(variable, fecha, A.mar[0], A.mar[1]), valorEn(variable, fecha, B.mar[0], B.mar[1])]); } catch (e) { /* sin imagen */ }
    if (fecha !== fechaActual()) return;            // el usuario ya cambió de fecha o capa
    $('#valA').textContent = texto(variable, a); $('#valB').textContent = texto(variable, b);
    if (a !== null && b !== null && enTope(variable, a) && enTope(variable, b)) {
      $('#oDif').innerHTML = `Los dos lugares están en el tope de la escala de colores de la NASA. ${variable === 'anom' ? 'Cambia a <b>Temperatura</b> para ver la diferencia entre ellos.' : ''}`;
    } else if (a !== null && b !== null) {
      const dif = a - b;
      $('#oDif').innerHTML = Math.abs(dif) < 10 ** -C.dec ? `Frente a ${A.nombre} y ${B.nombre} el valor es el mismo.`
        : `Frente a ${A.nombre} hay <b>${fmt(Math.abs(dif), C.dec)} ${C.unidad} ${dif > 0 ? 'más' : 'menos'}</b> que frente a ${B.nombre}.`;
    }
    const expl = {
      anom: a === null ? '' : a >= 2 ? `Frente a ${A.nombre} el mar está muy por encima de lo normal para esta fecha. Un mar así de caliente en la costa norte favorece lluvias intensas.` : a >= 0.5 ? `Frente a ${A.nombre} el mar está más caliente de lo normal para esta fecha.` : a <= -0.5 ? `Frente a ${A.nombre} el mar está más frío de lo normal para esta fecha.` : `Frente a ${A.nombre} el mar está cerca de lo normal para esta fecha.`,
      sst: 'El mar peruano suele ser más frío hacia el sur: los vientos empujan el agua superficial y sube agua fría del fondo (afloramiento). Durante El Niño, esa franja fría se debilita.',
      ssh: 'Cuando llega agua cálida desde el Pacífico (ondas Kelvin), el nivel del mar sube unos centímetros. Los satélites lo detectan antes de que el calor llegue a la costa.',
      cur: 'En rojo, el agua se mueve hacia el este (hacia Sudamérica). Durante El Niño, las corrientes hacia el este se refuerzan y traen agua cálida.',
      sal: 'Las lluvias intensas y los ríos crecidos reducen la sal del agua cerca de la costa. Por eso la salinidad baja acompaña a los episodios lluviosos.'
    }[variable];
    $('#oTexto').innerHTML = expl + ' <strong>La temperatura del mar sola no permite afirmar cambios en la pesca.</strong>';
  }

  function refrescar() { pintarLeyenda(); pintarMosaico(); pintarComparacion(); }

  async function ponerVariable(v) {
    variable = v;
    if (!fechas[v]) {
      const C = CAPAS[v]; let ultima = C.ultima;
      if (conectado !== false) { try { ultima = await buscarUltimaFecha(v); conectado = true; } catch (e) { if (conectado === null) conectado = false; } }
      const n = C.pasos || 30; fechas[v] = Array.from({ length: n }, (_, i) => restar(ultima, i * C.paso));
    }
    indiceFecha = 0;
    $('#oAviso').hidden = conectado !== false;
    refrescar();
  }

  function elegirLugar(id) { if (!NL.DEP[id].costa) return; if (id === lugarB) lugarB = lugarA; lugarA = id; $('#selA').value = lugarA; $('#selB').value = lugarB; if (fechas[variable]) pintarComparacion(); }

  function iniciar() {
    mapa = L.map('mapaMar', { center: [-6, -112], zoom: 3, minZoom: 2, maxZoom: 6, scrollWheelZoom: false, maxBounds: [[-58, -262], [58, -28]], worldCopyJump: false });
    mapa.attributionControl.setPrefix('');
    mapa.createPane('tierra').style.zIndex = 350; mapa.getPane('tierra').style.pointerEvents = 'none';
    mapa.createPane('puntos').style.zIndex = 620;
    L.polygon(NL.TIERRA_PACIFICO.map(anillo => [anillo.map(p => [p[1], p[0]])]), { pane: 'tierra', renderer: L.canvas({ pane: 'tierra' }), interactive: false,
      fillColor: '#F4F0F0', fillOpacity: 1, color: '#BDB3B3', weight: .8 }).addTo(mapa);

    // Regiones donde se mide El Niño
    [['NIÑO 3.4', [[5, -170], [-5, -120]]], ['NIÑO 3', [[5, -150], [-5, -90]]], ['NIÑO 1+2', [[0, -90], [-10, -80]]]].forEach(([nombre, caja]) => {
      L.rectangle(caja, { color: '#151112', weight: 1.6, dashArray: '5 4', fill: false, interactive: false, pane: 'puntos' }).addTo(mapa);
      L.marker([caja[0][0], caja[0][1]], { interactive: false, pane: 'puntos', icon: L.divIcon({ className: 'nino-lbl', iconSize: [0, 0], html: `<span style="position:absolute;transform:translateY(-110%)">${nombre}</span>` }) }).addTo(mapa);
    });

    // Clic en el mar: valor real en ese punto
    mapa.on('click', async e => {
      const pop = L.popup().setLatLng(e.latlng).setContent('Leyendo…').openOn(mapa);
      let v = null; try { v = await valorEn(variable, fechaActual(), e.latlng.lat, e.latlng.lng); } catch (_) { /* sin imagen */ }
      const lat = `${fmt(Math.abs(e.latlng.lat), 1)}° ${e.latlng.lat < 0 ? 'S' : 'N'}`;
      pop.setContent(v === null ? `${lat} · sin dato en este punto` : `<b>${texto(variable, v)}</b><br>${CAPAS[variable].nombre} · ${lat}`);
    });

    $('#oVar').innerHTML = ORDEN.map(v => `<button type="button" data-v="${v}">${CAPAS[v].nombre}</button>`).join('');
    $('#oVar').onclick = e => { const b = e.target.closest('button'); if (b) ponerVariable(b.dataset.v); };
    $('#oFecha').oninput = e => { indiceFecha = fechas[variable].length - 1 - (+e.target.value); pintarMosaico(); pintarComparacion(); };
    $('#oAntes').onclick = () => { if (indiceFecha < fechas[variable].length - 1) { indiceFecha++; pintarMosaico(); pintarComparacion(); } };
    $('#oDespues').onclick = () => { if (indiceFecha > 0) { indiceFecha--; pintarMosaico(); pintarComparacion(); } };

    const opciones = COSTEROS.map(d => `<option value="${d.id}">Frente a ${d.nombre}</option>`).join('');
    $('#selA').innerHTML = opciones; $('#selB').innerHTML = opciones; $('#selA').value = lugarA; $('#selB').value = lugarB;
    $('#selA').onchange = e => { lugarA = e.target.value; pintarComparacion(); };
    $('#selB').onchange = e => { lugarB = e.target.value; pintarComparacion(); };
    window.addEventListener('resize', () => mapa.invalidateSize());
    ponerVariable('anom');
  }

  return { iniciar, elegirLugar };
})();
