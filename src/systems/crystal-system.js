const FIST_DROPS = [
  { resource: 'earth', amount: 2, label: 'Erde' },
  { resource: 'rawWood', amount: 1, label: 'Rohholz' },
  { resource: 'fiber', amount: 1, label: 'Fasern' },
  { resource: 'seed', amount: 1, label: 'Samen' }
];

const WOOD_PICKAXE_DROPS = [
  { resource: 'stone', amount: 1, label: 'Stein' },
  { resource: 'clay', amount: 1, label: 'Lehm' },
  { resource: 'earth', amount: 1, label: 'Erde' }
];

export class CrystalSystem {
  constructor(inventory) {
    this.inventory = inventory;
    this.hitCounter = 0;
    this.lastMessage = 'Triff den Kristall mit Faust, Spitzhacke oder Speer.';
  }

  use(tool) {
    this.hitCounter += 1;

    if (tool === 'woodPickaxe') {
      this.applyDrop(WOOD_PICKAXE_DROPS, 'Holzspitzhacke');
      return;
    }

    if (tool === 'spear') {
      this.inventory.add('encounter', 1);
      this.lastMessage = 'Der Kristall reagiert: Begegnung vorbereitet.';
      return;
    }

    this.applyDrop(FIST_DROPS, 'Faust');
  }

  applyDrop(table, sourceLabel) {
    const drop = table[this.hitCounter % table.length];
    this.inventory.add(drop.resource, drop.amount);
    this.lastMessage = `${sourceLabel}: +${drop.amount} ${drop.label}`;
  }
}
