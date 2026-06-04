export class ResourceInventory {
  constructor() {
    this.resources = {
      earth: 0,
      stone: 0,
      clay: 0,
      rawWood: 0,
      fiber: 0,
      grassSeed: 0,
      treeSeed: 0,
      springDrop: 0,
      berry: 0,
      arrow: 0,
      stoneBall: 0,
      workbench: 0,
      woodenPickaxe: 0,
      woodenSpear: 0,
      slingshot: 0,
      bow: 0,
      axe: 0,
      scythe: 0,
      torch: 0,
      campfire: 0,
      woodWall: 0,
      table: 0,
      chair: 0
    };
  }

  add(resource, amount = 1) {
    this.resources[resource] = this.get(resource) + amount;
  }

  remove(resource, amount = 1) {
    this.resources[resource] = Math.max(0, this.get(resource) - amount);
  }

  canRemove(resource, amount = 1) {
    return this.get(resource) >= amount;
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
