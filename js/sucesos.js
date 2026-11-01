// Los sucesos de los perros: microhistorias en vídeo que rompen la rutina (data/sucesos.json).
// Son vídeos de verdad convertidos a pixel art con tools/build_suceso.py, con su sonido original.
// Cada uno es una pequeña escena: antes, unas frases (Morty, Gengar, el Señor Mililitros por
// teléfono, el grupo de WhatsApp…); luego el vídeo, en el hueco de la escena dentro de una ventana
// con su rótulo; y después, Morty se queda un poco rallado y lo deja correr. Si el vídeo no carga
// (sin conexión), se pasa a lo de después y el juego sigue.

let lista = null;

export async function cargaSucesos() {
  if (!lista) lista = await fetch('data/sucesos.json').then(r => r.json()).catch(() => []);
  return lista;
}

// Pone el vídeo del suceso en pantalla; alTerminar() una sola vez, cuando acaba o se salta.
export function muestraSuceso(s, { alTerminar } = {}) {
  const caja = document.querySelector('#suceso');
  const video = caja.querySelector('video');
  caja.querySelector('.suceso-rotulo').textContent = s.rotulo || '';
  caja.classList.remove('hidden');
  document.body.classList.add('tapado');
  let hecho = false;
  const fin = (callar = false) => {
    if (hecho) return;
    hecho = true;
    if (callar === true) alTerminar = null;
    video.pause();
    video.replaceChildren();
    video.load();
    caja.classList.add('hidden');
    document.body.classList.remove('tapado');
    alTerminar?.();
  };
  video.onended = fin;
  // la ventana, con la proporción del vídeo (hay alguno apaisado)
  caja.classList.remove('apaisado');
  video.onloadedmetadata = () => {
    video.style.setProperty('--proporcion', `${video.videoWidth} / ${video.videoHeight}`);
    caja.classList.toggle('apaisado', video.videoWidth > video.videoHeight);
  };
  // en H.264 (lo leen los móviles y los navegadores de siempre)
  video.replaceChildren(...[[s.video, 'video/mp4']].map(([src, tipo]) => {
    const el = document.createElement('source');
    el.src = src; el.type = tipo;
    return el;
  }));
  video.lastChild.onerror = fin;      // si no carga ninguno, se cierra y el juego sigue
  // (y si el navegador no sabe leer H.264, ni lo intenta)
  if (!video.canPlayType('video/mp4')) { setTimeout(fin, 0); return { cerrar: fin, video }; }
  video.load();
  video.muted = false;
  video.play().catch(() => {
    // si el navegador no deja reproducir con sonido sin tocar antes la pantalla, sin sonido
    video.muted = true;
    video.play().catch(fin);
  });
  return { cerrar: fin, video };
}
