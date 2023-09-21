const cacheName = 'voxelpainter2-49136fda-7728-419a-b9b4-e2d54ff7a69f-v1.4.2';
const contentToCache = [
    '/index.html',
    '/assets/textures/square-outline-textured.png',
    '/favicon.png',
    '/manifest.webmanifest',
    '/js/script.js',
    "sw.js",
    '/css/style.css',
    '/js/lib/vxmparser/vxmparser.js',
    "/assets/audio/clear.wav",
    "/assets/audio/delete.wav",
    "/assets/audio/place.wav",
    "/assets/audio/paint.wav",
    "https://cdnjs.cloudflare.com/ajax/libs/tween.js/16.3.5/Tween.min.js",
    "https://threejs.org/examples/jsm/exporters/GLTFExporter.js",
    "https://cdn.skypack.dev/pin/three@v0.137.0-X5O2PK3x44y1WRry67Kr/mode=imports/optimized/three.js",
    "https://unpkg.com/eventemitter3@latest/umd/eventemitter3.min.js",
    "https://cdn.skypack.dev/-/three-dragger@v1.0.2-pTfxvahnmJMIYoHaBGdM/dist=es2019,mode=imports/optimized/three-dragger.js",
    "/js/lib/dragger/utils.js",
    "/AUTHOR",
    "/LICENSE"
];

self.addEventListener('install', (e) => {
  console.log('[Service Worker] Install (ver', cacheName, ")");
  e.waitUntil((async () => {
    const cache = await caches.open(cacheName);
    console.log('[Service Worker] Caching all: app shell and content');
    await cache.addAll(contentToCache);
  })())
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keyList) => {
    return Promise.all(keyList.map((key) => {
      if (key === cacheName) { return; }
      return caches.delete(key);
    }))
  }));
});

self.addEventListener('fetch', (e) => {
  e.respondWith((async () => {
    const r = await caches.match(e.request);
    console.log(`[Service Worker] Fetching resource: ${e.request.url}`);
    if (r) { return r; }
    const response = await fetch(e.request);
    const cache = await caches.open(cacheName);
    console.log(`[Service Worker] Caching new resource: ${e.request.url}`);
    cache.put(e.request, response.clone());
    return response;
  })());
});