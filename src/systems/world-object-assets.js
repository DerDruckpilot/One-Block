const TREE_ASSET_BASE_PATH = 'assets/generated/objects/trees';
const BERRY_BUSH_ASSET_BASE_PATH = 'assets/generated/objects/berry_bushes';
const BUILDING_ASSET_BASE_PATH = 'assets/generated/objects/building';
const PLACEABLE_ASSET_BASE_PATH = 'assets/generated/objects/placeables_96';
const FLOOR_ASSET_BASE_PATH = 'assets/generated/tiles/floors_96';

export const TREE_ASSET_PATHS = {
  sapling: `${TREE_ASSET_BASE_PATH}/tree_sapling_01.png`,
  young: `${TREE_ASSET_BASE_PATH}/tree_young_01.png`,
  halfgrown: `${TREE_ASSET_BASE_PATH}/tree_halfgrown_01.png`,
  mature: [
    `${TREE_ASSET_BASE_PATH}/tree_mature_01.png`,
    `${TREE_ASSET_BASE_PATH}/tree_mature_02.png`,
    `${TREE_ASSET_BASE_PATH}/tree_mature_03.png`,
    `${TREE_ASSET_BASE_PATH}/tree_mature_04.png`
  ],
  stump: `${TREE_ASSET_BASE_PATH}/tree_stump_01.png`
};

export const BERRY_BUSH_ASSET_PATHS = {
  small: `${BERRY_BUSH_ASSET_BASE_PATH}/berry_bush_small_01.png`,
  growing: `${BERRY_BUSH_ASSET_BASE_PATH}/berry_bush_growing_01.png`,
  unripe: [
    `${BERRY_BUSH_ASSET_BASE_PATH}/berry_bush_unripe_01.png`,
    `${BERRY_BUSH_ASSET_BASE_PATH}/berry_bush_unripe_02.png`
  ],
  ripe: [
    `${BERRY_BUSH_ASSET_BASE_PATH}/berry_bush_ripe_01.png`,
    `${BERRY_BUSH_ASSET_BASE_PATH}/berry_bush_ripe_02.png`,
    `${BERRY_BUSH_ASSET_BASE_PATH}/berry_bush_ripe_03.png`,
    `${BERRY_BUSH_ASSET_BASE_PATH}/berry_bush_ripe_04.png`
  ]
};

export const FLOOR_OVERLAY_ASSET_PATHS = {
  woodFloor: `${FLOOR_ASSET_BASE_PATH}/wood_floor_96.png`,
  stoneFloor: `${FLOOR_ASSET_BASE_PATH}/stone_floor_96.png`
};

export const BUILDING_OBJECT_ASSET_SPECS = {
  window: { path: `${BUILDING_ASSET_BASE_PATH}/window_96.png`, width: 42, height: 44 },
  rug: { path: `${BUILDING_ASSET_BASE_PATH}/rug_96.png`, width: 30, height: 22 },
  plantPot: { path: `${BUILDING_ASSET_BASE_PATH}/plant_pot_96.png`, width: 30, height: 34 },
  shelf: { path: `${BUILDING_ASSET_BASE_PATH}/shelf_96.png`, width: 36, height: 42 },
  floorLantern: { path: `${BUILDING_ASSET_BASE_PATH}/floor_lantern_96.png`, width: 24, height: 32 }
};

export const CONNECTABLE_BARRIER_ASSET_VARIANTS = [
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

export const PLACEABLE_OBJECT_ASSET_SPECS = {
  workbench: { path: `${PLACEABLE_ASSET_BASE_PATH}/workbench_96.png`, width: 46, height: 44 },
  torch: { path: `${PLACEABLE_ASSET_BASE_PATH}/torch_96.png`, width: 30, height: 48 },
  campfire: { path: `${PLACEABLE_ASSET_BASE_PATH}/campfire_96.png`, width: 46, height: 42 },
  furnace: { path: `${PLACEABLE_ASSET_BASE_PATH}/furnace_96.png`, width: 48, height: 52 },
  bed: { path: `${PLACEABLE_ASSET_BASE_PATH}/bed_96.png`, width: 58, height: 46 },
  chickenNest: { path: `${PLACEABLE_ASSET_BASE_PATH}/chicken_nest_96.png`, width: 44, height: 34 },
  feedTrough: {
    path: `${PLACEABLE_ASSET_BASE_PATH}/feed_trough_empty_96.png`,
    filledPath: `${PLACEABLE_ASSET_BASE_PATH}/feed_trough_full_96.png`,
    width: 48,
    height: 34
  },
  waterTrough: {
    path: `${PLACEABLE_ASSET_BASE_PATH}/water_trough_empty_96.png`,
    filledPath: `${PLACEABLE_ASSET_BASE_PATH}/water_trough_full_96.png`,
    width: 48,
    height: 34
  },
  table: { path: `${PLACEABLE_ASSET_BASE_PATH}/table_96.png`, width: 48, height: 42 },
  chair: { path: `${PLACEABLE_ASSET_BASE_PATH}/chair_96.png`, width: 38, height: 46 }
};

export const BARRIER_OBJECT_ASSET_SPECS = {
  woodWall: { prefix: 'wood_wall', width: 48, height: 48 },
  door: { prefix: 'door', openable: true, width: 48, height: 50 },
  fence: { prefix: 'fence', width: 46, height: 44 },
  gate: { prefix: 'gate', openable: true, width: 48, height: 46 }
};

const worldObjectImages = new Map();

export function stableVariantIndex(x, y, salt, count) {
  if (count <= 1) return 0;
  let value = Math.imul(x | 0, 374761393) ^
    Math.imul(y | 0, 668265263) ^
    Math.imul(salt | 0, 1442695041);
  value ^= value >>> 13;
  value = Math.imul(value, 1274126177);
  value ^= value >>> 16;
  return Math.abs(value) % count;
}

function collectAssetPaths() {
  return [
    TREE_ASSET_PATHS.sapling,
    TREE_ASSET_PATHS.young,
    TREE_ASSET_PATHS.halfgrown,
    ...TREE_ASSET_PATHS.mature,
    TREE_ASSET_PATHS.stump,
    BERRY_BUSH_ASSET_PATHS.small,
    BERRY_BUSH_ASSET_PATHS.growing,
    ...BERRY_BUSH_ASSET_PATHS.unripe,
    ...BERRY_BUSH_ASSET_PATHS.ripe,
    ...Object.values(FLOOR_OVERLAY_ASSET_PATHS),
    ...Object.values(BUILDING_OBJECT_ASSET_SPECS).map((spec) => spec.path),
    ...getPlaceableWorldAssetPaths()
  ];
}

export function getPlaceableWorldAssetPaths() {
  const objectPaths = Object.values(PLACEABLE_OBJECT_ASSET_SPECS).flatMap((spec) =>
    [spec.path, spec.filledPath].filter(Boolean)
  );
  const barrierPaths = Object.values(BARRIER_OBJECT_ASSET_SPECS).flatMap((spec) => {
    const states = spec.openable ? ['closed', 'open'] : [null];
    return states.flatMap((state) => CONNECTABLE_BARRIER_ASSET_VARIANTS.map((variant) => {
      const stem = state ? `${spec.prefix}_${state}_${variant}` : `${spec.prefix}_${variant}`;
      return `${PLACEABLE_ASSET_BASE_PATH}/${stem}_96.png`;
    }));
  });

  return [
    ...objectPaths,
    ...barrierPaths
  ];
}

export function getFloorOverlayAssetPath(type) {
  return FLOOR_OVERLAY_ASSET_PATHS[type] || null;
}

export function getBuildingObjectAssetSpec(type) {
  return BUILDING_OBJECT_ASSET_SPECS[type] || null;
}

export function getPlaceableObjectAssetSpec(type, state = {}) {
  const spec = PLACEABLE_OBJECT_ASSET_SPECS[type];
  if (!spec) return null;
  const filled = state.filled === true || (state.feed || 0) > 0;
  return {
    ...spec,
    path: filled && spec.filledPath ? spec.filledPath : spec.path
  };
}

export function getBarrierObjectAssetSpec(type, shape = null, open = false) {
  const spec = BARRIER_OBJECT_ASSET_SPECS[type];
  if (!spec) return null;
  const variant = CONNECTABLE_BARRIER_ASSET_VARIANTS.includes(shape?.variant)
    ? shape.variant
    : 'single';
  const state = spec.openable ? `${open ? 'open' : 'closed'}_` : '';
  return {
    ...spec,
    path: `${PLACEABLE_ASSET_BASE_PATH}/${spec.prefix}_${state}${variant}_96.png`
  };
}

export function preloadWorldObjectAssets() {
  if (typeof Image === 'undefined') return;

  collectAssetPaths().forEach((path) => {
    if (worldObjectImages.has(path)) return;
    const image = new Image();
    image.decoding = 'async';
    image.src = path;
    worldObjectImages.set(path, image);
  });
}

export function getLoadedWorldObjectImage(path) {
  const image = worldObjectImages.get(path);
  if (!image || image.complete !== true || image.naturalWidth <= 0) return null;
  return image;
}

export function getTreeAssetPath(stage = 3, x = 0, y = 0) {
  if (stage <= 1) return TREE_ASSET_PATHS.sapling;
  if (stage === 2) return TREE_ASSET_PATHS.young;

  const index = stableVariantIndex(x, y, 17, TREE_ASSET_PATHS.mature.length);
  return TREE_ASSET_PATHS.mature[index];
}

export function getTreeAssetSpec(stage = 3, x = 0, y = 0) {
  if (stage <= 1) {
    return { path: TREE_ASSET_PATHS.sapling, width: 34, height: 34 };
  }
  if (stage === 2) {
    return { path: TREE_ASSET_PATHS.young, width: 54, height: 54 };
  }

  const index = stableVariantIndex(x, y, 17, TREE_ASSET_PATHS.mature.length);
  const sizes = [
    { width: 118, height: 126 },
    { width: 130, height: 132 },
    { width: 124, height: 138 },
    { width: 136, height: 130 }
  ];
  return {
    path: TREE_ASSET_PATHS.mature[index],
    ...sizes[index]
  };
}

export function getBerryBushAssetPath(stage = 3, ready = true, x = 0, y = 0) {
  if (stage <= 1) return BERRY_BUSH_ASSET_PATHS.small;
  if (stage === 2) return BERRY_BUSH_ASSET_PATHS.growing;

  if (!ready) {
    const index = stableVariantIndex(x, y, 31, BERRY_BUSH_ASSET_PATHS.unripe.length);
    return BERRY_BUSH_ASSET_PATHS.unripe[index];
  }

  const index = stableVariantIndex(x, y, 43, BERRY_BUSH_ASSET_PATHS.ripe.length);
  return BERRY_BUSH_ASSET_PATHS.ripe[index];
}

preloadWorldObjectAssets();
