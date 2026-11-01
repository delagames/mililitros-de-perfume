// El Libro de Olores: la Pokédex del juego. Una página por naturaleza con pistas incompletas que se
// rellenan con lo aprendido. Desde el principio se sabe cómo habla cada una; al atender a un cliente
// Morty deduce qué era (lo apunta con su nombre) y qué le gusta y qué odia; con un perfume
// perfecto, además, dónde cae su zona en el mapa. Se guarda en partida.libro.

import { naturaleza, DEL_LIBRO, FAMILIAS } from './deduccion.js';

const $ = s => document.querySelector(s);
const FAMILIAS_DE = sabor => FAMILIAS.filter(f => f.sabor === sabor).map(f => f.nombre).join(' y ');

// Apunta lo aprendido de un cliente; devuelve true si había algo nuevo
export function apunta(libro, nat, cliente, resultado) {
  if (!naturaleza(nat)) return false;
  const pag = (libro[nat] ??= { gustos: false, zona: false, clientes: [] });
  const antes = JSON.stringify(pag);
  pag.gustos = true;
  if (resultado === 'perfecto') pag.zona = true;
  if (cliente && !pag.clientes.includes(cliente)) pag.clientes.push(cliente);
  return JSON.stringify(pag) !== antes;
}

// historias: [cerradas, total] (las historias de los clientes que ya han llegado a su última visita)
export function abreLibro(libro, nombres = {}, historias = null) {
  const sabidas = DEL_LIBRO.filter(id => libro[id]?.gustos).length;
  const completo = sabidas === DEL_LIBRO.length;
  $('#libro .libro-cuenta').textContent = `${sabidas} de ${DEL_LIBRO.length} naturalezas${completo ? ' · ★ Libro completo' : ''}`
    + (historias ? ` · ${historias[0]} de ${historias[1]} historias cerradas` : '');
  $('#libro .libro-paginas').replaceChildren(...DEL_LIBRO.map(id => pagina(naturaleza(id), libro[id], nombres)));
  $('#libro').classList.remove('hidden');
  $('#libro-cerrar').focus({ preventScroll: true });
}
export function cierraLibro() { $('#libro').classList.add('hidden'); }
export const libroAbierto = () => !$('#libro').classList.contains('hidden');

function pagina(n, pag, nombres) {
  const el = document.createElement('article');
  el.className = 'libro-pagina' + (pag?.gustos ? '' : ' a-medias');
  const gusta = pag?.gustos ? (n.gusta ? FAMILIAS_DE(n.gusta) : 'Nada en especial') : '¿?';
  const odia = pag?.gustos ? (n.odia ? FAMILIAS_DE(n.odia) : 'Nada') : '¿?';
  const quien = pag?.clientes?.length ? pag.clientes.map(c => nombres[c] || c).join(', ') : '';
  el.innerHTML = `
    <div class="libro-mapa${pag?.zona ? '' : ' sin-zona'}">${pag?.zona ? zona(n) : '<span>?</span>'}</div>
    <div class="libro-texto">
      <h3>${n.nombre}</h3>
      <p class="libro-habla">${n.pista || ''}</p>
      <p><b>Le gusta:</b> ${gusta}</p>
      <p><b>Odia:</b> ${odia}</p>
      ${quien ? `<p class="libro-quien">${quien}</p>` : ''}
    </div>`;
  return el;
}

// La zona en el mapa en pequeño, a la misma escala que el del taller (x fresco → cálido, y suave →
// intenso; el taller deja un margen de 6 de 146 por lado): el círculo de la zona y, en su centro, una
// gota justo donde hay que llevar el perfume. La cruz marca el centro, como en el taller.
const LLENO = 46;   // de 50 (% del medio al borde) que ocupa el recorrido de la gota
function zona(n) {
  const [x, y] = n.zona, r = n.radio;
  const cx = 50 + x * LLENO, cy = 50 - y * LLENO, d = 2 * r * LLENO;
  return `<b class="cruz"></b><i style="left:${cx - d / 2}%;top:${cy - d / 2}%;width:${d}%;height:${d}%"></i>`
    + `<em style="left:${cx}%;top:${cy}%"></em>`;
}
