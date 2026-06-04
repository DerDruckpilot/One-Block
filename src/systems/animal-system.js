import { ANIMAL_MAX_COUNT } from '../config/constants.js';
import { Animal } from '../entities/animal.js';

export class AnimalSystem {
  constructor(random = Math.random) {
    this.animals = [];
    this.random = random;
  }

  update(deltaSeconds, tileMap) {
    const events = [];

    for (const animal of this.animals) {
      animal.update(deltaSeconds, tileMap, this.random);
      if (!animal.isSupported(tileMap)) {
        events.push({ type: 'void', animal });
      }
    }

    if (events.length > 0) {
      this.animals = this.animals.filter((animal) => animal.isSupported(tileMap));
    }

    return events;
  }

  maybeSpawn(tileMap, chance = 0.18) {
    if (this.animals.length >= ANIMAL_MAX_COUNT) {
      return { spawned: false, message: null };
    }
    if (this.random() > chance) {
      return { spawned: false, message: null };
    }

    return this.spawn(tileMap);
  }

  spawn(tileMap) {
    if (this.animals.length >= ANIMAL_MAX_COUNT) {
      return { spawned: false, message: 'Es sind genug Tiere da.' };
    }

    const tile = this.findSpawnTile(tileMap);
    if (!tile) {
      return { spawned: false, message: 'Keine sichere Stelle fuer ein Tier.' };
    }

    const animal = Animal.fromTile(tile);
    this.animals.push(animal);
    return {
      spawned: true,
      animal,
      message: 'Ein Huhn pickt auf der Insel.'
    };
  }

  findSpawnTile(tileMap) {
    const candidates = [];
    tileMap.forEachTile((tile) => {
      if (this.canSpawnAt(tileMap, tile.x, tile.y)) {
        candidates.push({ x: tile.x, y: tile.y });
      }
    });
    if (candidates.length === 0) return null;
    return candidates[Math.floor(this.random() * candidates.length)] || candidates[0];
  }

  canSpawnAt(tileMap, x, y) {
    return tileMap.isGround(x, y) &&
      !tileMap.isCrystal(x, y) &&
      !tileMap.getObject(x, y) &&
      !this.animals.some((animal) => {
        const foot = animal.getFootPosition();
        const tile = tileMap.getTileAtWorldPosition(foot.x, foot.y);
        return tile.x === x && tile.y === y;
      });
  }

  load(animals, tileMap) {
    this.animals = [];
    if (!Array.isArray(animals)) return;

    for (const saved of animals.slice(0, ANIMAL_MAX_COUNT)) {
      if (!Number.isFinite(saved?.x) || !Number.isFinite(saved?.y)) continue;
      const animal = new Animal(saved);
      if (!animal.isSupported(tileMap)) {
        const tile = this.getRecoveryTile(animal, tileMap);
        if (!tile) continue;
        animal.setTilePosition(tile);
      }
      this.animals.push(animal);
    }
  }

  getRecoveryTile(animal, tileMap) {
    if (animal.lastGroundTile && this.canSpawnAt(tileMap, animal.lastGroundTile.x, animal.lastGroundTile.y)) {
      return animal.lastGroundTile;
    }
    return this.findSpawnTile(tileMap);
  }

  clear() {
    this.animals = [];
  }

  activeCount() {
    return this.animals.length;
  }

  toJSON() {
    return this.animals.map((animal) => animal.toJSON());
  }
}
