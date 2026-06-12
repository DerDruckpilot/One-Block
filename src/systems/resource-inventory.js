import { AMMO_CAP_UPGRADES, AMMO_CAPS } from '../config/constants.js';

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
      egg: 0,
      friedEgg: 0,
      rawMeat: 0,
      wool: 0,
      roastedBerries: 0,
      cookedSteak: 0,
      clayBrick: 0,
      unfiredBowl: 0,
      bowl: 0,
      unfiredJug: 0,
      jug: 0,
      woodFloor: 0,
      stoneFloor: 0,
      arrow: 0,
      stoneBall: 0,
      workbench: 0,
      woodenPickaxe: 0,
      woodenSpear: 0,
      slingshot: 0,
      bow: 0,
      axe: 0,
      scythe: 0,
      lasso: 0,
      torch: 0,
      campfire: 0,
      woodWall: 0,
      window: 0,
      door: 0,
      fence: 0,
      gate: 0,
      bed: 0,
      chickenNest: 0,
      feedTrough: 0,
      waterTrough: 0,
      furnace: 0,
      table: 0,
      chair: 0,
      rug: 0,
      plantPot: 0,
      shelf: 0,
      floorLantern: 0,
      ammoPouch: 0,
      quiver: 0,
      linenTunic: 0,
      travelBoots: 0
    };
  }

  add(resource, amount = 1) {
    const safeAmount = Math.max(0, Number(amount) || 0);
    const capacity = this.getCapacity(resource);
    const current = this.get(resource);
    const added = Math.min(safeAmount, Math.max(0, capacity - current));
    this.resources[resource] = current + added;
    return added;
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

  getCapacity(resource) {
    const baseCap = AMMO_CAPS[resource];
    if (!Number.isFinite(baseCap)) return Infinity;
    const upgrade = AMMO_CAP_UPGRADES[resource];
    if (upgrade && this.get(upgrade.item) > 0) return upgrade.cap;
    return baseCap;
  }

  getRemainingCapacity(resource) {
    const capacity = this.getCapacity(resource);
    if (!Number.isFinite(capacity)) return Infinity;
    return Math.max(0, capacity - this.get(resource));
  }

  load(resources) {
    for (const resource of Object.keys(this.resources)) {
      this.resources[resource] = Number(resources?.[resource] || 0);
    }
    for (const resource of Object.keys(AMMO_CAPS)) {
      this.resources[resource] = Math.min(this.resources[resource], this.getCapacity(resource));
    }
  }

  toJSON() {
    return { ...this.resources };
  }
}
