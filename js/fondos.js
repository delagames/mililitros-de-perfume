// Los fondos de pantalla del final (lo pidió Jorge): cuatro momentos del juego para descargar cuando se
// ha visto el epílogo. Se pintan con las mismas vistas del juego (la tienda, la calle) y el salón de Morty viendo al Málaga, a sangre
// y sin suavizar: cada píxel de dibujo, un cuadrado de 9 (móvil) u 8 (ordenador) píxeles de la foto.
// - móvil, en vertical: 180×390 de dibujo, acercado a lo importante de cada momento (su «centro») → 1620×3510;
// - ordenador, en horizontal: 480×270 de dibujo → 3840×2160 (4K).
// Abajo, una firma pequeña en una esquina. Lo que sobra arriba lo rellena la vista (cielo, estantería…),
// así que en el móvil el reloj cae sobre el toldo y los iconos de abajo sobre el suelo.
import { CALLE } from './calle.js';
import { MOSTRADOR } from './mostrador.js';
import { rect, caja, forma, degradado, halo, texto } from './pixel.js';
import { calle } from './perros.js';
import { ANCHO } from './escena.js';

const MEDIDAS = { movil: { w: 180, h: 390, k: 9, bajo: 30 }, ordenador: { w: 480, h: 270, k: 8, bajo: 12 } };

// Una vista entera en un lienzo de W×H píxeles de dibujo, en el instante t (segundos), con su suelo a
// «bajo» píxeles del borde de abajo y el punto «centro» del mundo en medio (si no cabe entero)
function pintaVista(vista, ctx, W, H, t, bajo, centro = ANCHO / 2) {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d', { willReadFrequently: true });
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

// Los perros de la calle se pintan según su estado (quién sale, si bailan…): se pone el del momento y
// luego se deja como estaba
function conCalle(cambios, pinta) {
  const antes = { ...calle, hoy: { ...calle.hoy } };
  Object.assign(calle, { repartidor: -1, baile: -1, solo: null, cristal: null }, cambios);
  if (cambios.cristal) calle.cristal = { ...cambios.cristal };
  try { return pinta(); } finally { Object.assign(calle, antes); }
}

// Morty viendo al Málaga, de noche, en el salón: la tele en primer plano, de espaldas, alumbrándoles
// (Morty mira a la tele, o sea, a nosotros); Gengar en el sofá, la bufanda en la pared y ¡gol!
function salon({ img }, W, H, bajo) {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d', { willReadFrequently: true });
  const cx = Math.round(W / 2), suelo = H - bajo - 26;
  // la pared y el suelo de madera
  degradado(g, 0, 0, W, suelo, '#101C30', '#1C3446');
  rect(g, 0, suelo, W, H - suelo, '#5A3A26');
  for (let y = suelo + 6, k = 0; y < H; y += 7, k++) {
    rect(g, 0, y, W, 1, '#4A2E1E');
    for (let x = (k % 2) * 23; x < W; x += 46) rect(g, x, y - 6, 1, 6, '#4A2E1E');
  }
  rect(g, 0, suelo, W, 2, '#2E1C12');
  // la ventana, con la noche, la luna y estrellas
  const vx = cx - 82, vy = suelo - 186;
  caja(g, vx - 2, vy - 2, 48, 60, '#0A0A0A', null, 0);
  caja(g, vx, vy, 44, 56, '#0B1830', null, 0);
  for (const [x, y] of [[6, 8], [30, 14], [14, 30], [36, 40], [8, 48]]) rect(g, vx + x, vy + y, 1, 1, '#FFF3C4');
  forma(g, vx + 24, vy + 6, 12, 12, (x, y) => ((x - 6) ** 2 + (y - 6) ** 2 <= 30 && (x - 9) ** 2 + (y - 4) ** 2 > 22 ? '#FFF3C4' : null));
  rect(g, vx + 21, vy, 2, 56, '#0A0A0A'); rect(g, vx, vy + 27, 44, 2, '#0A0A0A');
  // la bufanda del Málaga, colgada en la pared
  const bw = 96, bx = cx - 20, by = suelo - 168;
  for (let k = 0; k < bw; k += 8) rect(g, bx + k, by, 8, 12, (k / 8) % 2 ? '#1F5FA8' : '#F4F4F4');
  rect(g, bx, by - 1, bw, 1, '#0A0A0A'); rect(g, bx, by + 12, bw, 1, '#0A0A0A');
  for (let k = 0; k < 6; k++) { rect(g, bx + k * 2, by + 13, 1, 5, '#F4F4F4'); rect(g, bx + bw - 12 + k * 2, by + 13, 1, 5, '#1F5FA8'); }
  // el escudo del Málaga, en la pared, bajo la bufanda
  if (img.escudo) {
    caja(g, cx + 28, suelo - 146, img.escudo.width + 8, img.escudo.height + 8, '#3A2A1E', '#0A0A0A', 0);
    g.drawImage(img.escudo, cx + 32, suelo - 142);
  }
  // la penumbra de la habitación y, en la pared y el suelo, el resplandor azul de la tele (a ellos les da de lleno)
  g.fillStyle = 'rgba(8, 14, 30, 0.38)'; g.fillRect(0, 0, W, H);
  halo(g, cx, H - bajo + 6, Math.max(120, W * 0.42), 150, '#2C5A70', 0.6);
  // el sofá
  const sw = 150, sx = cx - sw / 2 + 10, sy = suelo - 44;
  caja(g, sx, sy - 6, sw, 36, '#7A2632', '#0A0A0A', 3);                      // respaldo
  caja(g, sx + 6, sy + 22, sw - 12, 22, '#A33A47', '#0A0A0A', 2);            // asiento
  caja(g, sx - 8, sy + 10, 18, 36, '#8E2F3A', '#0A0A0A', 3);                 // brazos
  caja(g, sx + sw - 10, sy + 10, 18, 36, '#8E2F3A', '#0A0A0A', 3);
  rect(g, sx + 8, sy + 46, 4, 6, '#2E1C12'); rect(g, sx + sw - 12, sy + 46, 4, 6, '#2E1C12');
  // Gengar, sentado en el sofá; Morty, de pie delante, con su frasco en alto
  if (img.gengarMostrador) g.drawImage(img.gengarMostrador, sx + sw - 88, sy - 30);
  if (img.morty) g.drawImage(img.morty, cx - 70, suelo + 8 - img.morty.height);
  // una lata en el suelo
  caja(g, cx + 46, suelo + 2, 7, 11, '#C9A227', '#0A0A0A', 1); rect(g, cx + 47, suelo + 5, 5, 3, '#C0392B');
  // ¡gol! (en el de ordenador, que es bajito, a la derecha de la bufanda)
  const [gx, gy] = W > H ? [cx + 140, suelo - 150] : [cx, suelo - 216];
  texto(g, '¡GOOOL!', gx + 2, gy + 2, { font: 'bold 32px "Pixelify Sans"', color: '#0E2A4A', align: 'center' });
  texto(g, '¡GOOOL!', gx, gy, { font: 'bold 32px "Pixelify Sans"', color: '#FFFFFF', align: 'center' });
  // la tele, de espaldas, en primer plano
  const tw = Math.min(W - 20, 170);
  caja(g, cx - tw / 2, H - bajo + 2, tw, bajo + 10, '#15181C', '#0A0A0A', 3);
  rect(g, cx - tw / 2 + 3, H - bajo + 3, tw - 6, 1, '#9FE8FF');
  rect(g, cx - 14, H - bajo + 12, 28, 6, '#22262A');
  return c;
}

// Los cuatro momentos: título y cómo se pinta (W, H en píxeles de dibujo)
export const FONDOS = {
  tienda: { titulo: 'La tienda, abierta', pinta: (ctx, W, H, bajo) => pintaVista(MOSTRADOR, ctx, W, H, 1.3, bajo, 160) },
  baile: { titulo: 'Los perros bailan', pinta: (ctx, W, H, bajo) => {
    const t = 1000;
    return conCalle({ baile: t - 0.4, baileLargo: true, hoy: { paseador: true, 'border-collie': true, bulldog: true, jefe: true } },
      () => pintaVista(CALLE, ctx, W, H, t, bajo, 140));
  } },
  cristal: { titulo: 'El Señor Mililitros, en el cristal', pinta: (ctx, W, H, bajo) => {
    const t = 1000;
    return conCalle({ solo: 'jefe-cristal', t0: t - 2, cristal: { x: 163, cara: 'cara-Normal' } }, () => pintaVista(CALLE, ctx, W, H, t, bajo, 160));
  } },
  malaga: { titulo: 'Morty viendo al Málaga', pinta: (ctx, W, H, bajo) => salon(ctx, W, H, bajo) },
};

// El fondo a su tamaño de dibujo (para verlo en pequeño)
const medidas = (id, tipo) => ({ ...MEDIDAS[tipo], ...(FONDOS[id][tipo] || {}) });
export function dibujoFondo(id, tipo, ctx, datos = {}) {
  const m = medidas(id, tipo);
  return FONDOS[id].pinta(ctx, m.w, m.h, m.bajo, datos);
}

// El fondo a tamaño de foto, con la firma
async function fondoEntero(id, tipo, ctx, datos) {
  const m = medidas(id, tipo);
  const dibujo = dibujoFondo(id, tipo, ctx, datos);
  const out = document.createElement('canvas');
  out.width = m.w * m.k; out.height = m.h * m.k;
  const f = out.getContext('2d');
  f.imageSmoothingEnabled = false;
  f.drawImage(dibujo, 0, 0, out.width, out.height);
  try { await document.fonts.load('32px "Pixelify Sans"'); } catch { /* sin la fuente se ve igual */ }
  const tam = m.k * 5, x = out.width - m.k * 6, y = out.height - m.k * (tipo === 'movil' ? 8 : 5);
  f.font = `${tam}px "Pixelify Sans"`;
  f.textAlign = 'right';
  f.globalAlpha = 0.55; f.fillStyle = '#0E4A3C'; f.fillText('Mililitros de Perfume · Morty y Gengar', x + m.k, y + m.k);
  f.globalAlpha = 0.85; f.fillStyle = '#FFFFFF'; f.fillText('Mililitros de Perfume · Morty y Gengar', x, y);
  f.globalAlpha = 1;
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
