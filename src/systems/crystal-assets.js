export const CRYSTAL_ASSET_PATH = 'assets/generated/objects/crystal/crystal_core_96.png';

const crystalImages = new Map();

export function getCrystalAssetPath() {
  return CRYSTAL_ASSET_PATH;
}

export function preloadCrystalAssets() {
  if (typeof Image === 'undefined') return;
  if (crystalImages.has(CRYSTAL_ASSET_PATH)) return;

  const image = new Image();
  image.decoding = 'async';
  image.src = CRYSTAL_ASSET_PATH;
  crystalImages.set(CRYSTAL_ASSET_PATH, image);
}

export function getLoadedCrystalImage() {
  const image = crystalImages.get(CRYSTAL_ASSET_PATH);
  if (!image || image.complete !== true || image.naturalWidth <= 0) return null;
  return image;
}
