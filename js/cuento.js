// Las animaciones de cuento (la intro y el final): un cuento animado de pegatinas. Cada escena es un
// decorado hecho de pegatinas y unos personajes que se mueven por él, todo recortado con borde blanco y
// sombra. No es una postal: las cosas pasan.
// - recorridos («ruta»): cada pegatina va de un sitio a otro por fotogramas clave, con su tiempo; los
//   personajes con animación (Morty, Gengar: sus hojas del juego) andan mientras se mueven y se paran
//   al llegar, mirando hacia donde van;
// - la cámara de cada escena («camara»): paneos y acercamientos, también por fotogramas clave;
// - entradas (deslizándose, cayendo con su aplastón y su polvo, de golpe) y movimientos (botar,
//   flotar, mecerse, girar, brillar, derivar…), y efectos encima (vapor, chispas, sudor, notas, «Zzz»);
// - entre escenas, un círculo que se cierra y se abre, como en los dibujos animados;
// - el texto, abajo, se escribe letra a letra (tocar lo termina; tocar otra vez, sigue).
// Cada escena tiene varias frases y cada pegatina sale a partir de la que diga («desde»).
import { loadSprite, fotograma } from './sprites.js';

const $ = s => document.querySelector(s);
export const ANCHO = 360;   // el escenario mide 360 de ancho; el alto, lo que dé la pantalla

const imagenes = new Map();
function carga(src) {
  if (!imagenes.has(src)) {
    imagenes.set(src, new Promise(ok => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; }));
  }
  return imagenes.get(src);
}

// ---------- la pegatina: el dibujo con su silueta en blanco alrededor y una sombra ----------
const RES = 2;   // se hacen al doble, para que el borde salga fino
function recorta(fuente, w, h, borde) {
  const c = document.createElement('canvas');
  c.width = w + borde * 2 + 5; c.height = h + borde * 2 + 5;
  const g = c.getContext('2d');
  const sil = document.createElement('canvas');
  sil.width = w; sil.height = h;
  const sg = sil.getContext('2d');
  sg.drawImage(fuente, 0, 0);
  sg.globalCompositeOperation = 'source-in';
  sg.fillStyle = '#FFFFFF'; sg.fillRect(0, 0, w, h);
  const somb = document.createElement('canvas');
  somb.width = w; somb.height = h;
  const og = somb.getContext('2d');
  og.drawImage(sil, 0, 0);
  og.globalCompositeOperation = 'source-in';
  og.fillStyle = 'rgba(14, 40, 40, 0.30)'; og.fillRect(0, 0, w, h);
  const disco = (img, ox, oy) => {
    for (let dy = -borde; dy <= borde; dy++) for (let dx = -borde; dx <= borde; dx++) {
      if (dx * dx + dy * dy <= borde * borde) g.drawImage(img, borde + dx + ox, borde + dy + oy);
    }
  };
  disco(somb, 5, 5);
  disco(sil, 0, 0);
  g.drawImage(fuente, borde, borde);
  return c;
}
const pegatinas = new Map();
// de una imagen o de un trozo de una hoja (pixel art: ampliado sin suavizar; grande: con suavizado)
function pegatinaImagen(img, escala, sx = 0, sy = 0, sw = img.width, sh = img.height, plano = false) {
  const clave = `${img.src}|${escala}|${sx}|${sy}|${plano}`;
  if (pegatinas.has(clave)) return pegatinas.get(clave);
  const w = Math.max(1, Math.round(sw * escala * RES)), h = Math.max(1, Math.round(sh * escala * RES));
  const f = document.createElement('canvas');
  f.width = w; f.height = h;
  const fg = f.getContext('2d');
  fg.imageSmoothingEnabled = escala < 1;
  fg.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
  const c = { lienzo: plano ? f : recorta(f, w, h, 3 * RES) };
  pegatinas.set(clave, c);
  return c;
}
// de un dibujo hecho aquí: { dibujo(g), w, h } en su caja (0,0 arriba a la izquierda)
function pegatinaDibujo(p) {
  if (p._peg) return p._peg;
  const w = Math.max(1, Math.round(p.w * RES)), h = Math.max(1, Math.round(p.h * RES));
  const f = document.createElement('canvas');
  f.width = w; f.height = h;
  const fg = f.getContext('2d');
  fg.scale(RES, RES);
  p.dibujo(fg);
  p._peg = { lienzo: p.sinBorde ? f : recorta(f, w, h, (p.borde ?? 3) * RES) };
  return p._peg;
}

// ---------- dónde está cada pegatina en el instante t ----------
const suave = f => 1 - (1 - f) ** 3;
const curva = f => f * f * (3 - 2 * f);
const rebote = f => (f < 1 ? 1 - Math.abs(Math.cos(f * Math.PI * 2.5)) * (1 - f) : 1);
// el recorrido: [[segundos desde que sale, x, y, { escala, giro, anim, espejo }], …]
function enRuta(p, tt) {
  const r = p.ruta;
  if (!r?.length) return null;
  let x = p.x, y = p.y, extra = {}, moviendo = false, haciaIzq = false;
  if (tt <= r[0][0]) return { x, y, extra, moviendo: false };
  let prev = [r[0][0], p.x, p.y, {}];
  for (const k of r) {
    if (tt < k[0]) {
      const f = curva((tt - prev[0]) / Math.max(0.001, k[0] - prev[0]));
      x = prev[1] + (k[1] - prev[1]) * f; y = prev[2] + (k[2] - prev[2]) * f;
      extra = { ...prev[3], ...Object.fromEntries(Object.entries(k[3] || {}).filter(([n]) => n === 'escala' || n === 'giro').map(([n, v]) => [n, (prev[3]?.[n] ?? (n === 'escala' ? 1 : 0)) + (v - (prev[3]?.[n] ?? (n === 'escala' ? 1 : 0))) * f])) };
      moviendo = Math.abs(k[1] - prev[1]) > 1 || Math.abs(k[2] - prev[2]) > 1;
      haciaIzq = k[1] < prev[1] - 1;
      return { x, y, extra, moviendo, haciaIzq, anim: k[3]?.animViaje };
    }
    prev = k;
  }
  return { x: prev[1], y: prev[2], extra: prev[3] || {}, moviendo: false, haciaIzq: false };
}
function posicion(p, t, alto) {
  const f = Math.min(1, Math.max(0, (t - p.t0) / (p.dura ?? 0.6)));
  const tt = t - p.t0;
  const ruta = enRuta(p, tt);
  let x = ruta ? ruta.x : p.x;
  let y = ruta ? ruta.y : p.y;
  if (y < 0) y = alto + y;
  let ex = 1, ey = 1, alfa = 1, giro = (p.giro || 0) + (ruta?.extra?.giro || 0);
  const esc = ruta?.extra?.escala ?? 1;
  const e = p.entra || 'pop';
  if (e === 'izq') x -= (1 - suave(f)) * (ANCHO + 160);
  else if (e === 'der') x += (1 - suave(f)) * (ANCHO + 160);
  else if (e === 'abajo') y += (1 - suave(f)) * (alto * 0.7);
  else if (e === 'arriba') y -= (1 - suave(f)) * (alto * 0.7);
  else if (e === 'cae') {
    y -= (1 - rebote(f)) * (alto * 0.6);
    // al tocar el suelo: un aplastón
    const a = (tt - (p.dura ?? 0.6) * 0.4) / 0.25;
    if (a > 0 && a < 1) { const s = Math.sin(a * Math.PI) * 0.18; ex += s; ey -= s; }
  } else if (e === 'pop') { const s = f < 1 ? suave(f) * 1.15 - Math.max(0, f - 0.7) * 0.5 : 1; ex *= s; ey *= s; }
  else if (e === 'funde') alfa = f;
  else if (e === 'estira') { const s = f < 1 ? suave(f) : 1; ey *= s; ex *= 1 + (1 - s) * 0.4; }
  if (p.sale != null && t > p.sale) alfa *= 1 - Math.min(1, (t - p.sale) / 0.5);
  const v = p.velocidad ?? 1, fase = p.fase || 0;
  switch (p.mueve) {
    case 'bote': { const b = Math.abs(Math.sin(tt * 4 * v + fase)); y -= b * 7; ey *= 1 + (b < 0.15 ? -0.08 : 0.04); ex *= 1 + (b < 0.15 ? 0.08 : -0.02); break; }
    case 'flota': y += Math.sin(tt * 1.6 * v + fase) * 5; giro += Math.sin(tt * 1.2 * v + fase) * 0.03; break;
    case 'tiembla': x += Math.sin(tt * 60) * 2.5; giro += Math.sin(tt * 40) * 0.06; break;
    case 'baila': { const b = Math.abs(Math.sin(tt * 6 * v + fase)); y -= b * 12; giro += Math.sin(tt * 6 * v + fase) * 0.16; ey *= 1 + (b < 0.15 ? -0.1 : 0.03); break; }
    case 'respira': ey *= 1 + Math.sin(tt * 2) * 0.02; break;
    case 'mece': giro += Math.sin(tt * 1.3 * v + fase) * 0.06; break;
    case 'gira': giro += tt * 0.25 * v; break;
    case 'brilla': alfa *= 0.55 + 0.45 * Math.sin(tt * 3 * v + fase); { const s = 0.85 + 0.15 * Math.sin(tt * 3 * v + fase); ex *= s; ey *= s; } break;
    case 'late': { const s = 1 + Math.sin(tt * 5 * v) * 0.07; ex *= s; ey *= s; } break;
    case 'deriva': x = ((x + tt * 8 * v) % (ANCHO + 200) + ANCHO + 200) % (ANCHO + 200) - 100; break;
    case 'sube': y -= Math.min(1, tt / (p.lento || 2)) * (p.distancia || 100); break;
    case 'baja': y += Math.min(1, tt / (p.lento || 2)) * (p.distancia || 100); break;
    case 'menea': giro += Math.sin(tt * 9 * v + fase) * 0.08; break;
    case 'orbita': { const r = p.radio || 60; x += Math.cos(tt * v + fase) * r; y += Math.sin(tt * v + fase) * r * 0.4; break; }
    default: break;
  }
  return { x, y, ex: ex * esc, ey: ey * esc, alfa, giro, ruta };
}

// ---------- los efectos que van encima de una pegatina (en su sitio) ----------
function efecto(g, tipo, x, y, tt, k) {
  g.save();
  g.translate(x * k, y * k);
  g.scale(k, k);
  if (tipo === 'vapor') {
    for (let i = 0; i < 3; i++) {
      const f = (tt * 0.6 + i / 3) % 1;
      g.globalAlpha = (1 - f) * 0.7; g.fillStyle = '#FFFFFF';
      g.beginPath(); g.arc(-6 + i * 6 + Math.sin(f * 6 + i) * 4, -70 - f * 40, 4 + f * 6, 0, Math.PI * 2); g.fill();
    }
  } else if (tipo === 'chispas') {
    for (let i = 0; i < 6; i++) {
      const a = i * 1.05 + tt * 1.4, r = 46 + Math.sin(tt * 3 + i) * 10, s = 3 + 2 * Math.sin(tt * 6 + i);
      g.fillStyle = i % 2 ? '#FFF3A0' : '#FFFFFF'; g.globalAlpha = 0.6 + 0.4 * Math.sin(tt * 5 + i);
      const cx = Math.cos(a) * r, cy = -60 + Math.sin(a) * r * 0.7;
      g.fillRect(cx - s / 2, cy - 0.75, s, 1.5); g.fillRect(cx - 0.75, cy - s / 2, 1.5, s);
    }
  } else if (tipo === 'sudor') {
    const f = (tt * 1.2) % 1;
    g.globalAlpha = 1 - f; g.fillStyle = '#9CD8F5';
    g.beginPath(); g.arc(28, -110 + f * 22, 5, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.moveTo(24, -112 + f * 22); g.lineTo(28, -122 + f * 22); g.lineTo(32, -112 + f * 22); g.fill();
  } else if (tipo === 'zzz') {
    g.font = 'bold 18px "Caveat Brush"'; g.fillStyle = '#FFFFFF';
    for (let i = 0; i < 3; i++) { const f = (tt * 0.5 + i / 3) % 1; g.globalAlpha = 1 - f; g.fillText('z', 20 + f * 26, -80 - f * 50); }
  } else if (tipo === 'notas') {
    g.font = 'bold 20px serif'; g.fillStyle = '#0E4A3C';
    for (let i = 0; i < 3; i++) { const f = (tt * 0.6 + i / 3) % 1; g.globalAlpha = 1 - f; g.fillText(i % 2 ? '♪' : '♫', -30 + i * 30 + Math.sin(f * 6) * 8, -90 - f * 60); }
  } else if (tipo === 'ondas') {
    for (let i = 0; i < 3; i++) { const f = (tt * 1.2 + i / 3) % 1; g.globalAlpha = 1 - f; g.strokeStyle = '#FFFFFF'; g.lineWidth = 3; g.beginPath(); g.arc(0, -55, 30 + f * 40, -0.9, 0.9); g.stroke(); g.beginPath(); g.arc(0, -55, 30 + f * 40, Math.PI - 0.9, Math.PI + 0.9); g.stroke(); }
  }
  g.restore();
}
// polvo al aterrizar (las que caen)
function polvo(g, x, y, tt, k) {
  if (tt < 0 || tt > 0.6) return;
  g.save(); g.translate(x * k, y * k); g.scale(k, k);
  g.globalAlpha = 1 - tt / 0.6; g.fillStyle = '#FFFFFF';
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(s * (14 + tt * 60 + i * 9), -4 - i * 3, 6 - i, 0, Math.PI * 2); g.fill(); }
  g.restore();
}

// ---------- el fondo: el cielo (o la pared) con su degradado, el suelo y los efectos grandes ----------
function fondo(g, W, H, k, e, t) {
  const alto = H / k;
  const [a, b] = e.cielo || ['#9CE8D3', '#50DAB6'];
  const grd = g.createLinearGradient(0, 0, 0, H);
  grd.addColorStop(0, a); grd.addColorStop(1, b);
  g.fillStyle = grd; g.fillRect(-W, -H, W * 3, H * 3);
  if (e.suelo) {
    const y0 = (e.suelo.y < 0 ? alto + e.suelo.y : e.suelo.y) * k;
    g.fillStyle = e.suelo.color; g.fillRect(-W, y0, W * 3, H * 2);
    if (e.suelo.borde) { g.fillStyle = e.suelo.borde; g.fillRect(-W, y0, W * 3, 4 * k); }
    if (e.suelo.rayas) { g.fillStyle = e.suelo.rayas; for (let x = -W; x < W * 2; x += 46 * k) g.fillRect(x, y0 + 30 * k, 24 * k, 4 * k); }
  }
  if (e.efectos?.includes('anillos')) {
    g.save(); g.translate(W / 2, H * 0.42);
    for (let i = 0; i < 7; i++) {
      const r = ((t * 50 + i * 50) % 350) * k;
      g.strokeStyle = `rgba(80, 218, 182, ${0.4 * (1 - r / (350 * k))})`;
      g.lineWidth = 10 * k; g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.stroke();
    }
    g.restore();
  }
  if (e.efectos?.includes('rayos')) {
    g.save(); g.translate(W / 2, H * 0.32); g.rotate(t * 0.15);
    g.fillStyle = 'rgba(255, 255, 255, 0.16)';
    for (let i = 0; i < 12; i++) { g.rotate(Math.PI / 6); g.beginPath(); g.moveTo(0, 0); g.lineTo(-30 * k, -H * 1.5); g.lineTo(30 * k, -H * 1.5); g.fill(); }
    g.restore();
  }
}
const confeti = Array.from({ length: 80 }, (_, i) => ({ x: (i * 97) % 360, v: 30 + (i * 13) % 50, c: ['#E7584A', '#F29B2E', '#F4D23C', '#6CBF4A', '#3E8FD6', '#7B5BC2', '#E4679B'][i % 7], f: i }));
function delante(g, W, H, k, e, t) {
  if (!e.efectos?.includes('confeti')) return;
  for (const p of confeti) {
    const y = ((t * p.v + p.f * 37) % (H / k + 40)) - 20, x = p.x + Math.sin(t * 2 + p.f) * 12;
    g.save(); g.translate(x * k, y * k); g.rotate(t * 3 + p.f); g.scale(1, Math.abs(Math.sin(t * 4 + p.f)) + 0.2);
    g.fillStyle = p.c; g.fillRect(-4 * k, -2 * k, 8 * k, 4 * k);
    g.restore();
  }
}
// la cámara de la escena: [[t, x, y, zoom], …] (x, y: el punto del escenario que queda en el centro)
function camara(e, t, alto) {
  const c = e.camara;
  const base = [ANCHO / 2, alto / 2, 1];
  if (!c?.length) return base;
  const y = v => (v < 0 ? alto + v : v);
  if (t <= c[0][0]) return [c[0][1], y(c[0][2]), c[0][3]];
  for (let i = 1; i < c.length; i++) {
    if (t < c[i][0]) {
      const f = curva((t - c[i - 1][0]) / (c[i][0] - c[i - 1][0]));
      return [0, 1, 2].map(j => (j === 1 ? y(c[i - 1][2]) + (y(c[i][2]) - y(c[i - 1][2])) * f : c[i - 1][j + 1] + (c[i][j + 1] - c[i - 1][j + 1]) * f));
    }
  }
  const u = c[c.length - 1];
  return [u[1], y(u[2]), u[3]];
}

let activo = null;
// escenas: [{ cielo, suelo, efectos, camara, decorado: [...], pegatinas: [...], frases: [...], boton }]
// Pegatinas: { src, escala } | { dibujo(g), w, h } | { sprite: 'morty' | 'gengar', escala, anim },
// con x, y (el centro de abajo; y negativa: desde abajo), entra, desde, hasta, retraso, dura, mueve,
// ruta, efecto, polvo…
export async function cuento(escenas, { alAcabar, saltar = true } = {}) {
  const capa = $('#cuento');
  const lienzo = capa.querySelector('canvas');
  const texto = capa.querySelector('.cuento-texto');
  const seguir = capa.querySelector('.cuento-seguir');
  capa.classList.remove('hidden');
  document.body.classList.add('tapado');
  capa.querySelector('.cuento-saltar').classList.toggle('hidden', !saltar);
  const todas = escenas.flatMap(e => [...(e.decorado || []), ...e.pegatinas]);
  const hojas = {};
  await Promise.all([
    ...todas.filter(p => p.src).map(p => carga(p.src).then(i => { p.img = i; })),
    ...[...new Set(todas.filter(p => p.sprite).map(p => p.sprite))].map(id =>
      loadSprite(id, ['Idle', 'Walk', 'Hop', 'Run']).then(s => { hojas[id] = s; }).catch(() => {})),
  ]);
  const g = lienzo.getContext('2d');
  let escena = 0, frase = 0, t0 = performance.now() / 1000;
  let escribe = { texto: '', desde: 0 };
  let iris = null;   // { t0, a } : el círculo que se cierra (y se abre en la escena a)
  const est = { fin: false };
  activo = est;
  const ahora = () => performance.now() / 1000;
  // lo que no cabe en las tres líneas del cuadro va en tandas (por frases y, si hace falta, por palabras)
  let tandas = [''], tanda = 0;
  const cabe = s => { texto.textContent = s; return texto.scrollHeight <= texto.clientHeight + 1; };
  const enTandas = t => {
    if (!t || cabe(t)) return [t];
    const out = [];
    let cur = '';
    for (const trozo of t.split(/(?<=[.!?…»])\s+/).flatMap(f => (cabe(f) ? [f] : f.split(' ')))) {
      const cand = cur ? `${cur} ${trozo}` : trozo;
      if (!cur || cabe(cand)) cur = cand; else { out.push(cur); cur = trozo; }
    }
    if (cur) out.push(cur);
    return out;
  };
  const rotuloSeguir = () => {
    const e = escenas[escena];
    seguir.textContent = tanda < tandas.length - 1 || frase < e.frases.length - 1 || escena < escenas.length - 1 ? '▸' : (e.boton || 'Seguir');
  };
  const ponFrase = () => {
    const e = escenas[escena];
    tandas = enTandas(e.frases[frase] || '');
    tanda = 0;
    texto.textContent = ''; texto.dataset.de = '';
    escribe = { texto: tandas[0], desde: ahora() };
    rotuloSeguir();
    const tt = ahora() - t0;
    for (const p of [...(e.decorado || []), ...e.pegatinas]) {
      if ((p.desde || 0) === frase && p.t0 == null) p.t0 = tt + (p.retraso || 0);
      if (p.hasta != null && p.hasta === frase && p.sale == null) p.sale = tt;
    }
  };
  const empiezaEscena = () => {
    t0 = ahora();
    frase = 0;
    for (const p of [...(escenas[escena].decorado || []), ...escenas[escena].pegatinas]) { p.t0 = null; p.sale = null; }
    // el escenario no entra volando: está, o aparece fundido
    for (const p of escenas[escena].decorado || []) if (p.entra !== 'funde') { p.entra = 'funde'; p.dura = Math.min(p.dura ?? 0.4, 0.4); }
    ponFrase();
  };
  const termina = () => {
    if (est.fin) return;
    est.fin = true;
    capa.classList.add('hidden');
    document.body.classList.remove('tapado');
    capa.onclick = null;
    activo = null;
    alAcabar?.();
  };
  const escrito = () => Math.min(escribe.texto.length, Math.floor((ahora() - escribe.desde) * 38));
  const avanza = () => {
    if (est.fin || iris) return;
    // si el texto aún se está escribiendo, se termina de golpe
    if (escrito() < escribe.texto.length) { escribe.desde = -1e9; return; }
    if (tanda < tandas.length - 1) { tanda++; escribe = { texto: tandas[tanda], desde: ahora() }; rotuloSeguir(); return; }
    const e = escenas[escena];
    if (frase < e.frases.length - 1) { frase++; ponFrase(); return; }
    if (escena < escenas.length - 1) { iris = { t0: ahora(), a: escena + 1 }; return; }
    termina();
  };
  capa.onclick = ev => { if (ev.target.closest('.cuento-saltar')) termina(); else avanza(); };
  empiezaEscena();
  // el decorado es el escenario (sin borde de pegatina ni sombra, y aparece sin más); los personajes, pegatinas
  const pinta = (p, t, alto, k, plano = false) => {
    if (p.t0 == null || t < p.t0) return;
    const tt = t - p.t0;
    let { x, y, ex, ey, alfa, giro, ruta } = posicion(p, t, alto);
    // los dibujos grandes, cuando van de un sitio a otro, andan a saltitos y balanceándose
    if (ruta?.moviendo && !p.sprite) { y -= Math.abs(Math.sin(tt * 9)) * 5; giro += Math.sin(tt * 9) * 0.07; }
    if (alfa <= 0) return;
    let peg;
    if (p.sprite) {
      const hoja = hojas[p.sprite];
      if (!hoja) return;
      const anim = ruta?.moviendo ? (ruta.anim || p.animViaje || 'Walk') : (p.anim || 'Idle');
      const f = fotograma(hoja, anim, tt, p.fila ?? 2);
      peg = pegatinaImagen(f.img, p.escala || 3, f.sx, f.sy, f.w, f.h);
    } else {
      if (plano && p.dibujo) p.sinBorde = true;
      peg = p.img ? pegatinaImagen(p.img, p.escala || 2, 0, 0, p.img.width, p.img.height, plano) : p.dibujo ? pegatinaDibujo(p) : null;
    }
    if (!peg) return;
    const espejo = (p.espejo ? -1 : 1) * (ruta?.moviendo && ruta.haciaIzq ? -1 : 1);
    g.save();
    g.globalAlpha = alfa * (p.opacidad ?? 1);
    g.translate(x * k, y * k);
    g.rotate(giro);
    g.scale(ex * espejo * k / RES, ey * k / RES);
    // por el centro de abajo (los sprites del juego: los pies quedan a un cuarto del alto); las que giran, por el centro
    const L = peg.lienzo;
    const cy = p.mueve === 'gira' ? L.height / 2 : p.sprite ? L.height * 0.78 : L.height;
    g.drawImage(L, -L.width / 2, -cy);
    g.restore();
    if (p.efecto && tt > (p.dura ?? 0.6)) efecto(g, p.efecto, x, y, tt, k);
    if (p.entra === 'cae' && p.polvo !== false) polvo(g, x, y, tt - (p.dura ?? 0.6) * 0.4, k);
  };
  // a 30 fotogramas como mucho: en el móvil va igual de suave y pesa la mitad
  let ultimoPaso = 0;
  const paso = ms => {
    if (est.fin) return;
    requestAnimationFrame(paso);
    if (ms - ultimoPaso < 1000 / 30) return;
    ultimoPaso = ms;
    // como mucho dos píxeles del aparato por punto: va igual de bien y pesa la mitad
    const dpr = Math.min(2, devicePixelRatio || 1);
    const W = Math.round(lienzo.clientWidth * dpr), H = Math.round(lienzo.clientHeight * dpr);
    if (!W || !H) return;
    if (lienzo.width !== W || lienzo.height !== H) { lienzo.width = W; lienzo.height = H; }
    // el círculo: a mitad, cambia de escena
    if (iris && ahora() - iris.t0 >= 0.35 && escena !== iris.a) { escena = iris.a; empiezaEscena(); }
    if (iris && ahora() - iris.t0 >= 0.7) iris = null;
    const k = W / ANCHO, alto = H / k;
    const e = escenas[escena];
    const t = ahora() - t0;
    const [cx, cy, zoom] = camara(e, t, alto);
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.imageSmoothingEnabled = true;
    // la cámara: el punto (cx, cy) en el centro, con su acercamiento
    g.translate(W / 2, H / 2); g.scale(zoom, zoom); g.translate(-cx * k, -cy * k);
    fondo(g, W, H, k, e, t);
    for (const p of e.decorado || []) pinta(p, t, alto, k, true);
    for (const p of e.pegatinas) pinta(p, t, alto, k);
    g.setTransform(1, 0, 0, 1, 0, 0);
    delante(g, W, H, k, e, t);
    // el iris entre escenas
    if (iris) {
      const f = (ahora() - iris.t0) / 0.35;
      const r = (f < 1 ? 1 - f : f - 1) * Math.hypot(W, H) * 0.6;
      g.fillStyle = '#0E4A3C';
      g.beginPath(); g.rect(0, 0, W, H); g.arc(W / 2, H * 0.42, Math.max(0, r), 0, Math.PI * 2, true); g.fill();
    }
    // el texto, letra a letra
    const n = escrito();
    if (texto.textContent.length !== n || texto.dataset.de !== escribe.texto) { texto.textContent = escribe.texto.slice(0, n); texto.dataset.de = escribe.texto; }
  };
  requestAnimationFrame(paso);
}
export const cuentoActivo = () => !!activo;
