// El pedido de ingredientes para mañana (sección 3 de DISEÑO.md): al cerrar, se elige cuánto de cada
// uno y se paga de la caja; lo trae el repartidor a las 14:59 del día siguiente. Los de los
// proveedores en persona no salen hasta que se hacen clientes fijos. Va en una ventana encima del
// juego, con el aspecto limpio del taller. Debajo, las mejoras de la tienda (sección 7), que se
// compran en el momento.
import { PRECIOS, disponible } from './dia.js';
import { euros } from './deduccion.js';

const $ = s => document.querySelector(s);

export function abrePedido({ ingredientes, partida, P, mejoras = [], alComprar = () => {}, alAcabar }) {
  const cantidad = Object.fromEntries(ingredientes.map(i => [i.id, partida.pedido?.[i.id] || 0]));
  const total = () => Math.round(ingredientes.reduce((s, i) => s + cantidad[i.id] * PRECIOS[i.id], 0) * 100) / 100;
  const color = i => (i.color.startsWith('#') ? i.color : P[i.color]);
  const lista = $('#pedido .pedido-lista');
  const pinta = () => {
    lista.replaceChildren(...ingredientes.map(i => {
      const fila = document.createElement('div');
      const libre = disponible(partida, i.id);
      fila.className = 'pedido-fila' + (libre ? '' : ' bloqueado');
      fila.innerHTML = `<i style="background:${color(i)}"></i>
        <span class="pedido-nombre">${i.nombre}<small>${libre ? `<span class="cifra">${euros(PRECIOS[i.id])}</span> · hay ${partida.almacen[i.id] || 0}` : 'Aún no lo trae nadie'}</small></span>
        ${libre ? `<button class="secundario" data-menos="${i.id}">−</button><b>${cantidad[i.id]}</b><button class="secundario" data-mas="${i.id}">+</button>` : ''}`;
      return fila;
    }));
    // las mejoras: las que quedan por comprar (y las que ya se pueden: alguna pide otra antes)
    $('#pedido .mejoras-lista').replaceChildren(...mejoras.filter(m => !partida.mejoras.includes(m.id) && (!m.requiere || partida.mejoras.includes(m.requiere))).map(m => {
      const fila = document.createElement('div');
      fila.className = 'pedido-fila mejora';
      fila.innerHTML = `<span class="pedido-nombre">${m.nombre}<small>${m.dice} <span class="cifra">${euros(m.precio)}</span></small></span>
        <button class="secundario" data-compra="${m.id}" ${m.precio > partida.caja ? 'disabled' : ''}>Comprar</button>`;
      return fila;
    }));
    $('#pedido .mejoras-titulo').classList.toggle('hidden', !$('#pedido .mejoras-lista').children.length);
    const t = total();
    $('#pedido .pedido-total').textContent = `Total: ${euros(t)} · en caja ${euros(partida.caja)}`;
    $('#pedido .pedido-total').classList.toggle('falta', t > partida.caja);
    $('#pedido-pedir').disabled = t > partida.caja;
  };
  $('#pedido .mejoras-lista').onclick = ev => {
    const m = mejoras.find(x => x.id === ev.target.dataset?.compra);
    if (!m || m.precio > partida.caja) return;
    alComprar(m);
    pinta();
  };
  lista.onclick = ev => {
    const mas = ev.target.dataset?.mas, menos = ev.target.dataset?.menos;
    if (mas && cantidad[mas] < 20) cantidad[mas]++;
    if (menos && cantidad[menos] > 0) cantidad[menos]--;
    if (mas || menos) pinta();
  };
  const cerrar = pedido => {
    $('#pedido').classList.add('hidden');
    alAcabar(pedido);
  };
  $('#pedido-pedir').onclick = () => {
    const t = total();
    if (t > partida.caja) return;
    if (t === 0) { cerrar(null); return; }
    cerrar({ cantidad: Object.fromEntries(Object.entries(cantidad).filter(([, n]) => n > 0)), total: t });
  };
  $('#pedido-nada').onclick = () => cerrar(null);
  pinta();
  $('#pedido').classList.remove('hidden');
}
