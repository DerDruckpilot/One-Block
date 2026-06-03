import { BASIC_RESOURCE_DROPS, RESOURCE_LABELS } from '../config/constants.js';

export const chooseWeightedDrop = (dropsOrRandomValue = BASIC_RESOURCE_DROPS, maybeRandomValue = Math.random()) => {
  const drops = Array.isArray(dropsOrRandomValue) ? dropsOrRandomValue : BASIC_RESOURCE_DROPS;
  const randomValue = Array.isArray(dropsOrRandomValue) ? maybeRandomValue : dropsOrRandomValue;
  const totalWeight = drops.reduce((sum, drop) => sum + drop.weight, 0);
  let threshold = Math.min(Math.max(randomValue, 0), 0.999999) * totalWeight;

  for (const drop of drops) {
    if (threshold < drop.weight) {
      return drop;
    }
    threshold -= drop.weight;
  }

  return drops[drops.length - 1];
};

export class CrystalSystem {
  constructor(inventory, random = Math.random) {
    this.inventory = inventory;
    this.random = random;
    this.hitCounter = 0;
    this.lastMessage = 'Drücke E oder Leertaste am Kristall.';
  }

  use(dropTable = BASIC_RESOURCE_DROPS, messageFormatter = null) {
    this.hitCounter += 1;
    const drop = chooseWeightedDrop(dropTable, this.random());
    this.inventory.add(drop.resource, drop.amount);
    this.lastMessage = messageFormatter
      ? messageFormatter(drop)
      : `Kristall: +${drop.amount} ${RESOURCE_LABELS[drop.resource]}`;
    return drop;
  }
}
