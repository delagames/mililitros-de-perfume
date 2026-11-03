// La calle vista desde dentro del escaparate (sección 8 de DISEÑO.md). Mundo de 270 de ancho con
// la peana del escaparate en y=228: cielo con su degradado y el sol, la sierra de Mijas al fondo,
// el bloque de enfrente con La Olla de Barro (el bar de verdad) y sus naranjos, la carretera y, en el cristal, el vinilo
// de la tienda visto del revés y los reflejos. Por arriba asoma el toldo menta y a los lados se ve
// la pared de dentro, en penumbra. Aquí pasarán los perros, bailarán y leerá el del periódico (fase 6).
import { pintaPerros } from './perros.js';
import { rect, forma, caja, texto, degradado, halo } from './pixel.js';
import { toldo, frascoMuestra, sombraDe, GOTAS, tienda } from './mostrador.js';

const T = {
  cielo: ['#74D3BA', '#9BE3CF', '#C4F0E3', '#E9FAF5'],
  sierraLejos: '#A9DDD0', sierraCerca: '#8BCBBB', sierraLuz: '#C2E9DE',
  fachada: '#FBFAF6', fachadaSombra: '#E2E6E2', teja: '#B5654A', tejaLuz: '#D07E5E', tejaSombra: '#7E4433',
  acera: '#E4E8E5', aceraSombra: '#C9D0CC', asfalto: '#5C6666', asfaltoLuz: '#68736F',
  dentro: '#8E9E98', dentroOscuro: '#6F7F79', peana: '#F1F1EC',
  hoja: '#4E9A36', hojaLuz: '#7CC95A', cristal: '#2A3654',
};

function cielo(g, P, d) {
  const { W, oy } = d;
  const techo = oy + 30 - pisosDeMas(d) * PISO;                         // la azotea, en el lienzo
  const horizonte = techo + 36, tramo = Math.max(8, Math.ceil(horizonte / 3));
  for (let i = 0; i < 3; i++) degradado(g, 0, i * tramo, W, tramo, T.cielo[i], T.cielo[i + 1]);
  rect(g, 0, Math.min(3 * tramo, horizonte), W, Math.max(0, horizonte - 3 * tramo), T.cielo[3]);
  // el sol, con su halo
  const sx = d.ox + 214, sy = Math.max(d.toldo + 22, techo - 26);
  halo(g, sx, sy, 34, 34, '#F7FCEB', 1);
  forma(g, sx - 8, sy - 8, 17, 17, (x, y) => (x - 8) ** 2 + (y - 8) ** 2 <= 64 ? ((x - 8) ** 2 + (y - 8) ** 2 > 40 ? '#FFF1B8' : '#FFF8DA') : null);
  // la sierra de Mijas al fondo, en dos planos
  forma(g, 0, techo - 12, W, 50, (x, y) => {
    const wx = x - d.ox;
    const lejos = 16 + 9 * Math.sin(wx * 0.028) + 5 * Math.sin(wx * 0.071 + 1.3);
    const cerca = 30 + 6 * Math.sin(wx * 0.045 + 2) + 3 * Math.sin(wx * 0.13);
    if (y >= cerca) return T.sierraCerca;
    if (y >= lejos) return y < lejos + 1 ? T.sierraLuz : T.sierraLejos;
    return null;
  });
}

// Nubes (sin contorno, que son fondo), hechas una vez y desplazadas despacio
let nubes = null;
function hazNube(P, w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true });
  forma(g, 0, 0, w, h, (x, y) => {
    const a = ((x - w * 0.35) / (w * 0.35)) ** 2 + ((y - h * 0.55) / (h * 0.5)) ** 2;
    const b = ((x - w * 0.65) / (w * 0.32)) ** 2 + ((y - h * 0.6) / (h * 0.42)) ** 2;
    if (a > 1 && b > 1) return null;
    return y > h * 0.72 ? '#D5F4EA' : P.blanco;
  });
  return c;
}
function nubesAnima(g, t, { P }, d) {
  nubes ??= [[hazNube(P, 34, 12), 20, 0.25, 2.2], [hazNube(P, 24, 9), 160, 0.6, 1.6], [hazNube(P, 40, 14), 250, 0.05, 2.8]];
  const alto = Math.max(10, d.oy + 30);
  for (const [c, x0, f, v] of nubes) {
    const x = Math.round(((x0 + t * v) % (d.W + 60)) - 50);
    g.drawImage(c, x, Math.round(d.toldo + 8 + f * alto));
  }
}

// El bloque de enfrente, como el de verdad (assets/ref/olla-de-barro-fachada.jpg): fachada blanca
// con balcones de losa verde y barandilla negra, persianas enrollables beige y, abajo, La Olla de Barro
const V = {
  verde: '#2F8A3E', verdeOscuro: '#1F6B2E', verdeLuz: '#4FA85A', verdeHondo: '#174F22',
  beige: '#D8CCB0', beigeRaya: '#BFB396', beigeBorde: '#8E8470',
  rojo: '#B0281A', rojoOscuro: '#8B2314', gris: '#9AA5A1', grisJunta: '#86918D', grisOscuro: '#4A5555',
  pollo: '#D88A3C', polloLuz: '#F0B060', polloBorde: '#7A4A1E',
};

// Losa de balcón verde de lado a lado (canto verde y sombra debajo)
function losa(g, x, y, w) {
  rect(g, x, y, w, 4, V.verde);
  rect(g, x, y, w, 1, V.verdeLuz);
  rect(g, x, y + 4, w, 1, V.verdeOscuro);
  forma(g, x, y + 5, w, 2, (px, py) => (px + py) % 2 === 0 ? T.fachadaSombra : null);
}

function barandilla(g, P, x, y, w, h) {
  rect(g, x, y, w, 1, P.negro);
  for (let bx = x; bx < x + w; bx += 3) rect(g, bx, y, 1, h, P.negro);
}

// Ventana con la persiana enrollable beige (por defecto a dos tercios; cada vecino la tiene a su gusto)
function ventana(g, P, x, y, w, h, cuanto = 0.66) {
  caja(g, x, y, w, h, T.cristal, P.negro, 0);
  const baja = Math.max(2, Math.round(h * cuanto));
  for (let py = y + 1; py < y + baja; py += 2) { rect(g, x + 1, py, w - 2, 1, V.beige); rect(g, x + 1, py + 1, w - 2, 1, V.beigeRaya); }
  rect(g, x + 1, y + baja, w - 2, 1, V.beigeBorde);
  rect(g, x + w - 6, y + baja + 3, 2, h - baja - 5, '#4A5C88');
}

// El bloque es alto, como en la foto: tantos pisos como quepan dejando cielo arriba para el sol
const PISO = 58;
export function pisosDeMas(d) { return Math.max(0, Math.floor((d.oy + 30 - 86 - d.toldo) / PISO)); }

function edificio(g, P, d) {
  const w = d.der - d.izq, extra = pisosDeMas(d);
  // los pisos de arriba: barandillas, losas verdes y ventanas con la persiana a medias
  for (let k = extra; k >= 1; k--) {
    const y = 44 - k * PISO;
    rect(g, d.izq, y + 5, w, PISO, T.fachada);
    for (const x of [12, 115, 218]) {
      ventana(g, P, x, y + 16, 40, 40, [0.66, 0.95, 0.3, 0.5, 0.8][(x + k * 7) % 5]);
      barandilla(g, P, x - 3, y + 46, 46, 14);
    }
    losa(g, d.izq, y + PISO, w);
  }
  // el último, con la barandilla de la azotea contra el cielo
  const tope = 44 - extra * PISO;
  rect(g, d.izq, tope - 4, w, 6, T.fachada);
  barandilla(g, P, d.izq + 2, tope - 14, w - 4, 10);
  losa(g, d.izq, tope, w);
  if (!extra) rect(g, d.izq, 40, w, 4, T.fachada);
  // fachada encalada del primer piso
  rect(g, d.izq, 49, w, 137, T.fachada);
  degradado(g, d.izq, 49, w, 6, T.fachadaSombra, T.fachada);
  // ventanas de los lados con su balconcito
  for (const x of [12, 218]) {
    ventana(g, P, x, 60, 40, 40);
    barandilla(g, P, x - 3, 90, 46, 14);
    losa(g, x - 5, 104, 50);
  }
  // el balcón del centro, con el rótulo colgado de la barandilla
  barandilla(g, P, 64, 54, 142, 10);
  rotuloOlla(g, P, 66, 62);
  // la losa verde corrida sobre la planta baja
  losa(g, d.izq, 110, w);
}

// El rótulo: blanco con filo rojo, la casita con la olla, el nombre y «comida casera»
function rotuloOlla(g, P, x, y) {
  const w = 138, h = 40;
  rect(g, x + 2, y + h, w, 2, T.fachadaSombra);
  caja(g, x, y, w, h, P.blanco, V.rojoOscuro, 0);
  rect(g, x + 1, y + 1, w - 2, 1, V.rojo);
  rect(g, x + 1, y + h - 2, w - 2, 1, V.rojo);
  // la casita roja con chimenea, la olla blanca y el humo
  forma(g, x + 4, y + 6, 26, 28, (px, py) => {
    if (py >= 12) return px >= 3 && px <= 22 ? V.rojo : null;
    if (px >= 17 && px <= 19 && py >= 3) return V.rojo;                   // chimenea
    return Math.abs(px - 12.5) <= py + 1 ? V.rojo : null;                 // tejado
  });
  rect(g, x + 13, y + 22, 8, 2, P.blanco);                               // tapa
  rect(g, x + 16, y + 21, 2, 1, P.blanco);
  rect(g, x + 10, y + 24, 14, 1, P.blanco);
  rect(g, x + 11, y + 25, 12, 6, P.blanco);                              // olla
  for (const sx of [13, 17, 21]) { rect(g, x + sx, y + 13, 1, 2, P.blanco); rect(g, x + sx - 1, y + 15, 1, 2, P.blanco); rect(g, x + sx, y + 17, 1, 2, P.blanco); }
  texto(g, 'La Olla de Barro', x + 84, y + 15, { font: 'bold 12px "Pixelify Sans"', color: V.rojo, align: 'center' });
  texto(g, 'COMIDA CASERA', x + 84, y + 25, { font: '8px Silkscreen', color: P.negro, align: 'center' });
  texto(g, 'ASADOR', x + 84, y + 34, { font: '8px Silkscreen', color: P.negro, align: 'center' });
}

function bar(g, P) {
  // zócalo gris
  rect(g, 0, 176, 236, 10, V.gris);
  rect(g, 0, 176, 236, 1, V.grisJunta);
  for (let x = 4; x < 236; x += 12) rect(g, x, 176, 1, 10, V.grisJunta);
  // la carta en el pilar de la izquierda
  caja(g, 40, 122, 18, 52, P.blanco, P.negro, 0);
  rect(g, 43, 126, 12, 1, V.rojo);
  for (let y = 129; y < 170; y += 3) rect(g, 43, y, 8 + ((y * 7) % 5), 1, V.gris);
  // la puerta verde de madera, con su escalón
  caja(g, 60, 122, 24, 54, V.verdeOscuro, P.negro, 0);
  rect(g, 61, 123, 1, 52, V.verde);
  for (const [py, ph] of [[126, 20], [150, 22]]) {
    rect(g, 64, py, 16, ph, V.verde);
    rect(g, 64, py, 16, 1, V.verdeLuz);
    rect(g, 64, py + ph - 1, 16, 1, V.verdeHondo);
  }
  rect(g, 80, 148, 2, 4, '#C9B26A');
  rect(g, 58, 176, 28, 4, V.grisJunta);
  // el escaparate, con la vitrina de los pollos asados
  caja(g, 88, 132, 90, 44, T.cristal, P.negro, 0);
  halo(g, 133, 140, 44, 12, '#4A4E5E', 1);
  for (let bx = 94; bx < 172; bx += 9) { rect(g, bx, 140, 3, 7, P.verde_tinta); rect(g, bx + 1, 138, 1, 2, P.verde_tinta); }
  rect(g, 89, 148, 88, 1, P.madera_oscura);
  caja(g, 96, 155, 74, 19, '#C9D6D2', P.negro, 0);
  for (const px of [100, 114, 128, 142, 156]) {
    forma(g, px, 158, 11, 7, (x, y) => ((x - 5) / 5.5) ** 2 + ((y - 3.5) / 3.5) ** 2 <= 1 ? (y < 3 && x < 6 ? V.polloLuz : V.pollo) : null, V.polloBorde);
  }
  rect(g, 97, 167, 72, 6, '#E8EEEC');
  rect(g, 97, 167, 72, 1, P.blanco);
  // toldillo gris recogido y el cartel redondo colgando
  caja(g, 84, 124, 98, 7, V.grisOscuro, P.negro, 0);
  for (let x = 88; x < 180; x += 8) rect(g, x, 125, 4, 5, '#5C6666');
  rect(g, 85, 131, 96, 1, '#2E3636');
  rect(g, 90, 115, 1, 3, P.negro);
  forma(g, 85, 117, 11, 11, (x, y) => {
    const r = Math.hypot(x - 5, y - 5);
    return r <= 5.2 ? (r <= 3 ? P.gota_dulce : P.blanco) : null;
  }, P.negro);
  // a la derecha: el ventanuco con su cartel y la rejilla blanca
  rect(g, 178, 116, 8, 60, T.fachadaSombra);
  rect(g, 180, 138, 4, 5, V.rojo);
  caja(g, 188, 124, 30, 30, T.cristal, P.negro, 0);
  caja(g, 194, 128, 18, 22, P.blanco, P.negro, 0);
  forma(g, 197, 131, 12, 9, (x, y) => ((x - 5.5) / 6) ** 2 + ((y - 4) / 4.5) ** 2 <= 1 ? V.rojo : null);
  rect(g, 197, 143, 12, 1, V.rojo);
  rect(g, 197, 146, 9, 1, V.gris);
  caja(g, 188, 156, 32, 20, P.blanco, P.negro, 0);
  for (let y = 158; y < 175; y += 2) rect(g, 189, y, 30, 1, T.aceraSombra);
  // el edificio de al lado, a partir de aquí
  rect(g, 236, 116, 34, 70, T.fachada);
  rect(g, 236, 116, 1, 70, T.fachadaSombra);
}

function terraza(g, P) {
  // la pizarra de caballete, con el menú del día
  rect(g, 208, 186, 2, 8, P.madera_oscura);
  rect(g, 240, 186, 2, 8, P.madera_oscura);
  caja(g, 204, 150, 42, 37, P.negro, P.madera, 0);
  texto(g, 'MENÚ', 225, 162, { font: '8px Silkscreen', color: P.blanco, align: 'center' });
  texto(g, 'DEL DÍA', 225, 171, { font: '8px Silkscreen', color: P.blanco, align: 'center' });
  texto(g, '9,21', 225, 181, { font: '8px Silkscreen', color: P.gota_dulce, align: 'center' });
  // una mesa con dos sillas (la del perro del periódico, en la fase 6)
  const x = 132;
  forma(g, x - 4, 192, 28, 4, (px, py) => (px + py) % 2 === 0 ? T.aceraSombra : null);
  for (const sx of [x - 9, x + 21]) {
    rect(g, sx, 176, 1, 18, P.negro);
    rect(g, sx + 6, 184, 1, 10, P.negro);
    rect(g, sx, 184, 7, 2, P.negro);
  }
  caja(g, x - 2, 175, 24, 4, '#D9DEDB', P.negro, 1);
  rect(g, x - 1, 176, 22, 1, P.blanco);
  rect(g, x + 9, 179, 2, 14, P.negro);
  rect(g, x + 5, 193, 10, 1, P.negro);
  // naranjos en sus alcorques, a los dos lados, como en la foto
  for (const cx of [20, 256]) naranjo(g, P, cx);
}

function naranjo(g, P, cx) {
  forma(g, cx - 20, 192, 44, 5, (px, py) => (px + py) % 2 === 0 ? T.aceraSombra : null);
  rect(g, cx - 8, 191, 16, 4, P.madera_oscura);
  rect(g, cx - 2, 150, 4, 42, P.madera_oscura);
  rect(g, cx - 2, 150, 1, 42, P.madera);
  forma(g, cx - 18, 118, 36, 36, (x, y) => {
    const dd = ((x - 17.5) / 17.5) ** 2 + ((y - 17.5) / 17.5) ** 2;
    if (dd > 1) return null;
    if ((x * 7 + y * 13 + cx) % 23 === 0 && dd < 0.8) return P.gota_citrico;
    return (x - 17.5) + (y - 17.5) * 1.2 < -8 ? T.hojaLuz : (y > 24 || x > 28 ? '#3D7F2A' : T.hoja);
  }, P.negro);
}

function acera(g, P, d) {
  const w = d.der - d.izq;
  rect(g, d.izq, 186, w, 12, T.acera);
  for (let x = d.izq - (d.izq % 16) + 6; x < d.der; x += 16) rect(g, x, 186, 1, 12, T.aceraSombra);
  rect(g, d.izq, 192, w, 1, T.aceraSombra);
  rect(g, d.izq, 197, w, 2, '#9AA5A1');
  // carretera con la línea discontinua
  rect(g, d.izq, 199, w, 25, T.asfalto);
  forma(g, d.izq, 199, w, 25, (x, y) => (x * 7 + y * 13) % 29 === 0 ? T.asfaltoLuz : null);
  for (let x = d.izq - (d.izq % 18) + 2; x < d.der; x += 18) rect(g, x, 211, 10, 1, P.blanco);
  rect(g, d.izq, 224, w, 4, T.acera);
  rect(g, d.izq, 224, w, 1, P.blanco);
}

// El vinilo del cristal, visto desde dentro: el nombre al revés y las siete gotas
function vinilo(g, P) {
  texto(g, 'Mililitros', 182, 221, { font: '22px "Caveat Brush"', color: P.blanco, align: 'center', espejo: true });
  GOTAS.forEach((c, i) => forma(g, 22 + i * 12, 206, 7, 10, (x, y) => {
    const dx = x - 3, dy = y - 3;
    if (y <= 3) return dx * dx + dy * dy <= 10 ? P[c] : null;
    return Math.abs(dx) <= (9 - y) * 0.55 ? P[c] : null;
  }));
}

// Reflejos en diagonal sobre todo el cristal
function reflejos(g, P, d) {
  forma(g, 4, -d.oy, 262, d.oy + 228, (x, y) => {
    // dos rayas cortas por cada franja, solo en un tramo de la altura
    const k = (x + y * 0.55) % 150, tramo = Math.floor((x + y * 0.55) / 150);
    const yy = y + d.oy, centro = 60 + (tramo * 70) % 140;
    if (Math.abs(yy - centro) > 26) return null;
    return (k < 2 || (k > 6 && k < 7)) && (x + y) % 2 === 0 ? P.blanco : null;
  });
}

// La tienda por dentro alrededor del cristal: marco, pared en penumbra, toldo y peana
function marco(g, P, d) {
  const arriba = -d.oy, H = d.H - d.oy;
  // pared de dentro a los lados, más oscura cuanto más lejos del cristal
  if (d.izq < 0) degradado(g, d.izq, arriba, -d.izq, H, T.dentroOscuro, T.dentro);
  if (d.der > 270) degradado(g, 270, arriba, d.der - 270, H, T.dentro, T.dentroOscuro);
  for (const x of [0, 266]) { rect(g, x, arriba, 4, 228 - arriba, P.negro); rect(g, x + 1, arriba, 1, 228 - arriba, '#333'); }
  toldo(g, P, 4, arriba, 262, P.menta, tienda.tiene('toldo') ? P.blanco : P.menta_oscura, 10, d.toldo);   // (el toldo nuevo, menta y blanco)
  // peana del escaparate: tablero claro y base negra con frascos expuestos
  rect(g, d.izq, 228, d.der - d.izq, 6, T.peana);
  rect(g, d.izq, 228, d.der - d.izq, 1, P.negro);
  rect(g, d.izq, 233, d.der - d.izq, 1, T.aceraSombra);
  rect(g, d.izq, 234, d.der - d.izq, H - 234, P.negro);
  rect(g, d.izq, 235, d.der - d.izq, 1, '#333');
  frascoMuestra(g, P, 30, 233, P.gota_fresco, sombraDe(P.gota_fresco));
  frascoMuestra(g, P, 44, 233, P.gota_floral, sombraDe(P.gota_floral));
  caja(g, 234, 214, 16, 20, P.negro, P.negro, 3);
  rect(g, 236, 216, 1, 14, '#4A4A4A');
  rect(g, 238, 209, 8, 5, P.negro);
  rect(g, 240, 222, 4, 4, P.menta);
  frascoMuestra(g, P, 252, 233, P.gota_citrico, sombraDe(P.gota_citrico));
  // maceta con una planta
  caja(g, 116, 222, 14, 11, P.blanco, P.negro, 1);
  rect(g, 127, 223, 2, 9, '#D9DEDB');
  forma(g, 113, 206, 20, 17, (x, y) => ((x - 9.5) / 9.5) ** 2 + ((y - 8) / 8.5) ** 2 <= 1 ? (x + y < 12 ? T.hojaLuz : y > 10 ? '#3D7F2A' : T.hoja) : null, P.negro);
}

export const CALLE = {
  suelo: 238,
  capas: [
    { fija: (g, { P }, d) => cielo(g, P, d) },
    { anima: nubesAnima },
    { fija: (g, { P }, d) => {
      g.translate(d.ox, d.oy);
      edificio(g, P, d);
      bar(g, P);
      acera(g, P, d);
      terraza(g, P);
    } },
    // los perros, entre la calle y el cristal
    { anima: pintaPerros },
    { fija: (g, { P }, d) => {
      g.translate(d.ox, d.oy);
      vinilo(g, P);
      reflejos(g, P, d);
      marco(g, P, d);
    } },
  ],
};
