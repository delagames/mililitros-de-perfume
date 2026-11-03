// Los perros de la calle (sección 2 de DISEÑO.md), vistos por el escaparate. Sus dibujos salen de
// las hojas de Jorge (tools/build_perros.py → assets/sprites/perros/<nombre>/pose-N.png).
// - el que pasea a su humano: el golden de pie, con la correa, y el dueño delante con el collar;
// - el bulldog lee el periódico en la terraza de La Olla de Barro y de vez en cuando lo baja;
// - el border collie pasa a su aire; el Señor Mililitros, solo algunos días: a veces se para a mirar la
//   tienda y a veces, de repente, aparece con la cara pegada al cristal;
// - no salen todos siempre: cada día unos pocos, al azar (perrosDeHoy), y pasan de vez en cuando, cada
//   uno a su ritmo; los días que la historia lo pide (sus vídeos, el día de la cuota), sale ese;
// - cuando un perfume sale perfecto, todos bailan (bailan(): lo lanza main.js).
// Para andar se alternan dos poses de lado de la hoja (la que mira al otro lado, reflejada). El
// que pasea a su humano tiene una sola: anda balanceando las piernas (la parte de abajo se inclina
// adelante y atrás, unida a la cadera, sin girar los pies). Van entre la calle y el cristal.

const POSES = {
  paseador: { baila: 8, salta: 7 },
  bulldog: { sentado: 8, baila: 12, salta: 11 },
  'border-collie': { andar: [3, 4], baila: 10, salta: 11 },   // andar: dos pasos, mirando a la derecha
  jefe: { baila: 8, salta: 7 },
  'jefe-de-pie': { andar: [1, -3] },                          // a dos patas: la 1 (a la derecha) y la 3 reflejada
  repartidor: { patina: [3, 4], parado: 1 },              // patina: de pie en los patines, a la derecha
};

const img = {};
export async function cargaPerros() {
  const carga = src => new Promise(ok => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });
  const pedidos = [];
  for (const [nombre, poses] of Object.entries(POSES)) {
    for (const n of new Set(Object.values(poses).flat().map(Math.abs))) {
      pedidos.push(carga(`assets/sprites/perros/${nombre}/pose-${n}.png`).then(i => { img[`${nombre}-${n}`] = i; }));
    }
  }
  // el que pasea a su humano: el golden de pie con la correa y el dueño delante
  pedidos.push(carga('assets/sprites/perros/paseador-correa/pasea.png').then(i => { img.correa = i; }));
  // la cara del Señor Mililitros, de frente, para pegarla al cristal (sin el fondo del retrato)
  for (const c of ['Normal', 'Surprised']) pedidos.push(carga(`assets/portraits/perro-jefe-de-pie/${c}.png`).then(i => { if (i) img[`cara-${c}`] = sinFondo(i); }));
  await Promise.all(pedidos);
  if (img.correa) img.correaPasos = [img.correa, inclina(img.correa, 3), img.correa, inclina(img.correa, -3)];
}

// Quita el fondo liso de un retrato: lo que toca el borde y es del color de la esquina
export function sinFondo(i) {
  const c = document.createElement('canvas');
  c.width = i.width; c.height = i.height;
  const g = c.getContext('2d');
  g.drawImage(i, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height), px = d.data, W = c.width, H = c.height;
  const ref = [px[0], px[1], px[2]];
  const igual = k => Math.abs(px[k] - ref[0]) + Math.abs(px[k + 1] - ref[1]) + Math.abs(px[k + 2] - ref[2]) < 40;
  const pila = [];
  for (let x = 0; x < W; x++) pila.push([x, 0], [x, H - 1]);
  for (let y = 0; y < H; y++) pila.push([0, y], [W - 1, y]);
  while (pila.length) {
    const [x, y] = pila.pop();
    if (x < 0 || y < 0 || x >= W || y >= H) continue;
    const k = (y * W + x) * 4;
    if (px[k + 3] === 0 || !igual(k)) continue;
    px[k + 3] = 0;
    pila.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  g.putImageData(d, 0, 0);
  return c;
}

// Las piernas inclinadas: de la cadera (66 % del alto) para abajo, cada fila un poco más desplazada
function inclina(i, s) {
  const c = document.createElement('canvas');
  c.width = i.width; c.height = i.height;
  const g = c.getContext('2d');
  const corte = Math.round(i.height * 0.66);
  g.drawImage(i, 0, 0, i.width, corte, 0, 0, i.width, corte);
  for (let y = corte; y < i.height; y++) {
    const d = Math.round(s * (y - corte) / (i.height - 1 - corte));
    g.drawImage(i, 0, y, i.width, 1, d, y, i.width, 1);
  }
  return c;
}

// Quién sale hoy y desde cuándo bailan (solo: en las pruebas, un perro suelto que cruza una y otra vez)
export const calle = { hoy: { paseador: true, 'border-collie': true, bulldog: true, jefe: false }, baile: -1, solo: null, t0: 0, repartidor: -1,
  // la primera vez tras presentarse, el Señor Mililitros pega la cara al cristal nada más llegar (main.js lo
  // pide hasta que se ha visto, y apunta que se ha visto con alVerCristal)
  cristalPrimero: false, alVerCristal: null };

// Quién sale hoy: al azar (el mismo día, siempre los mismos), más los que pide la historia; nunca nadie, no.
// Tras una mala noche de Morty (las de Gengar) salen más; el Señor Mililitros, solo cuando ya se ha presentado.
export function perrosDeHoy(dia, piden = {}, { sinJefe = false, malaNoche = false } = {}) {
  let s = (dia * 2654435761) >>> 0;
  const azar = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; };
  const mas = malaNoche ? 0.3 : 0;
  const hoy = { paseador: azar() < 0.45 + mas, 'border-collie': azar() < 0.45 + mas, bulldog: azar() < 0.55 + mas, jefe: azar() < 0.25 + mas };
  for (const [k, v] of Object.entries(piden)) if (v) hoy[k] = true;
  if (sinJefe) hoy.jefe = false;
  if (!Object.values(hoy).some(Boolean)) hoy[['paseador', 'border-collie', 'bulldog'][Math.floor(azar() * 3)]] = true;
  return hoy;
}

// Cada uno pasa cuando le da: tras cada paseo espera un rato al azar (entre «min» y «max» segundos)
const turnos = {};
function pase(nombre, t, { dura, min, max, primero = 25 }) {
  let tu = turnos[nombre];
  if (!tu) tu = turnos[nombre] = { empieza: t + 3 + Math.random() * primero, que: Math.random() };
  if (t < tu.empieza) return null;
  if (t > tu.empieza + dura(tu)) { turnos[nombre] = { empieza: t + min + Math.random() * (max - min), que: Math.random() }; return null; }
  return { tt: t - tu.empieza, tu };
}
// tres segundos; con el toldo nuevo, más (calle.baileLargo)
export function bailan() { calle.baile = performance.now() / 1000; }
const bailando = t => calle.baile >= 0 && t - calle.baile < (calle.baileLargo ? 4.5 : 3);

function pinta(g, i, xPies, yPies, espejo = false, salto = 0) {
  if (!i) return;
  const x = Math.round(xPies - i.width / 2), y = Math.round(yPies - i.height - salto);
  g.fillStyle = 'rgba(0, 0, 0, 0.18)';
  g.fillRect(Math.round(xPies - i.width * 0.35), yPies - 1, Math.round(i.width * 0.7), 2);
  if (!espejo) { g.drawImage(i, x, y); return; }
  g.save();
  g.translate(x + i.width, y);
  g.scale(-1, 1);
  g.drawImage(i, 0, 0);
  g.restore();
}
const pose = (nombre, n) => img[`${nombre}-${n}`];

// Andando: una pose y la otra, con un botecito
function anda(g, nombre, t, x, y, alReves = false) {
  const pasos = POSES[nombre].andar, k = Math.floor(t * 4) % pasos.length, n = pasos[k];
  pinta(g, pose(nombre, Math.abs(n)), x, y, (n < 0) !== alReves, k % 2);
}
function paseador(g, t, x) {
  const k = Math.floor(t * 6) % 4;
  pinta(g, img.correaPasos?.[k] || img.correa, x, ACERA + 1, false, k % 2);
}

// Un paseo de lado a lado cada «periodo» segundos: dónde va (o null si no está en la calle)
function paseo(t, periodo, desfase, desde, hasta, velocidad) {
  const dura = Math.abs(hasta - desde) / velocidad;
  const k = (t + desfase) % periodo;
  if (k > dura) return null;
  return desde + (hasta - desde) * (k / dura);
}

const ACERA = 197;   // los pies, en la acera de enfrente
export function pintaPerros(g, t, ctx, d) {
  g.translate(d.ox, d.oy);
  if (calle.repartidor >= 0) { pintaRepartidor(g, t - calle.repartidor); return; }
  if (bailando(t)) { pintaBaile(g, t - calle.baile); return; }
  if (calle.solo) { pintaSolo(g, t, ctx); return; }
  const hoy = calle.hoy;
  if (hoy.bulldog) terraza(g, t);
  // el que pasea a su humano, de izquierda a derecha, de vez en cuando
  if (hoy.paseador) {
    const p = pase('paseador', t, { dura: () => 370 / 15, min: 40, max: 110 });
    if (p) paseador(g, t, -50 + 15 * p.tt);
  }
  // el border collie, a su aire (la mitad de las veces, de derecha a izquierda)
  if (hoy['border-collie']) {
    const p = pase('border-collie', t, { dura: () => 330 / 22, min: 50, max: 130, primero: 40 });
    if (p) { const x = -30 + 22 * p.tt; anda(g, 'border-collie', t, p.tu.que < 0.5 ? 270 - x : x, ACERA, p.tu.que < 0.5); }
  }
  // el Señor Mililitros, a dos patas y sin prisa; o, de repente, con la cara pegada al cristal
  if (hoy.jefe) {
    if (calle.cristalPrimero && !turnos.jefe?.forzado) turnos.jefe = { empieza: t + 2 + Math.random() * 3, que: 0.95, forzado: true };
    const p = pase('jefe', t, { dura: tu => (tu.que > 0.7 ? 4.6 : 330 / 13 + (tu.que > 0.3 ? 4.4 : 0)), min: 60, max: 150, primero: 30 });
    if (p) p.tu.que > 0.7 ? caraEnElCristal(g, p.tt, p.tu) : jefePasa(g, t, p.tt, p.tu.que > 0.3 ? 4.4 : 0);
    if (p?.tu.forzado && calle.cristalPrimero && p.tt > 1) { calle.cristalPrimero = false; calle.alVerCristal?.(); }
  }
}

// El Señor Mililitros cruza; si «para», se queda delante de la tienda mirando a un lado y a otro
function jefePasa(g, t, tt, para) {
  const PARA = 130, llega = (PARA + 30) / 13;
  if (tt < llega) anda(g, 'jefe-de-pie', t, -30 + 13 * tt, ACERA);
  else if (tt < llega + para) {
    const mira = Math.floor((tt - llega) / 1.1) % 2;
    pinta(g, pose('jefe-de-pie', mira ? 3 : 1), PARA, ACERA, mira === 1);
  } else anda(g, 'jefe-de-pie', t, PARA + 13 * (tt - llega - para), ACERA);
}

// De golpe, pegado al escaparate desde fuera: la cara contra el cristal (aplastada al chocar) y las
// dos patas apoyadas a los lados; los hombros siguen por debajo de la peana, como alguien que se asoma
// de pie. Empaña el cristal con el aliento y luego se escurre hacia abajo.
function caraEnElCristal(g, tt, tu) {
  tu.cara ??= Math.random() < 0.35 ? 'cara-Surprised' : 'cara-Normal';
  tu.x ??= 155 + Math.round(Math.random() * 17);   // a la derecha de la maceta, sin tapar los frascos
  const cara = img[tu.cara] || img['cara-Normal'];
  if (!cara) return;
  const choque = tt < 0.15 ? 1 : 0, baja = Math.max(0, tt - 3.8) * 160;
  const w = 104 + choque * 8, h = 100 - choque * 5;
  const abajo = 232 + baja, y = Math.round(abajo - h), x = Math.round(tu.x - w / 2);
  // las patas, apoyadas en el cristal a los lados de la cara
  // (el brazo baja hasta el hombro, por debajo de la peana: así no se ve dónde acaba)
  for (const lado of [-1, 1]) pata(g, Math.round(tu.x + lado * (w / 2 + 6)), Math.round(y + h * 0.42 + choque), Math.round(tu.x + lado * (w / 2 - 14)), abajo + 14);
  g.drawImage(cara, x, y, w, h);
  // el vaho del aliento, delante de la boca, que crece y mengua
  if (tt > 0.3 && tt < 4) {
    const r = 8 + 3 * Math.sin(tt * 3), vy = y + h * 0.8;
    g.fillStyle = 'rgba(240, 248, 245, 0.5)';
    g.beginPath(); g.ellipse(tu.x, vy, r * 1.8, r, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(255, 255, 255, 0.35)';
    g.beginPath(); g.ellipse(tu.x - 4, vy - 2, r * 0.9, r * 0.45, 0, 0, Math.PI * 2); g.fill();
  }
}
// Una pata aplastada contra el cristal: la palma clara con sus almohadillas, y el brazo con la manga
// del traje, que baja hasta el hombro (hx, hy)
function pata(g, cx, cy, hx, hy) {
  const brazo = (ancho, color) => {
    g.fillStyle = color;
    g.beginPath();
    g.moveTo(cx - ancho, cy + 6); g.lineTo(cx + ancho, cy + 6);
    g.lineTo(hx + ancho + 3, hy); g.lineTo(hx - ancho - 3, hy);
    g.closePath(); g.fill();
  };
  brazo(8, '#1B2236');
  brazo(6.5, '#2E3A5C');
  g.fillStyle = '#F2EFE6'; g.fillRect(cx - 6, cy + 7, 12, 3);            // el puño de la camisa
  g.fillStyle = '#3A2A1E';
  g.beginPath(); g.ellipse(cx, cy, 9, 10, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#E2C595';
  g.beginPath(); g.ellipse(cx, cy, 8, 9, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#C79D72';                                               // las almohadillas
  g.beginPath(); g.ellipse(cx, cy + 3, 4, 3, 0, 0, Math.PI * 2); g.fill();
  for (const dx of [-5, -2, 2, 5]) { g.beginPath(); g.ellipse(cx + dx, cy - 5 + Math.abs(dx) * 0.4, 1.6, 2, 0, 0, Math.PI * 2); g.fill(); }
}

// El baile: a cada golpe cambian de pose (la del baile y la del salto) y de lado, y saltan
function pintaBaile(g, tt) {
  const golpe = Math.floor(tt / 0.3), fase = (tt / 0.3) % 1;
  const salto = Math.round(Math.sin(fase * Math.PI) * 7);
  const quien = [['paseador', 60, ACERA], ['bulldog', 160, 194], ['border-collie', 210, ACERA]];
  if (calle.hoy.jefe) quien.push(['jefe', 105, ACERA]);
  quien.forEach(([nombre, x, y], k) => {
    const p = POSES[nombre], par = (golpe + k) % 2;
    pinta(g, pose(nombre, par ? p.salta : p.baila), x, y, (golpe + k) % 4 >= 2, par ? salto : Math.round(salto / 3));
  });
}

// El repartidor: llega patinando (con su mini-hombre en brazos) hasta la puerta y deja la caja
function pintaRepartidor(g, tt) {
  const llega = 3.2, x = -40 + Math.min(1, tt / llega) * 175;
  if (tt < llega) pinta(g, pose('repartidor', POSES.repartidor.patina[Math.floor(tt * 5) % 2]), x, ACERA + 2);
  else pinta(g, pose('repartidor', POSES.repartidor.parado), x, ACERA + 2);
  if (tt >= llega) {
    // la caja, en el suelo, a su lado
    const cx = Math.round(x + 14), cy = ACERA - 7;
    g.fillStyle = '#111111'; g.fillRect(cx - 1, cy - 1, 14, 9);
    g.fillStyle = '#C8955A'; g.fillRect(cx, cy, 12, 7);
    g.fillStyle = '#A8763E'; g.fillRect(cx, cy + 3, 12, 1); g.fillRect(cx + 5, cy, 2, 7);
  }
}

// Pruebas: un solo perro, que cruza la calle una y otra vez
function pintaSolo(g, t, ctx) {
  const tt = t - calle.t0;
  if (calle.solo === 'paseador') { const x = paseo(tt, 26, 0, -50, 320, 15); if (x != null) paseador(g, t, x); }
  else if (calle.solo === 'border-collie') { const x = paseo(tt, 17, 0, -30, 300, 22); if (x != null) anda(g, 'border-collie', t, x, ACERA); }
  else if (calle.solo === 'jefe') { const x = paseo(tt, 28, 0, -30, 300, 13); if (x != null) anda(g, 'jefe-de-pie', t, x, ACERA); }
  else if (calle.solo === 'bulldog') terraza(g, tt + 4);
  else if (calle.solo === 'jefe-para') { const k = tt % 32; if (k < 330 / 13 + 4.4) jefePasa(g, t, k, 4.4); }
  else if (calle.solo === 'jefe-cristal') { const k = tt % 7; if (k < 4.6) caraEnElCristal(g, k, (calle.cristal ??= {})); else calle.cristal = null; }
}

// El de la terraza lee el periódico; cada diez segundos lo baja un momento para mirar a la tienda
function terraza(g, t) {
  const baja = t % 10 > 8;
  pinta(g, pose('bulldog', POSES.bulldog.sentado), 156, 192);
  if (baja) return;
  const x = 148, y = 168;
  g.fillStyle = '#111111'; g.fillRect(x - 1, y - 1, 17, 13);
  g.fillStyle = '#F2EFE6'; g.fillRect(x, y, 15, 11);
  g.fillStyle = '#9AA0A0';
  for (let k = 0; k < 4; k++) g.fillRect(x + 2, y + 3 + k * 2, k % 2 ? 6 : 11, 1);
  g.fillStyle = '#111111'; g.fillRect(x + 2, y + 1, 11, 1);
  g.fillRect(x + 7, y, 1, 11);
}
