/* ==========================================================
   NiñoLab · secciones/perfil.js
   Tres preguntas (sin inicio de sesión) que adaptan las
   explicaciones y sugerencias. No cambian los resultados.
   ========================================================== */
window.NL = window.NL || {};

NL.perfil = (function () {
  const $ = NL.$, $$ = NL.$$;
  let perfil = NL.guardar.leer('ninolab-perfil', null);
  let borrador = perfil ? { ...perfil } : { sector: null, region: 'piu', preocupacion: null };
  let paso = 0;

  const actual = () => perfil;

  /* Variable que conviene mostrar primero a este perfil */
  function variableSugerida(p) {
    let v = p.preocupacion ? NL.PREOCUPACIONES[p.preocupacion].variable : (p.sector ? NL.SECTORES[p.sector].variable : 'pr');
    if (v === 'sst' && !NL.DEP[p.region].costa) v = 't2m';
    return v;
  }
  function preguntaSugerida(p) {
    const lugar = NL.DEP[p.region].nombre;
    return { pr: `¿Cómo han cambiado las lluvias en ${lugar} durante las últimas décadas?`,
             t2m: `¿Está haciendo más calor en ${lugar} que antes?`,
             sm: `¿El suelo de ${lugar} está más seco que antes?`,
             sst: `¿El mar frente a ${lugar} está más caliente que antes?` }[variableSugerida(p)];
  }

  function pintarOpciones() {
    $$('#optSector .opt').forEach(b => b.classList.toggle('sel', b.dataset.k === borrador.sector));
    $$('#optConcern .opt').forEach(b => b.classList.toggle('sel', b.dataset.k === borrador.preocupacion));
    $('#selRegion').value = borrador.region;
  }

  function irPaso(n) {
    paso = n;
    $$('.step').forEach((s, i) => s.classList.toggle('on', i === n));
    $$('.steps-bar i').forEach((s, i) => s.classList.toggle('on', i <= n));
    $('#prevStep').hidden = n === 0;
    $('#nextStep').textContent = n === 2 ? 'Adaptar NiñoLab ✓' : 'Siguiente →';
  }

  /* Panel de la derecha: muestra en vivo qué cambia */
  function pintarAdaptacion(p) {
    const caja = $('#adaptBox');
    if (!p.sector) {
      caja.innerHTML = `<h3>Así se adapta NiñoLab</h3>
        <p class="muted">Responde la primera pregunta y verás aquí, en vivo, qué cambia en la plataforma para ti.</p>
        <ul class="adapt-list">
          <li><span>Variables</span><span>Te mostramos primero las que importan a tu actividad.</span></li>
          <li><span>Explicaciones</span><span>“¿Qué significa para mí?” se escribe para tu sector.</span></li>
          <li><span>Duke</span><span>Tu asistente te habla en tu contexto.</span></li>
        </ul>
        <p class="adapt-note">Lo que nunca cambia: los datos, las pruebas y el estado de la evidencia.</p>`;
      return;
    }
    const s = NL.SECTORES[p.sector], v = NL.VARIABLES[variableSugerida(p)], d = NL.DEP[p.region];
    caja.innerHTML = `<h3>Perfil: ${s.nombre} · ${d.nombre}</h3>
      <p class="muted">Esto es lo que cambia para ti.</p>
      <ul class="adapt-list">
        <li><span>Variable inicial</span><span>${v.nombre} · ${v.fuente}</span></li>
        <li><span>Tu pregunta</span><span>“${preguntaSugerida(p)}”</span></li>
        <li><span>Implicaciones</span><span>Escritas para ${s.nombre.toLowerCase()}: ${s.pista.toLowerCase()}.</span></li>
        <li><span>Mapa</span><span>Se abre en ${d.nombre}${d.costa ? ', con su mar disponible' : ''}.</span></li>
      </ul>
      <p class="adapt-note">Lo que nunca cambia: los datos, las pruebas y el estado de la evidencia.</p>`;
  }

  /* Aplica el perfil al resto de la página */
  function aplicar(investigar) {
    if (!perfil) return;
    $('#profilePill').classList.add('on');
    $('#profilePillTxt').textContent = `${NL.SECTORES[perfil.sector].corto} · ${NL.DEP[perfil.region].nombre}`;
    NL.investigar.preparar({ lugar: perfil.region, variable: variableSugerida(perfil), pregunta: preguntaSugerida(perfil) });
    NL.territorio.seleccionar(perfil.region);
    if (NL.DEP[perfil.region].costa) NL.oceano.elegirLugar(perfil.region);
    if (investigar) NL.investigar.ejecutar();
  }

  function iniciar() {
    $('#optSector').innerHTML = Object.entries(NL.SECTORES).map(([k, s]) =>
      `<button type="button" class="opt" data-k="${k}">${NL.icono(s.icono)}<b>${s.nombre}</b><small>${s.pista}</small></button>`).join('');
    $('#optConcern').innerHTML = Object.entries(NL.PREOCUPACIONES).map(([k, s]) =>
      `<button type="button" class="opt" data-k="${k}"><b>${s.nombre}</b><small>${s.pista}</small></button>`).join('');
    $('#selRegion').innerHTML = NL.DEP_ORDENADOS.map(d => `<option value="${d.id}">${d.nombre}</option>`).join('');

    $('#optSector').addEventListener('click', e => {
      const b = e.target.closest('.opt'); if (!b) return;
      borrador.sector = b.dataset.k; pintarOpciones(); pintarAdaptacion(borrador); setTimeout(() => irPaso(1), 250);
    });
    $('#optConcern').addEventListener('click', e => {
      const b = e.target.closest('.opt'); if (!b) return;
      borrador.preocupacion = b.dataset.k; pintarOpciones(); pintarAdaptacion(borrador);
    });
    $('#selRegion').addEventListener('change', e => { borrador.region = e.target.value; pintarAdaptacion(borrador); });
    $('#prevStep').onclick = () => irPaso(Math.max(0, paso - 1));
    $('#nextStep').onclick = () => {
      if (paso === 0 && !borrador.sector) { NL.aviso('Elige tu actividad para continuar'); return; }
      if (paso < 2) { irPaso(paso + 1); return; }
      if (!borrador.preocupacion) { NL.aviso('Elige qué te preocupa más'); return; }
      perfil = { ...borrador }; NL.guardar.escribir('ninolab-perfil', perfil);
      aplicar(true);
      NL.aviso('Listo. NiñoLab se adaptó a tu perfil');
      setTimeout(() => NL.irA('investigar'), 500);
    };
    $('#profilePill').onclick = () => { irPaso(0); NL.irA('perfil'); };

    pintarOpciones(); pintarAdaptacion(borrador);
  }

  return { iniciar, aplicar, actual };
})();
