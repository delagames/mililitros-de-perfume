// Las dos animaciones de cuento (js/cuento.js), con la historia de la sección 2 de DISEÑO.md:
// - la intro: el vídeo viral de Ciudad Iris, el programa «Cenas Encantadas», el Gengar que le chupa
//   los pies en el bar y el grito, la gira por Johto, el día que lo deja todo, la llegada a
//   Pokealhaurín, la llamada de madrugada, el estudio y la persiana arriba;
// - el final: la persiana abajo, la cerveza con el perro que pasea a su humano, la llamada desde su
//   propio número, la verdad (las noches de Gengar y el Señor Mililitros), aceptarlo, la cuenta con
//   acciones del Málaga y los créditos.
// Los decorados (el escenario) se pintan aquí, cada uno en su caja (w × h); los personajes son los
// dibujos del juego, como pegatinas.

const C = {
  menta: '#50DAB6', mentaOsc: '#2FB894', mentaClara: '#9CE8D3', tinta: '#0E4A3C', negro: '#111111', blanco: '#FFFFFF',
  pared: '#F4F2EC', crema: '#F2E6D0', madera: '#8A5A3C', gris: '#9AA5A1',
  gotas: ['#E7584A', '#F29B2E', '#F4D23C', '#6CBF4A', '#3E8FD6', '#7B5BC2', '#E4679B'],
};
const morty = c => `assets/portraits/morty/${c}.png`;
const R = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
const O = (g, x, y, r, c) => { g.fillStyle = c; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); };
const E = (g, x, y, rx, ry, c) => { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fill(); };
const T = (g, s, x, y, fuente, c, alinea = 'center') => { g.font = fuente; g.fillStyle = c; g.textAlign = alinea; g.fillText(s, x, y); };

// ---------- decorados de la calle ----------
const sol = (r = 26) => ({ w: r * 2 + 24, h: r * 2 + 24, dibujo: g => {
  const c = r + 12;
  g.fillStyle = '#FFD45A';
  for (let i = 0; i < 12; i++) { g.save(); g.translate(c, c); g.rotate(i * Math.PI / 6); g.fillRect(-3, -c, 6, 12); g.restore(); }
  O(g, c, c, r, '#FFC93C'); O(g, c - 6, c - 6, r * 0.55, '#FFE08A');
} });
const nube = (w = 90) => ({ w, h: w * 0.45, dibujo: g => {
  const h = w * 0.45;
  E(g, w * 0.5, h * 0.62, w * 0.48, h * 0.36, '#FFFFFF');
  O(g, w * 0.34, h * 0.48, h * 0.32, '#FFFFFF'); O(g, w * 0.6, h * 0.38, h * 0.38, '#FFFFFF');
  E(g, w * 0.5, h * 0.8, w * 0.42, h * 0.12, '#E3F4F7');
} });
const sierra = (color = '#7FB88A', luz = '#9BCB9F') => ({ w: 420, h: 90, sinBorde: true, dibujo: g => {
  g.fillStyle = color; g.beginPath(); g.moveTo(0, 90);
  for (let x = 0; x <= 420; x += 10) g.lineTo(x, 50 - Math.sin(x / 47) * 22 - Math.sin(x / 19) * 8);
  g.lineTo(420, 90); g.fill();
  g.fillStyle = luz; g.beginPath(); g.moveTo(0, 90);
  for (let x = 0; x <= 420; x += 10) g.lineTo(x, 70 - Math.sin(x / 37 + 2) * 12);
  g.lineTo(420, 90); g.fill();
} });
// La Olla de Barro: fachada crema, el rótulo rojo, la puerta verde y el toldo
const bar = () => ({ w: 160, h: 150, dibujo: g => {
  R(g, 0, 20, 160, 130, C.crema);
  for (let k = 0; k < 3; k++) R(g, 14 + k * 50, 30, 30, 26, '#C9B79A'), R(g, 14 + k * 50, 50, 30, 4, '#3E8E52');
  R(g, 0, 64, 160, 6, '#3E8E52');
  R(g, 20, 72, 120, 22, C.blanco); R(g, 20, 72, 120, 2, '#C0392B'); R(g, 20, 92, 120, 2, '#C0392B');
  T(g, 'La Olla de Barro', 80, 88, 'bold 15px "Caveat Brush"', '#C0392B');
  R(g, 16, 102, 26, 48, '#3E8E52'); R(g, 20, 106, 18, 18, '#4FA463');
  R(g, 54, 104, 90, 34, '#2B3A55'); for (let k = 0; k < 5; k++) E(g, 66 + k * 17, 128, 6, 4, '#E09A4A');
  R(g, 0, 0, 160, 22, '#C9A27A'); R(g, 0, 18, 160, 4, '#A88A62');
} });
// La tienda: el toldo menta, el rótulo y el escaparate (con las siete gotas)
const tienda = () => ({ w: 170, h: 150, dibujo: g => {
  R(g, 0, 26, 170, 124, C.pared);
  for (let k = 0; k < 170; k += 17) R(g, k, 0, 17, 26, (k / 17) % 2 ? C.mentaOsc : C.menta);
  for (let k = 0; k < 170; k += 17) O(g, k + 8.5, 26, 8.5, (k / 17) % 2 ? C.mentaOsc : C.menta);
  R(g, 45, 38, 80, 14, C.negro); T(g, 'Mililitros', 85, 50, 'bold 13px "Caveat Brush"', C.blanco);
  R(g, 16, 58, 102, 82, '#2B3331');
  for (let k = 0; k < 7; k++) { R(g, 24 + k * 13, 104, 8, 16, C.gotas[k]); R(g, 26 + k * 13, 99, 4, 6, C.negro); }
  R(g, 126, 62, 32, 78, C.negro); R(g, 130, 66, 24, 70, '#1B2321'); R(g, 150, 100, 3, 6, C.menta);
  R(g, 0, 140, 170, 10, C.gris);
} });
// La persiana de la tienda, aparte, para que suba o baje delante del escaparate
const persiana = () => ({ w: 104, h: 84, borde: 2, dibujo: g => {
  R(g, 0, 0, 104, 84, C.gris);
  for (let y = 4; y < 84; y += 6) R(g, 0, y, 104, 2, '#7F8C88');
  R(g, 44, 76, 16, 4, '#5C6662');
} });
const naranjo = () => ({ w: 56, h: 92, dibujo: g => {
  R(g, 25, 50, 6, 42, C.madera); R(g, 18, 86, 20, 6, '#6B4A33');
  O(g, 28, 32, 26, '#3E8E52'); O(g, 18, 26, 14, '#4FA463'); O(g, 38, 22, 12, '#4FA463');
  for (const [x, y] of [[14, 36], [36, 40], [26, 18], [44, 30], [20, 46]]) O(g, x, y, 3.5, '#F29B2E');
} });
const farola = () => ({ w: 26, h: 110, dibujo: g => {
  R(g, 11, 20, 4, 90, '#2E3B36'); R(g, 4, 104, 18, 6, '#2E3B36');
  R(g, 3, 6, 20, 16, '#2E3B36'); R(g, 6, 9, 14, 10, '#FFE9A0');
} });

// ---------- decorados de la noche ----------
const luna = () => ({ w: 70, h: 70, dibujo: g => {
  O(g, 35, 35, 30, '#FFF3C4'); O(g, 47, 27, 27, 'rgba(0,0,0,0)');
  g.globalCompositeOperation = 'destination-out'; O(g, 50, 26, 24, '#000'); g.globalCompositeOperation = 'source-over';
  O(g, 22, 44, 4, '#F1E0A0'); O(g, 18, 30, 3, '#F1E0A0');
} });
const estrella = (r = 8, color = '#FFF3C4') => ({ w: r * 2 + 4, h: r * 2 + 4, borde: 2, dibujo: g => {
  g.fillStyle = color; g.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r;
    g.lineTo(r + 2 + Math.cos(a) * rr, r + 2 + Math.sin(a) * rr);
  }
  g.fill();
} });
const lampara = () => ({ w: 90, h: 110, dibujo: g => {
  g.fillStyle = 'rgba(255, 230, 140, 0.55)'; g.beginPath(); g.moveTo(38, 30); g.lineTo(0, 110); g.lineTo(90, 110); g.lineTo(56, 30); g.fill();
  R(g, 44, 34, 4, 70, '#2E3B36'); R(g, 30, 102, 32, 8, '#2E3B36');
  g.fillStyle = '#E7584A'; g.beginPath(); g.moveTo(26, 34); g.lineTo(66, 34); g.lineTo(56, 8); g.lineTo(36, 8); g.fill();
} });
const libros = () => ({ w: 90, h: 64, dibujo: g => {
  const pila = [['#3E8FD6', 4, 48], ['#E7584A', 0, 34], ['#F4D23C', 8, 20], ['#6CBF4A', 2, 6]];
  for (const [c, x, y] of pila) { R(g, x, y, 80, 14, c); R(g, x + 4, y + 3, 60, 2, '#FFFFFF88'); R(g, x + 76, y, 4, 14, '#00000022'); }
} });
const taza = () => ({ w: 40, h: 50, dibujo: g => {
  R(g, 6, 22, 24, 26, C.blanco); R(g, 6, 22, 24, 4, '#6B4A33'); R(g, 30, 28, 8, 12, C.blanco); R(g, 33, 31, 3, 6, '#E6E6E6');
  for (const x of [12, 22]) for (let i = 0; i < 4; i++) R(g, x + (i % 2) * 2, 4 + i * 4, 3, 3, '#FFFFFFAA');
} });
const ventanaNoche = () => ({ w: 120, h: 130, dibujo: g => {
  R(g, 0, 0, 120, 130, '#2B3A55'); R(g, 6, 6, 108, 118, '#16203A');
  for (const [x, y] of [[20, 20], [80, 30], [50, 60], [96, 90], [30, 100]]) R(g, x, y, 2, 2, '#FFF3C4');
  O(g, 84, 40, 12, '#FFF3C4'); R(g, 58, 6, 4, 118, '#2B3A55'); R(g, 6, 62, 108, 4, '#2B3A55');
} });

// ---------- decorados de la tienda por dentro ----------
const estanteria = () => ({ w: 130, h: 190, dibujo: g => {
  R(g, 0, 0, 130, 190, C.negro); R(g, 6, 6, 118, 178, '#2B3331');
  for (let f = 0; f < 4; f++) {
    const y = 44 + f * 44;
    R(g, 6, y, 118, 4, C.negro); R(g, 6, y + 4, 118, 1, '#B8F0E0');
    for (let k = 0; k < 6; k++) { R(g, 14 + k * 18, y - 22, 10, 22, C.negro); R(g, 16 + k * 18, y - 14, 6, 6, C.menta); R(g, 17 + k * 18, y - 28, 4, 6, C.negro); }
  }
} });
const mostrador = () => ({ w: 230, h: 80, dibujo: g => {
  R(g, 0, 0, 230, 12, '#7FE3C6'); R(g, 0, 12, 230, 68, C.menta);
  for (let k = 0; k < 5; k++) R(g, 12 + k * 44, 22, 36, 48, '#46CBA8');
  R(g, 104, 30, 22, 30, C.negro); E(g, 115, 50, 5, 4, C.gotas[0]);
} });
const balda = () => ({ w: 120, h: 30, dibujo: g => {
  R(g, 0, 22, 120, 8, C.mentaOsc);
  C.gotas.forEach((c, k) => { O(g, 12 + k * 16, 14, 6, c); R(g, 10 + k * 16, 2, 4, 6, C.madera); });
} });
const hueco = () => ({ w: 90, h: 100, sinBorde: true, dibujo: g => {
  E(g, 45, 60, 40, 36, 'rgba(123, 91, 194, 0.25)');
  for (let i = 0; i < 10; i++) R(g, 10 + i * 7, 20 + (i * 13) % 70, 3, 3, 'rgba(123, 91, 194, 0.4)');
} });

// ---------- cosas sueltas ----------
const gota = c => ({ w: 34, h: 50, dibujo: g => {
  g.fillStyle = c; g.beginPath(); g.arc(17, 32, 15, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.moveTo(4, 26); g.lineTo(17, 2); g.lineTo(30, 26); g.fill();
  R(g, 9, 26, 4, 6, '#FFFFFF99');
} });
const mapa = () => ({ w: 116, h: 116, dibujo: g => {
  const grd = g.createLinearGradient(0, 0, 116, 0);
  grd.addColorStop(0, '#B9CCEB'); grd.addColorStop(1, '#F0B6B0');
  g.fillStyle = grd; g.fillRect(0, 0, 116, 116);
  R(g, 57, 4, 2, 108, C.blanco); R(g, 4, 57, 108, 2, C.blanco);
  for (let i = 0; i < 8; i++) R(g, 58 + i * 5, 56 - i * 4, 2, 2, C.tinta);
  O(g, 98, 24, 7, C.negro); O(g, 98, 24, 5, C.gotas[0]);
  T(g, 'INTENSO', 58, 14, '8px Silkscreen', C.tinta); T(g, 'SUAVE', 58, 110, '8px Silkscreen', C.tinta);
} });
const pregunta = () => ({ w: 60, h: 90, dibujo: g => { T(g, '?', 30, 80, 'bold 96px "Caveat Brush"', C.tinta); } });
const exclama = (c = '#E7584A') => ({ w: 40, h: 80, dibujo: g => { T(g, '!', 20, 72, 'bold 90px "Caveat Brush"', c); } });
const dinero = () => ({ w: 110, h: 60, dibujo: g => {
  R(g, 0, 10, 70, 38, '#8FB4E0'); R(g, 6, 16, 58, 26, '#A9C7EA'); T(g, '20', 35, 36, 'bold 18px Silkscreen', C.tinta);
  for (const [x, c] of [[78, '#D8C060'], [96, '#C8C8B8'], [86, '#E2B84A']]) { O(g, x, 44, 13, C.negro); O(g, x, 44, 11, c); }
} });
const cerveza = () => ({ w: 26, h: 76, dibujo: g => {
  R(g, 4, 26, 18, 50, '#7A4A1A'); R(g, 8, 4, 10, 24, '#7A4A1A'); R(g, 7, 0, 12, 6, '#C9A227');
  R(g, 4, 40, 18, 16, '#F2EFE6'); T(g, 'M', 13, 52, 'bold 10px Silkscreen', '#C0392B'); R(g, 7, 30, 2, 40, '#B07A3A');
} });
const telefono = (quien = 'Dirección', que = 'llamando…', fondo = '#3E8FD6') => ({ w: 60, h: 110, dibujo: g => {
  R(g, 0, 0, 60, 110, C.negro); R(g, 5, 10, 50, 82, fondo); R(g, 22, 98, 16, 5, '#444');
  T(g, quien, 30, 40, `bold ${quien.length > 9 ? 9 : 11}px "Pixelify Sans"`, C.blanco); T(g, que, 30, 56, '10px "Pixelify Sans"', '#DDEEFF');
  O(g, 18, 78, 7, '#E7584A'); O(g, 42, 78, 7, '#6CBF4A');
} });
const periodico = titular => ({ w: 170, h: 90, dibujo: g => {
  R(g, 0, 0, 170, 90, '#F2EFE6'); T(g, 'EL DIARIO DEL PERRO', 85, 14, '8px Silkscreen', C.negro);
  R(g, 8, 18, 154, 2, C.negro); T(g, titular, 85, 44, 'bold 20px "Caveat Brush"', C.negro);
  for (let k = 0; k < 4; k++) R(g, 10, 56 + k * 8, k % 2 ? 90 : 150, 3, '#9AA0A0');
} });
const sobreCerrado = () => ({ w: 40, h: 28, dibujo: g => {
  R(g, 0, 0, 40, 28, '#E9DFC4'); g.fillStyle = '#C9BC98'; g.beginPath(); g.moveTo(0, 0); g.lineTo(20, 16); g.lineTo(40, 0); g.fill();
  O(g, 20, 16, 4, '#C0392B');
} });
const bufanda = () => ({ w: 110, h: 40, dibujo: g => {
  for (let k = 0; k < 110; k += 14) R(g, k, 10, 14, 20, (k / 14) % 2 ? '#1F5FA8' : C.blanco);
  for (let k = 0; k < 6; k++) R(g, 100 + (k % 2) * 4, 30 + k, 2, 8, '#1F5FA8');
} });

// ---------- Ciudad Iris, la tele, el bar encantado y la gira ----------
// lo mismo, más pequeño (o más grande)
const a = (d, k) => ({ ...d, w: d.w * k, h: d.h * k, dibujo: g => { g.scale(k, k); d.dibujo(g); } });
// una torre de las antiguas, de cuatro pisos con sus tejados
const torre = () => ({ w: 130, h: 230, dibujo: g => {
  const cx = 65;
  for (let i = 0; i < 4; i++) {
    const bw = 66 - i * 12, base = 230 - i * 48;
    R(g, cx - bw / 2, base - 34, bw, 34, '#C8553D');
    for (let k = 0; k < 3; k++) R(g, cx - bw / 2 + 5 + k * (bw - 10) / 3, base - 28, (bw - 10) / 3 - 4, 16, '#7A2E22');
    const rw = bw + 44;
    g.fillStyle = '#3B2A3E'; g.beginPath();
    g.moveTo(cx - rw / 2 - 6, base - 30); g.lineTo(cx + rw / 2 + 6, base - 30); g.lineTo(cx + bw / 2, base - 46); g.lineTo(cx - bw / 2, base - 46); g.fill();
    R(g, cx - rw / 2 - 8, base - 35, 6, 5, '#3B2A3E'); R(g, cx + rw / 2 + 2, base - 35, 6, 5, '#3B2A3E');
  }
  R(g, cx - 2, 6, 4, 40, '#3B2A3E'); O(g, cx, 8, 5, '#F2B33D');
} });
const arbol = (hoja = '#D9572B', luz = '#E8833A') => ({ w: 56, h: 92, dibujo: g => {
  R(g, 25, 50, 6, 42, C.madera);
  O(g, 28, 32, 26, hoja); O(g, 18, 26, 14, luz); O(g, 38, 22, 12, luz);
} });
const tele = () => ({ w: 230, h: 190, dibujo: g => {
  R(g, 0, 0, 230, 170, '#22262A'); R(g, 12, 12, 206, 132, '#3A2350');
  for (let k = 0; k < 9; k++) R(g, 20 + k * 22, 20 + (k * 37) % 90, 3, 3, '#7B5BC288');
  R(g, 12, 118, 206, 26, '#E7584A'); T(g, 'CENAS ENCANTADAS', 115, 136, 'bold 14px Silkscreen', C.blanco);
  O(g, 24, 26, 5, '#E7584A'); T(g, 'EN DIRECTO', 34, 30, '8px Silkscreen', C.blanco, 'left');
  R(g, 100, 170, 30, 10, '#22262A'); R(g, 70, 180, 90, 10, '#22262A');
} });
const plato = (c = '#E09A4A') => ({ w: 64, h: 34, dibujo: g => {
  E(g, 32, 22, 30, 10, C.blanco); E(g, 32, 20, 22, 7, '#E6E6E6'); E(g, 32, 16, 16, 8, c); E(g, 27, 13, 5, 3, '#FFFFFF66');
} });
const farolillo = (c = '#E7584A') => ({ w: 30, h: 56, dibujo: g => {
  R(g, 14, 0, 2, 12, '#2E2230'); E(g, 15, 32, 13, 18, c); R(g, 6, 14, 18, 3, '#2E2230'); R(g, 6, 47, 18, 3, '#2E2230');
  E(g, 11, 28, 4, 9, '#FFFFFF55');
} });
// la mesa del bar, con su mantel, una sopa y una vela (va delante de Morty: le tapa los pies)
const mesa = () => ({ w: 220, h: 84, sinBorde: true, dibujo: g => {
  R(g, 0, 22, 220, 62, '#5B3A6E'); R(g, 0, 22, 220, 8, '#7B5B92');
  for (let k = 0; k < 220; k += 20) R(g, k, 76, 10, 8, '#4A2C5C');
  E(g, 80, 20, 28, 8, '#E6E6E6'); E(g, 80, 16, 22, 5, '#C0392B');
  R(g, 160, 4, 8, 18, '#F2EFE6'); E(g, 164, 3, 3, 4, '#FFD45A');
} });
// un rótulo de tebeo: «¡¡AAAAY!!», «slurp»…
const rotulo = (t, color = '#F4D23C', tam = 48) => ({ w: 30 + t.length * tam * 0.5, h: tam * 1.4, dibujo: g => {
  const w = 30 + t.length * tam * 0.5;
  g.font = `bold ${tam}px "Caveat Brush"`; g.textAlign = 'center';
  g.lineWidth = Math.max(4, tam / 8); g.strokeStyle = C.tinta; g.strokeText(t, w / 2, tam * 1.1);
  T(g, t, w / 2, tam * 1.1, `bold ${tam}px "Caveat Brush"`, color);
} });
const camaraVideo = () => ({ w: 76, h: 48, dibujo: g => {
  R(g, 0, 8, 50, 36, '#222'); R(g, 50, 16, 20, 20, '#333'); O(g, 62, 26, 8, '#4A90C8'); O(g, 60, 24, 3, '#BFE0FF');
  O(g, 10, 17, 4, '#E7584A'); R(g, 14, 0, 20, 8, '#222');
} });
const cartelPueblo = () => ({ w: 150, h: 120, dibujo: g => {
  R(g, 70, 50, 8, 70, '#6B6F6E'); R(g, 0, 0, 150, 56, '#C0392B'); R(g, 5, 5, 140, 46, C.blanco);
  T(g, 'POKEALHAURÍN', 75, 26, 'bold 13px Silkscreen', C.negro); T(g, 'DE LA TORRE', 75, 43, 'bold 11px Silkscreen', C.negro);
} });

// ---------- la habitación, la cuenta y el estadio (el final) ----------
const cama = () => ({ w: 270, h: 120, dibujo: g => {
  R(g, 0, 18, 14, 102, C.madera);                                       // el cabecero
  R(g, 10, 60, 250, 30, '#F2EFE6');                                     // el colchón
  R(g, 20, 42, 50, 24, C.blanco); R(g, 20, 42, 50, 3, '#DDDDDD');      // la almohada
  for (let k = 0; k < 7; k++) R(g, 70 + k * 26, 52, 26, 32, k % 2 ? '#1F5FA8' : C.blanco);   // la manta, del Málaga
  R(g, 10, 90, 250, 8, '#6B4A33'); R(g, 20, 98, 8, 22, '#6B4A33'); R(g, 242, 98, 8, 22, '#6B4A33');
  R(g, 256, 80, 14, 40, C.madera);                                      // el piecero, bajo
  for (const y of [58, 72]) { E(g, 258, y, 9, 6, '#E8C4A0'); R(g, 264, y - 7, 4, 4, '#E8C4A0'); }   // los pies, fuera
} });
const accion = () => ({ w: 150, h: 104, dibujo: g => {
  R(g, 0, 0, 150, 104, '#F6EFD9'); R(g, 6, 6, 138, 92, '#FBF7EA');
  g.strokeStyle = '#C9A227'; g.lineWidth = 2; g.strokeRect(9, 9, 132, 86);
  T(g, 'ACCIÓN', 75, 32, 'bold 20px "Caveat Brush"', C.tinta); T(g, 'MÁLAGA C. F.', 75, 52, 'bold 12px Silkscreen', '#1F5FA8');
  for (let k = 0; k < 6; k++) R(g, 30 + k * 15, 60, 15, 8, k % 2 ? '#1F5FA8' : '#D6E2F2');
  O(g, 120, 82, 10, '#C0392B'); T(g, 'A nombre de Morty', 58, 86, '9px "Pixelify Sans"', C.tinta);
} });
const estadio = () => ({ w: 440, h: 170, dibujo: g => {
  R(g, 0, 40, 440, 130, '#C9D2CE');
  for (let f = 0; f < 6; f++) R(g, 0, 52 + f * 18, 440, 11, f % 2 ? '#1F5FA8' : C.blanco);
  R(g, 0, 36, 440, 6, '#8C9894'); T(g, 'LA ROSALEDA', 220, 32, 'bold 16px Silkscreen', '#1F5FA8');
  for (const x of [20, 412]) { R(g, x, 0, 6, 60, '#5C6662'); R(g, x - 10, 0, 26, 12, '#5C6662'); R(g, x - 8, 2, 22, 8, '#FFF3C4'); }
} });

// ---------- los escenarios (el fondo de cada escena) ----------
const CIELO_DIA = ['#7FD3F0', '#D6F5EC'];
const CIELO_TARDE = ['#F48C5E', '#FCD9A0'];
const CIELO_NOCHE = ['#0E2140', '#2B3A6B'];
const ACERA = { y: -230, color: '#C9D2CE', borde: '#AEB9B4', rayas: '#E9EDEA' };
const CIELO_OTOÑO = ['#F3A86B', '#FCE3B4'];
const estrellas = (desde = 0) => [[40, 90], [120, 60], [200, 110], [270, 50], [80, 170]].map(([x, y], i) => ({ ...estrella(6 + (i % 2) * 3), x, y, entra: 'funde', desde, mueve: 'brilla', fase: i, velocidad: 0.7 }));
const calle = ({ tarde = false } = {}) => [
  { ...sol(tarde ? 34 : 24), x: tarde ? 280 : 300, y: tarde ? -330 : 120, mueve: 'gira', velocidad: 0.4, entra: 'funde' },
  { ...nube(100), x: 60, y: 90, mueve: 'deriva', velocidad: 0.8, entra: 'funde' },
  { ...nube(70), x: 230, y: 150, mueve: 'deriva', velocidad: 1.3, entra: 'funde' },
  { ...sierra(tarde ? '#B07A6A' : '#7FB88A', tarde ? '#C99484' : '#9BCB9F'), x: 180, y: -300, entra: 'funde' },
  { ...bar(), x: 90, y: -240, entra: 'abajo', dura: 0.7 },
  { ...naranjo(), x: 190, y: -232, entra: 'abajo', retraso: 0.1, mueve: 'mece' },
  { ...farola(), x: 330, y: -232, entra: 'abajo', retraso: 0.15 },
];

// ---------- la intro ----------
// Morty y Gengar, con su dibujo grande del mostrador (los sprites pequeños ampliados se veían mal)
const MORTY = { src: 'assets/sprites/morty/morty-trainer.png', escala: 1.15, mueve: 'respira' };
const GENGAR = { src: 'assets/sprites/gengar/gengar-mostrador.png', escala: 1.4, mueve: 'flota' };
const JEFE = c => `assets/portraits/perro-jefe/${c}.png`;
const PIE = -165;   // donde pisan los personajes (desde abajo)
const persianaArriba = (desde = 0, retraso = 0) => ({ ...persiana(), x: 238, y: -220, entra: 'funde', desde, retraso, mueve: 'sube', distancia: 90, lento: 1.4 });
const calleNoche = () => [{ ...luna(), x: 300, y: 110, entra: 'funde', mueve: 'flota' }, ...estrellas(), ...calle().slice(3)];
const SUELO_OSCURO = { y: -170, color: '#3B2A22', borde: '#5A4032' };
export const INTRO = () => [
  // 1. Ciudad Iris y el vídeo viral
  { cielo: CIELO_OTOÑO, suelo: { y: -230, color: '#C9A98A', borde: '#A88A6E', rayas: '#DCC3A8' }, camara: [[0, 180, 160, 1.5], [2.6, 180, -330, 1]],
    frases: ['Johto. Ciudad Iris, la de las torres antiguas.', 'Hace unos años, Morty Pociones subió un vídeo enseñándola. Se hizo viral.'],
    decorado: [{ ...sol(30), x: 290, y: 110, mueve: 'gira', velocidad: 0.4 }, { ...nube(100), x: 70, y: 100, mueve: 'deriva', velocidad: 0.8 },
      { ...sierra('#C98B6A', '#DCA683'), x: 180, y: -300 }, { ...torre(), x: 90, y: -232 }, { ...a(torre(), 0.7), x: 290, y: -232 },
      { ...arbol(), x: 190, y: -232, mueve: 'mece' }, { ...arbol('#C0392B', '#E7584A'), x: 345, y: -232, mueve: 'mece', fase: 1 }],
    pegatinas: [{ ...MORTY, x: -40, y: PIE, entra: 'funde', ruta: [[0, -40, PIE], [2.6, 165, PIE]] },
      { ...camaraVideo(), x: -10, y: -290, entra: 'funde', ruta: [[0, -10, -290], [2.6, 220, -290]], mueve: 'flota' },
      { ...telefono('Ciudad Iris', '♥ 1,2 M', '#E7584A'), x: 300, y: -300, entra: 'pop', desde: 1, mueve: 'tiembla', efecto: 'ondas' }] },
  // 2. El programa
  { cielo: ['#2A1E3A', '#4A2E5C'], suelo: { y: -150, color: '#2A1E2E', borde: '#3A2A40' }, camara: [[0, 180, -300, 1.3], [3, 180, -290, 1]],
    frases: ['Le dieron un programa en la tele: «Cenas Encantadas». Gastronomía paranormal.', 'Cenaba en los bares con más fantasmas de Johto. Y lo contaba.'],
    decorado: [{ ...tele(), x: 180, y: -160 }],
    pegatinas: [{ src: morty('Happy'), escala: 2.3, x: 180, y: -232, entra: 'pop', retraso: 0.4, mueve: 'flota' },
      ...['#E09A4A', '#C0392B', '#6CBF4A'].map((c, k) => ({ ...plato(c), x: 180, y: -300, entra: 'pop', desde: 1, retraso: k * 0.25, mueve: 'orbita', radio: 150, velocidad: 0.7, fase: k * 2.1 }))] },
  // 3. El bar de Ciudad Iris: el Gengar de debajo de la mesa y el grito
  { cielo: ['#1E1430', '#3A2350'], suelo: SUELO_OSCURO, camara: [[0, 180, -280, 1], [6, 180, -270, 1.15]],
    frases: ['Una noche, grabando en el bar más famoso de Ciudad Iris, algo se movió debajo de la mesa.', 'Un Gengar. Le chupó los pies.', 'Morty soltó un grito. Medio de susto. Medio de otra cosa.'],
    decorado: [...[40, 120, 200, 280, 340].map((x, k) => ({ ...farolillo(k % 2 ? '#F29B2E' : '#E7584A'), x, y: -470 + (k % 2) * 20, mueve: 'mece', fase: k }))],
    pegatinas: [{ ...MORTY, x: 150, y: -175, entra: 'funde' },
      { ...mesa(), x: 180, y: -150, entra: 'funde' },
      { ...GENGAR, escala: 1, x: 270, y: -150, entra: 'estira', retraso: 1, dura: 1, efecto: 'chispas' },
      { ...rotulo('slurp', '#B48CE0', 30), x: 300, y: -290, entra: 'pop', desde: 1, retraso: 0.3, mueve: 'late' },
      { src: morty('Surprised'), escala: 3, x: 110, y: -330, entra: 'pop', desde: 2, mueve: 'tiembla' },
      { ...rotulo('¡¡AAAAY!!'), x: 220, y: -460, entra: 'pop', desde: 2, retraso: 0.2, mueve: 'tiembla' },
      { src: morty('Happy'), escala: 1.4, x: 300, y: -350, entra: 'pop', desde: 2, retraso: 1.4, mueve: 'flota' }] },
  // 4. Viral; Gengar se queda
  { cielo: ['#06241C', '#0E4A3C'], efectos: ['anillos'], camara: [[0, 180, -280, 1.2], [4, 180, -280, 1]],
    frases: ['El grito dio la vuelta a Johto en una noche. Cuarenta millones de visitas.', 'Gengar no se fue. Desde entonces es su Pokémon.'],
    decorado: [0, 1, 2].map(i => ({ ...telefono('El grito', ['♥ 9 M', '♥ 22 M', '♥ 40 M'][i], '#E7584A'), x: 180, y: -290, retraso: i * 0.3, mueve: 'orbita', radio: 140, velocidad: 0.8, fase: i * 2.1, opacidad: 0.7 })),
    pegatinas: [{ src: morty('Worried'), escala: 3, x: 180, y: -230, entra: 'pop', mueve: 'tiembla', hasta: 1 },
      { ...GENGAR, escala: 2.2, x: 180, y: -180, entra: 'estira', desde: 1, dura: 1, efecto: 'chispas' }] },
  // 5. La gira por Johto
  { cielo: CIELO_DIA, suelo: { y: -230, color: '#BFD8A8', borde: '#9CBF86', rayas: '#D8E8C8' }, camara: [[0, 180, -330, 1], [6, 200, -320, 1.1]],
    frases: ['Juntos recorrieron Johto grabando vídeos de comida, con su gracia. Morty probaba. Gengar, también.', 'Eso sí: Morty, del Málaga hasta la médula, con la bufanda puesta hasta en agosto.'],
    decorado: [{ ...sol(24), x: 300, y: 120, mueve: 'gira', velocidad: 0.4 }, { ...nube(90), x: 80, y: 110, mueve: 'deriva', velocidad: 1 },
      { ...sierra(), x: 180, y: -300 }, { ...arbol('#3E8E52', '#4FA463'), x: 40, y: -232, mueve: 'mece' }, { ...a(torre(), 0.5), x: 320, y: -232 }],
    pegatinas: [{ ...MORTY, x: -40, y: PIE, entra: 'funde', ruta: [[0, -40, PIE], [3, 140, PIE]] },
      { ...GENGAR, x: -110, y: PIE + 4, entra: 'funde', retraso: 0.3, ruta: [[0, -110, PIE + 4], [3, 240, PIE + 4]] },
      ...['#E09A4A', '#C0392B', '#F4D23C'].map((c, k) => ({ ...plato(c), x: 90 + k * 90, y: -420, entra: 'cae', retraso: 1 + k * 0.4, mueve: 'flota', fase: k })),
      { ...bufanda(), x: 140, y: -330, entra: 'pop', desde: 1, mueve: 'mece', efecto: 'chispas' }] },
  // 6. ¿Era esto lo que quería?
  { cielo: CIELO_NOCHE, suelo: SUELO_OSCURO, camara: [[0, 180, -300, 1], [7, 170, -290, 1.2]],
    frases: ['Hasta que una noche, con el móvil en la mano, Morty se preguntó si la fama era lo que siempre había querido.', 'Cerró las redes. Todas.'],
    decorado: [{ ...ventanaNoche(), x: 290, y: -380 }, ...estrellas(), { ...lampara(), x: 50, y: -170 }],
    pegatinas: [{ src: morty('Stunned'), escala: 3.2, x: 150, y: -200, entra: 'izq', mueve: 'respira' },
      { ...telefono('Tus redes', '♥ 41 M', '#E7584A'), x: 270, y: -230, entra: 'pop', retraso: 0.6, mueve: 'flota', hasta: 1 },
      { ...telefono('Cuenta', 'cerrada', '#4A4A4A'), x: 270, y: -230, entra: 'pop', desde: 1, mueve: 'flota' }] },
  // 7. Pokealhaurín de la Torre
  { cielo: CIELO_DIA, suelo: ACERA, camara: [[0, 180, 160, 1.4], [2.6, 180, -330, 1]],
    frases: ['Y se fue a Pokealhaurín de la Torre, un pueblo de Johto lejos de todo.', 'Una calle con naranjos, un bar enfrente y un local con la persiana bajada.'],
    decorado: [...calle(), { ...tienda(), x: 255, y: -180 }, { ...persiana(), x: 238, y: -220 }, { ...cartelPueblo(), x: 40, y: -232 }],
    pegatinas: [{ ...MORTY, x: -40, y: PIE, entra: 'funde', retraso: 0.6, ruta: [[0, -40, PIE], [2.6, 150, PIE]] },
      { ...GENGAR, x: -100, y: PIE + 4, entra: 'funde', retraso: 0.9, ruta: [[0, -100, PIE + 4], [2.6, 90, PIE + 4]] },
      { ...pregunta(), x: 230, y: -330, entra: 'pop', desde: 1, retraso: 0.4, mueve: 'tiembla' }] },
  // 8. La primera noche: la llamada
  { cielo: CIELO_NOCHE, suelo: { ...ACERA, color: '#5A6670', borde: '#46525C', rayas: '#6E7A84' }, camara: [[0, 180, -320, 1], [0.15, 186, -316, 1.02], [0.3, 176, -322, 1], [0.45, 184, -318, 1.02], [0.6, 180, -320, 1]],
    frases: ['La primera noche sonó el teléfono. Número oculto.', '«Tú tienes nariz, Morty. Años probando platos. Abre una perfumería.»', 'Morty no supo quién era. Pero se quedó pensando en los olores.'],
    decorado: [...calleNoche(), { ...tienda(), x: 255, y: -180 }, { ...persiana(), x: 238, y: -220 }],
    pegatinas: [{ ...telefono('Número oculto', 'llamando…', '#2B3A55'), x: 180, y: -320, entra: 'cae', mueve: 'tiembla', efecto: 'ondas' },
      { src: JEFE('Oculto'), escala: 2, x: 290, y: -440, entra: 'funde', desde: 1, mueve: 'flota', hasta: 2 },
      { src: morty('Stunned'), escala: 2.5, x: 80, y: -170, entra: 'izq', retraso: 0.5, mueve: 'respira' },
      { ...GENGAR, escala: 0.8, x: 330, y: -175, entra: 'funde', desde: 2, espejo: true, mueve: 'flota' }] },
  // 9. El estudio
  { cielo: CIELO_NOCHE, suelo: { y: -190, color: '#3B2A22', borde: '#5A4032' }, camara: [[0, 180, -320, 1], [9, 170, -300, 1.2]],
    frases: ['Así que Morty estudió los olores. Por las noches, con un café.', 'Las bayas: picantes, ácidas, dulces, amargas, secas… Cada una huele a una cosa.', 'Y las naturalezas: a cada Pokémon le gusta un sabor y odia otro. Nadie te lo dice. Hay que deducirlo.'],
    decorado: [{ ...ventanaNoche(), x: 280, y: -380 }, ...estrellas(),
      { ...lampara(), x: 60, y: -190 }, { ...libros(), x: 235, y: -192 }, { ...taza(), x: 312, y: -192, efecto: 'vapor' }],
    pegatinas: [{ src: morty('Inspired'), escala: 3.2, x: 150, y: -215, entra: 'izq', mueve: 'flota', efecto: 'notas' },
      ...C.gotas.map((c, k) => ({ ...gota(c), x: 150, y: -290, entra: 'pop', desde: 1, retraso: k * 0.15, mueve: 'orbita', radio: 120, velocidad: 0.9, fase: k * 0.9 })),
      { ...mapa(), x: 280, y: -230, entra: 'cae', desde: 2 },
      { ...gota(C.gotas[0]), x: 280, y: -290, entra: 'pop', desde: 2, retraso: 0.6, ruta: [[0, 260, -290], [1.2, 300, -320], [2.4, 250, -265], [3.6, 305, -300]] },
      { src: morty('Stunned'), escala: 1.6, x: 95, y: -390, entra: 'pop', desde: 2, retraso: 1, efecto: 'sudor' }] },
  // 10. La tienda y sus clientes
  { cielo: ['#F4F2EC', '#E1E6E3'], suelo: { y: -200, color: '#E9EDEA', borde: '#C3CEC9' }, camara: [[0, 140, -300, 1.15], [4, 220, -300, 1.1], [7, 180, -300, 1]],
    frases: ['Un día subió la persiana: Mililitros de Perfume.', 'En Pokealhaurín, los clientes son Pokémon que quieren oler mejor.', 'Y ninguno te dice lo que quiere.'],
    decorado: [{ ...estanteria(), x: 80, y: -205 }, { ...balda(), x: 250, y: -330 }, { ...mostrador(), x: 250, y: -200 }],
    pegatinas: [
      { src: 'assets/logo/logo-principal.png', escala: 0.09, x: 250, y: -420, entra: 'cae', retraso: 0.4, mueve: 'flota', dura: 1, efecto: 'chispas', hasta: 1 },
      ...[['totodile', 50], ['cyndaquil', 120], ['sudowoodo', 195], ['girafarig', 280]].map(([n, x], i) => ({
        src: `assets/sprites/clientes/${n}/frente.png`, escala: 1.4, x: 420, y: -140, entra: 'funde', desde: 1, retraso: i * 0.7, mueve: 'bote', velocidad: 1 + i * 0.15, fase: i,
        ruta: [[0, 420, -140], [1.6, x, -140]] })),
      ...[[60, -320], [150, -360], [230, -380], [310, -330]].map(([x, y], i) => ({ ...pregunta(), x, y, entra: 'pop', desde: 2, retraso: i * 0.2, mueve: 'tiembla', escalaP: 0.6 }))] },
  // 11. A abrir
  { cielo: CIELO_DIA, suelo: ACERA, efectos: ['rayos'], boton: 'Abrir la tienda', camara: [[0, 240, -300, 1.4], [3, 180, -320, 1]],
    frases: ['Diez de la mañana. Persiana arriba.', 'Que entre quien sea.'],
    decorado: [...calle(), { ...tienda(), x: 255, y: -180 }, persianaArriba(0, 0.4)],
    pegatinas: [{ src: 'assets/logo/logo-principal.png', escala: 0.09, x: 255, y: -400, entra: 'cae', retraso: 1.2, mueve: 'flota', efecto: 'chispas' },
      { ...MORTY, x: -40, y: PIE, entra: 'funde', desde: 1, ruta: [[0, -40, PIE], [2.2, 150, PIE]] },
      { ...GENGAR, x: -90, y: PIE + 4, entra: 'funde', desde: 1, retraso: 0.4, ruta: [[0, -90, PIE + 4], [2.2, 95, PIE + 4]] },
      { src: 'assets/sprites/perros/paseador-correa/pasea.png', escala: 1.4, x: -80, y: -232, entra: 'funde', desde: 1, mueve: 'deriva', velocidad: 3.5 }] },
];

// ---------- el final ----------
// opciones: { titular } (la variante del periódico, según lo que se aceptó del asesor; o null) y
// { sobre } (si hubo caja B con el Mákina: el galgo aparece al fondo con un sobre)
const TARDE = { ...ACERA, color: '#D9B9A0', borde: '#BF9C84', rayas: '#EBD3BE' };
export const FINAL = ({ titular = null, sobre = false } = {}) => [
  // 1. La persiana abajo: por fin da para todo
  { cielo: CIELO_TARDE, suelo: TARDE, camara: [[0, 180, 200, 1.2], [3, 200, -320, 1]],
    frases: ['15:00. Morty baja la persiana.', 'Hoy la caja da para la cuota, el alquiler y una cerveza. Por primera vez.'],
    decorado: [...calle({ tarde: true }), { ...tienda(), x: 255, y: -180 },
      { ...persiana(), x: 238, y: -310, retraso: 1, mueve: 'baja', distancia: 90, lento: 1.6 }],
    pegatinas: [{ ...MORTY, x: 240, y: PIE, entra: 'funde', retraso: 0.4, ruta: [[0.4, 240, PIE], [2.4, 110, PIE]] },
      { ...dinero(), x: 90, y: -320, entra: 'cae', desde: 1, mueve: 'flota', efecto: 'chispas' },
      { ...cerveza(), x: 190, y: -330, entra: 'cae', desde: 1, retraso: 0.4, mueve: 'flota', fase: 1 }] },
  // 2. El escalón, con el perro que pasea a su humano
  { cielo: CIELO_TARDE, suelo: TARDE, camara: [[0, 180, -300, 1], [8, 170, -250, 1.3]],
    frases: ['Se sienta en el escalón, con la cerveza.', 'El perro que pasea a su humano llega solo, sin el humano. Se sienta a su lado. Morty le abre otra.', 'Beben en silencio.'],
    decorado: [...calle({ tarde: true }), { ...tienda(), x: 255, y: -180 }, { ...persiana(), x: 238, y: -220 },
      ...[[60, 90], [150, 60], [260, 110]].map(([x, y], i) => ({ ...estrella(7), x, y, entra: 'funde', desde: 2, retraso: i * 0.5, mueve: 'brilla', fase: i }))],
    pegatinas: [{ ...MORTY, x: 120, y: PIE, entra: 'funde' },
      { ...cerveza(), x: 160, y: -160, entra: 'cae', retraso: 0.3, polvo: false },
      { src: 'assets/sprites/perros/golden/pose-1.png', escala: 4.5, x: 420, y: -160, entra: 'funde', desde: 1, mueve: 'menea', velocidad: 0.6,
        ruta: [[0, 420, -160], [2.6, 215, -160]] },
      { ...cerveza(), x: 270, y: -160, entra: 'cae', desde: 1, retraso: 2.8, polvo: false }] },
  // 3. La llamada: desde su propio número
  { cielo: ['#C96F4E', '#E9A870'], suelo: { ...TARDE, color: '#B89480', borde: '#9C7A66' }, camara: [[0, 180, -320, 1], [0.15, 186, -316, 1.02], [0.3, 176, -322, 1], [0.45, 184, -318, 1.02], [0.6, 180, -320, 1]],
    frases: ['Suena el teléfono. El Señor Mililitros. Es la primera vez que llama de día.', 'Morty mira la pantalla. El número que llama es el suyo.'],
    decorado: [...calle({ tarde: true }).slice(3)],
    pegatinas: [{ ...telefono(), x: 180, y: -300, entra: 'cae', mueve: 'tiembla', efecto: 'ondas', hasta: 1 },
      { ...telefono('Morty', 'llamando…', '#E7584A'), x: 180, y: -300, entra: 'pop', desde: 1, mueve: 'tiembla', efecto: 'ondas' },
      { src: JEFE('Normal'), escala: 2.5, x: 290, y: -430, entra: 'pop', retraso: 0.5, mueve: 'flota' },
      { ...exclama(), x: 80, y: -420, entra: 'pop', desde: 1, retraso: 0.3, mueve: 'tiembla' },
      { src: morty('Stunned'), escala: 2.5, x: 85, y: -150, entra: 'izq', desde: 1, mueve: 'respira' }] },
  // 4. La verdad: las noches de Gengar
  { cielo: CIELO_NOCHE, suelo: { y: -150, color: '#4A3428', borde: '#5A4032' }, camara: [[0, 180, -260, 1], [12, 190, -250, 1.15]],
    frases: ['Cada noche, desde Ciudad Iris, Gengar le chupa los pies.', 'Y cada noche Morty sufre en silencio. Y un poco, solo un poco, le gusta.',
      'De esas noches, a las cinco de la mañana, le salió otro Morty. Con corbata, objetivos de venta y cara de perro.', 'El Señor Mililitros. Nunca hubo otro jefe: era él.'],
    decorado: [{ ...ventanaNoche(), x: 80, y: -380 }, ...estrellas(), { ...cama(), x: 155, y: -152 }],
    pegatinas: [{ src: morty('Cansado'), escala: 1.2, x: 68, y: -200, entra: 'funde', mueve: 'respira' },
      { ...GENGAR, escala: 1, x: 300, y: -150, entra: 'estira', retraso: 0.6, dura: 1 },
      { ...rotulo('slurp', '#B48CE0', 30), x: 270, y: -290, entra: 'pop', retraso: 1.4, mueve: 'late' },
      { src: morty('Worried'), escala: 2.4, x: 250, y: -400, entra: 'pop', desde: 1, mueve: 'tiembla', hasta: 3 },
      { src: JEFE('Happy'), escala: 2.4, x: 100, y: -420, entra: 'funde', desde: 2, mueve: 'flota', dura: 1.2 },
      { src: morty('Dizzy'), escala: 2.4, x: 250, y: -400, entra: 'pop', desde: 3, mueve: 'tiembla' }] },
  // 5. Aceptarlo
  { cielo: ['#06241C', '#0E4A3C'], efectos: ['anillos'], camara: [[0, 180, -260, 1], [10, 180, -250, 1.25]],
    frases: ['Morty se queda un rato callado.', 'Y lo acepta. Lo que pasó, lo que le gusta y lo que es.', 'No lo coge. No se enfada. Gengar le da una palmadita. El teléfono se calla solo.'],
    decorado: [0, 1, 2].map(i => ({ ...telefono('Morty', 'llamando…', '#E7584A'), x: 180, y: -290, retraso: i * 0.3, mueve: 'orbita', radio: 140, velocidad: 0.8, fase: i * 2.1, opacidad: 0.5, hasta: 2 })),
    pegatinas: [{ src: morty('Stunned'), escala: 4, x: 180, y: -220, entra: 'funde', mueve: 'respira', hasta: 1 },
      { src: JEFE('Normal'), escala: 2, x: 80, y: -440, entra: 'funde', mueve: 'flota', hasta: 1 },
      { src: morty('Happy'), escala: 4, x: 180, y: -220, entra: 'funde', desde: 1, dura: 1.2, mueve: 'flota' },
      { ...GENGAR, escala: 1.2, x: 300, y: -150, entra: 'der', desde: 2, mueve: 'flota', efecto: 'chispas' }] },
  // 6. La cuenta: acciones del Málaga
  { cielo: CIELO_DIA, suelo: { y: -200, color: '#5FA84E', borde: '#4A8C3C', rayas: '#7CC266' }, efectos: ['confeti'], camara: [[0, 180, -330, 1.2], [4, 180, -320, 1]],
    frases: ['Lo que le pagaba al Señor Mililitros, la deuda y los recargos, iba a una cuenta a su nombre.', 'En acciones del Málaga.', 'Con los años, Morty acabó siendo el dueño del club. Con su bufanda, claro.'],
    decorado: [{ ...sol(24), x: 300, y: 110, mueve: 'gira', velocidad: 0.4 }, { ...nube(90), x: 80, y: 110, mueve: 'deriva', velocidad: 1 }, { ...estadio(), x: 180, y: -200 }],
    pegatinas: [{ ...dinero(), x: 110, y: -330, entra: 'cae', mueve: 'flota', hasta: 1 },
      { ...accion(), x: 180, y: -330, entra: 'cae', desde: 1, mueve: 'flota', efecto: 'chispas', hasta: 2 },
      { src: 'assets/ui/escudo-malaga.png', escala: 0.55, x: 270, y: -330, entra: 'pop', desde: 2, retraso: 0.6, mueve: 'late', efecto: 'chispas' },
      { ...MORTY, x: -40, y: PIE + 10, entra: 'funde', desde: 2, mueve: 'bote', ruta: [[0, -40, PIE + 10], [2, 120, PIE + 10]] },
      { ...bufanda(), x: 260, y: -250, entra: 'pop', desde: 2, retraso: 1.6, mueve: 'mece', efecto: 'chispas' }] },
  // 7. De vuelta al escalón
  { cielo: ['#3B3270', '#F2A27A'], suelo: { ...TARDE, color: '#B9A0A8', borde: '#9C8090', rayas: '#D6C3C8' }, camara: [[0, 180, -260, 1.3], [3, 180, -320, 1]],
    frases: ['Pero eso fue después. Hoy, en el escalón, Morty y el perro se terminan la cerveza.',
      ...(titular ? [`En la terraza de enfrente, el bulldog lee el periódico: «${titular}».`] : []), 'Mañana, a las diez, persiana arriba. Salud.'],
    decorado: [...calle({ tarde: true }).slice(1), ...[[50, 70], [140, 40], [250, 90], [320, 50]].map(([x, y], i) => ({ ...estrella(7), x, y, entra: 'funde', mueve: 'brilla', fase: i }))],
    pegatinas: [{ src: morty('Happy'), escala: 3, x: 110, y: -160, entra: 'pop', mueve: 'flota' },
      { src: 'assets/sprites/perros/golden/pose-1.png', escala: 4.5, x: 250, y: -150, entra: 'pop', retraso: 0.2, mueve: 'menea', velocidad: 0.6 },
      { ...cerveza(), x: 190, y: -150, entra: 'pop', retraso: 0.4, mueve: 'late', efecto: 'chispas' },
      ...(titular ? [{ ...periodico(titular), x: 180, y: -340, entra: 'cae', desde: 1, mueve: 'flota' }] : []),
      // la caja B: al fondo, el galgo con un sobre
      ...(sobre ? [{ src: 'assets/portraits/perro-galgo-ticket/Normal.png', escala: 1.6, x: 320, y: -330, entra: 'funde', retraso: 1.2, mueve: 'flota' },
        { ...sobreCerrado(), x: 330, y: -300, entra: 'pop', retraso: 1.8, mueve: 'late' }] : [])] },
  // 8. Créditos
  { cielo: CIELO_DIA, suelo: ACERA, efectos: ['confeti', 'rayos'], boton: 'Seguir', camara: [[0, 180, -330, 1.2], [3, 180, -330, 1]],
    frases: ['Mililitros de Perfume. Un juego de Jorge para Morty Pociones y su tienda de Alhaurín de la Torre.',
      'Gengar, los perros y los clientes, de las hojas de Jorge. Sprites: PMD SpriteCollab (CC BY-NC 4.0). Letras: Pixelify Sans, Silkscreen y Caveat Brush (OFL).',
      'Pokémon es de Nintendo, Creatures y GAME FREAK. Juego personal, sin ánimo de lucro.', 'Gora el Málaga.'],
    decorado: [...calle(), { ...tienda(), x: 255, y: -180 }],
    pegatinas: [{ src: 'assets/logo/logo-principal.png', escala: 0.11, x: 180, y: -430, entra: 'cae', mueve: 'flota', dura: 1, efecto: 'chispas' },
      { ...MORTY, x: -40, y: -150, entra: 'funde', mueve: 'bote', ruta: [[0, -40, -150], [2, 60, -150]] },
      { ...GENGAR, x: 420, y: -150, entra: 'funde', ruta: [[0, 420, -150], [2, 305, -150]], espejo: true },
      // los perros, en conga: entran por la izquierda y se quedan bailando
      ...[['paseador', 8], ['bulldog', 12], ['border-collie', 12], ['asesor', 12], ['repartidor', 8], ['golden', 8]]
        .map(([n, p], k) => ({ src: `assets/sprites/perros/${n}/pose-${p}.png`, escala: 1.7, x: -60, y: k < 3 ? -235 : -150, entra: 'funde', desde: 1, retraso: k * 0.35,
          mueve: 'baila', fase: k, ruta: [[0, -60, k < 3 ? -235 : -150], [2.4, [120, 180, 240, 130, 190, 250][k], k < 3 ? -235 : -150]] })),
      { src: 'assets/sprites/perros/jefe-de-pie/pose-1.png', escala: 1.7, x: 420, y: -235, entra: 'funde', desde: 3, mueve: 'baila', ruta: [[0, 420, -235], [2, 300, -235]] },
      { src: 'assets/ui/escudo-malaga.png', escala: 0.5, x: 180, y: -280, entra: 'cae', desde: 3, mueve: 'late', efecto: 'chispas' }] },
];
