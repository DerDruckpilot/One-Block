import {
  BOW_DAMAGE,
  BOW_RANGE,
  PROJECTILE_HIT_RADIUS,
  PROJECTILE_SPEED,
  SLINGSHOT_DAMAGE,
  SLINGSHOT_RANGE
} from '../config/constants.js';

const PROJECTILE_CONFIG = {
  stoneBall: {
    damage: SLINGSHOT_DAMAGE,
    range: SLINGSHOT_RANGE,
    speed: PROJECTILE_SPEED
  },
  arrow: {
    damage: BOW_DAMAGE,
    range: BOW_RANGE,
    speed: PROJECTILE_SPEED * 1.15
  }
};

export class ProjectileSystem {
  constructor() {
    this.projectiles = [];
    this.nextId = 1;
  }

  spawn({ type, x, y, direction }) {
    const config = PROJECTILE_CONFIG[type];
    if (!config) return null;

    const directionX = Number.isFinite(direction?.x) ? direction.x : 0;
    const directionY = Number.isFinite(direction?.y) ? direction.y : -1;
    const length = Math.hypot(directionX, directionY) || 1;
    const projectile = {
      id: this.nextId,
      type,
      x,
      y,
      startX: x,
      startY: y,
      direction: {
        x: directionX / length,
        y: directionY / length
      },
      distance: 0,
      damage: config.damage,
      range: config.range,
      speed: config.speed
    };
    this.nextId += 1;
    this.projectiles.push(projectile);
    return projectile;
  }

  update(deltaSeconds, enemySystem, flyingEnemySystem, animalSystem = null) {
    const events = [];
    const remaining = [];

    for (const projectile of this.projectiles) {
      const remainingRange = Math.max(0, projectile.range - projectile.distance);
      const totalStep = Math.min(projectile.speed * deltaSeconds, remainingRange);
      const substeps = Math.max(1, Math.ceil(totalStep / PROJECTILE_HIT_RADIUS));
      let hit = null;

      for (let index = 0; index < substeps && !hit; index += 1) {
        const step = totalStep / substeps;
        projectile.x += projectile.direction.x * step;
        projectile.y += projectile.direction.y * step;
        projectile.distance += step;
        hit = this.findHit(projectile, enemySystem, flyingEnemySystem, animalSystem);
      }

      if (hit) {
        events.push({
          type: 'hit',
          projectile,
          target: hit.target,
          targetType: hit.targetType
        });
        continue;
      }

      if (projectile.distance < projectile.range) {
        remaining.push(projectile);
      }
    }

    this.projectiles = remaining;
    return events;
  }

  findHit(projectile, enemySystem, flyingEnemySystem, animalSystem = null) {
    for (const enemy of enemySystem.enemies) {
      if (this.distanceToTarget(projectile, enemy) <= PROJECTILE_HIT_RADIUS) {
        return { target: enemy, targetType: 'ground' };
      }
    }

    for (const enemy of flyingEnemySystem.enemies) {
      if (this.distanceToTarget(projectile, enemy) <= PROJECTILE_HIT_RADIUS) {
        return { target: enemy, targetType: 'flying' };
      }
    }

    for (const animal of animalSystem?.animals || []) {
      if (this.distanceToTarget(projectile, animal) <= PROJECTILE_HIT_RADIUS) {
        return { target: animal, targetType: 'animal' };
      }
    }

    return null;
  }

  distanceToTarget(projectile, target) {
    const center = target.getCenterPosition();
    return Math.hypot(projectile.x - center.x, projectile.y - center.y);
  }

  clear() {
    this.projectiles = [];
  }

  activeCount() {
    return this.projectiles.length;
  }
}
