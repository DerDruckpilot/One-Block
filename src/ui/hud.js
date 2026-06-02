import { RESOURCE_LABELS } from '../config/constants.js';

export class Hud {
  constructor(element) {
    this.element = element;
  }

  update({ inventory, hint }) {
    const resources = Object.entries(inventory)
      .filter(([, amount]) => amount > 0)
      .map(([resource, amount]) => `${RESOURCE_LABELS[resource] || resource}: ${amount}`)
      .join('<br>');

    this.element.innerHTML = `
      <div><strong>Rohstoffe:</strong><br>${resources || 'noch keine'}</div>
      <div><strong>Log:</strong> ${hint}</div>
    `;
  }
}
