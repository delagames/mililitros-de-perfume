// Service worker: la tienda se puede instalar como app y jugar sin conexión (como El Pino).
// Primero intenta la red (así siempre se ve la última versión) y, si no hay, tira de la copia.
// Lo básico se guarda al instalar; el resto (sprites, retratos), según se va usando. Los vídeos de
// los sucesos no se guardan: pesan mucho, y sin conexión el suceso se cierra y el juego sigue.
// Subir la versión de CACHE en cada publicación, si no el móvil sigue viendo la vieja.
const CACHE = 'mililitros-de-perfume-v59';
const CORE = [
  './', 'index.html', 'manifest.webmanifest', 'css/style.css',
  'js/main.js', 'js/escena.js', 'js/calle.js', 'js/mostrador.js', 'js/taller.js', 'js/perfume.js', 'js/deduccion.js',
  'js/libro.js', 'js/dia.js', 'js/minijuegos.js', 'js/pedido.js', 'js/perros.js', 'js/client.js', 'js/sprites.js',
  'js/sucesos.js', 'js/fondos.js', 'js/habitacion.js', 'js/altillo.js', 'js/audio.js', 'js/save.js', 'js/pixel.js', 'js/emblema.js', 'js/cuento.js', 'js/escenas-cuento.js',
  'data/clients.json', 'data/ingredients.json', 'data/natures.json', 'data/sucesos.json', 'data/emails.json',
  'data/advisor.json', 'data/upgrades.json', 'data/facebook.json',
  'assets/ui/palette.json', 'assets/ui/escudo-malaga-pixel.png', 'assets/ui/escudo-malaga-pixel-mini.png', 'assets/ui/escudo-malaga.png', 'assets/ui/ventana.png', 'assets/ui/boton.png', 'assets/ui/boton-secundario.png',
  'assets/logo/icono.svg', 'assets/logo/icono-192.png', 'assets/logo/icono-512.png',
];

self.addEventListener('install', ev => {
  ev.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', ev => {
  ev.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', ev => {
  if (ev.request.method !== 'GET' || !ev.request.url.startsWith(self.location.origin)) return;
  const ruta = new URL(ev.request.url).pathname;
  if (/\.(mp4|webm)$/.test(ruta)) return;   // los vídeos, siempre de la red
  // las imágenes, fuentes y sonidos: primero lo guardado (cambian poco y, al subir la versión de CACHE, se renuevan)
  if (/\.(png|jpe?g|webp|gif|woff2?|ttf|ogg|mp3|wav)$/.test(ruta)) {
    ev.respondWith(caches.match(ev.request).then(c => c || fetch(ev.request).then(res => {
      if (res.ok) { const copia = res.clone(); caches.open(CACHE).then(cc => cc.put(ev.request, copia)); }
      return res;
    })));
    return;
  }
  // «no-cache»: pregunta siempre al servidor si hay versión nueva; la página en sí no lo admite
  const req = ev.request.mode === 'navigate' ? ev.request : new Request(ev.request, { cache: 'no-cache' });
  const red = fetch(req).then(res => {
    if (res.ok) {
      const copia = res.clone();
      caches.open(CACHE).then(c => c.put(ev.request, copia));
    }
    return res;
  });
  // con mala cobertura no se espera eternamente: a los 4 s, lo guardado (si lo hay); si no, lo que llegue
  const lento = new Promise(r => setTimeout(r, 4000)).then(() => caches.match(ev.request)).then(c => c || red);
  const guardado = () => caches.match(ev.request, { ignoreSearch: ev.request.mode === 'navigate' });
  ev.respondWith(Promise.race([red, lento]).catch(guardado));
});
