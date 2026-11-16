/* ==========================================================
   NiñoLab · duke.js
   Duke, el asistente. Responde con explicaciones fijas y con
   los resultados que calculó el motor. No inventa cifras.
   ========================================================== */
window.NL = window.NL || {};

NL.duke = (function () {
  const $ = NL.$;
  const RESPUESTAS = {
    '¿Qué es una anomalía?': 'Una anomalía es la diferencia entre lo que pasó y lo normal. Si en un año típico llueven 150 mm y un año llueven 1 500 mm, ese año tiene una anomalía enorme. Una anomalía es un año; una tendencia es un cambio sostenido en muchos años.',
    '¿Anomalía o tendencia?': 'Un año extremo no hace una tendencia. Por eso NiñoLab repite la prueba sin los dos años más extremos: si la tendencia desaparece, dependía de unos pocos episodios y la marcamos como inconclusa.',
    '¿Qué es El Niño costero?': 'Es cuando el mar frente a la costa de Perú y Ecuador se calienta, aunque el Pacífico central no lo haga. Se vigila en la región Niño 1+2. Pasó en 1925, 2017 y 2023.',
    '¿ONI o ICEN?': 'Miden lugares distintos. El ONI (NOAA) mira el Pacífico central, región Niño 3.4. El ICEN (ENFEN) mira frente a nuestra costa, región Niño 1+2. Para las lluvias del norte peruano, el mar frente a la costa suele ser más útil.',
    '¿De dónde salen los datos?': 'Las series históricas vienen de NASA POWER, desde 1981. Los mapas del mar son imágenes satelitales de NASA GIBS. El clima de hoy por departamento viene de Open-Meteo, como fuente complementaria. Si no hay conexión, la página lo dice y usa ejemplos marcados.',
    '¿Pueden predecir El Niño?': 'NiñoLab analiza lo observado. No predice El Niño. Los pronósticos los emiten instituciones con modelos validados, como el ENFEN y NOAA.'
  };
  const CONTEXTO = {
    inicio: '¡Hola! Soy Duke. Arrastra el planeta para girarlo. Cuando quieras, empieza con tu perfil: son 3 preguntas.',
    perfil: 'Tu perfil cambia cómo te explico las cosas, pero nunca cambia los números. Así todos ven la misma ciencia.',
    investigar: 'Escribe tu pregunta con tus palabras. Pido los datos a NASA POWER y reviso que alcancen antes de responder.',
    territorio: 'Toca un departamento y cambia de capa con los íconos: lluvia, nubes, humedad, temperatura y viento.',
    oceano: 'Haz clic en cualquier punto del mar y te digo su valor. Abajo puedes comparar dos lugares de la costa.',
    cronologia: 'El nombre “El Niño” lo pusieron los pescadores de Paita. Toca 1892 para la historia.',
    hallazgos: 'Aquí guardas tus investigaciones, como un cuaderno de detective.',
    metodo: '¿Quieres saber cómo compruebo un resultado? Aquí están las pruebas, las fuentes y las reglas.'
  };
  let abierto = false, ultimaSeccion = null;

  function decir(texto, quien) {
    const caja = $('#dukeMsgs'), m = document.createElement('div');
    m.className = 'msg ' + (quien || 'd'); m.textContent = texto; caja.appendChild(m); caja.scrollTop = caja.scrollHeight;
  }

  /* Explica la investigación actual con los números del motor */
  function explicarResultado() {
    const A = NL.investigar.resultado();
    if (!A) return 'Aún no hay una investigación. Ve a Investigar y pulsa el botón rojo.';
    if (A.error) return A.error;
    const porque = { ok: 'porque la prueba de tendencia fue significativa y se mantuvo sin los años extremos', insuf: 'porque la prueba no alcanzó el nivel exigido', inc: 'porque el resultado depende de pocos años o faltan datos' }[A.R.estado];
    return `${A.I.conclusion} En números simples: ${A.I.cambioTxt} en los últimos años que al inicio. El estado es “${NL.ESTADOS[A.R.estado]}” ${porque}.${A.esReal ? '' : ' Ojo: no hubo conexión con NASA y esta serie es de demostración.'}`;
  }

  function abrir() {
    abierto = true; $('#dukePanel').hidden = false; $('#dukePing').hidden = true;
    if (!$('#dukeMsgs').children.length) {
      const p = NL.perfil.actual();
      decir(p ? `¡Hola de nuevo! Veo que te interesa ${NL.SECTORES[p.sector].nombre.toLowerCase()} en ${NL.DEP[p.region].nombre}.` : CONTEXTO.inicio);
    }
  }
  function cerrar() { abierto = false; $('#dukePanel').hidden = true; }

  /* La página avisa a Duke cuando cambia la sección visible */
  function alCambiarSeccion(seccion) {
    if (seccion === ultimaSeccion) return; ultimaSeccion = seccion;
    if (abierto && CONTEXTO[seccion]) decir(CONTEXTO[seccion]); else $('#dukePing').hidden = false;
  }
  function alTerminar() { if (abierto) decir('Terminé la investigación. Pulsa “Explícame este resultado” si quieres que te la cuente en simple.'); }

  function iniciar() {
    $('#dukeQ').innerHTML = ['Explícame este resultado', ...Object.keys(RESPUESTAS)].map(k => `<button type="button">${k}</button>`).join('');
    $('#dukeQ').onclick = e => {
      const b = e.target.closest('button'); if (!b) return; const k = b.textContent;
      decir(k, 'u'); setTimeout(() => decir(k === 'Explícame este resultado' ? explicarResultado() : RESPUESTAS[k]), NL.sinAnimacion ? 0 : 350);
    };
    $('#dukeFab').onclick = () => abierto ? cerrar() : abrir();
    $('#dukeClose').onclick = cerrar;
  }

  return { iniciar, alCambiarSeccion, alTerminar };
})();
