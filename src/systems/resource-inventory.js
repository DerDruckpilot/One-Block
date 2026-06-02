export class ResourceInventory {
  constructor() {
    this.resources = {
      earth: 0,
      rawWood: 0,
      fiber: 0,
      seed: 0,
      stone: 0,
      clay: 0,
      encounter: 0
    };
  }

  add(resource, amount = 1) {
    this.resources[resource] = this.get(resource) + amount;
  }

  remove(resource, amount = 1) {
    this.resources[resource] = Math.max(0, this.get(resource) - amount);
  }

  get(resource) {
    return this.resources[resource] || 0;
  }
}
