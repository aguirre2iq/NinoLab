/* ==========================================================
   NiñoLab · motor/series-demo.js
   Series de DEMOSTRACIÓN (sintéticas). Solo se usan cuando no
   hay conexión con NASA POWER, y la página lo indica siempre.
   No son mediciones reales.
   ========================================================== */
window.NL = window.NL || {};

NL.demo = (function () {
  function semilla(texto) { let h = 2166136261; for (const c of texto) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  function azar(s) { return function () { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function normal(r) { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

  const LLUVIA_NIÑO = { 1983: 9, 1998: 10, 2017: 4.2, 2023: 3.1, 1987: 1.8, 1992: 1.9 };
  const CALOR_NIÑO = { 1983: .9, 1987: .5, 1992: .4, 1997: .6, 1998: 1.1, 2015: .6, 2016: .7, 2017: .8, 2023: .9, 2024: .5 };

  function serie(depId, variableId, añoInicio, añoFin) {
    const d = NL.DEP[depId], r = azar(semilla(depId + variableId)), norte = NL.COSTA_NORTE.includes(depId), salida = [];
    const tendencia = { pr: (r() - .35) * .012, t2m: .012 + r() * .022, sm: (r() - .6) * .15, sst: .006 + r() * .03 }[variableId];
    for (let año = añoInicio; año <= añoFin; año++) {
      const k = año - 1981; let v;
      if (variableId === 'pr') { v = d.lluvia * (1 + tendencia * k) * (1 + .18 * normal(r)); if (norte && LLUVIA_NIÑO[año]) v *= LLUVIA_NIÑO[año]; v = Math.max(1, v); }
      else if (variableId === 't2m') v = d.temp + tendencia * k + .3 * normal(r) + (d.costa && CALOR_NIÑO[año] ? CALOR_NIÑO[año] : 0);
      else if (variableId === 'sm') v = Math.max(3, Math.min(95, 12 + d.lluvia / 40 + tendencia * k + 3 * normal(r)));
      else v = 27 + d.punto[0] * .55 + tendencia * k + .35 * normal(r) + (CALOR_NIÑO[año] ? CALOR_NIÑO[año] * 2 : 0);
      salida.push({ año, valor: v });
    }
    return salida;
  }
  return { serie };
})();
