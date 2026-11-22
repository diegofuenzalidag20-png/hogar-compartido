const CACHE_NAME = 'finanzas-pareja-v84';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './dashboard_pareja.html',
  './manifest.json',
  './css/app.css',
  './js/01-base.js',
  './js/02-presupuesto.js',
  './js/03-perfil-cofres.js',
  './js/04-graficos-inicio.js',
  './js/05-registro.js',
  './js/06-checklist.js',
  './js/07-pwa-enlace.js',
  './js/08-nube.js',
  './js/09-gastos.js',
  './js/10-sueldos.js',
  './js/11-historial-cierre.js',
  './js/12-desplegables.js',
  './js/13-categorias.js',
  './js/14-tarjetas.js',
  './js/15-analisis-mes.js',
  './js/16-traspasos.js',
  './favicon.ico',
  './favicon-32x32.png',
  './favicon-16x16.png',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap',
  'https://cdn.jsdelivr.net/npm/chart.js@4.6.1/dist/chart.umd.min.js',
];
const PLAZO_RED_MS = 3500;

// Una instalación incompleta debe fallar para que el navegador la reintente: sin la app completa en caché no abre sin red.
// 'reload' evita copiar a la caché archivos viejos de la caché HTTP (GitHub Pages la guarda 10 minutos tras publicar).
// Fuentes y Chart.js vienen de otros servidores: se guardan si se puede, sin impedir la instalación.
self.addEventListener('install', (event) => {
  const propios = ASSETS_TO_CACHE.filter((u) => !u.startsWith('http'));
  const externos = ASSETS_TO_CACHE.filter((u) => u.startsWith('http'));
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => Promise.all([
      cache.addAll(propios.map((u) => new Request(u, { cache: 'reload' }))),
      ...externos.map((u) => cache.add(u).catch(() => {}))
    ]))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  // Firestore nunca debe salir de la caché: con una lectura vieja los teléfonos no se ven entre sí
  if (req.method !== 'GET' || new URL(req.url).hostname === 'firestore.googleapis.com') return;
  const isHtml = req.mode === 'navigate' ||
                 (req.headers.get('accept') && req.headers.get('accept').includes('text/html')) ||
                 req.url.endsWith('.html') ||
                 req.url.endsWith('/') ||
                 (new URL(req.url).origin === self.location.origin && /\.(js|css)$/.test(new URL(req.url).pathname));

  if (isHtml) {
    // Red primero para HTML, JS y CSS (así llegan las actualizaciones), pero con una red lenta o colgada
    // se usa la copia guardada a los 3,5 s; la respuesta de la red, si llega, igual queda para la próxima vez.
    const red = fetch(req).then((networkResponse) => {
      if (networkResponse && networkResponse.status === 200) {
        const copy = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
      }
      return networkResponse;
    });
    const guardada = () => caches.match(req, { ignoreSearch: true }).then((cached) => cached || (req.mode === 'navigate' ? caches.match('./index.html') : undefined));
    event.respondWith(new Promise((resolve, reject) => {
      const plazo = setTimeout(() => guardada().then((cached) => { if (cached) resolve(cached); }), PLAZO_RED_MS);
      red.then((r) => { clearTimeout(plazo); resolve(r); }, (e) => {
        clearTimeout(plazo);
        guardada().then((cached) => (cached ? resolve(cached) : reject(e)));
      });
    }));
    return;
  }

  // Cache-First con Network Fallback e ignoreSearch para assets estáticos (fuentes, iconos, librerías)
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((cachedResponse) => {
      return cachedResponse || fetch(req).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        }
        return networkResponse;
      }).catch(() => cachedResponse);
    })
  );
});
