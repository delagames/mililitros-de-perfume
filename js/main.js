// Estados del juego: inicio, calle, mostrador, taller y estante. Un día va de 10:00 a 15:00: por la
// mañana, la calle (la cuota si es día 1, algún suceso, limpiar el cristal); luego los clientes de
// hoy, el repartidor a las 14:59 y el cierre (contar la caja, el pedido, bajar la persiana).
// Más adelante: asesor y epílogo (sección 10 de DISEÑO.md).
// Como en El Pino Calcinado, la escena va a toda pantalla detrás y todo se habla en el cuadro
// de diálogo de abajo, con los botones dentro.
import { createEscena } from './escena.js';
import { CALLE } from './calle.js';
import { MOSTRADOR, GOTAS, muestras, muestraEn, tienda } from './mostrador.js';
import { pintaEmblema } from './emblema.js';
import { cargaClientes, entra, sale, quita } from './client.js';
import { loadSprite, portraitUrl } from './sprites.js';
import { HABITACION, deNoche } from './habitacion.js';
import { ALTILLO, cargaAltillo } from './altillo.js';
import { cargaSucesos, muestraSuceso } from './sucesos.js';
import { gemido, sfx, setMood, getPrefs, setMusic, setSfx, bajaMusica } from './audio.js';
import { TALLER, ESTANTE, taller, preparaTaller, echar, deshacer, nuevo, ponEstante } from './taller.js';
import { FONDOS, dibujoFondo, descargaFondo } from './fondos.js';
import { cargaIngredientes, ingrediente, nombreDe, colorDe, caracter, MAX, ponMax, desdePasos } from './perfume.js';
import { carga, guarda, guardaCopia, copias, exporta, importa, borra } from './save.js';
import { APERTURA, CIERRE, mesDe, cuotaDe, diaDelMes, diaSemana, esTrimestre, esDiaFactura, hora, cobraCuota, pagaDeuda,
  disponible, PROVEEDOR_DE, reparto, visitaPara, clientesDeHoy, jornada, a21, ALQUILER, COLCHON } from './dia.js';
import { limpiar, contarCaja, envolver, pulverizar, rinde, responde, cierra as cierraMinijuego } from './minijuegos.js';
import { abrePedido } from './pedido.js';
import { cargaPerros, calle as enLaCalle, bailan, perrosDeHoy } from './perros.js';
import { portraitUrl as caraDe } from './sprites.js';
import { cuento } from './cuento.js';
import { INTRO, FINAL } from './escenas-cuento.js';
import { cargaNaturalezas, naturaleza, conTic, PREGUNTAS, FAMILIAS, reaccion, FRASE_REACCION, CARA_REACCION, puntua, PRECIO, euros, NOMBRE_SABOR } from './deduccion.js';
import { apunta, abreLibro, cierraLibro, libroAbierto } from './libro.js';

const $ = sel => document.querySelector(sel);
const tactil = matchMedia('(pointer: coarse)').matches;   // en el móvil no se marca el botón con el foco

const escena = createEscena($('#escena'));
window.__juego = { estado: () => estado, ir: e => ir(e), echar: id => echar(id), vaciaCola: () => { partida.hoy.cola = []; }, epilogo: () => epilogo() };   // (para las pruebas)
let estado = null;
let ctx = null;           // paleta e imágenes que usan las vistas
let partida = {};         // lo guardado: el almacén de ingredientes, el estante, el número del siguiente perfume, la caja y el Libro
let encargo = null;       // el cliente que espera su perfume: { c, visita, nat, odiaExtra, preguntas, muestras }
let clientes = [];               // todos los de data/clients.json
let todos = {};                 // todos los clientes por id (para las escenas en que habla otro)
let ings = [];                  // los ingredientes
let imgsNoño = {};              // Ñoño de espaldas y de frente, para pulverizarle
let correos = [], asesor = {};  // los correos del Señor Mililitros y las ofertas del asesor
let mejoras = [];               // las mejoras de la tienda (data/upgrades.json)

function cargaImagen(src) {
  return new Promise((ok, mal) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = () => mal(new Error(`No se pudo cargar ${src}`));
    img.src = src;
  });
}

async function preparar() {
  const [P, morty] = await Promise.all([
    fetch('assets/ui/palette.json').then(r => r.json()),
    // el del mostrador, con la luz de tools/build_morty_luz.py (si falta, el original)
    cargaImagen('assets/sprites/morty/morty-mostrador.png').catch(() => cargaImagen('assets/sprites/morty/morty-trainer.png')),
    // las fuentes del lienzo tienen que estar antes de pintar los rótulos
    ...['16px "Pixelify Sans"', 'bold 16px "Pixelify Sans"', '8px Silkscreen', '16px Silkscreen', '24px "Caveat Brush"'].map(f => document.fonts.load(f)),
  ]);
  // Gengar, el ayudante; si no se puede cargar (sin conexión), la tienda abre sin él
  const gengarMostrador = await cargaImagen('assets/sprites/gengar/gengar-mostrador.png').catch(() => null);
  // el escudo del Málaga, en pixel (tools/build_escudo.py): en la pared de la tienda y en el fondo de pantalla
  const [escudo, escudoMini] = await Promise.all(['', '-mini'].map(t => cargaImagen(`assets/ui/escudo-malaga-pixel${t}.png`).catch(() => null)));
  ctx = { P, img: { morty, gengarMostrador, escudo, escudoMini } };
  tienda.dineroHoy = () => partida?.hoy?.ingresos || 0;
  tienda.conEscudo = () => !!partida?.mejoras?.includes('escudo');
  tienda.tiene = id => !!partida?.mejoras?.includes(id);
  tienda.calendario = () => ({ dia: diaDelMes(partida?.dia || 1), rojo: !!partida?.hoy?.trimestre });
  tienda.ocioso = () => estado === 'mostrador' && !encargo && partida?.hoy?.fase === 'abierto' && performance.now() - ultimaAccion > 20000;
  // para la habitación de noche: Morty dormido (de su animación de caer) y Gengar a los pies
  cargaAltillo();
  [deNoche.morty, deNoche.gengar] = await Promise.all([loadSprite('morty', ['Faint']).catch(() => null), loadSprite('gengar').catch(() => null)]);
  SUCESOS = await cargaSucesos();
  // el taller: los ingredientes, el almacén y el estante (guardados en el navegador)
  ings = await cargaIngredientes();
  empiezaPartida(carga() || {});
  await cargaNaturalezas();
  const lista = await cargaClientes();
  todos = Object.fromEntries(lista.map(c => [c.id, c]));
  clientes = lista;
  // las historias de todos: hacen falta para saber quién tiene algo que contar hoy
  await Promise.all(lista.map(c => fetch(`data/dialogues/${c.id}.json`).then(r => (r.ok ? r.json() : null)).catch(() => null)
    .then(d => { dialogos[c.id] = d; })));
  correos = await fetch('data/emails.json').then(r => r.json()).catch(() => []);
  mejoras = await fetch('data/upgrades.json').then(r => r.json()).catch(() => []);
  asesor = await fetch('data/advisor.json').then(r => r.json()).catch(() => ({ ofertas: [] }));
  await cargaPerros();
  [imgsNoño.espaldas, imgsNoño.frente] = await Promise.all(['espaldas', 'frente']
    .map(v => cargaImagen(`assets/sprites/clientes/sudowoodo/${v}.png`).catch(() => null)));
  pintaEmblema($('#emblema'), P);
}

// Rellena lo que le falte a una partida (nueva o de una versión anterior)
function empiezaPartida(p) {
  partida = p;
  partida.dia ??= 1;
  partida.proveedores ??= [];
  partida.almacen ??= {};
  // de lo normal se empieza con cinco; lo de los proveedores, cuando los haya
  for (const i of ings) partida.almacen[i.id] ??= disponible(partida, i.id) ? 8 : 0;
  partida.estante ??= [];
  partida.numero ??= 1;
  partida.caja ??= 120;   // (se empieza con algo en la caja: lo de la tarjeta)
  partida.deuda ??= 0;
  partida.libro ??= {};
  partida.marcas ??= [];
  partida.perfectos ??= [];
  partida.sucesos ??= [];
  partida.pedido ??= {};
  partida.hoy ??= null;
  partida.consejos ??= [];
  partida.correos ??= 0;          // cuántos correos del Señor Mililitros han llegado
  partida.optimizaciones ??= [];  // las ofertas del asesor aceptadas
  partida.asesorVisto ??= [];     // las que ya ha propuesto
  partida.cartas ??= [];          // cartas certificadas pendientes: { dia, oferta }
  partida.tickets ??= 0;          // cuántas veces ha venido el galgo del ticket
  partida.vacaciones ??= 0;       // cuántas veces se ha pulsado «Vacaciones»
  partida.diaBaja ??= partida.dia <= 8 ? 8 + Math.floor(Math.random() * 7) : partida.dia + 3 + Math.floor(Math.random() * 5);
  partida.introVista ??= partida.dia > 1;   // a quien ya iba por la mitad, sin intro
  partida.mejoras ??= [];
  partida.cuentaVisitas ??= {};   // cuántas veces ha venido cada cliente
  aplicaMejoras();
  preparaTaller({ orden: ings.map(i => i.id), almacen: partida.almacen, oyente: alTaller, pasos: partida.hoy?.frasco || [] });
}

// Lo que se ve en cada sitio: la vista, el rótulo de arriba, quién habla abajo y los botones
const SITIOS = {
  calle: {
    vista: CALLE,
    lugar: 'La calle',
    habla: () => hablaCalle(),
    botones: () => botonesCalle(),
  },
  mostrador: {
    vista: MOSTRADOR,
    lugar: 'El mostrador',
    // con un cliente esperando, se le vuelve a oír lo que pide y salen los botones del encargo
    habla: () => (encargo?.entregado ? { ...MORTY, texto: 'Cobrado y apuntado. Solo falta despedirle.' }
      : encargo ? fraseDe(encargo.c, { quien: encargo.visita.atiende || encargo.c.id, texto: encargo.visita.pide })
      : partida.hoy?.baja ? { cara: portraitUrl('gengar', 'Joyous'), nombre: 'Gengar', texto: 'Morty está malo. Hoy atiendo yo. Sonrían.' }
        // (de vez en cuando, Gengar suelta lo del queso: otra pista del final)
        : partida.dia > 2 && Math.random() < 0.12 ? { cara: portraitUrl('gengar', 'Special0'), nombre: 'Gengar', texto: 'Mmmmm… queso gruyer.' }
        : { cara: 'assets/portraits/morty/Normal.png', nombre: 'Morty Pociones', texto: 'Los frascos en su sitio, las muestras en su balda y la bufanda del Málaga puesta. Que entre quien sea.' }),
    botones: () => (encargo ? botonesEncargo() : botonesMostrador()),
  },
  taller: {
    vista: TALLER,
    lugar: 'El taller',
    habla: () => ({ ...MORTY, cara: portraitUrl('morty', 'Inspired'),
      texto: taller.perfume.pasos.length
        ? `Va por ${taller.perfume.pasos.length} de ${MAX}. Huele ${caracter(taller.perfume).toLowerCase()}.`
        : encargo ? `Para ${encargo.c.nombre}: «${encargo.visita.pide}»`
          : 'El taller. Arrastra un ingrediente al frasco, o tócalo para ver qué hace.' }),
    botones: () => botonesTaller(),
  },
  estante: {
    vista: ESTANTE,
    lugar: 'El estante',
    habla: () => ({ ...MORTY, texto: partida.estante.length
      ? `${partida.estante.length} perfume${partida.estante.length > 1 ? 's' : ''} en el estante. El último: ${partida.estante.at(-1).nombre}.`
      : 'El estante, vacío. Todavía no has embotellado nada.' }),
    botones: [{ texto: 'Al taller', ir: 'taller' }, { texto: 'Al mostrador', ir: 'mostrador', secundario: true }],
  },
};
const MORTY = { cara: 'assets/portraits/morty/Normal.png', nombre: 'Morty Pociones' };

// ---------- el taller ----------
// Los botones del taller según cómo vaya el perfume (y si hay un ingrediente elegido)
function botonesTaller(conEchar = false) {
  const hay = taller.perfume.pasos.length > 0;
  const lista = [];
  if (conEchar && taller.seleccion) lista.push({ texto: 'Echar', accion: () => echar(taller.seleccion) });
  if (hay) lista.push({ texto: encargo ? 'Dárselo' : 'Embotellar', accion: embotellar, secundario: conEchar });
  if (hay) lista.push({ texto: 'Deshacer', accion: deshacer, secundario: true });
  if (!conEchar || !hay) lista.push({ texto: 'Mostrador', ir: 'mostrador', secundario: true });
  return lista.slice(0, 3);
}

// Lo que pasa en el taller, en el cuadro de diálogo
function alTaller(que, id) {
  const ing = ingrediente(id), p = taller.perfume;
  // mientras Gengar enseña, el taller es suyo: solo suena al echar
  if (encargo?.tutorial || (tocaDemo() || fichaDemoActiva)) { if (que === 'echado') sfx('echar'); return; }
  const quedan = n => (n === 1 ? 'Queda 1' : `Quedan ${n}`);
  if (que === 'selecciona') {
    decir({ cara: portraitUrl('morty', 'Worried'), nombre: ing.nombre, texto: `${ing.dice} ${quedan(partida.almacen[id] ?? 0)}.` }, botonesTaller(true));
  } else if (que === 'echado') {
    sfx('echar');
    if (partida.hoy) partida.hoy.frasco = taller.perfume.pasos;
    guarda(partida);
    decir({ ...MORTY, cara: portraitUrl('morty', 'Worried'), texto: `${ing.nombre}. Van ${p.pasos.length} de ${MAX}: huele ${caracter(p).toLowerCase()}.` }, botonesTaller(true));
  } else if (que === 'lleno') {
    decir({ ...MORTY, texto: 'El frasco está lleno. Embotella, o deshaz el último.' }, botonesTaller());
  } else if (que === 'sin') {
    decir({ ...MORTY, cara: portraitUrl('morty', 'Stunned'), texto: disponible(partida, id)
      ? `No queda ${ing.nombre}. Habrá que pedirlo al cerrar.` : `${ing.nombre}: aún no me lo trae nadie.` }, botonesTaller());
  } else if (que === 'frasco') {
    gengarHuele();
  } else if (que === 'deshecho') {
    sfx('deshacer');
    if (partida.hoy) partida.hoy.frasco = taller.perfume.pasos;
    guarda(partida);
    decir({ ...MORTY, texto: `Fuera ${ing.nombre}, por el fregadero. No vuelve al bote.` }, botonesTaller());
  }
}

// Las historias cerradas: las de los clientes que ya han tenido su última visita (para el Libro)
function historiasCerradas() {
  let hechas = 0, total = 0;
  for (const [id, d] of Object.entries(dialogos)) {
    const visitas = (d.visitas || []).filter(v => v.n > 0 && v.marca);
    if (!visitas.length || !todos[id]) continue;
    total++;
    const ultima = Math.max(...visitas.map(v => v.n));
    if (visitas.some(v => v.n === ultima && partida.marcas.includes(v.marca))) hechas++;
  }
  return [hechas, total];
}

function embotellar() {
  const p = taller.perfume;
  if (!p.pasos.length || encargo?.tutorial) return;
  sfx('embotellar');
  const perfume = { numero: partida.numero, nombre: nombreDe(p, partida.numero),
    color: partida.hoy?.trimestre ? '#A4ABA8' : colorDe(p, ctx.P),   // en el trimestre todo huele a papel
    pos: p.pos, ingredientes: p.pasos.map(s => s.id), obra: p.obra };
  if (['skiploom', 'pabaya', 'timburr'].every(id => perfume.ingredientes.includes(id)) && !partida.marcas.includes('rosaleda')) {
    // la primera vez que sale La Rosaleda, se celebra: los perros bailan y Morty lo dice
    marca('rosaleda');
    sfx('logro');
    bailan();
    if (partida.hoy) partida.hoy.rosaledaNueva = true;
  }
  if (partida.hoy) partida.hoy.frasco = [];
  // con un cliente esperando, el frasco es para él: se lleva al mostrador
  if (encargo) {
    partida.numero++;
    nuevo();
    ir('mostrador');
    entrega(perfume);
    return;
  }
  partida.estante.push(perfume);
  partida.numero++;
  guarda(partida);
  nuevo();
  const rosaleda = partida.hoy?.rosaledaNueva ? ' ¡Y es La Rosaleda! El olor de los domingos.' : '';
  if (partida.hoy) partida.hoy.rosaledaNueva = false;
  decir({ ...MORTY, cara: portraitUrl('morty', 'Happy'), texto: `Embotellado: ${perfume.nombre}. Al estante.${rosaleda}` },
    [{ texto: 'Otro', accion: () => ir('taller') }, { texto: 'Ver el estante', ir: 'estante', secundario: true },
      { texto: 'Mostrador', ir: 'mostrador', secundario: true }]);
}

function ir(siguiente) {
  estado = siguiente;
  fichaFactura++;
  if (sucesoActual) { sucesoActual.cerrar(true); sucesoActual = null; bajaMusica(false); }
  enLaCalle.repartidor = -1;
  if (!encargo) quita();          // el cliente que espera su perfume se queda en el mostrador
  muestras.resaltar = false;
  cierraLibro();
  if (encargo?.tutorial && !['mostrador', 'taller'].includes(siguiente)) acabaPractica();   // (tutorial dejado a medias)
  if (siguiente === 'inicio') cierraMinijuego();
  const enJuego = siguiente !== 'inicio';
  $('#inicio-fondos').classList.toggle('hidden', !partida?.marcas?.includes('epilogo') && !partida?.mejoras?.includes('cuadro') && !modoPruebas);
  $('#inicio').classList.toggle('hidden', enJuego);
  $('#juego').classList.toggle('hidden', !enJuego);
  escena.pausar(false);
  if (!enJuego) {
    // de fondo, la calle desenfocada
    escena.mostrar(CALLE, ctx);
    escena.setBordes(null, null);
    if (!tactil) $('#inicio-abrir').focus({ preventScroll: true });
    return;
  }
  const sitio = SITIOS[siguiente];
  if (siguiente === 'estante') ponEstante(partida.estante);
  ponMusica();
  ponLugar(sitio.lugar);
  cierraMinijuego();
  ponCartel();
  const habla = typeof sitio.habla === 'function' ? sitio.habla() : sitio.habla;
  const lista = typeof sitio.botones === 'function' ? sitio.botones() : sitio.botones;
  const tips = siguiente === 'taller' && encargo ? consejos('taller', encargo.c.id === 'totodile' && 'zreza') : [];
  if (tips.length) serie([habla, ...tips], lista); else decir(habla, lista);
  escena.mostrar(sitio.vista, ctx);
  maquetar();
}

// Los botones del cuadro de diálogo: cada uno va a un sitio (ir) o hace algo (accion)
// La música según el sitio y el momento: la baja y el cierre mandan sobre el sitio
function ponMusica() {
  const hoy = partida.hoy;
  if (hoy?.baja) setMood('baja');
  else if (hoy?.fase === 'cierre' && estado === 'mostrador') setMood('cierre');
  else setMood({ calle: 'calle', taller: 'taller', estante: 'taller' }[estado] || 'tienda');
}

// en local o con ?demo: los botones de pruebas (y los fondos, sin tener que acabar el juego)
const modoPruebas = ['localhost', '127.0.0.1'].includes(location.hostname) || location.search.includes('demo');
let ultimoToque = 0;
let ultimaAccion = performance.now();   // (para saber si Morty lleva un rato sin hacer nada)
// ni zoom con dos toques ni pellizcando (Safari no hace caso a user-scalable=no)
document.addEventListener('dblclick', ev => ev.preventDefault(), { passive: false });
document.addEventListener('gesturestart', ev => ev.preventDefault(), { passive: false });
addEventListener('pointerdown', () => { ultimaAccion = performance.now(); }, true);
function botones(lista) {
  const acciones = $('#acciones');
  acciones.replaceChildren(...lista.map(b => {
    const el = document.createElement('button');
    el.textContent = b.texto;
    if (b.secundario) el.classList.add('secundario');
    if (b.apagado) el.classList.add('secundario', 'apagado');
    if (b.numero) el.classList.add('numero');
    const creado = performance.now();
    el.addEventListener('click', () => {
      // el segundo toque de un doble toque no elige el botón que acaba de salir debajo
      const ahora = performance.now();
      if (ahora - creado < 250 && ahora - ultimoToque < 350) return;
      ultimoToque = ahora;
      sfx('toque'); b.ir ? ir(b.ir) : b.accion();
    });
    return el;
  }));
  if (!tactil) acciones.querySelector('button')?.focus({ preventScroll: true });
}

// Quien habla dice su texto y, con la última tanda, salen los botones. Los textos que no caben
// en tres líneas se parten en tandas (como en El Pino): ▸ o tocar el cuadro pasa a la siguiente.
let tandas = [], tanda = 0, pendientes = [];
function decir(habla, lista = []) {
  pendientes = lista;
  if (partida.hoy?.baja && estado !== 'calle' && estado !== 'inicio') {
    if (habla.nombre === 'Morty Pociones') habla = { ...habla, nombre: 'Gengar', cara: portraitUrl('gengar', 'Happy') };
    else if (habla.nombre && habla.nombre !== 'Gengar' && habla.texto) habla = { ...habla, texto: habla.texto.replace(/\bMorty\b/g, 'Gengar') };
  }
  // la cola de Girafarig gime de vez en cuando al hablar (más o menos una de cada tres frases)
  if (habla.nombre === 'La cola' && Math.random() < 0.35) gemido();
  if (habla.temblor) sfx('telefono');
  dialogo({ ...habla, texto: '' });
  tandas = paginar(habla.texto);
  tanda = 0;
  mostrarTanda();
}

function mostrarTanda() {
  $('#dialogo-texto').textContent = tandas[tanda];
  if (tanda < tandas.length - 1) botones([{ texto: '▸', secundario: true, accion: siguienteTanda }]);
  else botones(pendientes);
}

function siguienteTanda() {
  if (tanda >= tandas.length - 1) return;
  tanda++;
  mostrarTanda();
}
$('#dialogo').addEventListener('click', ev => { if (!ev.target.closest('button')) siguienteTanda(); });

// Parte el texto en tandas que quepan en el sitio que hay encima de la franja de los botones (el cuadro
// es fijo): por frases y, si una no cabe, palabra a palabra
function paginar(texto) {
  const p = $('#dialogo-texto');
  const lh = parseFloat(getComputedStyle(p).lineHeight);
  const libre = p.parentElement.getBoundingClientRect().bottom - p.getBoundingClientRect().top;
  const alto = Math.max(1, Math.floor((libre + 1) / lh)) * lh + 2;
  const cabe = t => { p.style.maxHeight = 'none'; p.textContent = t; const ok = p.scrollHeight <= alto; p.style.maxHeight = ''; return ok; };
  if (cabe(texto)) return [texto];
  // por frases (tras «…» solo si lo que sigue empieza en mayúscula) y, si una no cabe, por comas
  const frases = texto.split(/(?<=[.!?»])\s+|(?<=…)\s+(?=[A-ZÁÉÍÓÚÑ¿¡«])/).flatMap(f => (cabe(f) ? [f] : f.split(/(?<=[,;:])\s+/)));
  const out = [];
  let cur = '';
  for (const frase of frases) {
    const cand = cur ? `${cur} ${frase}` : frase;
    if (cabe(cand)) { cur = cand; continue; }
    if (cur && cabe(frase)) { out.push(cur); cur = frase; continue; }
    for (const palabra of frase.split(' ')) {
      const c2 = cur ? `${cur} ${palabra}` : palabra;
      if (cabe(c2) || !cur) cur = c2;
      else { out.push(cur); cur = palabra; }
    }
  }
  if (cur) out.push(cur);
  return out;
}

// La cara nueva no se ve hasta que carga; si ese Pokémon no tiene esa cara, sale la Normal
function dialogo({ cara = '', nombre = '', texto, estilo = '', temblor = false }) {
  // el día de la baja, todas las caras de Morty son la de cansado
  if ((partida.hoy?.baja || partida.hoy?.jornada === 'pierde') && cara.includes('portraits/morty/')) cara = portraitUrl('morty', 'Cansado');
  // el Señor Mililitros habla en una caja negra, y al teléfono, con el texto temblando
  $('#dialogo').classList.toggle('jefe', estilo === 'jefe');
  $('#dialogo').classList.toggle('temblor', temblor);
  $('#dialogo-cara').classList.toggle('borroso', !!partida.hoy?.baja && !!cara && !/morty|gengar/.test(cara));
  const img = $('#dialogo-cara');
  if (!cara) img.removeAttribute('src');
  else if (img.getAttribute('src') !== cara) {
    img.style.visibility = 'hidden';
    img.onload = () => { img.style.visibility = ''; };
    img.onerror = () => {
      const normal = cara.replace(/\/\w+\.png$/, '/Normal.png');
      if (img.getAttribute('src') !== normal) img.src = normal; else img.style.visibility = '';
    };
    img.src = cara;
  }
  $('#dialogo-nombre').textContent = nombre;
  $('#dialogo-texto').textContent = texto;
}

// ---------- los clientes de hoy ----------
function pasaCliente() {
  const hoy = partida.hoy;
  if (hoy.cola[0] === 'galgo-ticket') { hoy.cola.shift(); guarda(partida); galgo(); return; }
  let c = null, visita = null;
  while (hoy.cola.length && !visita) {
    c = todos[hoy.cola[0]];
    visita = c && visitaPara(dialogos[c.id], partida, hoy);
    if (!visita) hoy.cola.shift();
  }
  guarda(partida);
  if (!visita) { decir(SITIOS.mostrador.habla(), SITIOS.mostrador.botones()); return; }
  botones([]);
  // Ditto entra con la forma de otro cliente
  const aspecto = (visita.forma && todos[visita.forma]) || c;
  sfx('puerta');
  entra(aspecto, sprite => {
    if (estado !== 'mostrador') return;
    if (!sprite) {
      decir({ cara: 'assets/portraits/morty/Normal.png', nombre: 'Morty Pociones', texto: 'Parecía que entraba alguien. Era el viento.' }, SITIOS.mostrador.botones());
      return;
    }
    const despedir = [{ texto: 'Despedirlo', accion: () => {
      quitaDeCola(c.id);
      marca(visita.marca);
      (visita.marcas_extra || []).forEach(marca);
      proveedorNuevo(c.id, null);
      botones([]);
      sale(() => { pasaLaHora(); if (estado === 'mostrador') decir(SITIOS.mostrador.habla(), SITIOS.mostrador.botones()); });
    } }];
    // los que vuelven a por «lo de siempre»: un saludo y lo que pide según su naturaleza
    if (visita.repetida) {
      const dlgR = dialogos[c.id];
      const natR = naturaleza(dlgR.naturaleza) ? dlgR.naturaleza : 'quirky';
      const opciones = PIDE_REPITE[naturaleza(natR).gusta || 'neutra'];
      visita = { ...visita, llega: [{ quien: c.id, cara: 'Happy', texto: SALUDOS[Math.floor(Math.random() * SALUDOS.length)] }],
        pide: opciones[Math.floor(Math.random() * opciones.length)] };
    }
    const frases = frasesVisita(c, visita);
    // Ñoño no pide perfumes (no se ducha): es la ocasión de rociarle desodorante mientras mira las estampitas
    if (c.id === 'sudowoodo') {
      serie([...frases, { ...MORTY, cara: portraitUrl('morty', 'Worried'), texto: 'Ñoño se ha puesto a mirar sus estampitas, muy concentrado. Es el momento del desodorante.' }],
        [{ texto: 'Pulverizar', accion: () => juegaNoño(c, despedir) }, { texto: 'Ahora no', secundario: true, accion: () => serie([{ ...MORTY, texto: 'Otro día.' }], despedir) }]);
      return;
    }
    if (!visita.pide) { serie(frases, despedir); return; }
    // pide un perfume: se queda esperando hasta que Morty se lo dé
    // si la visita la atiende otro (Slowking en la del Mákina), los gustos son los suyos
    const dlg = dialogos[visita.atiende || c.id] || dialogos[c.id];
    const nat = visita.naturaleza || (naturaleza(dlg.naturaleza) ? dlg.naturaleza : 'quirky');
    const cola = naturaleza(dlg.naturaleza_cola);
    encargo = { c, visita, nat, odiaExtra: cola?.odia ? [cola.odia] : [], preguntas: [], muestras: 0, pistas: [] };
    // (con el primero, Gengar lo enseña haciéndolo: lo de los botones lo cuenta al acabar)
    serie([...frases, ...consejos('escucha', !tocaDemo() && 'botones')], botonesEncargo());
  });
}

// Lo que dice al llegar. La visita que se repite (la n 0) tiene muchas frases sueltas: una o dos.
// En el trimestre, todos hablan de facturas.
const DE_GENGAR = ['Bienvenido, {c}. Morty está malo. Yo sé lo que hiciste el jueves.', 'Hola, {c}. Pase. Su madre le manda recuerdos. La de verdad.',
  '{c}. Le esperaba. Le esperaba desde hace mucho.', 'Morty no está. Morty está en todas partes. Pase, {c}.',
  'Qué buen día, {c}. Para algunos.', 'Hola, {c}. No mire detrás de usted. Ahora sí.'];
const DE_FACTURAS = ['Antes de nada: ¿esto me lo puedes facturar? Es el trimestre.', '¿Tú ya has presentado el trimestre? Yo estoy de facturas hasta las orejas.',
  'Perdona la cara. Llevo tres días con el trimestre.', 'Si me haces factura, mejor. Si no, también. Es el trimestre, ya sabes.'];
function frasesVisita(c, v) {
  let llega = v.llega;
  if (v.n === 0 && llega.length > 3) llega = llega.map(f => [Math.random(), f]).sort((a, b) => a[0] - b[0]).slice(0, 1 + Math.floor(Math.random() * 2)).map(x => x[1]);
  const frases = llega.map(f => fraseDe(c, f));
  if (partida.hoy?.trimestre) frases.unshift(fraseDe(c, { quien: c.id, cara: 'Normal', texto: DE_FACTURAS[Math.floor(Math.random() * DE_FACTURAS.length)] }));
  // el día de la baja atiende Gengar, con su sonrisa, y dice cosas que no debería saber
  if (partida.hoy?.baja) frases.unshift({ cara: portraitUrl('gengar', 'Special0'), nombre: 'Gengar', texto: DE_GENGAR[Math.floor(Math.random() * DE_GENGAR.length)].replace('{c}', c.nombre) });
  if (v.pide) frases.push(fraseDe(c, { quien: v.atiende || c.id, cara: 'Normal', texto: v.pide }));
  return frases;
}

function juegaNoño(c, despedir) {
  decir({ ...MORTY, cara: portraitUrl('morty', 'Worried'), texto: 'Mantén el dedo para rociarle. Cuando baje las estampitas para mirarte, suelta.' },
    [{ texto: 'Dejarlo', secundario: true, accion: rinde }]);
  pulverizar(imgsNoño, r => {
    const dice = r.gana ? [{ quien: 'sudowoodo', cara: 'Happy', texto: '¿Ha llovido? Huele a… a limpio. ¿Eso qué es?' },
      { quien: 'morty', cara: 'Happy', texto: 'Primavera, Ñoño. Ha entrado la primavera.' }]
      : r.pillado ? [{ quien: 'sudowoodo', cara: 'Joyous', texto: '¡Jajajaja! ¡Que me echas espray! ¡Jajaja! ¿Por qué?' },
        { quien: 'morty', cara: 'Stunned', texto: 'Era… para las estampitas. Que no se pongan amarillas.' }]
        : [{ quien: 'morty', cara: 'Worried', texto: 'Otro día será.' }];
    if (r.gana) {
      marca('desodorante');
      partida.caja = Math.round((partida.caja + 3.21) * 100) / 100;
      partida.hoy.ingresos = Math.round((partida.hoy.ingresos + 3.21) * 100) / 100;
      dice.push({ quien: 'morty', cara: 'Inspired', texto: 'Del gusto, Ñoño se deja 3,21 € en el mostrador sin darse cuenta. Ya se lo devolveré. Algún día.' });
      guarda(partida);
    }
    serie(dice.map(f => fraseDe(c, f)), despedir);
  });
}

// ---------- Gengar, probador (sección 4): una vez al día huele el frasco y dice hacia dónde se ha
// pasado; una de cada cinco veces miente, porque le hace gracia ----------
function gengarHuele() {
  const hoy = partida.hoy;
  if (!encargo) { decir(GENGAR('Happy', 'Huele bien. Pero sin cliente delante, yo qué sé.'), botonesTaller()); return; }
  const puede = partida.mejoras.includes('cafetera') ? 2 : 1;
  if ((+hoy.gengarOlio || 0) >= puede) { decir(GENGAR('Sigh', `Ya he olido ${puede === 1 ? 'uno' : 'dos'} hoy. Tengo la nariz cansada. Mañana.`), botonesTaller()); return; }
  hoy.gengarOlio = (+hoy.gengarOlio || 0) + 1;
  guarda(partida);
  const n = naturaleza(encargo.nat);
  const p = taller.perfume;
  const miente = Math.random() < 0.2;
  const odia = puntua(encargo.nat, { pos: p.pos, ingredientes: p.pasos.map(x => x.id) }, ingrediente, encargo.odiaExtra) === 'odia';
  const [dx, dy] = [p.pos[0] - n.zona[0], p.pos[1] - n.zona[1]];
  const dentro = Math.hypot(dx, dy) <= n.radio;
  let texto;
  if (odia) texto = miente ? 'Mmm… Perfecto. Dáselo ya.' : 'Uf. Esto lleva algo que no soporta. Fuera eso.';
  else if (dentro) texto = miente ? 'Le falta algo. No sé qué. Algo.' : 'Ni lo toques. Está en su sitio.';
  else {
    const eje = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'calido' : 'fresco') : (dy > 0 ? 'intenso' : 'suave');
    const contrario = { calido: 'fresco', fresco: 'calido', intenso: 'suave', suave: 'intenso' };
    texto = { calido: 'Demasiado cálido. Le sobra calor.', fresco: 'Demasiado fresco. Le falta calor.', intenso: 'Demasiado intenso. Bájale.', suave: 'Muy suave. Le falta fuerza.' }[miente ? contrario[eje] : eje];
  }
  decir(GENGAR('Normal', `*snif, snif* ${texto}`), botonesTaller());   // (la misma cara, mienta o no)
}

// ---------- el tutorial: Gengar hace dos perfumes delante (lo pidió Jorge) ----------
// En la partida, el primer cliente (Totodile) lo hace Gengar de verdad, y luego ofrece un segundo
// ejemplo distinto, de práctica (Quagsire). Desde el menú, «Tutorial» enseña los dos otra vez, de
// práctica, sin tocar la partida (lo que gasta del almacén se devuelve).
const tocaDemo = () => encargo && !encargo.entregado && !encargo.tutorial && encargo.c.id === 'totodile' && encargo.visita.n === 1
  && !partida.marcas.includes('totodile-1') && !partida.consejos.includes('demo');
const GENGAR = (cara, texto) => ({ cara: portraitUrl('gengar', cara), nombre: 'Gengar', texto });
const EXPLICA = {
  momento: 'Día o noche es arriba o abajo en el mapa: el día, suave (abajo); la noche, intensa (arriba). Y fíjate en cuánto: «un pelín» es casi en el centro; «un poco», cerca; «bastante», a medio camino; «muy», casi al borde.',
  abrigo: 'Fresco o cálido es izquierda o derecha: fresquito a la izquierda; que abrigue, a la derecha. Con su «un pelín», «un poco», «bastante» o «muy», que es lo lejos del centro.',
  odia: 'Y lo que no soporta, ni una gota: si el perfume lleva algo de eso, se va sin pagar. Cada color de bote es un sabor, el mismo que en la balda de muestras: el amargo, que es el morado y el verde, ni tocarlo.',
};
const EJEMPLOS = [
  { id: 'totodile', nat: 'naughty', pide: 'Con chispa, como yo cuando regateo. Para el cumpleaños de mi prima.',
    leePide: '«Con chispa» suena a picante. Nunca te dicen lo que son: lo que piden es la pista.',
    preguntas: ['momento', 'abrigo', 'odia'], muestras: ['picante'],
    resumen: 'Resumen: le gusta lo picante, quiere calor y le da igual el día que la noche. Su sitio: a la derecha, a media altura. Y nada amargo.' },
  { id: 'quagsire', nat: 'relaxed', pide: 'Algo que huela a domingo: a un gajo de limón con las pipas, que se note en la grada.',
    leePide: '«Un gajo de limón» suena a ácido, a cítrico. Pero esta vez solo hago dos preguntas, como tú.',
    preguntas: ['momento', 'abrigo'], muestras: ['dulce', 'citrico'],
    resumen: 'Resumen: le gusta lo ácido (cítrico, arriba a la izquierda), lo quiere fresquito y para la noche. Y nada dulce: ni Meloc ni la leche de Miltank ni pétalos de Bellossom.' },
];
const FRASE_MUESTRA = {
  gusta: 'Le gusta: vamos bien, va por ahí.',
  igual: 'Le da igual: no es lo suyo, pero tampoco molesta.',
  odia: '¿Ves la cara? Eso lo odia. Los botes de ese color, ni tocarlos en el taller: se iría sin pagar.',
};

// Lo que hace Gengar delante del cliente: lee lo que pide, pregunta, da a oler y resume
function gengarEnsena(ej = EJEMPLOS[0], alAcabar = null) {
  if (!encargo.tutorial) encargo.demo = true;   // (se da por vista al entregarlo: si se recarga a medias, vuelve a empezar)
  const n = naturaleza(encargo.nat);
  const frases = [GENGAR('Special0', encargo.tutorial ? 'Mira cómo lo hago yo.' : 'Este lo hago yo, que es el primero. Tú mira, que luego te toca.'),
    GENGAR('Normal', ej.leePide)];
  for (const id of ej.preguntas) {
    const p = PREGUNTAS.find(q => q.id === id);
    const r = p.responde(n.zona, n.odia);
    encargo.pistas.push(r.replace(/\.$/, ''));
    encargo.preguntas.push(id);
    frases.push(GENGAR('Normal', p.pregunta), dice(r), GENGAR('Happy', EXPLICA[id]));
  }
  if (ej.preguntas.length === 3) frases.push(GENGAR('Special0', 'Ojo: yo he hecho tres preguntas para enseñártelas, pero tú solo podrás hacer dos por cliente.'));
  for (const famId of ej.muestras) {
    const fam = FAMILIAS.find(f => f.id === famId);
    const reac = reaccion(encargo.nat, fam.id, encargo.odiaExtra);
    encargo.pistas.push(`${fam.nombre}: ${{ gusta: 'le gusta', igual: 'le da igual', odia: 'lo odia' }[reac]}`);
    encargo.muestras++;
    frases.push(GENGAR('Normal', `Una muestra de la balda: la de ${fam.nombre.toLowerCase()}.`), dice(FRASE_REACCION[reac][0], CARA_REACCION[reac]), GENGAR(reac === 'odia' ? 'Surprised' : 'Joyous', FRASE_MUESTRA[reac]));
  }
  frases.push(GENGAR('Special0', ej.resumen), GENGAR('Normal', 'Todo esto queda apuntado en el cartel de arriba del taller.'));
  serie(frases, [{ texto: 'Al taller', accion: () => { ir('taller'); gengarFormula(alAcabar); } }]);
}
// En el taller: busca la mezcla que cae en su zona con lo que hay (sin lo que odia), y la echa poco a poco
function gengarFormula(alAcabar = null) {
  const n = naturaleza(encargo.nat);
  const odiado = id => [n.odia, ...(encargo.odiaExtra || [])].includes(FAMILIAS.find(f => f.id === ingrediente(id)?.familia)?.sabor);
  const ids = Object.keys(partida.almacen).filter(id => partida.almacen[id] > 0 && ingrediente(id) && !ingrediente(id).inestable && !ingrediente(id).base && !odiado(id));
  let mejor = { d: Infinity, plan: [] };
  const prueba = plan => {
    const [x, y] = desdePasos(plan.map(id => ({ id, lado: 0 }))).pos;
    const d = Math.hypot(x - n.zona[0], y - n.zona[1]) + plan.length * 0.01;
    if (d < mejor.d) mejor = { d, plan };
  };
  const hay = plan => plan.every(id => plan.filter(x => x === id).length <= (partida.almacen[id] || 0));
  for (const a of ids) { prueba([a]); for (const b of ids) { if (hay([a, b])) prueba([a, b]); for (const c of ids) if (hay([a, b, c])) prueba([a, b, c]); } }
  nuevo();
  const ficha = ++fichaDemo;
  fichaDemoActiva = true;
  decir(GENGAR('Special0', 'El mapa: izquierda fresco, derecha cálido, arriba intenso, abajo suave. Cada ingrediente mueve la gota hacia un lado (tócalo y te dice hacia dónde), y el color del bote es su sabor. Hay que dejar la gota donde le gusta, sin nada de lo que odia.'), []);
  let k = 0;
  const siguiente = () => {
    if (ficha !== fichaDemo || estado !== 'taller' || !encargo) return;
    if (k < mejor.plan.length) {
      const id = mejor.plan[k++];
      echar(id);
      const ing = ingrediente(id);
      decir(GENGAR('Happy', `${ing.nombre}: ${ing.dice}`), []);
      setTimeout(siguiente, 2800);
      return;
    }
    fichaDemoActiva = false;
    if (encargo.tutorial) {
      const res = puntua(encargo.nat, { pos: taller.perfume.pos, ingredientes: taller.perfume.pasos.map(x => x.id) }, ingrediente, encargo.odiaExtra);
      decir(GENGAR('Joyous', res === 'perfecto' ? `En su zona: ${caracter(taller.perfume).toLowerCase()}. Perfecto, y se cobra ${euros(PRECIO.perfecto)}. Si se queda cerca, «bien» (${euros(PRECIO.bien)}); lejos, no paga.` : 'Así, más o menos. Cuanto más cerca de su zona, mejor se paga.'),
        [{ texto: 'Seguir', accion: alAcabar }]);
      return;
    }
    decir(GENGAR('Joyous', 'Ya está en su zona. El último paso es tuyo: dale a «Dárselo».'), botonesTaller());
  };
  setTimeout(siguiente, 4200);
}
let fichaDemo = 0, fichaDemoActiva = false;   // (mientras Gengar echa ingredientes)

// Un ejemplo de práctica: entra el cliente, Gengar lo hace todo y se va. No cobra, no apunta nada en la
// partida y lo que se gasta del almacén se devuelve.
let practica = null;   // cómo estaba todo antes del ejemplo de práctica (para devolverlo)
function ejemploPractica(ej, alAcabar) {
  const hoy = partida.hoy;
  practica = { almacen: { ...partida.almacen }, frasco: [...(hoy?.frasco || [])], olio: hoy?.gengarOlio };
  for (const id of ['zreza', 'pabaya', 'meloc', 'safre', 'atania', 'wooper']) partida.almacen[id] = Math.max(partida.almacen[id] || 0, 4);
  const c = todos[ej.id];
  ir('mostrador');
  ponLugar('Tutorial');
  botones([]);
  entra(c, () => {
    encargo = { c, visita: { pide: ej.pide, n: 0 }, nat: ej.nat, odiaExtra: [], preguntas: [], muestras: 0, pistas: [], tutorial: true };
    serie([dice(ej.pide)], [{ texto: 'Mirar a Gengar', accion: () => gengarEnsena(ej, () => {
      ir('mostrador');
      ponLugar('Tutorial');
      botones([]);
      // se va andando y, entonces, todo vuelve a como estaba
      sale(() => { acabaPractica(); alAcabar(); });
    }) }]);
  });
}
// Devuelve el almacén, el frasco a medias y el olfato de Gengar a como estaban, y quita el encargo de práctica
function acabaPractica() {
  if (!practica) return;
  for (const k of Object.keys(partida.almacen)) partida.almacen[k] = practica.almacen[k] ?? 0;
  if (partida.hoy) { partida.hoy.frasco = practica.frasco; partida.hoy.gengarOlio = practica.olio; }
  taller.perfume = desdePasos(practica.frasco);
  practica = null;
  fichaDemo++;
  if (encargo?.tutorial) { encargo = null; quita(); }
  guarda(partida);
}
// Desde el menú: los dos ejemplos seguidos
function tutorial() {
  if (encargo) { ir('mostrador'); decir(GENGAR('Normal', 'Termina antes con el cliente que tienes delante. Luego, en el menú, «Tutorial».'), SITIOS.mostrador.botones()); return; }
  if (!partida.hoy) empiezaDia();
  ejemploPractica(EJEMPLOS[0], () => ejemploPractica(EJEMPLOS[1], () => {
    decir(GENGAR('Joyous', 'Y ya está. Lee lo que pide, pregunta, huele, y lleva la gota a su sitio sin nada de lo que odia. Si tocas el frasco, lo huelo yo (una vez al día, y a veces miento). Cuando quieras repasarlo, en el menú tienes «Tutorial».'),
      [{ texto: 'Volver', accion: () => ir('inicio') }]);
  }));
}

// Los que vuelven a por «lo de siempre» (sin historia nueva): cómo saludan y lo que piden, según su gusto
const SALUDOS = ['Vengo a por lo de siempre.', 'Hola otra vez. Me he acabado el frasco.', 'Ya sabes lo que quiero. ¿O no?', 'Lo mío, que lo tengo gastado.'];
const PIDE_REPITE = {
  spicy: ['Lo de siempre: con su chispa de pimentón.', 'Otro como el de antes, con brasa y carácter.'],
  sour: ['Lo de siempre: a limón, como la otra vez.', 'Otro igual, a pomelo recién cortado.'],
  sweet: ['Lo de siempre: a caramelo, como la otra vez.', 'Otro igual, a merengue y a chuche.'],
  bitter: ['Lo de siempre: a café y a madera.', 'Otro igual, a té y a hoja.'],
  dry: ['Lo de siempre: a ropa tendida al sol.', 'Otro igual, a sábana recién planchada.'],
  neutra: ['Lo de siempre: normalito, ni fu ni fa.', 'Otro como el de antes. Sin complicaciones.'],
};

const quitaDeCola = id => { const i = partida.hoy?.cola.indexOf(id) ?? -1; if (i >= 0) partida.hoy.cola.splice(i, 1); };

// ---------- la deducción (fase 4) ----------
// Con el cliente delante: formular en el taller, preguntarle (dos veces) o darle a oler muestras (tres).
// Ya entregado (si se salió al menú antes de despedirlo), solo despedirlo: no se cobra dos veces.
function botonesEncargo() {
  if (encargo.entregado) return [{ texto: 'Despedirlo', accion: () => (encargo.despedir || adiosEncargo)() }];
  if (tocaDemo()) return [{ texto: 'Mirar a Gengar', accion: () => gengarEnsena(EJEMPLOS[0]) }];
  const lista = [{ texto: 'Formular', ir: 'taller' }];
  if (encargo.preguntas.length < 2) lista.push({ texto: 'Preguntar', accion: preguntar, secundario: true });
  if (encargo.muestras < maxMuestras()) lista.push({ texto: 'Dar a oler', accion: darAOler, secundario: true });
  return lista;
}

// Lo que contesta el cliente, con el tic de su naturaleza
const dice = (texto, cara = 'Normal') => fraseDe(encargo.c, { quien: encargo.visita.atiende || encargo.c.id, cara, texto: conTic(encargo.nat, texto) });

function preguntar() {
  const quedan = PREGUNTAS.filter(p => !encargo.preguntas.includes(p.id));
  decir({ ...MORTY, cara: portraitUrl('morty', 'Stunned'), texto: `¿Qué le pregunto? ${encargo.preguntas.length ? 'Me queda una.' : 'Dos preguntas, que esto no es un interrogatorio.'}` },
    quedan.map(p => ({ texto: p.texto, secundario: true, accion: () => {
      encargo.preguntas.push(p.id);
      const n = naturaleza(encargo.nat);
      const respuesta = p.responde(n.zona, n.odia);
      encargo.pistas.push(respuesta.replace(/\.$/, ''));
      const cola = p.id === 'odia' ? (encargo.odiaExtra || []).map(s => fraseDe(encargo.c, { quien: 'cola', texto: `Y yo, ${NOMBRE_SABOR[s]}. Eso no lo soporto, guapo.` })) : [];
      serie([{ ...MORTY, texto: p.pregunta }, dice(respuesta), ...cola, ...consejos('pregunta')], botonesEncargo());
    } })));
}

function darAOler() {
  muestras.resaltar = true;
  decir({ ...MORTY, cara: portraitUrl('morty', 'Worried'), texto: `¿Cuál le doy a oler? Toca una muestra de la balda. ${encargo.muestras ? `Me quedan ${maxMuestras() - encargo.muestras}.` : maxMuestras() === 4 ? 'Tengo cuatro.' : 'Tengo tres.'}` },
    [{ texto: 'Ninguna', secundario: true, accion: () => { muestras.resaltar = false; decir(SITIOS.mostrador.habla(), botonesEncargo()); } }]);
}

// Toca una muestra de la balda (solo cuando Morty está dando a oler)
MOSTRADOR.toque = (tipo, x, y) => {
  if (tipo !== 'baja' || !muestras.resaltar || !encargo) return false;
  const i = muestraEn(x, y);
  if (i < 0) return false;
  muestras.resaltar = false;
  encargo.muestras++;
  const fam = FAMILIAS.find(f => f.color === GOTAS[i]) || FAMILIAS[i];
  const r = reaccion(encargo.nat, fam.id, encargo.odiaExtra);
  const frases = FRASE_REACCION[r];
  encargo.pistas.push(`${fam.nombre}: ${{ gusta: 'le gusta', igual: 'le da igual', odia: 'lo odia' }[r]}`);
  serie([{ ...MORTY, texto: `La muestra de ${fam.nombre.toLowerCase()}. Se la acerco.` },
    dice(frases[Math.floor(Math.random() * frases.length)], CARA_REACCION[r]), ...consejos('muestra')], botonesEncargo());
};

// Morty le da el perfume: cómo reacciona, lo que paga y lo que se apunta en el Libro
function adiosEncargo() {
  const primero = encargo?.c.id === 'totodile' && partida.consejos.includes('demo') && !partida.consejos.includes('demo-2');
  encargo = null;
  botones([]);
  sale(() => {
    pasaLaHora();
    if (estado !== 'mostrador') return;
    // después del primero, Gengar ofrece otro ejemplo distinto, de práctica
    if (primero) {
      partida.consejos.push('demo-2'); guarda(partida);
      decir(GENGAR('Special0', '¿Te enseño otro, distinto? Uno de práctica: no cuenta para la caja. Si no, en el menú tienes «Tutorial» cuando quieras.'),
        [{ texto: 'Otro ejemplo', accion: () => ejemploPractica(EJEMPLOS[1], () => { ponLugar('El mostrador'); decir(SITIOS.mostrador.habla(), SITIOS.mostrador.botones()); }) },
          { texto: 'Ya lo pillo', secundario: true, accion: () => decir(SITIOS.mostrador.habla(), SITIOS.mostrador.botones()) }]);
      return;
    }
    decir(SITIOS.mostrador.habla(), SITIOS.mostrador.botones());
  });
}

// Por qué no le ha gustado (para aprender): hacia dónde se ha pasado el perfume y, si huele mucho a un sabor
// que no es el suyo, a qué
const HUELE_A = { spicy: 'pimentón', sour: 'limón', sweet: 'caramelo', bitter: 'café', dry: 'ropa tendida' };
function porQueNo(nat, perfume) {
  const n = naturaleza(nat);
  const [dx, dy] = [perfume.pos[0] - n.zona[0], perfume.pos[1] - n.zona[1]];
  let txt = Math.abs(dx) >= Math.abs(dy)
    ? (dx > 0 ? 'Tiene demasiado calor. Lo quería más fresquito.' : 'Es muy fresquito. Lo quería con más calor.')
    : (dy > 0 ? 'Es muy intenso, muy de noche. Lo quería más suave.' : 'Es muy suave, muy de día. Lo quería con más fuerza.');
  // el sabor que más se nota en el frasco, si no es el suyo
  const cuenta = {};
  for (const id of perfume.ingredientes) { const s = FAMILIAS.find(f => f.id === ingrediente(id)?.familia)?.sabor; if (s) cuenta[s] = (cuenta[s] || 0) + 1; }
  const [mas] = Object.entries(cuenta).sort((a, b) => b[1] - a[1]);
  if (mas && mas[0] !== n.gusta) txt += ` Y huele mucho a ${HUELE_A[mas[0]]}.`;
  return txt;
}
// Si sale «bien»: hacia dónde le faltaba un pelín para ser perfecto
function casi(nat, perfume) {
  const n = naturaleza(nat);
  const [dx, dy] = [perfume.pos[0] - n.zona[0], perfume.pos[1] - n.zona[1]];
  return 'Casi, casi. ' + (Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'Un pelín más fresquito y era perfecto.' : 'Un pelín más de calor y era perfecto.')
    : (dy > 0 ? 'Un pelín más suave y era perfecto.' : 'Un pelín más intenso y era perfecto.'));
}
// lo que dice cuando el perfume no lleva nada que odie, pero cae lejos de lo suyo
const LEJOS = ['No es esto. Huele bien, pero no a mí.', 'Se parece, pero no. No es lo mío.', 'Me lo pensaré. No es lo que buscaba.'];
function entrega(perfume) {
  const { c, visita, nat, odiaExtra } = encargo;
  if (encargo.demo) partida.consejos.push(...['demo', 'escucha', 'botones', 'pregunta', 'muestra', 'taller', 'zreza'].filter(id => !partida.consejos.includes(id)));
  // en cuanto se entrega, ya no se puede volver a cobrar (aunque se salga al menú) y sale de la cola
  encargo.entregado = true;
  quitaDeCola(c.id);
  partida.cuentaVisitas[c.id] = (partida.cuentaVisitas[c.id] || 0) + 1;
  let res = puntua(nat, perfume, ingrediente, odiaExtra);
  // la de La Rosaleda pide su receta: sin ella, aunque caiga en su zona, no es el de su padre
  const sinReceta = visita.receta && res === 'perfecto' && !visita.receta.every(id => perfume.ingredientes.includes(id));
  if (sinReceta) res = 'bien';
  // si lleva algo que odia, sus frases de «mal» (que lo nombran); si solo cae lejos, una que no despista
  const frases = res === 'mal' ? [dice(LEJOS[Math.floor(Math.random() * LEJOS.length)], 'Normal'), dice(porQueNo(nat, perfume), 'Normal'), dice('No me convence. Pero toma algo, por la molestia.', 'Normal')]
    : sinReceta ? [dice('Está bueno, pero no es el de mi padre. Le falta algo de la receta.', 'Normal')]
      : (visita[res === 'odia' ? 'mal' : res] || []).map(f => fraseDe(c, f));
  if (res === 'bien' && !sinReceta) frases.push(dice(casi(nat, perfume), 'Normal'));
  if (!frases.length) {
    frases.push(dice({ perfecto: '¡Es justo lo que quería!', bien: 'Está bien. Me lo llevo.', odia: '¡Puaj! Esto lleva algo que no soporto.' }[res],
      { perfecto: 'Joyous', bien: 'Normal', odia: 'Angry' }[res]));
  }
  // con los frascos grandes, el perfume se cobra más (10 € el de 50 ml, 20 € el de 100 ml; la mitad si sale «bien»)
  const grande = partida.mejoras.includes('frasco100') ? 20 : partida.mejoras.includes('frasco50') ? 10 : 0;
  const cobra = visita.gratis || !PRECIO[res] ? 0 : PRECIO[res] + (res === 'perfecto' ? grande : res === 'bien' ? grande / 2 : 0);
  setTimeout(() => sfx({ perfecto: 'perfecto', bien: 'bien' }[res] || 'mal'), 150);
  if (cobra) setTimeout(() => sfx('caja'), 700);
  // con el escudo del Málaga en el mostrador, a veces dejan propina; y con el abono, siempre, los lunes que gana
  const ganaYAbono = partida.hoy?.jornada === 'gana' && partida.mejoras.includes('abono');
  const porEscudo = partida.mejoras.includes('escudo') && Math.random() < 0.5;
  const base = res === 'perfecto' ? 3.21 : 1.21;
  const propinaEscudo = cobra && !encargo.tutorial && res !== 'mal' ? Math.round(((ganaYAbono ? base : 0) + (porEscudo ? base : 0)) * 100) / 100 : 0;
  partida.caja = Math.round((partida.caja + cobra + propinaEscudo) * 100) / 100;
  if (propinaEscudo) {
    partida.hoy.ingresos = Math.round((partida.hoy.ingresos + propinaEscudo) * 100) / 100;
    frases.push(dice(ganaYAbono ? `¡Te vi ayer en La Rosaleda! ¡Qué partidazo! Toma, ${euros(propinaEscudo)} para la causa.` : `¿Eso es el escudo del Málaga? ¡Aúpa! Toma, ${euros(propinaEscudo)} para la causa.`, 'Joyous'));
  }
  frases.push({ ...MORTY, cara: portraitUrl('morty', cobra ? 'Happy' : 'Stunned'),
    texto: visita.gratis ? `${perfume.nombre}: gratis. Es su visita número veinte. No se lo cree.`
      : cobra ? `${perfume.nombre}: ${euros(cobra)}. En caja, ${euros(partida.caja)}.`
      : res === 'odia' ? 'Llevaba justo lo que no soporta. Se va sin pagar.' : 'No le ha convencido. Se va sin pagar.' });
  const n = naturaleza(nat);
  const quien = todos[visita.atiende] || c;   // (la del Mákina la atiende Slowking: sus gustos y su página)
  if (n && apunta(partida.libro, nat, quien.id, res)) {
    frases.push({ ...MORTY, cara: portraitUrl('morty', 'Inspired'),
      texto: `${quien.nombre}: naturaleza ${n.nombre.toLowerCase()}. ${res === 'perfecto' ? 'Lo apunto en el Libro de Olores, con su zona del mapa.' : 'Lo apunto en el Libro de Olores.'}` });
  }
  // las que deben salir perfectas (Misdreavus, Bellossom) no se dan por hechas hasta que lo estén
  if (!(visita.hastaPerfecto && res !== 'perfecto')) { marca(visita.marca); (visita.marcas_extra || []).forEach(marca); }
  if (res === 'perfecto' && visita.marca && !partida.perfectos.includes(visita.marca)) partida.perfectos.push(visita.marca);
  partida.hoy.ingresos = Math.round((partida.hoy.ingresos + cobra) * 100) / 100;
  frases.push(...proveedorNuevo(c.id, res), ...consejos('libro'));
  if (partida.hoy?.rosaledaNueva) {
    partida.hoy.rosaledaNueva = false;
    frases.push({ ...MORTY, cara: portraitUrl('morty', 'Happy'), texto: '¡La Rosaleda! Hoja de Skiploom, Pabaya y su pizca de serrín. El olor de los domingos. Esto hay que celebrarlo.' });
  }
  guarda(partida);
  const adios = adiosEncargo;
  // el día de la factura, el primero que paga la pide; a veces, que se lo envuelvan para regalo
  let despues = adios;
  if (cobra && partida.hoy.factura && !partida.hoy.facturado) {
    partida.hoy.facturado = true;
    despues = () => facturaAlReves(c, adios);
  } else if (cobra && Math.random() < 0.2) {
    despues = () => serie([fraseDe(c, { quien: c.id, cara: 'Happy', texto: 'Ah, ¿me lo envuelves? Es para regalo.' })],
      [{ texto: 'Envolver', accion: () => juegaEnvolver(c, adios) }, { texto: 'No hay papel', secundario: true, accion: adios }]);
  }
  // el Mákina pregunta si se puede pagar en negro: si Morty acepta, el dinero va a la caja B (la de
  // galletas del altillo, que no se ve), y eso cambia su última visita y el final
  if (visita.ofreceB && cobra) {
    const tras = despues;
    despues = () => serie([fraseDe(c, { quien: c.id, cara: 'Happy', texto: 'Entonces, ¿en negro? Nadie se entera. El pueblo te lo agradecerá.' })],
      [{ texto: 'En negro', secundario: true, accion: () => {
        encargo.despedir = tras;
        marca('caja-b');
        partida.caja = Math.round((partida.caja - cobra) * 100) / 100;
        partida.hoy.ingresos = Math.round((partida.hoy.ingresos - cobra) * 100) / 100;
        partida.cajaB = Math.round(((partida.cajaB || 0) + cobra) * 100) / 100;
        const discrecion = a21(cobra * 0.21);   // (y, por discreción, una propina que sí va a la caja)
        partida.caja = Math.round((partida.caja + discrecion) * 100) / 100;
        partida.hoy.ingresos = Math.round((partida.hoy.ingresos + discrecion) * 100) / 100;
        guarda(partida);
        serie([{ ...MORTY, cara: portraitUrl('morty', 'Worried'), texto: `Los ${euros(cobra)}, a la caja de galletas del altillo. La que no se ve.` },
          fraseDe(c, { quien: c.id, cara: 'Happy', texto: `Y esto, por la discreción: ${euros(discrecion)}. Que no se diga.` })], [{ texto: 'Despedirlo', accion: tras }]);
      } }, { texto: 'Con factura', accion: () => (encargo.despedir = tras, serie([fraseDe(c, { quien: c.id, cara: 'Normal', texto: 'Qué poco espíritu de pueblo.' })], [{ texto: 'Despedirlo', accion: tras }])) }]);
  }
  encargo.despedir = despues;
  // con un perfume perfecto, por el escaparate se ve a los perros de la calle bailar dos segundos
  if (res === 'perfecto') {
    const reaccion = frases.slice(0, Math.max(1, (visita.perfecto || []).length));
    const resto = frases.slice(reaccion.length);
    serie(reaccion, [{ texto: '▸', secundario: true, accion: () => {
      escena.mostrar(CALLE, ctx);
      bailan();
      ponLugar('La calle');
      decir({ texto: 'Por el escaparate, los perros de la calle se ponen a bailar. Dos segundos. Luego, cada uno a lo suyo.' },
        [{ texto: '▸', secundario: true, accion: () => {
          escena.mostrar(MOSTRADOR, ctx);
          ponLugar('El mostrador');
          serie(resto, [{ texto: 'Despedirlo', accion: despues }]);
        } }]);
    } }]);
    return;
  }
  serie(frases, [{ texto: 'Despedirlo', accion: despues }]);
}

// Los proveedores en persona se hacen fijos: Bellossom con un perfume perfecto; Miltank y Timburr
// en cuanto vienen. Desde entonces lo suyo se puede pedir (y traen cinco para empezar).
function proveedorNuevo(id, res) {
  const ing = Object.keys(PROVEEDOR_DE).find(k => PROVEEDOR_DE[k] === id);
  if (!ing || partida.proveedores.includes(id) || (id === 'bellossom' && res !== 'perfecto')) return [];
  partida.proveedores.push(id);
  partida.almacen[ing] = (partida.almacen[ing] || 0) + 5;
  guarda(partida);
  return [{ ...MORTY, cara: portraitUrl('morty', 'Happy'), texto: `Desde hoy, ${todos[id].nombre} me trae ${todos[id].trae.charAt(0).toLowerCase()}${todos[id].trae.slice(1)}. Cinco para empezar; lo demás, en el pedido.` }];
}

// La factura al revés: una barra de «Generando factura…» que retrocede. El cliente espera mirando el
// móvil. Tarda lo que tarda.
let fichaFactura = 0;
function facturaAlReves(c, alAcabar) {
  serie([fraseDe(c, { quien: c.id, cara: 'Normal', texto: 'Ah, y hazme factura, que soy autónomo también.' }),
    { ...MORTY, cara: portraitUrl('morty', 'Dizzy'), texto: 'Factura. Claro. Un momento.' }], [{ texto: 'Hacerla', accion: () => {
    const DURA = 30;
    const t0 = performance.now();
    const ficha = ++fichaFactura;
    const paso = () => {
      if (ficha !== fichaFactura || estado !== 'mostrador') return;   // se ha ido a otro sitio: se acabó la factura
      const t = (performance.now() - t0) / 1000;
      if (t >= DURA) {
        serie([{ ...MORTY, cara: portraitUrl('morty', 'Dizzy'), texto: 'Factura emitida. Treinta segundos de mi vida que Hacienda no me va a devolver.' }],
          [{ texto: 'Despedirlo', accion: alAcabar }]);
        return;
      }
      // la barra avanza, se arrepiente y vuelve atrás
      const f = Math.max(0, Math.min(1, 0.5 + 0.45 * Math.sin(t * 0.9) - t / DURA * 0.4));
      const n = Math.round(f * 12);
      dialogo({ ...MORTY, cara: portraitUrl('morty', 'Dizzy'), texto: `Generando factura… ${'▮'.repeat(n)}${'▯'.repeat(12 - n)} ${Math.round(f * 100)} %` });
      botones([]);
      setTimeout(paso, 400);
    };
    paso();
  } }]);
}

function juegaEnvolver(c, alAcabar) {
  decir({ ...MORTY, cara: portraitUrl('morty', 'Inspired'), texto: 'Corta el papel entre las dos marcas, dobla las solapas (primero los lados) y haz el lazo en el centro. Tres fallos y se rompe.' },
    [{ texto: 'Dejarlo', secundario: true, accion: rinde }]);
  envolver(r => {
    if (encargo) encargo.despedir = alAcabar;   // (la propina, una vez: si sale al menú, al volver solo queda despedirlo)
    // sin fallos, más propina
    const propina = r.gana ? (r.fallos ? 3.21 : 5.21) : 0;
    partida.caja = Math.round((partida.caja + propina) * 100) / 100;
    partida.hoy.ingresos = Math.round((partida.hoy.ingresos + propina) * 100) / 100;
    guarda(partida);
    serie([fraseDe(c, { quien: c.id, cara: r.gana ? 'Joyous' : 'Surprised', texto: r.gana ? '¡Qué bonito! Toma, para ti.' : r.roto ? 'Bueno… así parece hecho a mano.' : 'Déjalo, lo llevo así.' }),
      ...(propina ? [{ ...MORTY, cara: portraitUrl('morty', 'Happy'), texto: `Propina: ${euros(propina)}.` }] : [])],
    [{ texto: 'Despedirlo', accion: alAcabar }]);
  });
}

// Las historias de cada cliente (data/dialogues/<id>.json), cargadas al empezar
const dialogos = {};

// Quién dice una frase de los diálogos: el propio cliente, otro cliente, Morty, Gengar o la cola
function fraseDe(c, f) {
  const cara = f.cara || 'Normal';
  if (f.quien === 'morty') return { cara: portraitUrl('morty', cara), nombre: 'Morty Pociones', texto: f.texto };
  if (f.quien === 'gengar') return { cara: portraitUrl('gengar', cara), nombre: 'Gengar', texto: f.texto };
  if (f.quien === 'cola') {
    const voz = (c.voces || todos.girafarig?.voces)?.cola;
    return { cara: portraitUrl(voz?.retratos || '0203-cola', cara), nombre: voz?.nombre || 'La cola', texto: f.texto };
  }
  const quien = todos[f.quien] || c;
  return { cara: portraitUrl(quien.sprite, cara), nombre: quien.nombre, texto: f.texto };
}


// Dice una frase tras otra (▸ entre una y otra) y, con la última, salen los botones
function serie(frases, lista) {
  const [primera, ...resto] = frases;
  if (!resto.length) { decir(primera, lista); return; }
  decir(primera, [{ texto: '▸', secundario: true, accion: () => serie(resto, lista) }]);
}

// ---------- el tutorial: los consejos de Gengar ----------
// El primer cliente (Totodile, el primer día) sirve de tutorial: Gengar suelta un consejo corto en
// cada paso, una sola vez. Se apuntan en partida.consejos.
const CONSEJOS = {
  escucha: ['Special0', 'Psst. Nunca te dicen lo que son. Lo que piden es la pista: «con chispa», «a limón».'],
  botones: ['Normal', 'Puedes preguntarle dos cosas y darle a oler tres muestras de la balda. O ir directo al taller a formular.'],
  pregunta: ['Happy', 'Cada respuesta te quita medio mapa. En el taller te lo dejo apuntado en el cartel de arriba.'],
  muestra: ['Normal', 'Lo que le gusta, échaselo. Lo que odia, ni una gota: se iría sin pagar.'],
  taller: ['Special0', 'Arrastra los botes al frasco. La gota se mueve: izquierda fresco, derecha cálido, arriba intenso, abajo suave. Déjala donde le guste. Si tocas el frasco, lo huelo yo: una vez al día. Y a veces miento, que me aburro.'],
  zreza: ['Happy', 'Este quiere que pique. La roja, la Baya Zreza, empuja a lo cálido. Luego, «Dárselo».'],
  libro: ['Joyous', 'Lo que aprendes de cada cliente va al Libro de Olores, arriba a la derecha. Para el próximo de su naturaleza.'],
  cierre: ['Normal', 'Al cerrar: contar la caja y pedir para mañana. Si no pides, el de los patines trae lo que le da la gana.'],
};
function consejos(...ids) {
  const out = [];
  for (const id of ids) {
    if (!id || !CONSEJOS[id] || partida.consejos.includes(id)) continue;
    partida.consejos.push(id);
    out.push({ cara: portraitUrl('gengar', CONSEJOS[id][0]), nombre: 'Gengar', texto: CONSEJOS[id][1] });
  }
  if (out.length) guarda(partida);
  return out;
}

// El cartel del encargo, fijo arriba en el taller: quién es, qué pide y lo que se sabe
function ponCartel() {
  const ver = estado === 'taller' && !!encargo;
  $('#cartel').classList.toggle('hidden', !ver);
  if (ver) {
    const { c, visita, pistas } = encargo;
    $('#cartel img').src = portraitUrl((visita.forma && todos[visita.forma]?.sprite) || c.sprite, 'Normal');
    $('#cartel strong').textContent = `Encargo de ${c.nombre}`;
    $('#cartel .cartel-pide').textContent = `«${visita.pide}»`;
    $('#cartel .cartel-pistas').replaceChildren(...pistas.map(t => Object.assign(document.createElement('li'), { textContent: t })));
  }
  maquetar();
}

// ---------- el día ----------
// partida.hoy: { dia, fase ('mañana', 'abierto', 'cierre'), cola (los que faltan por entrar), hora (en
// minutos), paso (lo que pasa la hora con cada cliente), ingresos, cuota, factura, trimestre… }
function marca(m) { if (m && !partida.marcas.includes(m)) partida.marcas.push(m); }

function empiezaDia(conSuceso = true) {
  const dia = partida.dia;
  const hoy = { dia, fase: 'mañana', hora: APERTURA, ingresos: 0, trimestre: esTrimestre(dia), factura: esDiaFactura(dia),
    cuota: diaDelMes(dia) === 1 ? 'pendiente' : null, cristal: false, contada: false, pedido: false, cola: [] };
  partida.hoy = hoy;
  if (dia > 1 && diaSemana(dia) === 'lunes') { const j = jornada(); hoy.jornada = j.res; hoy.goles = j.goles; }
  hoy.cola = clientesDeHoy(clientes, dialogos, partida, hoy);
  if (!partida.marcas.includes('totodile-1')) hoy.cola = ['totodile', ...hoy.cola.filter(id => id !== 'totodile')];
  if (partida.mejoras.includes('cartel')) {
    const extra = clientesDeHoy(clientes, dialogos, partida, hoy).find(id => !hoy.cola.includes(id));
    if (extra) hoy.cola.push(extra);
  }
  hoy.baja = dia === partida.diaBaja;
  // una mala noche (las de Gengar): por la mañana, una pista; y más perros por la calle
  hoy.malaNoche = dia > 2 && Math.random() < 0.35;
  // el escaparate amanece sucio algunos días (los dos primeros, siempre: así se conoce el minijuego)
  hoy.sucio = dia <= 2 || Math.random() < 0.4;
  // el galgo del ticket viene cada seis días, a media mañana
  if (dia >= 5 && dia % 6 === 5) hoy.cola.splice(Math.min(1, hoy.cola.length), 0, 'galgo-ticket');
  hoy.paso = Math.floor((CIERRE - 1 - APERTURA) / (hoy.cola.length + 1));
  // algún vídeo por la mañana, con sus reglas (sucesoDeMañana)
  hoy.suceso = conSuceso ? sucesoDeMañana(hoy) : null;
  guarda(partida);
}
// Los vídeos de la mañana, con reglas para que no salgan siempre igual ni todos seguidos:
// - como mucho uno al día y con dos días de hueco; los del Señor Mililitros, con cuatro entre ellos;
// - ninguno el día de la baja, de la cuota, de una carta o de la presentación;
// - la discoteca, el lunes que ha ganado el Málaga; el vecino de la fiesta, el día que viene Igglybuff
//   por primera vez (es su vecino); los demás, al azar entre los que ya tocan (sus «requiere»).
const DE_MAÑANA = ['peluqueria', 'ascensor', 'piscina', 'plaza-cantante', 'discoteca', 'vecino-fiesta', 'jefe-dinero', 'jefe-cena', 'jefe-garaje', 'jefe-furgoneta', 'jefe-dominadas', 'jefe-ruso'];
const PIDE_JEFE = { 'jefe-cena': () => jefePresentado(), 'jefe-garaje': () => jefePresentado(), 'jefe-furgoneta': () => jefeVisto() };
let SUCESOS = [];   // data/sucesos.json, cargado al empezar
const pideSuceso = (m, hoy) => (m === 'jornada-gana' ? hoy.jornada === 'gana' : m.startsWith('suceso-') ? partida.sucesos.includes(m.slice(7)) : partida.marcas.includes(m));
function sucesoDeMañana(hoy) {
  const dia = partida.dia;
  if (dia < 2 || hoy.baja || hoy.cuota || cartaPendiente() || (!jefePresentado() && dia >= 10)) return null;
  const visto = id => partida.sucesos.includes(id);
  // antes de que se presente en persona (día 10), Morty tiene que haberlo visto en un vídeo de Dirección
  if (!jefeVisto() && dia >= 6) { const id = ['jefe-dinero', 'jefe-dominadas', 'jefe-ruso'].find(x => !visto(x)); if (id) return id; }
  // los que van atados a un día concreto
  if (hoy.jornada === 'gana' && !visto('discoteca')) return 'discoteca';
  if (!visto('vecino-fiesta') && hoy.cola.includes('igglybuff') && !partida.marcas.includes('igglybuff-1')) return 'vecino-fiesta';
  if (dia - (partida.diaSuceso ?? -9) < 3) return null;
  const tocan = DE_MAÑANA.filter(id => {
    if (visto(id) || id === 'discoteca' || id === 'vecino-fiesta') return false;
    if (PIDE_JEFE[id] && !PIDE_JEFE[id]()) return false;
    if (id.startsWith('jefe') && dia - (partida.diaSucesoJefe ?? -9) < 4) return false;
    const s = SUCESOS.find(x => x.id === id);
    return (s?.requiere || []).every(m => pideSuceso(m, hoy));
  });
  if (!tocan.length || Math.random() > 0.55) return null;
  return tocan[Math.floor(Math.random() * tocan.length)];
}
// (se apunta cuándo salió el último, para dejar hueco)
function apuntaSuceso(id) {
  partida.diaSuceso = partida.dia;
  if (id.startsWith('jefe')) partida.diaSucesoJefe = partida.dia;
}

// Al abrir el juego: si no hay día empezado, se empieza; luego, a la calle (o donde se estuviera)
function seguirDia() {
  // la primera vez, la intro de cuento: Morty abre la tienda y se prepara
  if (!partida.introVista) {
    cuento(INTRO(), { alAcabar: () => { partida.introVista = true; guarda(partida); seguirDia(); } });
    return;
  }
  if (!partida.hoy) empiezaDia();
  const hoy = partida.hoy;
  hoy.sucio ??= true;
  // en la calle, unos pocos perros cada día; y el que pide la historia (sus vídeos, el día de la cuota)
  enLaCalle.hoy = perrosDeHoy(partida.dia, {
    jefe: !!hoy.cuota || !!hoy.suceso?.startsWith('jefe'),
    paseador: ['peluqueria', 'ascensor', 'piscina'].includes(hoy.suceso),
  }, { sinJefe: !jefePresentado(), malaNoche: !!hoy.malaNoche });
  aplicaMejoras();
  ponBaja();
  if (hoy.suceso && !partida.sucesos.includes(hoy.suceso)) {
    const id = hoy.suceso;
    apuntaSuceso(id);
    partida.sucesos.push(id);
    guarda(partida);
    verSuceso(id, 'calle', () => ir('calle'));
    return;
  }
  ir(hoy.fase === 'mañana' ? 'calle' : 'mostrador');
}

function ponLugar(lugar) {
  const hoy = partida.hoy;
  // la hora va aparte, para que no la corte un sitio con nombre largo
  $('#lugar').textContent = lugar;
  $('#hora').textContent = hoy && estado !== 'estante' ? `· ${hora(hoy.fase === 'cierre' ? CIERRE : hoy.hora)}` : '';
}
function pasaLaHora() {
  const hoy = partida.hoy;
  hoy.hora = Math.min(CIERRE - 1, hoy.hora + hoy.paso);
  guarda(partida);
  ponLugar(SITIOS[estado]?.lugar || '');
}

// La calle por la mañana: la fecha, la cuota (si es día 1), limpiar el cristal y abrir
function hablaCalle() {
  const hoy = partida.hoy, dia = partida.dia;
  if (hoy.fase !== 'mañana') return { texto: 'La calle. Enfrente, La Olla de Barro a lo suyo. Dentro espera el mostrador.' };
  if (hoy.cuota === 'pendiente') return { ...MORTY, cara: portraitUrl('morty', 'Dizzy'), texto: `Día 1 del mes ${mesDe(dia)}. Antes de subir la persiana, como cada día 1, algo se mueve en la cuenta del banco.` };
  const fecha = `Día ${dia}, ${diaSemana(dia)}${hoy.trimestre ? ' (trimestre: el calendario está en rojo)' : ''}.`;
  if (hoy.baja) return { ...MORTY, cara: portraitUrl('morty', 'Dizzy'), texto: `${fecha}${hoy.goles ? ` (Ayer el Málaga: ${hoy.goles}.)` : ''} Morty se ha despertado malo. Fiebre, escalofríos y la cabeza como un bombo. La tienda abre igual: si cierra, no cobra. Hoy, detrás del mostrador, está Gengar.` };
  if (cartaPendiente()) return { texto: `${fecha} En el buzón hay una carta certificada. La ha traído un galgo con traje. Con ticket.` };
  if (tocaPresentacion()) return { texto: `${fecha} Antes de subir la persiana, alguien da tres golpecitos en el cierre. Muy educados.` };
  const malaga = { gana: ` Ayer ganó el Málaga (${hoy.goles}). Morty lleva la bufanda más apretada que nunca.`,
    empata: ` Ayer el Málaga empató (${hoy.goles}). Ni fu ni fa.`, pierde: ` Ayer perdió el Málaga (${hoy.goles}). Morty abre igual.` }[hoy.jornada] || '';
  const pista = hoy.malaNoche ? pistaDeHoy() : '';
  return { ...(hoy.jornada === 'pierde' || pista ? { ...MORTY, cara: portraitUrl('morty', 'Cansado') } : {}),
    texto: `${fecha} Diez de la mañana.${malaga}${pista ? ` ${pista}` : ' Enfrente, en La Olla de Barro, ya huele a pollo asado.'}${hoy.sucio && !hoy.cristal ? ' El escaparate ha amanecido lleno de huellas.' : ''}${partida.deuda ? ` Deuda con ${conQuien()}: ${euros(partida.deuda)}.` : ''}` };
}

// Las pistas del final, las mañanas después de una mala noche: [desde qué día, frase (o null si aún no toca)]
const PISTAS = [
  [3, () => 'Morty se ha despertado con los calcetines húmedos. Otra vez.'],
  [3, () => 'Gengar bosteza toda la mañana. Cuando Morty le mira, mira para otro lado.'],
  [5, () => 'Anoche, a las cuatro y pico, a Morty le pareció oír una risa. Era la suya.'],
  [6, () => 'El tono del móvil es el grito del vídeo de Ciudad Iris. Morty no recuerda haberlo puesto.'],
  [8, () => 'Morty tiene los pies como recién lavados. No se los ha lavado.'],
  [12, () => (jefePresentado() ? 'Anoche, al teléfono, el Señor Mililitros le recordó el nombre de su peluche de pequeño. Morty no se lo ha dicho nunca a nadie.' : null)],
  [20, () => 'Gengar ha dormido a los pies de la cama. Tiene cara de culpable y la lengua fuera.'],
  [4, () => 'Gengar se relame toda la mañana. Cuando Morty le pregunta, dice: «Mmmmm… queso gruyer».'],
];
const PASEO_NOCHE = 'Anoche, desde la ventana, Morty vio a un perro con corbata pasear por la calle vacía. Se paró delante del escaparate. Luego se fue.';
function pistaDeHoy() {
  // entre el primer vídeo y la presentación, a veces lo ve pasear de noche
  if (jefeVisto() && !jefePresentado() && partida.dia % 2) return PASEO_NOCHE;
  const hay = PISTAS.filter(([d]) => partida.dia >= d).map(([, f]) => f()).filter(Boolean);
  return hay.length ? hay[partida.dia % hay.length] : '';
}

// El día que el Señor Mililitros se presenta en persona: a partir del día 10, un día sin nada más
const tocaPresentacion = () => !jefePresentado() && partida.dia >= 10 && partida.marcas.includes('cuota-1')
  && !partida.hoy.baja && !partida.hoy.suceso && partida.hoy.fase === 'mañana';
function presentacion(prueba = false) {
  if (!prueba) { marca('jefe-presentado'); enLaCalle.hoy.jefe = true; guarda(partida); }
  const J = cara => ({ cara: portraitUrl('perro-jefe', cara), nombre: 'Señor Mililitros', estilo: 'jefe' });
  serie([{ texto: 'Al otro lado de la persiana hay un perro. De pie, a dos patas. Traje azul y corbata roja.' },
    { ...J('Happy'), texto: 'Morty. Por fin nos conocemos. Señor Mililitros, de Dirección. Un saludo cordial.' },
    { ...MORTY, cara: portraitUrl('morty', 'Stunned'), texto: '…' },
    { ...MORTY, cara: portraitUrl('morty', 'Stunned'), texto: 'Es un perro.' },
    { ...J('Determined'), texto: 'Vengo a ver cómo va lo nuestro. Esto es una familia, Morty. Y las familias se visitan.' },
    { texto: 'Mira el escaparate, huele un frasco y asiente. Luego se va calle abajo, sin prisa.' },
    { cara: portraitUrl('gengar', 'Worried'), nombre: 'Gengar', texto: '…' },
    { texto: 'Gengar mira al techo y silba. Muy fuerte.' },
    { ...MORTY, texto: 'Bueno. A abrir, que los clientes no esperan.' }],
  prueba ? [{ texto: 'Volver', accion: () => { ir('inicio'); listaPruebas(); } }] : botonesCalle());
}
function botonesCalle() {
  const hoy = partida.hoy;
  if (hoy.fase !== 'mañana') return [{ texto: 'Al mostrador', ir: 'mostrador' }];
  if (hoy.cuota === 'pendiente') return [{ texto: 'Mirar el móvil', accion: pasaCuota }];
  if (cartaPendiente()) return [{ texto: 'Abrir la carta', accion: abreCarta }];
  if (tocaPresentacion()) return [{ texto: 'Subir la persiana', accion: () => presentacion() }];
  const lista = [{ texto: 'Abrir', accion: abrir }];
  if (!hoy.cristal && hoy.sucio) lista.push({ texto: 'Limpiar cristal', secundario: true, accion: juegaCristal });
  return lista;
}

function pasaCuota() {
  const hoy = partida.hoy;
  const primera = !partida.marcas.includes('cuota-1');
  const { cuota, alquiler, pagado, fiado } = cobraCuota(partida);
  hoy.cuota = 'pagada';
  marca('cuota-1');
  guarda(partida);
  const frases = [];
  if (primera) frases.push({ texto: 'En la puerta hay un cartel pegado con celo: «Bienvenido». Nada más. Ni firma.' });
  frases.push({ ...MORTY, cara: portraitUrl('morty', 'Dizzy'), texto: `Cuota de autónomos: ${euros(cuota)}.${alquiler ? ` Y el alquiler del local: ${euros(alquiler)}.` : ' El alquiler, este primer mes, lo perdona el casero.'}` });
  if (fiado) {
    frases.push({ texto: 'En el móvil, un WhatsApp de anoche, de las 4:12:' });
    frases.push({ ...JEFE('Happy'), texto: `No llegabas, Morty. Te lo adelanto yo, con un pequeño recargo: ${euros(fiado)}. Esto es una familia.` });
    frases.push({ ...MORTY, cara: portraitUrl('morty', 'Dizzy'), texto: `Deuda: ${euros(partida.deuda)}.${pagado ? ` Lo de la caja (${euros(pagado)}) se ha ido también.` : ''}` });
  }
  serie([...frases, hablaCalle()], botonesCalle());
}

function abrir() {
  partida.hoy.fase = 'abierto';
  guarda(partida);
  ir('mostrador');
  if (partida.mejoras.includes('escalera') && !partida.marcas.includes('altillo')) altillo();
}

// El altillo: la escalera estaba rota desde el día 1. Arriba duerme alguien con corbata. Todo apunta
// a que es el Señor Mililitros (primera capa)… y es el asesor, que no tiene piso (segunda).
function altillo(prueba = false) {
  if (!prueba) { marca('altillo'); guarda(partida); }
  // arriba, su propia escena: el desván bajo el tejado, con el asesor dormido en el sillón
  escena.mostrar(ALTILLO, ctx);
  $('#lugar').textContent = 'El altillo';
  $('#hora').textContent = '';
  serie([{ texto: 'Con la escalera arreglada, Morty sube al altillo por primera vez desde que abrió la tienda.' },
    { texto: 'Entre cajas de frascos vacíos hay alguien dormido en un sillón. Lleva corbata. Tiene un portátil en la barriga.' },
    ...(prueba ? [] : partida.asesorVisto?.length ? [{ ...MORTY, cara: portraitUrl('morty', 'Surprised'), texto: 'Anda. El asesor. ¿Usted duerme aquí?' },
      { ...ASESOR('Sigh'), texto: 'No tengo piso. Y el rincón no tiene sillón.' }]
      : jefePresentado() ? [{ ...MORTY, cara: portraitUrl('morty', 'Surprised'), texto: 'Otro perro con corbata. Más pequeño que el Señor Mililitros.' },
        { ...MORTY, cara: portraitUrl('morty', 'Angry'), texto: 'Oiga. ¿Usted trabaja para el Señor Mililitros? Tenemos que hablar de la nómina que no cobro.' }]
      : jefeVisto() ? [{ ...MORTY, cara: portraitUrl('morty', 'Surprised'), texto: 'Un perro con corbata. Como el de los vídeos de Dirección. Es él. Por fin.' },
        { ...MORTY, cara: portraitUrl('morty', 'Angry'), texto: 'Señor Mililitros. Tenemos que hablar de la nómina que no cobro.' }]
      : [{ ...MORTY, cara: portraitUrl('morty', 'Surprised'), texto: 'Un perro con corbata. Durmiendo en mi altillo.' },
        { ...MORTY, cara: portraitUrl('morty', 'Angry'), texto: 'Oiga. ¿Usted quién es? ¿Le manda el Señor Mililitros?' }]),
    { ...ASESOR('Sigh'), texto: '¿Mmm? ¿Qué? No, no, no. Yo soy el asesor. Duermo aquí. No tengo piso.' },
    { ...ASESOR('Happy'), texto: '¿El Señor Mililitros? Nunca lo he visto. Me pagan en chuches, por correo. Muy profesional.' },
    { ...MORTY, cara: portraitUrl('morty', 'Stunned'), texto: '…' },
    { ...MORTY, texto: 'Bajo. Tengo clientes.' }], prueba ? [{ texto: 'Volver', accion: () => { ir('inicio'); listaPruebas(); } }] : [{ texto: 'Bajar', accion: () => ir('mostrador') }]);
}

// La meta (sección 7): el día que la caja da para la cuota del mes que viene, el alquiler y una cerveza
const CERVEZA = 1.21;
const meta = () => Math.round((cuotaDe(mesDe(partida.dia + 1)) + ALQUILER + CERVEZA) * 100) / 100;
// (a partir del día 30, para que dé tiempo a ver la baja, el trimestre y las historias sin días de relleno;
// y sin cartas del asesor por llegar)
const metaCumplida = () => partida.dia >= 30 && !partida.deuda && !partida.cartas.length && partida.caja >= meta() && !partida.marcas.includes('epilogo');

function juegaCristal() {
  decir({ ...MORTY, cara: portraitUrl('morty', 'Inspired'), texto: 'Frota el escaparate con el dedo: huellas, una nariz de perro y una paloma con puntería.' },
    [{ texto: 'Dejarlo', secundario: true, accion: rinde }]);
  limpiar(r => {
    const hoy = partida.hoy;
    hoy.cristal = true;
    // con el cristal reluciente, entra uno más
    let extra = null;
    if (r.gana) {
      const ya = new Set([...hoy.cola]);
      extra = clientesDeHoy(clientes, dialogos, partida, hoy).find(id => !ya.has(id));
      if (extra) { hoy.cola.push(extra); hoy.paso = Math.floor((CIERRE - 1 - APERTURA) / (hoy.cola.length + 1)); }
    }
    guarda(partida);
    decir({ ...MORTY, cara: portraitUrl('morty', r.gana ? 'Happy' : 'Normal'),
      texto: r.gana ? `Reluce. ${extra ? 'Con el escaparate así, hoy entra uno más.' : 'Da gusto verlo.'}` : r.dejado ? 'Ya lo limpiaré mañana.' : `Se ha quedado al ${Math.round(r.limpio * 100)} %. Lo de la paloma no sale.` },
    botonesCalle());
  });
}

// El mostrador según la hora: clientes, el repartidor a las 14:59 y el cierre
function botonesMostrador() {
  const hoy = partida.hoy;
  if (hoy.fase === 'cierre') return botonesCierre();
  if (hoy.fase === 'mañana') return [{ texto: 'A la calle', ir: 'calle' }];
  const taller_ = { texto: 'Al taller', ir: 'taller', secundario: true };
  if (hoy.cola.length) return [{ texto: 'Que pase alguien', accion: pasaCliente }, taller_, { texto: 'Calle', ir: 'calle', secundario: true }];
  return [{ texto: 'Las 14:59', accion: repartidor }, taller_];
}

// El repartidor: lo pedido ayer o, si no se pidió nada, lo que le dio la gana. Un día, el otro.
// cómo llega el repartidor cada día (el pastor alemán en patines, con su señor pequeñito en brazos)
const LLEGADAS = [
  'Llega el repartidor: un pastor alemán en patines, con un señor pequeñito en brazos.',
  'Llega el repartidor derrapando. Se lleva un cono por delante. El señor de los brazos lo aplaude.',
  'Llega el repartidor de espaldas, patinando. El señor pequeñito le va indicando: «Izquierda. Izquierda. Ahí».',
  'Llega el repartidor con un helado. Al señor pequeñito le ha tocado el barquillo.',
  'Llega el repartidor con gafas de sol. El señor pequeñito, también.',
  'Llega el repartidor sin prisa, saludando a toda la calle. La calle le devuelve el saludo.',
];
function repartidor() {
  const hoy = partida.hoy;
  hoy.hora = CIERRE - 1;
  ponLugar('El mostrador');
  // (con animación: el repartidor llega patinando por la calle; sin ella, tras el vídeo, directo al pedido)
  const sigue = (animacion = true) => {
    if (hoy.fase === 'cierre') return;   // (ya repartido)
    const { lista, capricho } = reparto(partida, ings.map(i => i.id));
    hoy.fase = 'cierre';
    guarda(partida);
    ponLugar('El mostrador');
    ponMusica();
    const que = lista.map(([id, n]) => `${n} de ${ingrediente(id).nombre}`).join(', ');
    const elPedido = () => serie([{ ...MORTY, cara: portraitUrl('morty', capricho ? 'Stunned' : 'Normal'), texto: capricho ? `No había pedido nada. Ha traído lo que le ha dado la gana: ${que}.` : `El pedido: ${que}.` },
      { ...MORTY, texto: '15:00. Hora de cerrar.' }, ...consejos('cierre')], botonesCierre());
    if (!animacion) { elPedido(); return; }
    escena.mostrar(CALLE, ctx);
    enLaCalle.repartidor = performance.now() / 1000;
    ponLugar('La calle');
    serie([{ texto: `14:59. ${LLEGADAS[partida.dia % LLEGADAS.length]} Deja una caja en la puerta y se va sin firmar nada.` }],
      [{ texto: '▸', secundario: true, accion: () => {
        enLaCalle.repartidor = -1;
        escena.mostrar(MOSTRADOR, ctx);
        ponLugar('El mostrador');
        elPedido();
      } }]);
  };
  // la primera vez que llega, el vídeo (y luego, directo al pedido); desde entonces, la animación en la calle
  if (!partida.sucesos.includes('repartidor')) {
    partida.sucesos.push('repartidor');
    apuntaSuceso('repartidor');
    verSuceso('repartidor', 'mostrador', () => { ir('mostrador'); sigue(false); });
    return;
  }
  sigue();
}

// El cierre: contar la caja (una vez), el pedido para mañana, pagar la deuda y bajar la persiana
function botonesCierre() {
  const hoy = partida.hoy;
  if (!hoy.contada) return [{ texto: 'Contar la caja', accion: juegaCaja }];
  const lista = [];
  if (!hoy.pedido) lista.push({ texto: 'Pedido', secundario: true, accion: pedido });
  lista.push({ texto: partida.vacaciones >= 20 ? 'Agosto' : 'Vacaciones', apagado: true, accion: vacaciones });
  lista.push({ texto: 'Persiana', accion: bajarPersiana });   // (corto: con «Pedido» y «Vacaciones» caben los tres a 360)
  return lista;
}

function resumenCaja() {
  const hoy = partida.hoy;
  return { ...MORTY, cara: portraitUrl('morty', hoy.ingresos ? 'Happy' : 'Stunned'),
    texto: `Hoy: ${euros(hoy.ingresos)}. En caja: ${euros(partida.caja)}.${partida.deuda ? ` Deuda con ${conQuien()}: ${euros(partida.deuda)}.`
      : partida.marcas.includes('epilogo') || partida.dia < 20 ? '' : ` Para el final (cuota, alquiler y una cerveza, desde el día 30) hacen falta ${euros(meta())}.`}` };
}

function juegaCaja() {
  decir({ ...MORTY, cara: portraitUrl('morty', 'Stunned'), texto: 'A contar. ¿Cuántos euros hay en la bandeja?' }, []);
  const j = contarCaja(r => {
    const hoy = partida.hoy;
    hoy.contada = true;
    let texto;
    if (r.gana) texto = `${euros(r.total)}. La caja cuadra.`;
    else {
      const falta = 2.21;
      partida.caja = Math.max(0, Math.round((partida.caja - falta) * 100) / 100);
      texto = `Eran ${euros(r.total)}. Descuadre: ${euros(falta)} que pone Morty de su bolsillo.`;
    }
    guarda(partida);
    const frases = [{ ...MORTY, cara: portraitUrl('morty', r.gana ? 'Happy' : 'Dizzy'), texto }, resumenCaja()];
    // si el día ha ido bien, WhatsApp de Dirección: objetivos
    if (hoy.ingresos >= 100 && !partida.sucesos.includes('jefe-baile') && partida.dia - (partida.diaSucesoJefe ?? -9) >= 4) {
      partida.sucesos.push('jefe-baile');
      apuntaSuceso('jefe-baile');
      guarda(partida);
      serie(frases, [{ texto: '▸', secundario: true, accion: () => verSuceso('jefe-baile', 'mostrador', () => { ir('mostrador'); trasLaCaja(); }) }]);
      return;
    }
    serie(frases, [{ texto: '▸', secundario: true, accion: () => trasLaCaja() }]);
  });
  botones(j.opciones.map(v => ({ texto: euros(v).replace(/\s€$/, ''), secundario: true, numero: true, accion: () => responde(v) })));
}

// Después de contar la caja: el correo del Señor Mililitros (uno cada dos días), el asesor desde la
// mesa del rincón (alguna vez, a partir del día 8) y, si hay deuda y dinero, pagarle algo
function trasLaCaja() {
  const pasos = [];
  const hoy = partida.hoy;
  const oferta = (asesor.ofertas || []).find(o => !partida.asesorVisto.includes(o.id));
  if (oferta && partida.dia >= 8 && partida.dia % 4 === 0) pasos.push(sigue => ofertaAsesor(oferta, sigue));
  if (partida.deuda > 0 && partida.caja > COLCHON) pasos.push(preguntaDeuda);
  // (si no ha pasado nada después de contar, el resumen ya se ha dicho: solo los botones)
  let hubo = false;
  const siguiente = () => (pasos.length ? (hubo = true, pasos.shift()(siguiente)) : decir(hubo ? resumenCaja() : { ...MORTY, texto: '¿Qué más? El pedido, o la persiana.' }, botonesCierre()));
  hoy.trasCaja = true;
  siguiente();
}

// El Señor Mililitros, según lo que Morty sabe de él: hasta que lo ve en un vídeo o se le presenta, solo
// es una voz de madrugada («Número oculto», en silueta). Desde que se presenta, pasea por la calle.
const jefeVisto = () => partida.marcas.includes('jefe-visto') || partida.marcas.includes('jefe-presentado');
const jefePresentado = () => partida.marcas.includes('jefe-presentado');
const JEFE = (cara = 'Normal', nombre = 'Señor Mililitros') => (jefeVisto()
  ? { cara: portraitUrl('perro-jefe', cara), nombre, estilo: 'jefe' }
  : { cara: portraitUrl('perro-jefe', 'Oculto'), nombre: 'Número oculto', estilo: 'jefe' });
// con quién es la deuda, según lo que sabe Morty
const conQuien = () => (jefeVisto() ? 'el Señor Mililitros' : 'Dirección');
// los mensajes llegan de madrugada
const HORAS_NOCHE = ['4:12', '3:47', '5:03', '4:38', '2:56', '4:59', '3:21'];
// De madrugada: cuando escribe o llama el Señor Mililitros, la escena pasa a la habitación a oscuras,
// con Morty dormido; luego, de vuelta a donde se estaba
function aLaHabitacion() { escena.mostrar(HABITACION, ctx); $('#lugar').textContent = 'De madrugada'; $('#hora').textContent = ''; }
function deVuelta() { const sitio = SITIOS[estado]; if (sitio) { escena.mostrar(sitio.vista, ctx); ponLugar(sitio.lugar); } }
function correo(sigue) {
  const c = correos[partida.correos++];
  guarda(partida);
  aLaHabitacion();
  serie([{ ...MORTY, cara: portraitUrl('morty', 'Cansado'), texto: `Esa noche, a las ${HORAS_NOCHE[partida.correos % HORAS_NOCHE.length]}, le vibra el móvil. Un WhatsApp de ${jefeVisto() ? 'Dirección' : 'un número oculto'}: «${c.asunto}».` },
    { ...JEFE(['Normal', 'Determined', 'Happy', 'Inspired'][partida.correos % 4]), texto: c.texto }],
  [{ texto: '▸', secundario: true, accion: () => { deVuelta(); sigue(); } }]);
}

const ASESOR = (cara = 'Normal') => ({ cara: portraitUrl('perro-asesor', cara), nombre: 'El asesor' });
function ofertaAsesor(o, sigue) {
  partida.asesorVisto.push(o.id);
  guarda(partida);
  serie([{ texto: partida.asesorVisto.length > 1 ? 'Desde la mesa del rincón, el asesor fiscal vuelve a levantar la vista del portátil.' : 'Desde la mesa del rincón, el asesor fiscal levanta la vista del portátil. Es un chihuahua con corbata. Cobra en chuches.' },
    { ...ASESOR('Determined'), texto: `Psst. Morty. Tengo una optimización. ${o.dice}` },
    { ...ASESOR('Happy'), texto: `Son ${euros(o.gana)} para ti, ahora. Y es legal. Casi.` }],
  [{ texto: 'Aceptar', accion: () => {
    partida.optimizaciones.push(o.id);
    partida.caja = Math.round((partida.caja + o.gana) * 100) / 100;
    partida.cartas.push({ dia: partida.dia + 10, oferta: o.id });
    guarda(partida);
    serie([{ ...ASESOR('Joyous'), texto: 'Hecho. Ni te enteras. Ya me pagas en chuches.' },
      { ...MORTY, cara: portraitUrl('morty', 'Happy'), texto: `En caja, ${euros(partida.caja)}.` }], [{ texto: '▸', secundario: true, accion: sigue }]);
  } }, { texto: 'Mejor no', secundario: true, accion: () => {
    serie([{ ...ASESOR('Sigh'), texto: 'Tú sabrás. La honradez no desgrava.' }], [{ texto: '▸', secundario: true, accion: sigue }]);
  } }]);
}

function preguntaDeuda(sigue) {
  decir({ ...MORTY, cara: portraitUrl('morty', 'Dizzy'), texto: `Deuda con ${conQuien()}: ${euros(partida.deuda)}. En caja hay ${euros(partida.caja)}. ¿Le pago algo?` },
    [{ texto: 'Pagar', accion: () => {
      const paga = pagaDeuda(partida);
      guarda(partida);
      serie([{ ...MORTY, cara: portraitUrl('morty', 'Dizzy'), texto: `Pagado: ${euros(paga)}. ${partida.deuda ? `Quedan ${euros(partida.deuda)}.` : 'Deuda saldada. Por ahora.'}` },
        ...(partida.deuda ? [] : [{ texto: 'Esa noche, a las 3:47, le vibra el móvil:' }, { ...JEFE('Joyous'), texto: 'Lo sabía, Morty. Eres familia. Ya te llegará el recargo de la próxima.' }])],
      [{ texto: '▸', secundario: true, accion: sigue }]);
    } }, { texto: 'Ahora no', secundario: true, accion: sigue }]);
}

// Las cartas certificadas de las optimizaciones del asesor, a los diez días. Las trae el galgo.
const cartaPendiente = () => partida.cartas.find(c => c.dia <= partida.dia);
function abreCarta() {
  const c = cartaPendiente();
  partida.cartas = partida.cartas.filter(x => x !== c);
  const o = (asesor.ofertas || []).find(x => x.id === c.oferta);
  if (!o) { guarda(partida); decir(hablaCalle(), botonesCalle()); return; }
  const paga = Math.min(partida.caja, o.multa);
  partida.caja = Math.round((partida.caja - paga) * 100) / 100;
  const falta = Math.round((o.multa - paga) * 100) / 100;
  if (falta > 0) partida.deuda = Math.round((partida.deuda + a21(falta * 1.2)) * 100) / 100;
  guarda(partida);
  serie([{ texto: `Carta certificada. ${o.carta}` },
    { ...MORTY, cara: portraitUrl('morty', 'Dizzy'), texto: `A pagar: ${euros(o.multa)}.${falta > 0 ? ` No llega: lo adelanta el Señor Mililitros, con su pequeño recargo.` : ''}` },
    { ...ASESOR('Sigh'), texto: 'Eso es un tema de interpretación. Yo lo interpreté bien.' }], botonesCalle());
}

// El galgo del ticket: devuelve un perfume que no es de aquí, con un ticket de otro sitio cada vez
const GALGO = { id: 'galgo-ticket', nombre: 'El galgo', dibujo: 'galgo-ticket', sprite: 'perro-galgo-ticket' };
const TICKETS = ['de una gasolinera de Cártama', 'de un notario de Coín', 'de la ferretería de la esquina', 'de una farmacia de guardia',
  'de un tanatorio de Churriana', 'de La Olla de Barro (un menú del día)', 'firmado por el propio Señor Mililitros'];
function galgo() {
  botones([]);
  entra(GALGO, sprite => {
    if (estado !== 'mostrador') return;
    const ticket = TICKETS[partida.tickets % TICKETS.length];
    partida.tickets++;
    marca('galgo-1');
    guarda(partida);
    const devuelve = otra => {
      const vuelta = Math.min(partida.caja, 24.21);
      partida.caja = Math.round((partida.caja - vuelta) * 100) / 100;
      guarda(partida);
      serie([...(otra ? [{ cara: portraitUrl('perro-galgo-ticket', 'Inspired'), nombre: 'El galgo', texto: '…' },
        { ...MORTY, cara: portraitUrl('morty', 'Stunned'), texto: 'Me mira así. De lado. Vale. Vale.' }] : []),
        { ...MORTY, cara: portraitUrl('morty', 'Stunned'), texto: `Toma: ${euros(vuelta)}. No sé por qué.` },
        { cara: portraitUrl('perro-galgo-ticket', 'Joyous'), nombre: 'El galgo', texto: '…' }],
      [{ texto: 'Despedirlo', accion: () => { botones([]); sale(() => { pasaLaHora(); if (estado === 'mostrador') decir(SITIOS.mostrador.habla(), SITIOS.mostrador.botones()); }); } }]);
    };
    if (!sprite) { decir(SITIOS.mostrador.habla(), SITIOS.mostrador.botones()); return; }
    serie([{ texto: 'Entra un galgo con traje negro y corbata azul. Deja un frasco en el mostrador y, al lado, un ticket.' },
      { ...MORTY, cara: portraitUrl('morty', 'Stunned'), texto: `El ticket es ${ticket}. Este perfume no es de aquí.` },
      { cara: portraitUrl('perro-galgo-ticket', 'Sigh'), nombre: 'El galgo', texto: '…' }],
    [{ texto: 'Devolverle el dinero', accion: () => devuelve(false) }, { texto: 'No es de aquí', secundario: true, accion: () => devuelve(true) }]);
  });
}

// El botón de vacaciones: siempre gris. A la décima, llama el Señor Mililitros; a la vigésima, «Agosto».
const VACACIONES = ['Vacaciones. Ja.', 'El botón está gris. Como el futuro.', 'Autónomo y vacaciones. Elige una.', 'Lo pulsas y no pasa nada. Como en Hacienda.',
  'Gengar también lo ha pulsado. Tampoco.', '…', 'Morty lo pulsa con más fuerza. Sigue gris.'];
function vacaciones() {
  const n = ++partida.vacaciones;
  guarda(partida);
  if (n === 10) { apuntaSuceso('jefe-lancha'); verSuceso('jefe-lancha', 'mostrador', () => { ir('mostrador'); decir(resumenCaja(), botonesCierre()); }); return; }
  if (n >= 20) { decir({ ...MORTY, cara: portraitUrl('morty', 'Stunned'), texto: n === 20 ? 'Donde ponía «Vacaciones» ahora pone «Agosto». Sigue gris.' : 'Agosto. Gris.' }, botonesCierre()); return; }
  decir({ ...MORTY, cara: portraitUrl('morty', 'Stunned'), texto: VACACIONES[(n - 1) % VACACIONES.length] }, botonesCierre());
}

// El día de la baja: Morty no está en el mostrador, la escena tiembla y las caras se ven borrosas
function ponBaja() {
  const baja = !!partida.hoy?.baja;
  tienda.sinMorty = baja;
  document.body.classList.toggle('baja', baja);
}

// Las mejoras compradas: el frasco que cabe, las muestras, el baile más largo
function aplicaMejoras() {
  ponMax(partida.mejoras.includes('frasco100') ? 10 : partida.mejoras.includes('frasco50') ? 8 : 6);
  enLaCalle.baileLargo = partida.mejoras.includes('toldo') || partida.hoy?.jornada === 'gana';
}
const maxMuestras = () => (partida.mejoras.includes('mesa') ? 4 : 3);

function pedido() {
  // la meta, también aquí, para no gastarse lo del final en mejoras (desde el día 20)
  $('#pedido .pedido-meta').textContent = partida.dia >= 20 && !partida.marcas.includes('epilogo')
    ? `Para el final (desde el día 30) hacen falta ${euros(meta())} en caja y ninguna deuda.` : '';
  abrePedido({ ingredientes: ings, partida, P: ctx.P, mejoras, alComprar: m => {
    partida.caja = Math.round((partida.caja - m.precio) * 100) / 100;
    partida.mejoras.push(m.id);
    aplicaMejoras();
    guarda(partida);
    sfx('logro');
    if (m.id === 'cuadro') $('#pedido .pedido-meta').textContent = 'El fondo de «Cenas Encantadas» ya se puede descargar en «Fondos de pantalla», en el inicio.';
  }, alAcabar: p => {
    const hoy = partida.hoy;
    if (p) {
      hoy.pedido = true;
      partida.pedido = p.cantidad;
      partida.caja = Math.round((partida.caja - p.total) * 100) / 100;
    }
    guarda(partida);
    decir({ ...MORTY, texto: p ? `Pedido hecho: ${euros(p.total)}. Lo trae mañana a las 14:59. O no.` : 'Sin pedido. Mañana traerá lo que le dé la gana.' }, botonesCierre());
  } });
}

function bajarPersiana() {
  marca(partida.hoy.trimestre ? 'trimestre-1' : null);
  marca(partida.hoy.baja ? 'baja' : null);
  if (metaCumplida()) { epilogo(); return; }
  const noche = partida.dia % 2 === 0 && partida.correos < correos.length;   // (el WhatsApp de esa noche)
  guardaCopia(partida);
  partida.dia++;
  partida.hoy = null;
  empiezaDia();
  const adelante = () => serie([{ texto: '15:00. Persiana abajo. Las tardes no existen; nadie pregunta por qué.' }],
    [{ texto: 'Día siguiente', accion: seguirDia }]);
  if (noche) serie([{ texto: '15:00. Persiana abajo. Las tardes no existen; nadie pregunta por qué.' }], [{ texto: '▸', secundario: true, accion: () => correo(() => decir({ texto: 'Por la mañana, otra vez a la tienda.' }, [{ texto: 'Día siguiente', accion: seguirDia }])) }]);
  else adelante();
}

// ---------- el epílogo (sección 7) ----------
// Una animación de cuento (js/escenas-cuento.js): Morty baja la persiana y se sienta en el escalón con
// una cerveza; el perro que pasea a su humano llega solo y se sienta a su lado. Suena el teléfono: el
// Señor Mililitros. No lo coge. Sigue sonando, pero dentro de la cabeza: el Señor Mililitros es el
// propio Morty (tercera capa). Lo deja pasar. Y los créditos, con todos bailando.
// (prueba: desde la lista de pruebas, sin tocar la partida)
function epilogo(prueba = false) {
  if (!prueba) { marca('epilogo'); guarda(partida); }
  setMood('epilogo');
  const opt = partida.optimizaciones.length;
  const titular = opt >= 3 ? 'Inspección' : opt === 0 ? 'Nada que declarar' : null;
  cuento(FINAL({ titular, sobre: (partida.cajaB || 0) > 0 }), { saltar: prueba, alAcabar: () => {
    if (prueba) { ir('inicio'); listaPruebas(); return; }
    guardaCopia(partida);
    partida.dia++;
    partida.hoy = null;
    empiezaDia(false);
    guarda(partida);
    seguirDia();
    decir({ texto: 'Desde el menú (☰), en el inicio, ya se pueden descargar cuatro fondos de pantalla de la tienda.' }, botonesCalle());
  } });
}

// ---------- los fondos de pantalla (tras el final) ----------
function abreFondos() {
  const s = $('#fondos');
  const datos = { estante: partida.estante };
  const final = partida.marcas.includes('epilogo') || modoPruebas;
  const hay = Object.entries(FONDOS).filter(([, f]) => (f.comprado ? partida.mejoras.includes(f.comprado) || modoPruebas : final));
  $('#fondos .fondos-lista').replaceChildren(...hay.map(([id, f]) => {
    const tarjeta = document.createElement('div');
    tarjeta.className = 'fondo-tarjeta';
    const h = document.createElement('h3');
    h.textContent = f.titulo;
    const botones = document.createElement('div');
    for (const [tipo, rotulo] of [['movil', 'Móvil'], ['ordenador', 'Ordenador']]) {
      const b = document.createElement('button');
      b.textContent = rotulo;
      b.addEventListener('click', async () => {
        b.disabled = true;
        try { await descargaFondo(id, tipo, ctx, datos); } finally { b.disabled = false; }
      });
      botones.append(b);
    }
    tarjeta.append(dibujoFondo(id, 'movil', ctx, datos), h, botones);
    return tarjeta;
  }));
  s.classList.remove('hidden');
  s.scrollTop = 0;
}
$('#inicio-fondos').addEventListener('click', abreFondos);
$('#inicio-tutorial').addEventListener('click', () => ctx && tutorial());
$('#fondos-cerrar').addEventListener('click', () => $('#fondos').classList.add('hidden'));

// ---------- la partida: el código para pasarla a otro móvil, volver a ayer o empezar de cero ----------
function abrePartida() {
  const s = $('#partida');
  $('#partida-estado').textContent = `Día ${partida.dia} · caja ${euros(partida.caja)}${partida.deuda ? ` · deuda ${euros(partida.deuda)}` : ''}`;
  $('#partida-codigo').value = '';
  $('#partida-aviso').textContent = '';
  s.classList.remove('hidden');
  s.scrollTop = 0;
  const cero = $('#partida-cero');   // (el «¿Seguro?» no se queda armado de otra vez)
  cero.dataset.seguro = ''; cero.textContent = 'Empezar de cero'; cero.classList.add('secundario');
  $('#partida-copiar').onclick = async () => {
    const codigo = exporta(partida);
    $('#partida-codigo').value = codigo;
    try { await navigator.clipboard.writeText(codigo); $('#partida-aviso').textContent = 'Copiado. Pégalo en el otro móvil.'; }
    catch { $('#partida-aviso').textContent = 'Cópialo a mano del recuadro.'; }
  };
  const usar = p => { encargo = null; quita(); nuevo(); cierraMinijuego(); empiezaPartida(p); guarda(partida); s.classList.add('hidden'); ir('inicio'); };
  $('#partida-cargar').onclick = () => {
    const p = importa($('#partida-codigo').value);
    if (!p) { $('#partida-aviso').textContent = 'Ese código no vale.'; return; }
    usar(p);
  };
  // las copias de los días anteriores (las de cada cierre): con un segundo toque para confirmar
  const lista = copias().filter(c => c.dia < partida.dia).sort((a, b) => b.dia - a.dia);
  $('#partida-copias').replaceChildren(...(lista.length ? lista.map(c => {
    const b = document.createElement('button');
    b.className = 'secundario';
    b.textContent = `Volver al final del día ${c.dia}`;
    b.onclick = () => {
      if (b.dataset.seguro !== '1') { b.dataset.seguro = '1'; b.textContent = `¿Seguro? Vuelves al día ${c.dia + 1}`; return; }
      const p = structuredClone(c); p.dia++; p.hoy = null; usar(p);
    };
    return b;
  }) : [Object.assign(document.createElement('p'), { className: 'pequeno', textContent: 'Aún no hay copias de otros días: se hacen solas al bajar la persiana.' })]));
  // el archivo de la copia de seguridad
  $('#partida-exportar').onclick = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(partida)], { type: 'application/json' }));
    a.download = `mililitros-de-perfume-dia-${partida.dia}.json`;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    $('#partida-aviso').textContent = 'Guardada en un archivo. Si algún día se borra, «Importar partida» y ese archivo.';
  };
  $('#partida-importar').onclick = () => $('#partida-archivo').click();
  $('#partida-archivo').onchange = async ev => {
    const archivo = ev.target.files[0];
    ev.target.value = '';
    if (!archivo) return;
    try {
      const p = JSON.parse(await archivo.text());
      if (!p?.dia) throw new Error();
      usar(p);
    } catch { $('#partida-aviso').textContent = 'Ese archivo no es una partida de Mililitros de Perfume.'; }
  };
  // compartir el código (en el móvil, por WhatsApp o donde sea)
  $('#partida-compartir').classList.toggle('hidden', !navigator.share);
  $('#partida-compartir').onclick = async () => {
    try { await navigator.share({ title: 'Mi partida de Mililitros de Perfume', text: exporta(partida) }); } catch { /* cancelado */ }
  };
  $('#partida-cero').onclick = () => {
    const b = $('#partida-cero');
    // el segundo toque, en rojo: se pierde todo
    if (b.dataset.seguro !== '1') { b.dataset.seguro = '1'; b.textContent = '¿Seguro? Se pierde todo'; b.classList.remove('secundario'); return; }
    b.dataset.seguro = ''; b.textContent = 'Empezar de cero'; b.classList.add('secundario');
    borra();
    usar({});
  };
  $('#partida-volver').onclick = () => s.classList.add('hidden');
}

// El suelo de la escena queda justo encima del cuadro de diálogo, y el toldo, bajo la barra de arriba
function maquetar() {
  if (!estado || estado === 'inicio') { escena.ajustar(); return; }
  const arriba = $('#dialogo').getBoundingClientRect().top;
  document.documentElement.style.setProperty('--hueco-arriba-barra', `${Math.round($('.barra').getBoundingClientRect().bottom)}px`);
  const cartel = $('#cartel');
  const techo = cartel.classList.contains('hidden') ? $('.barra').getBoundingClientRect().bottom : cartel.getBoundingClientRect().bottom;
  escena.setBordes(arriba, techo);
  // el suceso ocupa el hueco de la escena, justo encima del cuadro de diálogo
  document.documentElement.style.setProperty('--hueco-abajo', `${innerHeight - arriba + 4}px`);
  document.documentElement.style.setProperty('--hueco-arriba', `${Math.round($('.barra').getBoundingClientRect().bottom) + 4}px`);
}

// ---------- sucesos de los perros ----------
// Se ve el vídeo (con la calle de fondo) mientras el cuadro cuenta qué ve Morty; al acabar, una frase
// y «Seguir»; se puede saltar. Luego se va a «despues» (por defecto, la calle).
let sucesoActual = null;   // el vídeo que se está viendo (se cierra si se sale al menú)
async function verSuceso(id, despues = 'calle', alAcabar = null) {
  const s = (await cargaSucesos()).find(x => x.id === id);
  ir(despues);
  if (!s) return;
  $('#lugar').textContent = s.rotulo || '';
  if (s.noche) aLaHabitacion();   // los mensajes de madrugada: en la habitación, a oscuras
  const acabar = () => (alAcabar ? alAcabar() : ir(despues));
  const antes = (s.antes || []).map(fraseSuceso);
  // la primera vez que Morty ve al Señor Mililitros en un vídeo
  const primeraVez = s.categoria === 'jefe' && !jefeVisto();
  if (primeraVez) { marca('jefe-visto'); guarda(partida); }
  const tras = [...(primeraVez ? [{ ...MORTY, cara: portraitUrl('morty', 'Stunned'), texto: 'Un momento. ¿El de la corbata es el Señor Mililitros?' },
    { ...MORTY, cara: portraitUrl('morty', 'Stunned'), texto: '¿Es un perro?' },
    { ...MORTY, texto: 'Será un filtro. En Dirección ya no saben qué inventar.' }] : []), ...(s.tras || []).map(fraseSuceso)];
  const verVideo = () => {
    bajaMusica(true);
    const ctrl = muestraSuceso(s, {
      alTerminar: () => { sucesoActual = null; bajaMusica(false); tras.length ? serie(tras, [{ texto: 'Seguir', accion: acabar }]) : acabar(); },
    });
    sucesoActual = ctrl;
    decir({ texto: s.durante || '' }, [{ texto: 'Saltar', secundario: true, accion: () => ctrl.cerrar() }]);
  };
  serie(antes, [{ texto: '▸', secundario: true, accion: verVideo }]);
}

// Quién dice cada frase de un suceso: nadie (lo cuenta el juego), Morty, Gengar, el Señor Mililitros
// (caja negra con el logo; al teléfono, el texto tiembla) o el grupo de WhatsApp de Dirección
const LOGO = 'assets/logo/icono-192.png';
function fraseSuceso(f) {
  if (f.quien === 'morty') return { cara: portraitUrl('morty', f.cara || 'Normal'), nombre: 'Morty Pociones', texto: f.texto };
  if (f.quien === 'gengar') return { cara: portraitUrl('gengar', f.cara || 'Normal'), nombre: 'Gengar', texto: f.texto };
  if (f.quien === 'jefe') return { ...JEFE(f.cara || (f.telefono ? 'Inspired' : 'Normal'), f.telefono ? 'Señor Mililitros' : 'Dirección'), texto: f.texto, temblor: !!f.telefono };
  if (f.quien === 'grupo') return { cara: LOGO, nombre: 'Grupo «Mililitros · Dirección»', texto: f.texto, estilo: 'jefe' };
  return { texto: f.texto };
}
addEventListener('resize', maquetar);
new ResizeObserver(maquetar).observe($('#dialogo'));
new ResizeObserver(maquetar).observe($('#cartel'));

// ---------- inicio ----------
const esIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const instalada = matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches || navigator.standalone;
if (esIOS && !instalada) $('#ios-tip').classList.remove('hidden');
// en Android, pantalla completa para quitar las barras del navegador
if (!esIOS && document.fullscreenEnabled && tactil && !instalada) {
  const b = $('#inicio-completa');
  b.classList.remove('hidden');
  b.addEventListener('click', () => document.documentElement.requestFullscreen?.().catch(() => {}));
  document.addEventListener('fullscreenchange', () => b.classList.toggle('hidden', !!document.fullscreenElement));
}

$('#inicio-abrir').addEventListener('click', () => ctx && seguirDia());
$('#inicio-partida').addEventListener('click', abrePartida);
// la música y los efectos, cada uno con su interruptor (se guardan aparte de la partida)
function pintaInterruptores() {
  const p = getPrefs();
  $('#inicio-musica').textContent = `Música: ${p.music ? 'sí' : 'no'}`;
  $('#inicio-efectos').textContent = `Efectos: ${p.sfx ? 'sí' : 'no'}`;
}
$('#inicio-musica').addEventListener('click', () => { setMusic(!getPrefs().music); pintaInterruptores(); });
$('#inicio-efectos').addEventListener('click', () => { setSfx(!getPrefs().sfx); pintaInterruptores(); sfx('toque'); });
pintaInterruptores();
$('#barra-menu').addEventListener('click', () => ir('inicio'));
$('#barra-libro').addEventListener('click', () => (libroAbierto() ? cierraLibro()
  : abreLibro(partida.libro, Object.fromEntries(Object.values(todos).map(c => [c.id, c.nombre])), historiasCerradas())));
$('#libro-cerrar').addEventListener('click', cierraLibro);
addEventListener('keydown', ev => {
  if (ev.key === 'Escape' && libroAbierto()) { cierraLibro(); return; }
  if (ev.key === 'Escape' && estado !== 'inicio') ir('inicio');
  else if (ev.key === 'Enter' && estado === 'inicio' && document.activeElement?.tagName !== 'BUTTON') $('#inicio-abrir').click();
});

// En local, un botón en el inicio con la lista de sucesos, para ver el que se quiera (pruebas);
// al acabar cada uno se vuelve a la lista
const TIPOS = { camino: 'De camino a la tienda', anoche: 'Anoche', vecino: 'El vecino de enfrente', repartidor: 'El repartidor',
  jefe: 'El perro con corbata (Señor Mililitros)' };
async function listaSucesos() {
  $('#lista-sucesos .lista-titulo').textContent = 'Sucesos (pruebas)';
  const todos = await cargaSucesos();
  $('#lista-sucesos .lista-botones').replaceChildren(...todos.map(s => {
    const b = document.createElement('button');
    b.className = 'secundario';
    b.innerHTML = `${s.rotulo || s.id}<small>${TIPOS[s.categoria] || s.categoria || ''} · ${s.id}</small>`;
    b.addEventListener('click', () => {
      $('#lista-sucesos').classList.add('hidden');
      if (!partida.hoy) empiezaDia(false);
      verSuceso(s.id, 'calle', () => { ir('inicio'); listaSucesos(); });
    });
    return b;
  }));
  $('#lista-sucesos').classList.remove('hidden');
}
// Pruebas, una a una: cada perro de la calle suelto, el baile, las caras del Señor Mililitros y
// los minijuegos
const PRUEBAS = [
  ['paseador', 'El que pasea a su humano', 'Cruza la acera de enfrente tirando de su humano.'],
  ['bulldog', 'El bulldog del periódico', 'En la terraza de La Olla de Barro: lee y, de vez en cuando, baja el periódico para mirar a la tienda.'],
  ['border-collie', 'El border collie', 'Pasa por la acera a su aire.'],
  ['jefe', 'El Señor Mililitros', 'Algunos días pasa por la calle, a dos patas y sin prisa.'],
  ['jefe-para', 'El Señor Mililitros se para', 'Pasa, se para delante de la tienda, mira a un lado y a otro, y sigue.'],
  ['jefe-cristal', 'El Señor Mililitros en el cristal', 'De repente, su cara pegada al escaparate, empañándolo.'],
  ['presentacion', 'El Señor Mililitros se presenta', ''],
  ['noche', 'Un WhatsApp de madrugada', ''],
  ['mejoras', 'Las mejoras de la tienda', ''],
  ['baile', 'El baile', 'Con un perfume perfecto: los perros de la calle bailan dos segundos.'],
  ['caras', 'Las caras del Señor Mililitros', ''],
  ['altillo', 'El altillo (la escalera arreglada)', ''],
  ['epilogo', 'El epílogo y los créditos', ''],
  ['intro', 'La intro', ''],
  ['mj-limpiar', 'Minijuego: limpiar el cristal', ''],
  ['mj-envolver', 'Minijuego: envolver el regalo', ''],
  ['mj-caja', 'Minijuego: contar la caja', ''],
  ['mj-noño', 'Minijuego: pulverizar a Ñoño', ''],
];
function listaPruebas() {
  $('#lista-sucesos .lista-titulo').textContent = 'Pruebas';
  $('#lista-sucesos .lista-botones').replaceChildren(...PRUEBAS.map(([id, rotulo]) => {
    const b = document.createElement('button');
    b.className = 'secundario';
    b.textContent = rotulo;
    b.addEventListener('click', () => { $('#lista-sucesos').classList.add('hidden'); prueba(id); });
    return b;
  }));
  $('#lista-sucesos').classList.remove('hidden');
}
function prueba(id) {
  if (!partida.hoy) empiezaDia(false);
  const [, rotulo, texto] = PRUEBAS.find(p => p[0] === id);
  const volver = { texto: 'Volver', secundario: true, accion: () => { enLaCalle.solo = null; ir('inicio'); listaPruebas(); } };
  ir('calle');
  $('#lugar').textContent = rotulo;
  enLaCalle.hoy = { paseador: true, 'border-collie': true, bulldog: true, jefe: true };
  if (id === 'altillo') { enLaCalle.solo = null; ir('mostrador'); $('#lugar').textContent = rotulo; altillo(true); return; }
  if (id === 'epilogo') { enLaCalle.solo = null; epilogo(true); return; }
  // todas las mejoras puestas, solo para verlas (no se guarda nada: al volver, como estaba)
  if (id === 'mejoras') {
    enLaCalle.solo = null;
    const antes = [...partida.mejoras];
    partida.mejoras = mejoras.map(m => m.id);
    aplicaMejoras();
    ir('mostrador');
    $('#lugar').textContent = rotulo;
    const salir = () => { partida.mejoras = antes; aplicaMejoras(); ir('inicio'); listaPruebas(); };
    const ver = k => {
      const m = mejoras[k];
      decir({ ...MORTY, cara: portraitUrl('morty', 'Happy'), texto: `${k + 1}/${mejoras.length} · ${m.nombre} (${euros(m.precio)}): ${m.dice}` },
        [{ texto: 'Siguiente', accion: () => ver((k + 1) % mejoras.length) }, { texto: 'Volver', secundario: true, accion: salir }]);
    };
    ver(0);
    return;
  }
  if (id === 'noche') {
    enLaCalle.solo = null;
    aLaHabitacion();
    serie([{ ...MORTY, cara: portraitUrl('morty', 'Cansado'), texto: 'Esa noche, a las 4:12, le vibra el móvil. Un WhatsApp de Dirección: «Objetivos del trimestre».' },
      { ...JEFE('Determined'), texto: 'Objetivo de este mes: vender un 20 % más que el mes pasado. Ánimo, campeón.' }], [volver]);
    return;
  }
  if (id === 'presentacion') { enLaCalle.solo = 'jefe-para'; enLaCalle.t0 = performance.now() / 1000; presentacion(true); return; }
  if (id === 'intro') { enLaCalle.solo = null; cuento(INTRO(), { alAcabar: () => { ir('inicio'); listaPruebas(); } }); return; }
  if (id.startsWith('mj-')) {
    enLaCalle.solo = null;
    const otra = { texto: 'Otra vez', accion: () => prueba(id) };
    const fin = r => decir({ texto: r.gana ? '¡Conseguido!' : r.dejado ? 'Dejado a medias.' : r.pillado ? 'Te ha pillado.' : r.roto ? 'Se ha roto el papel.' : 'Se acabó el tiempo.' }, [otra, volver]);
    const dejar = [{ texto: 'Dejarlo', secundario: true, accion: rinde }];
    if (id === 'mj-limpiar') { decir({ texto: 'Frota el escaparate con el dedo hasta dejarlo limpio.' }, dejar); limpiar(fin); }
    if (id === 'mj-envolver') { ir('mostrador'); $('#lugar').textContent = rotulo; decir({ texto: 'Corta el papel entre las dos marcas, dobla las solapas (primero los lados) y haz el lazo en el centro. Tres fallos y se rompe.' }, dejar); envolver(fin); }
    if (id === 'mj-noño') { ir('mostrador'); $('#lugar').textContent = rotulo; decir({ texto: 'Mantén el dedo para rociarle. Cuando baje las estampitas para mirarte, suelta.' }, dejar); pulverizar(imgsNoño, fin); }
    if (id === 'mj-caja') {
      ir('mostrador'); $('#lugar').textContent = rotulo;
      decir({ texto: '¿Cuántos euros hay en la bandeja? Elige el total bueno.' }, []);
      const j = contarCaja(r => decir({ texto: r.gana ? `¡Bien! Eran ${euros(r.total)}.` : `No: eran ${euros(r.total)}.` }, [otra, volver]));
      botones(j.opciones.map(v => ({ texto: euros(v).replace(/\s€$/, ''), secundario: true, numero: true, accion: () => responde(v) })));
    }
    return;
  }
  if (id === 'caras') {
    enLaCalle.solo = 'jefe'; enLaCalle.t0 = performance.now() / 1000;
    const caras = ['Normal', 'Happy', 'Determined', 'Angry', 'Surprised', 'Shouting', 'Inspired', 'Joyous', 'Sigh'];
    const ver = k => decir({ cara: caraDe('perro-jefe', caras[k]), nombre: 'Señor Mililitros', estilo: 'jefe', texto: `Cara ${k + 1} de 9: ${caras[k]}. Morty, esto es una familia.` },
      [{ texto: 'Siguiente', accion: () => ver((k + 1) % caras.length) }, volver]);
    ver(0);
    return;
  }
  const empieza = () => {
    if (id === 'baile') { enLaCalle.solo = null; bailan(); } else { enLaCalle.solo = id; enLaCalle.t0 = performance.now() / 1000; }
  };
  const botonesPrueba = [{ texto: 'Otra vez', accion: () => { empieza(); decir({ texto }, botonesPrueba); } }, volver];
  empieza();
  decir({ texto }, botonesPrueba);
}

if (modoPruebas) {
  $('#inicio-pruebas').classList.remove('hidden');
  $('#inicio-pruebas').addEventListener('click', listaPruebas);
  $('#inicio-sucesos').classList.remove('hidden');
  $('#inicio-sucesos').addEventListener('click', listaSucesos);
  $('#lista-volver').addEventListener('click', () => $('#lista-sucesos').classList.add('hidden'));
}

// Instalable como app (PWA) y jugable sin conexión
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

preparar().then(() => {
  // ?calle o ?mostrador abre directamente esa vista (para revisar con capturas); ?suceso=<id>, un suceso
  const q = location.search.slice(1);
  const suceso = new URLSearchParams(location.search).get('suceso');
  if (suceso) { verSuceso(suceso); return; }
  if (SITIOS[q]) { if (!partida.hoy) empiezaDia(false); ir(q); return; }
  ir('inicio');
});
