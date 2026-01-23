const CACHE_NAME = 'grid-app-v3'; // Incremented version to refresh cache
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './movie.js',      // Added
  './card.js',       // Added
  './object.js',     // Added
  './vacation.js',   // Added
  './song.js',       // Added
  './manifest.json',
  './background.jpg',
  './gallery.jpg',
  './icon-192.png',
  './icon-512.png',
  'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css',
  'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js'
];

// 1. Install Phase: Save everything to the cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching app assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// 2. Activate Phase: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Clearing old cache');
            return caches.delete(cache);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// 3. Fetch Phase: Serve from cache first, then network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
