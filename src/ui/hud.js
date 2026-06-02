import { RESOURCE_LABELS } from '../config/constants.js';

export class Hud {
  constructor(element) {
    this.element = element;
  }

  update({ selectedTool, inventory, hint }) {
    const resources = Object.entries(inventory)
      .filter(([, amount]) => amount > 0)
      .map(([resource, amount]) => `${RESOURCE_LABELS[resource] || resource}: ${amount}`)
      .join('<br>');

    this.element.innerHTML = `
      <div><strong>Aktiv:</strong> ${selectedTool}</div>
      <div><strong>Inventar:</strong><br>${resources || 'leer'}</div>
      <div><strong>Hinweis:</strong> ${hint}</div>
    `;
  }
}
