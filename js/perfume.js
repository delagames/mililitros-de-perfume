// El perfume en curso (sección 5 de DISEÑO.md). Es una gota en un mapa de dos ejes: x de fresco (-1)
// a cálido (+1) e y de suave (-1) a intenso (+1); empieza en el centro. Cada ingrediente
// (data/ingredients.json) la mueve un vector fijo y la tiñe:
// - inestable (polen de Jumpluff): mueve el doble, pero de lado hacia un sitio al azar;
// - base (serrín de Timburr): no mueve; con una pizca, lo que se eche después se pasa la mitad;
//   con dos, el perfume huele a obra;
// - diluye (agua de Wooper): acerca la gota al centro; redondea (leche de Miltank): acerca lo
//   fresco y lo cálido al medio.
// Cada paso guarda lo que salió al azar, para que deshacer y volver a calcular dé lo mismo.

export let MAX = 6;   // ingredientes que caben en el frasco (30 ml; 50 y 100 con las mejoras)
export function ponMax(n) { MAX = n; }

let ingredientes = {};
export async function cargaIngredientes() {
  const lista = await fetch('data/ingredients.json').then(r => r.json()).catch(() => []);
  ingredientes = Object.fromEntries(lista.map(i => [i.id, i]));
  return lista;
}
export const ingrediente = id => ingredientes[id];

export function nuevoPerfume() {
  return { pasos: [], pos: [0, 0], base: 0, obra: false, rastro: [[0, 0]] };
}

const limita = v => Math.max(-1, Math.min(1, v));

// Cómo queda la gota tras echar un ingrediente desde (x, y), con lo que salió al azar (lado)
function aplica(estado, ing, lado) {
  let [x, y] = estado.pos;
  if (ing.base) {
    estado.base++;
    if (estado.base >= 2) estado.obra = true;
    return [x, y];
  }
  const freno = estado.base > 0 ? 0.5 : 1;
  let [dx, dy] = ing.mueve;
  if (ing.inestable) dx += lado * ing.inestable;
  x += dx * freno; y += dy * freno;
  if (ing.diluye) { x *= 1 - ing.diluye; y *= 1 - ing.diluye; }
  if (ing.redondea) x *= ing.redondea;
  return [limita(x), limita(y)];
}

// Echa un ingrediente; devuelve false si el frasco está lleno
export function echa(p, id) {
  if (p.pasos.length >= MAX) return false;
  const ing = ingredientes[id];
  const lado = ing.inestable ? (Math.random() < 0.5 ? -1 : 1) : 0;
  p.pasos.push({ id, lado });
  p.pos = aplica(p, ing, lado);
  p.rastro.push([...p.pos]);
  return true;
}

// El perfume tal como estaba, a partir de sus pasos guardados (al recargar con el frasco a medias)
export function desdePasos(pasos = []) {
  const p = nuevoPerfume();
  for (const paso of pasos) {
    if (!ingredientes[paso.id]) continue;
    p.pasos.push(paso);
    p.pos = aplica(p, ingredientes[paso.id], paso.lado);
    p.rastro.push([...p.pos]);
  }
  return p;
}

// Quita el último ingrediente (se tira: no vuelve al almacén) y lo recalcula todo
export function deshaz(p) {
  const quitado = p.pasos.pop();
  const pasos = p.pasos;
  Object.assign(p, nuevoPerfume());
  for (const paso of pasos) {
    p.pasos.push(paso);
    p.pos = aplica(p, ingredientes[paso.id], paso.lado);
    p.rastro.push([...p.pos]);
  }
  return quitado;
}

// El color del perfume: la media de los colores de lo echado (si huele a obra, tira a madera)
export function colorDe(p, P) {
  if (!p.pasos.length) return '#E8F4F0';
  const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const suma = [0, 0, 0];
  for (const paso of p.pasos) {
    const c = ingredientes[paso.id].color;
    const [r, g, b] = rgb(c.startsWith('#') ? c : P[c]);
    suma[0] += r; suma[1] += g; suma[2] += b;
  }
  let media = suma.map(v => v / p.pasos.length);
  if (p.obra) media = media.map((v, i) => v * 0.5 + rgb(P.madera)[i] * 0.5);
  return '#' + media.map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
}

// Cómo es el perfume, en palabras (para el nombre al embotellar)
export function caracter(p) {
  const [x, y] = p.pos;
  const partes = [];
  if (x < -0.3) partes.push('Fresco'); else if (x > 0.3) partes.push('Cálido');
  if (y > 0.3) partes.push(partes.length ? 'intenso' : 'Intenso'); else if (y < -0.3) partes.push(partes.length ? 'suave' : 'Suave');
  if (!partes.length) partes.push('Equilibrado');
  if (p.obra) partes.push('con olor a obra');
  return partes.join(' ');
}

export function nombreDe(p, numero) {
  return `Nº ${numero} · ${caracter(p)}`;
}
