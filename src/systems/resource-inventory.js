export class ResourceInventory {
  constructor() {
    this.resources = {
      earth: 0,
      rawWood: 0,
      fiber: 0,
      grassSeed: 0
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

  load(resources) {
    for (const resource of Object.keys(this.resources)) {
      this.resources[resource] = Number(resources?.[resource] || 0);
    }
  }

  toJSON() {
    return { ...this.resources };
  }
}
