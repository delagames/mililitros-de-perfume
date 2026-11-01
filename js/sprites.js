// Carga de hojas de SpriteCollab con su AnimData.xml; vale igual para los Pokémon, Gengar y Morty
// (assets/sprites/<id>/). Cada hoja tiene una fila por dirección y un fotograma por columna; las
// duraciones van en ticks de 1/60 s. Si falta algo (sin conexión), se rechaza y quien lo pide sigue sin él.

export const DIR = { down: 0, downRight: 1, right: 2, upRight: 3, up: 4, upLeft: 5, left: 6, downLeft: 7 };

const cache = new Map();

function cargaImagen(src) {
  return new Promise((ok, mal) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = () => mal(new Error(`No se pudo cargar ${src}`));
    img.src = src;
  });
}

export function loadSprite(id, nombres = ['Idle', 'Walk']) {
  const key = `${id}:${nombres.join(',')}`;
  if (!cache.has(key)) cache.set(key, fetchSprite(id, nombres));
  return cache.get(key);
}

async function fetchSprite(id, nombres) {
  const base = `assets/sprites/${id}`;
  const res = await fetch(`${base}/AnimData.xml`);
  if (!res.ok) throw new Error(`Falta ${base}/AnimData.xml`);
  const xml = new DOMParser().parseFromString(await res.text(), 'application/xml');
  const porNombre = {};
  for (const nodo of xml.querySelectorAll('Anim')) porNombre[nodo.querySelector('Name').textContent] = nodo;
  const anims = {};
  await Promise.all(nombres.map(async nombre => {
    let nodo = porNombre[nombre];
    if (!nodo) return;
    const copia = nodo.querySelector('CopyOf');
    if (copia) nodo = porNombre[copia.textContent];
    const hoja = nodo.querySelector('Name').textContent;
    const durations = [...nodo.querySelectorAll('Duration')].map(d => +d.textContent);
    const img = await cargaImagen(`${base}/${hoja}-Anim.png`);
    const fw = +nodo.querySelector('FrameWidth').textContent;
    const fh = +nodo.querySelector('FrameHeight').textContent;
    anims[nombre] = { img, fw, fh, durations, total: durations.reduce((a, b) => a + b, 0), rows: img.height / fh };
  }));
  if (!anims.Idle && anims.Walk) anims.Idle = anims.Walk;
  return { id, anims };
}

// El fotograma que toca en el instante t (segundos) de una animación
export function fotograma(sprite, anim = 'Idle', t = 0, dir = DIR.down) {
  const a = sprite.anims[anim] || sprite.anims.Idle;
  let tick = Math.floor(t * 60) % a.total, col = 0;
  while (tick >= a.durations[col]) tick -= a.durations[col++];
  return { img: a.img, sx: col * a.fw, sy: Math.min(dir, a.rows - 1) * a.fh, w: a.fw, h: a.fh };
}

// Retrato de un Pokémon (o de Morty); si no tiene esa cara, el Normal
export function portraitUrl(id, emocion = 'Normal') {
  return `assets/portraits/${id}/${emocion}.png`;
}
