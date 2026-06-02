const BASIC_RESOURCE_DROPS = [
  { resource: 'earth', amount: 1, label: 'Erde' },
  { resource: 'rawWood', amount: 1, label: 'Rohholz' },
  { resource: 'fiber', amount: 1, label: 'Fasern' },
  { resource: 'grassSeed', amount: 1, label: 'Grassamen' }
];

export class CrystalSystem {
  constructor(inventory) {
    this.inventory = inventory;
    this.hitCounter = 0;
    this.lastMessage = 'Drücke E oder Leertaste am Kristall.';
  }

  use() {
    this.hitCounter += 1;
    const drop = BASIC_RESOURCE_DROPS[Math.floor(Math.random() * BASIC_RESOURCE_DROPS.length)];
    this.inventory.add(drop.resource, drop.amount);
    this.lastMessage = `Kristall: +${drop.amount} ${drop.label}`;
    return drop;
  }
}
