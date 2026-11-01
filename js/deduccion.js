// La deducción (sección 4 de DISEÑO.md). El cliente nunca dice su naturaleza; la naturaleza decide
// qué zona del mapa de olor quiere y qué familia odia. Las zonas salen del sistema real de sabores
// de las bayas (data/natures.json): cada sabor empuja hacia un sitio del mapa, como sus bayas en el
// taller; la zona está hacia su sabor favorito y un poco lejos del que odia. Las neutras (Tímida,
// Seria, Rara) quieren el centro y no odian nada.
// Pistas: cómo habla (tics en lo que contesta), dos preguntas y tres muestras con reacción.

// Hacia dónde empuja cada sabor en el mapa (x fresco → cálido, y suave → intenso)
const RUMBO = { spicy: [0.7, 0.25], sour: [-0.6, 0.35], sweet: [0.3, -0.6], bitter: [0.1, 0.7], dry: [-0.65, -0.2] };
const RADIO = 0.2;   // la zona buena es pequeña: dos bayas del sabor favorito no bastan

// Las siete familias de las gotas y su sabor de baya (la tabla de la sección 4)
export const FAMILIAS = [
  { id: 'picante', nombre: 'Picante', sabor: 'spicy', color: 'gota_picante' },
  { id: 'citrico', nombre: 'Cítrico', sabor: 'sour', color: 'gota_citrico' },
  { id: 'dulce', nombre: 'Dulce', sabor: 'sweet', color: 'gota_dulce' },
  { id: 'verde', nombre: 'Verde', sabor: 'bitter', color: 'gota_verde' },
  { id: 'fresco', nombre: 'Fresco', sabor: 'dry', color: 'gota_fresco' },
  { id: 'amargo', nombre: 'Amargo', sabor: 'bitter', color: 'gota_amargo' },
  { id: 'floral', nombre: 'Floral', sabor: 'sweet', color: 'gota_floral' },
];
const SABOR_DE = Object.fromEntries(FAMILIAS.map(f => [f.id, f.sabor]));
export const NOMBRE_SABOR = { spicy: 'lo picante', sour: 'lo ácido', sweet: 'lo dulce', bitter: 'lo amargo', dry: 'lo seco' };

// Cómo habla cada naturaleza: la pista del Libro y el tic que se le pega a lo que contesta
const HABLA = {
  adamant: { pista: 'Habla en imperativo y remata con «y punto».', tic: t => `${t} Y punto.` },
  brave: { pista: 'Todo lo dice gritando y con prisa por pelearse.', tic: t => `¡${sinPunto(t)}! ¡Venga!` },
  naughty: { pista: 'Hace chistes de todo y se ríe solo: «je, je».', tic: t => `${t} Je, je.` },
  relaxed: { pista: 'Sin prisa ninguna: «tranqui».', tic: t => `Tranqui… ${minus(t)}` },
  timid: { pista: 'Tartamudea en cuanto se pone nervioso.', tic: t => tartamudea(t) },
  calm: { pista: 'Contesta despacio y en voz baja: «mm».', tic: t => `Mm. ${t}` },
  sassy: { pista: 'Todo lo dice con desprecio: «¿no te lo había dicho ya?».', tic: t => `Pues ${minus(sinPunto(t))}, ¿no te lo había dicho ya?` },
  quiet: { pista: 'Tarda una eternidad en cada palabra.', tic: t => pausas(t) },
  mild: { pista: 'Muy educado: todo «si no es molestia».', tic: t => `${sinPunto(t)}, si no es molestia.` },
  hasty: { pista: 'Habla a toda prisa y lo quiere ya.', tic: t => `¡${sinPunto(t)}! ¡Rápido, rápido!` },
  rash: { pista: 'Se ríe a destiempo y salta de una cosa a otra.', tic: t => `¡Ja! ${t} ¿Qué decíamos?` },
  naive: { pista: 'Todo le parece increíble: «¡hala!».', tic: t => `¡Hala! ${t} ¿A que sí?` },
  impish: { pista: 'Contesta con una risita de trastada: «jiji».', tic: t => `${t} Jiji.` },
  bashful: { pista: 'No se atreve a decidir: «lo que tú veas».', tic: t => `Eh… ${minus(sinPunto(t))}… o lo que tú veas.` },
  serious: { pista: 'Seco y sin adornos.', tic: t => t },
  quirky: { pista: 'Cambia de idea a mitad de frase.', tic: t => `${t} Bueno, hoy. Mañana no sé.` },
};
const sinPunto = t => t.replace(/[.!¡]+$/g, '').replace(/^¡/, '');
const minus = t => t.charAt(0).toLowerCase() + t.slice(1);
const tartamudea = t => `${t.charAt(0)}-${t.charAt(0).toLowerCase()}${t.slice(1)}`.replace(/ (\w)/, (m, l) => ` ${l}-${l}`);
const pausas = t => t.split(' ').map((p, i, a) => (i < a.length - 1 && i % 2 ? `${p}…` : p)).join(' ');

let naturalezas = {};
export async function cargaNaturalezas() {
  const d = await fetch('data/natures.json').then(r => r.json()).catch(() => ({ naturalezas: [] }));
  for (const n of d.naturalezas) {
    const zona = n.gusta
      ? [0, 1].map(k => +(0.8 * RUMBO[n.gusta][k] - 0.5 * RUMBO[n.odia][k]).toFixed(3))
      : [0, 0];
    naturalezas[n.id] = { ...n, zona, radio: n.gusta ? RADIO : 0.25, ...HABLA[n.id] };
  }
  return naturalezas;
}
export const naturaleza = id => naturalezas[id];
// Las del Libro: las que llevan los clientes de esta versión (las demás llegarán)
export const DEL_LIBRO = ['adamant', 'brave', 'naughty', 'relaxed', 'impish', 'timid', 'hasty', 'naive', 'calm', 'sassy', 'quiet', 'mild', 'rash', 'bashful', 'serious', 'quirky'];

// Lo que dice el cliente, con el tic de su naturaleza
export const conTic = (nat, texto) => (naturalezas[nat]?.tic || (t => t))(texto);

// ---------- preguntas: cerradas, cada una descarta medio mapa ----------
export const PREGUNTAS = [
  { id: 'momento', texto: '¿Día o noche?', pregunta: '¿Lo quieres para el día o para la noche?',
    responde: ([, y]) => (y > 0.2 ? 'Para la noche, que se note.' : y < -0.2 ? 'Para el día, que no moleste.' : 'Me da igual el día que la noche.') },
  { id: 'abrigo', texto: '¿Fresco o cálido?', pregunta: '¿Fresquito o que abrigue?',
    responde: ([x]) => (x > 0.2 ? 'Que abrigue, que dé calor.' : x < -0.2 ? 'Fresquito, que refresque.' : 'Ni frío ni calor, en su punto.') },
  { id: 'odia', texto: '¿Qué no soportas?', pregunta: '¿Hay algo que no soportes?',
    responde: (zona, odia) => (odia ? `No soporto ${NOMBRE_SABOR[odia]}.` : 'Yo como de todo, la verdad.') },
];

// ---------- las muestras: a qué sabe cada familia para esta naturaleza ----------
// 'gusta' (su sabor favorito), 'odia' (el que odia: alguna de sus familias) o 'igual'
export function reaccion(nat, familia, odiaExtra = []) {
  const n = naturalezas[nat], sabor = SABOR_DE[familia];
  if (!n || !sabor) return 'igual';
  if (sabor === n.odia || odiaExtra.includes(sabor)) return 'odia';
  if (sabor === n.gusta) return 'gusta';
  return 'igual';
}
export const FRASE_REACCION = {
  gusta: ['Uy. Esto sí.', 'Esto me gusta mucho.', 'Mmm. Por aquí va la cosa.'],
  igual: ['Ni fu ni fa.', 'Huele a algo, sí.', 'No me dice nada.'],
  odia: ['¡Puaj! Quita eso.', 'Eso ni de lejos.', 'Aparta, aparta, que me mareo.'],
};
export const CARA_REACCION = { gusta: 'Joyous', igual: 'Normal', odia: 'Angry' };

// ---------- el resultado: lo cerca que cae el perfume de su zona ----------
// 'odia' si lleva algo de la familia que odia (se va sin pagar), si no 'perfecto' dentro de la
// zona, 'bien' cerca y 'mal' lejos
export function puntua(nat, perfume, ingrediente, odiaExtra = []) {
  const n = naturalezas[nat];
  if (!n) return 'bien';
  const odiados = [n.odia, ...odiaExtra].filter(Boolean);
  if (perfume.ingredientes.some(id => odiados.includes(SABOR_DE[ingrediente(id)?.familia]))) return 'odia';
  const [x, y] = perfume.pos, [cx, cy] = n.zona;
  const d = Math.hypot(x - cx, y - cy) / n.radio;
  return d <= 1 ? 'perfecto' : d <= 1.6 ? 'bien' : 'mal';
}
// Lo que se cobra (todos los precios acaban en ,21)
export const PRECIO = { perfecto: 39.21, bien: 19.21, mal: 0, odia: 0 };
// (con espacio de no separar: el «€» nunca se queda solo en la línea de abajo)
export const euros = n => `${n.toFixed(2).replace('.', ',')} €`;
