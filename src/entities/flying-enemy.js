import {
  FLYING_ENEMY_MAX_HP,
  FLYING_ENEMY_MAX_TILE_DISTANCE,
  FLYING_ENEMY_SIZE,
  FLYING_ENEMY_SPEED,
  TILE_SIZE
} from '../config/constants.js';

export class FlyingEnemy {
  constructor({
    x,
    y,
    type = 'bat',
    hp = FLYING_ENEMY_MAX_HP,
    maxHp = FLYING_ENEMY_MAX_HP,
    healthVisible = false,
    direction = { x: 1, y: 0 },
    knockback = { x: 0, y: 0, seconds: 0 }
  }) {
    this.x = x;
    this.y = y;
    this.width = FLYING_ENEMY_SIZE;
    this.height = FLYING_ENEMY_SIZE;
    this.type = type;
    this.hp = hp;
    this.maxHp = maxHp;
    this.healthVisible = healthVisible;
    this.direction = {
      x: Number(direction?.x || 1),
      y: Number(direction?.y || 0)
    };
    this.knockback = {
      x: Number(knockback?.x || 0),
      y: Number(knockback?.y || 0),
      seconds: Number(knockback?.seconds || 0)
    };
    this.hitFlashSeconds = 0;
  }

  static nearCrystal(tileMap) {
    const center = tileMap.getCrystalCenter();
    return new FlyingEnemy({
      x: center.x + TILE_SIZE * 1.2 - FLYING_ENEMY_SIZE / 2,
      y: center.y - TILE_SIZE * 1.2 - FLYING_ENEMY_SIZE / 2,
      direction: { x: -1, y: 0.35 }
    });
  }

  update(deltaSeconds, tileMap, player) {
    this.hitFlashSeconds = Math.max(0, this.hitFlashSeconds - deltaSeconds);

    if (this.knockback.seconds > 0) {
      this.x += this.knockback.x * deltaSeconds;
      this.y += this.knockback.y * deltaSeconds;
      this.knockback.seconds = Math.max(0, this.knockback.seconds - deltaSeconds);
      this.clampNearWorld(tileMap);
      return;
    }

    const own = this.getCenterPosition();
    const target = player.getCenterPosition();
    const dx = target.x - own.x;
    const dy = target.y - own.y;
    const distance = Math.hypot(dx, dy) || 1;
    let dirX = dx / distance;
    let dirY = dy / distance;

    const nextX = this.x + dirX * FLYING_ENEMY_SPEED * deltaSeconds;
    const nextY = this.y + dirY * FLYING_ENEMY_SPEED * deltaSeconds;
    if (!this.isNearWorld(nextX + this.width / 2, nextY + this.height / 2, tileMap) ||
      this.isBlockedAt(nextX + this.width / 2, nextY + this.height / 2, tileMap)) {
      const nearest = this.findNearestGroundCenter(tileMap);
      if (nearest) {
        const backX = nearest.x - own.x;
        const backY = nearest.y - own.y;
        const backDistance = Math.hypot(backX, backY) || 1;
        dirX = backX / backDistance;
        dirY = backY / backDistance;
      } else {
        dirX *= -1;
        dirY *= -1;
      }
    }

    this.direction = { x: dirX, y: dirY };
    this.x += dirX * FLYING_ENEMY_SPEED * deltaSeconds;
    this.y += dirY * FLYING_ENEMY_SPEED * deltaSeconds;
    this.clampNearWorld(tileMap);
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
      x: (dx / distance) * 120,
      y: (dy / distance) * 120,
      seconds: 0.14
    };

    return this.hp <= 0;
  }

  isNearWorld(x, y, tileMap) {
    let nearestDistance = Infinity;
    tileMap.forEachTile((tile) => {
      if (!tileMap.isGround(tile.x, tile.y)) return;
      const centerX = tile.x * TILE_SIZE + TILE_SIZE / 2;
      const centerY = tile.y * TILE_SIZE + TILE_SIZE / 2;
      nearestDistance = Math.min(nearestDistance, Math.hypot(x - centerX, y - centerY));
    });
    return nearestDistance <= FLYING_ENEMY_MAX_TILE_DISTANCE * TILE_SIZE;
  }

  isBlockedAt(x, y, tileMap) {
    const tile = tileMap.getTileAtWorldPosition(x, y);
    return tileMap.isBlockedForFlyingEntity(tile.x, tile.y);
  }

  clampNearWorld(tileMap) {
    const center = this.getCenterPosition();
    if (this.isNearWorld(center.x, center.y, tileMap)) return;

    const nearest = this.findNearestGroundCenter(tileMap);
    if (!nearest) return;
    const dx = center.x - nearest.x;
    const dy = center.y - nearest.y;
    const distance = Math.hypot(dx, dy) || 1;
    const maxDistance = FLYING_ENEMY_MAX_TILE_DISTANCE * TILE_SIZE;
    this.x = nearest.x + (dx / distance) * maxDistance - this.width / 2;
    this.y = nearest.y + (dy / distance) * maxDistance - this.height / 2;
  }

  findNearestGroundCenter(tileMap) {
    const center = this.getCenterPosition();
    let nearest = null;
    let nearestDistance = Infinity;
    tileMap.forEachTile((tile) => {
      if (!tileMap.isGround(tile.x, tile.y)) return;
      const candidate = {
        x: tile.x * TILE_SIZE + TILE_SIZE / 2,
        y: tile.y * TILE_SIZE + TILE_SIZE / 2
      };
      const distance = Math.hypot(center.x - candidate.x, center.y - candidate.y);
      if (distance < nearestDistance) {
        nearest = candidate;
        nearestDistance = distance;
      }
    });
    return nearest;
  }

  getCenterPosition() {
    return {
      x: this.x + this.width / 2,
      y: this.y + this.height / 2
    };
  }

  toJSON() {
    return {
      type: this.type,
      x: this.x,
      y: this.y,
      hp: this.hp,
      maxHp: this.maxHp,
      healthVisible: this.healthVisible,
      direction: { ...this.direction },
      knockback: { ...this.knockback }
    };
  }
}
