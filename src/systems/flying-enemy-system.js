import { FlyingEnemy } from '../entities/flying-enemy.js';

export class FlyingEnemySystem {
  constructor() {
    this.enemies = [];
  }

  update(deltaSeconds, tileMap, player) {
    for (const enemy of this.enemies) {
      enemy.update(deltaSeconds, tileMap, player);
    }
    this.enemies = this.enemies.filter((enemy) => enemy.hp > 0);
    return [];
  }

  spawnNearCrystal(tileMap) {
    if (this.enemies.length >= 1) {
      return {
        spawned: false,
        message: 'Es ist bereits eine Kreatur da.'
      };
    }

    const enemy = FlyingEnemy.nearCrystal(tileMap);
    enemy.clampNearWorld(tileMap);
    this.enemies.push(enemy);
    return {
      spawned: true,
      enemy,
      message: 'Ein Flattergeist erscheint!'
    };
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
      message: defeated ? 'Fliegende Kreatur besiegt.' : 'Fliegende Kreatur getroffen.'
    };
  }

  activeCount() {
    return this.enemies.length;
  }

  load(enemies, tileMap) {
    this.enemies = [];
    if (!Array.isArray(enemies)) return;

    for (const saved of enemies.slice(0, 1)) {
      if (!Number.isFinite(saved?.x) || !Number.isFinite(saved?.y)) continue;
      const enemy = new FlyingEnemy(saved);
      if (enemy.hp > 0) {
        enemy.clampNearWorld(tileMap);
        this.enemies.push(enemy);
      }
    }
  }

  clear() {
    this.enemies = [];
  }

  toJSON() {
    return this.enemies.map((enemy) => enemy.toJSON());
  }
}
