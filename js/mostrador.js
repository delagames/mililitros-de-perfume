// Vista del mostrador (sección 8 de DISEÑO.md). Mundo de 270 de ancho con el suelo en y=228:
// pared blanca con el friso de toldo menta, lámparas colgando con su halo, estantería negra con
// tiras de luz y los frascos de la marca, balda de muestras, rótulo y calendario, zócalo de azulejo
// menta, suelo en perspectiva y el mostrador menta con Morty detrás. El cliente se pondrá a la
// izquierda, en el hueco del suelo.
import { rect, forma, caja, texto, degradado, halo, umbralBayer, cifras } from './pixel.js';
import { pintaCliente } from './client.js';

// Las siete gotas, en el orden del escaparate
export const GOTAS = ['gota_picante', 'gota_citrico', 'gota_dulce', 'gota_verde', 'gota_fresco', 'gota_amargo', 'gota_floral'];

// Tonos de sombra y luz derivados de la paleta (solo para dar volumen)
const T = {
  pared: '#F4F2EC', paredSombra: '#E1E6E3', paredOscura: '#CCD5D1',
  suelo1: '#E9EDEA', suelo2: '#DCE3DF', junta: '#C3CEC9', sombra: '#B9C5C0',
  mentaLuz: '#B8F0E0', fondoEstante: '#2B3331', fondoLuz: '#3D4845',
  hoja: '#3E8E52', hojaLuz: '#5DB86A',
};

// Toldo de rayas con el borde en ondas (el de la tienda en menta; el del bar, de otro color)
export function toldo(g, P, x0, y0, w, c1 = P.menta, c2 = P.menta_oscura, raya = 10, alto = 10) {
  const r = raya / 2;
  forma(g, x0, y0, w, alto + r + 1, (x, y) => {
    const c = Math.floor(x / raya) % 2 ? c2 : c1;
    if (y < alto) return c;
    const dx = (x % raya) - (raya - 1) / 2, dy = y - alto;
    return dx * dx + dy * dy <= r * r ? c : null;
  }, P.negro);
}

// Frasco de la marca: negro, con brillo a la izquierda, filo a la derecha y etiqueta menta
function frascoNegro(g, P, x, base, tipo) {
  const [w, h] = [[8, 12], [10, 10], [6, 16]][tipo];
  const y = base - h, cx = x + Math.floor(w / 2);
  rect(g, cx - 1, y - 2, 3, 2, P.negro);                               // cuello
  rect(g, cx - 2, y - 5, 5, 3, P.negro);                               // tapón
  rect(g, cx - 1, y - 5, 1, 1, '#4A4A4A');
  caja(g, x, y, w, h, P.negro, P.negro, tipo === 1 ? 2 : 1);
  rect(g, x + 1, y + 2, 1, h - 4, '#5A6262');
  rect(g, x + w - 2, y + 2, 1, h - 4, '#262B2A');
  rect(g, cx - 1, y + Math.floor(h / 2) - 1, 3, 3, P.menta);
  rect(g, cx - 1, y + Math.floor(h / 2) + 1, 3, 1, P.menta_oscura);
}

// Frasco de muestra de una gota: matraz de cristal con el líquido, brillo y tapón de corcho
export function frascoMuestra(g, P, x, base, color, sombra = null) {
  forma(g, x, base - 13, 9, 13, (px, py) => {
    if (py < 2) return px >= 2 && px <= 6 ? (py === 0 ? '#A98670' : P.madera) : null;
    if (py < 5) return px >= 3 && px <= 5 ? '#E8F4F0' : null;          // cuello de cristal vacío
    const dx = px - 4, dy = py - 8.5;
    if (dx * dx + dy * dy > 19) return null;
    return py >= 11 || px >= 7 ? (sombra || color) : color;
  }, P.negro);
  rect(g, x + 2, base - 8, 1, 2, P.blanco);                            // brillo
}

// Oscurece un color (para la sombra del líquido de las muestras)
export function sombraDe(hex, f = 0.72) {
  const n = [1, 3, 5].map(i => Math.round(parseInt(hex.slice(i, i + 2), 16) * f));
  return '#' + n.map(v => v.toString(16).padStart(2, '0')).join('');
}

// ---------- lo que va de lado a lado (pared, lámparas, zócalo y suelo) ----------
function fondo(g, P, d) {
  const { W, H, oy } = d;
  const zocalo = oy + 150, suelo = oy + 170;
  // pared, más en sombra hacia el techo
  rect(g, 0, 0, W, suelo, T.pared);
  degradado(g, 0, 0, W, 50, T.paredSombra, T.pared);
  // halo de las lámparas en la pared
  for (const wx of LAMPARAS) halo(g, d.ox + wx, d.toldo + LAMPARA_Y + 14, 40, 40, P.blanco, 0.9);
  // zócalo de azulejo menta con su remate
  rect(g, 0, zocalo, W, 20, P.menta_clara);
  for (let x = (d.ox % 10) - 10; x < W; x += 10) rect(g, x, zocalo + 2, 1, 18, '#86DCC4');
  rect(g, 0, zocalo + 11, W, 1, '#86DCC4');
  rect(g, 0, zocalo, W, 2, P.menta_oscura);
  rect(g, 0, zocalo + 2, W, 1, P.menta);
  // suelo en perspectiva: filas cada vez más altas y juntas al tresbolillo
  rect(g, 0, suelo, W, H - suelo, T.suelo1);
  rect(g, 0, suelo, W, 1, T.sombra);
  for (let y = suelo + 1, i = 0, alto = 5; y < H; y += alto, i++, alto = Math.min(alto + 1, 14)) {
    rect(g, 0, y, W, alto, i % 2 ? T.suelo2 : T.suelo1);
    rect(g, 0, y, W, 1, T.junta);
    const paso = 22 + i * 4;
    for (let x = ((i % 2) * paso) / 2 + (d.ox % paso) - paso; x < W; x += paso) rect(g, x, y, 1, alto, T.junta);
  }
}

// Lámparas colgando del toldo de arriba (en píxeles del lienzo, no del mundo; LAMPARA_Y, bajo el toldo)
const LAMPARAS = [150, 246], LAMPARA_Y = 18;
function lamparas(g, P, d) {
  for (const wx of LAMPARAS) {
    const x = d.ox + wx, y = d.toldo + LAMPARA_Y;
    rect(g, x, d.toldo + 4, 1, LAMPARA_Y - 4, P.negro);
    forma(g, x - 5, y, 11, 6, (px, py) => Math.abs(px - 5) <= 2 + py ? P.negro : null);
    rect(g, x - 3, y + 1, 1, 3, '#4A4A4A');
    rect(g, x - 2, y + 6, 5, 1, '#FFF6C9');
  }
}

// ---------- el mundo (coordenadas de la vista) ----------
// La estantería sube hasta casi el techo: tantas baldas como quepan por encima
function estanteria(g, P, d, img = {}) {
  const baldas = [122];
  while (baldas[baldas.length - 1] - 33 >= -d.oy + d.toldo + 14) baldas.push(baldas[baldas.length - 1] - 33);
  const arriba = baldas[baldas.length - 1];
  rect(g, 113, arriba + 3, 3, 124 - arriba, T.paredOscura);             // sombra en la pared
  rect(g, 9, 125, 107, 2, T.paredOscura);
  rect(g, 9, arriba + 3, 100, 119 - arriba, T.fondoEstante);
  for (const x of [6, 109]) { rect(g, x, arriba, 3, 125 - arriba, P.negro); rect(g, x + 1, arriba + 1, 1, 123 - arriba, '#2A2A2A'); }
  for (const y of baldas) {
    rect(g, 6, y, 106, 3, P.negro);
    rect(g, 6, y, 106, 1, '#333');
    if (y < 122) {                                                      // tira de luz bajo la balda
      rect(g, 9, y + 3, 100, 1, T.mentaLuz);
      halo(g, 59, y + 12, 52, 10, T.fondoLuz, 1);
    }
  }
  const tipos = [0, 2, 1, 0, 1, 2, 0, 1];
  // si se ha comprado el escudo del Málaga, va de pie en la segunda balda, a la derecha (sin frascos ahí)
  const escudo = tienda.conEscudo() && img.escudoMini;
  for (const [i, base] of baldas.slice(0, -1).entries()) {
    let x = 13 + i * 3;
    for (let k = 0; x < (escudo && base === 89 ? 82 : base === 122 ? 80 : 100); k++) {
      const tipo = tipos[(k + i * 3) % tipos.length];
      frascoNegro(g, P, x, base, tipo);
      x += [12, 10, 14][tipo] + ((k + i) % 2);
    }
  }
  if (escudo) g.drawImage(img.escudoMini, 88, 89 - img.escudoMini.height);
  tarroDeTiras(g, P, 94, 122);
}

// El tarro de cristal con las tiras de papel secante para dar a oler: abiertas en abanico, con la punta
// teñida de perfume; con la mejora «Más tiras de papel secante», más
function tarroDeTiras(g, P, cx, base) {
  const muchas = tienda.tiene('mesa');
  const tiras = muchas ? [-7, -5, -3, -1, 1, 3, 5, 7] : [-5, -2, 1, 4];
  const colores = [P.gota_picante, P.gota_citrico, P.gota_dulce, P.gota_verde, P.gota_fresco, P.gota_amargo, P.gota_floral, P.gota_picante];
  tiras.forEach((dx, k) => {
    const alto = 24 + (k % 3) * 2;   // (sin llegar a la balda de arriba)
    for (let y = 0; y < alto; y++) {
      const x = Math.round(cx + dx * (y / alto) * 0.9);
      rect(g, x, base - 4 - y, 2, 1, y > alto - 5 ? colores[k % colores.length] : '#FBF8F0');
    }
    rect(g, Math.round(cx + dx * 0.9) - 1, base - 4 - alto, 3, 1, P.negro);   // (el canto de arriba)
  });
  // el tarro, de cristal: contorno, brillo y el fondo
  caja(g, cx - 7, base - 13, 15, 13, '#BFE3DC', P.negro, 2);
  rect(g, cx - 6, base - 12, 13, 3, '#DDF2EE');                              // el cristal, con su reflejo
  for (const dx of tiras) rect(g, Math.round(cx + dx * 0.15), base - 9, 1, 8, '#EEF7F5');   // las tiras, vistas a través
  rect(g, cx - 5, base - 11, 1, 8, '#FFFFFF');
  rect(g, cx + 5, base - 11, 1, 9, '#9CC9C0');
  rect(g, cx - 8, base - 14, 17, 2, P.negro); rect(g, cx - 7, base - 13, 15, 1, '#DDEEEA');
}

function baldaMuestras(g, P) {
  rect(g, 10, 145, 102, 2, T.paredOscura);                              // sombra
  caja(g, 8, 140, 104, 5, P.menta_oscura, P.negro, 0);
  rect(g, 9, 141, 102, 1, P.menta);
  GOTAS.forEach((c, i) => frascoMuestra(g, P, 13 + i * 14, 140, P[c], sombraDe(P[c])));
}



// El rótulo de la tienda: si hay pared de sobra, arriba del todo (y más grande en los móviles altos);
// si no, encima del calendario
function rotulo(g, P, d) {
  const techo = -d.oy + d.toldo + 10;
  const alto = techo <= -50;
  const grande = techo <= -120;
  const y = alto ? Math.max(techo + (grande ? 30 : 24), Math.round(techo / 2) + 4) : 39;
  const f1 = grande ? '32px "Caveat Brush"' : '24px "Caveat Brush"', f2 = grande ? '16px "Caveat Brush"' : '12px "Caveat Brush"';
  const baja = grande ? 16 : 12;
  const neon = tienda.tiene('cartel');
  if (neon) halo(g, 196, y - 6, 64, 18, '#B8F5E4', 0.6);
  texto(g, 'Mililitros', 197, y + 1, { font: f1, color: neon ? '#2FB894' : T.paredOscura, align: 'center' });
  texto(g, 'Mililitros', 196, y, { font: f1, color: neon ? '#0E4A3C' : P.negro, align: 'center' });
  texto(g, 'de perfume', 197, y + baja + 1, { font: f2, color: T.paredOscura, align: 'center' });
  texto(g, 'de perfume', 196, y + baja, { font: f2, color: P.negro, align: 'center' });
  // calendario de la pared (más adelante marcará el día y la jornada del Málaga)
  rect(g, 127, 67, 22, 24, T.paredOscura);
  caja(g, 124, 64, 22, 24, P.blanco, P.negro, 0);
  rect(g, 125, 65, 20, 5, P.gota_picante);
  rect(g, 129, 63, 1, 3, P.negro); rect(g, 140, 63, 1, 3, P.negro);

}

// El alta de autónomo enmarcada, al lado del calendario, donde estaba el rótulo cuando este sube
function cuadros(g, P, d, img = {}) {
  const techo = -d.oy + d.toldo + 10;
  if (techo > -50) return;
  const x = 180, y = 22;
  rect(g, x + 3, y + 3, 34, 40, T.paredOscura);
  caja(g, x, y, 34, 40, P.madera_oscura, P.negro, 0);
  rect(g, x + 3, y + 3, 28, 34, P.blanco);
  texto(g, 'ALTA', x + 17, y + 11, { font: '8px Silkscreen', color: P.negro, align: 'center' });
  for (let k = y + 15; k < y + 30; k += 3) rect(g, x + 6, k, 22, 1, '#B9C5C0');
  forma(g, x + 14, y + 26, 13, 11, (px, py) => {                        // el sello de la cuota
    const r = Math.hypot(px - 6, py - 5);
    return r <= 5.5 && r > 4 ? P.gota_picante : (py === 5 && r < 4 ? P.gota_picante : null);
  });
}

// Gengar está de pie en el suelo detrás del mostrador, al lado de Morty, y asoma por encima del
// tablero. Detrás, en la pared de la trastienda, el hueco por donde entra y sale atravesándola:
// cuando no está queda su sombra morada, muy tenue, como la mancha que deja de tanto pasar.
// El de aquí es el grande (assets/sprites/gengar/gengar-mostrador.png), con el grano de morty-trainer.png.
export const GENGAR = { x: 140, pies: 176 };   // centro y pies, en el mundo de la vista
export const HUECO_GENGAR = { x: 113, y: 78, ancho: 54, alto: 56 };
function huecoGengar(g, P) {
  const { x, y, ancho, alto } = HUECO_GENGAR;
  forma(g, x, y, ancho, alto, (px, py) => {
    const cx = ancho / 2, cy = alto * 0.55;
    const cuerpo = ((px - cx) / 26) ** 2 + ((py - cy) / 22) ** 2 <= 1;
    const oreja = py < cy - 12 && py > 8 && Math.abs(Math.abs(px - cx) - 16) <= (py - 8) * 0.35;
    const pinchos = py < cy - 15 && py > 12 && Math.abs(px - cx) < 10 && (px % 6 < 3) && py > 18 - (px % 6);
    if (!cuerpo && !oreja && !pinchos) return null;
    return umbralBayer(px + x, py + y) < 0.16 ? '#C9BCE4' : null;
  });
}

// Gengar detrás del mostrador. Casi siempre está; de vez en cuando se hunde en la pared de detrás
// (se deshace en tramado), se queda un rato en la trastienda y vuelve a salir.
// (Más adelante lo moverán los sucesos del día; ahora va por ciclos fijos.)
const CICLO = 40, SE_VA = 30, FUNDIDO = 1.2, VUELVE = 38;
let gengarLienzo = null;
function gengar(g, t, { img }, d) {
  if (!img.gengarMostrador) return;
  const c = t % CICLO;
  let visible = 1;
  if (c >= SE_VA && c < SE_VA + FUNDIDO) visible = 1 - (c - SE_VA) / FUNDIDO;
  else if (c >= SE_VA + FUNDIDO && c < VUELVE) visible = 0;
  else if (c >= VUELVE && c < VUELVE + FUNDIDO) visible = (c - VUELVE) / FUNDIDO;
  if (visible <= 0) return;
  // respira: un píxel arriba y abajo, despacio
  const f = { img: img.gengarMostrador, sx: 0, sy: 0, w: img.gengarMostrador.width, h: img.gengarMostrador.height };
  gengarLienzo ??= document.createElement('canvas');
  const cg = gengarLienzo.getContext('2d', { willReadFrequently: true });
  gengarLienzo.width = f.w; gengarLienzo.height = f.h;
  cg.drawImage(f.img, f.sx, f.sy, f.w, f.h, 0, 0, f.w, f.h);
  if (visible < 1) {
    const datos = cg.getImageData(0, 0, f.w, f.h);
    for (let y = 0; y < f.h; y++)
      for (let x = 0; x < f.w; x++) if (umbralBayer(x, y) >= visible) datos.data[(y * f.w + x) * 4 + 3] = 0;
    cg.putImageData(datos, 0, 0);
  }
  const respira = Math.sin(t * 1.4) > 0.6 ? 1 : 0;
  g.drawImage(gengarLienzo, d.ox + GENGAR.x - Math.round(f.w / 2), d.oy + GENGAR.pies - f.h + respira);
}

// Morty detrás del mostrador (morty-trainer.png, que viene hecho y no se toca): se le da vida al
// pintarlo. Respira (de la cintura para arriba baja y sube un píxel), parpadea de vez en cuando y
// la poción que sujeta chispea. Los ojos y el frasco están medidos sobre el dibujo.
const MORTY = { x: 166, y: 58 };
const CINTURA = 62;                                  // de aquí para arriba es lo que respira
const OJOS = [{ x: 44, y: 14, w: 4, h: 3 }, { x: 50, y: 16, w: 4, h: 2 }];
const PIEL = '#F29670', PESTANA = '#6C4F52';
const CHISPAS = [[66, 20], [78, 24], [64, 30], [73, 14], [80, 31]];
let mortyCerrado = null;                             // el mismo dibujo con los ojos cerrados
function ojosCerrados(img) {
  const c = document.createElement('canvas');
  c.width = img.width; c.height = img.height;
  const g = c.getContext('2d');
  g.drawImage(img, 0, 0);
  for (const o of OJOS) {
    g.fillStyle = PIEL; g.fillRect(o.x, o.y, o.w, o.h);
    g.fillStyle = PESTANA; g.fillRect(o.x, o.y + o.h - 1, o.w, 1);
  }
  return c;
}
// El día de la baja, detrás del mostrador solo está Gengar (lo pone main.js)
// dineroHoy: lo que se lleva hecho en el día (lo pone main.js), para el visor de la caja registradora
// ocioso: si lleva un rato sin pasar nada (Morty se pone a sacarle brillo al frasco); conEscudo: si se ha
// comprado el escudo del Málaga, que va de pie en el mostrador
// tiene(id): si se ha comprado esa mejora (para dibujarla en la tienda)
export const tienda = { sinMorty: false, dineroHoy: () => 0, ocioso: () => false, conEscudo: () => false, calendario: () => ({ dia: 1, rojo: false }), tiene: () => false };
function morty(g, t, { P, img }, d) {
  if (tienda.sinMorty) return;
  const x = d.ox + MORTY.x, y = d.oy + MORTY.y, w = img.morty.width, h = img.morty.height;
  // parpadeo: cada 4,7 s, y uno de cada tres es doble
  const ciclo = Math.floor(t / 4.7), fase = t - ciclo * 4.7;
  const parpadea = fase < 0.14 || (ciclo % 3 === 0 && fase > 0.3 && fase < 0.42);
  mortyCerrado ??= ojosCerrados(img.morty);
  const dibujo = parpadea ? mortyCerrado : img.morty;
  // respira: un píxel abajo durante la espiración
  const dy = Math.sin(t * 2 * Math.PI / 3.6) > 0.2 ? 1 : 0;
  g.drawImage(dibujo, 0, CINTURA, w, h - CINTURA, x, y + CINTURA, w, h - CINTURA);
  g.drawImage(dibujo, 0, 0, w, CINTURA, x, y + dy, w, CINTURA);
  // si no pasa nada, le saca brillo a su frasco con un trapo, en círculos
  if (tienda.ocioso()) {
    const a = t * 5, cx = x + 74 + Math.round(Math.cos(a) * 3), cy = y + 32 + dy + Math.round(Math.sin(a) * 2);
    rect(g, cx - 3, cy - 2, 7, 4, '#EDEDE6'); rect(g, cx - 3, cy + 2, 7, 1, '#B9B9B0'); rect(g, cx - 3, cy - 2, 1, 4, '#B9B9B0');
  }
  // chispas de la poción: cada una se enciende un momento, por turnos
  CHISPAS.forEach(([cx, cy], i) => {
    const f = (t * 1.3 + i * 0.37) % 1.6;
    if (f > 0.35) return;
    const px = x + cx, py = y + cy + dy;
    rect(g, px, py, 1, 1, P.blanco);
    if (f < 0.18) { rect(g, px - 1, py, 3, 1, '#B7B4E0'); rect(g, px, py - 1, 1, 3, '#B7B4E0'); rect(g, px, py, 1, 1, P.blanco); }
  });
}

function planta(g, P) {
  // costilla de Adán en maceta negra, a la izquierda del todo
  forma(g, -6, 150, 40, 40, (x, y) => {
    const hojas = [[10, 14, 11, 9], [26, 10, 10, 8], [18, 24, 12, 9], [6, 28, 9, 7], [30, 26, 9, 7]];
    for (const [cx, cy, rx, ry] of hojas) {
      const v = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
      if (v <= 1) return (x - cx) * 0.6 + (y - cy) < -2 ? T.hojaLuz : T.hoja;
    }
    return null;
  }, P.negro);
  caja(g, 2, 184, 20, 20, P.negro, P.negro, 2);
  rect(g, 4, 186, 2, 15, '#3A3A3A');
  rect(g, 0, 204, 26, 2, T.sombra);

}

// El mostrador empieza en IZQ: lo bastante a la izquierda para tapar el cuerpo de Gengar
const IZQ = 98;
function mostradorDelante(g, P, d) {
  const der = d.der;
  // sombra en el suelo
  forma(g, IZQ - 2, 224, der - IZQ + 2, 6, (x, y) => (x + y) % 2 || y < 2 ? T.sombra : null);
  // costado, frente con cuarterones y zócalo
  forma(g, IZQ + 2, 150, 6, 74, (x, y) => (y >= x * 0.5 ? P.menta_oscura : null), P.negro);
  rect(g, IZQ + 7, 152, der - IZQ - 7, 66, P.menta);
  rect(g, IZQ + 7, 152, 1, 72, P.negro);
  for (let x = IZQ + 12; x < der; x += 26) {
    rect(g, x, 158, 20, 54, '#47CDA9');
    rect(g, x, 158, 20, 1, P.menta_oscura); rect(g, x, 158, 1, 54, P.menta_oscura);
    rect(g, x, 211, 20, 1, T.mentaLuz); rect(g, x + 19, 158, 1, 54, T.mentaLuz);
  }
  rect(g, IZQ + 7, 218, der - IZQ - 7, 6, P.verde_tinta);
  rect(g, IZQ + 7, 218, der - IZQ - 7, 1, P.negro);
  // tablero con canto de luz
  rect(g, IZQ, 146, der - IZQ, 7, P.menta_oscura);
  rect(g, IZQ, 146, der - IZQ, 1, P.negro);
  rect(g, IZQ + 1, 147, der - IZQ - 1, 1, T.mentaLuz);
  rect(g, IZQ, 152, der - IZQ, 1, P.negro);
  rect(g, IZQ, 146, 1, 7, P.negro);
  // el frasco del logo en el frente, con su gota
  const fx = 196;
  rect(g, fx + 3, 168, 10, 4, P.negro);
  rect(g, fx + 5, 172, 6, 3, P.negro);
  caja(g, fx, 175, 16, 22, P.negro, P.negro, 3);
  forma(g, fx + 5, 183, 6, 9, (x, y) => {
    if (y < 3) return (x > 0 && x < 5) || y > 0 ? P.gota_picante : null;
    if (y === 3) return P.negro;
    return Math.abs(x - 2.5) <= (8 - y) * 0.75 ? P.menta : null;
  });
  // caja registradora
  caja(g, 224, 125, 34, 22, P.negro, P.negro, 2);
  rect(g, 226, 126, 30, 1, '#3A3A3A');
  rect(g, 228, 128, 26, 10, P.verde_tinta);
  rect(g, 228, 128, 26, 1, '#0A3329');
  for (let y = 140; y < 145; y += 2) for (let x = 229; x < 254; x += 4) rect(g, x, y, 2, 1, '#5A6262');
}

// Al dar a oler, la balda de muestras parpadea con un marco menta (lo activa main.js)
export const muestras = { resaltar: false };
// Qué muestra hay en (x, y) del mundo: su número en GOTAS, o -1
export function muestraEn(x, y) {
  if (y < 122 || y > 147) return -1;
  const i = Math.floor((x - 9) / 14);
  return i >= 0 && i < GOTAS.length ? i : -1;
}

// Un destello de vez en cuando en una de las muestras
function destello(g, t, { P }, d) {
  if (muestras.resaltar && Math.floor(t * 3) % 2 === 0) caja(g, d.ox + 6, d.oy + 122, 108, 26, null, P.menta, 1);
  const ciclo = Math.floor(t / 2.2), fase = t / 2.2 - ciclo;
  if (fase > 0.15) return;
  const x = d.ox + 15 + ((ciclo * 5) % 7) * 14, y = d.oy + 131;
  rect(g, x, y - 1, 1, 3, P.blanco);
  rect(g, x - 1, y, 3, 1, P.blanco);
}

export const MOSTRADOR = {
  suelo: 230,
  capas: [
    { fija: (g, { P, img }, d) => {
      fondo(g, P, d);
      g.translate(d.ox, d.oy);
      estanteria(g, P, d, img);
      cuadros(g, P, d, img);
      huecoGengar(g, P);
      baldaMuestras(g, P);
      rotulo(g, P, d);
      planta(g, P);
      g.setTransform(1, 0, 0, 1, 0, 0);
      toldo(g, P, 0, 0, d.W, P.menta, tienda.tiene('toldo') ? P.blanco : P.menta_oscura, 10, d.toldo);
      lamparas(g, P, d);
    } },
    { anima: destello },
    // Gengar y Morty van entre la pared y el mostrador, que les tapa el cuerpo
    { anima: gengar },
    { anima: morty },
    { fija: (g, { P }, d) => {
      g.translate(d.ox, d.oy);
      mostradorDelante(g, P, d);
    } },
    // el visor de la caja registradora: lo que se lleva hecho hoy; y, si se ha comprado, el escudo, de pie
    { anima: (g, t, { P, img }, d) => {
      g.translate(d.ox, d.oy);
      // el calendario de la pared: el día del mes, en rojo en el trimestre
      const cal = tienda.calendario();
      if (cal.rojo) rect(g, 125, 70, 20, 17, '#F6C9C3');
      cifras(g, String(cal.dia), 135, 74, { color: cal.rojo ? '#C0392B' : P.negro, align: 'center', escala: 2 });
      // la cafetera italiana para Gengar, en la punta del mostrador, echando vapor
      if (tienda.tiene('cafetera')) {
        const cx = 112, abajo = 147;
        const ACERO = '#C9D1CE', LUZ = '#F2F5F4', SOMBRA = '#8E9894', OSCURO = '#5E6865';
        // el cuerpo de abajo (el depósito) y el de arriba, con forma de reloj de arena y aristas
        forma(g, cx - 9, abajo - 26, 18, 26, (x, y) => {
          const dx = x - 8.5;
          const ancho = y < 2 ? 3 : y < 12 ? 5 + (y - 2) * 0.35 : y < 14 ? 6 : 5 + (25 - y) * 0.3 + 1.5;
          if (y < 2) return Math.abs(dx) <= 1.5 ? '#222' : null;               // el pomo
          if (Math.abs(dx) > ancho) return null;
          if (y === 12 || y === 13) return OSCURO;                              // la cintura
          if (dx < -ancho + 1.5) return LUZ;                                    // el brillo de la izquierda
          if (dx > ancho - 1.5) return SOMBRA;                                  // la sombra de la derecha
          return Math.abs(dx) < 1 ? LUZ : ACERO;                                // la arista del centro
        }, '#2E3A36');
        // el asa negra y el pitorro
        rect(g, cx + 7, abajo - 22, 4, 2, '#222'); rect(g, cx + 9, abajo - 22, 2, 8, '#222'); rect(g, cx + 7, abajo - 16, 4, 2, '#222');
        rect(g, cx - 10, abajo - 21, 3, 2, SOMBRA); rect(g, cx - 11, abajo - 22, 2, 1, SOMBRA);
        // el vapor, que sube y se mece
        const v = Math.floor(t * 4) % 4;
        for (let k = 0; k < 5; k++) rect(g, cx - 11 + Math.round(Math.sin((k + v) * 1.4)), abajo - 25 - k * 3, 1, 2, k > 2 ? '#F4F2EC' : '#E2E7E5');
      }
    } },
    // el cliente, en el suelo delante de todo
    { anima: pintaCliente },
  ],
};
