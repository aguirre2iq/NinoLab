/* ==========================================================
   NiñoLab · graficos.js
   Gráficos SVG de la investigación: serie anual y anomalías.
   ========================================================== */
window.NL = window.NL || {};

NL.graficos = (function () {
  const fmt = NL.fmt, MONO = 'font-family="JetBrains Mono, monospace"';

  /* Serie anual con referencia, tendencia de Sen y años excepcionales */
  function serieAnual(caja, R, V) {
    const W = 760, H = 310, L = 62, D = 16, T = 20, B = 36;
    const valores = R.puntos.map(p => p.valor);
    const marcas = NL.marcas(V.relativa ? 0 : Math.min(...valores, R.base), Math.max(...valores, R.base));
    const y0 = marcas[0], y1 = marcas[marcas.length - 1];
    const X = a => L + (a - R.añoInicio) / (R.añoFin - R.añoInicio) * (W - L - D);
    const Y = v => T + (1 - (v - y0) / (y1 - y0)) * (H - T - B);

    // Tramos continuos (se cortan donde falta un año)
    const tramos = []; let tramo = [];
    R.serie.forEach(p => { if (p.valor === null) { if (tramo.length) tramos.push(tramo); tramo = []; } else tramo.push(p); });
    if (tramo.length) tramos.push(tramo);
    const linea = tramos.map(t => t.map((p, i) => (i ? 'L' : 'M') + X(p.año).toFixed(1) + ' ' + Y(p.valor).toFixed(1)).join('')).join('');
    const area = tramos.filter(t => t.length > 1).map(t =>
      `M${X(t[0].año)} ${Y(y0)}` + t.map(p => `L${X(p.año).toFixed(1)} ${Y(p.valor).toFixed(1)}`).join('') + `L${X(t[t.length - 1].año)} ${Y(y0)}Z`).join('');

    const años = []; for (let a = Math.ceil(R.añoInicio / 5) * 5; a <= R.añoFin; a += 5) años.push(a);
    const exc = new Set(R.excepcionales.map(p => p.año));
    const t0 = R.mk.corte + R.mk.sen * R.añoInicio, t1 = R.mk.corte + R.mk.sen * R.añoFin;
    const decEje = V.dec > 1 ? 2 : (y1 - y0 < 5 ? 1 : 0);

    caja.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Serie anual de ${V.nombre}">
      <defs><linearGradient id="relleno" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#D3202B" stop-opacity=".18"/><stop offset="1" stop-color="#D3202B" stop-opacity="0"/></linearGradient></defs>
      ${marcas.map(m => `<line x1="${L}" x2="${W - D}" y1="${Y(m)}" y2="${Y(m)}" stroke="#E8E1E1"/><text x="${L - 8}" y="${Y(m) + 4}" text-anchor="end" font-size="12" fill="#5F5759" ${MONO}>${fmt(m, decEje)}</text>`).join('')}
      ${años.map(a => `<text x="${X(a)}" y="${H - 12}" text-anchor="middle" font-size="12" fill="#5F5759" ${MONO}>${a}</text>`).join('')}
      <text x="${L}" y="13" font-size="12" fill="#5F5759" ${MONO}>${V.unidad}</text>
      <path d="${area}" fill="url(#relleno)"/>
      <line x1="${L}" x2="${W - D}" y1="${Y(R.base)}" y2="${Y(R.base)}" stroke="#5F5759" stroke-dasharray="4 4"/>
      <path d="${linea}" fill="none" stroke="#151112" stroke-width="2.2" stroke-linejoin="round" class="trazo"/>
      <line x1="${X(R.añoInicio)}" x2="${X(R.añoFin)}" y1="${Y(t0)}" y2="${Y(t1)}" stroke="#D3202B" stroke-width="2.6" ${R.estado === 'ok' ? '' : 'stroke-dasharray="2 6" stroke-linecap="round"'}/>
      ${R.puntos.map(p => `<circle cx="${X(p.año)}" cy="${Y(p.valor)}" r="${exc.has(p.año) ? 6 : 3.4}" fill="${exc.has(p.año) ? '#D3202B' : '#fff'}" stroke="${exc.has(p.año) ? '#D3202B' : '#151112'}" stroke-width="1.6" data-tip="${p.año}: ${fmt(p.valor, V.dec)} ${V.unidad}"/>${exc.has(p.año) ? `<text x="${X(p.año)}" y="${Math.max(13, Y(p.valor) - 11)}" text-anchor="middle" font-size="12" font-weight="700" fill="#D3202B" ${MONO}>${p.año}</text>` : ''}`).join('')}
      ${R.serie.filter(p => p.valor === null).map(p => `<text x="${X(p.año)}" y="${H - B - 4}" text-anchor="middle" font-size="12" fill="#A86700" data-tip="${p.año}: sin dato">×</text>`).join('')}
    </svg>`;
    NL.globos(caja);

    // La línea se "dibuja" al aparecer
    const trazo = caja.querySelector('.trazo');
    if (trazo && !NL.sinAnimacion && trazo.getTotalLength) {
      const largo = trazo.getTotalLength();
      trazo.style.strokeDasharray = largo; trazo.style.strokeDashoffset = largo; trazo.getBoundingClientRect();
      trazo.style.transition = 'stroke-dashoffset 1.4s ease'; trazo.style.strokeDashoffset = 0;
      setTimeout(() => { trazo.style.strokeDasharray = 'none'; }, 1500);
    }
  }

  /* Barras de anomalía: cuánto se apartó cada año de la referencia */
  function anomalias(caja, R, V) {
    const W = 760, H = 290, L = 62, D = 16, T = 20, B = 36;
    const vals = R.puntos.map(p => V.relativa ? (p.valor / R.base - 1) * 100 : p.anomalia);
    const tope = Math.max(...vals.map(Math.abs)), marcas = NL.marcas(-tope, tope, 6), lo = marcas[0], hi = marcas[marcas.length - 1];
    const ancho = (W - L - D) / (R.añoFin - R.añoInicio + 1);
    const X = a => L + (a - R.añoInicio) * ancho, Y = v => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
    const exc = new Set(R.excepcionales.map(p => p.año));
    const años = []; for (let a = Math.ceil(R.añoInicio / 5) * 5; a <= R.añoFin; a += 5) años.push(a);
    const uni = V.relativa ? ' %' : ' ' + V.unidad;

    caja.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Anomalías anuales">
      ${marcas.map(m => `<line x1="${L}" x2="${W - D}" y1="${Y(m)}" y2="${Y(m)}" stroke="#E8E1E1"/><text x="${L - 8}" y="${Y(m) + 4}" text-anchor="end" font-size="12" fill="#5F5759" ${MONO}>${m > 0 ? '+' : ''}${fmt(m, Math.abs(hi) < 3 ? 1 : 0)}</text>`).join('')}
      <text x="${L}" y="13" font-size="12" fill="#5F5759" ${MONO}>${V.relativa ? '% respecto a la referencia' : 'diferencia en ' + V.unidad}</text>
      <line x1="${L}" x2="${W - D}" y1="${Y(0)}" y2="${Y(0)}" stroke="#151112"/>
      ${R.puntos.map((p, i) => { const v = vals[i], y = Y(Math.max(0, v)), h = Math.abs(Y(v) - Y(0));
        return `<rect x="${X(p.año) + ancho * .15}" y="${y}" width="${ancho * .7}" height="${Math.max(1, h)}" rx="2" fill="${v >= 0 ? '#D3202B' : '#1F6FB5'}" opacity="${exc.has(p.año) ? 1 : .6}" data-tip="${p.año}: ${NL.signo(v, V.relativa ? 0 : V.dec)}${uni}"/>${exc.has(p.año) ? `<text x="${X(p.año) + ancho / 2}" y="${v >= 0 ? y - 5 : y + h + 14}" text-anchor="middle" font-size="11" font-weight="700" fill="#D3202B" ${MONO}>${p.año}</text>` : ''}`; }).join('')}
      ${años.map(a => `<text x="${X(a) + ancho / 2}" y="${H - 12}" text-anchor="middle" font-size="12" fill="#5F5759" ${MONO}>${a}</text>`).join('')}
    </svg>`;
    NL.globos(caja);
  }

  return { serieAnual, anomalias };
})();
