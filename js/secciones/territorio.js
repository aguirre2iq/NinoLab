/* ==========================================================
   NiñoLab · secciones/territorio.js
   Mapa real del Perú (Leaflet) con el clima de hoy por
   departamento. Capas: lluvia, nubes, humedad, temperatura
   y viento. Datos del día: Open-Meteo (fuente complementaria).
   El valor es el de la capital de cada departamento.
   ========================================================== */
window.NL = window.NL || {};

NL.territorio = (function () {
  const $ = NL.$, $$ = NL.$$, fmt = NL.fmt;

  const CAPAS = {
    lluvia: { nombre: 'Lluvia', clave: 'precipitation', unidad: 'mm', dec: 1, dominio: [0, 6], investigar: 'pr',
      rampa: ['#F4F7FA', '#B9D6EE', '#5E9FD6', '#1F6FB5', '#0E3A6B'], texto: 'Lluvia caída durante esa hora.',
      icono: '<path d="M7 15a4 4 0 0 1 .5-8 5.5 5.5 0 0 1 10.6 1.5A3.5 3.5 0 0 1 17.5 15Z"/><path d="M9 18l-1 3M13 18l-1 3M17 18l-1 3"/>' },
    nubes: { nombre: 'Nubes', clave: 'cloud_cover', unidad: '%', dec: 0, dominio: [0, 100], investigar: 'pr',
      rampa: ['#FFFFFF', '#DDE2E8', '#AEB6C2', '#7B8494', '#4E5768'], texto: 'Parte del cielo cubierta por nubes.',
      icono: '<path d="M7 18a4.5 4.5 0 0 1 .6-9 6 6 0 0 1 11.5 1.7A3.7 3.7 0 0 1 18.5 18Z"/>' },
    humedad: { nombre: 'Humedad', clave: 'relative_humidity_2m', unidad: '%', dec: 0, dominio: [20, 100], investigar: 'sm',
      rampa: ['#F3E7C9', '#CFE0B4', '#8CC6B0', '#3F9BA6', '#1B5F7A'], texto: 'Humedad relativa del aire.',
      icono: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z"/>' },
    temp: { nombre: 'Temperatura', clave: 'temperature_2m', unidad: '°C', dec: 0, dominio: [2, 36], investigar: 't2m',
      rampa: ['#2B4C9B', '#7FB2E5', '#F1EEEA', '#F5A26F', '#D3202B', '#7E0E18'], texto: 'Temperatura del aire a 2 metros del suelo.',
      icono: '<path d="M10 14V5a2 2 0 0 1 4 0v9a4 4 0 1 1-4 0Z"/><path d="M12 9v8"/>' },
    viento: { nombre: 'Viento', clave: 'wind_speed_10m', unidad: 'km/h', dec: 0, dominio: [0, 40], investigar: 't2m',
      rampa: ['#F6F3FA', '#D3C5EA', '#A186D3', '#6C4BB0', '#3D2478'], texto: 'Velocidad del viento a 10 metros.',
      icono: '<path d="M3 9h11a3 3 0 1 0-3-3"/><path d="M3 14h15a3 3 0 1 1-3 3"/><path d="M3 11.5h7"/>' }
  };
  const ORDEN = ['lluvia', 'nubes', 'humedad', 'temp', 'viento'];

  let mapa, capaDeps, etiquetas = {}, capa = 'temp', zona = 'piu', comparar = 'lim', hora = 12;
  let datos = null, enVivo = false;          // datos[id][clave] = [24 valores]

  const horaLima = () => +new Date().toLocaleString('en-US', { timeZone: 'America/Lima', hour: 'numeric', hour12: false }) % 24;
  const horaTexto = h => `${h % 12 === 0 ? 12 : h % 12}:00 ${h < 12 ? 'a. m.' : 'p. m.'}`;
  const valor = (id, c) => datos[id][CAPAS[c || capa].clave][hora];
  const mostrar = (v, c) => v === null || v === undefined ? '—' : fmt(v, CAPAS[c].dec) + (CAPAS[c].unidad === '°C' ? '°' : '');
  function color(v) {
    if (v === null || v === undefined) return '#EEE9E9';
    const C = CAPAS[capa]; return `rgb(${NL.colorRampa(C.rampa, (v - C.dominio[0]) / (C.dominio[1] - C.dominio[0]))})`;
  }

  /* Clima de hoy, hora por hora, para las 25 capitales en una sola consulta */
  async function pedirClima() {
    const lat = NL.DEPARTAMENTOS.map(d => d.punto[0]).join(','), lon = NL.DEPARTAMENTOS.map(d => d.punto[1]).join(',');
    const claves = ORDEN.map(c => CAPAS[c].clave).join(',');
    const control = new AbortController(), reloj = setTimeout(() => control.abort(), 15000);
    try {
      const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=${claves}&forecast_days=1&timezone=America%2FLima`, { signal: control.signal });
      if (!r.ok) throw new Error('Open-Meteo ' + r.status);
      const respuesta = await r.json(), lista = Array.isArray(respuesta) ? respuesta : [respuesta], salida = {};
      if (lista.length !== NL.DEPARTAMENTOS.length) throw new Error('respuesta incompleta');
      NL.DEPARTAMENTOS.forEach((d, i) => { salida[d.id] = lista[i].hourly; });
      return salida;
    } finally { clearTimeout(reloj); }
  }
  /* Valores de ejemplo para cuando no hay conexión (se avisa en pantalla) */
  function climaDeEjemplo() {
    const salida = {};
    NL.DEPARTAMENTOS.forEach(d => {
      const h = [...Array(24).keys()], humedo = Math.min(1, d.lluvia / 2500);
      salida[d.id] = {
        temperature_2m: h.map(x => d.temp + 4.5 * Math.cos((x - 15) / 24 * 2 * Math.PI)),
        relative_humidity_2m: h.map(x => 55 + 30 * humedo - 12 * Math.cos((x - 15) / 24 * 2 * Math.PI)),
        precipitation: h.map(x => humedo > .5 && x > 14 && x < 19 ? 1.5 * humedo : 0),
        cloud_cover: h.map(() => 35 + 50 * humedo),
        wind_speed_10m: h.map(x => (d.costa ? 14 : 7) + 4 * Math.cos((x - 16) / 24 * 2 * Math.PI))
      };
    });
    return salida;
  }

  function estilo(f) {
    const id = f.properties.id, sel = id === zona;
    return { fillColor: color(valor(id)), fillOpacity: .9, color: sel ? '#151112' : '#FFFFFF', weight: sel ? 3 : 1 };
  }

  function pintarMapa() {
    const C = CAPAS[capa];
    capaDeps.setStyle(estilo);
    capaDeps.eachLayer(l => { if (l.feature.properties.id === zona) l.bringToFront(); });
    NL.DEPARTAMENTOS.forEach(d => {
      const m = etiquetas[d.id], el = m.getElement();
      m.setIcon(L.divIcon({ className: 'dep-lbl' + (d.id === zona ? ' sel' : ''), iconSize: [0, 0],
        html: `<div><span>${d.nombre.toUpperCase()}</span><b>${mostrar(valor(d.id), capa)}</b></div>` }));
    });
    $$('#capas button').forEach(b => b.classList.toggle('on', b.dataset.c === capa));
    $('#leyTitulo').textContent = `${C.nombre} (${C.unidad})`;
    $('#leyRampa').style.background = `linear-gradient(90deg,${C.rampa.join(',')})`;
    $('#leyMin').textContent = `${C.dominio[0]} ${C.unidad}`; $('#leyMax').textContent = `${C.dominio[1]}${capa === 'lluvia' || capa === 'viento' ? '+' : ''} ${C.unidad}`;
    $('#leyTexto').textContent = C.texto;
    $('#horaTxt').textContent = horaTexto(hora);
    $$('#franjas span').forEach((s, i) => s.classList.toggle('on', Math.floor(hora / 6) === i));
  }

  function pintarZona() {
    const d = NL.DEP[zona], C = CAPAS[capa], otro = NL.DEP[comparar], v = valor(zona), vo = valor(comparar);
    const dif = v !== null && vo !== null ? v - vo : null;
    const limite = {
      temp: 'en departamentos con costa y sierra la temperatura cambia mucho con la altitud.',
      lluvia: 'la lluvia es muy local: puede llover en un valle y no en la capital.',
      nubes: 'la nubosidad cambia rápido de una hora a otra.',
      humedad: 'es la humedad del aire, no la del suelo.',
      viento: 'el viento depende mucho del relieve de cada lugar.'
    }[capa];
    $('#zoneCard').innerHTML = `
      <div class="eyebrow">${d.costa ? 'Departamento costero' : 'Departamento'}</div>
      <h3 style="margin-top:10px">${d.nombre}</h3>
      <p class="src">Valores en ${d.capital}${d.capital === d.nombre ? ' (capital)' : ', su capital'} · hoy ${horaTexto(hora)} · ${enVivo ? 'Open-Meteo' : 'valores de ejemplo'}</p>
      <div class="zone-now">${ORDEN.map(c => `<button type="button" data-c="${c}" class="${c === capa ? 'on' : ''}">
        <small>${NL.icono(CAPAS[c].icono)}${CAPAS[c].nombre}</small><b>${mostrar(valor(zona, c), c)}${CAPAS[c].unidad === '°C' ? '' : ' <span style="font-size:.75rem;font-family:var(--f-body)">' + CAPAS[c].unidad + '</span>'}</b></button>`).join('')}</div>
      <div class="explain">
        <p><span>Qué ves:</span> el color de cada departamento muestra ${C.nombre.toLowerCase()} a esa hora. ${C.texto}</p>
        <p><span>Comparado con</span> <select id="cmpSel" aria-label="Departamento para comparar">${NL.DEP_ORDENADOS.filter(x => x.id !== zona).map(x => `<option value="${x.id}" ${x.id === comparar ? 'selected' : ''}>${x.nombre}</option>`).join('')}</select>:
          ${dif === null ? 'sin dato.' : Math.abs(dif) < (C.dec ? .05 : .5) ? 'el mismo valor.' : `<b>${NL.signo(dif, C.dec)} ${C.unidad}</b> (${otro.capital} tiene ${fmt(vo, C.dec)} ${C.unidad}).`}</p>
        <p><span>Limitación:</span> es el dato de la capital, no el promedio del departamento; ${limite}</p>
      </div>
      <div class="cta-row" style="margin-top:20px">
        <button class="btn red sm" type="button" id="invZone">Investigar esta zona</button>
        ${d.costa ? '<button class="btn ghost sm" type="button" id="marZone">Ver su mar</button>' : ''}
      </div>`;
    $('#cmpSel').onchange = e => { comparar = e.target.value; pintarZona(); };
    $('#invZone').onclick = () => { NL.investigar.preparar({ lugar: zona, variable: C.investigar }); NL.irA('investigar'); NL.investigar.ejecutar(); };
    if (d.costa) $('#marZone').onclick = () => { NL.oceano.elegirLugar(zona); NL.irA('oceano'); };
  }

  function seleccionar(id) {
    zona = id; if (comparar === id) comparar = id === 'lim' ? 'piu' : 'lim';
    if (!datos) return;
    pintarMapa(); pintarZona();
  }
  function ponerCapa(c) { capa = c; pintarMapa(); pintarZona(); }

  async function iniciar() {
    hora = horaLima();
    const LIMITE = [[-18.6, -81.7], [0.3, -68.4]];
    mapa = L.map('mapaPeru', { zoomSnap: .25, minZoom: 4.5, maxZoom: 8, scrollWheelZoom: false, maxBounds: [[-26, -92], [7, -58]], attributionControl: true });
    mapa.attributionControl.setPrefix('').addAttribution('Límites: INEI · Vecinos: Natural Earth · Clima: Open-Meteo');
    mapa.fitBounds(LIMITE);
    L.geoJSON(NL.VECINOS, { interactive: false, style: { fillColor: '#F1ECEC', fillOpacity: 1, color: '#D8CFCF', weight: 1 } }).addTo(mapa);

    datos = climaDeEjemplo();                       // se ve algo de inmediato; luego llega el dato real
    capaDeps = L.geoJSON(NL.PERU_GEO, {
      style: estilo,
      onEachFeature(f, l) {
        const d = NL.DEP[f.properties.id];
        l.on('click', () => seleccionar(d.id));
        l.bindTooltip(() => `<b>${d.nombre}</b> · ${mostrar(valor(d.id), capa)} ${CAPAS[capa].unidad === '°C' ? '' : CAPAS[capa].unidad}`, { sticky: true });
      }
    }).addTo(mapa);
    NL.DEPARTAMENTOS.forEach(d => { etiquetas[d.id] = L.marker(d.etiqueta, { interactive: false, icon: L.divIcon({ className: 'dep-lbl', iconSize: [0, 0] }) }).addTo(mapa); });

    $('#capas').innerHTML = ORDEN.map(c => `<button type="button" data-c="${c}" title="${CAPAS[c].nombre}" aria-label="${CAPAS[c].nombre}">${NL.icono(CAPAS[c].icono)}</button>`).join('');
    $('#capas').onclick = e => { const b = e.target.closest('button'); if (b) ponerCapa(b.dataset.c); };
    $('#zoneCard').addEventListener('click', e => { const b = e.target.closest('.zone-now button'); if (b) ponerCapa(b.dataset.c); });
    $('#horaRango').value = hora;
    $('#horaRango').oninput = e => { hora = +e.target.value; pintarMapa(); pintarZona(); };
    $('#mapaReset').onclick = () => mapa.fitBounds(LIMITE);
    window.addEventListener('resize', () => mapa.invalidateSize());
    pintarMapa(); pintarZona();

    try { datos = await pedirClima(); enVivo = true; } catch (e) { enVivo = false; }
    $('#terrEstado').className = 'tag ' + (enVivo ? 'real' : 'demo');
    $('#terrEstado').textContent = enVivo ? 'En vivo · hoy' : 'Sin conexión · valores de ejemplo';
    pintarMapa(); pintarZona();
  }

  return { iniciar, seleccionar };
})();
