import {
  BARRIER_COLLISION_THICKNESS,
  CONNECTABLE_BARRIER_GROUPS,
  CONNECTABLE_BARRIER_TYPES,
  FLYING_ENTITY_BLOCKING_OBJECTS,
  GROUND_ENTITY_BLOCKING_OBJECTS,
  OBJECT_TYPES,
  PLAYER_BLOCKING_OBJECTS,
  TILE_SIZE,
  TILE_TYPES
} from '../config/constants.js';

const keyOf = (x, y) => `${x},${y}`;
const PLACEABLE_OBJECTS = new Set(Object.values(OBJECT_TYPES));
const CONNECTABLE_BARRIERS = new Set(CONNECTABLE_BARRIER_TYPES);
const OPENABLE_BARRIERS = new Set([OBJECT_TYPES.gate, OBJECT_TYPES.door]);
const HALF_TILE = TILE_SIZE / 2;

const CONNECTION_DIRECTIONS = [
  { name: 'up', x: 0, y: -1 },
  { name: 'down', x: 0, y: 1 },
  { name: 'left', x: -1, y: 0 },
  { name: 'right', x: 1, y: 0 }
];

export class TileMap {
  constructor() {
    this.tiles = new Map();
    this.tileRenderOrders = new Map();
    this.nextTileRenderOrder = 1;
    this.objects = new Map();
    this.objectStates = new Map();
    this.crystal = { x: 0, y: 0 };
    this.createStartIsland();
  }

  createStartIsland() {
    for (let y = -1; y <= 1; y += 1) {
      for (let x = -1; x <= 1; x += 1) {
        this.setEarth(x, y);
      }
    }
    this.setTile(0, 0, TILE_TYPES.crystal);
  }

  getTile(x, y) {
    return this.tiles.get(keyOf(x, y)) || null;
  }

  setTile(x, y, type, renderOrder = null) {
    const key = keyOf(x, y);
    this.tiles.set(key, type);
    const order = Number.isFinite(renderOrder) && renderOrder > 0
      ? renderOrder
      : this.nextTileRenderOrder;
    this.tileRenderOrders.set(key, order);
    this.nextTileRenderOrder = Math.max(this.nextTileRenderOrder, order + 1);
  }

  getTileRenderOrder(x, y) {
    return this.tileRenderOrders.get(keyOf(x, y)) || null;
  }

  setEarth(x, y) {
    this.setTile(x, y, TILE_TYPES.earth);
  }

  setGrass(x, y) {
    this.setTile(x, y, TILE_TYPES.grass);
  }

  setStone(x, y) {
    this.setTile(x, y, TILE_TYPES.stone);
  }

  setClay(x, y) {
    this.setTile(x, y, TILE_TYPES.clay);
  }

  setMoistEarth(x, y) {
    this.setTile(x, y, TILE_TYPES.moistEarth);
  }

  setWater(x, y) {
    this.setTile(x, y, TILE_TYPES.water);
  }

  getObject(x, y) {
    return this.objects.get(keyOf(x, y)) || null;
  }

  setObject(x, y, type) {
    this.objects.set(keyOf(x, y), type);
    if (OPENABLE_BARRIERS.has(type)) {
      this.objectStates.set(keyOf(x, y), { open: false });
    } else if (type === OBJECT_TYPES.chickenNest) {
      this.objectStates.set(keyOf(x, y), { eggTimer: 0 });
    } else if (type === OBJECT_TYPES.feedTrough) {
      this.objectStates.set(keyOf(x, y), { feed: 0 });
    } else if (type === OBJECT_TYPES.waterTrough) {
      this.objectStates.set(keyOf(x, y), { filled: false });
    } else if (![OBJECT_TYPES.sapling, OBJECT_TYPES.tree, OBJECT_TYPES.berryBush].includes(type)) {
      this.objectStates.delete(keyOf(x, y));
    }
  }

  setObjectState(x, y, state = {}) {
    const key = keyOf(x, y);
    if (!this.objects.has(key)) return false;
    this.objectStates.set(key, {
      ...(this.objectStates.get(key) || {}),
      ...state
    });
    return true;
  }

  removeObject(x, y) {
    this.objects.delete(keyOf(x, y));
    this.objectStates.delete(keyOf(x, y));
  }

  setWorkbench(x, y) {
    this.setObject(x, y, OBJECT_TYPES.workbench);
  }

  canPlaceObject(x, y, playerTile = null) {
    if (!this.isGround(x, y)) return false;
    if (this.isCrystal(x, y)) return false;
    if (this.getObject(x, y)) return false;
    if (playerTile && playerTile.x === x && playerTile.y === y) return false;
    return true;
  }

  canPlaceWorkbench(x, y, playerTile = null) {
    return this.canPlaceObject(x, y, playerTile);
  }

  loadTiles(tiles) {
    this.tiles.clear();
    this.tileRenderOrders.clear();
    this.nextTileRenderOrder = 1;
    for (const tile of tiles) {
      if ([
        TILE_TYPES.earth,
        TILE_TYPES.grass,
        TILE_TYPES.stone,
        TILE_TYPES.clay,
        TILE_TYPES.moistEarth,
        TILE_TYPES.water,
        TILE_TYPES.crystal
      ].includes(tile.type)) {
        this.setTile(tile.x, tile.y, tile.type, Number(tile.renderOrder));
      }
    }
    this.setTile(
      this.crystal.x,
      this.crystal.y,
      TILE_TYPES.crystal,
      this.getTileRenderOrder(this.crystal.x, this.crystal.y)
    );
  }

  loadObjects(objects = []) {
    this.objects.clear();
    this.objectStates.clear();
    for (const object of objects) {
      if (PLACEABLE_OBJECTS.has(object.type)) {
        this.objects.set(keyOf(object.x, object.y), object.type);
        if (OPENABLE_BARRIERS.has(object.type)) {
          this.objectStates.set(keyOf(object.x, object.y), { open: object.open === true });
        } else if (object.type === OBJECT_TYPES.chickenNest) {
          this.objectStates.set(keyOf(object.x, object.y), { eggTimer: Math.max(0, Number(object.eggTimer || 0)) });
        } else if (object.type === OBJECT_TYPES.feedTrough) {
          this.objectStates.set(keyOf(object.x, object.y), { feed: Math.max(0, Number(object.feed || 0)) });
        } else if (object.type === OBJECT_TYPES.waterTrough) {
          this.objectStates.set(keyOf(object.x, object.y), { filled: object.filled === true });
        }
      }
    }
  }

  toJSON() {
    const tiles = [];
    this.forEachTile((tile) => {
      tiles.push({
        ...tile,
        renderOrder: this.getTileRenderOrder(tile.x, tile.y)
      });
    });
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
    return tile === TILE_TYPES.earth ||
      tile === TILE_TYPES.grass ||
      tile === TILE_TYPES.stone ||
      tile === TILE_TYPES.clay ||
      tile === TILE_TYPES.moistEarth ||
      tile === TILE_TYPES.water ||
      tile === TILE_TYPES.crystal;
  }

  isPlantableEarth(x, y) {
    return this.getTile(x, y) === TILE_TYPES.earth;
  }

  isPlantableForTree(x, y) {
    const tile = this.getTile(x, y);
    return tile === TILE_TYPES.earth || tile === TILE_TYPES.grass || tile === TILE_TYPES.moistEarth;
  }

  isWatered(x, y) {
    const tile = this.getTile(x, y);
    if (tile === TILE_TYPES.moistEarth || tile === TILE_TYPES.water) return true;
    const neighbors = [
      { x: x + 1, y },
      { x: x - 1, y },
      { x, y: y + 1 },
      { x, y: y - 1 }
    ];
    return neighbors.some((neighbor) => this.getTile(neighbor.x, neighbor.y) === TILE_TYPES.water);
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

  isBlockingObjectAtWorld(x, y) {
    return this.isBlockedForPlayerAtWorld(x, y);
  }

  isBlockedForPlayer(x, y) {
    return this.isObjectBlocking(x, y, PLAYER_BLOCKING_OBJECTS);
  }

  isBlockedForGroundEntity(x, y) {
    return this.isObjectBlocking(x, y, GROUND_ENTITY_BLOCKING_OBJECTS);
  }

  isBlockedForFlyingEntity(x, y) {
    return this.isObjectBlocking(x, y, FLYING_ENTITY_BLOCKING_OBJECTS);
  }

  isBlockedForPlayerAtWorld(x, y) {
    return this.isObjectBlockingAtWorld(x, y, PLAYER_BLOCKING_OBJECTS);
  }

  isBlockedForGroundEntityAtWorld(x, y) {
    return this.isObjectBlockingAtWorld(x, y, GROUND_ENTITY_BLOCKING_OBJECTS);
  }

  isBlockedForFlyingEntityAtWorld(x, y) {
    return this.isObjectBlockingAtWorld(x, y, FLYING_ENTITY_BLOCKING_OBJECTS);
  }

  isObjectBlocking(x, y, blockingTypes) {
    const object = this.getObject(x, y);
    if (!object || !blockingTypes.includes(object)) return false;
    if (OPENABLE_BARRIERS.has(object) && this.isOpen(x, y)) return false;
    // Campfires stay walkable in this slice so mobile movement does not snag on tiny light props.
    return true;
  }

  isObjectBlockingAtWorld(worldX, worldY, blockingTypes) {
    const tile = this.worldToTile(worldX, worldY);
    const object = this.getObject(tile.x, tile.y);
    if (!object || !blockingTypes.includes(object)) return false;
    if (OPENABLE_BARRIERS.has(object) && this.isOpen(tile.x, tile.y)) return false;
    if (CONNECTABLE_BARRIERS.has(object)) {
      return this.isPointBlockedByBarrier(worldX, worldY, tile.x, tile.y);
    }
    return true;
  }

  isPointBlockedByBarrier(worldX, worldY, tileX, tileY) {
    const shape = this.getBarrierCollisionShape(tileX, tileY);
    const localX = worldX - tileX * TILE_SIZE;
    const localY = worldY - tileY * TILE_SIZE;
    const halfThickness = shape.thickness / 2;

    const onVertical = shape.vertical &&
      localX >= HALF_TILE - halfThickness &&
      localX <= HALF_TILE + halfThickness;
    const onHorizontal = shape.horizontal &&
      localY >= HALF_TILE - halfThickness &&
      localY <= HALF_TILE + halfThickness;
    const onPost = shape.post &&
      localX >= HALF_TILE - halfThickness &&
      localX <= HALF_TILE + halfThickness &&
      localY >= HALF_TILE - halfThickness &&
      localY <= HALF_TILE + halfThickness;

    return onVertical || onHorizontal || onPost;
  }

  getBarrierCollisionShape(x, y) {
    const connections = this.getConnectableConnections(x, y);
    const horizontal = connections.left || connections.right;
    const vertical = connections.up || connections.down;
    return {
      horizontal,
      vertical,
      post: !horizontal && !vertical,
      thickness: BARRIER_COLLISION_THICKNESS,
      variant: this.getConnectableVariant(x, y),
      connections
    };
  }

  getWallDoorRenderState(x, y) {
    const type = this.getObject(x, y);
    if (![OBJECT_TYPES.woodWall, OBJECT_TYPES.door].includes(type)) return null;
    const connections = this.getConnectableConnections(x, y);
    const horizontal = connections.left || connections.right;
    const vertical = connections.up || connections.down;

    return {
      type,
      x,
      y,
      open: type === OBJECT_TYPES.door ? this.isDoorOpen(x, y) : false,
      connections,
      horizontal,
      vertical,
      post: !horizontal && !vertical,
      thickness: BARRIER_COLLISION_THICKNESS,
      variant: this.getConnectableVariant(x, y)
    };
  }

  getConnectableConnections(x, y) {
    const type = this.getObject(x, y);
    const connections = { up: false, down: false, left: false, right: false };
    if (!CONNECTABLE_BARRIERS.has(type)) return connections;

    for (const direction of CONNECTION_DIRECTIONS) {
      connections[direction.name] = this.canConnectObjects(
        type,
        this.getObject(x + direction.x, y + direction.y)
      );
    }
    return connections;
  }

  canConnectObjects(type, neighborType) {
    if (!CONNECTABLE_BARRIERS.has(type) || !CONNECTABLE_BARRIERS.has(neighborType)) return false;
    return Object.values(CONNECTABLE_BARRIER_GROUPS)
      .some((group) => group.includes(type) && group.includes(neighborType));
  }

  getConnectableVariant(x, y) {
    const connections = this.getConnectableConnections(x, y);
    const connected = ['up', 'right', 'down', 'left'].filter((name) => connections[name]);

    if (connected.length === 0) return 'single';
    if (connected.length === 4) return 'cross';
    if (connected.length === 3) return `tee-${['up', 'right', 'down', 'left'].filter((name) => !connections[name])[0]}`;
    if (connected.length === 2) {
      if (connections.left && connections.right) return 'horizontal';
      if (connections.up && connections.down) return 'vertical';
      const vertical = connections.up ? 'up' : 'down';
      const horizontal = connections.left ? 'left' : 'right';
      return `corner-${vertical}-${horizontal}`;
    }
    return `end-${connected[0]}`;
  }

  isGateOpen(x, y) {
    return this.isOpen(x, y);
  }

  isDoorOpen(x, y) {
    return this.isOpen(x, y);
  }

  isOpen(x, y) {
    return this.objectStates.get(keyOf(x, y))?.open === true;
  }

  toggleGate(x, y) {
    return this.toggleOpenable(x, y);
  }

  toggleDoor(x, y) {
    return this.toggleOpenable(x, y);
  }

  toggleOpenable(x, y) {
    if (!OPENABLE_BARRIERS.has(this.getObject(x, y))) return null;
    const open = !this.isOpen(x, y);
    this.objectStates.set(keyOf(x, y), { open });
    return open;
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
      const state = this.objectStates.get(key) || {};
      callback({ x, y, type, ...state });
    }
  }
}
