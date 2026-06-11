import { RESOURCE_ICONS } from '../config/constants.js';

const ICON_BASE_PATH = 'assets/generated/icons/inventory_96';

export const ITEM_ICON_PATHS = {
  earth: `${ICON_BASE_PATH}/grass_block.png`,
  stone: `${ICON_BASE_PATH}/stone.png`,
  clay: `${ICON_BASE_PATH}/clay.png`,
  rawWood: `${ICON_BASE_PATH}/raw_wood_log.png`,
  fiber: `${ICON_BASE_PATH}/plant_fiber_rope.png`,
  grassSeed: `${ICON_BASE_PATH}/grass_seeds.png`,
  workbench: `${ICON_BASE_PATH}/workbench.png`,
  woodenPickaxe: `${ICON_BASE_PATH}/wooden_pickaxe.png`,
  woodenSpear: `${ICON_BASE_PATH}/wooden_spear.png`,
  slingshot: `${ICON_BASE_PATH}/wooden_slingshot.png`,
  bow: `${ICON_BASE_PATH}/wooden_bow.png`,
  arrow: `${ICON_BASE_PATH}/wooden_arrows.png`,
  stoneBall: `${ICON_BASE_PATH}/small_rock.png`,
  egg: `${ICON_BASE_PATH}/egg.png`,
  friedEgg: `${ICON_BASE_PATH}/fried_egg.png`,
  rawMeat: `${ICON_BASE_PATH}/raw_meat.png`,
  wool: `${ICON_BASE_PATH}/wool.png`,
  ammoPouch: `${ICON_BASE_PATH}/ammo_pouch.png`,
  quiver: `${ICON_BASE_PATH}/quiver.png`,
  linenTunic: `${ICON_BASE_PATH}/linen_tunic.png`,
  travelBoots: `${ICON_BASE_PATH}/travel_boots.png`
};

const itemIconImages = new Map();

const ICON_FALLBACKS = {
  earth: 'soil',
  stone: 'stone',
  clay: 'clay',
  rawWood: 'wood',
  fiber: 'fiber',
  grassSeed: 'seed',
  treeSeed: 'tree-seed',
  springDrop: 'drop',
  berry: 'berry',
  rawMeat: 'meat',
  roastedBerries: 'berry',
  cookedSteak: 'meat',
  egg: 'egg',
  friedEgg: 'fried-egg',
  workbench: 'bench',
  torch: 'torch',
  campfire: 'fire',
  furnace: 'furnace',
  woodWall: 'wall',
  door: 'door',
  fence: 'fence',
  gate: 'gate',
  bed: 'bed',
  chickenNest: 'nest',
  feedTrough: 'trough',
  waterTrough: 'water-trough',
  table: 'table',
  chair: 'chair',
  woodenPickaxe: 'pickaxe',
  woodenSpear: 'spear',
  slingshot: 'slingshot',
  bow: 'bow',
  lasso: 'lasso',
  axe: 'axe',
  scythe: 'scythe',
  arrow: 'arrow',
  stoneBall: 'stone-ball',
  clayBrick: 'brick',
  unfiredBowl: 'bowl-raw',
  bowl: 'bowl',
  unfiredJug: 'jug-raw',
  jug: 'jug',
  wool: 'fiber',
  ammoPouch: 'bag',
  quiver: 'quiver',
  linenTunic: 'shirt',
  travelBoots: 'boots'
};

export function getItemIconKind(resource) {
  return ICON_FALLBACKS[resource] || 'fallback';
}

export function getItemIconPath(resource) {
  return ITEM_ICON_PATHS[resource] || null;
}

export function preloadItemIcons() {
  if (typeof Image === 'undefined') return;

  Object.entries(ITEM_ICON_PATHS).forEach(([resource, path]) => {
    if (itemIconImages.has(resource)) return;
    const image = new Image();
    image.decoding = 'async';
    image.src = path;
    itemIconImages.set(resource, image);
  });
}

export function getLoadedItemIconImage(resource) {
  const image = itemIconImages.get(resource);
  if (!image || image.complete !== true || image.naturalWidth <= 0) return null;
  return image;
}

export function renderItemIcon(resource, className = 'item-pixel-icon') {
  const fallback = RESOURCE_ICONS[resource] || '?';
  const iconPath = getItemIconPath(resource);
  const image = iconPath
    ? `<img class="item-icon-image" src="${iconPath}" alt="" decoding="async" loading="eager" draggable="false" onload="this.parentElement.classList.add('has-image')" onerror="this.remove()" />`
    : '';
  return `<span class="${className} item-icon-${getItemIconKind(resource)}" aria-hidden="true">${image}<span class="item-icon-fallback-text">${fallback}</span></span>`;
}

export function drawItemIcon(context, resource, x, y, size = 16) {
  const image = getLoadedItemIconImage(resource);
  if (image && typeof context.drawImage === 'function') {
    const left = Math.round(x - size / 2);
    const top = Math.round(y - size / 2);
    context.save();
    context.imageSmoothingEnabled = false;
    context.drawImage(image, left, top, size, size);
    context.restore();
    return true;
  }

  const unit = Math.max(1, Math.floor(size / 8));
  const left = Math.round(x - size / 2);
  const top = Math.round(y - size / 2);
  const rect = (px, py, w, h, color) => {
    context.fillStyle = color;
    context.fillRect(left + px * unit, top + py * unit, w * unit, h * unit);
  };

  const kind = getItemIconKind(resource);
  context.save();
  context.imageSmoothingEnabled = false;

  if (kind === 'soil') {
    rect(1, 2, 6, 5, '#6b4327');
    rect(1, 2, 6, 1, '#82b55a');
    rect(2, 5, 2, 1, '#3b2417');
  } else if (kind === 'stone' || kind === 'stone-ball') {
    rect(2, 2, 4, 4, '#73777d');
    rect(3, 1, 3, 1, '#aab0b5');
    rect(1, 3, 1, 2, '#4f5358');
  } else if (kind === 'clay' || kind === 'brick') {
    rect(1, 3, 6, 3, '#8b6f63');
    rect(2, 2, 4, 1, '#b08e7e');
    if (kind === 'brick') rect(1, 4, 6, 1, '#5f463e');
  } else if (kind === 'wood') {
    rect(1, 3, 6, 3, '#9a6234');
    rect(2, 2, 4, 1, '#d09450');
    rect(2, 4, 4, 1, '#5b331c');
  } else if (kind === 'fiber' || kind === 'lasso') {
    rect(2, 2, 1, 4, '#8fbf45');
    rect(4, 1, 1, 5, '#6fa33a');
    rect(5, 3, 1, 3, '#bddf68');
  } else if (kind.includes('seed')) {
    rect(3, 4, 2, 2, '#c99a42');
    rect(4, 2, 2, 2, '#5aa044');
  } else if (kind === 'drop' || kind === 'water-trough') {
    rect(3, 1, 2, 2, '#b9f7ff');
    rect(2, 3, 4, 3, '#3fa7d9');
    rect(3, 6, 2, 1, '#1f6f9c');
  } else if (kind === 'berry') {
    rect(2, 3, 2, 2, '#c93757');
    rect(4, 4, 2, 2, '#9f2445');
    rect(4, 2, 2, 1, '#70aa3a');
  } else if (kind === 'egg' || kind === 'fried-egg') {
    rect(3, 1, 2, 1, '#fff3cd');
    rect(2, 2, 4, 4, '#f1dfad');
    rect(3, 6, 2, 1, '#caa867');
    if (kind === 'fried-egg') rect(3, 3, 2, 2, '#ffc44d');
  } else if (kind === 'meat') {
    rect(2, 3, 4, 3, '#b94a42');
    rect(3, 2, 2, 1, '#f0b08a');
  } else if (kind === 'torch' || kind === 'fire') {
    rect(4, 4, 1, 3, '#6a3b20');
    rect(3, 1, 2, 4, '#f05a28');
    rect(4, 0, 1, 3, '#ffd966');
  } else if (kind === 'pickaxe' || kind === 'axe' || kind === 'scythe') {
    rect(4, 1, 1, 6, '#8a5a35');
    rect(2, 1, 4, 1, '#c9d0d6');
    rect(2, 2, 1, 1, '#8d969e');
  } else if (kind === 'spear' || kind === 'arrow') {
    rect(1, 4, 5, 1, '#8a5a35');
    rect(6, 3, 1, 3, '#d8dde0');
  } else if (kind === 'bow') {
    rect(3, 1, 1, 6, '#9a6234');
    rect(5, 2, 1, 4, '#e6d4a8');
  } else if (kind === 'slingshot') {
    rect(3, 3, 1, 4, '#8a5a35');
    rect(2, 1, 1, 3, '#8a5a35');
    rect(5, 1, 1, 3, '#8a5a35');
  } else {
    rect(1, 1, 6, 6, '#7b4b2b');
    rect(2, 2, 4, 4, '#d3a35e');
  }

  context.restore();
  return false;
}

preloadItemIcons();
