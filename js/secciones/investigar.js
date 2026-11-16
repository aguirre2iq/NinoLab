/* ==========================================================
   NiñoLab · secciones/investigar.js
   El flujo completo de una investigación:
   Pregunta → Datos NASA → Análisis → Verificación → Explicación
   ========================================================== */
window.NL = window.NL || {};

NL.investigar = (function () {
  const $ = NL.$, $$ = NL.$$, fmt = NL.fmt;
  const PASOS = ['Interpretar la pregunta', 'Pedir los datos a NASA POWER', 'Revisar cobertura y calidad', 'Analizar el período completo', 'Verificar la tendencia', 'Escribir la explicación'];
  let actual = null, corriendo = false, pestaña = 'c';

  const resultado = () => actual;
  const pausa = ms => new Promise(r => setTimeout(r, NL.sinAnimacion ? 0 : ms));

  /* ---------- Formulario ---------- */
  function preguntaAutomatica() {
    const v = $('#selVar').value, n = NL.DEP[$('#selPlace').value].nombre, d = $('#selFrom').value, h = $('#selTo').value;
    return { pr: `¿Cómo han cambiado las lluvias en ${n} entre ${d} y ${h}?`,
             t2m: `¿Ha aumentado la temperatura en ${n} entre ${d} y ${h}?`,
             sm: `¿El suelo de ${n} está más seco que antes?`,
             sst: `¿El mar frente a ${n} está más caliente desde ${d}?` }[v];
  }
  function pintarSugerencias() {
    const d = NL.DEP[$('#selPlace').value];
    const s = [[`Lluvias en ${d.nombre}`, 'pr'], [`Calor en ${d.nombre}`, 't2m'], [`Suelo en ${d.nombre}`, 'sm']];
    if (d.costa) s.push([`Mar frente a ${d.nombre}`, 'sst']);
    $('#suggest').innerHTML = s.map(x => `<button type="button" data-v="${x[1]}">${x[0]}</button>`).join('');
  }
  /* Rellena el formulario desde otra sección (perfil, mapa, cronología, hallazgos) */
  function preparar(o) {
    if (o.lugar) $('#selPlace').value = o.lugar;
    if (o.variable) $('#selVar').value = o.variable;
    if (o.desde) $('#selFrom').value = o.desde;
    if (o.hasta) $('#selTo').value = o.hasta;
    pintarSugerencias();
    $('#qText').value = o.pregunta || preguntaAutomatica();
  }
  /* Lee la pregunta escrita y ajusta lugar, variable y años */
  function leerPregunta() {
    const t = $('#qText').value.toLowerCase(), plano = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    if (/lluv|precip/.test(t)) $('#selVar').value = 'pr';
    else if (/\bmar\b|océano|oceano/.test(t)) $('#selVar').value = 'sst';
    else if (/suelo|sequ|humedad/.test(t)) $('#selVar').value = 'sm';
    else if (/calor|temperatura|frío|frio/.test(t)) $('#selVar').value = 't2m';
    const dep = NL.DEPARTAMENTOS.find(d => plano(t).includes(plano(d.nombre)));
    if (dep) { $('#selPlace').value = dep.id; pintarSugerencias(); }
    const años = t.match(/(19|20)\d\d/g);
    if (años) { $('#selFrom').value = Math.min(2010, Math.max(1960, +años[0])); if (años[1]) $('#selTo').value = Math.min(NL.power.AÑO_FIN, Math.max(2000, +años[1])); }
    const ultimos = t.match(/(\d+)\s*años/);
    if (ultimos && !años) $('#selFrom').value = Math.min(2010, Math.max(1960, NL.power.AÑO_FIN - (+ultimos[1]) + 1));
  }

  /* ---------- Ejecución ---------- */
  async function ejecutar(sinPasos) {
    if (corriendo) return; corriendo = true; $('#runBtn').disabled = true;
    const lugar = $('#selPlace').value, variableId = $('#selVar').value, V = NL.VARIABLES[variableId], dep = NL.DEP[lugar];
    let desde = +$('#selFrom').value, hasta = Math.max(+$('#selTo').value, desde + 1), nota = null, error = null;

    const filas = PASOS.map(p => `<div class="pstep"><i></i><span>${p}</span><small></small></div>`).join('');
    $('#progress').innerHTML = filas; const pasos = $$('#progress .pstep');
    const marcar = async (i, texto) => { pasos[i].classList.add('doing'); await pausa(sinPasos ? 0 : 240); pasos[i].classList.remove('doing'); pasos[i].classList.add('done'); pasos[i].querySelector('small').textContent = texto; };

    await marcar(0, V.nombre);
    // Reglas de cobertura: el detective avisa en vez de inventar
    if (V.soloCosta && !dep.costa) error = `${dep.nombre} no tiene costa, así que no hay temperatura del mar que analizar. Prueba con temperatura del aire o con un departamento costero.`;
    if (desde < V.desde) { nota = `Pediste desde ${desde}, pero NASA POWER tiene datos desde ${V.desde}. Analizamos ${V.desde}–${hasta}.`; desde = V.desde; }
    if (!error && hasta - desde < 9) error = `Ese período tiene solo ${hasta - desde + 1} años. Se necesitan al menos 10 para evaluar una tendencia. Amplía el período.`;

    let serie = null, esReal = false;
    if (!error) {
      pasos[1].classList.add('doing');
      try { serie = await NL.power.serie(lugar, variableId, desde, hasta); esReal = true; }
      catch (e) { serie = NL.demo.serie(lugar, variableId, desde, hasta); }
      pasos[1].classList.remove('doing'); pasos[1].classList.add('done');
      pasos[1].querySelector('small').textContent = esReal ? 'conectado' : 'sin conexión';
      if (serie.filter(p => p.valor !== null).length < 10) error = 'NASA POWER no tiene suficientes años con dato para este punto y esta variable.';
    }

    if (error) {
      pasos.forEach((p, i) => { if (!p.classList.contains('done')) p.style.opacity = .4; });
      actual = { error, nota };
    } else {
      const R = NL.est.analizar(serie, V);
      await marcar(2, `${R.n}/${R.serie.length} años`);
      await marcar(3, `${R.n} valores`);
      await marcar(4, `p = ${fmt(R.mk.p, 3)}`);
      const sector = NL.perfil.actual() ? NL.perfil.actual().sector : null;
      const I = NL.interpretar(R, lugar, variableId, sector, esReal);
      await marcar(5, 'listo');
      actual = { R, I, lugar, variableId, esReal, nota, pregunta: $('#qText').value };
    }
    corriendo = false; $('#runBtn').disabled = false; pestaña = 'c';
    pintar();
    if (NL.duke) NL.duke.alTerminar();
  }

  /* ---------- Resultado ---------- */
  function pintar() {
    const caja = $('#result'), A = actual;
    const aviso = A.nota ? `<div class="coverage-msg"><b>Cobertura</b><span>${A.nota}</span></div>` : '';
    if (A.error) {
      caja.innerHTML = `${aviso}<div class="result-head"><div><span class="status inc">Sin análisis</span><h3 style="margin-top:12px">NiñoLab no puede responder esta pregunta tal como está</h3></div></div><p class="conclusion">${A.error}</p>`;
      return;
    }
    const { R, I } = A, V = NL.VARIABLES[A.variableId], dep = NL.DEP[A.lugar], sector = NL.perfil.actual();
    const s10 = NL.signo(R.mk.sen * 10, V.dec + 1), s10b = NL.signo(R.sinExtremos.sen * 10, V.dec + 1);

    caja.innerHTML = `${aviso}
    <div class="result-head"><div><h3>${I.titulo}</h3>
      <div class="meta"><span>${dep.nombre}</span><span>${V.nombre}</span><span>${R.añoInicio}–${R.añoFin}</span><span>${V.fuente}</span>
      ${A.esReal ? '<span class="tag real">Datos reales NASA</span>' : '<span class="tag demo">Sin conexión · serie de demostración</span>'}</div></div>
      <span class="status ${R.estado}">${NL.ESTADOS[R.estado]}</span></div>
    <div class="tabs" role="tablist">
      <button type="button" data-t="c" class="${pestaña === 'c' ? 'on' : ''}"><small>1</small>Comprender</button>
      <button type="button" data-t="e" class="${pestaña === 'e' ? 'on' : ''}"><small>2</small>Explorar</button>
      <button type="button" data-t="v" class="${pestaña === 'v' ? 'on' : ''}"><small>3</small>Verificar</button>
    </div>

    <div class="tabpane ${pestaña === 'c' ? 'on' : ''}" data-p="c">
      <p class="conclusion">${I.conclusion}</p>
      <div class="keynums">
        <div class="keynum"><b>${I.cambioTxt}</b><span>últimos años frente a los primeros ${R.primeros.length}</span></div>
        <div class="keynum"><b>${R.excepcionales.length}</b><span>${R.excepcionales.length === 1 ? 'año excepcional' : 'años excepcionales'}${R.excepcionales.length ? ' (' + R.excepcionales.map(p => p.año).sort().join(', ') + ')' : ''}</span></div>
      </div>
      <div class="chart-box" id="chartMain"></div>
      <div class="legend"><span><i style="background:#151112"></i>Valor anual</span><span><i style="border-top:2px dashed #5F5759;height:0"></i>Referencia ${R.referencia}</span><span><i style="background:#D3202B"></i>Tendencia${R.estado === 'ok' ? '' : ' (no respaldada)'}</span></div>
      <div class="story">${I.historia.map(h => `<div><h4>${h.t}</h4><p>${h.p}</p></div>`).join('')}</div>
      <div class="blocks2">
        <div class="callout me"><h4>¿Qué significa para ${sector ? NL.SECTORES[sector.sector].nombre.toLowerCase() : 'ti'}?</h4><p>${I.significa}</p></div>
        <div class="callout"><h4>¿Qué no sabemos?</h4><ul>${I.limites.map(l => `<li>${l}</li>`).join('')}</ul></div>
      </div>
    </div>

    <div class="tabpane ${pestaña === 'e' ? 'on' : ''}" data-p="e">
      <div class="chips" id="exToggle" style="margin-bottom:12px"><button type="button" class="on" data-m="a">Anomalías</button><button type="button" data-m="s">Serie completa</button></div>
      <div class="chart-box" id="chartEx"></div>
      <p class="notice">Rojo: por encima de la referencia ${R.referencia}. Azul: por debajo. Con etiqueta: años muy alejados de lo normal.</p>
      <h4 style="margin-top:24px">El período en tres etapas iguales</h4>
      <p class="notice" style="margin-top:2px">Las etapas tienen la misma cantidad de años; no se eligen mirando el gráfico.</p>
      <div class="thirds">${R.etapas.map(e => { const val = V.relativa ? e.mediana : e.media, tope = Math.max(...R.etapas.map(x => V.relativa ? x.mediana : x.media));
        return `<div class="third"><small>${e.añoInicio}–${e.añoFin}</small><b>${I.cant(val)}</b><div class="bar"><i style="width:${Math.max(4, val / tope * 100)}%"></i></div></div>`; }).join('')}</div>
      <h4 style="margin:24px 0 8px">Observaciones</h4>
      <ul style="margin:0;padding-left:20px;display:grid;gap:6px">${I.obs.map(o => `<li>${o}</li>`).join('')}</ul>
    </div>

    <div class="tabpane ${pestaña === 'v' ? 'on' : ''}" data-p="v">
      <div style="overflow-x:auto"><table class="tests"><thead><tr><th>Comprobación</th><th>Resultado</th><th>Criterio</th><th></th></tr></thead><tbody>
        <tr><td>Cobertura de datos</td><td class="num">${R.n}/${R.serie.length} años (${fmt(R.cobertura * 100, 0)} %)</td><td>≥ 80 %</td><td class="${R.cobertura >= .8 ? 'pass' : 'fail'}">${R.cobertura >= .8 ? 'Cumple' : 'No cumple'}</td></tr>
        <tr><td>Mann-Kendall</td><td class="num">S = ${R.mk.S} · Z = ${fmt(R.mk.Z, 2)} · p = ${fmt(R.mk.p, 3)}</td><td>p &lt; 0.05</td><td class="${R.mk.p < .05 ? 'pass' : 'fail'}">${R.mk.p < .05 ? 'Significativo' : 'No significativo'}</td></tr>
        <tr><td>Pendiente de Sen</td><td class="num">${s10} ${V.unidad}/década</td><td>Magnitud</td><td></td></tr>
        <tr><td>Autocorrelación (1 año)</td><td class="num">r₁ = ${fmt(R.mk.r1, 2)}</td><td>Se ajusta la varianza si r₁ &gt; 0.1</td><td>${R.mk.ajustada ? 'Ajustada' : 'Sin ajuste'}</td></tr>
        <tr><td>Robustez (sin 2 años extremos)</td><td class="num">p = ${fmt(R.sinExtremos.p, 3)} · Sen ${s10b}</td><td>Mismo signo y p &lt; 0.10</td><td class="${R.robusta ? 'pass' : 'fail'}">${R.robusta ? 'Se mantiene' : 'No se mantiene'}</td></tr>
        <tr><td>Relevancia práctica</td><td class="num">${fmt(R.relevancia, 2)} desviaciones</td><td>Cambio total / variación normal</td><td>${R.relevancia >= 1 ? 'Alta' : R.relevancia >= .5 ? 'Media' : 'Baja'}</td></tr>
      </tbody></table></div>
      <p class="notice">Referencia: ${R.referencia} · media ${I.cant(R.base)} · desviación ${I.cant(R.desv)}. Punto consultado: ${A.variableId === 'sst' ? dep.mar.join(', ') : dep.punto.join(', ')} (lat, lon). Estado final: <b>${NL.ESTADOS[R.estado]}</b>.</p>
    </div>

    <div class="result-actions">
      <button class="btn red sm" type="button" id="saveFind">Guardar en Mis hallazgos</button>
      <button class="btn ghost sm" type="button" id="copyJson">Copiar expediente JSON</button>
      <button class="btn ghost sm" type="button" id="toMap">Ver ${dep.nombre} en el mapa</button>
    </div>`;

    NL.graficos.serieAnual($('#chartMain'), R, V);
    NL.graficos.anomalias($('#chartEx'), R, V);
    caja.querySelector('.tabs').onclick = e => {
      const b = e.target.closest('button'); if (!b) return; pestaña = b.dataset.t;
      $$('.tabs button', caja).forEach(x => x.classList.toggle('on', x === b));
      $$('.tabpane', caja).forEach(p => p.classList.toggle('on', p.dataset.p === pestaña));
    };
    $('#exToggle').onclick = e => {
      const b = e.target.closest('button'); if (!b) return;
      $$('#exToggle button').forEach(x => x.classList.toggle('on', x === b));
      b.dataset.m === 's' ? NL.graficos.serieAnual($('#chartEx'), R, V) : NL.graficos.anomalias($('#chartEx'), R, V);
    };
    $('#saveFind').onclick = () => NL.hallazgos.guardarActual();
    $('#copyJson').onclick = copiarExpediente;
    $('#toMap').onclick = () => { NL.territorio.seleccionar(A.lugar); NL.irA('territorio'); };
  }

  /* Expediente científico en JSON (se copia al portapapeles) */
  async function copiarExpediente() {
    const { R, I, lugar, variableId, esReal, pregunta } = actual, V = NL.VARIABLES[variableId], dep = NL.DEP[lugar];
    const expediente = {
      proyecto: 'NiñoLab', pregunta, lugar: dep.nombre, punto_lat_lon: variableId === 'sst' ? dep.mar : dep.punto,
      variable: V.nombre, unidad: V.unidad, fuente: esReal ? V.fuente : 'SERIE DE DEMOSTRACIÓN (sin conexión con NASA POWER)',
      periodo: { año_inicio: R.añoInicio, año_fin: R.añoFin }, cobertura: +R.cobertura.toFixed(3), referencia: R.referencia,
      pruebas: { mann_kendall: { S: R.mk.S, Z: +R.mk.Z.toFixed(3), p: +R.mk.p.toFixed(4), ajuste_autocorrelacion: R.mk.ajustada },
                 pendiente_sen_por_año: +R.mk.sen.toFixed(5), robustez: { p: +R.sinExtremos.p.toFixed(4), se_mantiene: R.robusta } },
      años_excepcionales: R.excepcionales.map(p => p.año), estado: NL.ESTADOS[R.estado], conclusion: I.conclusion,
      serie: R.serie.map(p => ({ año: p.año, valor: p.valor === null ? null : +p.valor.toFixed(3) }))
    };
    const texto = JSON.stringify(expediente, null, 2);
    try { await navigator.clipboard.writeText(texto); NL.aviso('Expediente copiado al portapapeles'); }
    catch (e) {
      const ta = document.createElement('textarea'); ta.value = texto; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); NL.aviso('Expediente copiado'); } catch (_) { NL.aviso('No se pudo copiar'); }
      ta.remove();
    }
  }

  function iniciar() {
    NL.DEP_ORDENADOS.forEach(d => $('#selPlace').insertAdjacentHTML('beforeend', `<option value="${d.id}">${d.nombre}</option>`));
    Object.entries(NL.VARIABLES).forEach(([k, v]) => $('#selVar').insertAdjacentHTML('beforeend', `<option value="${k}">${v.nombre}</option>`));
    for (let a = 1960; a <= 2010; a++) $('#selFrom').insertAdjacentHTML('beforeend', `<option ${a === 1981 ? 'selected' : ''}>${a}</option>`);
    for (let a = 2000; a <= NL.power.AÑO_FIN; a++) $('#selTo').insertAdjacentHTML('beforeend', `<option ${a === NL.power.AÑO_FIN ? 'selected' : ''}>${a}</option>`);
    preparar({ lugar: 'piu', variable: 'pr', pregunta: '¿Cómo han cambiado las lluvias en Piura durante las últimas décadas?' });

    $('#selPlace').addEventListener('change', pintarSugerencias);
    ['selVar', 'selPlace', 'selFrom', 'selTo'].forEach(id => $('#' + id).addEventListener('change', () => { $('#qText').value = preguntaAutomatica(); }));
    $('#qText').addEventListener('change', leerPregunta);
    $('#suggest').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; $('#selVar').value = b.dataset.v; $('#qText').value = preguntaAutomatica(); ejecutar(); });
    $('#invForm').addEventListener('submit', e => { e.preventDefault(); ejecutar(); });
  }

  return { iniciar, ejecutar, preparar, resultado };
})();
