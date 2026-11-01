// Emblema de la pantalla de inicio en pixel art, como el del pino de El Pino Calcinado: una placa
// redonda con el frasco negro del logo y su gota Poké Ball. Se pinta a 64×64 y se ve a ×3.
import { rect, forma, caja, degradado } from './pixel.js';

export function pintaEmblema(canvas, P) {
  const g = canvas.getContext('2d', { willReadFrequently: true });
  const c = 31.5;
  // fondo de la placa: degradado menta con tramado, y sus anillos
  degradado(g, 0, 0, 64, 64, P.menta_clara, P.menta);
  forma(g, 0, 0, 64, 64, (x, y) => {
    const r = Math.hypot(x - c, y - c);
    if (r > 31.5) return null;
    if (r > 30.5) return P.negro;
    if (r > 28.5) return P.menta_oscura;
    if (r > 27.5) return P.negro;
    return null;
  });
  // lo de fuera del círculo, transparente
  const img = g.getImageData(0, 0, 64, 64);
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) if (Math.hypot(x - c, y - c) > 31.5) img.data[(y * 64 + x) * 4 + 3] = 0;
  g.putImageData(img, 0, 0);
  // el frasco: tapón, cuello y cuerpo, con su brillo
  caja(g, 25, 9, 14, 9, P.negro, P.negro, 2);
  rect(g, 28, 18, 8, 5, P.negro);
  caja(g, 16, 22, 32, 33, P.negro, P.negro, 6);
  rect(g, 19, 28, 2, 20, '#3A3A3A');
  rect(g, 27, 10, 3, 1, '#3A3A3A');
  // burbujas
  rect(g, 33, 12, 2, 2, P.menta); rect(g, 30, 16, 1, 1, P.menta); rect(g, 32, 19, 2, 2, P.menta);
  // la gota Poké Ball
  forma(g, 26, 31, 12, 17, (x, y) => {
    const dx = x - 5.5, dy = y - 5.5;
    if (y <= 5) return dx * dx + dy * dy <= 31 ? (y === 5 ? P.negro : P.gota_picante) : null;
    if (y === 6) return Math.abs(dx) <= 5.5 ? P.negro : null;
    return Math.abs(dx) <= (16 - y) * 0.55 ? P.menta : null;
  });
  forma(g, 29, 35, 6, 6, (x, y) => {
    const r = Math.hypot(x - 2.5, y - 2.5);
    return r <= 2.6 ? (r <= 1.3 ? P.blanco : P.negro) : null;
  });
}
