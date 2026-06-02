import { BASIC_RESOURCE_DROPS, RESOURCE_LABELS } from '../config/constants.js';

export const chooseWeightedDrop = (randomValue = Math.random()) => {
  const totalWeight = BASIC_RESOURCE_DROPS.reduce((sum, drop) => sum + drop.weight, 0);
  let threshold = Math.min(Math.max(randomValue, 0), 0.999999) * totalWeight;

  for (const drop of BASIC_RESOURCE_DROPS) {
    if (threshold < drop.weight) {
      return drop;
    }
    threshold -= drop.weight;
  }

  return BASIC_RESOURCE_DROPS[BASIC_RESOURCE_DROPS.length - 1];
};

export class CrystalSystem {
  constructor(inventory, random = Math.random) {
    this.inventory = inventory;
    this.random = random;
    this.hitCounter = 0;
    this.lastMessage = 'Drücke E oder Leertaste am Kristall.';
  }

  use() {
    this.hitCounter += 1;
    const drop = chooseWeightedDrop(this.random());
    this.inventory.add(drop.resource, drop.amount);
    this.lastMessage = `Kristall: +${drop.amount} ${RESOURCE_LABELS[drop.resource]}`;
    return drop;
  }
}
