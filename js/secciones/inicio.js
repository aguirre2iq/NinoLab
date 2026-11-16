/* ==========================================================
   NiñoLab · secciones/inicio.js
   Portada: planeta que gira (se arrastra con el mouse o el dedo)
   y las 5 preguntas que se van iluminando. Solo visual.
   ========================================================== */
window.NL = window.NL || {};

NL.inicio = (function () {
  const RAD = Math.PI / 180;
  let lienzo, ctx, lado, lon0 = -98, lat0 = -8, arrastrando = false, ultimo = null, tiempo = 0, visible = true;

  /* Proyección ortográfica: (lon, lat) → punto en el disco. z < 0 = cara oculta */
  function proyectar(lon, lat) {
    const l = (lon - lon0) * RAD, f = lat * RAD, f0 = lat0 * RAD;
    const x = Math.cos(f) * Math.sin(l);
    const y = Math.cos(f0) * Math.sin(f) - Math.sin(f0) * Math.cos(f) * Math.cos(l);
    const z = Math.sin(f0) * Math.sin(f) + Math.cos(f0) * Math.cos(f) * Math.cos(l);
    return [x, y, z];
  }

  function medir() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    lado = lienzo.getBoundingClientRect().width;
    lienzo.width = lienzo.height = Math.round(lado * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function dibujar() {
    const c = lado / 2, R = lado * 0.4;
    ctx.clearRect(0, 0, lado, lado);

    // Halo y océano
    const halo = ctx.createRadialGradient(c, c, R * .9, c, c, R * 1.22);
    halo.addColorStop(0, 'rgba(31,111,181,.20)'); halo.addColorStop(1, 'rgba(31,111,181,0)');
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(c, c, R * 1.22, 0, 7); ctx.fill();
    const mar = ctx.createRadialGradient(c - R * .35, c - R * .4, R * .1, c, c, R);
    mar.addColorStop(0, '#F4FAFF'); mar.addColorStop(.6, '#CFE4F5'); mar.addColorStop(1, '#9CC5E6');
    ctx.fillStyle = mar; ctx.beginPath(); ctx.arc(c, c, R, 0, 7); ctx.fill();

    ctx.save(); ctx.beginPath(); ctx.arc(c, c, R, 0, 7); ctx.clip();

    // Lengua cálida de El Niño sobre el Pacífico ecuatorial (decorativa)
    for (let lon = -160; lon <= -82; lon += 6) {
      const fuerza = (lon + 160) / 78, lat = -1 - 4 * fuerza + Math.sin(tiempo * .8 + lon * .2) * 1.2;
      const [x, y, z] = proyectar(lon, lat); if (z <= 0) continue;
      const r = R * (0.10 + 0.07 * fuerza) * (0.6 + 0.4 * z);
      const g = ctx.createRadialGradient(c + x * R, c - y * R, 0, c + x * R, c - y * R, r);
      g.addColorStop(0, `rgba(211,32,43,${0.30 * fuerza + .08})`); g.addColorStop(1, 'rgba(211,32,43,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c + x * R, c - y * R, r, 0, 7); ctx.fill();
    }

    // Meridianos y paralelos
    ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 1;
    for (let lon = -180; lon < 180; lon += 30) trazar(Array.from({ length: 37 }, (_, i) => [lon, -90 + i * 5]));
    for (let lat = -60; lat <= 60; lat += 30) trazar(Array.from({ length: 73 }, (_, i) => [-180 + i * 5, lat]));
    ctx.strokeStyle = 'rgba(211,32,43,.55)'; ctx.setLineDash([4, 5]);
    trazar(Array.from({ length: 73 }, (_, i) => [-180 + i * 5, 0])); ctx.setLineDash([]);

    // Continentes
    ctx.fillStyle = '#1B1617'; ctx.strokeStyle = '#1B1617'; ctx.lineWidth = .6;
    for (const anillo of NL.TIERRA) {
      let alguno = false; ctx.beginPath();
      for (let i = 0; i < anillo.length; i++) {
        let [x, y, z] = proyectar(anillo[i][0], anillo[i][1]);
        if (z < 0) { const m = Math.hypot(x, y) || 1; x /= m; y /= m; } else alguno = true;   // lo oculto se pega al borde
        i ? ctx.lineTo(c + x * R, c - y * R) : ctx.moveTo(c + x * R, c - y * R);
      }
      if (alguno) { ctx.closePath(); ctx.fill(); }
    }
    ctx.restore();

    // Brillo y borde
    const brillo = ctx.createRadialGradient(c - R * .4, c - R * .45, 0, c, c, R);
    brillo.addColorStop(0, 'rgba(255,255,255,.35)'); brillo.addColorStop(.5, 'rgba(255,255,255,0)'); brillo.addColorStop(1, 'rgba(21,17,18,.18)');
    ctx.fillStyle = brillo; ctx.beginPath(); ctx.arc(c, c, R, 0, 7); ctx.fill();
    ctx.strokeStyle = '#151112'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(c, c, R, 0, 7); ctx.stroke();

    // Perú: punto rojo que late
    const [px, py, pz] = proyectar(-75.5, -9.5);
    if (pz > 0.05) {
      const X = c + px * R, Y = c - py * R, pulso = (tiempo * .7) % 1;
      ctx.strokeStyle = `rgba(211,32,43,${1 - pulso})`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(X, Y, 6 + pulso * 16, 0, 7); ctx.stroke();
      ctx.fillStyle = '#D3202B'; ctx.beginPath(); ctx.arc(X, Y, 5.5, 0, 7); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
      ctx.font = '800 13px Manrope, sans-serif'; ctx.lineWidth = 4; ctx.strokeStyle = '#fff';
      ctx.strokeText('PERÚ', X + 12, Y + 4); ctx.fillStyle = '#151112'; ctx.fillText('PERÚ', X + 12, Y + 4);
    }

    // Satélite en órbita
    const a = tiempo * .5, ox = Math.cos(a) * R * 1.2, oy = Math.sin(a) * R * .34, detras = Math.sin(a) < 0 && Math.hypot(ox, oy) < R;
    ctx.save(); ctx.translate(c, c); ctx.rotate(-22 * RAD);
    ctx.strokeStyle = 'rgba(21,17,18,.18)'; ctx.lineWidth = 1; ctx.setLineDash([3, 6]);
    ctx.beginPath(); ctx.ellipse(0, 0, R * 1.2, R * .34, 0, 0, Math.PI); ctx.stroke(); ctx.setLineDash([]);
    if (!detras) {
      ctx.translate(ox, oy); ctx.fillStyle = '#151112'; ctx.fillRect(-5, -4, 10, 8);
      ctx.fillStyle = '#1F6FB5'; ctx.fillRect(-17, -3, 10, 6); ctx.fillRect(7, -3, 10, 6);
    }
    ctx.restore();

    function trazar(puntos) {
      ctx.beginPath(); let abierto = false;
      for (const [lo, la] of puntos) {
        const [x, y, z] = proyectar(lo, la);
        if (z < 0) { abierto = false; continue; }
        abierto ? ctx.lineTo(c + x * R, c - y * R) : ctx.moveTo(c + x * R, c - y * R); abierto = true;
      }
      ctx.stroke();
    }
  }

  function ciclo() {
    if (visible && !NL.sinAnimacion) {
      tiempo += 0.016;
      if (!arrastrando) lon0 += 0.09;          // giro lento automático
      dibujar();
    }
    requestAnimationFrame(ciclo);
  }

  function iniciar() {
    lienzo = NL.$('#planeta'); ctx = lienzo.getContext('2d');
    medir(); dibujar();
    window.addEventListener('resize', () => { medir(); dibujar(); });
    new IntersectionObserver(e => { visible = e[0].isIntersecting; }).observe(lienzo);

    lienzo.addEventListener('pointerdown', e => { arrastrando = true; ultimo = [e.clientX, e.clientY]; lienzo.setPointerCapture(e.pointerId); });
    lienzo.addEventListener('pointermove', e => {
      if (!arrastrando) return;
      lon0 -= (e.clientX - ultimo[0]) * 0.35;
      lat0 = Math.max(-60, Math.min(60, lat0 + (e.clientY - ultimo[1]) * 0.35));
      ultimo = [e.clientX, e.clientY];
      if (NL.sinAnimacion) dibujar();
    });
    ['pointerup', 'pointercancel'].forEach(t => lienzo.addEventListener(t, () => { arrastrando = false; }));
    requestAnimationFrame(ciclo);

    // Las 5 preguntas se iluminan una por una
    let i = 0;
    setInterval(() => { i = (i + 1) % 5; NL.$$('#preguntas li').forEach((li, k) => li.classList.toggle('lit', k === i)); }, 2400);
  }

  return { iniciar };
})();
