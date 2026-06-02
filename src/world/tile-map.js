import { TILE_SIZE, TILE_TYPES } from '../config/constants.js';

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

  isAdjacentToCrystal(tilePosition) {
    const distance = Math.abs(tilePosition.x - this.crystal.x) + Math.abs(tilePosition.y - this.crystal.y);
    return distance <= 1;
  }

  canPlaceEarth(x, y) {
    if (this.getTile(x, y)) return false;
    return this.hasNeighborGround(x, y);
  }

  hasNeighborGround(x, y) {
    const neighbors = [
      { x: x + 1, y },
      { x: x - 1, y },
      { x, y: y + 1 },
      { x, y: y - 1 }
    ];

    return neighbors.some((neighbor) => this.isGround(neighbor.x, neighbor.y));
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
