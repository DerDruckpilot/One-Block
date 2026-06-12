import {
  SPEAR_ATTACK_DOT,
  SPEAR_ATTACK_RANGE,
  SPEAR_DAMAGE
} from '../config/constants.js';
import { Enemy } from '../entities/enemy.js';

export class EnemySystem {
  constructor() {
    this.enemies = [];
  }

  update(deltaSeconds, tileMap, player) {
    const events = [];

    for (const enemy of this.enemies) {
      enemy.update(deltaSeconds, tileMap, player);
      if (!enemy.isSupported(tileMap)) {
        events.push({ type: 'void', enemy, tile: enemy.lastGroundTile });
      }
    }

    if (events.length > 0) {
      this.enemies = this.enemies.filter((enemy) => enemy.isSupported(tileMap) && enemy.hp > 0);
    }

    return events;
  }

  spawnNearCrystal(tileMap, level = 1, random = Math.random, { maxActive = 1 } = {}) {
    if (this.enemies.length >= maxActive) {
      return {
        spawned: false,
        message: 'Es ist bereits eine Kreatur da.'
      };
    }

    const tile = this.findSpawnTile(tileMap);
    if (!tile) {
      return {
        spawned: false,
        message: 'Keine sichere Stelle fuer eine Kreatur.'
      };
    }

    const elite = level >= 4 && random() < 0.35;
    const enemy = Enemy.fromTile(tile, {
      type: elite ? 'brute' : 'groundling',
      hp: elite ? 7 : level >= 3 ? 5 : 4,
      maxHp: elite ? 7 : level >= 3 ? 5 : 4,
      speed: elite ? 28 : level >= 5 ? 42 : level >= 3 ? 38 : 34,
      damage: elite ? 2 : 1
    });
    enemy.lastGroundTile = { x: tile.x, y: tile.y };
    this.enemies.push(enemy);

    return {
      spawned: true,
      enemy,
      message: elite ? 'Ein schwerer Brocken erscheint!' : 'Eine Kreatur erscheint!'
    };
  }

  attackWithSpear(player) {
    const enemy = this.findEnemyInSpearArc(player);
    if (!enemy) {
      return {
        hit: false,
        defeated: false,
        message: 'Kein Ziel.'
      };
    }

    return this.applyDamage(enemy, SPEAR_DAMAGE, player.getCenterPosition());
  }

  applyDamage(enemy, amount, source) {
    const defeated = enemy.takeDamage(amount, source);
    if (defeated) {
      this.enemies = this.enemies.filter((candidate) => candidate !== enemy);
    }

    return {
      hit: true,
      defeated,
      enemy,
      message: defeated ? 'Kreatur besiegt.' : 'Kreatur getroffen.'
    };
  }

  findEnemyInSpearArc(player) {
    const origin = player.getFootPosition();
    const facing = player.facing || { x: 0, y: -1 };
    const facingLength = Math.hypot(facing.x, facing.y) || 1;
    const facingX = facing.x / facingLength;
    const facingY = facing.y / facingLength;

    return this.enemies.find((enemy) => {
      const center = enemy.getCenterPosition();
      const dx = center.x - origin.x;
      const dy = center.y - origin.y;
      const distance = Math.hypot(dx, dy);
      if (distance > SPEAR_ATTACK_RANGE || distance <= 0) return false;

      const dot = (dx / distance) * facingX + (dy / distance) * facingY;
      return dot >= SPEAR_ATTACK_DOT;
    }) || null;
  }

  findSpawnTile(tileMap) {
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

    const tile = preferred.find((candidate) => this.canSpawnAt(tileMap, candidate.x, candidate.y));
    if (tile) return tile;

    let fallback = null;
    tileMap.forEachTile((candidate) => {
      if (!fallback && this.canSpawnAt(tileMap, candidate.x, candidate.y)) {
        fallback = { x: candidate.x, y: candidate.y };
      }
    });
    return fallback;
  }

  canSpawnAt(tileMap, x, y) {
    return tileMap.isGround(x, y) &&
      !tileMap.isCrystal(x, y) &&
      !tileMap.isBlockedForGroundEntity(x, y);
  }

  load(enemies, tileMap) {
    this.enemies = [];
    if (!Array.isArray(enemies)) return;

    for (const saved of enemies.slice(0, 1)) {
      if (!Number.isFinite(saved?.x) || !Number.isFinite(saved?.y)) continue;
      const enemy = new Enemy({
        x: saved.x,
        y: saved.y,
        type: saved.type || 'groundling',
        hp: Number.isFinite(saved.hp) ? Math.max(0, saved.hp) : 4,
        maxHp: Number.isFinite(saved.maxHp) ? Math.max(1, saved.maxHp) : 4,
        speed: Number.isFinite(saved.speed) ? Math.max(1, saved.speed) : undefined,
        damage: Number.isFinite(saved.damage) ? Math.max(1, saved.damage) : 1,
        healthVisible: saved.healthVisible === true,
        knockback: saved.knockback,
        lastGroundTile: saved.lastGroundTile
      });

      if (!enemy.isSupported(tileMap)) {
        const tile = this.getRecoveryTile(enemy, tileMap);
        if (!tile) continue;
        enemy.setTilePosition(tile);
      }

      if (enemy.hp > 0) this.enemies.push(enemy);
    }
  }

  getRecoveryTile(enemy, tileMap) {
    if (enemy.lastGroundTile && this.canSpawnAt(tileMap, enemy.lastGroundTile.x, enemy.lastGroundTile.y)) {
      return enemy.lastGroundTile;
    }
    return this.findSpawnTile(tileMap);
  }

  clear() {
    this.enemies = [];
  }

  activeCount() {
    return this.enemies.length;
  }

  toJSON() {
    return this.enemies.map((enemy) => enemy.toJSON());
  }
}
