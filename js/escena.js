// La escena en pixel art, a toda la pantalla como en El Pino Calcinado. Cada vista se dibuja en un
// mundo de 270 píxeles nativos de ancho (pensado para el móvil en vertical) y se amplía al ancho de
// la pantalla sin suavizado; lo que sobra por arriba y por los lados lo rellena la propia vista
// (cielo, pared, suelo). El mundo se coloca de forma que su suelo («suelo» de la vista) quede justo
// encima del cuadro de diálogo, y el toldo de arriba baja hasta debajo de la barra (menú y
// nombre del sitio), para que se lean sobre las rayas y no sobre el fondo.
// Las capas fijas se pintan una sola vez (y otra si cambia el tamaño) y las animadas a 12 fps.

export const ANCHO = 270;
const FPS = 12;

export function createEscena(canvas) {
  const g = canvas.getContext('2d');
  const low = document.createElement('canvas');
  const lg = low.getContext('2d', { willReadFrequently: true });
  let vista = null, capas = [];
  let ctx = null;          // paleta e imágenes que reciben las capas
  let fondo = null;        // alto (en px CSS desde arriba) donde empieza el cuadro de diálogo
  let techo = null;        // alto (en px CSS) donde acaba la barra de arriba
  let d = null;            // medidas: W, H (lienzo nativo), ox, oy (dónde cae el mundo), izq, der
  let pausada = true, ultimo = -1;

  function capaFija(pinta) {
    const c = document.createElement('canvas');
    c.width = d.W; c.height = d.H;
    const cg = c.getContext('2d', { willReadFrequently: true });
    pinta(cg, ctx, d);
    return { lienzo: c };
  }

  function rehacer() {
    if (!vista || !d) return;
    capas = vista.capas.map(c => c.fija ? capaFija(c.fija) : { anima: c.anima });
    dibuja(performance.now());
  }

  function dibuja(ahora) {
    if (!d) return;
    const t = ahora / 1000;
    lg.setTransform(1, 0, 0, 1, 0, 0);
    lg.clearRect(0, 0, d.W, d.H);
    for (const c of capas) {
      if (c.lienzo) lg.drawImage(c.lienzo, 0, 0);
      else { lg.save(); c.anima(lg, t, ctx, d); lg.restore(); }
    }
    g.imageSmoothingEnabled = false;
    g.drawImage(low, 0, 0, d.W * d.S, d.H * d.S);
  }

  // (el siguiente fotograma se pide antes de dibujar: si uno falla, la escena no se queda parada; y
  // mientras la tapa algo opaco —el cuento, un vídeo, un minijuego—, no se dibuja: body.tapado)
  function frame(ahora) {
    if (pausada) return;
    requestAnimationFrame(frame);
    if (document.body.classList.contains('tapado')) return;
    const f = Math.floor(ahora / (1000 / FPS));
    if (f !== ultimo) { ultimo = f; dibuja(ahora); }
  }

  // Tamaño: el lienzo ocupa lo que mida en CSS; cada píxel nativo, un número entero de píxeles
  // del aparato si da para 3 o más (el móvil); si no (pantallas de poca densidad), lo justo.
  function ajustar() {
    const dpr = window.devicePixelRatio || 1;
    const cw = canvas.clientWidth, ch = canvas.clientHeight;
    if (!cw || !ch || !vista) return;
    const fit = (cw * dpr) / ANCHO;
    const S = fit >= 3 ? Math.floor(fit) : fit;
    const W = Math.ceil((cw * dpr) / S), H = Math.ceil((ch * dpr) / S);
    const bajo = fondo == null ? H - 40 : Math.round((fondo * dpr) / S);
    const ox = Math.floor((W - ANCHO) / 2), oy = bajo - vista.suelo;
    // alto de las rayas del toldo (sin las ondas, que cuelgan 5 más): hasta el final de la barra
    const toldo = techo == null ? 10 : Math.max(10, Math.ceil((techo * dpr) / S) + 1);
    const nuevo = { W, H, S, ox, oy, toldo, izq: -ox, der: W - ox };
    if (canvas.width !== Math.round(cw * dpr) || canvas.height !== Math.round(ch * dpr)) {
      canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
    }
    const igual = d && ['W', 'H', 'S', 'ox', 'oy', 'toldo'].every(k => d[k] === nuevo[k]);
    d = nuevo;
    if (low.width !== W || low.height !== H) { low.width = W; low.height = H; }
    if (!igual || !capas.length) rehacer();
    else dibuja(performance.now());
  }

  // Toques (dedo o ratón): si la vista tiene toque(tipo, x, y), se le pasan en coordenadas de su mundo
  // ('baja', 'mueve', 'sube'); se repinta enseguida para que lo que se arrastra vaya con el dedo
  function toque(tipo, ev) {
    if (!vista?.toque || !d) return;
    const r = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const x = ((ev.clientX - r.left) * dpr) / d.S - d.ox, y = ((ev.clientY - r.top) * dpr) / d.S - d.oy;
    if (vista.toque(tipo, x, y) === false) return;
    // al arrastrar llegan más movimientos que fotogramas: se repinta como mucho una vez por fotograma
    if (tipo !== 'mueve') { dibuja(performance.now()); return; }
    if (!repintar) repintar = requestAnimationFrame(ahora => { repintar = 0; dibuja(ahora); });
  }
  let repintar = 0;
  canvas.addEventListener('pointerdown', ev => { canvas.setPointerCapture?.(ev.pointerId); toque('baja', ev); });
  canvas.addEventListener('pointermove', ev => toque('mueve', ev));
  canvas.addEventListener('pointerup', ev => toque('sube', ev));
  canvas.addEventListener('pointercancel', ev => toque('sube', ev));

  return {
    // vista = { suelo, capas: [{ fija: (g, ctx, d) => … } | { anima: (g, t, ctx, d) => … }], toque? }
    mostrar(v, contexto) {
      vista = v; ctx = contexto; capas = []; d = null;
      ajustar();
    },
    // dónde empieza el cuadro de diálogo y dónde acaba la barra de arriba (px CSS desde arriba
    // del lienzo), o null si no hay
    setBordes(abajo, arriba) { fondo = abajo; techo = arriba; ajustar(); },
    ajustar,
    pausar(p) {
      if (p === pausada) return;
      pausada = p;
      if (!p) requestAnimationFrame(frame);
    },
  };
}
