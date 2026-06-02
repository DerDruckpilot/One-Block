import { OBJECT_TYPES, TILE_SIZE, TILE_TYPES } from '../config/constants.js';

const keyOf = (x, y) => `${x},${y}`;

export class TileMap {
  constructor() {
    this.tiles = new Map();
    this.objects = new Map();
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

  setGrass(x, y) {
    this.tiles.set(keyOf(x, y), TILE_TYPES.grass);
  }

  getObject(x, y) {
    return this.objects.get(keyOf(x, y)) || null;
  }

  setObject(x, y, type) {
    this.objects.set(keyOf(x, y), type);
  }

  setWorkbench(x, y) {
    this.setObject(x, y, OBJECT_TYPES.workbench);
  }

  canPlaceWorkbench(x, y, playerTile = null) {
    if (!this.isGround(x, y)) return false;
    if (this.isCrystal(x, y)) return false;
    if (this.getObject(x, y)) return false;
    if (playerTile && playerTile.x === x && playerTile.y === y) return false;
    return true;
  }

  loadTiles(tiles) {
    this.tiles.clear();
    for (const tile of tiles) {
      if ([TILE_TYPES.earth, TILE_TYPES.grass, TILE_TYPES.crystal].includes(tile.type)) {
        this.tiles.set(keyOf(tile.x, tile.y), tile.type);
      }
    }
    this.tiles.set(keyOf(this.crystal.x, this.crystal.y), TILE_TYPES.crystal);
  }

  loadObjects(objects = []) {
    this.objects.clear();
    for (const object of objects) {
      if (object.type === OBJECT_TYPES.workbench) {
        this.objects.set(keyOf(object.x, object.y), object.type);
      }
    }
  }

  toJSON() {
    const tiles = [];
    this.forEachTile((tile) => tiles.push(tile));
    return tiles;
  }

  objectsToJSON() {
    const objects = [];
    this.forEachObject((object) => objects.push(object));
    return objects;
  }

  canPlaceEarth(x, y, blockedTile = null) {
    if (this.getTile(x, y)) return false;
    if (blockedTile && blockedTile.x === x && blockedTile.y === y) return false;
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

  isGround(x, y) {
    const tile = this.getTile(x, y);
    return tile === TILE_TYPES.earth || tile === TILE_TYPES.grass || tile === TILE_TYPES.crystal;
  }

  isPlantableEarth(x, y) {
    return this.getTile(x, y) === TILE_TYPES.earth;
  }

  isGrass(x, y) {
    return this.getTile(x, y) === TILE_TYPES.grass;
  }

  isCrystal(x, y) {
    return this.getTile(x, y) === TILE_TYPES.crystal;
  }

  isVoid(x, y) {
    return !this.getTile(x, y);
  }

  isVoidAtWorld(x, y) {
    const tile = this.getTileAtWorldPosition(x, y);
    return this.isVoid(tile.x, tile.y);
  }

  isGroundAtWorld(x, y) {
    const tile = this.getTileAtWorldPosition(x, y);
    return this.isGround(tile.x, tile.y);
  }

  getTileAtWorldPosition(x, y) {
    return this.worldToTile(x, y);
  }

  getSupportStateAtWorld(x, y) {
    const tile = this.getTileAtWorldPosition(x, y);
    const type = this.getTile(tile.x, tile.y);

    return {
      tile,
      type,
      supported: this.isGround(tile.x, tile.y),
      inVoid: !this.isGround(tile.x, tile.y)
    };
  }

  isPositionSupportedByTile(x, y) {
    return this.getSupportStateAtWorld(x, y).supported;
  }

  isPlayerSupported(player) {
    const foot = player.getFootPosition();
    return this.isPositionSupportedByTile(foot.x, foot.y);
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

  isNearObjectWorld(x, y, type, maxDistance) {
    let isNear = false;

    this.forEachObject((object) => {
      if (object.type !== type) return;

      const center = {
        x: object.x * TILE_SIZE + TILE_SIZE / 2,
        y: object.y * TILE_SIZE + TILE_SIZE / 2
      };
      if (Math.hypot(x - center.x, y - center.y) <= maxDistance) {
        isNear = true;
      }
    });

    return isNear;
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

  forEachObject(callback) {
    for (const [key, type] of this.objects.entries()) {
      const [x, y] = key.split(',').map(Number);
      callback({ x, y, type });
    }
  }
}
