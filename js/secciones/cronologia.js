/* ==========================================================
   NiñoLab · secciones/cronologia.js
   Línea de tiempo de El Niño en el Perú, paneles de historias
   y cinta de avisos. El último punto ("en curso") se arma con
   el índice costero real, no con texto inventado.
   ========================================================== */
window.NL = window.NL || {};

NL.cronologia = (function () {
  const $ = NL.$;
  const ICONOS = {
    mar: '<path d="M2 12c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/><path d="M2 17c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/><path d="M2 7c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/>',
    tierra: '<path d="M3 20h18"/><path d="M5 20l5-9 3 5 2-3 4 7"/>',
    gente: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3 3-6 6-6s6 3 6 6"/><circle cx="17" cy="9" r="2"/><path d="M15 14c3 0 6 2 6 5"/>'
  };
  let eventos = [], elegido = 0;

  /* Episodio en curso: solo aparece si el índice real está en condición cálida moderada o mayor */
  function episodioActual() {
    const r = NL.indice.resumen(), u = r.ultimo;
    if (u.v < 1.3) return null;
    const mes = NL.MESES_LARGO[u.mes - 1];
    return { año: String(u.año), tipo: 'En curso · datos NASA', titulo: `El mar frente al Perú, hoy: ${r.categoria.toLowerCase()}`, etiqueta: 'En curso', vivo: true,
      mar: `El índice costero que NiñoLab calcula con datos de NASA llegó a ${NL.signo(u.v, 1)} °C en ${mes} de ${u.año}. En la misma serie, el máximo de 1983 fue ${NL.signo(r.max1983, 1)} °C y el de 1997–98 fue ${NL.signo(r.max1998, 1)} °C.`,
      tierra: `El mar de la región Niño 1+2 lleva ${r.mesesCalidos} meses seguidos en condición cálida${r.esRecord ? ' y el último valor es el más alto de toda la serie, que empieza en 1981' : ''}. Mira el mapa del océano para ver dónde está el agua más caliente hoy.`,
      gente: 'Los efectos en tierra de un episodio en curso los informan el ENFEN, SENAMHI e INDECI. NiñoLab no los resume sin una fuente oficial.',
      oceano: true };
  }

  function pintar() {
    const e = eventos[elegido];
    $('#tlTrack').innerHTML = eventos.map((x, i) => `<button type="button" class="tl-node ${i === elegido ? 'on' : ''} ${x.vivo ? 'vivo' : ''}" data-i="${i}" role="tab" aria-selected="${i === elegido}"><span class="dot"></span><b>${x.año}</b><small>${x.etiqueta}</small></button>`).join('');
    $('#tlDetail').innerHTML = `
      <div class="tl-main"><span class="tl-kind">${e.tipo}</span><div class="yr">${e.año}</div><h3>${e.titulo}</h3>
        <p class="lede">${e.tierra}</p>
        <div class="cta-row">
          ${e.investigar ? '<button class="btn red sm" type="button" id="tlInv">Investigar este episodio</button>' : ''}
          ${e.oceano ? '<a class="btn red sm" href="#oceano">Ver el mar hoy</a>' : ''}
          <button class="btn ghost sm" type="button" id="tlNext">${elegido < eventos.length - 1 ? 'Siguiente episodio →' : 'Volver al inicio ↺'}</button>
        </div>
        <p class="notice">Para verificar: ENFEN, IGP, NOAA y registros históricos.</p></div>
      <div class="tl-facets">
        <div class="tl-facet"><span class="ic">${NL.icono(ICONOS.mar)}</span><div><h4>En el mar</h4><p>${e.mar}</p></div></div>
        <div class="tl-facet"><span class="ic">${NL.icono(ICONOS.gente)}</span><div><h4>Para la gente</h4><p>${e.gente}</p></div></div>
      </div>`;
    const pista = $('#tlTrack'), nodo = pista.children[elegido];
    pista.scrollTo({ left: nodo.offsetLeft - pista.clientWidth / 2 + nodo.clientWidth / 2, behavior: NL.sinAnimacion ? 'auto' : 'smooth' });
    $('#tlNext').onclick = () => { elegido = (elegido + 1) % eventos.length; pintar(); };
    if (e.investigar) $('#tlInv').onclick = () => { NL.investigar.preparar({ ...e.investigar, hasta: NL.power.AÑO_FIN }); NL.irA('investigar'); NL.investigar.ejecutar(); };
  }

  function iniciar() {
    const hoy = episodioActual();
    eventos = hoy ? [...NL.EVENTOS, hoy] : NL.EVENTOS.slice();
    elegido = eventos.length - 1;
    $('#tlTrack').addEventListener('click', e => { const b = e.target.closest('.tl-node'); if (b) { elegido = +b.dataset.i; pintar(); } });
    pintar();
    $('#tlTrack').scrollLeft = $('#tlTrack').scrollWidth;

    $('#news').innerHTML = NL.HISTORIAS.map(n => `<article class="news-card reveal"><div class="news-art"><svg viewBox="0 0 400 130" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${n.arte}</svg></div>
      <div class="news-body"><span class="k">${n.clave}</span><h4>${n.titulo}</h4><p>${n.texto}</p></div></article>`).join('');
    $('#tickerRun').innerHTML = [...NL.CINTA, ...NL.CINTA].map(t => `<span>${t}</span>`).join('');
  }

  return { iniciar };
})();
