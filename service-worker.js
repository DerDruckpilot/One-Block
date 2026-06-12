const CACHE_NAME = 'one-block-v0-5-9';

const CONNECTABLE_BARRIER_ASSET_VARIANTS = [
  'single',
  'horizontal',
  'vertical',
  'corner-up-left',
  'corner-up-right',
  'corner-down-left',
  'corner-down-right',
  'tee-up',
  'tee-right',
  'tee-down',
  'tee-left',
  'cross',
  'end-up',
  'end-right',
  'end-down',
  'end-left'
];

const PLACEABLE_WORLD_OBJECT_ASSETS = [
  './assets/generated/objects/placeables_96/workbench_96.png',
  './assets/generated/objects/placeables_96/torch_96.png',
  './assets/generated/objects/placeables_96/campfire_96.png',
  './assets/generated/objects/placeables_96/furnace_96.png',
  './assets/generated/objects/placeables_96/bed_96.png',
  './assets/generated/objects/placeables_96/chicken_nest_96.png',
  './assets/generated/objects/placeables_96/feed_trough_empty_96.png',
  './assets/generated/objects/placeables_96/feed_trough_full_96.png',
  './assets/generated/objects/placeables_96/water_trough_empty_96.png',
  './assets/generated/objects/placeables_96/water_trough_full_96.png',
  './assets/generated/objects/placeables_96/table_96.png',
  './assets/generated/objects/placeables_96/chair_96.png',
  ...CONNECTABLE_BARRIER_ASSET_VARIANTS.map((variant) => `./assets/generated/objects/placeables_96/wood_wall_${variant}_96.png`),
  ...CONNECTABLE_BARRIER_ASSET_VARIANTS.flatMap((variant) => [
    `./assets/generated/objects/placeables_96/door_closed_${variant}_96.png`,
    `./assets/generated/objects/placeables_96/door_open_${variant}_96.png`
  ]),
  ...CONNECTABLE_BARRIER_ASSET_VARIANTS.map((variant) => `./assets/generated/objects/placeables_96/fence_${variant}_96.png`),
  ...CONNECTABLE_BARRIER_ASSET_VARIANTS.flatMap((variant) => [
    `./assets/generated/objects/placeables_96/gate_closed_${variant}_96.png`,
    `./assets/generated/objects/placeables_96/gate_open_${variant}_96.png`
  ])
];

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
  './src/systems/animal-assets.js',
  './src/systems/crystal-system.js',
  './src/systems/crystal-assets.js',
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
  './assets/generated/icons/inventory_96/clay_brick.png',
  './assets/generated/icons/inventory_96/unfired_bowl.png',
  './assets/generated/icons/inventory_96/bowl.png',
  './assets/generated/icons/inventory_96/unfired_jug.png',
  './assets/generated/icons/inventory_96/jug.png',
  './assets/generated/icons/inventory_96/grass_block.png',
  './assets/generated/icons/inventory_96/grass_seeds.png',
  './assets/generated/icons/inventory_96/grass_tuft.png',
  './assets/generated/icons/inventory_96/plant_fiber_rope.png',
  './assets/generated/icons/inventory_96/raw_wood_log.png',
  './assets/generated/icons/inventory_96/tree_seed.png',
  './assets/generated/icons/inventory_96/spring_drop.png',
  './assets/generated/icons/inventory_96/berry.png',
  './assets/generated/icons/inventory_96/roasted_berries.png',
  './assets/generated/icons/inventory_96/cooked_steak.png',
  './assets/generated/icons/inventory_96/small_rock.png',
  './assets/generated/icons/inventory_96/stone.png',
  './assets/generated/icons/inventory_96/wooden_arrows.png',
  './assets/generated/icons/inventory_96/wooden_bow.png',
  './assets/generated/icons/inventory_96/wooden_pickaxe.png',
  './assets/generated/icons/inventory_96/wooden_slingshot.png',
  './assets/generated/icons/inventory_96/wooden_spear.png',
  './assets/generated/icons/inventory_96/axe.png',
  './assets/generated/icons/inventory_96/scythe.png',
  './assets/generated/icons/inventory_96/lasso.png',
  './assets/generated/icons/inventory_96/workbench.png',
  './assets/generated/icons/inventory_96/yellow_ore_or_clay_lump.png',
  './assets/generated/icons/inventory_96/torch.png',
  './assets/generated/icons/inventory_96/campfire.png',
  './assets/generated/icons/inventory_96/furnace.png',
  './assets/generated/icons/inventory_96/wood_wall.png',
  './assets/generated/icons/inventory_96/door.png',
  './assets/generated/icons/inventory_96/fence.png',
  './assets/generated/icons/inventory_96/gate.png',
  './assets/generated/icons/inventory_96/bed.png',
  './assets/generated/icons/inventory_96/chicken_nest.png',
  './assets/generated/icons/inventory_96/feed_trough.png',
  './assets/generated/icons/inventory_96/water_trough.png',
  './assets/generated/icons/inventory_96/table.png',
  './assets/generated/icons/inventory_96/chair.png',
  './assets/generated/icons/inventory_96/ammo_pouch.png',
  './assets/generated/icons/inventory_96/egg.png',
  './assets/generated/icons/inventory_96/fried_egg.png',
  './assets/generated/icons/inventory_96/floor_lantern.png',
  './assets/generated/icons/inventory_96/linen_tunic.png',
  './assets/generated/icons/inventory_96/plant_pot.png',
  './assets/generated/icons/inventory_96/quiver.png',
  './assets/generated/icons/inventory_96/raw_meat.png',
  './assets/generated/icons/inventory_96/rug.png',
  './assets/generated/icons/inventory_96/shelf.png',
  './assets/generated/icons/inventory_96/stone_floor.png',
  './assets/generated/icons/inventory_96/travel_boots.png',
  './assets/generated/icons/inventory_96/window.png',
  './assets/generated/icons/inventory_96/wood_floor.png',
  './assets/generated/icons/inventory_96/wool.png',
  './assets/generated/tiles/ground_96/clay_tileset_96.png',
  './assets/generated/tiles/ground_96/earth_tileset_96.png',
  './assets/generated/tiles/ground_96/farmland_tileset_96.png',
  './assets/generated/tiles/ground_96/grass_tileset_96.png',
  './assets/generated/tiles/ground_96/ground_transitions_96.png',
  './assets/generated/tiles/ground_96/stone_tileset_96.png',
  './assets/generated/tiles/moist_earth_96/moist_earth_tileset_96.png',
  './assets/generated/tiles/moist_earth_96/moist_earth_transitions_96.png',
  './assets/generated/tiles/floors_96/stone_floor_96.png',
  './assets/generated/tiles/floors_96/wood_floor_96.png',
  './assets/generated/tiles/water_96/water_animation_96.png',
  './assets/generated/tiles/water_96/water_tileset_96.png',
  './assets/generated/tiles/water_96/water_transitions_96.png',
  './assets/generated/objects/crystal/crystal_core_96.png',
  './assets/generated/objects/building/floor_lantern_96.png',
  './assets/generated/objects/building/plant_pot_96.png',
  './assets/generated/objects/building/rug_96.png',
  './assets/generated/objects/building/shelf_96.png',
  './assets/generated/objects/building/window_96.png',
  ...PLACEABLE_WORLD_OBJECT_ASSETS,
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
  './assets/generated/objects/animals/chicken_96.png',
  './assets/generated/objects/animals/sheep_96.png',
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
