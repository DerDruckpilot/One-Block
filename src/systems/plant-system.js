import {
  BERRY_BUSH_GROW_SECONDS,
  GRASS_HARVEST_COOLDOWN_SECONDS,
  OBJECT_TYPES,
  SAPLING_GROW_SECONDS
} from '../config/constants.js';

const keyOf = (x, y) => `${x},${y}`;

const getTreeStage = (growthSeconds) => {
  if (growthSeconds <= 0) return 3;
  if (growthSeconds <= SAPLING_GROW_SECONDS * 0.45) return 2;
  return 1;
};

const getBerryStage = (growthSeconds, ready) => {
  if (ready || growthSeconds <= 0) return 3;
  if (growthSeconds <= BERRY_BUSH_GROW_SECONDS * 0.5) return 2;
  return 1;
};

export class PlantSystem {
  constructor() {
    this.plants = new Map();
    this.grassCooldowns = new Map();
  }

  update(deltaSeconds, tileMap) {
    for (const [key, plant] of this.plants.entries()) {
      if (plant.type === OBJECT_TYPES.sapling) {
        plant.growthSeconds = Math.max(0, plant.growthSeconds - deltaSeconds);
        if (plant.growthSeconds <= 0) {
          plant.type = OBJECT_TYPES.tree;
          tileMap.setObject(plant.x, plant.y, OBJECT_TYPES.tree);
        }
        this.syncPlantObjectState(tileMap, plant);
      }

      if (plant.type === OBJECT_TYPES.berryBush) {
        plant.growthSeconds = Math.max(0, plant.growthSeconds - deltaSeconds);
        plant.ready = plant.growthSeconds <= 0;
        this.syncPlantObjectState(tileMap, plant);
      }

      if (!tileMap.getObject(plant.x, plant.y)) {
        this.plants.delete(key);
      }
    }

    for (const [key, seconds] of this.grassCooldowns.entries()) {
      const remaining = Math.max(0, seconds - deltaSeconds);
      if (remaining <= 0) this.grassCooldowns.delete(key);
      else this.grassCooldowns.set(key, remaining);
    }
  }

  plantTreeSeed(tileMap, x, y) {
    if (!this.canPlantOn(tileMap, x, y)) return false;
    const plant = { type: OBJECT_TYPES.sapling, x, y, growthSeconds: SAPLING_GROW_SECONDS, ready: false };
    this.plants.set(keyOf(x, y), plant);
    tileMap.setObject(x, y, OBJECT_TYPES.sapling);
    this.syncPlantObjectState(tileMap, plant);
    return true;
  }

  plantBerryBush(tileMap, x, y) {
    if (!this.canPlantOn(tileMap, x, y)) return false;
    const plant = { type: OBJECT_TYPES.berryBush, x, y, growthSeconds: BERRY_BUSH_GROW_SECONDS, ready: false };
    this.plants.set(keyOf(x, y), plant);
    tileMap.setObject(x, y, OBJECT_TYPES.berryBush);
    this.syncPlantObjectState(tileMap, plant);
    return true;
  }

  canPlantOn(tileMap, x, y) {
    return tileMap.isPlantableForTree(x, y) &&
      !tileMap.isCrystal(x, y) &&
      !tileMap.getObject(x, y);
  }

  harvestGrass(tileMap, x, y) {
    if (!tileMap.isGrass(x, y)) return { harvested: false, message: 'Kein Gras in Reichweite.' };
    const key = keyOf(x, y);
    if (this.grassCooldowns.has(key)) {
      return { harvested: false, message: 'Das Gras wächst noch nach.' };
    }
    this.grassCooldowns.set(key, GRASS_HARVEST_COOLDOWN_SECONDS);
    return { harvested: true, message: 'Pflanzenfasern geerntet.' };
  }

  fellTree(tileMap, x, y) {
    const plant = this.plants.get(keyOf(x, y));
    if (!plant || plant.type !== OBJECT_TYPES.tree) return { harvested: false, message: 'Kein Baum in Reichweite.' };
    this.plants.delete(keyOf(x, y));
    tileMap.removeObject(x, y);
    return { harvested: true, message: 'Baum gefällt.' };
  }

  harvestBerryBush(x, y, tileMap = null) {
    const plant = this.plants.get(keyOf(x, y));
    if (!plant || plant.type !== OBJECT_TYPES.berryBush) return { harvested: false, message: 'Kein Beerenbusch in Reichweite.' };
    if (!plant.ready) return { harvested: false, message: 'Die Beeren sind noch nicht reif.' };
    plant.ready = false;
    plant.growthSeconds = BERRY_BUSH_GROW_SECONDS;
    if (tileMap) this.syncPlantObjectState(tileMap, plant);
    return { harvested: true, message: 'Beeren geerntet.' };
  }

  getPlant(x, y) {
    return this.plants.get(keyOf(x, y)) || null;
  }

  load(plants = [], grassCooldowns = [], tileMap) {
    this.plants.clear();
    this.grassCooldowns.clear();

    if (Array.isArray(plants)) {
      for (const saved of plants) {
        if (!Number.isFinite(saved?.x) || !Number.isFinite(saved?.y)) continue;
        if (![OBJECT_TYPES.sapling, OBJECT_TYPES.tree, OBJECT_TYPES.berryBush].includes(saved.type)) continue;
        const plant = {
          type: saved.type,
          x: saved.x,
          y: saved.y,
          growthSeconds: Math.max(0, Number(saved.growthSeconds || 0)),
          ready: saved.ready === true
        };
        if (this.canLoadPlant(tileMap, plant)) {
          this.plants.set(keyOf(plant.x, plant.y), plant);
          tileMap.setObject(plant.x, plant.y, plant.type);
          this.syncPlantObjectState(tileMap, plant);
        }
      }
    }

    if (Array.isArray(grassCooldowns)) {
      for (const saved of grassCooldowns) {
        if (!Number.isFinite(saved?.x) || !Number.isFinite(saved?.y) || !Number.isFinite(saved.seconds)) continue;
        if (saved.seconds > 0) this.grassCooldowns.set(keyOf(saved.x, saved.y), saved.seconds);
      }
    }
  }

  canLoadPlant(tileMap, plant) {
    const existing = tileMap.getObject(plant.x, plant.y);
    return tileMap.isGround(plant.x, plant.y) &&
      !tileMap.isCrystal(plant.x, plant.y) &&
      (!existing || existing === plant.type);
  }

  clear() {
    this.plants.clear();
    this.grassCooldowns.clear();
  }

  syncPlantObjectState(tileMap, plant) {
    if (plant.type === OBJECT_TYPES.sapling || plant.type === OBJECT_TYPES.tree) {
      tileMap.setObjectState(plant.x, plant.y, {
        growthStage: getTreeStage(plant.growthSeconds),
        growthSeconds: plant.growthSeconds
      });
      return;
    }

    if (plant.type === OBJECT_TYPES.berryBush) {
      tileMap.setObjectState(plant.x, plant.y, {
        growthStage: getBerryStage(plant.growthSeconds, plant.ready),
        ready: plant.ready,
        growthSeconds: plant.growthSeconds
      });
    }
  }

  toJSON() {
    return [...this.plants.values()].map((plant) => ({ ...plant }));
  }

  grassCooldownsToJSON() {
    return [...this.grassCooldowns.entries()].map(([key, seconds]) => {
      const [x, y] = key.split(',').map(Number);
      return { x, y, seconds };
    });
  }
}
