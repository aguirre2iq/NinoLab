/* ==========================================================
   NiñoLab · secciones/hallazgos.js
   Cuaderno de investigaciones guardadas (solo en este navegador).
   ========================================================== */
window.NL = window.NL || {};

NL.hallazgos = (function () {
  const $ = NL.$;
  let lista = NL.guardar.leer('ninolab-hallazgos', []);

  function guardarActual() {
    const A = NL.investigar.resultado(); if (!A || A.error) return;
    const h = { id: Date.now(), titulo: A.I.titulo, pregunta: A.pregunta, lugar: A.lugar, variable: A.variableId,
      desde: A.R.añoInicio, hasta: A.R.añoFin, estado: A.R.estado, conclusion: A.I.conclusion, cambio: A.I.cambioTxt, real: A.esReal,
      fecha: new Date().toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' }) };
    lista = [h, ...lista.filter(x => !(x.lugar === h.lugar && x.variable === h.variable && x.desde === h.desde && x.hasta === h.hasta))].slice(0, 12);
    NL.guardar.escribir('ninolab-hallazgos', lista); pintar(); NL.aviso('Guardado en Mis hallazgos');
  }

  function pintar() {
    const caja = $('#findsBox');
    if (!lista.length) {
      caja.innerHTML = `<div class="empty"><svg width="56" height="68"><use href="#duke"/></svg>
        <h3>Aún no guardas ninguna investigación</h3>
        <p>Corre una investigación y pulsa “Guardar en Mis hallazgos”. Aquí verás su conclusión y su nivel de evidencia.</p>
        <a class="btn sm" href="#investigar">Ir a Investigar</a></div>`;
      return;
    }
    caja.innerHTML = `<div class="finds">${lista.map(h => `<article class="find">
      <span class="status ${h.estado}" style="justify-self:start">${NL.ESTADOS[h.estado]}</span>
      <h3>${h.titulo}</h3><p class="q">“${h.pregunta}”</p><p>${h.conclusion}</p>
      <div class="meta"><span>${NL.DEP[h.lugar].nombre}</span><span>${NL.VARIABLES[h.variable].nombre}</span><span>${h.desde}–${h.hasta}</span><span>${h.cambio}</span></div>
      <div class="ft"><span>${h.fecha} · ${h.real ? 'NASA POWER' : 'serie de demostración'}</span>
        <div><button class="linkbtn" data-abrir="${h.id}" type="button">Abrir</button><button class="linkbtn" data-quitar="${h.id}" type="button" style="color:var(--muted)">Quitar</button></div></div>
    </article>`).join('')}</div><p class="notice" style="margin-top:14px">Guardado solo en este navegador.</p>`;
  }

  function iniciar() {
    pintar();
    $('#findsBox').addEventListener('click', e => {
      const abrir = e.target.closest('[data-abrir]'), quitar = e.target.closest('[data-quitar]');
      if (abrir) {
        const h = lista.find(x => x.id == abrir.dataset.abrir);
        NL.investigar.preparar({ lugar: h.lugar, variable: h.variable, desde: h.desde, hasta: h.hasta, pregunta: h.pregunta });
        NL.irA('investigar'); NL.investigar.ejecutar();
      }
      if (quitar) { lista = lista.filter(x => x.id != quitar.dataset.quitar); NL.guardar.escribir('ninolab-hallazgos', lista); pintar(); }
    });
  }

  return { iniciar, guardarActual };
})();
