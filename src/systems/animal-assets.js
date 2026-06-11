const ANIMAL_ASSET_BASE_PATH = 'assets/generated/objects/animals';

export const ANIMAL_ASSET_PATHS = {
  chicken: `${ANIMAL_ASSET_BASE_PATH}/chicken_96.png`,
  sheep: `${ANIMAL_ASSET_BASE_PATH}/sheep_96.png`
};

const animalImages = new Map();

export function preloadAnimalAssets() {
  if (typeof Image === 'undefined') return;
  Object.values(ANIMAL_ASSET_PATHS).forEach((path) => {
    if (animalImages.has(path)) return;
    const image = new Image();
    image.decoding = 'async';
    image.src = path;
    animalImages.set(path, image);
  });
}

export function getLoadedAnimalImage(type) {
  const path = ANIMAL_ASSET_PATHS[type];
  if (!path) return null;
  const image = animalImages.get(path);
  if (!image || image.complete !== true || image.naturalWidth <= 0) return null;
  return image;
}

preloadAnimalAssets();
