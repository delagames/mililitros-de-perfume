// Los fondos de pantalla del final (lo pidió Jorge): cuatro momentos del juego para descargar cuando se
// ha visto el epílogo. Se pintan con las mismas vistas del juego (la tienda, la calle) y el salón de Morty viendo al Málaga, a sangre
// y sin suavizar, como las fotos de El Pino pero al doble de tamaño: cada píxel de dibujo, un cuadrado
// de 6 (móvil) u 8 (ordenador) píxeles de la foto.
// - móvil, en vertical: 270×585 de dibujo (la escena entera de ancho) → 1620×3510;
// - ordenador, en horizontal: 480×270 de dibujo → 3840×2160 (4K). La calle mide 270 de ancho: a los
//   lados se ve la tienda por dentro, en penumbra, con sus estanterías de frascos.
// Abajo, una firma pequeña en una esquina, en la misma letra pixelada. Lo que sobra arriba lo rellena la vista (cielo, estantería…),
// así que en el móvil el reloj cae sobre el toldo y los iconos de abajo sobre el suelo.
import { CALLE } from './calle.js';
import { MOSTRADOR, GOTAS, frascoMuestra, sombraDe } from './mostrador.js';
import { rect, caja, forma, degradado, halo, texto, umbralBayer } from './pixel.js';
import { calle } from './perros.js';
import { ANCHO } from './escena.js';

const MEDIDAS = { movil: { w: 270, h: 585, k: 6, bajo: 44 }, ordenador: { w: 480, h: 270, k: 8, bajo: 12 } };

// Una vista entera en un lienzo de W×H píxeles de dibujo, en el instante t (segundos), con su suelo a
// «bajo» píxeles del borde de abajo y el punto «centro» del mundo en medio (si no cabe entero)
function pintaVista(vista, ctx, W, H, t, bajo, centro = ANCHO / 2) {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.imageSmoothingEnabled = false;   // (lo que se dibuja agrandado, como la cara del cristal, sin emborronar)
  const ox = W >= ANCHO ? Math.floor((W - ANCHO) / 2) : Math.round(W / 2 - centro), oy = H - bajo - vista.suelo;
  const d = { W, H, S: 1, ox, oy, toldo: 10, izq: -ox, der: W - ox };
  for (const capa of vista.capas) {
    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    if (capa.fija) capa.fija(g, ctx, d); else capa.anima(g, t, ctx, d);
    g.restore();
  }
  return c;
}

// La calle, en el de ordenador, es más estrecha que la foto: a los lados del escaparate, la tienda por
// dentro, en penumbra, con dos estanterías de frascos (los colores de las muestras) y una planta
function conLados(c, { P }, H, bajo) {
  const W = c.width, ox = Math.floor((W - ANCHO) / 2);
  if (ox < 24) return c;
  const g = c.getContext('2d');
  const peana = H - bajo - CALLE.suelo + 228;          // (donde empieza la peana del escaparate)
  for (const lado of [-1, 1]) {
    const x0 = lado < 0 ? 0 : ox + ANCHO, w = ox;
    // dos baldas con frascos
    for (const [k, y] of [[0, peana - 120], [1, peana - 70]]) {
      const bx = x0 + 10, bw = w - 20;
      rect(g, bx, y, bw, 3, '#5A4A3E'); rect(g, bx, y + 3, bw, 1, '#2A221C');
      for (let x = bx + 4, i = k * 3 + (lado > 0 ? 2 : 0); x < bx + bw - 10; x += 13, i++) {
        const col = P[GOTAS[i % GOTAS.length]];
        frascoMuestra(g, P, x, y, col, sombraDe(col));
      }
    }
    // una planta en su maceta, en el suelo, junto al escaparate
    const px = lado < 0 ? x0 + w - 30 : x0 + 12;
    caja(g, px, peana - 18, 16, 18, '#B5652E', '#0A0A0A', 1);
    forma(g, px - 6, peana - 44, 28, 28, (x, y) => (((x - 14) / 14) ** 2 + ((y - 14) / 13) ** 2 <= 1 ? ((x * 3 + y) % 5 ? '#4E9A36' : '#7CC95A') : null), '#0A0A0A');
    // la penumbra, más oscura cuanto más lejos del cristal
    for (let i = 0; i < w; i += 2) {
      const lejos = lado < 0 ? 1 - i / w : i / w;
      g.fillStyle = `rgba(20, 26, 30, ${0.18 + lejos * 0.42})`;
      g.fillRect(x0 + i, 0, 2, peana);
    }
  }
  return c;
}

// Los perros de la calle se pintan según su estado (quién sale, si bailan…): se pone el del momento y
// luego se deja como estaba
function conCalle(cambios, pinta) {
  const antes = { ...calle, hoy: { ...calle.hoy } };
  Object.assign(calle, { repartidor: -1, baile: -1, solo: null, cristal: null, cristalPrimero: false }, cambios);
  if (cambios.cristal) calle.cristal = { ...cambios.cristal };
  try { return pinta(); } finally { Object.assign(calle, antes); }
}

// Morty viendo al Málaga, de noche, en el salón: la tele en primer plano, de espaldas, alumbrándoles
// (Morty mira a la tele, o sea, a nosotros); Gengar en el sofá, la bufanda en la pared y ¡gol!
// Con detalle: papel pintado, rodapié, cortinas, alfombra, cojines, papelillos del gol y, en el de
// ordenador (que tiene sitio a los lados), una lámpara de pie y una balda con un trofeo y frascos.
function salon({ img }, W, H, bajo) {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.imageSmoothingEnabled = false;
  const cx = Math.round(W / 2), suelo = H - bajo - 26, ancho = W > H;
  const N = '#0A0A0A';
  // la pared, con papel pintado: rayas de puntos y un rombo pequeño entre raya y raya
  degradado(g, 0, 0, W, suelo, '#101C30', '#1C3446');
  for (let x = 4; x < W; x += 12) {
    for (let y = 0; y < suelo; y += 4) rect(g, x, y, 1, 1, '#22395A');
    for (let y = 8; y < suelo - 8; y += 16) { rect(g, x + 6, y, 1, 1, '#2A4468'); rect(g, x + 5, y + 1, 3, 1, '#2A4468'); rect(g, x + 6, y + 2, 1, 1, '#2A4468'); }
  }
  // el rodapié
  rect(g, 0, suelo - 6, W, 6, '#3A2618'); rect(g, 0, suelo - 6, W, 1, '#5E4030'); rect(g, 0, suelo - 1, W, 1, '#22160E');
  // el suelo de madera, con las juntas y un brillo en cada tabla
  rect(g, 0, suelo, W, H - suelo, '#5A3A26');
  for (let y = suelo + 6, k = 0; y < H; y += 7, k++) {
    rect(g, 0, y, W, 1, '#4A2E1E');
    for (let x = (k % 2) * 23; x < W; x += 46) { rect(g, x, y - 6, 1, 6, '#4A2E1E'); rect(g, x + 4, y - 5, 10, 1, '#6A4630'); }
  }
  // la ventana, con la noche, la luna, estrellas, el alféizar y las cortinas recogidas
  const vx = cx - 82, vy = suelo - 186;
  caja(g, vx - 2, vy - 2, 48, 60, N, null, 0);
  degradado(g, vx, vy, 44, 56, '#081226', '#14284A');
  for (const [x, y] of [[6, 8], [30, 14], [14, 30], [36, 40], [8, 48], [40, 4], [18, 18]]) rect(g, vx + x, vy + y, 1, 1, '#FFF3C4');
  rect(g, vx + 4, vy + 40, 1, 1, '#9FB8FF'); rect(g, vx + 26, vy + 50, 1, 1, '#9FB8FF');
  halo(g, vx + 30, vy + 12, 12, 10, '#2A3E66', 0.5);
  forma(g, vx + 24, vy + 6, 12, 12, (x, y) => ((x - 6) ** 2 + (y - 6) ** 2 <= 30 && (x - 9) ** 2 + (y - 4) ** 2 > 22 ? '#FFF3C4' : null));
  rect(g, vx + 21, vy, 2, 56, N); rect(g, vx, vy + 27, 44, 2, N);
  rect(g, vx - 5, vy + 56, 54, 3, '#3A2618'); rect(g, vx - 5, vy + 56, 54, 1, '#5E4030');
  for (const lado of [-1, 1]) {
    const x0 = lado < 0 ? vx - 12 : vx + 44;
    forma(g, x0, vy - 6, 12, 66, (x, y) => {
      const anchoHasta = y < 30 ? 12 : y < 36 ? 6 : 6 + (y - 36) * 0.2;
      const dx = lado < 0 ? x : 11 - x;
      if (dx >= anchoHasta) return null;
      if (y > 30 && y < 36) return '#C9A227';                              // (la cinta que la recoge)
      return (dx + (y >> 3)) % 4 === 0 ? '#2A1C3A' : dx < 2 ? '#5A4078' : '#463060';
    }, N);
  }
  rect(g, vx - 14, vy - 8, 72, 2, '#8E8E8E');                              // la barra de la cortina
  // la bufanda del Málaga, colgada en la pared con dos chinchetas, con sus flecos
  const bw = 96, bx = cx - 20, by = suelo - 168;
  for (let k = 0; k < bw; k += 8) { rect(g, bx + k, by, 8, 12, (k / 8) % 2 ? '#1F5FA8' : '#F4F4F4'); rect(g, bx + k, by + 10, 8, 2, (k / 8) % 2 ? '#174A84' : '#D6D6D6'); }
  rect(g, bx, by - 1, bw, 1, N); rect(g, bx, by + 12, bw, 1, N);
  for (let k = 0; k < 6; k++) { rect(g, bx + k * 2, by + 13, 1, 5, '#F4F4F4'); rect(g, bx + bw - 12 + k * 2, by + 13, 1, 5, '#1F5FA8'); }
  rect(g, bx + 10, by - 3, 2, 2, '#E7584A'); rect(g, bx + bw - 12, by - 3, 2, 2, '#E7584A');
  // el escudo del Málaga, enmarcado, bajo la bufanda
  if (img.escudo) {
    caja(g, cx + 28, suelo - 146, img.escudo.width + 8, img.escudo.height + 8, '#3A2A1E', N, 0);
    rect(g, cx + 29, suelo - 145, img.escudo.width + 6, 1, '#5E4030');
    g.drawImage(img.escudo, cx + 32, suelo - 142);
  }
  // la balda: un trofeo, frascos de la tienda, una planta y unos libros (en el de ordenador, a la
  // derecha; en el del móvil, arriba, sobre el «¡gol!»)
  {
    const sx = ancho ? cx + 120 : cx - 35, sy = ancho ? suelo - 120 : suelo - 290;
    for (const y of [sy, sy + 40]) { rect(g, sx, y, 70, 3, '#5E4030'); rect(g, sx, y + 3, 70, 1, '#22160E'); rect(g, sx + 6, y + 4, 2, 4, '#3A2618'); rect(g, sx + 62, y + 4, 2, 4, '#3A2618'); }
    forma(g, sx + 6, sy - 20, 14, 20, (x, y) => {
      if (y < 9) return Math.abs(x - 6.5) <= 6 - y * 0.3 ? (x < 5 ? '#FFE48A' : '#E2B530') : null;   // la copa
      if (y < 14) return Math.abs(x - 6.5) <= 1 ? '#C9A227' : null;                                  // el pie
      return Math.abs(x - 6.5) <= 4 ? '#5E4030' : null;                                             // la peana
    }, N);
    [['#E7584A', 30], ['#F4D23C', 40], ['#50DAB6', 50]].forEach(([col, x]) => {
      caja(g, sx + x, sy - 12, 7, 12, col, N, 2); rect(g, sx + x + 2, sy - 15, 3, 3, N); rect(g, sx + x + 1, sy - 9, 1, 4, '#FFFFFF');
    });
    caja(g, sx + 12, sy + 28, 12, 12, '#B5652E', N, 1);
    forma(g, sx + 6, sy + 12, 24, 17, (x, y) => (((x - 12) / 12) ** 2 + ((y - 9) / 8) ** 2 <= 1 ? ((x * 3 + y) % 5 ? '#4E9A36' : '#7CC95A') : null), N);
    let lx0 = sx + 34;
    for (const [col, w] of [['#7A2632', 10], ['#1F5FA8', 6], ['#C9A227', 8], ['#3E8F7A', 7]]) { const alto = w > 8 ? 16 : 14; caja(g, lx0, sy + 40 - alto, w, alto, col, N, 0); lx0 += w + 1; }
  }
  if (!ancho) {
    // la lámpara de techo, colgando, con su luz cálida
    const lx = cx + 70, ly = suelo - 340;
    rect(g, lx, 0, 1, ly, '#2E2E2E');
    halo(g, lx, ly + 14, 40, 34, '#3A3A40', 0.55);
    forma(g, lx - 14, ly, 29, 14, (x, y) => (Math.abs(x - 14) <= 5 + y * 0.7 ? (y > 11 ? '#FFE9B0' : x < 11 ? '#F2D79A' : '#D9B676') : null), N);
    rect(g, lx - 2, ly + 14, 5, 2, '#FFF3C4');
  }
  if (ancho) {
    // la lámpara de pie de la izquierda, con su luz cálida
    const lx = cx - 150;
    halo(g, lx, suelo - 110, 46, 60, '#4A3A30', 0.55);
    rect(g, lx - 1, suelo - 100, 2, 100, '#2E2E2E');
    caja(g, lx - 8, suelo - 3, 16, 4, '#2E2E2E', N, 1);
    forma(g, lx - 12, suelo - 124, 24, 22, (x, y) => (Math.abs(x - 11.5) <= 6 + y * 0.28 ? (y > 18 ? '#FFE9B0' : x < 9 ? '#F2D79A' : '#D9B676') : null), N);
  }
  // la penumbra de la habitación y, en la pared y el suelo, el resplandor azul de la tele (a ellos les da de lleno)
  g.fillStyle = 'rgba(8, 14, 30, 0.34)'; g.fillRect(0, 0, W, H);
  halo(g, cx, H - bajo + 6, Math.max(120, W * 0.42), 150, '#2C5A70', 0.6);
  halo(g, cx, H - bajo + 6, Math.max(70, W * 0.24), 90, '#3C7A92', 0.4);
  // la alfombra, delante del sofá
  const aw = Math.min(W - 16, 220);
  forma(g, Math.round(cx - aw / 2), suelo + 4, aw, 20, (x, y) => {
    const d = ((x - aw / 2 + 0.5) / (aw / 2)) ** 2 + ((y - 9.5) / 10) ** 2;
    if (d > 1) return null;
    return d > 0.72 ? '#C9A227' : d > 0.6 ? '#5A1E28' : (x + y * 3) % 9 === 0 ? '#9A3A46' : '#7A2632';
  });
  // el sofá, con sus cojines (uno del Málaga), las costuras y el brillo de los bordes
  const sw = 150, sx = cx - sw / 2 + 10, sy = suelo - 44;
  caja(g, sx, sy - 6, sw, 36, '#7A2632', N, 3);                              // respaldo
  for (let k = 1; k < 3; k++) rect(g, sx + Math.round(sw * k / 3), sy - 4, 1, 24, '#5E1C26');
  caja(g, sx + 6, sy + 22, sw - 12, 22, '#A33A47', N, 2);                    // asiento
  rect(g, sx + 8, sy + 23, sw - 16, 1, '#C25664');
  rect(g, sx + Math.round(sw / 2), sy + 24, 1, 18, '#7A2632');
  caja(g, sx - 8, sy + 10, 18, 36, '#8E2F3A', N, 3);                         // brazos
  caja(g, sx + sw - 10, sy + 10, 18, 36, '#8E2F3A', N, 3);
  rect(g, sx - 6, sy + 12, 14, 1, '#B04452'); rect(g, sx + sw - 8, sy + 12, 14, 1, '#B04452');
  caja(g, sx + 10, sy + 2, 24, 18, '#1F5FA8', N, 4);
  for (let k = 0; k < 24; k += 6) rect(g, sx + 11 + k, sy + 3, 3, 16, '#F4F4F4');
  caja(g, sx + 36, sy + 4, 20, 16, '#C9A227', N, 4);
  rect(g, sx + 38, sy + 6, 4, 1, '#FFE48A');
  rect(g, sx + 8, sy + 46, 4, 6, '#2E1C12'); rect(g, sx + sw - 12, sy + 46, 4, 6, '#2E1C12');
  // Gengar, sentado en el sofá; Morty, de pie delante, con su frasco en alto
  if (img.gengarMostrador) g.drawImage(img.gengarMostrador, sx + sw - 88, sy - 30);
  if (img.morty) g.drawImage(img.morty, cx - 70, suelo + 8 - img.morty.height);
  // en el suelo: una lata, otra tumbada y un cuenco de pipas
  caja(g, cx + 46, suelo + 2, 7, 11, '#C9A227', N, 1); rect(g, cx + 47, suelo + 5, 5, 3, '#C0392B'); rect(g, cx + 47, suelo + 3, 2, 1, '#FFF3C4');
  caja(g, cx + 56, suelo + 9, 11, 6, '#C9A227', N, 1); rect(g, cx + 59, suelo + 10, 3, 4, '#C0392B');
  forma(g, cx + 70, suelo + 4, 18, 9, (x, y) => {
    if (y < 3) return ((x - 8.5) / 8.5) ** 2 + ((y - 3) / 3) ** 2 <= 1 ? ((x + y) % 3 ? '#E8D9A8' : '#3A2A1E') : null;   // las pipas
    return Math.abs(x - 8.5) <= 8.5 - (y - 3) * 0.7 ? '#E7584A' : null;                                                 // el cuenco
  }, N);
  // ¡gol!, con papelillos blancos y azules alrededor (en el de ordenador, a la derecha de la bufanda)
  const [gx, gy] = ancho ? [cx + 140, suelo - 150] : [cx, suelo - 216];
  let s = 11;
  const azar = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let k = 0; k < 46; k++) {
    const px = Math.round(gx + (azar() - 0.5) * 150), py = Math.round(gy - 34 + azar() * 70);
    if (Math.abs(px - gx) < 56 && py > gy - 28 && py < gy + 6) continue;   // (sin tapar las letras)
    const col = ['#F4F4F4', '#1F5FA8', '#6FA8E8', '#F4D23C'][k % 4];
    if (k % 3) rect(g, px, py, 2, 1, col); else rect(g, px, py, 1, 2, col);
  }
  texto(g, '¡GOOOL!', gx + 2, gy + 2, { font: 'bold 32px "Pixelify Sans"', color: '#0E2A4A', align: 'center' });
  texto(g, '¡GOOOL!', gx, gy, { font: 'bold 32px "Pixelify Sans"', color: '#FFFFFF', align: 'center' });
  // la tele, de espaldas, en primer plano, con el filo de la pantalla brillando y su rejilla
  const tw = Math.min(W - 20, 170);
  caja(g, cx - tw / 2, H - bajo + 2, tw, bajo + 10, '#15181C', N, 3);
  rect(g, cx - tw / 2 + 3, H - bajo + 3, tw - 6, 1, '#9FE8FF');
  rect(g, cx - tw / 2 + 3, H - bajo + 4, tw - 6, 1, '#3C7A92');
  for (let x = cx - 40; x < cx + 40; x += 4) rect(g, x, H - bajo + 9, 2, 1, '#22262A');
  rect(g, cx - 14, H - bajo + 14, 28, 6, '#22262A');
  return c;
}

// El plató de «Cenas Encantadas», el programa de Morty en Johto: la mesa del bar encantado con su sopa y
// su vela, farolillos, Morty detrás y Gengar asomando por debajo del mantel; el título y «en directo».
// Con detalle: el telón a los lados, el foco que cae sobre la mesa, chispitas mágicas, la tarima con su
// brillo y, en el de ordenador, la cámara de la tele y un público de sombras.
function plato({ img }, W, H, bajo) {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.imageSmoothingEnabled = false;
  const cx = Math.round(W / 2), suelo = H - bajo - 20, ancho = W > H;
  const N = '#0A0A0A';
  degradado(g, 0, 0, W, suelo, '#140C22', '#3A2350');
  // chispitas mágicas, en el fondo
  let s = 7;
  const azar = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let k = 0; k < (ancho ? 70 : 50); k++) {
    const x = Math.round(azar() * W), y = Math.round(azar() * (suelo - 20));
    if (k % 5 === 0) { rect(g, x, y - 1, 1, 3, '#E8D7FF'); rect(g, x - 1, y, 3, 1, '#E8D7FF'); } else rect(g, x, y, 1, 1, k % 2 ? '#8E6AB8' : '#C9B2F0');
  }
  // la tarima, con sus tablas
  rect(g, 0, suelo, W, H - suelo, '#2A1E2E');
  for (let y = suelo + 6; y < H; y += 7) rect(g, 0, y, W, 1, '#221826');
  for (let y = suelo + 6, k = 0; y < H; y += 7, k++) for (let x = (k % 2) * 30; x < W; x += 60) rect(g, x, y - 6, 1, 6, '#221826');
  rect(g, 0, suelo, W, 2, '#4A3456');
  // el foco que cae sobre la mesa (un cono tramado) y su luz en la tarima
  forma(g, cx - 90, 0, 180, suelo + 12, (x, y) => {
    const medio = 90 * (0.25 + 0.75 * (y / (suelo + 12)));
    const d = Math.abs(x - 89.5) / medio;
    return d < 1 && umbralBayer(x + cx - 90, y) < (1 - d) * 0.32 ? '#6A4E88' : null;
  });
  halo(g, cx, suelo + 6, 110, 12, '#5A4470', 0.7);
  // los farolillos, colgando, con su brillo
  for (let k = 0; k < 9; k++) {
    const x = Math.round(W * (k + 0.5) / 9), y = 22 + (k % 2) * 10;
    rect(g, x, 0, 1, y, N);
    halo(g, x, y + 8, 16, 14, '#5A3A6A', 0.6);
    caja(g, x - 5, y, 11, 14, k % 2 ? '#F29B2E' : '#E7584A', N, 3);
    rect(g, x - 3, y + 3, 1, 7, '#FFFFFF');
    rect(g, x - 2, y - 1, 5, 1, N); rect(g, x - 1, y + 14, 3, 2, N);
  }
  if (!ancho) {
    // en el del móvil, que es alto: la barra de focos y dos guirnaldas más de farolillos
    rect(g, 10, 54, W - 20, 3, '#2A2A34'); rect(g, 10, 54, W - 20, 1, '#4A4A5A');
    for (const fx of [cx - 70, cx - 24, cx + 24, cx + 70]) {
      caja(g, fx - 6, 57, 12, 12, '#1C1C24', N, 2);
      rect(g, fx - 4, 67, 8, 2, '#FFF3C4');
      halo(g, fx, 76, 16, 12, '#5A4470', 0.6);
    }
    for (const [fila, y0] of [[0, 110], [1, 190]]) {
      for (let k = 0; k < 7; k++) {
        const x = Math.round(W * (k + 0.5) / 7), y = y0 + (k % 2 === fila ? 10 : 0);
        if (k < 6) for (let i = 0; i <= 10; i++) { const xx = Math.round(x + (W / 7) * i / 10), yy = Math.round(y - 2 + Math.sin(i / 10 * Math.PI) * 8); rect(g, xx, yy, 1, 1, N); }
        halo(g, x, y + 8, 14, 12, '#5A3A6A', 0.6);
        caja(g, x - 4, y, 9, 12, (k + fila) % 2 ? '#F29B2E' : '#E7584A', N, 3);
        rect(g, x - 2, y + 3, 1, 5, '#FFFFFF');
      }
    }
  }
  // el telón, a los dos lados, con sus pliegues, y la bambalina de arriba con su ribete dorado
  const tel = ancho ? 54 : 22;
  for (const lado of [-1, 1]) {
    const x0 = lado < 0 ? 0 : W - tel;
    forma(g, x0, 0, tel, suelo + 2, (x, y) => {
      const dx = lado < 0 ? x : tel - 1 - x;
      const borde = tel - 1 - Math.round(Math.sin(y / 14) * 2) - (y > suelo - 40 ? Math.round((y - suelo + 40) * 0.25) : 0);
      if (dx > borde) return null;
      if (dx === borde) return N;
      const pliegue = (dx + Math.round(Math.sin(y / 9))) % 9;
      return pliegue < 2 ? '#3E0E22' : pliegue < 5 ? '#7A1E3E' : '#9A2A52';
    });
  }
  forma(g, 0, 0, W, 14, (x, y) => {
    const onda = 10 + Math.round(Math.abs(Math.sin(x / 9)) * 3);
    if (y > onda) return null;
    if (y === onda) return N;
    return y === onda - 2 ? '#E2B530' : (x >> 2) % 2 ? '#7A1E3E' : '#9A2A52';
  });
  // el título del programa, con su sombra, y «en directo»
  const ty = Math.max(70, suelo - 230);
  texto(g, 'CENAS', cx + 2, ty + 2, { font: '24px Silkscreen', color: N, align: 'center' });
  texto(g, 'CENAS', cx, ty, { font: '24px Silkscreen', color: '#F4D23C', align: 'center' });
  texto(g, 'ENCANTADAS', cx + 2, ty + 22, { font: '16px Silkscreen', color: N, align: 'center' });
  texto(g, 'ENCANTADAS', cx, ty + 20, { font: '16px Silkscreen', color: '#E8D7FF', align: 'center' });
  caja(g, cx - 34, ty + 30, 68, 12, '#E7584A', N, 3);
  rect(g, cx - 29, ty + 34, 4, 4, '#FFFFFF');
  texto(g, 'EN DIRECTO', cx + 5, ty + 40, { font: '8px Silkscreen', color: '#FFFFFF', align: 'center' });
  // Morty, detrás de la mesa
  if (img.morty) g.drawImage(img.morty, cx - 60, suelo - 40 - img.morty.height + 50);
  // la mesa con su mantel (pliegues y puntilla dorada), la sopa humeando con su cuchara y la vela
  const mw = Math.min(W - 20, 200), mx = Math.round(cx - mw / 2), my = suelo - 44;
  caja(g, mx, my, mw, 50, '#5B3A6E', N, 2);
  rect(g, mx + 1, my + 1, mw - 2, 6, '#7B5B92');
  for (let x = mx + 12; x < mx + mw - 6; x += 22) rect(g, x, my + 8, 1, 36, '#4A2C5C');
  for (let x = mx + 6; x < mx + mw - 6; x += 14) rect(g, x, my + 44, 7, 6, '#4A2C5C');
  for (let x = mx + 4; x < mx + mw - 4; x += 8) rect(g, x, my + 7, 3, 1, '#E2B530');
  forma(g, cx - 20, my - 8, 26, 10, (x, y) => (((x - 13) / 13) ** 2 + ((y - 5) / 5) ** 2 <= 1 ? (y < 4 ? '#C0392B' : '#E6E6E6') : null), N);
  rect(g, cx - 12, my - 6, 3, 1, '#E7584A');
  rect(g, cx + 6, my - 4, 10, 1, '#C9C9C9'); rect(g, cx + 14, my - 5, 3, 2, '#C9C9C9');
  for (let k = 0; k < 3; k++) for (let i = 0; i < 4; i++) rect(g, cx - 14 + k * 6 + (i % 2), my - 12 - i * 3, 1, 2, '#B9A8D0');
  rect(g, cx + 30, my - 16, 5, 16, '#F2EFE6'); rect(g, cx + 31, my - 21, 3, 5, '#FFD45A'); rect(g, cx + 32, my - 23, 1, 2, '#FFF3C4');
  rect(g, cx + 29, my - 2, 7, 2, '#C9A227');
  halo(g, cx + 32, my - 20, 20, 18, '#6E5838', 0.55);
  // Gengar, asomando por debajo del mantel
  if (img.gengarMostrador) {
    const gm = img.gengarMostrador;
    g.drawImage(gm, 0, 0, gm.width, Math.round(gm.height * 0.6), cx + mw / 2 - gm.width + 6, my + 50 - Math.round(gm.height * 0.6) + 4, gm.width, Math.round(gm.height * 0.6));
  }
  if (ancho) {
    // la cámara de la tele, a la derecha, en su trípode y con el piloto rojo
    const kx = cx + 150, ky = suelo - 70;
    for (const dx of [-14, 0, 14]) for (let y = 0; y < 52; y++) rect(g, Math.round(kx + dx * y / 52), ky + 18 + y, 2, 1, '#1C1C24');
    caja(g, kx - 18, ky, 36, 20, '#2A2A34', N, 2);
    caja(g, kx - 32, ky + 4, 16, 12, '#1C1C24', N, 2);
    rect(g, kx - 31, ky + 6, 2, 8, '#6A6A80');
    rect(g, kx + 12, ky + 3, 3, 3, '#E7584A');
    rect(g, kx - 14, ky + 3, 20, 1, '#4A4A5A');
    // y el público, en sombra, a la izquierda
    for (let k = 0; k < 4; k++) {
      const px = cx - 190 + k * 20, py = suelo + 4 + (k % 2) * 3;
      caja(g, px - 8, py - 10, 16, 18, '#1A1024', null, 6);
      caja(g, px - 5, py - 20, 10, 11, '#1A1024', null, 4);
    }
  }
  return c;
}

// Los cuatro momentos: título y cómo se pinta (W, H en píxeles de dibujo)
export const FONDOS = {
  tienda: { titulo: 'La tienda, abierta', comprado: 'fondo-tienda', pinta: (ctx, W, H, bajo) => pintaVista(MOSTRADOR, ctx, W, H, 1.3, bajo, 160) },
  baile: { titulo: 'Los perros bailan', comprado: 'fondo-baile', pinta: (ctx, W, H, bajo) => {
    const t = 1000;
    return conCalle({ baile: t - 0.4, baileLargo: true, hoy: { paseador: true, 'border-collie': true, bulldog: true, jefe: true } },
      () => conLados(pintaVista(CALLE, ctx, W, H, t, bajo, 140), ctx, H, bajo));
  } },
  cristal: { titulo: 'El Señor Mililitros, en el cristal', comprado: 'fondo-cristal', pinta: (ctx, W, H, bajo) => {
    const t = 1000;
    return conCalle({ solo: 'jefe-cristal', t0: t - 2, cristal: { x: 163, cara: 'cara-Normal' } }, () => conLados(pintaVista(CALLE, ctx, W, H, t, bajo, 160), ctx, H, bajo));
  } },
  malaga: { titulo: 'Morty viendo al Málaga', comprado: 'fondo-malaga', pinta: (ctx, W, H, bajo) => salon(ctx, W, H, bajo) },
  // (todos se compran en la tienda; tras el final salen los demás gratis, pero este solo comprado)
  cenas: { titulo: '«Cenas Encantadas»', comprado: 'cuadro', soloComprado: true, pinta: (ctx, W, H, bajo) => plato(ctx, W, H, bajo) },
};

// El fondo a su tamaño de dibujo (para verlo en pequeño)
const medidas = (id, tipo) => ({ ...MEDIDAS[tipo], ...(FONDOS[id][tipo] || {}) });
export function dibujoFondo(id, tipo, ctx, datos = {}) {
  const m = medidas(id, tipo);
  return FONDOS[id].pinta(ctx, m.w, m.h, m.bajo, datos);
}
// La firma, en pixel como todo lo demás, abajo a la derecha y con su sombra
function firma(c, tipo) {
  const g = c.getContext('2d');
  const x = c.width - 4, y = c.height - (tipo === 'movil' ? 10 : 4);
  texto(g, 'MILILITROS DE PERFUME', x + 1, y + 1, { font: '8px Silkscreen', color: '#0E4A3C', align: 'right' });
  texto(g, 'MILILITROS DE PERFUME', x, y, { font: '8px Silkscreen', color: '#FFFFFF', align: 'right' });
}

// El fondo a tamaño de foto, con la firma
async function fondoEntero(id, tipo, ctx, datos) {
  const m = medidas(id, tipo);
  try { await document.fonts.load('8px Silkscreen'); } catch { /* sin la fuente se ve igual */ }
  const dibujo = dibujoFondo(id, tipo, ctx, datos);
  firma(dibujo, tipo);
  const out = document.createElement('canvas');
  out.width = m.w * m.k; out.height = m.h * m.k;
  const f = out.getContext('2d');
  f.imageSmoothingEnabled = false;
  f.drawImage(dibujo, 0, 0, out.width, out.height);
  return out;
}

// Genera el fondo y lo descarga (en el móvil, el navegador ofrece guardarlo en la galería)
export async function descargaFondo(id, tipo, ctx, datos = {}) {
  const out = await fondoEntero(id, tipo, ctx, datos);
  const blob = await new Promise(res => out.toBlob(res, 'image/png'));
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `mililitros-de-perfume-${id}-${tipo}.png`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
