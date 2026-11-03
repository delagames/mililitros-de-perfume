// El taller (sección 5 de DISEÑO.md): en la pared, el mapa de olor (de fresco a cálido, de suave a
// intenso) con la gota del perfume y su rastro; en el banco, los doce botes de ingredientes y el
// frasco de 30 ml, que se llena del color del perfume. Un ingrediente se echa arrastrándolo al frasco
// (o al mapa), o tocándolo y pulsando «Echar». Al elegir uno, una línea de puntos dice adónde movería
// la gota. También el estante, con los perfumes embotellados.
// Mundo de 270 de ancho, como las demás vistas, con el banco justo encima del cuadro de diálogo.
import { rect, forma, caja, texto, degradado, halo, cifras } from './pixel.js';
import { toldo } from './mostrador.js';
import { MAX, nuevoPerfume, echa, deshaz, colorDe, ingrediente, caracter, desdePasos } from './perfume.js';

// el mapa crece hasta llenar el hueco entre el toldo y el banco (se calcula al pintar el fondo)
let MAPA = { x: 62, y: 6, lado: 146 };
function geometria(d) {
  const arriba = -d.oy + d.toldo + 16, abajo = 154;
  const lado = Math.max(120, Math.min(232, abajo - arriba));
  // si sobra sitio, encima del mapa va el carácter del perfume en una pastilla
  const sobra = abajo - arriba - lado;
  const y = sobra >= 24 ? abajo - lado - Math.min(14, Math.floor(sobra / 3)) : abajo - lado;
  return { x: Math.round((270 - lado) / 2), y, lado, rotulo: sobra >= 24 };
}
const FRASCO = { x: 214, y: 168, w: 48, h: 58 };
const PARED = '#F4F2EC';
const BANCO = 166;

// lo que pasa en el taller (main.js escucha para el cuadro de diálogo)
const t = {
  perfume: nuevoPerfume(), orden: [], almacen: {}, seleccion: null, arrastre: null, anim: null, P: null,
  oyente: () => {},
  olfato: 0,   // cuántas veces puede oler Gengar todavía hoy (lo pone main.js): si le queda, asoma en el frasco
  gengar: null,   // el Gengar del mostrador en pequeño, para asomar (lo pone main.js)
};
export const taller = t;

export function preparaTaller({ orden, almacen, oyente, pasos = [] }) {
  t.orden = orden; t.almacen = almacen; t.oyente = oyente;
  t.perfume = desdePasos(pasos);
}

function bote(i) {
  const fila = i < 6 ? 0 : 1;
  return { x: 8 + (i % 6) * 33, y: fila ? 200 : 172, w: 22, h: 24 };
}
const dentro = (x, y, r) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
// para el dedo, cada bote se toca en toda su casilla (no solo en la ficha)
const casilla = i => { const b = bote(i); return { x: b.x - 5, y: b.y - 3, w: 33, h: 28 }; };
const enMapa = (x, y) => dentro(x, y, { x: MAPA.x, y: MAPA.y, w: MAPA.lado, h: MAPA.lado });
const aMapa = ([px, py]) => [MAPA.x + MAPA.lado / 2 + px * (MAPA.lado / 2 - 6), MAPA.y + MAPA.lado / 2 - py * (MAPA.lado / 2 - 6)];

// ---------- acciones ----------
export function echar(id) {
  if (!id) return;
  if ((t.almacen[id] ?? 0) <= 0) { t.oyente('sin', id); return; }
  const antes = [...t.perfume.pos];
  if (!echa(t.perfume, id)) { t.oyente('lleno', id); return; }
  t.almacen[id]--;
  t.anim = { desde: antes, hasta: [...t.perfume.pos], t0: performance.now() / 1000 };
  t.oyente('echado', id);
}

export function deshacer() {
  if (!t.perfume.pasos.length) return;
  const quitado = deshaz(t.perfume);
  t.anim = null;
  t.oyente('deshecho', quitado.id);
}

export function nuevo() {
  t.perfume = nuevoPerfume(); t.anim = null; t.seleccion = null;
}

// ---------- toques ----------
function toque(tipo, x, y) {
  if (tipo === 'baja') {
    const i = t.orden.findIndex((id, k) => dentro(x, y, casilla(k)));
    // tocar el frasco (con algo dentro): que lo huela Gengar
    if (i < 0 && dentro(x, y, FRASCO) && t.perfume.pasos.length) { t.oyente('frasco'); return; }
    if (i < 0) return false;
    const id = t.orden[i];
    t.seleccion = id;
    t.arrastre = { id, x, y, x0: x, y0: y, movido: false };
    t.oyente('selecciona', id);
  } else if (tipo === 'mueve' && t.arrastre) {
    Object.assign(t.arrastre, { x, y });
    if (Math.hypot(x - t.arrastre.x0, y - t.arrastre.y0) > 4) t.arrastre.movido = true;
  } else if (tipo === 'sube' && t.arrastre) {
    const a = t.arrastre;
    t.arrastre = null;
    if (a.movido && (dentro(x, y, FRASCO) || enMapa(x, y))) echar(a.id);
  } else return false;
}

// ---------- dibujo ----------
// Estética de pixel art limpio (lo pidió Jorge para el taller y los minijuegos): fondo menta liso con
// una rejilla de puntos, tarjetas blancas con esquinas redondeadas, borde negro y sombra plana,
// sin madera ni tramados. El frasco es el negro de la marca.
const SOMBRA = '#2FB894';
function tarjeta(g, P, x, y, w, h, r = 5) {
  caja(g, x + 2, y + 2, w, h, SOMBRA, null, r);
  caja(g, x, y, w, h, P.blanco, P.negro, r);
}

function fondo(g, P, d) {
  const { W, H, oy } = d;
  MAPA = geometria(d);
  rect(g, 0, 0, W, H, P.menta);
  for (let y = 4; y < H; y += 8) for (let x = (y % 16 ? 4 : 0); x < W; x += 8) rect(g, x, y, 1, 1, '#6BE2C3');
  // arriba, una franja lisa detrás de la barra
  rect(g, 0, 0, W, d.toldo + 4, P.menta_oscura);
  rect(g, 0, d.toldo + 4, W, 1, P.verde_tinta);
  // el mapa de olor, en su tarjeta
  const { x, y, lado } = MAPA;
  const X = d.ox + x, Y = oy + y;
  tarjeta(g, P, X - 5, Y - 5, lado + 10, lado + 10, 6);
  const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const frio = rgb(P.gota_fresco), calor = rgb(P.gota_picante);
  const hex = c => '#' + c.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  forma(g, X, Y, lado, lado, (px, py) => {
    const u = px / (lado - 1), v = py / (lado - 1);
    // esquinas redondeadas
    const ex = Math.max(0, 3 - px, px - (lado - 4)), ey = Math.max(0, 3 - py, py - (lado - 4));
    if (ex * ex + ey * ey > 9) return null;
    let c = frio.map((a, k) => a + (calor[k] - a) * u);
    c = c.map(a => a + (255 - a) * (0.62 + v * 0.22));            // pastel; arriba (intenso) más vivo
    return hex(c);
  });
  // la cruz del centro, fina y continua
  rect(g, X + lado / 2, Y + 3, 1, lado - 6, '#FFFFFF');
  rect(g, X + 3, Y + lado / 2, lado - 6, 1, '#FFFFFF');
  // los ejes, dentro del mapa, en pastillas
  const et = { font: '8px Silkscreen', color: P.verde_tinta, align: 'center' };
  const pastilla = (txt, cx, cy, align = 'center') => {
    const w = txt.length * 6 + 6;
    const x0 = align === 'left' ? cx : align === 'right' ? cx - w : cx - w / 2;
    caja(g, Math.round(x0), cy - 7, w, 10, P.blanco, null, 3);
    texto(g, txt, Math.round(x0 + w / 2), cy + 1, et);
  };
  pastilla('INTENSO', X + lado / 2, Y + 10);
  pastilla('SUAVE', X + lado / 2, Y + lado - 5);
  pastilla('FRESCO', X + 4, Y + lado / 2 + 13, 'left');
  pastilla('CÁLIDO', X + lado - 4, Y + lado / 2 + 13, 'right');
  // la bandeja de ingredientes y el frasco, abajo
  tarjeta(g, P, d.ox + 3, oy + BANCO - 2, 200, 80, 6);
  tarjeta(g, P, d.ox + FRASCO.x - 6, oy + BANCO - 2, FRASCO.w + 10, 80, 6);
}

// un ingrediente de la bandeja: una ficha redondeada con su gota de color y cuántos quedan
function pintaBote(g, P, x, y, color, cuantos, elegido, vacio) {
  caja(g, x - 1, y + 1, 24, 24, elegido ? P.verde_tinta : '#D8EFE8', null, 4);
  caja(g, x - 1, y - 1, 24, 24, vacio ? '#EEF1F0' : '#F4FBF8', elegido ? P.verde_tinta : '#BFD9D1', 4);
  if (elegido) caja(g, x, y, 22, 22, null, P.menta_oscura, 3);
  if (!vacio) {
    forma(g, x + 5, y + 3, 12, 15, (px, py) => {
      const dx = px - 5.5, dy = py - 9;
      if (py >= 9) return dx * dx + dy * dy <= 30 ? color : null;
      return Math.abs(dx) <= py * 0.62 ? color : null;
    }, P.negro);
    rect(g, x + 8, y + 11, 2, 2, '#FFFFFF');
  }
  caja(g, x + 13, y + 15, 12, 9, vacio ? P.gota_picante : P.negro, null, 3);
  cifras(g, String(cuantos), x + 19, y + 17, { color: P.blanco, align: 'center' });
}

// Lo que se repite en cada fotograma (botes, gota, frasco, rótulo) se pinta una vez en un lienzo
// aparte y luego solo se copia: pintar píxel a píxel a 12 fps hacía ir lento el taller en el móvil
const lienzos = new Map();
function cacheado(clave, w, h, pinta) {
  let c = lienzos.get(clave);
  if (!c) {
    if (lienzos.size > 300) lienzos.clear();
    c = document.createElement('canvas');
    c.width = w; c.height = h;
    pinta(c.getContext('2d', { willReadFrequently: true }));
    lienzos.set(clave, c);
  }
  return c;
}
function bote2(g, P, x, y, color, cuantos, elegido, vacio) {
  g.drawImage(cacheado(`b${color}${cuantos}${elegido}${vacio}`, 28, 28, c => pintaBote(c, P, 2, 2, color, cuantos, elegido, vacio)), x - 2, y - 2);
}

function colorIng(P, id) {
  const c = ingrediente(id)?.color || '#cccccc';
  return c.startsWith('#') ? c : P[c];
}

function pintaTaller(g, tiempo, { P }, d) {
  t.P = P;
  g.translate(d.ox, d.oy);
  const p = t.perfume;
  // rastro de la gota: puntos entre una posición y la siguiente
  const puntos = p.rastro.map(aMapa);
  for (let k = 1; k < puntos.length; k++) {
    const [x0, y0] = puntos[k - 1], [x1, y1] = puntos[k];
    const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / 3));
    for (let s = 0; s <= n; s++) rect(g, Math.round(x0 + (x1 - x0) * s / n), Math.round(y0 + (y1 - y0) * s / n), 1, 1, P.verde_tinta);
  }
  // adónde iría con el ingrediente elegido (los que se van de lado al azar, sin flecha)
  const ing = t.seleccion && ingrediente(t.seleccion);
  if (ing && !ing.inestable && !ing.base && p.pasos.length < MAX) {
    const prueba = JSON.parse(JSON.stringify(p));
    echa(prueba, t.seleccion);
    const [x0, y0] = aMapa(p.pos), [x1, y1] = aMapa(prueba.pos);
    const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / 4));
    const parpadeo = Math.floor(tiempo * 4) % 2;
    for (let s = parpadeo; s <= n; s += 2) rect(g, Math.round(x0 + (x1 - x0) * s / n) - 1, Math.round(y0 + (y1 - y0) * s / n) - 1, 2, 2, colorIng(P, t.seleccion));
  }
  // la gota (se desliza al echar)
  let pos = p.pos;
  if (t.anim) {
    const f = Math.min(1, (tiempo - t.anim.t0) / 0.45), e = 1 - (1 - f) ** 3;
    pos = t.anim.desde.map((v, k) => v + (t.anim.hasta[k] - v) * e);
    if (f >= 1) t.anim = null;
  }
  const [gx, gy] = aMapa(pos);
  const color = colorDe(p, P);
  // la gota, con la punta hacia arriba, el centro en su sitio del mapa y un brillo
  g.drawImage(cacheado(`g${color}`, 15, 19, c => {
    forma(c, 0, 0, 15, 19, (x, y) => {
      const dx = x - 7, dy = y - 11;
      if (y >= 11) return dx * dx + dy * dy <= 49 ? color : null;
      return Math.abs(dx) <= y * 0.7 ? color : null;
    }, P.negro);
    rect(c, 4, 10, 2, 3, '#FFFFFF');
  }), Math.round(gx) - 7, Math.round(gy) - 12);
  // el carácter del perfume, en una pastilla encima del mapa
  if (MAPA.rotulo) {
    const txt = (p.pasos.length ? caracter(p) : 'Frasco vacío').toUpperCase();
    const w = txt.length * 6 + 18, cx = MAPA.x + MAPA.lado / 2, cy = MAPA.y - 22;
    g.drawImage(cacheado(`r${txt}${color}`, w + 2, 18, c => {
      caja(c, 2, 2, w, 16, '#2FB894', null, 5);
      caja(c, 0, 0, w, 16, P.blanco, P.negro, 5);
      caja(c, 5, 6, 4, 4, color, null, 1);
      texto(c, txt, w / 2 + 3, 12, { font: '8px Silkscreen', color: P.verde_tinta, align: 'center' });
    }), Math.round(cx - w / 2), cy - 9);
  }
  // los botes
  t.orden.forEach((id, k) => {
    const b = bote(k);
    if (t.arrastre?.id === id && t.arrastre.movido) return;
    const n = t.almacen[id] ?? 0;
    bote2(g, P, b.x, b.y, colorIng(P, id), n, t.seleccion === id, n <= 0);
  });
  // el frasco de 30 ml (el negro de la marca, con ventana), con lo que lleva y cuánto va
  const { x, y, w, h } = FRASCO;
  const lleno = Math.round((h - 28) * p.pasos.length / MAX);
  g.drawImage(cacheado(`f${color}${p.pasos.length}/${MAX}`, w, h + 6, c => {
    caja(c, 16, 0, 16, 7, P.negro, null, 2);
    rect(c, 20, 7, 8, 5, P.negro);
    caja(c, 2, 11, w - 4, h - 16, P.negro, null, 8);
    caja(c, 7, 16, w - 14, h - 26, '#E8F4F0', null, 5);
    if (lleno) caja(c, 7, h - 10 - lleno, w - 14, lleno, color, null, 4);
    rect(c, 9, 19, 2, 8, '#FFFFFF');
    caja(c, w / 2 - 11, h - 4, 22, 10, P.menta_oscura, null, 4);
    cifras(c, `${p.pasos.length}/${MAX}`, w / 2, h - 1, { color: P.blanco, align: 'center' });
    if (MAX > 6) { caja(c, 9, 30, 16, 9, P.blanco, null, 2); cifras(c, MAX > 8 ? '100' : '50', 17, 32, { color: P.negro, align: 'center' }); }   // (la medida del frasco)
  }), x, y - 2);
  // Gengar, asomando por la esquina del frasco mientras le quede olfato: «tócalo y lo huelo»
  if (t.olfato > 0 && p.pasos.length && t.gengar) {
    const sube = Math.floor(tiempo * 2) % 2, m = t.gengar;
    // sentado encima de la tarjeta del frasco, en su esquina de la derecha: cerca del bote, sin taparlo
    const gx = x + w - m.width + 8, gy = BANCO - 2 - m.height + 1 - sube;
    g.drawImage(m, gx, gy);
    if (t.olfato > 1) cifras(g, '2', gx - 5, gy + 4, { color: P.verde_tinta });   // (con la cafetera, dos)
  } else if (t.olfato > 0 && p.pasos.length) {
    const sube = Math.floor(tiempo * 2) % 2, gx = x + w - 16, gy = y - 10 - sube;
    caja(g, gx, gy, 18, 15, '#7B5BC2', P.negro, 5);
    rect(g, gx + 2, gy - 2, 2, 3, '#7B5BC2'); rect(g, gx + 14, gy - 2, 2, 3, '#7B5BC2');      // las orejas
    rect(g, gx + 2, gy - 3, 2, 1, P.negro); rect(g, gx + 14, gy - 3, 2, 1, P.negro);
    rect(g, gx + 4, gy + 4, 3, 2, '#E7584A'); rect(g, gx + 11, gy + 4, 3, 2, '#E7584A');      // los ojos
    rect(g, gx + 4, gy + 9, 10, 2, P.blanco);                                                   // la sonrisa
    rect(g, gx + 6, gy + 9, 1, 2, P.negro); rect(g, gx + 9, gy + 9, 1, 2, P.negro); rect(g, gx + 12, gy + 9, 1, 2, P.negro);
    if (t.olfato > 1) cifras(g, '2', gx + 20, gy + 1, { color: P.verde_tinta });              // (con la cafetera, dos)
  }
  // el bote que se arrastra, con el dedo
  if (t.arrastre?.movido) {
    const id = t.arrastre.id;
    bote2(g, P, Math.round(t.arrastre.x - 11), Math.round(t.arrastre.y - 14), colorIng(P, id), t.almacen[id] ?? 0, true, false);
  }
}

export const TALLER = {
  suelo: 236,
  capas: [
    { fija: (g, { P }, d) => fondo(g, P, d) },
    { anima: pintaTaller },
  ],
  toque,
};

// ---------- el estante: los perfumes embotellados ----------
let estante = [];
export function ponEstante(lista) { estante = lista; }

// El mueble de la tienda (negro, con tiras de luz menta bajo cada balda) hasta el toldo; los
// perfumes, siete por balda, el más nuevo arriba a la izquierda. Los huecos, con el sitio marcado.
function pintaEstante(g, { P }, d) {
  const { W, H, oy } = d;
  rect(g, 0, 0, W, H, PARED);
  degradado(g, 0, 0, W, 50, '#E1E6E3', PARED);
  g.translate(d.ox, oy);
  // el suelo de baldosas
  rect(g, -d.ox, 236, W, H, '#E9EDEA');
  for (let x = -d.ox - 8; x < W; x += 30) rect(g, x, 236, 1, H, '#C3CEC9');
  for (let y = 250; y < H - oy; y += 16) rect(g, -d.ox, y, W, 1, '#C3CEC9');
  const baldas = [228];
  while (baldas.length < 5 && baldas.at(-1) - 46 >= -oy + d.toldo + 22) baldas.push(baldas.at(-1) - 46);
  const arriba = baldas.at(-1) - 6;
  // el rótulo, en medio de la pared que queda encima del mueble
  const yr = Math.round((arriba - 4 + (-oy + d.toldo)) / 2) + 8;
  if (yr < arriba - 14) {
    texto(g, 'Hechos por Morty', 136, yr + 1, { font: '20px "Caveat Brush"', color: '#CCD5D1', align: 'center' });
    texto(g, 'Hechos por Morty', 135, yr, { font: '20px "Caveat Brush"', color: P.negro, align: 'center' });
  }
  rect(g, 18, arriba + 3, 240, 236 - arriba, '#CCD5D1');                 // sombra en la pared
  rect(g, 15, arriba, 240, 236 - arriba, '#2B3331');
  for (const x of [12, 252]) { rect(g, x, arriba, 6, 236 - arriba, P.negro); rect(g, x + 1, arriba + 1, 1, 234 - arriba, '#2A2A2A'); }
  rect(g, 12, arriba - 4, 246, 5, P.negro);
  rect(g, 12, arriba - 4, 246, 1, '#333');
  for (const y of baldas) {
    rect(g, 12, y, 246, 4, P.negro);
    rect(g, 12, y, 246, 1, '#333');
    rect(g, 18, y + 4, 234, 1, '#B8F0E0');                                // tira de luz bajo la balda
    halo(g, 135, y + 16, 118, 14, '#3D4845', 1);
  }
  // de arriba abajo: la balda más alta tiene los más nuevos
  const filas = [...baldas].reverse().slice(1).concat(baldas[0]);
  const visibles = estante.slice(-filas.length * 7).reverse();
  filas.forEach((by, f) => {
    for (let k = 0; k < 7; k++) {
      const x = 24 + k * 33, perf = visibles[f * 7 + k];
      if (!perf) { rect(g, x + 2, by - 1, 18, 1, '#3D4845'); continue; }
      rect(g, x + 7, by - 32, 8, 5, P.madera_oscura);
      rect(g, x + 8, by - 27, 6, 3, '#E8F4F0');
      caja(g, x, by - 24, 22, 24, '#E8F4F0', P.negro, 4);
      caja(g, x + 3, by - 15, 16, 13, perf.color, null, 2);
      rect(g, x + 4, by - 20, 1, 6, '#FFFFFF');
      caja(g, x + 4, by - 10, 14, 8, P.blanco, null, 0);
      cifras(g, String(perf.numero), x + 11, by - 8, { color: P.negro, align: 'center' });
    }
  });
  g.setTransform(1, 0, 0, 1, 0, 0);
  toldo(g, P, 0, 0, W, P.menta, P.menta_oscura, 10, d.toldo);
}

export const ESTANTE = { suelo: 236, capas: [{ fija: pintaEstante }] };
