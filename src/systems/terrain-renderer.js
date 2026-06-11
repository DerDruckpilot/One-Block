import { TILE_SIZE, TILE_TYPES } from '../config/constants.js';

const edgeMap = {
  earth: { top: '#a46f3b', mid: '#7a4f2d', side: '#52331f', dark: '#332015', light: '#c28b4d' },
  grass: { top: '#68ad4c', mid: '#4f8f3f', side: '#385a2e', dark: '#253d20', light: '#9bd66e' },
  stone: { top: '#9ca2a4', mid: '#747b7f', side: '#4d5358', dark: '#31363b', light: '#c4c9ca' },
  clay: { top: '#8d7568', mid: '#6b5c55', side: '#4a3f3a', dark: '#2f2825', light: '#b39a88' },
  moistEarth: { top: '#6f5943', mid: '#554536', side: '#3d3028', dark: '#261f1a', light: '#8ca0a5' },
  water: { top: '#4eb3d8', mid: '#277aa8', side: '#1d4d70', dark: '#12314e', light: '#a4ecff' }
};

const hexToRgb = (hex) => {
  const value = hex.replace('#', '');
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16)
  };
};

const rgbToHex = ({ r, g, b }) => `#${
  [r, g, b]
    .map((channel) => Math.max(0, Math.min(255, Math.round(channel))).toString(16).padStart(2, '0'))
    .join('')
}`;

const blendHex = (first, second, ratio = 0.5) => {
  const a = hexToRgb(first);
  const b = hexToRgb(second);
  return rgbToHex({
    r: a.r * (1 - ratio) + b.r * ratio,
    g: a.g * (1 - ratio) + b.g * ratio,
    b: a.b * (1 - ratio) + b.b * ratio
  });
};

const GROUND_TILE_BASE_PATH = 'assets/generated/tiles/ground_96';
const WATER_TILE_BASE_PATH = 'assets/generated/tiles/water_96';
const MOIST_EARTH_TILE_BASE_PATH = 'assets/generated/tiles/moist_earth_96';
const GROUND_TILE_SOURCE_SIZE = 96;
const GROUND_TILE_SHEET_COLUMNS = 4;
const GROUND_TILE_ANIMATION_FRAME_COUNT = 4;

export const GROUND_TILE_ASSET_PATHS = {
  [TILE_TYPES.earth]: `${GROUND_TILE_BASE_PATH}/earth_tileset_96.png`,
  [TILE_TYPES.grass]: `${GROUND_TILE_BASE_PATH}/grass_tileset_96.png`,
  [TILE_TYPES.stone]: `${GROUND_TILE_BASE_PATH}/stone_tileset_96.png`,
  [TILE_TYPES.clay]: `${GROUND_TILE_BASE_PATH}/clay_tileset_96.png`,
  [TILE_TYPES.moistEarth]: `${MOIST_EARTH_TILE_BASE_PATH}/moist_earth_tileset_96.png`,
  [TILE_TYPES.water]: `${WATER_TILE_BASE_PATH}/water_tileset_96.png`
};

export const GROUND_TILE_ANIMATION_PATHS = {
  [TILE_TYPES.water]: `${WATER_TILE_BASE_PATH}/water_animation_96.png`
};

const GROUND_TILE_SPRITE_ORDER = [
  'full_01',
  'full_02',
  'full_03',
  'full_04',
  'edge_top',
  'edge_bottom',
  'edge_left',
  'edge_right',
  'outer_corner_tl',
  'outer_corner_tr',
  'outer_corner_bl',
  'outer_corner_br',
  'inner_corner_tl',
  'inner_corner_tr',
  'inner_corner_bl',
  'inner_corner_br'
];

const GROUND_TILE_SOURCE_RECTS = GROUND_TILE_SPRITE_ORDER.reduce((rects, name, index) => {
  rects[name] = {
    x: (index % GROUND_TILE_SHEET_COLUMNS) * GROUND_TILE_SOURCE_SIZE,
    y: Math.floor(index / GROUND_TILE_SHEET_COLUMNS) * GROUND_TILE_SOURCE_SIZE,
    width: GROUND_TILE_SOURCE_SIZE,
    height: GROUND_TILE_SOURCE_SIZE
  };
  return rects;
}, {});

const TRANSITION_DIRECTIONS = ['right', 'left', 'bottom', 'top'];
const GROUND_TRANSITION_SHEETS = {
  ground: {
    path: `${GROUND_TILE_BASE_PATH}/ground_transitions_96.png`,
    pairs: [
      [TILE_TYPES.grass, TILE_TYPES.earth],
      [TILE_TYPES.earth, TILE_TYPES.stone],
      [TILE_TYPES.earth, TILE_TYPES.clay],
      [TILE_TYPES.grass, TILE_TYPES.stone]
    ]
  },
  water: {
    path: `${WATER_TILE_BASE_PATH}/water_transitions_96.png`,
    pairs: [
      [TILE_TYPES.water, TILE_TYPES.earth],
      [TILE_TYPES.water, TILE_TYPES.grass],
      [TILE_TYPES.water, TILE_TYPES.moistEarth],
      [TILE_TYPES.water, TILE_TYPES.stone],
      [TILE_TYPES.water, TILE_TYPES.clay]
    ]
  },
  moistEarth: {
    path: `${MOIST_EARTH_TILE_BASE_PATH}/moist_earth_transitions_96.png`,
    pairs: [
      [TILE_TYPES.moistEarth, TILE_TYPES.earth],
      [TILE_TYPES.moistEarth, TILE_TYPES.water]
    ]
  }
};

const groundTileImages = new Map();
const groundTileAnimationImages = new Map();
const groundTileTransitionImages = new Map();

export function getGroundTileAssetPath(type) {
  return GROUND_TILE_ASSET_PATHS[type] || null;
}

export function preloadGroundTileAssets() {
  if (typeof Image === 'undefined') return;

  Object.entries(GROUND_TILE_ASSET_PATHS).forEach(([type, path]) => {
    if (groundTileImages.has(type)) return;
    const image = new Image();
    image.decoding = 'async';
    image.src = path;
    groundTileImages.set(type, image);
  });

  Object.entries(GROUND_TILE_ANIMATION_PATHS).forEach(([type, path]) => {
    if (groundTileAnimationImages.has(type)) return;
    const image = new Image();
    image.decoding = 'async';
    image.src = path;
    groundTileAnimationImages.set(type, image);
  });

  Object.entries(GROUND_TRANSITION_SHEETS).forEach(([key, sheet]) => {
    if (groundTileTransitionImages.has(key)) return;
    const image = new Image();
    image.decoding = 'async';
    image.src = sheet.path;
    groundTileTransitionImages.set(key, image);
  });
}

export function getLoadedGroundTileImage(type) {
  const image = groundTileImages.get(type);
  if (!image || image.complete !== true || image.naturalWidth <= 0) return null;
  return image;
}

function getLoadedGroundTileAnimationImage(type) {
  const image = groundTileAnimationImages.get(type);
  if (!image || image.complete !== true || image.naturalWidth <= 0) return null;
  return image;
}

function getLoadedGroundTileTransitionImage(key) {
  const image = groundTileTransitionImages.get(key);
  if (!image || image.complete !== true || image.naturalWidth <= 0) return null;
  return image;
}

export class TerrainRenderer {
  constructor() {
    preloadGroundTileAssets();
  }

  drawTile(context, tile, tileMap, screenX, screenY) {
    if (tile.type === TILE_TYPES.crystal) {
      this.drawBaseTile(context, { ...tile, type: TILE_TYPES.earth }, tileMap, screenX, screenY);
      return;
    }

    this.drawBaseTile(context, tile, tileMap, screenX, screenY);
  }

  drawBaseTile(context, tile, tileMap, x, y) {
    if (this.drawGroundTileAsset(context, tile, tileMap, x, y)) return;

    const palette = edgeMap[tile.type] || edgeMap.earth;
    const same = this.getSameNeighborMask(tile, tileMap);
    const edges = this.getEdgeProfile(tile, tileMap);
    const surface = this.getSurfaceBounds(same, edges);

    context.save();
    context.fillStyle = palette.mid;
    context.fillRect(
      x + surface.mid.left,
      y + surface.mid.top,
      surface.mid.width,
      surface.mid.height
    );
    context.fillStyle = palette.top;
    context.fillRect(
      x + surface.top.left,
      y + surface.top.top,
      surface.top.width,
      surface.top.height
    );
    context.fillStyle = palette.light;
    if (!edges.hasUp) {
      context.fillRect(x + 4, y + 4, TILE_SIZE - 8, 3);
    } else if (!same.up) {
      context.fillStyle = palette.top;
      context.fillRect(x + 2, y + 3, TILE_SIZE - 4, 3);
    }
    context.fillStyle = palette.dark;
    if (!edges.hasLeft) context.fillRect(x, y + 2, 2, 26);
    if (!edges.hasRight) context.fillRect(x + TILE_SIZE - 2, y + 2, 2, 26);
    if (edges.hasLeft && !same.left) {
      context.fillStyle = palette.mid;
      context.fillRect(x - 1, y + 3, 3, 23);
    }
    if (edges.hasRight && !same.right) {
      context.fillStyle = palette.mid;
      context.fillRect(x + TILE_SIZE - 2, y + 3, 3, 23);
    }
    if (edges.hasUp && !same.up) {
      context.fillStyle = palette.top;
      context.fillRect(x + 2, y, TILE_SIZE - 4, 3);
    }

    if (edges.bottomOuter) {
      const leftInset = edges.bottomContinuesLeft ? 0 : 3;
      const rightInset = edges.bottomContinuesRight ? 0 : 3;
      context.fillStyle = palette.dark;
      context.fillRect(x + leftInset, y + 27, TILE_SIZE - leftInset - rightInset, 7);
      context.fillStyle = palette.side;
      context.fillRect(x + leftInset, y + 25, TILE_SIZE - leftInset - rightInset, 5);
      context.fillStyle = 'rgba(0, 0, 0, 0.18)';
      context.fillRect(x + leftInset, y + 34, TILE_SIZE - leftInset - rightInset, 3);
    } else if (!same.down && edges.hasDown) {
      context.fillStyle = palette.mid;
      context.fillRect(x + 1, y + 23, TILE_SIZE - 2, 2);
    }

    this.drawTransitionDetails(context, tile, tileMap, palette, x, y, edges, same);

    this.drawTileDetails(context, tile, palette, x, y, this.detailVariant(tile));
    this.drawWateredOverlay(context, tile, tileMap, x, y);
    context.restore();
  }

  getGroundTileAssetPath(type) {
    return getGroundTileAssetPath(type);
  }

  getGroundTileSourceRect(spriteName) {
    const rect = GROUND_TILE_SOURCE_RECTS[spriteName] || GROUND_TILE_SOURCE_RECTS.full_01;
    return { ...rect };
  }

  getWaterAnimationSourceRect(tile) {
    const time = globalThis.performance?.now?.() || Date.now();
    const frame = (Math.floor(time / 520) + this.detailVariant(tile)) % GROUND_TILE_ANIMATION_FRAME_COUNT;
    return {
      x: frame * GROUND_TILE_SOURCE_SIZE,
      y: 0,
      width: GROUND_TILE_SOURCE_SIZE,
      height: GROUND_TILE_SOURCE_SIZE
    };
  }

  selectGroundTileSprite(tile, tileMap) {
    const same = this.getSameNeighborMask(tile, tileMap);
    const edges = this.getEdgeProfile(tile, tileMap);

    if (edges.topOuter && edges.leftOuter) return 'outer_corner_tl';
    if (edges.topOuter && edges.rightOuter) return 'outer_corner_tr';
    if (edges.bottomOuter && edges.leftOuter) return 'outer_corner_bl';
    if (edges.bottomOuter && edges.rightOuter) return 'outer_corner_br';
    if (edges.topOuter) return 'edge_top';
    if (edges.bottomOuter) return 'edge_bottom';
    if (edges.leftOuter) return 'edge_left';
    if (edges.rightOuter) return 'edge_right';

    const diagonalMatches = (offsetX, offsetY) =>
      tileMap.getTile(tile.x + offsetX, tile.y + offsetY) === tile.type;

    if (same.up && same.left && !diagonalMatches(-1, -1)) return 'inner_corner_tl';
    if (same.up && same.right && !diagonalMatches(1, -1)) return 'inner_corner_tr';
    if (same.down && same.left && !diagonalMatches(-1, 1)) return 'inner_corner_bl';
    if (same.down && same.right && !diagonalMatches(1, 1)) return 'inner_corner_br';

    return `full_0${(this.detailVariant(tile) % 4) + 1}`;
  }

  drawGroundTileAsset(context, tile, tileMap, x, y) {
    const image = getLoadedGroundTileImage(tile.type);
    if (!image || typeof context.drawImage !== 'function') return false;

    const spriteName = this.selectGroundTileSprite(tile, tileMap);
    const animationImage = spriteName.startsWith('full_')
      ? getLoadedGroundTileAnimationImage(tile.type)
      : null;
    const source = animationImage
      ? this.getWaterAnimationSourceRect(tile)
      : this.getGroundTileSourceRect(spriteName);

    context.save();
    context.imageSmoothingEnabled = false;
    context.drawImage(
      animationImage || image,
      source.x,
      source.y,
      source.width,
      source.height,
      x,
      y,
      TILE_SIZE,
      TILE_SIZE
    );
    this.drawGroundTransitionAsset(context, tile, tileMap, x, y);
    this.drawWateredOverlay(context, tile, tileMap, x, y);
    context.restore();
    return true;
  }

  drawGroundTransitionAsset(context, tile, tileMap, x, y) {
    const transition = this.selectGroundTransition(tile, tileMap);
    if (!transition) return false;

    const image = getLoadedGroundTileTransitionImage(transition.sheetKey);
    if (!image || typeof context.drawImage !== 'function') return false;

    const directionIndex = TRANSITION_DIRECTIONS.indexOf(transition.direction);
    if (directionIndex < 0) return false;

    context.drawImage(
      image,
      directionIndex * GROUND_TILE_SOURCE_SIZE,
      transition.row * GROUND_TILE_SOURCE_SIZE,
      GROUND_TILE_SOURCE_SIZE,
      GROUND_TILE_SOURCE_SIZE,
      x,
      y,
      TILE_SIZE,
      TILE_SIZE
    );
    return true;
  }

  selectGroundTransition(tile, tileMap) {
    const directions = [
      { name: 'right', opposite: 'left', x: 1, y: 0 },
      { name: 'left', opposite: 'right', x: -1, y: 0 },
      { name: 'bottom', opposite: 'top', x: 0, y: 1 },
      { name: 'top', opposite: 'bottom', x: 0, y: -1 }
    ];

    for (const direction of directions) {
      const neighborType = tileMap.getTile(tile.x + direction.x, tile.y + direction.y);
      if (!neighborType || neighborType === tile.type || neighborType === TILE_TYPES.crystal) continue;
      if (!this.shouldRenderTransitionForBoundary(tile, tileMap, direction.x, direction.y)) continue;
      const transition = this.resolveTransition(tile.type, neighborType, direction.name, direction.opposite);
      if (transition) return transition;
    }

    return null;
  }

  shouldRenderTransitionForBoundary(tile, tileMap, offsetX, offsetY) {
    const neighborX = tile.x + offsetX;
    const neighborY = tile.y + offsetY;
    const currentOrder = tileMap.getTileRenderOrder?.(tile.x, tile.y);
    const neighborOrder = tileMap.getTileRenderOrder?.(neighborX, neighborY);

    if (Number.isFinite(currentOrder) && Number.isFinite(neighborOrder) && currentOrder !== neighborOrder) {
      return currentOrder > neighborOrder;
    }

    if (tile.x !== neighborX) return tile.x > neighborX;
    return tile.y > neighborY;
  }

  resolveTransition(currentType, neighborType, direction, oppositeDirection) {
    const sheetOrder = currentType === TILE_TYPES.water || neighborType === TILE_TYPES.water
      ? ['water', 'moistEarth', 'ground']
      : currentType === TILE_TYPES.moistEarth || neighborType === TILE_TYPES.moistEarth
        ? ['moistEarth', 'ground']
        : ['ground'];

    for (const sheetKey of sheetOrder) {
      const sheet = GROUND_TRANSITION_SHEETS[sheetKey];
      if (!sheet) continue;
      const row = sheet.pairs.findIndex(([first, second]) =>
        (first === currentType && second === neighborType) ||
        (first === neighborType && second === currentType)
      );
      if (row < 0) continue;
      const [first, second] = sheet.pairs[row];
      return {
        sheetKey,
        row,
        direction: first === currentType && second === neighborType ? direction : oppositeDirection
      };
    }

    return null;
  }

  drawWateredOverlay(context, tile, tileMap, x, y) {
    if (tile.type === TILE_TYPES.water || !tileMap.isWatered?.(tile.x, tile.y)) return;

    context.globalAlpha = 0.22;
    context.fillStyle = '#5eb7d7';
    context.fillRect(x + 3, y + 6, TILE_SIZE - 6, 14);
    context.globalAlpha = 1;
  }

  getSameNeighborMask(tile, tileMap) {
    return {
      up: tileMap.getTile(tile.x, tile.y - 1) === tile.type,
      down: tileMap.getTile(tile.x, tile.y + 1) === tile.type,
      left: tileMap.getTile(tile.x - 1, tile.y) === tile.type,
      right: tileMap.getTile(tile.x + 1, tile.y) === tile.type
    };
  }

  getEdgeProfile(tile, tileMap) {
    const hasUp = Boolean(tileMap.getTile(tile.x, tile.y - 1));
    const hasDown = Boolean(tileMap.getTile(tile.x, tile.y + 1));
    const hasLeft = Boolean(tileMap.getTile(tile.x - 1, tile.y));
    const hasRight = Boolean(tileMap.getTile(tile.x + 1, tile.y));
    const bottomOuter = !hasDown;

    return {
      hasUp,
      hasDown,
      hasLeft,
      hasRight,
      topOuter: !hasUp,
      bottomOuter,
      leftOuter: !hasLeft,
      rightOuter: !hasRight,
      bottomContinuesLeft: bottomOuter && Boolean(tileMap.getTile(tile.x - 1, tile.y)) && !tileMap.getTile(tile.x - 1, tile.y + 1),
      bottomContinuesRight: bottomOuter && Boolean(tileMap.getTile(tile.x + 1, tile.y)) && !tileMap.getTile(tile.x + 1, tile.y + 1)
    };
  }

  getSurfaceBounds(same, edges) {
    const left = same.left ? -2 : edges.hasLeft ? -1 : 2;
    const right = same.right ? -2 : edges.hasRight ? -1 : 2;
    const top = same.up ? -2 : edges.hasUp ? -1 : 2;
    const midBottom = same.down ? 10 : edges.hasDown ? 5 : 0;
    const topBottom = same.down ? 9 : edges.hasDown ? 4 : 0;

    return {
      mid: {
        left,
        top,
        width: TILE_SIZE - left - right,
        height: 25 + midBottom - top
      },
      top: {
        left,
        top,
        width: TILE_SIZE - left - right,
        height: 22 + topBottom - top
      }
    };
  }

  detailVariant(tile) {
    const value = Math.abs((tile.x * 7349 + tile.y * 9151 + String(tile.type).length * 101) % 5);
    return value;
  }

  getRenderProfile(tile, tileMap) {
    const palette = edgeMap[tile.type] || edgeMap.earth;
    const same = this.getSameNeighborMask(tile, tileMap);
    const edges = this.getEdgeProfile(tile, tileMap);
    const surface = this.getSurfaceBounds(same, edges);
    const sameCount = Object.values(same).filter(Boolean).length;
    return {
      same,
      edges,
      surface,
      variant: this.detailVariant(tile),
      interior: sameCount === 4,
      outerEdge: edges.topOuter || edges.bottomOuter || edges.leftOuter || edges.rightOuter,
      transitionEdge: (edges.hasUp && !same.up) ||
        (edges.hasDown && !same.down) ||
        (edges.hasLeft && !same.left) ||
        (edges.hasRight && !same.right),
      waterTransition: tile.type === TILE_TYPES.water && (
        (edges.hasUp && !same.up) ||
        (edges.hasDown && !same.down) ||
        (edges.hasLeft && !same.left) ||
        (edges.hasRight && !same.right)
      ),
      horizontalTransitionSealed: (edges.hasLeft && !same.left) || (edges.hasRight && !same.right),
      horizontalTransitionFill: palette.mid,
      verticalTransitionSealed: (edges.hasUp && !same.up) || (edges.hasDown && !same.down),
      transitionBlendFill: this.getTransitionBlendFill(tile, tileMap),
      internalSeamsSuppressed: (same.left || same.right || same.up || same.down) && !edges.bottomOuter,
      connectedSurfaceHorizontal: same.left || same.right,
      connectedSurfaceVertical: same.up || same.down,
      seamlessHorizontal: same.left || same.right ? surface.top.left < 0 || surface.top.width > TILE_SIZE : false,
      seamlessVertical: same.up || same.down ? surface.top.top < 0 || surface.top.height > 24 : false,
      connectedBottomEdge: edges.bottomOuter && (edges.bottomContinuesLeft || edges.bottomContinuesRight)
    };
  }

  getTransitionBlendFill(tile, tileMap, direction = 'right') {
    const offsets = {
      up: { x: 0, y: -1, tone: 'top' },
      down: { x: 0, y: 1, tone: 'mid' },
      left: { x: -1, y: 0, tone: 'mid' },
      right: { x: 1, y: 0, tone: 'mid' }
    };
    const offset = offsets[direction] || offsets.right;
    const currentPalette = edgeMap[tile.type] || edgeMap.earth;
    const neighborType = tileMap.getTile(tile.x + offset.x, tile.y + offset.y);
    const neighborPalette = edgeMap[neighborType] || currentPalette;
    return blendHex(currentPalette[offset.tone], neighborPalette[offset.tone], 0.48);
  }

  drawTransitionDetails(context, tile, tileMap, palette, x, y, edges, same) {
    const transition = {
      up: edges.hasUp && !same.up,
      down: edges.hasDown && !same.down,
      left: edges.hasLeft && !same.left,
      right: edges.hasRight && !same.right
    };
    if (!transition.up && !transition.down && !transition.left && !transition.right) return;

    if (tile.type === TILE_TYPES.water) {
      if (transition.up) {
        context.fillStyle = this.getTransitionBlendFill(tile, tileMap, 'up');
        context.fillRect(x + 2, y, TILE_SIZE - 4, 4);
      }
      if (transition.down) {
        context.fillStyle = this.getTransitionBlendFill(tile, tileMap, 'down');
        context.fillRect(x + 3, y + 21, TILE_SIZE - 6, 4);
      }
      if (transition.left) {
        context.fillStyle = this.getTransitionBlendFill(tile, tileMap, 'left');
        context.fillRect(x - 1, y + 4, 4, 19);
      }
      if (transition.right) {
        context.fillStyle = this.getTransitionBlendFill(tile, tileMap, 'right');
        context.fillRect(x + TILE_SIZE - 3, y + 4, 4, 19);
      }
      return;
    }

    if (transition.up) {
      context.fillStyle = this.getTransitionBlendFill(tile, tileMap, 'up');
      context.fillRect(x + 2, y, TILE_SIZE - 4, 4);
    }
    if (transition.left) {
      context.fillStyle = this.getTransitionBlendFill(tile, tileMap, 'left');
      context.fillRect(x - 1, y + 3, 4, 23);
    }
    if (transition.right) {
      context.fillStyle = this.getTransitionBlendFill(tile, tileMap, 'right');
      context.fillRect(x + TILE_SIZE - 3, y + 3, 4, 23);
    }
    if (transition.down) {
      context.fillStyle = this.getTransitionBlendFill(tile, tileMap, 'down');
      context.fillRect(x + 2, y + 21, TILE_SIZE - 4, 4);
    }
  }

  drawTileDetails(context, tile, palette, x, y, variant = 0) {
    if (tile.type === TILE_TYPES.grass) {
      this.drawGrassDetails(context, x, y, variant);
      return;
    }

    if (tile.type === TILE_TYPES.stone) {
      this.drawStoneDetails(context, x, y, variant);
      return;
    }

    if (tile.type === TILE_TYPES.clay || tile.type === TILE_TYPES.moistEarth || tile.type === TILE_TYPES.water) {
      this.drawWetDetails(context, tile, x, y);
      return;
    }

    context.fillStyle = palette.dark;
    context.fillRect(x + 5 + (variant % 3), y + 17, 5, 2);
    if (variant !== 1) context.fillRect(x + 21, y + 10 + (variant % 2), 5, 2);
    context.fillStyle = '#91613a';
    context.fillRect(x + 13 + variant, y + 7, 4, 2);
    if (variant >= 2) context.fillRect(x + 24, y + 18, 3, 2);
  }

  drawGrassDetails(context, x, y, variant = 0) {
    context.fillStyle = '#2f6f35';
    context.fillRect(x + 4 + (variant % 2), y + 17, 6, 3);
    if (variant !== 2) context.fillRect(x + 20, y + 10 + (variant % 2), 5, 3);
    context.fillStyle = '#83c85e';
    context.fillRect(x + 9, y + 7, 3, 2);
    if (variant >= 1) context.fillRect(x + 24, y + 17, 2, 3);
    context.fillStyle = '#f6e68a';
    if (variant === 0 || variant === 3) {
      context.fillRect(x + 15, y + 14, 2, 2);
      context.fillRect(x + 17, y + 12, 2, 2);
    }
    context.fillStyle = '#ffffff';
    if (variant === 4) context.fillRect(x + 6, y + 8, 2, 2);
  }

  drawStoneDetails(context, x, y, variant = 0) {
    context.fillStyle = '#c4c9ca';
    context.fillRect(x + 5 + (variant % 3), y + 6, 8, 4);
    context.fillRect(x + 18, y + 15, 8, 3);
    context.fillStyle = '#596065';
    context.fillRect(x + 6, y + 19, 7, 3);
    context.fillRect(x + 21, y + 8, 6, 3);
    context.fillStyle = '#848b8f';
    context.fillRect(x + 13, y + 12, 5, 3);
  }

  drawWetDetails(context, tile, x, y) {
    if (tile.type === TILE_TYPES.water) {
      context.fillStyle = '#b9f7ff';
      context.fillRect(x + 5, y + 7, 9, 2);
      context.fillRect(x + 17, y + 15, 8, 2);
      context.fillStyle = '#1a5f91';
      context.fillRect(x + 7, y + 19, 6, 2);
      return;
    }

    context.fillStyle = '#3f332d';
    context.fillRect(x + 5, y + 17, 6, 3);
    context.fillRect(x + 21, y + 10, 5, 3);
    context.fillStyle = '#8ca0a5';
    context.fillRect(x + 12, y + 8, 5, 2);
    context.fillRect(x + 23, y + 18, 4, 2);
  }
}
