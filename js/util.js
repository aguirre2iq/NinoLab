/* ==========================================================
   NiñoLab · util.js
   Funciones pequeñas que usan todos los módulos.
   Todo el proyecto cuelga del objeto global NL.
   ========================================================== */
window.NL = window.NL || {};

NL.$  = (sel, raiz) => (raiz || document).querySelector(sel);
NL.$$ = (sel, raiz) => [...(raiz || document).querySelectorAll(sel)];

/* Números con formato peruano: 1,234.5 → coma decimal según es-PE */
NL.fmt = (n, decimales = 1) =>
  Number(n).toLocaleString('es-PE', { minimumFractionDigits: decimales, maximumFractionDigits: decimales });
NL.signo = (n, decimales = 1) => (n >= 0 ? '+' : '−') + NL.fmt(Math.abs(n), decimales);

/* Guardado local (solo en este navegador). Nunca rompe la página si falla. */
NL.guardar = {
  leer(clave, porDefecto) { try { const v = localStorage.getItem(clave); return v ? JSON.parse(v) : porDefecto; } catch (e) { return porDefecto; } },
  escribir(clave, valor) { try { localStorage.setItem(clave, JSON.stringify(valor)); } catch (e) { /* sin almacenamiento */ } }
};

NL.sinAnimacion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

NL.aviso = function (texto) {
  const d = document.createElement('div');
  d.className = 'toast'; d.textContent = texto;
  document.body.appendChild(d);
  setTimeout(() => d.remove(), 2400);
};

NL.irA = function (id) {
  document.getElementById(id).scrollIntoView({ behavior: NL.sinAnimacion ? 'auto' : 'smooth' });
};

/* Ícono de línea a partir de sus trazos */
NL.icono = trazos =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${trazos}</svg>`;

/* Color intermedio dentro de una rampa de colores hex. t va de 0 a 1. */
NL.hexARgb = h => { h = h.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };
NL.colorRampa = function (rampa, t) {
  t = Math.max(0, Math.min(1, t));
  const s = t * (rampa.length - 1), i = Math.min(rampa.length - 2, Math.floor(s)), f = s - i;
  const a = NL.hexARgb(rampa[i]), b = NL.hexARgb(rampa[i + 1]);
  return a.map((x, k) => Math.round(x + (b[k] - x) * f));
};

/* Marcas "bonitas" para los ejes de los gráficos */
NL.marcas = function (min, max, cuantas = 5) {
  const rango = max - min || 1, paso0 = rango / cuantas, mag = 10 ** Math.floor(Math.log10(paso0)), e = paso0 / mag;
  const paso = (e >= 7.5 ? 10 : e >= 3.5 ? 5 : e >= 1.5 ? 2 : 1) * mag;
  const ini = Math.floor(min / paso) * paso, fin = Math.ceil(max / paso) * paso, t = [];
  for (let v = ini; v <= fin + paso / 2; v += paso) t.push(+v.toFixed(10));
  return t;
};

/* Globos de información sobre los gráficos SVG */
NL.globos = function (caja) {
  let t = caja.querySelector('.tip');
  if (!t) { t = document.createElement('div'); t.className = 'tip'; caja.appendChild(t); }
  caja.querySelectorAll('[data-tip]').forEach(el => {
    el.addEventListener('mouseenter', () => { t.textContent = el.dataset.tip; t.style.opacity = 1; });
    el.addEventListener('mousemove', e => { const r = caja.getBoundingClientRect(); t.style.left = (e.clientX - r.left + caja.scrollLeft) + 'px'; t.style.top = (e.clientY - r.top) + 'px'; });
    el.addEventListener('mouseleave', () => { t.style.opacity = 0; });
  });
};

NL.MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
NL.MESES_LARGO = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre'];
