import { TILE_SIZE, TILE_TYPES, VOID_FALL_MARGIN } from '../config/constants.js';

const keyOf = (x, y) => `${x},${y}`;

export class TileMap {
  constructor() {
    this.tiles = new Map();
    this.crystal = { x: 0, y: 0 };
    this.createStartIsland();
  }

  createStartIsland() {
    for (let y = -1; y <= 1; y += 1) {
      for (let x = -1; x <= 1; x += 1) {
        this.setEarth(x, y);
      }
    }
    this.tiles.set(keyOf(0, 0), TILE_TYPES.crystal);
  }

  getTile(x, y) {
    return this.tiles.get(keyOf(x, y)) || null;
  }

  setEarth(x, y) {
    this.tiles.set(keyOf(x, y), TILE_TYPES.earth);
  }

  isGround(x, y) {
    const tile = this.getTile(x, y);
    return tile === TILE_TYPES.earth || tile === TILE_TYPES.crystal;
  }

  isCrystal(x, y) {
    return this.getTile(x, y) === TILE_TYPES.crystal;
  }

  isVoid(x, y) {
    return !this.getTile(x, y);
  }

  isVoidAtWorld(x, y) {
    const tile = this.worldToTile(x, y);
    return this.isVoid(tile.x, tile.y);
  }

  isPastVoidFallMarginWorld(x, y) {
    const bounds = this.getIslandBoundsWorld();

    return (
      x < bounds.left - VOID_FALL_MARGIN ||
      x > bounds.right + VOID_FALL_MARGIN ||
      y < bounds.top - VOID_FALL_MARGIN ||
      y > bounds.bottom + VOID_FALL_MARGIN
    );
  }

  isAdjacentToCrystal(tilePosition) {
    const distance = Math.abs(tilePosition.x - this.crystal.x) + Math.abs(tilePosition.y - this.crystal.y);
    return distance <= 1;
  }

  isNearCrystalWorld(x, y, maxDistance) {
    const center = this.getCrystalCenter();
    const distance = Math.hypot(x - center.x, y - center.y);
    return distance <= maxDistance;
  }

  isCrystalAtWorld(x, y) {
    const tile = this.worldToTile(x, y);
    return this.isCrystal(tile.x, tile.y);
  }

  getCrystalCenter() {
    return {
      x: this.crystal.x * TILE_SIZE + TILE_SIZE / 2,
      y: this.crystal.y * TILE_SIZE + TILE_SIZE / 2
    };
  }

  getIslandBoundsWorld() {
    const tiles = [];
    this.forEachTile((tile) => tiles.push(tile));

    const xs = tiles.map((tile) => tile.x);
    const ys = tiles.map((tile) => tile.y);

    return {
      left: Math.min(...xs) * TILE_SIZE,
      right: (Math.max(...xs) + 1) * TILE_SIZE,
      top: Math.min(...ys) * TILE_SIZE,
      bottom: (Math.max(...ys) + 1) * TILE_SIZE
    };
  }

  worldToTile(x, y) {
    return {
      x: Math.floor(x / TILE_SIZE),
      y: Math.floor(y / TILE_SIZE)
    };
  }

  tileToWorld(x, y) {
    return {
      x: x * TILE_SIZE,
      y: y * TILE_SIZE
    };
  }

  forEachTile(callback) {
    for (const [key, type] of this.tiles.entries()) {
      const [x, y] = key.split(',').map(Number);
      callback({ x, y, type });
    }
  }
}
