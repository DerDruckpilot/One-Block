const CACHE_NAME = 'one-block-v0-4-3';

const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './src/styles.css',
  './src/main.js',
  './src/config/constants.js',
  './src/core/game.js',
  './src/core/input.js',
  './src/core/touch-input.js',
  './src/core/camera.js',
  './src/world/tile-map.js',
  './src/entities/animal.js',
  './src/entities/enemy.js',
  './src/entities/flying-enemy.js',
  './src/entities/player.js',
  './src/systems/animal-system.js',
  './src/systems/crystal-system.js',
  './src/systems/crafting-system.js',
  './src/systems/day-night-system.js',
  './src/systems/drop-system.js',
  './src/systems/enemy-system.js',
  './src/systems/flying-enemy-system.js',
  './src/systems/log-system.js',
  './src/systems/plant-system.js',
  './src/systems/projectile-system.js',
  './src/systems/resource-inventory.js',
  './src/systems/save-system.js',
  './src/systems/render-system.js',
  './src/systems/terrain-renderer.js',
  './src/systems/background-system.js',
  './src/ui/hotbar.js',
  './src/ui/hud.js',
  './src/ui/menu-panels.js',
  './src/ui/orientation.js',
  './src/ui/pointer-hitboxes.js',
  './assets/ui/icon-192.png',
  './assets/ui/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((key) => key !== CACHE_NAME)
        .map((key) => caches.delete(key))
    )).then(() => clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request, { cache: 'no-cache' })
      .then((response) => {
        if (event.request.url.startsWith(self.location.origin)) {
          const responseCopy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseCopy));
        }

        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
