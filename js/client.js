// El cliente del día (fase 2: uno de prueba). Entra por abajo a la izquierda, como si viniera de la
// puerta (que queda a nuestra espalda), y se para delante del mostrador, de espaldas, mirando a
// Morty; al despedirlo se da la vuelta y se va por donde vino. Va en primer plano, grande: se le
// amplía (a un número entero de veces) hasta que mida unos ALTO px, y el cuadro de diálogo le
// tapa los pies. Los sprites, por ahora, los de SpriteCollab (assets/sprites/<número>/), con su
// vista de espaldas. Los que tienen dibujo propio (hojas de Jorge, tools/build_clientes.py: "dibujo" en
// data/clients.json) traen uno de espaldas y otro de frente, ya a su tamaño: entran de espaldas con un
// saltito al andar, se quedan respirando y se van de frente.
// Más adelante: pistas y reacciones a las muestras (sección 4 de DISEÑO.md).
import { loadSprite, fotograma, DIR } from './sprites.js';
import { forma } from './pixel.js';

const SITIO = { x: 92, pies: 232 };   // dónde se para, en el mundo del mostrador (los pies, tapados)
const ENTRADA = { x: -10, pies: 330 }; // por dónde entra y sale: abajo a la izquierda, fuera de la vista
const VELOCIDAD = 52;                  // px por segundo, andando
const ALTO = 92;                       // lo que mide de alto en pantalla, más o menos

let cliente = null;   // { sprite, k, x, pies, desde, hasta, t0, dur, estado, alAcabar }

export async function cargaClientes() {
  try {
    return await fetch('data/clients.json').then(r => r.json());
  } catch {
    return [];
  }
}

// Alto del cuerpo (lo opaco) en el primer fotograma de reposo, medido una vez por sprite
const altos = new Map();
function altoCuerpo(sprite) {
  if (!altos.has(sprite.id)) {
    const f = fotograma(sprite, 'Idle', 0, DIR.downRight);
    const c = document.createElement('canvas');
    c.width = f.w; c.height = f.h;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(f.img, f.sx, f.sy, f.w, f.h, 0, 0, f.w, f.h);
    const a = g.getImageData(0, 0, f.w, f.h).data;
    let arriba = f.h, abajo = 0;
    for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) if (a[(y * f.w + x) * 4 + 3]) { arriba = Math.min(arriba, y); abajo = y; }
    altos.set(sprite.id, Math.max(1, abajo - arriba + 1));
  }
  return altos.get(sprite.id);
}

function cargaImagen(src) {
  return new Promise((ok, mal) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = mal;
    img.src = src;
  });
}

// Entra el cliente (c de data/clients.json); alLlegar() cuando ya está delante del mostrador.
// Si su dibujo no carga (sin conexión), no entra nadie y se llama a alLlegar(null).
export async function entra(c, alLlegar) {
  if (c.dibujo) {
    const base = `assets/sprites/clientes/${c.dibujo}`;
    const dibujo = await Promise.all([cargaImagen(`${base}/espaldas.png`), cargaImagen(`${base}/frente.png`)]).catch(() => null);
    if (!dibujo) { alLlegar(null); return; }
    // los pequeños, un poco más arriba, para que el cuadro de diálogo no los tape casi enteros
    const sitio = { x: SITIO.x, pies: 230 + Math.round(dibujo[0].height * 0.2) };
    cliente = { dibujo: { espaldas: dibujo[0], frente: dibujo[1] }, sitio, k: 1, ...ENTRADA, desde: ENTRADA, hasta: sitio, t0: null, estado: 'entra', alAcabar: alLlegar };
    return;
  }
  const sprite = await loadSprite(c.sprite, ['Idle', 'Walk']).catch(() => null);
  if (!sprite) { alLlegar(null); return; }
  const k = Math.max(1, Math.min(4, Math.floor(ALTO / altoCuerpo(sprite))));
  cliente = { sprite, sitio: SITIO, k, ...ENTRADA, desde: ENTRADA, hasta: SITIO, t0: null, estado: 'entra', alAcabar: alLlegar };
}

export function sale(alSalir) {
  if (!cliente) { alSalir?.(); return; }
  Object.assign(cliente, { desde: { x: cliente.x, pies: cliente.pies }, hasta: ENTRADA, t0: null, estado: 'sale', alAcabar: alSalir });
}

// Se va sin más (al cambiar de sitio)
export function quita() { cliente = null; }

// Capa animada del mostrador: el cliente, con su sombra
export function pintaCliente(g, t, ctx, d) {
  const c = cliente;
  if (!c) return;
  // de espaldas, mirando arriba a la derecha (a Morty); al irse, de cara, hacia abajo a la izquierda
  let anim = 'Idle', dir = DIR.upRight;
  if (c.estado !== 'quieto') {
    if (c.t0 === null) {
      c.t0 = t;
      c.dur = Math.hypot(c.hasta.x - c.desde.x, c.hasta.pies - c.desde.pies) / VELOCIDAD;
    }
    const f = Math.min(1, (t - c.t0) / c.dur);
    c.x = c.desde.x + (c.hasta.x - c.desde.x) * f;
    c.pies = c.desde.pies + (c.hasta.pies - c.desde.pies) * f;
    anim = 'Walk';
    dir = c.estado === 'entra' ? DIR.upRight : DIR.downLeft;
    if (f >= 1) {
      const fin = c.alAcabar;
      if (c.estado === 'sale') cliente = null;
      else { c.estado = 'quieto'; Object.assign(c, c.sitio); }
      setTimeout(() => fin?.(c.sprite || c.dibujo), 0);
      if (!cliente) return;
    }
  }
  const x = Math.round(d.ox + c.x), pies = Math.round(d.oy + c.pies);
  if (c.dibujo) {
    // de espaldas al entrar y quieto, de frente al irse; andando, un saltito a cada paso;
    // quieto, respira (un píxel abajo de vez en cuando)
    const img = c.estado === 'sale' ? c.dibujo.frente : c.dibujo.espaldas;
    const bote = anim === 'Walk' ? (Math.floor(t * 7) % 2 ? -2 : 0) : (Math.sin(t * 1.8) > 0.4 ? 1 : 0);
    sombra(g, x, pies, Math.round(img.width * 0.7));
    g.drawImage(img, x - Math.round(img.width / 2), pies - img.height + bote);
    return;
  }
  const fr = fotograma(c.sprite, anim, t, dir);
  const w = fr.w * c.k, h = fr.h * c.k;
  sombra(g, x, pies, Math.round(altoCuerpo(c.sprite) * c.k * 0.6) + 6);
  // en SpriteCollab los pies quedan 6 px por debajo del centro del fotograma
  g.drawImage(fr.img, fr.sx, fr.sy, fr.w, fr.h, x - w / 2, pies - (fr.h / 2 + 6) * c.k, w, h);
}

// Sombra tramada a los pies
function sombra(g, x, pies, sw) {
  forma(g, x - sw / 2, pies - 2, sw, 4, (px, py) => {
    const e = ((px - sw / 2 + 0.5) / (sw / 2)) ** 2 + ((py - 1.5) / 2) ** 2;
    return e <= 1 && (px + py) % 2 === 0 ? '#B9C5C0' : null;
  });
}
