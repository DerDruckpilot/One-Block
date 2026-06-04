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
  'berry'
]);

export class DropSystem {
  constructor() {
    this.drops = [];
    this.nextId = 1;
  }

  spawnFromCrystal(drop, tileMap) {
    const targetTile = this.findDropTile(tileMap);
    if (!targetTile) return null;

    const crystal = tileMap.getCrystalCenter();
    return this.spawn({
      resource: drop.resource,
      amount: drop.amount,
      startX: crystal.x,
      startY: crystal.y - 16,
      x: targetTile.x * TILE_SIZE + TILE_SIZE / 2,
      y: targetTile.y * TILE_SIZE + TILE_SIZE / 2,
      tile: targetTile,
      age: 0
    });
  }

  spawnAtTile(drop, tile) {
    if (!tile) return null;
    return this.spawn({
      resource: drop.resource,
      amount: drop.amount,
      x: tile.x * TILE_SIZE + TILE_SIZE / 2,
      y: tile.y * TILE_SIZE + TILE_SIZE / 2,
      tile,
      age: DROP_ANIMATION_SECONDS
    });
  }

  spawnNearWorld(drop, tileMap, x, y) {
    const tile = tileMap.getTileAtWorldPosition(x, y);
    if (this.canHoldDrop(tileMap, tile.x, tile.y)) {
      return this.spawnAtTile(drop, tile);
    }
    const fallback = this.findNearestDropTile(tileMap, x, y);
    return fallback ? this.spawnAtTile(drop, fallback) : null;
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
    const preferred = [
      { x: 1, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 },
      { x: 1, y: 1 },
      { x: -1, y: 1 },
      { x: 1, y: -1 },
      { x: -1, y: -1 }
    ];

    const tile = preferred.find((candidate) => this.canHoldDrop(tileMap, candidate.x, candidate.y));
    if (tile) return tile;

    let fallback = null;
    tileMap.forEachTile((candidate) => {
      if (!fallback && this.canHoldDrop(tileMap, candidate.x, candidate.y)) {
        fallback = { x: candidate.x, y: candidate.y };
      }
    });
    return fallback;
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

  canHoldDrop(tileMap, x, y) {
    return tileMap.isGround(x, y) && !tileMap.isCrystal(x, y) && !tileMap.getObject(x, y);
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
        x = fallback.x * TILE_SIZE + TILE_SIZE / 2;
        y = fallback.y * TILE_SIZE + TILE_SIZE / 2;
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
