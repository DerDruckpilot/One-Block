import {
  DROP_ANIMATION_SECONDS,
  DROP_PICKUP_DISTANCE,
  RESOURCE_LABELS,
  TILE_SIZE
} from '../config/constants.js';

const VALID_DROP_RESOURCES = new Set([
  'earth',
  'stone',
  'clay',
  'rawWood',
  'fiber',
  'grassSeed',
  'treeSeed',
  'springDrop',
  'berry',
  'rawMeat',
  'egg',
  'friedEgg',
  'clayBrick',
  'unfiredBowl',
  'bowl',
  'unfiredJug',
  'jug'
]);

const DROP_TILE_OFFSET = 8;

export class DropSystem {
  constructor(random = Math.random) {
    this.drops = [];
    this.nextId = 1;
    this.random = random;
  }

  spawnFromCrystal(drop, tileMap) {
    const crystal = tileMap.getCrystalCenter();
    const targetTile = this.findDropTileNearWorld(tileMap, crystal.x, crystal.y);
    if (!targetTile) return null;
    const targetPosition = this.positionWithinTile(targetTile);

    return this.spawn({
      resource: drop.resource,
      amount: drop.amount,
      startX: crystal.x,
      startY: crystal.y - 16,
      x: targetPosition.x,
      y: targetPosition.y,
      tile: targetTile,
      age: 0
    });
  }

  spawnAtTile(drop, tile, source = null) {
    if (!tile) return null;
    const targetPosition = this.positionWithinTile(tile);
    return this.spawn({
      resource: drop.resource,
      amount: drop.amount,
      startX: source?.x ?? targetPosition.x,
      startY: source?.y ?? targetPosition.y,
      x: targetPosition.x,
      y: targetPosition.y,
      tile,
      age: source ? 0 : DROP_ANIMATION_SECONDS
    });
  }

  spawnNearWorld(drop, tileMap, x, y) {
    const fallback = this.findDropTileNearWorld(tileMap, x, y);
    return fallback ? this.spawnAtTile(drop, fallback, { x, y: y - 14 }) : null;
  }

  spawn({ resource, amount = 1, x, y, startX = x, startY = y, tile = null, age = DROP_ANIMATION_SECONDS }) {
    if (!VALID_DROP_RESOURCES.has(resource)) return null;
    const drop = {
      id: this.nextId,
      resource,
      amount,
      x,
      y,
      startX,
      startY,
      age,
      duration: DROP_ANIMATION_SECONDS,
      tile
    };
    this.nextId += 1;
    this.drops.push(drop);
    return drop;
  }

  update(deltaSeconds, player, inventory, tileMap) {
    const collected = [];
    const playerFoot = player.getFootPosition();

    for (const drop of this.drops) {
      drop.age = Math.min(drop.duration, drop.age + deltaSeconds);
      if (drop.age < Math.min(0.18, drop.duration)) continue;
      if (Math.hypot(playerFoot.x - drop.x, playerFoot.y - drop.y) <= DROP_PICKUP_DISTANCE) {
        inventory.add(drop.resource, drop.amount);
        collected.push(drop);
      }
    }

    if (collected.length > 0) {
      const collectedIds = new Set(collected.map((drop) => drop.id));
      this.drops = this.drops.filter((drop) => !collectedIds.has(drop.id));
    }

    return collected.map((drop) => ({
      resource: drop.resource,
      amount: drop.amount,
      message: `${RESOURCE_LABELS[drop.resource]} eingesammelt.`
    }));
  }

  findDropTile(tileMap) {
    const crystal = tileMap.getCrystalCenter();
    return this.findDropTileNearWorld(tileMap, crystal.x, crystal.y);
  }

  findDropTileNearWorld(tileMap, x, y, radius = 2) {
    const origin = tileMap.getTileAtWorldPosition(x, y);
    const candidates = [];
    for (let dy = -radius; dy <= radius; dy += 1) {
      for (let dx = -radius; dx <= radius; dx += 1) {
        const candidate = { x: origin.x + dx, y: origin.y + dy };
        if (this.canHoldDrop(tileMap, candidate.x, candidate.y)) {
          candidates.push(candidate);
        }
      }
    }
    if (candidates.length > 0) {
      return this.pickRandomTile(candidates);
    }
    return this.findNearestDropTile(tileMap, x, y);
  }

  findNearestDropTile(tileMap, x, y) {
    let fallback = null;
    let fallbackDistance = Infinity;
    tileMap.forEachTile((candidate) => {
      if (!this.canHoldDrop(tileMap, candidate.x, candidate.y)) return;
      const centerX = candidate.x * TILE_SIZE + TILE_SIZE / 2;
      const centerY = candidate.y * TILE_SIZE + TILE_SIZE / 2;
      const distance = Math.hypot(x - centerX, y - centerY);
      if (distance < fallbackDistance) {
        fallback = { x: candidate.x, y: candidate.y };
        fallbackDistance = distance;
      }
    });
    return fallback;
  }

  pickRandomTile(tiles) {
    return tiles[Math.floor(this.random() * tiles.length)] || tiles[0] || null;
  }

  positionWithinTile(tile) {
    return {
      x: tile.x * TILE_SIZE + TILE_SIZE / 2 + (this.random() - 0.5) * DROP_TILE_OFFSET * 2,
      y: tile.y * TILE_SIZE + TILE_SIZE / 2 + (this.random() - 0.5) * DROP_TILE_OFFSET * 2
    };
  }

  canHoldDrop(tileMap, x, y) {
    return tileMap.isGround(x, y) &&
      !tileMap.isCrystal(x, y) &&
      !tileMap.getObject(x, y) &&
      !tileMap.isBlockedForGroundEntity(x, y);
  }

  load(drops, tileMap) {
    this.drops = [];
    this.nextId = 1;
    if (!Array.isArray(drops)) return;

    for (const saved of drops) {
      if (!VALID_DROP_RESOURCES.has(saved?.resource) || !Number.isFinite(saved.x) || !Number.isFinite(saved.y)) continue;
      let x = saved.x;
      let y = saved.y;
      const tile = tileMap.getTileAtWorldPosition(x, y);
      if (!this.canHoldDrop(tileMap, tile.x, tile.y)) {
        const fallback = this.findDropTile(tileMap);
        if (!fallback) continue;
        const fallbackPosition = this.positionWithinTile(fallback);
        x = fallbackPosition.x;
        y = fallbackPosition.y;
      }

      this.spawn({
        resource: saved.resource,
        amount: Number(saved.amount || 1),
        x,
        y,
        startX: Number(saved.startX || x),
        startY: Number(saved.startY || y),
        age: Number(saved.age || DROP_ANIMATION_SECONDS)
      });
    }
  }

  clear() {
    this.drops = [];
  }

  toJSON() {
    return this.drops.map((drop) => ({
      resource: drop.resource,
      amount: drop.amount,
      x: drop.x,
      y: drop.y,
      startX: drop.startX,
      startY: drop.startY,
      age: drop.age
    }));
  }
}
