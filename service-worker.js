const CACHE_NAME = 'one-block-v0-5-4';

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
  './src/systems/world-object-assets.js',
  './src/systems/background-system.js',
  './src/ui/hotbar.js',
  './src/ui/hud.js',
  './src/ui/hand-indicator.js',
  './src/ui/item-icons.js',
  './src/ui/menu-panels.js',
  './src/ui/orientation.js',
  './src/ui/pointer-hitboxes.js',
  './assets/generated/icons/inventory_96/clay.png',
  './assets/generated/icons/inventory_96/grass_block.png',
  './assets/generated/icons/inventory_96/grass_seeds.png',
  './assets/generated/icons/inventory_96/grass_tuft.png',
  './assets/generated/icons/inventory_96/plant_fiber_rope.png',
  './assets/generated/icons/inventory_96/raw_wood_log.png',
  './assets/generated/icons/inventory_96/small_rock.png',
  './assets/generated/icons/inventory_96/stone.png',
  './assets/generated/icons/inventory_96/wooden_arrows.png',
  './assets/generated/icons/inventory_96/wooden_bow.png',
  './assets/generated/icons/inventory_96/wooden_pickaxe.png',
  './assets/generated/icons/inventory_96/wooden_slingshot.png',
  './assets/generated/icons/inventory_96/wooden_spear.png',
  './assets/generated/icons/inventory_96/workbench.png',
  './assets/generated/icons/inventory_96/yellow_ore_or_clay_lump.png',
  './assets/generated/tiles/ground_96/clay_tileset_96.png',
  './assets/generated/tiles/ground_96/earth_tileset_96.png',
  './assets/generated/tiles/ground_96/farmland_tileset_96.png',
  './assets/generated/tiles/ground_96/grass_tileset_96.png',
  './assets/generated/tiles/ground_96/ground_transitions_96.png',
  './assets/generated/tiles/ground_96/stone_tileset_96.png',
  './assets/generated/tiles/moist_earth_96/moist_earth_tileset_96.png',
  './assets/generated/tiles/moist_earth_96/moist_earth_transitions_96.png',
  './assets/generated/tiles/water_96/water_animation_96.png',
  './assets/generated/tiles/water_96/water_tileset_96.png',
  './assets/generated/tiles/water_96/water_transitions_96.png',
  './assets/generated/objects/trees/tree_halfgrown_01.png',
  './assets/generated/objects/trees/tree_mature_01.png',
  './assets/generated/objects/trees/tree_mature_02.png',
  './assets/generated/objects/trees/tree_mature_03.png',
  './assets/generated/objects/trees/tree_mature_04.png',
  './assets/generated/objects/trees/tree_sapling_01.png',
  './assets/generated/objects/trees/tree_stump_01.png',
  './assets/generated/objects/trees/tree_young_01.png',
  './assets/generated/objects/berry_bushes/berry_bush_growing_01.png',
  './assets/generated/objects/berry_bushes/berry_bush_ripe_01.png',
  './assets/generated/objects/berry_bushes/berry_bush_ripe_02.png',
  './assets/generated/objects/berry_bushes/berry_bush_ripe_03.png',
  './assets/generated/objects/berry_bushes/berry_bush_ripe_04.png',
  './assets/generated/objects/berry_bushes/berry_bush_small_01.png',
  './assets/generated/objects/berry_bushes/berry_bush_unripe_01.png',
  './assets/generated/objects/berry_bushes/berry_bush_unripe_02.png',
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
