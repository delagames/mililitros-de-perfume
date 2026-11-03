// El día y el dinero (secciones 3 y 6 de DISEÑO.md), sin nada de dibujo: el calendario, la cuota de
// autónomos, el trimestre, quién entra hoy (según las banderas de sus historias), la hora, el
// repartidor y los precios. main.js lo cuenta en el cuadro de diálogo.

export const DIAS_MES = 30;
export const APERTURA = 10 * 60, CIERRE = 15 * 60;   // en minutos: de 10:00 a 15:00

// ---------- el calendario ----------
export const mesDe = dia => Math.floor((dia - 1) / DIAS_MES) + 1;
export const diaDelMes = dia => ((dia - 1) % DIAS_MES) + 1;
// el trimestre: los tres últimos días de cada 90 el calendario se pone rojo
// (los días 20 a 22 de cada trimestre de juego: así se ve antes del final)
export const esTrimestre = dia => { const r = ((dia - 1) % 90) + 1; return r >= 20 && r <= 22; };
// una vez al mes, un cliente pide factura (el día 15)
export const esDiaFactura = dia => diaDelMes(dia) === 15;
const SEMANA = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
export const diaSemana = dia => SEMANA[(dia - 1) % 7];
export const hora = min => `${Math.floor(min / 60)}:${String(min % 60).padStart(2, '0')}`;

// ---------- la cuota ----------
// el día 1 de cada mes, antes de abrir; sube un poco cada mes, como la de verdad
export const cuotaDe = mes => 293.21 + (mes - 1) * 6;
export const RECARGO = 1.2;
// el alquiler del local, cada día 1 con la cuota (el primer mes, el casero lo perdona)
export const ALQUILER = 450.21;   // si no hay dinero, el Señor Mililitros la fía «con un pequeño recargo»
const redondea = n => Math.round(n * 100) / 100;
// todo acaba en ,21
export const a21 = n => Math.floor(n) + 0.21;

// Cobra la cuota: devuelve { cuota, pagado, fiado } y deja la caja y la deuda como queden
export function cobraCuota(partida) {
  const cuota = a21(cuotaDe(mesDe(partida.dia)));
  const alquiler = partida.dia > 1 ? ALQUILER : 0;
  const total = redondea(cuota + alquiler);
  const pagado = Math.min(partida.caja, total);
  const falta = redondea(total - pagado);
  partida.caja = redondea(partida.caja - pagado);
  const fiado = falta > 0 ? a21(falta * RECARGO) : 0;
  partida.deuda = redondea((partida.deuda || 0) + fiado);
  return { cuota, alquiler, pagado: redondea(pagado), fiado };
}

// paga lo que puede de la deuda, pero deja 30 € en caja para el pedido de mañana
export const COLCHON = 30;
export function pagaDeuda(partida) {
  const paga = Math.max(0, Math.min(partida.caja - COLCHON, partida.deuda));
  partida.caja = redondea(partida.caja - paga);
  partida.deuda = redondea(partida.deuda - paga);
  return redondea(paga);
}

// ---------- los ingredientes: precios y proveedores ----------
export const PRECIOS = { zreza: 1.21, pabaya: 1.21, meloc: 1.21, safre: 1.21, atania: 1.21, sunflora: 2.21, jumpluff: 2.21,
  bellossom: 1.21, skiploom: 1.21, miltank: 2.21, timburr: 3.21, wooper: 0.21 };
// los de los tres proveedores en persona solo se pueden pedir cuando se hacen clientes fijos
export const PROVEEDOR_DE = { bellossom: 'bellossom', miltank: 'miltank', timburr: 'timburr' };
export const disponible = (partida, id) => !PROVEEDOR_DE[id] || partida.proveedores.includes(PROVEEDOR_DE[id]);

// Lo que trae el repartidor: lo pedido o, si no se pidió nada, lo que le dio la gana
export function reparto(partida, ids) {
  let lista = Object.entries(partida.pedido || {}).filter(([, n]) => n > 0);
  const capricho = !lista.length;
  if (capricho) {
    const posibles = ids.filter(id => disponible(partida, id));
    lista = Array.from({ length: 2 }, () => [posibles[Math.floor(Math.random() * posibles.length)], 1]);   // (poca cosa: hay que pedir)
  }
  // lo mismo junto (el repartidor a capricho puede traer dos veces lo mismo)
  const junto = {};
  for (const [id, n] of lista) junto[id] = (junto[id] || 0) + n;
  lista = Object.entries(junto);
  for (const [id, n] of lista) partida.almacen[id] = (partida.almacen[id] || 0) + n;
  partida.pedido = {};
  return { lista, capricho };
}

// ---------- el Málaga (sección 2): juega cualquier día (main.js decide cuándo); al día siguiente se sabe cómo quedó ----------
// gana 40 %, empata 30 %, pierde 30 %, con un resultado creíble
// (si algo espera un resultado, «prefiere», sale ese el 70 % de las veces: si no, una historia que
// pide que pierda el Málaga podía tardar semanas)
export function jornada(prefiere = null) {
  const r = Math.random();
  const res = prefiere && Math.random() < 0.7 ? prefiere : r < 0.4 ? 'gana' : r < 0.7 ? 'empata' : 'pierde';
  const a = 1 + Math.floor(Math.random() * 3), b = Math.floor(Math.random() * a);
  const goles = res === 'gana' ? `${a}-${b}` : res === 'pierde' ? `${b}-${a}` : `${b}-${b}`;
  return { res, goles };
}

// ---------- quién entra hoy ----------
// Una visita sale si tiene todas sus banderas («requiere»), ninguna de «sin», toca el día que pide
// («cuando»: factura, trimestre) y no se ha hecho ya (salvo la n 0, la que se repite). Las de
// «solo_si_perfecto» salen si la anterior salió perfecta; las de «jornada-gana» o «jornada-pierde»,
// solo el día siguiente a ese resultado del Málaga; las de «minVisitas», cuando ese cliente ya ha
// venido esas veces (la vigésima de Totodile).
const tieneBandera = (m, partida, hoy) => (m.startsWith('jornada-') ? hoy.jornada === m.slice(8) : partida.marcas.includes(m));
export function visitaPara(dlg, partida, hoy) {
  const ok = v => (v.requiere || []).every(m => tieneBandera(m, partida, hoy))
    && (!v.minVisitas || (partida.cuentaVisitas?.[dlg.id] || 0) >= v.minVisitas)
    && !(v.sin || []).some(m => partida.marcas.includes(m))
    && (!v.cuando || ({ factura: hoy.factura, trimestre: hoy.trimestre, baja: hoy.baja }[v.cuando] ?? false))
    && (!v.solo_si_perfecto || (v.requiere || []).every(m => partida.perfectos.includes(m)))
    && (v.llega || []).length;
  const nuevas = (dlg?.visitas || []).filter(v => v.n > 0 && !partida.marcas.includes(v.marca) && ok(v)).sort((a, b) => a.n - b.n);
  if (nuevas.length) return nuevas[0];
  // la que se repite: la primera vez cuenta como visita nueva
  const repite = (dlg?.visitas || []).find(v => v.n === 0 && ok(v));
  if (repite) return repite;
  // si ya ha hecho alguna visita con encargo y hoy no tiene historia nueva, vuelve a por «lo de siempre»
  // (main.js le pone el saludo y lo que pide según su naturaleza): así nunca faltan clientes
  const hechas = (dlg?.visitas || []).filter(v => v.n > 0 && v.pide && partida.marcas.includes(v.marca));
  return hechas.length ? { n: 0, repetida: true, llega: [{ quien: dlg.id, texto: '…' }] } : null;
}

// Las historias que quedan por ver (sus marcas) y que todavía pueden salir: las que ya no pueden (la
// de la baja, si la baja ya pasó; la otra rama de una que se ha elegido) no cuentan. La vigésima de
// Totodile (la de «minVisitas») es un regalo, no historia: tampoco cuenta.
const BANDERAS_DE_SUCESO = ['cuota-1', 'trimestre-1', 'rosaleda', 'galgo-1', 'caja-b'];
export function historiasPendientes(lista, dialogos, partida) {
  const hechas = new Set(partida.marcas);
  const visitas = lista.flatMap(c => (dialogos[c.id]?.visitas || []).filter(v => v.marca && !v.minVisitas && (v.llega || []).length));
  const bajaPasada = partida.diaBaja != null && partida.dia > partida.diaBaja;
  const alcanzan = new Set();
  const puede = m => hechas.has(m) || alcanzan.has(m) || m.startsWith('jornada-') || BANDERAS_DE_SUCESO.includes(m) || (m === 'baja' && !bajaPasada);
  for (let cambio = true; cambio;) {
    cambio = false;
    for (const v of visitas) {
      if (hechas.has(v.marca) || alcanzan.has(v.marca)) continue;
      if ((v.sin || []).some(m => hechas.has(m))) continue;
      if (v.cuando === 'baja' && bajaPasada) continue;
      if ((v.requiere || []).every(puede)) { alcanzan.add(v.marca); cambio = true; }
    }
  }
  return [...alcanzan];
}

// Qué resultado del Málaga espera alguna historia que ya podría salir (solo le falta el partido)
export function jornadaEsperada(lista, dialogos, partida) {
  const quiere = [];
  for (const c of lista) for (const v of dialogos[c.id]?.visitas || []) {
    if (!v.marca || partida.marcas.includes(v.marca) || (v.sin || []).some(m => partida.marcas.includes(m))) continue;
    const pide = (v.requiere || []).filter(m => m.startsWith('jornada-'));
    if (pide.length && (v.requiere || []).every(m => m.startsWith('jornada-') || partida.marcas.includes(m))) quiere.push(...pide.map(m => m.slice(8)));
  }
  return quiere;
}

// Los clientes de hoy: entre 3 y 6, con los de historia nueva por delante de los que repiten (el final
// llega al acabar todas las historias: así no hay días de relleno). Los que vuelven a por «lo de
// siempre» se turnan: primero el que hace más que no viene, y el que vino ayer, solo si no hay otro.
export const NUEVOS_AL_DIA = 6;
export function clientesDeHoy(lista, dialogos, partida, hoy) {
  const con = lista.map(c => ({ c, v: visitaPara(dialogos[c.id], partida, hoy) })).filter(x => x.v);
  const mezcla = a => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(x => x[1]);
  // las de este lunes (dependen del partido) van las primeras: si no, se pierden hasta otra jornada
  const deLunes = x => (x.v.requiere || []).some(m => m.startsWith('jornada-')) || !!x.v.cuando;
  // (los que vuelven a por «lo de siempre» no son historia nueva: van detrás, para no quitarle el sitio a nadie)
  // (una visita que se repite, como la de Totodile, solo es nueva si tiene su marca y aún no se ha visto)
  const nuevos = mezcla(con.filter(x => !x.v.repetida && (x.v.n > 0 || (x.v.marca && !partida.marcas.includes(x.v.marca))))).sort((a, b) => deLunes(b) - deLunes(a));
  const ultima = id => partida.vinoEl?.[id] ?? -99;
  const repiten = mezcla(con.filter(x => !nuevos.includes(x)))
    .sort((a, b) => (ultima(a.c.id) === partida.dia - 1) - (ultima(b.c.id) === partida.dia - 1) || ultima(a.c.id) - ultima(b.c.id));
  const cuantos = Math.min(con.length, 3 + Math.floor(Math.random() * 4));
  const cola = [...nuevos.slice(0, NUEVOS_AL_DIA), ...repiten].slice(0, cuantos);
  // (si con eso no llegan a tres, pasa alguna historia más, para que la tienda no se quede vacía)
  return [...cola, ...nuevos.slice(NUEVOS_AL_DIA)].slice(0, Math.max(cola.length, Math.min(3, con.length))).map(x => x.c.id);
}
