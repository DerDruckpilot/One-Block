import {
  ANIMAL_SIZE,
  ANIMAL_SPEED,
  TILE_SIZE
} from '../config/constants.js';

const DIRECTIONS = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
  { x: 0, y: 0 }
];

export class Animal {
  constructor({
    x,
    y,
    type = 'chicken',
    direction = { x: 0, y: 0 },
    decisionSeconds = 0.5,
    lastGroundTile = null,
    tethered = false
  }) {
    this.x = x;
    this.y = y;
    this.width = ANIMAL_SIZE;
    this.height = ANIMAL_SIZE;
    this.type = type;
    this.direction = {
      x: Number(direction?.x || 0),
      y: Number(direction?.y || 0)
    };
    this.decisionSeconds = Number(decisionSeconds || 0.5);
    this.lastGroundTile = lastGroundTile;
    this.tethered = tethered === true;
  }

  static fromTile(tile) {
    return new Animal({
      x: tile.x * TILE_SIZE + TILE_SIZE / 2 - ANIMAL_SIZE / 2,
      y: tile.y * TILE_SIZE + TILE_SIZE / 2 - ANIMAL_SIZE / 2,
      lastGroundTile: { x: tile.x, y: tile.y }
    });
  }

  update(deltaSeconds, tileMap, random = Math.random) {
    this.rememberSupport(tileMap);
    this.decisionSeconds -= deltaSeconds;

    if (this.decisionSeconds <= 0) {
      const direction = DIRECTIONS[Math.floor(random() * DIRECTIONS.length)] || DIRECTIONS[4];
      this.direction = { ...direction };
      this.decisionSeconds = 0.8 + random() * 1.4;
    }

    const stepX = this.direction.x * ANIMAL_SPEED * deltaSeconds;
    const stepY = this.direction.y * ANIMAL_SPEED * deltaSeconds;

    if (this.canStandAt(this.x + stepX, this.y, tileMap)) {
      this.x += stepX;
    } else {
      this.direction.x = 0;
    }

    if (this.canStandAt(this.x, this.y + stepY, tileMap)) {
      this.y += stepY;
    } else {
      this.direction.y = 0;
    }
  }

  updateFollow(deltaSeconds, tileMap, player) {
    this.rememberSupport(tileMap);
    const target = player.getFootPosition();
    const own = this.getFootPosition();
    const dx = target.x - own.x;
    const dy = target.y - own.y;
    const distance = Math.hypot(dx, dy);
    const desiredDistance = TILE_SIZE * 1.05;

    if (distance > TILE_SIZE * 4) {
      const recovery = this.findNearestFollowTile(tileMap, player);
      if (recovery) this.setTilePosition(recovery);
      return;
    }

    if (distance <= desiredDistance) return;
    const step = Math.min(ANIMAL_SPEED * 2.4 * deltaSeconds, distance - desiredDistance);
    const stepX = (dx / distance) * step;
    const stepY = (dy / distance) * step;

    if (this.canStandAt(this.x + stepX, this.y, tileMap)) this.x += stepX;
    if (this.canStandAt(this.x, this.y + stepY, tileMap)) this.y += stepY;
  }

  takeKnockback(dx, dy, seconds = 0.12) {
    this.x += dx * seconds;
    this.y += dy * seconds;
  }

  rememberSupport(tileMap) {
    const foot = this.getFootPosition();
    const support = tileMap.getSupportStateAtWorld(foot.x, foot.y);
    if (support.supported && !tileMap.isCrystal(support.tile.x, support.tile.y)) {
      this.lastGroundTile = support.tile;
    }
  }

  isSupported(tileMap) {
    const foot = this.getFootPosition();
    return tileMap.isPositionSupportedByTile(foot.x, foot.y) && !tileMap.isCrystalAtWorld(foot.x, foot.y);
  }

  canStandAt(x, y, tileMap) {
    const foot = this.getFootPositionAt(x, y);
    const tile = tileMap.getTileAtWorldPosition(foot.x, foot.y);
    return tileMap.isGround(tile.x, tile.y) &&
      !tileMap.isCrystal(tile.x, tile.y) &&
      !tileMap.isBlockedForGroundEntityAtWorld(foot.x, foot.y);
  }

  findNearestFollowTile(tileMap, player) {
    const playerTile = player.getTilePosition();
    const candidates = [
      { x: playerTile.x - 1, y: playerTile.y },
      { x: playerTile.x + 1, y: playerTile.y },
      { x: playerTile.x, y: playerTile.y - 1 },
      { x: playerTile.x, y: playerTile.y + 1 },
      this.lastGroundTile
    ].filter(Boolean);
    return candidates.find((tile) => (
      tileMap.isGround(tile.x, tile.y) &&
      !tileMap.isCrystal(tile.x, tile.y) &&
      !tileMap.isBlockedForGroundEntityAtWorld(
        tile.x * TILE_SIZE + TILE_SIZE / 2,
        tile.y * TILE_SIZE + TILE_SIZE / 2
      )
    )) || null;
  }

  setTilePosition(tile) {
    this.x = tile.x * TILE_SIZE + TILE_SIZE / 2 - ANIMAL_SIZE / 2;
    this.y = tile.y * TILE_SIZE + TILE_SIZE / 2 - ANIMAL_SIZE / 2;
    this.lastGroundTile = { x: tile.x, y: tile.y };
  }

  getCenterPosition() {
    return {
      x: this.x + this.width / 2,
      y: this.y + this.height / 2
    };
  }

  getFootPosition() {
    return this.getFootPositionAt(this.x, this.y);
  }

  getFootPositionAt(x, y) {
    return {
      x: x + this.width / 2,
      y: y + this.height - 4
    };
  }

  toJSON() {
    return {
      type: this.type,
      x: this.x,
      y: this.y,
      direction: { ...this.direction },
      decisionSeconds: this.decisionSeconds,
      tethered: this.tethered,
      lastGroundTile: this.lastGroundTile ? { ...this.lastGroundTile } : null
    };
  }
}
