// Herramientas de dibujo en pixel art sobre el lienzo de baja resolución: rectángulos,
// formas con contorno de 1 px, tramado y texto sin suavizado (umbral sobre el alfa).

export function rect(g, x, y, w, h, c) {
  g.fillStyle = c;
  g.fillRect(x, y, w, h);
}

function rgb(hex) {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

// Cifras en pixel de 3×5, muy claras (en Silkscreen a 8 px el 0, el 6, el 8 y el 9 se confundían):
// para los números pequeños (lo que queda de cada bote, el frasco, el estante, la caja, las monedas).
// (x, y): arriba; align 'left' | 'center' | 'right'; escala: cada píxel de la cifra, de escala×escala
const CIFRAS = {
  0: ['111', '101', '101', '101', '111'], 1: ['010', '110', '010', '010', '111'], 2: ['111', '001', '111', '100', '111'],
  3: ['111', '001', '111', '001', '111'], 4: ['101', '101', '111', '001', '001'], 5: ['111', '100', '111', '001', '111'],
  6: ['111', '100', '111', '101', '111'], 7: ['111', '001', '001', '010', '010'], 8: ['111', '101', '111', '101', '111'],
  9: ['111', '101', '111', '001', '111'], '/': ['001', '001', '010', '100', '100'], '-': ['000', '000', '111', '000', '000'],
  ',': ['0', '0', '0', '1', '1'], '.': ['0', '0', '0', '0', '1'], ' ': ['00', '00', '00', '00', '00'],
  '%': ['101', '001', '010', '100', '101'], '€': ['0111', '1000', '1110', '1000', '0111'],
};
export function cifras(g, str, x, y, { color = '#111111', align = 'left', escala = 1 } = {}) {
  const glifos = [...String(str)].map(ch => CIFRAS[ch]).filter(Boolean);
  const ancho = (glifos.reduce((a, gl) => a + gl[0].length + 1, 0) - 1) * escala;
  let cx = Math.round(align === 'center' ? x - ancho / 2 : align === 'right' ? x - ancho : x);
  g.fillStyle = color;
  for (const gl of glifos) {
    gl.forEach((fila, fy) => [...fila].forEach((b, fx) => { if (b === '1') g.fillRect(cx + fx * escala, y + fy * escala, escala, escala); }));
    cx += (gl[0].length + 1) * escala;
  }
}

// Matriz de Bayer 4×4 para el tramado ordenado (degradados y halos de luz)
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16);
export const umbralBayer = (x, y) => BAYER[(y & 3) * 4 + (x & 3)];

// Pinta una forma píxel a píxel: «color(x, y)» devuelve el color de ese píxel (o null si queda fuera).
// Los píxeles de la forma que tocan el exterior se pintan con el contorno (si lo hay).
// Respeta el desplazamiento del lienzo (g.translate), que getImageData no tiene en cuenta.
export function forma(g, x0, y0, w, h, color, contorno = null) {
  if (w <= 0 || h <= 0) return;
  const m = g.getTransform();
  x0 += m.e; y0 += m.f;
  const img = g.getImageData(x0, y0, w, h);
  const d = img.data;
  const dentro = (x, y) => x >= 0 && y >= 0 && x < w && y < h && color(x, y) !== null;
  const cache = new Map();
  const toRgb = c => { if (!cache.has(c)) cache.set(c, rgb(c)); return cache.get(c); };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const c = color(x, y);
      if (c === null) continue;
      const borde = contorno && !(dentro(x - 1, y) && dentro(x + 1, y) && dentro(x, y - 1) && dentro(x, y + 1));
      const [r, gg, b] = toRgb(borde ? contorno : c);
      const i = (y * w + x) * 4;
      d[i] = r; d[i + 1] = gg; d[i + 2] = b; d[i + 3] = 255;
    }
  }
  g.putImageData(img, x0, y0);
}

// Rectángulo con contorno y esquinas recortadas (r = píxeles de escalón)
export function caja(g, x, y, w, h, fill, contorno, r = 1) {
  forma(g, x, y, w, h, (px, py) => {
    const dx = Math.min(px, w - 1 - px), dy = Math.min(py, h - 1 - py);
    return dx + dy < r ? null : fill;
  }, contorno);
}

// Tramado de dos colores en damero (solo para cielo y fondos de retrato, según la guía)
export function tramado(g, x, y, w, h, a, b) {
  rect(g, x, y, w, h, a);
  g.fillStyle = b;
  for (let py = y; py < y + h; py++)
    for (let px = x + ((py + x) & 1); px < x + w; px += 2) g.fillRect(px, py, 1, 1);
}

// Degradado vertical de «arriba» a «abajo» con tramado ordenado (cielos y paredes en sombra)
export function degradado(g, x, y, w, h, arriba, abajo) {
  forma(g, x, y, w, h, (px, py) => umbralBayer(px + x, py + y) < (py + 0.5) / h ? abajo : arriba);
}

// Halo de luz tramado: más denso en el centro y deshaciéndose hacia el borde de la elipse
export function halo(g, cx, cy, rx, ry, color, fuerza = 0.6) {
  const x0 = Math.floor(cx - rx), y0 = Math.floor(cy - ry);
  forma(g, x0, y0, Math.ceil(rx * 2), Math.ceil(ry * 2), (px, py) => {
    const d = Math.hypot((px + x0 - cx) / rx, (py + y0 - cy) / ry);
    return d < 1 && umbralBayer(px + x0, py + y0) < (1 - d) * fuerza ? color : null;
  });
}

// Texto sin suavizado: se escribe en un lienzo aparte y se deja cada píxel opaco o vacío.
// Se guarda en caché por texto, fuente y color. «espejo» lo pinta del revés (vinilo visto desde dentro).
const textos = new Map();
export function texto(g, str, x, y, { font = '16px "Pixelify Sans"', color = '#111111', align = 'left', espejo = false, umbral = 110 } = {}) {
  const key = `${str}|${font}|${color}|${espejo}|${umbral}`;
  let t = textos.get(key);
  if (!t) {
    const m = document.createElement('canvas').getContext('2d');
    m.font = font;
    const met = m.measureText(str);
    const asc = Math.ceil(met.actualBoundingBoxAscent), desc = Math.ceil(met.actualBoundingBoxDescent);
    const left = Math.ceil(met.actualBoundingBoxLeft);
    const w = Math.max(1, Math.ceil(met.actualBoundingBoxRight) + left + 2), h = Math.max(1, asc + desc + 2);
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const cg = c.getContext('2d', { willReadFrequently: true });
    cg.font = font;
    cg.fillStyle = color;
    if (espejo) { cg.translate(w, 0); cg.scale(-1, 1); }
    cg.fillText(str, left + 1, asc + 1);
    const img = cg.getImageData(0, 0, w, h);
    for (let i = 3; i < img.data.length; i += 4) img.data[i] = img.data[i] >= umbral ? 255 : 0;
    cg.putImageData(img, 0, 0);
    t = { c, w, asc: asc + 1 };
    textos.set(key, t);
  }
  const dx = align === 'center' ? Math.round(x - t.w / 2) : align === 'right' ? x - t.w : x;
  g.drawImage(t.c, dx, y - t.asc);
  return t.w;
}
