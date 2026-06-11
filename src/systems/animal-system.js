import { ANIMAL_MAX_COUNT } from '../config/constants.js';
import { Animal } from '../entities/animal.js';

export class AnimalSystem {
  constructor(random = Math.random) {
    this.animals = [];
    this.random = random;
  }

  update(deltaSeconds, tileMap, player = null) {
    const events = [];

    for (const animal of this.animals) {
      if (animal.tethered && player) {
        animal.updateFollow(deltaSeconds, tileMap, player);
      } else {
        animal.update(deltaSeconds, tileMap, this.random);
      }
      if (!animal.isSupported(tileMap)) {
        events.push({ type: 'void', animal });
      }
    }

    if (events.length > 0) {
      this.animals = this.animals.filter((animal) => animal.isSupported(tileMap));
    }

    return events;
  }

  maybeSpawn(tileMap, chance = 0.18, type = 'chicken') {
    if (this.animals.length >= ANIMAL_MAX_COUNT) {
      return { spawned: false, message: null };
    }
    if (this.random() > chance) {
      return { spawned: false, message: null };
    }

    return this.spawn(tileMap, type);
  }

  spawn(tileMap, type = 'chicken') {
    if (this.animals.length >= ANIMAL_MAX_COUNT) {
      return { spawned: false, message: 'Es sind genug Tiere da.' };
    }

    const tile = this.findSpawnTile(tileMap);
    if (!tile) {
      return { spawned: false, message: 'Keine sichere Stelle fuer ein Tier.' };
    }

    const animal = Animal.fromTileWithType(tile, type);
    this.animals.push(animal);
    return {
      spawned: true,
      animal,
      message: type === 'sheep' ? 'Ein Schaf schaut neugierig umher.' : 'Ein Huhn pickt auf der Insel.'
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
      !tileMap.isBlockedForGroundEntity(x, y) &&
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

  findNearestChicken(player, maxDistance) {
    return this.findNearestAnimal(player, maxDistance, 'chicken');
  }

  findNearestAnimal(player, maxDistance, type = null) {
    const origin = player.getFootPosition();
    let nearest = null;
    let nearestDistance = Infinity;
    for (const animal of this.animals) {
      if ((type && animal.type !== type) || animal.tethered) continue;
      const foot = animal.getFootPosition();
      const distance = Math.hypot(origin.x - foot.x, origin.y - foot.y);
      if (distance <= maxDistance && distance < nearestDistance) {
        nearest = animal;
        nearestDistance = distance;
      }
    }
    return nearest;
  }

  getTetheredAnimal() {
    return this.animals.find((animal) => animal.tethered) || null;
  }

  tetherChicken(player, maxDistance) {
    const existing = this.getTetheredAnimal();
    if (existing) {
      existing.tethered = false;
      return { changed: true, animal: existing, message: `${this.getAnimalLabel(existing)} losgelassen.` };
    }

    const animal = this.findNearestAnimal(player, maxDistance);
    if (!animal) {
      return { changed: false, animal: null, message: 'Kein Tier in Reichweite.' };
    }

    animal.tethered = true;
    animal.direction = { x: 0, y: 0 };
    return { changed: true, animal, message: `${this.getAnimalLabel(animal)} eingefangen.` };
  }

  applyDamage(animal, amount, source) {
    const defeated = animal.takeDamage(amount, source);
    if (defeated) {
      this.animals = this.animals.filter((candidate) => candidate !== animal);
    }
    return {
      hit: true,
      defeated,
      animal,
      message: defeated ? `${this.getAnimalLabel(animal)} erlegt.` : `${this.getAnimalLabel(animal)} getroffen.`
    };
  }

  getAnimalLabel(animal) {
    return animal?.type === 'sheep' ? 'Schaf' : 'Huhn';
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
