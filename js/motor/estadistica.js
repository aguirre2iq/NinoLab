/* ==========================================================
   NiñoLab · motor/estadistica.js
   El "detective": recibe una serie anual y comprueba si hay
   una tendencia real. No sabe nada de pantallas.

   Pruebas: Mann-Kendall (con ajuste por autocorrelación),
   pendiente de Sen y prueba de robustez sin los 2 años extremos.
   ========================================================== */
window.NL = window.NL || {};

NL.est = (function () {
  const media = a => a.reduce((s, x) => s + x, 0) / a.length;
  const desviacion = a => { const m = media(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1)); };
  const mediana = a => { const s = [...a].sort((x, y) => x - y), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };

  /* Función de distribución normal (aproximación de Abramowitz y Stegun) */
  function erf(x) {
    const t = 1 / (1 + 0.3275911 * Math.abs(x));
    const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
    return x >= 0 ? y : -y;
  }
  const normalAcumulada = z => 0.5 * (1 + erf(z / Math.SQRT2));

  /* Autocorrelación de un año con el siguiente */
  function autocorrelacion(valores) {
    const m = media(valores); let num = 0, den = 0;
    for (let i = 0; i < valores.length; i++) { den += (valores[i] - m) ** 2; if (i) num += (valores[i] - m) * (valores[i - 1] - m); }
    return num / den;
  }

  /* Mann-Kendall + pendiente de Sen. puntos = [{año, valor}] */
  function mannKendall(puntos) {
    const n = puntos.length; let S = 0;
    for (let i = 0; i < n - 1; i++) for (let j = i + 1; j < n; j++) S += Math.sign(puntos[j].valor - puntos[i].valor);
    let varianza = n * (n - 1) * (2 * n + 5) / 18;
    const r1 = autocorrelacion(puntos.map(p => p.valor));
    const ajustada = r1 > 0.1;                       // si los años dependen entre sí, la varianza se infla
    if (ajustada) varianza *= (1 + r1) / (1 - r1);
    const Z = S > 0 ? (S - 1) / Math.sqrt(varianza) : S < 0 ? (S + 1) / Math.sqrt(varianza) : 0;
    const p = 2 * (1 - normalAcumulada(Math.abs(Z)));
    const pendientes = [];
    for (let i = 0; i < n - 1; i++) for (let j = i + 1; j < n; j++) pendientes.push((puntos[j].valor - puntos[i].valor) / (puntos[j].año - puntos[i].año));
    const sen = mediana(pendientes);
    const corte = mediana(puntos.map(q => q.valor - sen * q.año));
    return { S, Z, p, sen, corte, r1, ajustada };
  }

  /* Análisis completo de una serie anual.
     serie = [{año, valor|null}], variable = entrada de NL.VARIABLES */
  function analizar(serie, variable) {
    const puntos = serie.filter(p => p.valor !== null).map(p => ({ año: p.año, valor: p.valor }));
    const n = puntos.length, cobertura = n / serie.length;
    const añoInicio = serie[0].año, añoFin = serie[serie.length - 1].año;

    // Referencia: 1991–2020 si hay al menos 15 años dentro; si no, todo el período
    let ref = puntos.filter(p => p.año >= 1991 && p.año <= 2020), referencia = '1991–2020';
    if (ref.length < 15) { ref = puntos; referencia = `${añoInicio}–${añoFin} (período completo)`; }
    const base = media(ref.map(p => p.valor)), desv = desviacion(ref.map(p => p.valor));
    puntos.forEach(p => { p.anomalia = p.valor - base; p.z = p.anomalia / desv; });

    const mk = mannKendall(puntos);
    const porExtremo = [...puntos].sort((a, b) => Math.abs(b.z) - Math.abs(a.z));
    const excepcionales = porExtremo.filter(p => Math.abs(p.z) >= 2).slice(0, 4);
    const sinExtremos = mannKendall(puntos.filter(p => !porExtremo.slice(0, 2).includes(p)));
    const robusta = Math.sign(sinExtremos.sen) === Math.sign(mk.sen) && sinExtremos.p < 0.10;

    // Tres etapas con la misma cantidad de años (no se eligen mirando el gráfico)
    const k = Math.floor(n / 3);
    const etapas = [puntos.slice(0, k), puntos.slice(k, 2 * k), puntos.slice(2 * k)].map(g => ({
      añoInicio: g[0].año, añoFin: g[g.length - 1].año, media: media(g.map(p => p.valor)), mediana: mediana(g.map(p => p.valor))
    }));
    const primeros = puntos.slice(0, Math.min(10, k)), ultimos = puntos.slice(-Math.min(10, k));
    const tipico = g => variable.relativa ? mediana(g.map(p => p.valor)) : media(g.map(p => p.valor));
    const cambioTotal = mk.sen * (puntos[n - 1].año - puntos[0].año);

    // Estado de la evidencia
    let estado = 'insuf';
    if (cobertura < 0.8) estado = 'inc';
    else if (mk.p < 0.05) estado = robusta ? 'ok' : 'inc';

    return { serie, puntos, n, cobertura, añoInicio, añoFin, base, desv, referencia, mk, sinExtremos, robusta,
             excepcionales, etapas, primeros, ultimos, tipicoInicio: tipico(primeros), tipicoFinal: tipico(ultimos),
             cambioTotal, relevancia: Math.abs(cambioTotal) / desv, estado };
  }

  return { media, desviacion, mediana, mannKendall, analizar };
})();

NL.ESTADOS = { ok: 'Cambio respaldado', insuf: 'Evidencia insuficiente', inc: 'Resultado inconcluso' };
