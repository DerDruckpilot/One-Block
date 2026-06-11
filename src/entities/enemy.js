import {
  ENEMY_MAX_HP,
  ENEMY_SIZE,
  ENEMY_SPEED,
  TILE_SIZE
} from '../config/constants.js';

export class Enemy {
  constructor({
    x,
    y,
    type = 'groundling',
    hp = ENEMY_MAX_HP,
    maxHp = ENEMY_MAX_HP,
    speed = ENEMY_SPEED,
    damage = 1,
    healthVisible = false,
    knockback = { x: 0, y: 0, seconds: 0 },
    lastGroundTile = null
  }) {
    this.x = x;
    this.y = y;
    this.width = ENEMY_SIZE;
    this.height = ENEMY_SIZE;
    this.type = type;
    this.hp = hp;
    this.maxHp = maxHp;
    this.speed = Number.isFinite(speed) ? speed : ENEMY_SPEED;
    this.damage = Number.isFinite(damage) ? damage : 1;
    this.healthVisible = healthVisible;
    this.knockback = {
      x: Number(knockback?.x || 0),
      y: Number(knockback?.y || 0),
      seconds: Number(knockback?.seconds || 0)
    };
    this.lastGroundTile = lastGroundTile;
    this.hitFlashSeconds = 0;
  }

  static fromTile(tile, options = {}) {
    return new Enemy({
      x: tile.x * TILE_SIZE + TILE_SIZE / 2 - ENEMY_SIZE / 2,
      y: tile.y * TILE_SIZE + TILE_SIZE / 2 - ENEMY_SIZE / 2,
      ...options
    });
  }

  update(deltaSeconds, tileMap, player) {
    this.hitFlashSeconds = Math.max(0, this.hitFlashSeconds - deltaSeconds);
    this.rememberSupport(tileMap);

    if (this.knockback.seconds > 0) {
      this.x += this.knockback.x * deltaSeconds;
      this.y += this.knockback.y * deltaSeconds;
      this.knockback.seconds = Math.max(0, this.knockback.seconds - deltaSeconds);
      return;
    }

    const own = this.getCenterPosition();
    const target = player.getCenterPosition();
    const dx = target.x - own.x;
    const dy = target.y - own.y;
    const distance = Math.hypot(dx, dy);
    if (distance <= 1) return;

    const stepX = (dx / distance) * this.speed * deltaSeconds;
    const stepY = (dy / distance) * this.speed * deltaSeconds;

    if (this.canStandAt(this.x + stepX, this.y, tileMap)) {
      this.x += stepX;
    }

    if (this.canStandAt(this.x, this.y + stepY, tileMap)) {
      this.y += stepY;
    }
  }

  takeDamage(amount, source) {
    this.hp = Math.max(0, this.hp - amount);
    this.healthVisible = true;
    this.hitFlashSeconds = 0.18;

    const center = this.getCenterPosition();
    const dx = center.x - source.x;
    const dy = center.y - source.y;
    const distance = Math.hypot(dx, dy) || 1;
    this.knockback = {
      x: (dx / distance) * 130,
      y: (dy / distance) * 130,
      seconds: 0.16
    };

    return this.hp <= 0;
  }

  rememberSupport(tileMap) {
    const foot = this.getFootPosition();
    const support = tileMap.getSupportStateAtWorld(foot.x, foot.y);
    if (support.supported) {
      this.lastGroundTile = support.tile;
    }
  }

  isSupported(tileMap) {
    const foot = this.getFootPosition();
    return tileMap.isPositionSupportedByTile(foot.x, foot.y);
  }

  canStandAt(x, y, tileMap) {
    const foot = this.getFootPositionAt(x, y);
    const tile = tileMap.getTileAtWorldPosition(foot.x, foot.y);
    return tileMap.isPositionSupportedByTile(foot.x, foot.y) &&
      !tileMap.isCrystal(tile.x, tile.y) &&
      !tileMap.isBlockedForGroundEntityAtWorld(foot.x, foot.y);
  }

  setTilePosition(tile) {
    this.x = tile.x * TILE_SIZE + TILE_SIZE / 2 - ENEMY_SIZE / 2;
    this.y = tile.y * TILE_SIZE + TILE_SIZE / 2 - ENEMY_SIZE / 2;
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
      y: y + this.height - 5
    };
  }

  toJSON() {
    return {
      type: this.type,
      x: this.x,
      y: this.y,
      hp: this.hp,
      maxHp: this.maxHp,
      speed: this.speed,
      damage: this.damage,
      healthVisible: this.healthVisible,
      knockback: { ...this.knockback },
      lastGroundTile: this.lastGroundTile ? { ...this.lastGroundTile } : null
    };
  }
}
