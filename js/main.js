/* ==========================================================
   NiñoLab · main.js
   Arranque: enciende cada sección en orden y maneja la barra
   de navegación (resalta la sección visible).
   ========================================================== */
(function () {
  const $ = NL.$, $$ = NL.$$;
  const SECCIONES = ['inicio', 'perfil', 'investigar', 'territorio', 'oceano', 'cronologia', 'hallazgos', 'metodo'];
  let activa = 'inicio';

  function espiar() {
    const y = window.scrollY + window.innerHeight * 0.35; let cual = 'inicio';
    SECCIONES.forEach(id => { if (document.getElementById(id).offsetTop <= y) cual = id; });
    if (cual === activa) return; activa = cual;
    $$('#links a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + cual));
    NL.duke.alCambiarSeccion(cual);
  }

  function aparecerAlBajar() {
    if (NL.sinAnimacion || !('IntersectionObserver' in window)) return;
    const ojo = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.remove('pre'); ojo.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    $$('.reveal').forEach(el => { if (el.getBoundingClientRect().top > window.innerHeight) { el.classList.add('pre'); ojo.observe(el); } });
  }

  function iniciar() {
    // Cada módulo se protege por separado: si uno falla, los demás siguen funcionando
    const encender = (nombre, fn) => { try { fn(); } catch (e) { console.error('NiñoLab · fallo en ' + nombre, e); } };
    encender('inicio', NL.inicio.iniciar);
    encender('investigar', NL.investigar.iniciar);
    encender('territorio', NL.territorio.iniciar);
    encender('océano', NL.oceano.iniciar);
    encender('índice', NL.indice.iniciar);
    encender('cronología', NL.cronologia.iniciar);
    encender('hallazgos', NL.hallazgos.iniciar);
    encender('duke', NL.duke.iniciar);
    encender('perfil', () => { NL.perfil.iniciar(); NL.perfil.aplicar(false); });
    encender('primera investigación', () => NL.investigar.ejecutar(true));   // la página abre con un caso real ya resuelto

    $('#menuBtn').onclick = () => { const m = $('#mobileMenu'); m.hidden = !m.hidden; $('#menuBtn').setAttribute('aria-expanded', String(!m.hidden)); };
    $('#mobileMenu').onclick = e => { if (e.target.closest('a')) $('#mobileMenu').hidden = true; };
    window.addEventListener('scroll', espiar, { passive: true });
    aparecerAlBajar(); espiar();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
