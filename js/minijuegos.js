// Los minijuegos (DISEÑO.md, «Minijuegos»): cortos, de un dedo, en pixel art limpio como el taller
// (menta, tarjetas blancas redondeadas, pastillas). Se juegan en una capa encima de la escena, justo
// sobre el cuadro de diálogo, que cuenta qué hay que hacer.
// - limpiar: frotar el escaparate (sobre la propia calle) antes de abrir;
// - caja: contar lo que hay en la bandeja y elegir el total bueno;
// - envolver: cortar el papel a la medida, doblar las solapas (lados primero) y poner el lazo;
// - noño: rociar a Ñoño con desodorante mientras se tapa la cara con sus estampitas, sin que te pille;
// - alhaurín se queja: con el móvil del Mákina, denunciar las críticas de su muro de Facebook.
// Cada uno acaba llamando a alAcabar({ gana, ... }).
import { rect, caja, texto, cifras } from './pixel.js';
import { sfx } from './audio.js';

const $ = s => document.querySelector(s);
const ANCHO = 270;
let actual = null;

// ---------- el motor: lienzo con escala entera, bucle a 30 fps y toques en coordenadas del mundo ----------
function arranca(juego, alAcabar) {
  cierra();
  const capa = $('#minijuego');
  const lienzo = capa.querySelector('canvas');
  capa.classList.remove('hidden');
  capa.classList.toggle('transparente', !!juego.transparente);
  document.body.classList.toggle('tapado', !juego.transparente);   // (si tapa la escena, la escena descansa)
  const g = lienzo.getContext('2d');
  const bajo = document.createElement('canvas');
  const bg = bajo.getContext('2d', { willReadFrequently: true });
  const est = { juego, t0: performance.now(), fin: false, raf: 0, d: null };
  const medir = () => {
    const dpr = devicePixelRatio || 1;
    const w = lienzo.clientWidth * dpr, h = lienzo.clientHeight * dpr;
    const fit = w / ANCHO, S = fit >= 3 ? Math.floor(fit) : fit;
    const W = Math.ceil(w / S), H = Math.ceil(h / S);
    lienzo.width = Math.round(w); lienzo.height = Math.round(h);
    bajo.width = W; bajo.height = H;
    est.d = { W, H, S, ox: Math.floor((W - ANCHO) / 2) };
    juego.medida?.(est.d);
  };
  medir();
  let ultimo = 0;
  const paso = ahora => {
    if (est.fin) return;
    est.raf = requestAnimationFrame(paso);
    if (ahora - ultimo < 1000 / 30) return;
    ultimo = ahora;
    const t = (ahora - est.t0) / 1000;
    bg.setTransform(1, 0, 0, 1, 0, 0);
    bg.clearRect(0, 0, bajo.width, bajo.height);
    const r = juego.paso(bg, t, est.d);
    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, lienzo.width, lienzo.height);
    g.drawImage(bajo, 0, 0, est.d.W * est.d.S, est.d.H * est.d.S);
    if (r) termina(r);
  };
  const aMundo = ev => {
    const b = lienzo.getBoundingClientRect(), dpr = devicePixelRatio || 1;
    return [((ev.clientX - b.left) * dpr) / est.d.S - est.d.ox, ((ev.clientY - b.top) * dpr) / est.d.S];
  };
  const oye = tipo => ev => {
    if (est.fin) return;
    if (tipo === 'baja') lienzo.setPointerCapture?.(ev.pointerId);
    const r = juego.toque?.(tipo, ...aMundo(ev), (performance.now() - est.t0) / 1000);
    if (r) termina(r);
  };
  const oyentes = [['pointerdown', oye('baja')], ['pointermove', oye('mueve')], ['pointerup', oye('sube')], ['pointercancel', oye('sube')],
    ['contextmenu', ev => ev.preventDefault()]];   // (dejar el dedo apretado no saca el menú del móvil)
  for (const [e, f] of oyentes) lienzo.addEventListener(e, f);
  const alCambiar = () => medir();
  addEventListener('resize', alCambiar);
  function termina(r) {
    if (est.fin) return;
    est.fin = true;
    if (!r.dejado) sfx(r.gana ? 'logro' : r.pillado ? 'risa' : 'fallo');
    setTimeout(() => { if (actual !== est) return; cierra(); alAcabar(r); }, r.espera ?? 700);
  }
  est.quitar = () => {
    est.fin = true;
    cancelAnimationFrame(est.raf);
    for (const [e, f] of oyentes) lienzo.removeEventListener(e, f);
    removeEventListener('resize', alCambiar);
  };
  est.termina = termina;
  est.raf = requestAnimationFrame(paso);
  actual = est;
  return est;
}

export function cierra() {
  if (!actual) return;
  actual.quitar();
  actual = null;
  $('#minijuego').classList.add('hidden');
  document.body.classList.remove('tapado');
}
// para los botones del cuadro de diálogo: dejarlo o elegir una respuesta
export const rinde = () => actual?.termina({ gana: false, dejado: true, espera: 0 });
export const responde = valor => actual?.juego.responde?.(valor, actual.termina);

// ---------- piezas comunes ----------
const MENTA = '#50DAB6', MENTA_OSC = '#2FB894', TINTA = '#0E4A3C', NEGRO = '#111111', BLANCO = '#FFFFFF', CORAL = '#E7584A';
// Rectángulo con las esquinas recortadas, a base de tiras (rápido: se pinta en cada fotograma)
function rr(g, x, y, w, h, fondo, borde = null, r = 3) {
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  const tiras = (x0, y0, w0, h0, color, rr0) => {
    g.fillStyle = color;
    for (let i = 0; i < h0; i++) {
      const c = i < rr0 ? rr0 - i : i >= h0 - rr0 ? i - (h0 - rr0) + 1 : 0;
      if (w0 - 2 * c > 0) g.fillRect(x0 + c, y0 + i, w0 - 2 * c, 1);
    }
  };
  if (borde) { tiras(x, y, w, h, borde, r); tiras(x + 1, y + 1, w - 2, h - 2, fondo, Math.max(0, r - 1)); }
  else tiras(x, y, w, h, fondo, r);
}
function tarjeta(g, x, y, w, h, r = 5, fondo = BLANCO) {
  rr(g, x + 2, y + 2, w, h, MENTA_OSC, null, r);
  rr(g, x, y, w, h, fondo, NEGRO, r);
}
const lienzos = new Map();
function cacheado(clave, w, h, pinta) {
  let c = lienzos.get(clave);
  if (!c) {
    c = document.createElement('canvas'); c.width = w; c.height = h;
    pinta(c.getContext('2d', { willReadFrequently: true }));
    lienzos.set(clave, c);
  }
  return c;
}
// una pastilla blanca con texto (el tiempo, el porcentaje…), centrada en cx
function pastilla(g, txt, cx, y, color = TINTA) {
  const w = txt.length * 6 + 12;
  g.drawImage(cacheado(`p${txt}${color}`, w + 2, 14, c => {
    caja(c, 2, 2, w, 12, MENTA_OSC, null, 4);
    caja(c, 0, 0, w, 12, BLANCO, NEGRO, 4);
    texto(c, txt, w / 2, 9, { font: '8px Silkscreen', color, align: 'center' });
  }), Math.round(cx - w / 2), y);
}
// la barra del tiempo que queda
function barraTiempo(g, x, y, w, f) {
  rr(g, x, y, w, 6, BLANCO, NEGRO, 2);
  const lleno = Math.max(0, Math.round((w - 4) * f));
  if (lleno) rect(g, x + 2, y + 2, lleno, 2, f < 0.25 ? CORAL : MENTA_OSC);
}
function fondoMenta(g, d) {
  g.drawImage(cacheado(`fondo${d.W}x${d.H}`, d.W, d.H, c => {
    rect(c, 0, 0, d.W, d.H, MENTA);
    for (let y = 4; y < d.H; y += 8) for (let x = (y % 16 ? 4 : 0); x < d.W; x += 8) rect(c, x, y, 1, 1, '#6BE2C3');
  }), 0, 0);
}

// ---------- limpiar el cristal ----------
// Sobre la calle (la capa es transparente): huellas, la nariz de un perro, una cagada de paloma y
// polvo. Se frota con el dedo; hay 15 segundos y vale con dejarlo limpio al 90 %.
export function limpiar(alAcabar) {
  const DURA = 12, META = 0.88;   // doce segundos para dejarlo al 88 %
  let mancha = null, mg = null, total = 1, quedan = 1, medido = 0, ultimo = null;
  const juego = {
    transparente: true,
    medida(d) {
      if (mancha && mancha.width === d.W && mancha.height === d.H) return;   // (la suciedad se hace una vez)
      mancha = document.createElement('canvas');
      mancha.width = d.W; mancha.height = d.H;
      mg = mancha.getContext('2d', { willReadFrequently: true });
      // el polvo y las manchas, siempre en la misma parte del mundo (alto del cristal)
      const arriba = Math.max(24, d.H - 230), abajo = d.H - 6;
      const azar = semilla(7);
      mg.fillStyle = 'rgba(225, 214, 190, 0.38)';
      for (let k = 0; k < 9; k++) mancha_(mg, d.ox + 20 + azar() * 230, arriba + azar() * (abajo - arriba), 22 + azar() * 20, 'rgba(214, 200, 170, 0.45)', azar);
      for (let k = 0; k < 7; k++) huella(mg, d.ox + 30 + azar() * 210, arriba + 30 + azar() * (abajo - arriba - 40), azar);
      nariz(mg, d.ox + 60 + azar() * 140, abajo - 34);
      paloma(mg, d.ox + 40 + azar() * 180, arriba + 20 + azar() * 40);
      total = cuenta(); quedan = total;
    },
    paso(g, t, d) {
      g.drawImage(mancha, 0, 0);
      if (t - medido > 0.3) { medido = t; quedan = cuenta(); }
      const limpio = Math.max(0, 1 - quedan / total);
      pastilla(g, `LIMPIO ${Math.min(100, Math.floor(limpio / META * 100))} %`, d.ox + ANCHO / 2, 8, limpio >= META ? MENTA_OSC : TINTA);
      barraTiempo(g, d.ox + 60, 26, 150, 1 - t / DURA);
      if (limpio >= META) return { gana: true, limpio: 1 };
      if (t >= DURA) return { gana: false, limpio: Math.min(0.99, limpio / META) };
      return null;
    },
    toque(tipo, x, y) {
      if (tipo === 'sube') { ultimo = null; return; }
      if (tipo === 'mueve' && !ultimo) return;
      const X = x + (actual?.d.ox || 0);
      mg.globalCompositeOperation = 'destination-out';
      mg.strokeStyle = '#000'; mg.lineWidth = 18; mg.lineCap = 'round';
      mg.beginPath();
      mg.moveTo(...(ultimo || [X, y])); mg.lineTo(X, y); mg.stroke();
      mg.globalCompositeOperation = 'source-over';
      ultimo = [X, y];
    },
  };
  function cuenta() {
    const dat = mg.getImageData(0, 0, mancha.width, mancha.height).data;
    let n = 0;
    for (let i = 3; i < dat.length; i += 16) if (dat[i] > 20) n++;
    return Math.max(1, n);
  }
  return arranca(juego, alAcabar);
}
function semilla(s) { return () => ((s = (s * 16807) % 2147483647) / 2147483647); }
function mancha_(g, cx, cy, r, color, azar) {
  g.fillStyle = color;
  for (let k = 0; k < 6; k++) {
    g.beginPath();
    g.ellipse(cx + (azar() - 0.5) * r, cy + (azar() - 0.5) * r * 0.6, r * (0.4 + azar() * 0.4), r * (0.25 + azar() * 0.3), 0, 0, Math.PI * 2);
    g.fill();
  }
}
function huella(g, cx, cy, azar) {
  g.strokeStyle = 'rgba(150, 140, 130, 0.55)'; g.lineWidth = 1;
  for (let k = 0; k < 4; k++) { g.beginPath(); g.ellipse(cx, cy, 3 + k * 2, 4 + k * 2.6, azar() * 0.4, 0, Math.PI * 2); g.stroke(); }
}
function nariz(g, cx, cy) {
  g.fillStyle = 'rgba(120, 130, 140, 0.55)';
  g.beginPath(); g.ellipse(cx, cy, 11, 8, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = 'rgba(90, 100, 110, 0.6)';
  g.beginPath(); g.ellipse(cx - 4, cy, 2.5, 2, 0, 0, Math.PI * 2); g.ellipse(cx + 4, cy, 2.5, 2, 0, 0, Math.PI * 2); g.fill();
  for (let k = 0; k < 5; k++) { g.beginPath(); g.ellipse(cx - 14 + k * 7, cy + 13, 2, 3, 0, 0, Math.PI * 2); g.fill(); }
}
function paloma(g, cx, cy) {
  g.fillStyle = 'rgba(245, 245, 240, 0.95)';
  g.beginPath(); g.ellipse(cx, cy, 7, 5, 0, 0, Math.PI * 2); g.fill();
  g.fillRect(cx - 1, cy + 3, 3, 10); g.fillRect(cx + 3, cy + 2, 2, 6);
  g.fillStyle = 'rgba(80, 80, 70, 0.8)'; g.fillRect(cx - 2, cy - 1, 3, 2);
}

// ---------- contar la caja ----------
// Una bandeja con monedas y billetes; tres totales en los botones del cuadro, uno bueno. 20 segundos.
const VALORES = [0.05, 0.05, 0.05, 0.1, 0.2, 0.5, 1, 1, 2, 2, 5, 10, 20];
export function contarCaja(alAcabar) {
  const DURA = 20;
  const azar = Math.random;
  const piezas = [];
  const n = 7 + Math.floor(azar() * 5);
  for (let k = 0; k < n; k++) piezas.push(VALORES[Math.floor(azar() * VALORES.length)]);
  // siempre algunas de cinco céntimos, de Totodile
  piezas.push(0.05, 0.05);
  const total = Math.round(piezas.reduce((a, b) => a + b, 0) * 100) / 100;
  const delta = [0.05, 0.1, 0.5, 1, 0.15][Math.floor(azar() * 5)];
  // dos falsos, de entre −2, −1, +1 y +2 veces el salto: así el bueno puede ser el mayor, el menor o el del medio
  const saltos = [-2, -1, 1, 2].map(k => [azar(), k]).sort((a, b) => a[0] - b[0]).slice(0, 2).map(x => x[1]);
  const opciones = [total, ...saltos.map(k => Math.max(0.05, Math.round((total + k * delta) * 100) / 100))]
    .filter((v, i, a) => a.indexOf(v) === i)
    .map(v => [azar(), v]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
  // dónde cae cada pieza en la bandeja (sin pisarse mucho)
  // en rejilla de cuatro por fila, con un poco de desorden
  const sitios = piezas.map((v, k) => ({ v, x: 18 + (k % 4) * 58 + Math.floor(azar() * 6), y: 10 + Math.floor(k / 4) * 44 + Math.floor(azar() * 5) }));
  let alto = 0;
  const juego = {
    opciones,
    medida(d) { alto = d.H; },
    paso(g, t, d) {
      fondoMenta(g, d);
      g.translate(d.ox, Math.max(0, Math.round((alto - 190) / 2)));
      pastilla(g, 'CUENTA LA CAJA', ANCHO / 2, 0);
      barraTiempo(g, 60, 18, 150, 1 - t / DURA);
      tarjeta(g, 8, 30, 254, Math.ceil(sitios.length / 4) * 44 + 20, 8, '#F4FBF8');
      g.translate(0, 30);
      for (const s of sitios) pieza(g, s.v, s.x, s.y);
      if (t >= DURA) return { gana: false, total, fuera: true };
      return null;
    },
    responde(valor, termina) { termina({ gana: valor === total, total, elegido: valor }); },
  };
  return { ...arranca(juego, alAcabar), opciones, total };
}
function pieza(g, v, x, y) {
  // billetes con su valor bien grande; monedas más grandes cuanto más valen, con «cts» o «€»
  if (v >= 5) {
    const color = v === 5 ? '#9DB8A8' : v === 10 ? '#E8A0A0' : '#8FB4E0';
    g.drawImage(cacheado(`bill${v}`, 52, 32, c => {
      caja(c, 1, 2, 50, 29, '#00000033', null, 2);
      caja(c, 0, 0, 50, 29, color, NEGRO, 2);
      caja(c, 4, 4, 42, 21, null, '#FFFFFF88', 2);
      // (las cifras, en pixel de 3×5 al doble: se leen sin dudar)
      cifras(c, `${v}`, 25, 6, { color: NEGRO, align: 'center', escala: 2 });
      texto(c, 'EUROS', 25, 25, { font: '8px Silkscreen', color: NEGRO, align: 'center' });
    }), x - 4, y);
  } else {
    const r = v >= 1 ? 16 : v >= 0.1 ? 14 : 12;
    const color = v === 2 ? '#D8C060' : v === 1 ? '#C8C8B8' : v >= 0.1 ? '#E2B84A' : '#C9784A';
    g.drawImage(cacheado(`mon${v}`, 2 * r + 3, 2 * r + 3, c => {
      c.fillStyle = '#00000033'; c.beginPath(); c.arc(r + 2, r + 2, r, 0, Math.PI * 2); c.fill();
      c.fillStyle = NEGRO; c.beginPath(); c.arc(r + 1, r + 1, r, 0, Math.PI * 2); c.fill();
      c.fillStyle = color; c.beginPath(); c.arc(r + 1, r + 1, r - 1, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#FFFFFF66'; c.fillRect(r - 6, 5, 4, 2);
      cifras(c, v >= 1 ? String(v) : String(Math.round(v * 100)), r + 1, r - 6, { color: NEGRO, align: 'center', escala: 2 });
      texto(c, v >= 1 ? (v === 1 ? 'EURO' : 'EUROS') : 'CTS', r + 1, r + 12, { font: '8px Silkscreen', color: NEGRO, align: 'center' });
    }), x, y + 2);
  }
}

// ---------- envolver el regalo ----------
// Tres pasos, como de verdad: 1) cortar el papel a la medida (la tijera va y viene por la regla:
// toca cuando esté entre las dos marcas); 2) doblar las solapas arrastrándolas sobre la caja,
// primero los lados y luego arriba y abajo; 3) el lazo: toca cuando la cinta pase por el centro.
// Tres fallos y se rompe el papel. 20 segundos.
export function envolver(alAcabar) {
  const DURA = 20;
  let paso = 'cortar', fallos = 0, temblor = 0, alto = 0, aviso = '', avisoHasta = 0;
  const corte = { x: 0 };                       // dónde va la tijera (0..1)
  const BUENO = [0.55, 0.75];                   // entre las dos marcas
  const solapas = { izq: 0, der: 0, arr: 0, aba: 0 };   // 0 abierta → 1 doblada
  let arrastre = null, cinta = 0, lazo = false;
  const CAJA = { x: 100, y: 92, w: 70, h: 52 };
  const falla = (t, txt) => { fallos++; temblor = t + 0.35; aviso = txt; avisoHasta = t + 1.2; sfx('fallo'); };
  const juego = {
    medida(d) { alto = d.H; },
    paso(g, t, d) {
      fondoMenta(g, d);
      g.translate(d.ox, Math.max(0, Math.round((alto - 210) / 2)));
      const titulo = { cortar: '1. CORTA EL PAPEL', doblar: '2. DOBLA: LADOS, LUEGO ARRIBA Y ABAJO', lazo: '3. EL LAZO, EN EL CENTRO' }[paso];
      pastilla(g, t < avisoHasta ? aviso : titulo, ANCHO / 2, 0, t < avisoHasta ? CORAL : TINTA);
      barraTiempo(g, 60, 18, 150, 1 - t / DURA);
      const sx = temblor > t ? Math.round(Math.sin(t * 60) * 2) : 0;
      g.translate(sx, 0);
      if (paso === 'cortar') {
        // el rollo de papel y la regla con las dos marcas; la tijera va y viene
        corte.x = (Math.sin(t * 2) + 1) / 2;
        rr(g, 22, 70, 226, 70, '#F2D7E3', NEGRO, 3);
        for (let k = 28; k < 244; k += 12) rect(g, k, 72, 4, 66, '#EBC3D5');
        rr(g, 22, 150, 226, 12, BLANCO, NEGRO, 2);
        for (let k = 0; k <= 22; k++) rect(g, 24 + k * 10, 151, 1, k % 5 ? 4 : 7, NEGRO);
        const m0 = 24 + BUENO[0] * 220, m1 = 24 + BUENO[1] * 220;
        rect(g, Math.round(m0), 64, 2, 100, MENTA_OSC); rect(g, Math.round(m1), 64, 2, 100, MENTA_OSC);
        rect(g, Math.round(m0), 150, Math.round(m1 - m0), 12, '#9CE8D3');
        tijera(g, Math.round(24 + corte.x * 220), 58);
      } else {
        // el papel ya cortado, la caja encima y las solapas
        papel(g, CAJA, solapas, lazo, paso === 'lazo' ? cinta : null, fallos);
        if (paso === 'lazo') {
          cinta = (Math.sin(t * 2.6) + 1) / 2;
          if (lazo) return { gana: true, fallos };
        }
        if (arrastre) rect(g, Math.round(arrastre.x) - 1, Math.round(arrastre.y) - 1, 3, 3, TINTA);
      }
      if (fallos >= 3) return { gana: false, roto: true, espera: 900 };
      if (t >= DURA) return { gana: false, fuera: true };
      return null;
    },
    toque(tipo, x, y, t) {
      const yy = y - Math.max(0, Math.round((alto - 210) / 2));
      if (paso === 'cortar') {
        if (tipo !== 'baja') return;
        sfx('corte');
        if (corte.x >= BUENO[0] && corte.x <= BUENO[1]) paso = 'doblar';
        else falla(t, corte.x < BUENO[0] ? '¡CORTO! NO LLEGA' : '¡LARGO! SOBRA PAPEL');
        return;
      }
      if (paso === 'lazo') {
        if (tipo !== 'baja') return;
        if (Math.abs(cinta - 0.5) < 0.13) lazo = true;
        else falla(t, 'TORCIDO');
        return;
      }
      // doblar: se coge una solapa y se arrastra hacia la caja
      if (tipo === 'baja') {
        const cual = solapaEn(CAJA, x, yy);
        if (cual && solapas[cual] < 1) arrastre = { cual, x0: x, y0: yy, x, y: yy };
      } else if (tipo === 'mueve' && arrastre) {
        Object.assign(arrastre, { x, y: yy });
      } else if (tipo === 'sube' && arrastre) {
        const { cual, x0, y0 } = arrastre;
        arrastre = null;
        const dx = x - x0, dy = yy - y0;
        const hacia = { izq: dx > 18, der: dx < -18, arr: dy > 14, aba: dy < -14 }[cual];
        if (!hacia) return;
        const lados = solapas.izq === 1 && solapas.der === 1;
        if ((cual === 'arr' || cual === 'aba') && !lados) { falla(t, '¡PRIMERO LOS LADOS!'); return; }
        solapas[cual] = 1;
        sfx('echar');
        if (Object.values(solapas).every(v => v === 1)) paso = 'lazo';
      }
    },
  };
  return arranca(juego, alAcabar);
}
// Qué solapa hay en (x, y): las de los lados, a izquierda y derecha de la caja; las otras, arriba y abajo
function solapaEn(c, x, y) {
  if (y > c.y - 6 && y < c.y + c.h + 6) {
    if (x > c.x - 52 && x < c.x + 6) return 'izq';
    if (x > c.x + c.w - 6 && x < c.x + c.w + 52) return 'der';
  }
  if (x > c.x - 6 && x < c.x + c.w + 6) {
    if (y > c.y - 44 && y < c.y + 6) return 'arr';
    if (y > c.y + c.h - 6 && y < c.y + c.h + 44) return 'aba';
  }
  return null;
}
function tijera(g, x, y) {
  rect(g, x - 1, y, 2, 10, NEGRO);
  rr(g, x - 6, y - 8, 6, 6, CORAL, NEGRO, 2);
  rr(g, x + 1, y - 8, 6, 6, CORAL, NEGRO, 2);
  rect(g, x - 1, y + 10, 2, 82, '#0E4A3C55');
}
function papel(g, c, solapas, lazo, cinta, fallos) {
  const ROSA = '#F2D7E3', RAYA = '#EBC3D5', DOBLADO = '#E5AFC6';
  const tira = (x, y, w, h, color) => { rr(g, x, y, w, h, color, NEGRO, 2); for (let k = 6; k < w - 4; k += 12) rect(g, x + k, y + 2, 4, h - 4, color === ROSA ? RAYA : '#DC9DB8'); };
  // las solapas abiertas, alrededor de la caja
  if (!solapas.izq) tira(c.x - 48, c.y, 50, c.h, ROSA);
  if (!solapas.der) tira(c.x + c.w - 2, c.y, 50, c.h, ROSA);
  if (!solapas.arr) tira(c.x, c.y - 40, c.w, 42, ROSA);
  if (!solapas.aba) tira(c.x, c.y + c.h - 2, c.w, 42, ROSA);
  // la caja
  rr(g, c.x, c.y, c.w, c.h, BLANCO, NEGRO, 2);
  rect(g, c.x + 3, c.y + 3, c.w - 6, 2, '#E6F4EF');
  // las solapas dobladas, encima de la caja (más oscuras)
  if (solapas.izq) tira(c.x, c.y, c.w / 2 + 4, c.h, DOBLADO);
  if (solapas.der) tira(c.x + c.w / 2 - 4, c.y, c.w / 2 + 4, c.h, DOBLADO);
  if (solapas.arr) tira(c.x, c.y, c.w, c.h / 2 + 3, DOBLADO);
  if (solapas.aba) tira(c.x, c.y + c.h / 2 - 3, c.w, c.h / 2 + 3, DOBLADO);
  // flechas que indican hacia dónde se dobla cada solapa que queda
  const lados = solapas.izq && solapas.der;
  if (!solapas.izq) flechita(g, c.x - 26, c.y + c.h / 2, 1, 0);
  if (!solapas.der) flechita(g, c.x + c.w + 24, c.y + c.h / 2, -1, 0);
  if (lados && !solapas.arr) flechita(g, c.x + c.w / 2, c.y - 22, 0, 1);
  if (lados && !solapas.aba) flechita(g, c.x + c.w / 2, c.y + c.h + 20, 0, -1);
  // la cinta del lazo, que va y viene; y el lazo puesto
  if (cinta != null && !lazo) {
    const x = Math.round(c.x - 30 + cinta * (c.w + 60));
    rect(g, x - 2, c.y - 8, 4, c.h + 16, CORAL);
    rect(g, c.x + c.w / 2 - 1, c.y - 12, 2, 6, TINTA); rect(g, c.x + c.w / 2 - 1, c.y + c.h + 6, 2, 6, TINTA);
  }
  if (lazo) {
    rect(g, c.x + c.w / 2 - 2, c.y, 4, c.h, CORAL); rect(g, c.x, c.y + c.h / 2 - 2, c.w, 4, CORAL);
    rr(g, c.x + c.w / 2 - 12, c.y + c.h / 2 - 8, 10, 8, CORAL, NEGRO, 3);
    rr(g, c.x + c.w / 2 + 2, c.y + c.h / 2 - 8, 10, 8, CORAL, NEGRO, 3);
  }
  // los rotos
  for (let k = 0; k < fallos; k++) for (let i = 0; i < 12; i++) rect(g, c.x - 40 + k * 120 + i, c.y + 6 + ((i * 7) % 11), 2, 2, NEGRO);
}
function flechita(g, x, y, dx, dy) {
  x = Math.round(x); y = Math.round(y);
  for (let k = -6; k <= 6; k++) rect(g, x + dx * k, y + dy * k, dy ? 2 : 1, dx ? 2 : 1, TINTA);
  for (let k = 0; k < 4; k++) {
    if (dx) rect(g, x + dx * (6 - k), y - k, 1, 2 * k + 2, TINTA);
    else rect(g, x - k, y + dy * (6 - k), 2 * k + 2, 1, TINTA);
  }
}

// ---------- pulverizar a Ñoño ----------
// Ñoño, de frente, se tapa la cara con sus estampitas: mientras las mira de cerca, no ve nada.
// Mantén el dedo para rociarle desodorante. De vez en cuando las estampitas tiemblan («?») y las
// baja para mirar: si te pilla rociando, se ríe y se acaba. Hay que llenar la barra de «olor a limpio».
export function pulverizar(imgs, alAcabar) {
  const DURA = 20;
  let lleno = 0, apretado = false, alto = 0, pillado = false, ultimoSpray = -1, tPrevio = null;
  let baja = 1.8 + Math.random() * 1.5, sube = -1;   // cuándo baja las estampitas y cuándo las vuelve a subir
  const gotas = [];
  const juego = {
    medida(d) { alto = d.H; },
    paso(g, t, d) {
      fondoMenta(g, d);
      g.translate(d.ox, Math.max(0, Math.round((alto - 220) / 2)));
      pastilla(g, pillado ? '¡TE HA PILLADO!' : 'ROCÍALE SIN QUE TE VEA', ANCHO / 2, 0, pillado ? CORAL : TINTA);
      barraTiempo(g, 60, 18, 150, 1 - t / DURA);
      // cuándo mira: avisa medio segundo antes (las estampitas tiemblan y sale una interrogación)
      const avisa = t >= baja - 0.6 && t < baja;
      if (t >= baja && sube < 0) sube = t + 0.9 + Math.random() * 0.8;
      if (sube > 0 && t >= sube) { sube = -1; baja = t + 1.3 + Math.random() * 1.8; }
      const mira = sube > 0;
      // (un respiro de 0,15 s: si sueltas justo cuando baja las estampitas, no te pilla)
      if (mira && apretado && !pillado && t - baja >= 0.15) pillado = true;
      const dt = Math.min(0.1, t - (tPrevio ?? t)); tPrevio = t;
      if (apretado && !mira && !pillado) lleno = Math.min(1, lleno + dt / 3.4);
      // el suelo y Ñoño, de frente
      rr(g, 40, 176, 190, 14, '#E6F4EF', NEGRO, 6);
      const img = imgs.frente;
      const nx = 100, pies = 182;
      if (img) g.drawImage(img, nx - Math.round(img.width / 2), pies - img.height);
      else rr(g, nx - 30, pies - 82, 60, 82, '#9A7A50', NEGRO, 10);
      // el olor: rayas verdes que suben, menos cuanto más desodorante
      const olor = 1 - lleno;
      for (let k = 0; k < 4; k++) {
        if (k / 4 >= olor) continue;
        const ox = nx - 30 + k * 20, fase = (t * 1.2 + k * 0.3) % 1;
        for (let i = 0; i < 6; i++) rect(g, ox + Math.round(Math.sin((fase * 6 + i) * 1.6) * 2), pies - 90 - i * 3 - Math.round(fase * 10), 1, 2, '#6CBF4A');
      }
      // las estampitas, en sus manos: delante de la cara mientras las mira; bajadas cuando te busca
      const temb = avisa ? Math.round(Math.sin(t * 50)) : 0;
      const cy = mira ? pies - 34 : pies - 70;
      estampitas(g, nx + temb, cy);
      if (avisa) { rr(g, nx + 26, pies - 100, 12, 16, BLANCO, NEGRO, 4); rect(g, nx + 31, pies - 97, 2, 7, CORAL); rect(g, nx + 31, pies - 88, 2, 2, CORAL); }
      if (mira) { rr(g, nx + 26, pies - 100, 12, 16, BLANCO, NEGRO, 4); rect(g, nx + 31, pies - 97, 2, 7, TINTA); rect(g, nx + 31, pies - 88, 2, 2, TINTA); }
      // el brazo de Morty con el espray, desde la derecha
      const brazo = apretado && !pillado ? 0 : 6;
      rr(g, 196 + brazo, 112, 70, 10, '#1A1A1A', NEGRO, 3);          // la manga del abrigo
      rr(g, 186 + brazo, 110, 14, 14, '#E2B48C', NEGRO, 4);          // la mano
      rr(g, 180 + brazo, 94, 12, 28, '#3E8FD6', NEGRO, 3);           // el bote
      rect(g, 182 + brazo, 90, 6, 4, NEGRO); rect(g, 178 + brazo, 91, 3, 2, NEGRO);   // la boquilla
      if (apretado && !pillado && Math.floor(t * 8) % 2 === 0 && Math.floor(t * 8) !== ultimoSpray) { ultimoSpray = Math.floor(t * 8); sfx('espray'); }
      if (apretado && !pillado) for (let k = 0; k < 3; k++) gotas.push({ x: 176, y: 92, vx: -2.6 - Math.random() * 1.4, vy: -0.6 + Math.random() * 1.2, vida: 1 });
      for (const p of gotas) { p.x += p.vx; p.y += p.vy; p.vida -= 0.035; }
      while (gotas.length && gotas[0].vida <= 0) gotas.shift();
      for (const p of gotas) rect(g, Math.round(p.x), Math.round(p.y), 2, 2, p.vida > 0.5 ? '#CFEFFF' : '#E8F8FF');
      // la barra de «olor a limpio»
      rr(g, 40, 196, 190, 14, BLANCO, NEGRO, 4);
      if (lleno > 0) rr(g, 42, 198, Math.max(4, Math.round(186 * lleno)), 10, '#9CE8D3', null, 3);
      texto(g, 'OLOR A LIMPIO', 135, 206, { font: '8px Silkscreen', color: TINTA, align: 'center' });
      if (pillado) return { gana: false, pillado: true, espera: 1200 };
      if (lleno >= 1) return { gana: true };
      if (t >= DURA) return { gana: false, fuera: true };
      return null;
    },
    toque(tipo) {
      if (tipo === 'baja') apretado = true;
      else if (tipo === 'sube') apretado = false;
    },
  };
  return arranca(juego, alAcabar);
}
// Tres estampitas en abanico, cogidas con las dos manos (los dedos de Ñoño por los lados)
function estampitas(g, cx, cy) {
  const colores = ['#F4D23C', '#E4679B', '#3E8FD6'];
  colores.forEach((c, k) => {
    const x = cx - 22 + k * 13, y = cy - (k === 1 ? 4 : 0);
    rr(g, x, y, 18, 24, BLANCO, NEGRO, 2);
    rr(g, x + 2, y + 2, 14, 13, c, null, 1);
    rect(g, x + 7, y + 6, 4, 4, BLANCO);               // el bicho de la estampita
    rect(g, x + 3, y + 18, 12, 1, '#9AA0A0'); rect(g, x + 3, y + 20, 8, 1, '#9AA0A0');
  });
  // los dedos
  rr(g, cx - 27, cy + 8, 8, 10, '#9A6A3A', NEGRO, 3);
  rr(g, cx + 22, cy + 8, 8, 10, '#9A6A3A', NEGRO, 3);
}

// ---------- Alhaurín se queja ----------
// El Mákina le deja el móvil a Morty, con el grupo de Facebook «Alhaurín se queja» abierto. Los
// comentarios salen de uno en uno: deslizando a la izquierda se denuncian (las críticas, también las
// que parecen buenas y no lo son) y a la derecha se les da «me gusta» (los pelotas: su primo, su
// madre, él mismo con otro nombre). Cada comentario tiene su barrita: si una crítica se queda (se
// acaba la barrita o le das «me gusta»), la publicación se va haciendo viral, y a la tercera se acabó.
// Si denuncias a un pelota, el Mákina grita, te quita el móvil un segundo y se gasta batería. El tiempo es la batería; y de
// vez en cuando entra un WhatsApp que hay que cerrar tocándolo. Ocho denuncias y el muro queda limpio:
// sale el pantallazo con lo que queda (solo los pelotas).
// datos: { post, comentarios: [{ nombre, texto, cara, critica, grito }], whatsapp: [{ nombre, texto }],
//          alcalde: { Normal, Shouting } (las urls de sus caras) }
export function alhaurinSeQueja(datos, alAcabar) {
  const META = 8, DURA = 36, BATERIA = 18, MAXVIRAL = 3, ALTO = 248;
  const CARTA = { x: 60, y: 108, w: 150, h: 100 };
  const BANNER = { x: 60, y: 28, w: 150, h: 56 };
  const mezcla = a => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(x => x[1]);
  const criticas = mezcla(datos.comentarios.filter(c => c.critica));
  const pelotas = mezcla(datos.comentarios.filter(c => !c.critica));
  [...datos.comentarios.map(c => c.cara), ...Object.values(datos.alcalde)].forEach(cargaCara);   // (se cargan desde el principio)
  let ic = 0, ip = 0, nCartas = 0;
  const saca = t => {
    const critica = !pelotas.length || (criticas.length && Math.random() < 0.62);
    const c = critica ? criticas[ic++ % criticas.length] : pelotas[ip++ % pelotas.length];
    // la barrita de cada comentario, cada vez más corta
    return { c, t0: t, dura: Math.max(3.2, 5.4 - nCartas++ * 0.14), dx: 0 };
  };
  let carta = null, proxima = 0.5, saliendo = [], arrastre = null, alto = 0, arriba = 0;
  let denunciados = 0, viral = 0, penal = 0, aviso = '', avisoHasta = 0, grito = 0;
  const wasaps = mezcla(datos.whatsapp);
  let wasap = null, proximoWasap = 7 + Math.random() * 3;
  let fase = 'juego', tFase = 0, tPrevio = null;
  const gustados = [];
  const bateria = t => BATERIA * (1 - t / DURA) - penal;
  const ahora = () => (performance.now() - actual.t0) / 1000;
  const avisa = (t, txt) => { aviso = txt; avisoHasta = t + 1.3; };
  // izquierda (-1): denunciar; derecha (1): me gusta; 0: se le acabó la barrita
  const decide = (dir, t) => {
    if (fase !== 'juego' || !carta || wasap || t < grito) return;   // (mientras grita, el móvil lo tiene él)
    const { c } = carta;
    if (dir < 0) {
      if (c.critica) { denunciados++; sfx('corte'); }
      else { penal += 4; grito = t + 1.1; avisa(t, c.grito || '¡QUE ES DE LOS MÍOS!'); sfx('fallo'); }
    } else if (dir > 0) {
      if (c.critica) { viral++; avisa(t, '¡LE HAS DADO ME GUSTA!'); sfx('fallo'); }
      else { gustados.push(c); sfx('echar'); }
    } else if (c.critica) { viral++; avisa(t, '¡SE HA QUEDADO!'); sfx('fallo'); }
    else gustados.push(c);
    saliendo.push({ ...carta, dir, ts: t });
    carta = null; arrastre = null;
    proxima = t + 0.3;
  };
  const juego = {
    medida(d) { alto = d.H; },
    paso(g, t, d) {
      fondoMenta(g, d);
      arriba = Math.max(0, Math.round((alto - ALTO) / 2));
      g.translate(d.ox, arriba);
      const dt = Math.min(0.1, t - (tPrevio ?? t)); tPrevio = t;
      if (fase === 'juego') {
        if (!wasap && wasaps.length && t >= proximoWasap) { wasap = { ...wasaps.shift(), t }; sfx('telefono'); proximoWasap = t + 9 + Math.random() * 4; }
        if ((wasap || t < grito) && carta) carta.t0 += dt;   // (mientras está el WhatsApp o grita el Mákina, el comentario espera)
        if (!carta && t >= proxima) carta = saca(t);
        if (carta && !arrastre && t - carta.t0 >= carta.dura) decide(0, t);
        if (denunciados >= META) { fase = 'limpio'; tFase = t; wasap = null; }
        else if (viral >= MAXVIRAL) { fase = 'viral'; tFase = t; wasap = null; }
        else if (bateria(t) <= 0) { fase = 'apagado'; tFase = t; wasap = null; }
      }
      // arriba, cuántas van (o el aviso, o cómo ha acabado)
      const [titulo, color] = fase === 'limpio' ? ['¡MURO LIMPIO!', MENTA_OSC] : fase === 'viral' ? ['¡SE HA HECHO VIRAL!', CORAL]
        : fase === 'apagado' ? ['SIN BATERÍA', CORAL] : t < avisoHasta ? [aviso, CORAL] : wasap ? ['TOCA EL WHATSAPP', CORAL] : [`DENUNCIADOS ${denunciados} DE ${META}`, TINTA];
      pastilla(g, titulo, ANCHO / 2, 0, color);
      // el móvil
      rr(g, 52, 18, 170, 230, MENTA_OSC, null, 12);
      rr(g, 50, 16, 170, 230, '#1C1C1C', NEGRO, 12);
      rr(g, 56, 24, 158, 214, '#EEF3F1', null, 6);
      if (fase === 'apagado') return apagado(g, t);
      barraEstado(g, t);
      rect(g, 56, 36, 158, 13, TINTA);
      texto(g, 'ALHAURÍN SE QUEJA', 135, 46, { font: '8px Silkscreen', color: BLANCO, align: 'center' });
      publicacion(g);
      if (fase === 'viral') return meme(g, t);
      if (fase === 'limpio') return pantallazo(g, t);
      // el comentario que toca, con el siguiente asomando detrás; y los que se van
      rr(g, CARTA.x + 4, CARTA.y + 5, CARTA.w, CARTA.h, '#D3DFDB', '#9FB5AE', 4);
      for (const s of saliendo) {
        const p = (t - s.ts) / 0.3;
        if (p >= 1) continue;
        g.globalAlpha = 1 - p;
        comentario(g, s.c, CARTA.x + s.dx + s.dir * p * 200, CARTA.y - (s.dir ? 0 : p * 24), 0, s.dir);
        g.globalAlpha = 1;
      }
      saliendo = saliendo.filter(s => t - s.ts < 0.3);
      if (carta) comentario(g, carta.c, CARTA.x + carta.dx, CARTA.y, 1 - (t - carta.t0) / carta.dura, carta.dx < -12 ? -1 : carta.dx > 12 ? 1 : 0);
      // las dos direcciones, abajo
      const tira = carta?.dx || 0;
      texto(g, '< DENUNCIAR', 61, 228, { font: '8px Silkscreen', color: tira < -12 ? CORAL : '#B4574E' });
      texto(g, 'ME GUSTA >', 209, 228, { font: '8px Silkscreen', color: tira > 12 ? MENTA_OSC : '#3E8F7A', align: 'right' });
      if (wasap) banner(g, t);
      // el Mákina, cuando denuncias a uno de los suyos
      if (t < grito) {
        const cara = caraEscalada(datos.alcalde.Shouting, 40);
        const sx = Math.round(Math.sin(t * 50) * 2);
        rr(g, 221 + sx, 129, 44, 44, BLANCO, NEGRO, 4);
        if (cara) g.drawImage(cara, 223 + sx, 131);
      }
      return null;
    },
    toque(tipo, x, y) {
      if (fase !== 'juego') return;
      const yy = y - arriba;
      if (wasap) {
        if (tipo === 'baja' && x >= BANNER.x && x <= BANNER.x + BANNER.w && yy >= BANNER.y && yy <= BANNER.y + BANNER.h) { wasap = null; sfx('toque'); }
        return;
      }
      if (!carta) return;
      if (tipo === 'baja') {
        if (x >= CARTA.x - 10 && x <= CARTA.x + CARTA.w + 10 && yy >= CARTA.y - 10 && yy <= CARTA.y + CARTA.h + 20) arrastre = { x0: x - carta.dx };
      } else if (tipo === 'mueve' && arrastre) {
        carta.dx = Math.max(-90, Math.min(90, x - arrastre.x0));
      } else if (tipo === 'sube' && arrastre) {
        arrastre = null;
        if (carta.dx < -28) decide(-1, ahora());
        else if (carta.dx > 28) decide(1, ahora());
        else carta.dx = 0;
      }
    },
    // los botones del cuadro, para quien prefiera tocar a deslizar
    responde(valor) { if (!wasap) decide(valor === 'denunciar' ? -1 : 1, ahora()); },
  };

  function barraEstado(g, t) {
    // a la izquierda, lo viral que se está poniendo; a la derecha, la batería
    texto(g, 'VIRAL', 60, 33, { font: '8px Silkscreen', color: viral ? CORAL : TINTA });
    for (let k = 0; k < MAXVIRAL; k++) rr(g, 92 + k * 8, 27, 6, 6, k < viral ? CORAL : '#C9D6D2', NEGRO, 1);
    const b = Math.max(0, bateria(t)), f = b / BATERIA;
    const rojo = f < 0.35 && Math.floor(t * 3) % 2 === 0;
    cifras(g, `${Math.ceil(b)}%`, 189, 28, { color: rojo ? CORAL : TINTA, align: 'right' });
    rr(g, 192, 27, 16, 7, BLANCO, NEGRO, 1);
    rect(g, 208, 29, 1, 3, NEGRO);
    const lleno = Math.round(12 * f);
    if (lleno > 0) rect(g, 194, 29, lleno, 3, f < 0.35 ? CORAL : MENTA_OSC);
  }
  function publicacion(g) {
    rr(g, 60, 52, 150, 50, BLANCO, '#BFD9D1', 3);
    avatar(g, datos.alcalde.Normal, 'El Mákina', 63, 55);
    texto(g, 'El Mákina', 87, 62, { font: '8px Silkscreen', color: TINTA });
    texto(g, 'ALCALDE · HACE 2 H', 87, 72, { font: '8px Silkscreen', color: '#7F9993' });
    parte(datos.post, 142, LETRA).slice(0, 2).forEach((l, k) => texto(g, l, 64, 87 + k * 10, { font: LETRA, color: NEGRO }));
  }
  function comentario(g, c, x, y, vida, sello) {
    x = Math.round(x); y = Math.round(y);
    rr(g, x, y, CARTA.w, CARTA.h, BLANCO, NEGRO, 4);
    avatar(g, c.cara, c.nombre, x + 5, y + 5);
    parte(c.nombre, 110, '8px Silkscreen').slice(0, 2).forEach((l, k) => texto(g, l, x + 30, y + 13 + k * 9, { font: '8px Silkscreen', color: TINTA }));
    parte(c.texto, 140, LETRA).slice(0, 3).forEach((l, k) => texto(g, l, x + 5, y + 40 + k * 11, { font: LETRA, color: NEGRO }));
    if (vida > 0) {
      rr(g, x + 5, y + CARTA.h - 9, CARTA.w - 10, 5, '#E6EEEB', null, 2);
      rr(g, x + 5, y + CARTA.h - 9, Math.max(3, Math.round((CARTA.w - 10) * Math.min(1, vida))), 5, vida < 0.3 ? CORAL : MENTA_OSC, null, 2);
    }
    // el sello de lo que se le va a hacer (o se le ha hecho)
    if (sello) {
      const [txt, col] = sello < 0 ? ['DENUNCIADO', CORAL] : ['ME GUSTA', MENTA_OSC];
      const w = txt.length * 6 + 10, sx = sello < 0 ? x + CARTA.w - w - 6 : x + 6;
      rr(g, sx, y + 75, w, 13, col, null, 2);
      rr(g, sx + 1, y + 76, w - 2, 11, BLANCO, null, 2);
      texto(g, txt, sx + w / 2, y + 85, { font: '8px Silkscreen', color: col, align: 'center' });
    }
  }
  function banner(g, t) {
    const y = BANNER.y - Math.max(0, Math.round(60 - (t - wasap.t) * 300));
    rr(g, BANNER.x + 2, y + 2, BANNER.w, BANNER.h, '#00000033', null, 4);
    rr(g, BANNER.x, y, BANNER.w, BANNER.h, '#E3F7EC', NEGRO, 4);
    rr(g, BANNER.x + 5, y + 5, 10, 10, '#2FB894', NEGRO, 3);
    rect(g, BANNER.x + 8, y + 8, 4, 3, BLANCO);
    texto(g, wasap.nombre, BANNER.x + 19, y + 13, { font: '8px Silkscreen', color: TINTA });
    parte(wasap.texto, 140, LETRA).slice(0, 3).forEach((l, k) => texto(g, l, BANNER.x + 5, y + 27 + k * 10, { font: LETRA, color: NEGRO }));
  }
  // ocho denuncias: el pantallazo del muro, solo con los pelotas
  function pantallazo(g, t) {
    const lista = gustados.slice(-4);
    if (!lista.length) texto(g, 'Ni un comentario. Como debe ser.', 135, 124, { font: LETRA, color: TINTA, align: 'center' });
    lista.forEach((c, k) => {
      const y = 106 + k * 24;
      rr(g, 60, y, 150, 22, BLANCO, '#BFD9D1', 3);
      avatar(g, c.cara, c.nombre, 61, y + 1);
      texto(g, parte(c.nombre, 92, '8px Silkscreen')[0], 85, y + 10, { font: '8px Silkscreen', color: TINTA });
      texto(g, 'ME GUSTA', 205, y + 19, { font: '8px Silkscreen', color: MENTA_OSC, align: 'right' });
    });
    rr(g, 64, 206, 142, 26, MENTA_OSC, null, 3);
    rr(g, 66, 208, 138, 22, BLANCO, null, 2);
    texto(g, 'MURO LIMPIO', 135, 225, { font: '16px Silkscreen', color: MENTA_OSC, align: 'center' });
    if (t - tFase < 0.18) rect(g, 56, 24, 158, 214, BLANCO);         // (el flash de la captura)
    return t - tFase > 3 ? { gana: true, denunciados, espera: 200 } : null;
  }
  // tres críticas que se quedan: el meme del alcalde corre por el pueblo
  function meme(g, t) {
    rect(g, 56, 104, 158, 134, CORAL);
    texto(g, 'MEDIA ROTONDA', 135, 122, { font: '16px Silkscreen', color: BLANCO, align: 'center' });
    const cara = caraEscalada(datos.alcalde.Shouting, 40);
    rr(g, 113, 126, 44, 44, BLANCO, null, 2);
    if (cara) g.drawImage(cara, 115, 128);
    texto(g, 'MEDIO ALCALDE', 135, 190, { font: '16px Silkscreen', color: BLANCO, align: 'center' });
    const veces = Math.min(4321, Math.round((t - tFase) * 2600));
    texto(g, `COMPARTIDO ${veces.toLocaleString('es-ES')} VECES`, 135, 222, { font: '8px Silkscreen', color: BLANCO, align: 'center' });
    return t - tFase > 2.4 ? { gana: false, viral: true, denunciados, espera: 200 } : null;
  }
  function apagado(g, t) {
    rr(g, 56, 24, 158, 214, '#0B0B0B', null, 6);
    if (Math.floor((t - tFase) * 3) % 2 === 0) {
      rr(g, 120, 120, 26, 12, '#0B0B0B', CORAL, 2);
      rect(g, 146, 124, 2, 4, CORAL);
      rect(g, 123, 123, 3, 6, CORAL);
    }
    return t - tFase > 1.8 ? { gana: false, apagado: true, denunciados, espera: 200 } : null;
  }
  return arranca(juego, alAcabar);
}
const LETRA = '10px "Pixelify Sans"';
// Parte un texto en líneas que quepan en «ancho» (medido con la fuente de verdad); se guarda
const medidor = document.createElement('canvas').getContext('2d');
const partidos = new Map();
function parte(txt, ancho, font) {
  const clave = `${font}|${ancho}|${txt}`;
  let lineas = partidos.get(clave);
  if (lineas) return lineas;
  medidor.font = font;
  lineas = [];
  let linea = '';
  for (const p of String(txt).split(' ')) {
    const prueba = linea ? `${linea} ${p}` : p;
    if (linea && medidor.measureText(prueba).width > ancho) { lineas.push(linea); linea = p; } else linea = prueba;
  }
  if (linea) lineas.push(linea);
  partidos.set(clave, lineas);
  return lineas;
}
// Las caras de los clientes, a la mitad (20 px) y suavizadas para que se lean pequeñas
const caras = new Map();
function cargaCara(url) {
  if (!url || caras.has(url)) return;
  const i = new Image();
  i.src = url;
  caras.set(url, i);
}
const escaladas = new Map();
function caraEscalada(url, lado) {
  const i = caras.get(url);
  if (!i || !i.complete || !i.naturalWidth) return null;
  const clave = `${url}|${lado}`;
  let c = escaladas.get(clave);
  if (!c) {
    c = document.createElement('canvas'); c.width = lado; c.height = lado;
    const cg = c.getContext('2d');
    cg.imageSmoothingEnabled = lado < i.naturalWidth;
    cg.imageSmoothingQuality = 'high';
    cg.drawImage(i, 0, 0, lado, lado);
    escaladas.set(clave, c);
  }
  return c;
}
// La foto de perfil: la cara, si la tiene; si no, un cuadrado de color con la inicial
const COLORES_PERFIL = ['#E4679B', '#3E8FD6', '#F29B2E', '#7B5BC2', '#6CBF4A', '#C0392B', '#2FB894'];
function avatar(g, url, nombre, x, y) {
  const cara = caraEscalada(url, 20);
  rr(g, x - 1, y - 1, 22, 22, NEGRO, null, 3);
  if (cara) { rr(g, x, y, 20, 20, '#DCEFE9', null, 2); g.drawImage(cara, x, y); return; }
  const n = [...nombre].reduce((a, ch) => a + ch.charCodeAt(0), 0);
  rr(g, x, y, 20, 20, COLORES_PERFIL[n % COLORES_PERFIL.length], null, 2);
  texto(g, nombre.charAt(0).toUpperCase(), x + 10, y + 14, { font: '8px Silkscreen', color: BLANCO, align: 'center' });
}
