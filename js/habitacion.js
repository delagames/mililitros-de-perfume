// De noche, en la habitación de Morty (lo pidió Jorge): la escena de cuando el Señor Mililitros escribe o
// llama de madrugada y le despierta. A oscuras, con la luz de la luna por la ventana: la cama con la
// manta del Málaga, Morty dormido de lado (el último fotograma de su animación de caer), Gengar a los
// pies de la cama (pista del final) y el móvil en la mesilla, que vibra y alumbra la pared.
import { rect, caja, forma, degradado, halo } from './pixel.js';
import { fotograma, DIR } from './sprites.js';

// los sprites pequeños de Morty (con «Faint») y de Gengar; los pone main.js al empezar
export const deNoche = { morty: null, gengar: null };

const MADERA = '#4A3020', NEGRO = '#0A0A0A';

function cuarto(g, P, d, img = {}) {
  const { W, H, ox, oy } = d;
  degradado(g, 0, 0, W, H, '#0B1324', '#18263C');
  g.translate(ox, oy);
  const izq = d.izq, ancho = d.der - d.izq, fondo = H - oy;
  // el suelo de madera
  rect(g, izq, 196, ancho, fondo - 196, '#2A1C14');
  for (let y = 203; y < fondo; y += 7) rect(g, izq, y, ancho, 1, '#21150E');
  rect(g, izq, 196, ancho, 2, '#140C08');
  // la ventana, con la noche, la luna y unas estrellas; su luz en el suelo
  caja(g, 24, 58, 60, 74, NEGRO, null, 0);
  caja(g, 26, 60, 56, 70, '#0F2140', null, 0);
  for (const [x, y] of [[6, 8], [40, 14], [14, 40], [46, 52], [30, 26]]) rect(g, 26 + x, 60 + y, 1, 1, '#FFF3C4');
  forma(g, 56, 66, 14, 14, (x, y) => ((x - 7) ** 2 + (y - 7) ** 2 <= 42 && (x - 10) ** 2 + (y - 5) ** 2 > 30 ? '#FFF3C4' : null));
  rect(g, 53, 60, 2, 70, NEGRO); rect(g, 26, 94, 56, 2, NEGRO);
  halo(g, 70, 210, 46, 9, '#26364F', 0.7);
  // el escudo del Málaga, enmarcado, encima de la cama
  if (img.escudo) {
    caja(g, 126, 22, img.escudo.width + 8, img.escudo.height + 8, '#2A1C14', NEGRO, 0);
    g.drawImage(img.escudo, 130, 26);
    g.fillStyle = 'rgba(8, 14, 30, 0.45)'; g.fillRect(130, 26, img.escudo.width, img.escudo.height);   // (a oscuras)
  }
  // la bufanda del Málaga, colgada en la pared
  for (let k = 0; k < 64; k += 8) rect(g, 112 + k, 76, 8, 9, (k / 8) % 2 ? '#22406A' : '#9AA3AE');
  rect(g, 112, 75, 64, 1, NEGRO); rect(g, 112, 85, 64, 1, NEGRO);
  for (let k = 0; k < 4; k++) { rect(g, 113 + k * 2, 86, 1, 4, '#9AA3AE'); rect(g, 169 + k * 2, 86, 1, 4, '#22406A'); }
  // la mesilla
  caja(g, 214, 168, 36, 28, '#3A2618', NEGRO, 2);
  rect(g, 218, 178, 28, 1, '#2A1A10'); rect(g, 230, 183, 4, 2, '#6B4A33');
  // la cama: el piecero a la izquierda, el cabecero a la derecha (la almohada, en ese lado)
  caja(g, 196, 126, 12, 70, MADERA, NEGRO, 2);
  caja(g, 66, 150, 10, 46, MADERA, NEGRO, 2);
  caja(g, 72, 168, 128, 14, '#C9C3B6', NEGRO, 1);
  rect(g, 76, 182, 4, 14, MADERA); rect(g, 190, 182, 4, 14, MADERA);
  caja(g, 166, 157, 28, 12, '#DDD8CC', NEGRO, 3);
}

function dormidos(g, t, ctx, d) {
  g.translate(d.ox, d.oy);
  // Morty, tumbado de lado con la cabeza en la almohada
  if (deNoche.morty) {
    const f = fotograma(deNoche.morty, 'Faint', 0.8, DIR.right);
    g.drawImage(f.img, f.sx, f.sy, f.w, f.h, 134, 133, f.w, f.h);
  }
  // la manta del Málaga, por encima: solo asoma la cabeza
  for (let x = 74; x < 166; x += 10) rect(g, x, 160, Math.min(10, 166 - x), 22, ((x - 74) / 10) % 2 ? '#22406A' : '#AEB6C0');
  rect(g, 74, 159, 92, 1, NEGRO); rect(g, 165, 159, 1, 23, NEGRO);
  // Gengar, a los pies de la cama, mirando
  if (deNoche.gengar) {
    const f = fotograma(deNoche.gengar, 'Idle', t, DIR.downRight);
    g.drawImage(f.img, f.sx, f.sy, f.w, f.h, 34, 196 - 58, f.w, f.h);
  }
  // el móvil en la mesilla: vibra y alumbra la pared, a ratos
  const suena = t % 2.2 < 1.4;
  const dx = suena ? Math.round(Math.sin(t * 60)) : 0;
  if (suena) halo(g, 232, 160, 34, 26, '#2C5A70', 0.55);
  rect(g, 226 + dx, 160, 12, 7, NEGRO);
  rect(g, 227 + dx, 161, 10, 5, suena ? '#9FE8FF' : '#2B3A55');
  if (suena) { rect(g, 222 + dx, 158, 1, 3, '#9FE8FF'); rect(g, 241 + dx, 158, 1, 3, '#9FE8FF'); }
}

export const HABITACION = {
  suelo: 214,
  capas: [
    { fija: (g, { P, img }, d) => cuarto(g, P, d, img) },
    { anima: dormidos },
  ],
};
