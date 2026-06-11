const TREE_ASSET_BASE_PATH = 'assets/generated/objects/trees';
const BERRY_BUSH_ASSET_BASE_PATH = 'assets/generated/objects/berry_bushes';

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

const worldObjectImages = new Map();

export function stableVariantIndex(x, y, salt, count) {
  if (count <= 1) return 0;
  const value = Math.abs((x * 7349 + y * 9151 + salt * 1013) % count);
  return value;
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
    ...BERRY_BUSH_ASSET_PATHS.ripe
  ];
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
