const TREE_ASSET_BASE_PATH = 'assets/generated/objects/trees';
const BERRY_BUSH_ASSET_BASE_PATH = 'assets/generated/objects/berry_bushes';
const BUILDING_ASSET_BASE_PATH = 'assets/generated/objects/building';
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
    ...Object.values(BUILDING_OBJECT_ASSET_SPECS).map((spec) => spec.path)
  ];
}

export function getFloorOverlayAssetPath(type) {
  return FLOOR_OVERLAY_ASSET_PATHS[type] || null;
}

export function getBuildingObjectAssetSpec(type) {
  return BUILDING_OBJECT_ASSET_SPECS[type] || null;
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
