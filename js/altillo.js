// El altillo de la tienda (lo pidió Jorge): la escena de cuando Morty sube por fin con la escalera
// arreglada y encuentra al asesor dormido en un sillón. Bajo el tejado inclinado, con sus vigas: un
// ventanuco con un haz de luz y polvo, cajas de frascos vacíos, una bombilla colgando y, en un sillón
// viejo, el chihuahua con corbata y su portátil, roncando.
import { rect, caja, forma, degradado, halo, texto } from './pixel.js';

let asesor = null;   // el chihuahua sentado con el portátil (assets/sprites/perros/asesor/pose-8.png)
export function cargaAltillo() {
  return new Promise(ok => {
    const i = new Image();
    i.onload = () => { asesor = i; ok(); };
    i.onerror = () => ok();
    i.src = 'assets/sprites/perros/asesor/pose-8.png';
  });
}

const VIGA = '#3A2416', MADERA = '#6B4A30', NEGRO = '#111111';

function desvan(g, P, d) {
  const { W, H, ox, oy } = d;
  degradado(g, 0, 0, W, H, '#2A1E16', '#4A3626');
  g.translate(ox, oy);
  const izq = d.izq, der = d.der, fondo = H - oy;
  // la pared del fondo, de tablas
  for (let x = izq - (izq % 18); x < der; x += 18) rect(g, x, -oy, 1, fondo + oy, '#3E2C1F');
  // el tejado inclinado a los dos lados, con sus vigas
  forma(g, izq, -oy, der - izq, oy + 150, (x, y) => {
    const wx = x + izq, wy = y - oy;
    const techo = 30 + Math.abs(wx - 135) * 0.75;
    if (wy > techo) return null;
    return (Math.round(wx + wy * 1.3) % 22 < 3) ? VIGA : '#2B1C12';
  });
  // el ventanuco redondo, con su luz entrando en diagonal
  forma(g, 120, 40, 30, 30, (x, y) => {
    const r = Math.hypot(x - 15, y - 15);
    return r <= 14 ? (r > 12 ? VIGA : x === 15 || y === 15 ? VIGA : '#9FC3E0') : null;
  });
  g.fillStyle = 'rgba(255, 240, 200, 0.10)';
  g.beginPath(); g.moveTo(124, 60); g.lineTo(146, 52); g.lineTo(206, 196); g.lineTo(150, 196); g.closePath(); g.fill();
  // el suelo de tablones
  rect(g, izq, 196, der - izq, fondo - 196, '#5A3E2A');
  for (let y = 202; y < fondo; y += 8) rect(g, izq, y, der - izq, 1, '#4A3020');
  rect(g, izq, 196, der - izq, 2, '#2E1C12');
  // cajas de frascos vacíos, apiladas
  for (const [x, y, w, h] of [[14, 160, 40, 36], [20, 128, 32, 32], [56, 172, 30, 24], [218, 166, 38, 30], [226, 140, 28, 26]]) {
    caja(g, x, y, w, h, '#B0844F', NEGRO, 1);
    rect(g, x + 1, y + Math.round(h / 2), w - 2, 1, '#8E6A3C');
    rect(g, x + Math.round(w / 2) - 4, y + 4, 8, 3, '#E8D7B0');
  }
  // telarañas en las esquinas del tejado
  for (let k = 0; k < 6; k++) { rect(g, 70 + k * 3, 80 - k * 2, 1, 1, '#9A8E80'); rect(g, 196 - k * 3, 80 - k * 2, 1, 1, '#9A8E80'); }
  // el sillón viejo
  caja(g, 104, 140, 64, 40, '#7A3A2E', NEGRO, 4);
  caja(g, 98, 158, 14, 30, '#6A2E24', NEGRO, 3);
  caja(g, 160, 158, 14, 30, '#6A2E24', NEGRO, 3);
  caja(g, 108, 170, 56, 18, '#8E4636', NEGRO, 2);
  rect(g, 110, 188, 4, 8, VIGA); rect(g, 158, 188, 4, 8, VIGA);
}

function dormido(g, t, ctx, d) {
  g.translate(d.ox, d.oy);
  // la bombilla, que se mece un poco, con su luz
  const dx = Math.round(Math.sin(t * 1.3) * 2);
  rect(g, 186 + dx, 20, 1, 40, NEGRO);
  halo(g, 186 + dx, 64, 30, 22, '#6E5838', 0.45);
  caja(g, 183 + dx, 60, 7, 8, '#FFE9A0', NEGRO, 2);
  // el asesor, sentado en el sillón con el portátil, roncando
  if (asesor) g.drawImage(asesor, 136 - Math.round(asesor.width / 2), 172 - asesor.height);
  const k = (t * 0.8) % 1;
  texto(g, 'z', 150 + Math.round(k * 8), 132 - Math.round(k * 16), { font: '8px Silkscreen', color: '#E8D7B0', align: 'left' });
  texto(g, 'Z', 156 + Math.round(k * 10), 122 - Math.round(k * 18), { font: '16px Silkscreen', color: '#E8D7B0', align: 'left' });
}

export const ALTILLO = {
  suelo: 214,
  capas: [
    { fija: (g, { P }, d) => desvan(g, P, d) },
    { anima: dormido },
  ],
};
