/* ==========================================================
   NiñoLab · secciones/indice.js
   Índice costero NiñoLab (región Niño 1+2) calculado con
   NASA POWER. Escala de categorías, serie histórica y
   comparación entre años. No es el ICEN oficial del ENFEN.
   ========================================================== */
window.NL = window.NL || {};

NL.indice = (function () {
  const $ = NL.$, $$ = NL.$$, fmt = NL.fmt, MONO = 'font-family="JetBrains Mono, monospace"';

  /* Categorías y umbrales de la escala ICEN (Nota Técnica ENFEN 01-2024), usados aquí como referencia */
  const CORTES = [-1.3, -1.1, -0.7, 0.5, 1.3, 2.1, 3.5];
  const CATEGORIAS = [
    ['Fría fuerte', '#1F3F7A'], ['Fría moderada', '#2F6DB5'], ['Fría débil', '#6FAEE3'], ['Neutra', '#D5DAE0'],
    ['Cálida débil', '#F2C037'], ['Cálida moderada', '#F08A24'], ['Cálida fuerte', '#C8202B'], ['Cálida extraordinaria', '#6E0F17']
  ];
  const categoria = v => { let i = 0; while (i < CORTES.length && v >= CORTES[i]) i++; return i; };

  const SERIE = NL.INDICE.map(([am, v]) => ({ año: +am.slice(0, 4), mes: +am.slice(4), v }));
  const POR_MES = Object.fromEntries(NL.INDICE);
  const ultimo = SERIE[SERIE.length - 1];
  let rango = 5, bloqueA = ultimo.año, bloqueB = 1997;

  function pintarValor() {
    const c = categoria(ultimo.v);
    $('#indValor').textContent = NL.signo(ultimo.v, 2);
    $('#indValor').style.color = CATEGORIAS[c][1];
    $('#indCat').textContent = CATEGORIAS[c][0]; $('#indCat').style.background = CATEGORIAS[c][1];
    $('#indFecha').textContent = `${NL.MESES_LARGO[ultimo.mes - 1]} de ${ultimo.año}`;
    if ($('#heroIndice')) { $('#heroIndice').textContent = NL.signo(ultimo.v, 1) + ' °C'; $('#heroIndiceTxt').textContent = `${CATEGORIAS[c][0]} · ${NL.MESES[ultimo.mes - 1]} ${ultimo.año}`; }
    $('#escBarra').innerHTML = CATEGORIAS.map(([n, col], i) => `<span style="background:${col}" class="${i >= 2 && i <= 4 ? 'claro' : ''}">${n}</span>`).join('');
    $('#escCortes').innerHTML = CORTES.map(x => `<span>${NL.signo(x, 1)}</span>`).join('') + '<span></span>';
    // Posición de la marca sobre la barra
    const borde = [CORTES[0] - 1.5, ...CORTES, CORTES[6] + 2];
    const parte = Math.max(0, Math.min(1, (ultimo.v - borde[c]) / (borde[c + 1] - borde[c])));
    $('#escMarca').textContent = `${NL.MESES[ultimo.mes - 1]} ${ultimo.año}: ${NL.signo(ultimo.v, 2)}`;
    setTimeout(() => { $('#escMarca').style.left = Math.max(8, Math.min(92, (c + parte) / 8 * 100)) + '%'; }, 200);
  }

  /* Barras mensuales, cada una con el color de su categoría */
  function pintarHistoria() {
    const datos = rango ? SERIE.filter(p => p.año > ultimo.año - rango) : SERIE;
    const W = 1000, H = 250, L = 44, D = 10, T = 12, B = 30;
    const hi = Math.ceil(Math.max(...datos.map(p => p.v), 3.5) + .4), lo = Math.floor(Math.min(...datos.map(p => p.v), -1.5) - .2);
    const ancho = (W - L - D) / datos.length, X = i => L + i * ancho, Y = v => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
    const cadaCuanto = rango === 5 ? 1 : rango === 10 ? 1 : rango === 20 ? 2 : 5;
    let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Serie histórica del índice costero">`;
    for (let v = lo; v <= hi; v++) svg += `<text x="${L - 8}" y="${Y(v) + 4}" text-anchor="end" font-size="12" fill="#5F5759" ${MONO}>${v > 0 ? '+' : ''}${v}</text><line x1="${L}" x2="${W - D}" y1="${Y(v)}" y2="${Y(v)}" stroke="${v === 0 ? '#151112' : '#EFEAEA'}"/>`;
    CORTES.forEach(c => { svg += `<line x1="${L}" x2="${W - D}" y1="${Y(c)}" y2="${Y(c)}" stroke="#B9AFAF" stroke-dasharray="3 4"/>`; });
    datos.forEach((p, i) => {
      const y = Y(Math.max(0, p.v)), h = Math.max(1, Math.abs(Y(p.v) - Y(0)));
      svg += `<rect x="${X(i) + ancho * .08}" y="${y}" width="${Math.max(.6, ancho * .84)}" height="${h}" fill="${CATEGORIAS[categoria(p.v)][1]}" data-tip="${NL.MESES[p.mes - 1]} ${p.año}: ${NL.signo(p.v, 2)} · ${CATEGORIAS[categoria(p.v)][0]}"/>`;
      if (p.mes === 1 && p.año % cadaCuanto === 0) svg += `<text x="${X(i)}" y="${H - 10}" font-size="12" fill="#5F5759" ${MONO}>${p.año}</text>`;
    });
    $('#indHistoria').innerHTML = svg + '</svg>'; NL.globos($('#indHistoria'));
    $$('#indRango button').forEach(b => b.classList.toggle('on', +b.dataset.r === rango));
  }

  /* Dos bloques de 24 meses, uno sobre otro */
  function pintarComparacion() {
    const bloque = a => Array.from({ length: 24 }, (_, i) => { const año = a + Math.floor(i / 12), mes = i % 12 + 1; const v = POR_MES[año + String(mes).padStart(2, '0')]; return v === undefined ? null : v; });
    const A = bloque(bloqueA), Bq = bloque(bloqueB);
    const W = 1000, H = 290, L = 44, D = 14, T = 14, B = 34, lo = -3, hi = 5.5;
    const X = i => L + i / 23 * (W - L - D), Y = v => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
    const borde = [lo, ...CORTES, hi];
    let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Comparación del índice entre años">`;
    CATEGORIAS.forEach(([n, col], i) => { svg += `<rect x="${L}" y="${Y(borde[i + 1])}" width="${W - L - D}" height="${Y(borde[i]) - Y(borde[i + 1])}" fill="${col}" opacity=".16"/>`; });
    for (let v = -3; v <= 5; v += 2) svg += `<text x="${L - 8}" y="${Y(v) + 4}" text-anchor="end" font-size="12" fill="#5F5759" ${MONO}>${v > 0 ? '+' : ''}${v}</text>`;
    for (let i = 0; i < 24; i++) svg += `<text x="${X(i)}" y="${H - 12}" text-anchor="middle" font-size="11" fill="#5F5759" ${MONO}>${NL.MESES[i % 12]}</text>`;
    svg += `<line x1="${X(11.5)}" x2="${X(11.5)}" y1="${T}" y2="${H - B}" stroke="#B9AFAF" stroke-dasharray="3 4"/>`;
    const linea = (vals, color, guion, base) => {
      let d = '', abierto = false, puntos = '';
      vals.forEach((v, i) => { if (v === null) { abierto = false; return; } d += (abierto ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1); abierto = true;
        puntos += `<circle cx="${X(i)}" cy="${Y(v)}" r="4.5" fill="${color}" stroke="#fff" stroke-width="1.5" data-tip="${NL.MESES[i % 12]} ${base + Math.floor(i / 12)}: ${NL.signo(v, 2)}"/>`; });
      return `<path d="${d}" fill="none" stroke="${color}" stroke-width="2.6" ${guion ? 'stroke-dasharray="6 5"' : ''}/>${puntos}`;
    };
    svg += linea(Bq, '#151112', true, bloqueB) + linea(A, '#D3202B', false, bloqueA);
    $('#indComparar').innerHTML = svg + '</svg>'; NL.globos($('#indComparar'));
    $('#cmpLeyenda').innerHTML = `<span><i style="background:#D3202B"></i>${bloqueA}–${bloqueA + 1}</span><span><i style="border-top:3px dashed #151112;height:0"></i>${bloqueB}–${bloqueB + 1}</span>`;
  }

  /* Datos que usa la cronología para el episodio en curso */
  function resumen() {
    const maximo = (a, b) => Math.max(...SERIE.filter(p => p.año >= a && p.año <= b).map(p => p.v));
    let mesesCalidos = 0; for (let i = SERIE.length - 1; i >= 0 && SERIE[i].v >= CORTES[3]; i--) mesesCalidos++;
    const esRecord = ultimo.v >= Math.max(...SERIE.map(p => p.v));
    return { mesesCalidos, esRecord, ultimo, categoria: CATEGORIAS[categoria(ultimo.v)][0], max1983: maximo(1982, 1983), max1998: maximo(1997, 1998), max2017: maximo(2017, 2017), max2023: maximo(2023, 2023) };
  }

  function iniciar() {
    const años = [...new Set(SERIE.map(p => p.año))];
    $('#selBloqueA').innerHTML = años.filter(a => a >= 1982).map(a => `<option value="${a}" ${a === bloqueA ? 'selected' : ''}>${a}–${a + 1}</option>`).join('');
    $('#selBloqueB').innerHTML = [[1982, 'extraordinario'], [1997, 'extraordinario'], [2015, 'fuerte'], [2016, 'costero 2017'], [2023, 'costero']].map(([a, n]) => `<option value="${a}" ${a === bloqueB ? 'selected' : ''}>${a}–${a + 1} · ${n}</option>`).join('');
    $('#selBloqueA').onchange = e => { bloqueA = +e.target.value; pintarComparacion(); };
    $('#selBloqueB').onchange = e => { bloqueB = +e.target.value; pintarComparacion(); };
    $('#indRango').onclick = e => { const b = e.target.closest('button'); if (!b) return; rango = +b.dataset.r; pintarHistoria(); };
    pintarValor(); pintarHistoria(); pintarComparacion();
  }

  return { iniciar, resumen };
})();
